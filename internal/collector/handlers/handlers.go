package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"praveenchalla.local/ai-log-analyzer/internal/collector/buffer"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)

type IngestHandler struct {
	buffer *buffer.RingBuffer
	logger *slog.Logger
}

func NewIngestHandler(rb *buffer.RingBuffer, l *slog.Logger) *IngestHandler {
	return &IngestHandler{
		buffer: rb,
		logger: l,
	}
}

func (h *IngestHandler) Collect(c *gin.Context) {
	var entry models.LogEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.ensureID(&entry)
	
	batch := models.LogBatch{
		BatchID:   uuid.New().String(),
		Logs:      []models.LogEntry{entry},
		Timestamp: time.Now(),
		Count:     1,
	}

	h.buffer.Add(batch)
	c.JSON(http.StatusAccepted, gin.H{"status": "captured", "id": entry.ID})
}

func (h *IngestHandler) CollectBatch(c *gin.Context) {
	var entries []models.LogEntry
	if err := c.ShouldBindJSON(&entries); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for i := range entries {
		h.ensureID(&entries[i])
	}

	batch := models.LogBatch{
		BatchID:   uuid.New().String(),
		Logs:      entries,
		Timestamp: time.Now(),
		Count:     len(entries),
	}

	h.buffer.Add(batch)
	c.JSON(http.StatusAccepted, gin.H{"status": "batch_captured", "count": len(entries)})
}

func (h *IngestHandler) ensureID(entry *models.LogEntry) {
	if entry.ID == "" {
		entry.ID = uuid.New().String()
	}
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}
}
