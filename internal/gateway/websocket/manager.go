package websocket

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

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
	clients   map[*websocket.Conn]bool
	broadcast chan models.RealTimeUpdate
	mu        sync.Mutex
	logger    *slog.Logger
	consumers map[string]*kafka.Consumer
}

func NewManager(l *slog.Logger) *Manager {
	return &Manager{
		clients:   make(map[*websocket.Conn]bool),
		broadcast: make(chan models.RealTimeUpdate, 1000),
		logger:    l,
		consumers: make(map[string]*kafka.Consumer),
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
	for {
		msg, err := consumer.ReadMessage(ctx)
		if err != nil {
			m.logger.Error("Kafka Consumer Error in WS Manager", "topic", topic, "error", err)
			time.Sleep(2 * time.Second)
			continue
		}

		var payload interface{}
		switch topicType {
		case models.UpdateLogBatch:
			var batch models.LogBatch
			if err := json.Unmarshal(msg.Value, &batch); err == nil {
				payload = batch
			}
		case models.UpdateAnomaly:
			var anomaly models.Anomaly
			if err := json.Unmarshal(msg.Value, &anomaly); err == nil {
				payload = anomaly
			}
		case models.UpdateIncidentReport:
			var report models.IncidentReport
			if err := json.Unmarshal(msg.Value, &report); err == nil {
				payload = report
			}
		}

		if payload != nil {
			m.broadcast <- models.RealTimeUpdate{
				Type:    topicType,
				Payload: payload,
			}
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
