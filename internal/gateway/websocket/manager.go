package websocket

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"praveenchalla.local/ai-log-analyzer/internal/kafka"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allowing all origins for development and Cloudflare flexibility
	},
}

type Manager struct {
	clients     map[*websocket.Conn]bool
	broadcast   chan models.RealTimeUpdate
	mu          sync.Mutex
	logger      *slog.Logger
	consumers   map[string]*kafka.Consumer
	redisClient *redis.Client
}

func NewManager(rdb *redis.Client, l *slog.Logger) *Manager {
	return &Manager{
		clients:     make(map[*websocket.Conn]bool),
		broadcast:   make(chan models.RealTimeUpdate, 1000),
		logger:      l,
		consumers:   make(map[string]*kafka.Consumer),
		redisClient: rdb,
	}
}

func (m *Manager) AddConsumer(ctx context.Context, topic string, topicType models.UpdateType, consumer *kafka.Consumer) {
	if consumer == nil {
		return
	}
	m.mu.Lock()
	m.consumers[topic] = consumer
	m.mu.Unlock()

	go m.consumeTopic(ctx, topic, topicType, consumer)
}

func (m *Manager) Run(ctx context.Context) {
	m.logger.Info("WebSocket Manager: Forensic Radio Station starting...")

	for {
		select {
		case update := <-m.broadcast:
			m.mu.Lock()
			for client := range m.clients {
				err := client.WriteJSON(update)
				if err != nil {
					m.logger.Error("WebSocket Broadcaster Error", "error", err)
					client.Close()
					delete(m.clients, client)
				}
			}
			m.mu.Unlock()
		case <-ctx.Done():
			m.logger.Info("WebSocket Manager: Shutting down")
			return
		}
	}
}

func (m *Manager) consumeTopic(ctx context.Context, topic string, topicType models.UpdateType, consumer *kafka.Consumer) {
	m.logger.Info("WebSocket Manager: Tuning into frequency", "topic", topic)
	backoff := 2 * time.Second
	maxBackoff := 30 * time.Second

	for {
		select {
		case <-ctx.Done():
			m.logger.Info("WebSocket Manager: Context cancelled, stopping consumer", "topic", topic)
			return
		default:
		}

		msg, err := consumer.ReadMessage(ctx)
		if err != nil {
			// Only log at WARN level to reduce noise, and use exponential backoff
			if ctx.Err() != nil {
				return // Context cancelled, exit cleanly
			}
			m.logger.Warn("Kafka consumer reconnecting", "topic", topic, "backoff", backoff.String())
			time.Sleep(backoff)
			if backoff < maxBackoff {
				backoff = backoff * 2
				if backoff > maxBackoff {
					backoff = maxBackoff
				}
			}
			continue
		}

		// Reset backoff on successful read
		backoff = 2 * time.Second

		var payload interface{}
		switch topicType {
		case models.UpdateLogBatch:
			var batch models.LogBatch
			if err := json.Unmarshal(msg.Value, &batch); err == nil {
				payload = batch
			} else {
				m.logger.Error("WebSocket Manager: LogBatch unmarshal failed", "error", err, "topic", topic)
			}
		case models.UpdateAnomaly:
			var anomaly models.Anomaly
			if err := json.Unmarshal(msg.Value, &anomaly); err == nil {
				payload = anomaly
			} else {
				m.logger.Error("WebSocket Manager: Anomaly unmarshal failed", "error", err, "topic", topic)
			}
		case models.UpdateIncidentReport:
			var report models.IncidentReport
			if err := json.Unmarshal(msg.Value, &report); err == nil {
				payload = report
			} else {
				m.logger.Error("WebSocket Manager: IncidentReport unmarshal failed", "error", err, "topic", topic)
			}
		}

		if payload != nil {
			m.logger.Debug("WebSocket Manager: Broadcasting update", "topic", topic, "type", topicType)

			// Persistence Layer: Store in Redis Ring Buffer (Bypassed if Quota Hit)
			if m.redisClient != nil {
				data, _ := json.Marshal(payload)
				key := "v2_recent_logs"
				if topicType == models.UpdateAnomaly {
					key = "v2_recent_anomalies"
				}

				pipe := m.redisClient.Pipeline()
				pipe.LPush(ctx, key, string(data))
				pipe.LTrim(ctx, key, 0, 999)
				// We execute the pipeline but ignore errors to prevent cloud quota from blocking the live stream
				_, _ = pipe.Exec(ctx)
			}

			m.broadcast <- models.RealTimeUpdate{
				Type:    topicType,
				Payload: payload,
			}
		} else {
			m.logger.Warn("WebSocket Manager: Received empty or invalid payload", "topic", topic)
		}
	}
}

func (m *Manager) HandleConnection(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		m.logger.Error("Failed to upgrade to WebSocket", "error", err)
		return
	}

	m.mu.Lock()
	m.clients[conn] = true
	m.mu.Unlock()

	m.logger.Info("New forensic investigator connected", "remote_addr", conn.RemoteAddr().String())

	go func() {
		defer func() {
			m.mu.Lock()
			delete(m.clients, conn)
			m.mu.Unlock()
			conn.Close()
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()
}
