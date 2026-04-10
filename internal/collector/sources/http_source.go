package sources

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"praveenchalla.local/ai-log-analyzer/internal/models"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"
)

type HttpSource struct {
	port   int
	server *http.Server
	output chan<- models.LogEntry
	logger *slog.Logger
}

func NewHttpSource(port int, logger *slog.Logger) *HttpSource {
	return &HttpSource{
		port:   port,
		logger: logger,
	}
}

func (h *HttpSource) Name() string {
	return "HTTP_SOURCE"
}

func (h *HttpSource) Start(ctx context.Context, output chan<- models.LogEntry) error {
	h.output = output
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "OK"})
	})

	// Log ingestion
	r.POST("/api/v1/ingest", h.handleIngest)
	r.POST("/api/v1/ingest/batch", h.handleBatchIngest)

	h.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", h.port),
		Handler: r,
	}

	go func() {
		h.logger.Info("HTTP Source starting", "port", h.port)
		if err := h.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			h.logger.Error("HTTP Server failed", "error", err)
		}
	}()

	return nil
}

func (h *HttpSource) Stop() error {
	if h.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return h.server.Shutdown(ctx)
	}
	return nil
}

func (h *HttpSource) handleIngest(c *gin.Context) {
	var entry models.LogEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.processEntry(&entry, c.Request.Context())
	c.Status(http.StatusAccepted)
}

func (h *HttpSource) handleBatchIngest(c *gin.Context) {
	var entries []models.LogEntry
	if err := c.ShouldBindJSON(&entries); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for i := range entries {
		h.processEntry(&entries[i], c.Request.Context())
	}
	c.Status(http.StatusAccepted)
}

func (h *HttpSource) processEntry(entry *models.LogEntry, ctx context.Context) {
	if entry.ID == "" {
		entry.ID = uuid.New().String()
	}
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}
	if entry.RequestID == "" {
		// Try to pull from logger context
		_ = logger.WithRequestID(ctx, h.logger)
	}

	h.output <- *entry
}
