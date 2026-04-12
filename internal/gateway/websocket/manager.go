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
	clients    map[*websocket.Conn]bool
	broadcast  chan models.LogBatch
	mu         sync.Mutex
	logger     *slog.Logger
	consumer   *kafka.Consumer
}

func NewManager(l *slog.Logger, consumer *kafka.Consumer) *Manager {
	return &Manager{
		clients:   make(map[*websocket.Conn]bool),
		broadcast: make(chan models.LogBatch, 100),
		logger:    l,
		consumer:  consumer,
	}
}

func (m *Manager) Run(ctx context.Context) {
	m.logger.Info("WebSocket Manager: Radio Station starting...")

	// 1. Start Kafka Listener Goroutine
	if m.consumer != nil {
		go m.consumeKafka(ctx)
	}

	// 2. Start Broadcaster Loop
	for {
		select {
		case batch := <-m.broadcast:
			m.mu.Lock()
			for client := range m.clients {
				err := client.WriteJSON(batch)
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

func (m *Manager) consumeKafka(ctx context.Context) {
	m.logger.Info("WebSocket Manager: Listening to Kafka raw-logs...")
	for {
		msg, err := m.consumer.ReadMessage(ctx)
		if err != nil {
			m.logger.Error("Kafka Consumer Error in WS Manager", "error", err)
			time.Sleep(2 * time.Second)
			continue
		}

		var batch models.LogBatch
		if err := json.Unmarshal(msg.Value, &batch); err != nil {
			m.logger.Error("Failed to unmarshal log batch from Kafka", "error", err)
			continue
		}

		// Push to broadcast channel
		m.broadcast <- batch
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

	m.logger.Info("New client connected to Live Log Stream", "remote_addr", conn.RemoteAddr().String())

	// Maintain connection (keep-alive)
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
