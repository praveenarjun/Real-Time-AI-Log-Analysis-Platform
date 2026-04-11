package main

import (
	"fmt"

	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/collector/buffer"
	"praveenchalla.local/ai-log-analyzer/internal/collector/handlers"
	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/internal/kafka"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Logger
	l := logger.NewLogger("log-collector", "INFO")
	l.Info("Starting AI Log Analysis Ingestion Engine...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("CRITICAL: Failed to load configuration: %v", err)
	}

	// 3. Initialize Metrics
	m := metrics.NewMetrics("log-collector")

	// 4. Initialize Kafka Producer (NewProducer(cfg.Kafka, logger, metrics))
	producer, err := kafka.NewProducer(cfg.Kafka, l, m)
	if err != nil {
		log.Fatalf("CRITICAL: Kafka Producer failed: %v", err)
	}
	defer producer.Close()
	l.Info("Kafka Ingestion Mesh initialized", "topic", cfg.Kafka.Topics.RawLogs)

	// 5. Initialize Ring Buffer Pool (NewRingBuffer(size))
	ringBuffer := buffer.NewRingBuffer(cfg.Collector.BatchSize)
	l.Info("Ring Buffer Pool initialized", "size", cfg.Collector.BatchSize)

	// 6. Background Flush Worker (Internal to cmd for now to match actual RingBuffer signature)
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		ticker := time.NewTicker(time.Duration(cfg.Collector.FlushInterval) * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if ringBuffer.Len() > 0 {
					if batch, ok := ringBuffer.Get(); ok {
						if err := producer.SendLogBatch(cfg.Kafka.Topics.RawLogs, batch); err != nil {
							l.Error("Failed to flush log batch to Kafka", "error", err)
						}
					}
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	// 7. Setup Ingestion Router
	router := gin.Default()
	h := handlers.NewIngestHandler(ringBuffer, l)
	
	// Legacy route
	router.POST("/logs", h.Collect)
	
	// API V1 routes
	api := router.Group("/api/v1")
	{
		api.POST("/ingest", h.Collect)
		api.POST("/ingest/batch", h.CollectBatch)
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ALIVE", "buffer_usage": ringBuffer.Len()})
	})

	// 8. Graceful Shutdown
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Collector.HTTPPort),
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("CRITICAL: HTTP Ingestor failure: %v", err)
		}
	}()

	l.Info("Log Collector listening", "port", cfg.Collector.HTTPPort)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("Flush triggered. Closing Ingestion Engine...")
	cancel()
	
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("CRITICAL: Server forced to shutdown: %v", err)
	}

	l.Info("Log Collector exited cleanly")
}
