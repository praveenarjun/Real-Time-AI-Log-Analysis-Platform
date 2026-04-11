package internal

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/kafka"
	"praveenchalla.local/ai-log-analyzer/internal/models"
	"praveenchalla.local/ai-log-analyzer/internal/collector/buffer"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"
	"github.com/google/uuid"
)

type LogSource interface {
	Name() string
	Start(ctx context.Context, output chan<- models.LogEntry) error
	Stop() error
}

type Collector struct {
	sources   []LogSource
	producer  *kafka.Producer
	metrics   *metrics.Metrics
	logger    *slog.Logger
	logChan   chan models.LogEntry
	retryBuf  *buffer.RingBuffer
	batchSize int
	interval  time.Duration
	topic     string
}

func NewCollector(producer *kafka.Producer, m *metrics.Metrics, logger *slog.Logger, batchSize int, interval time.Duration, topic string) *Collector {
	return &Collector{
		sources:   make([]LogSource, 0),
		producer:  producer,
		metrics:   m,
		logger:    logger,
		logChan:   make(chan models.LogEntry, 1000),
		retryBuf:  buffer.NewRingBuffer(100),
		batchSize: batchSize,
		interval:  interval,
		topic:     topic,
	}
}

func (c *Collector) AddSource(src LogSource) {
	c.sources = append(c.sources, src)
}

func (c *Collector) Start(ctx context.Context) error {
	for _, src := range c.sources {
		if err := src.Start(ctx, c.logChan); err != nil {
			c.logger.Error("Failed to start source", "name", src.Name(), "error", err)
		}
	}

	go c.processBatchLoop(ctx)
	go c.retryLoop(ctx)

	return nil
}

func (c *Collector) Stop() error {
	for _, src := range c.sources {
		if err := src.Stop(); err != nil {
			c.logger.Error("Failed to stop source", "name", src.Name(), "error", err)
		}
	}
	return nil
}

func (c *Collector) processBatchLoop(ctx context.Context) {
	var mu sync.Mutex
	batch := make([]models.LogEntry, 0, c.batchSize)
	ticker := time.NewTicker(c.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			// Final flush
			mu.Lock()
			if len(batch) > 0 {
				c.flushBatch(batch)
			}
			mu.Unlock()
			return
		case log := <-c.logChan:
			mu.Lock()
			batch = append(batch, log)
			c.metrics.KafkaMessagesRecv.WithLabelValues("internal").Inc()
			if len(batch) >= c.batchSize {
				c.flushBatch(batch)
				batch = make([]models.LogEntry, 0, c.batchSize)
				ticker.Reset(c.interval)
			}
			mu.Unlock()
		case <-ticker.C:
			mu.Lock()
			if len(batch) > 0 {
				c.flushBatch(batch)
				batch = make([]models.LogEntry, 0, c.batchSize)
			}
			mu.Unlock()
		}
	}
}

func (c *Collector) flushBatch(logs []models.LogEntry) {
	batch := models.LogBatch{
		BatchID:   uuid.New().String(),
		Logs:      logs,
		Timestamp: time.Now(),
		Count:     len(logs),
	}

	if err := c.producer.SendLogBatch(c.topic, batch); err != nil {
		c.logger.Error("Failed to send batch to Kafka, storing in retry buffer", "error", err)
		c.retryBuf.Add(batch)
	} else {
		c.metrics.KafkaMessagesSent.WithLabelValues(c.topic).Inc()
	}
}

func (c *Collector) retryLoop(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if c.retryBuf.Len() > 0 {
				batch, ok := c.retryBuf.Get()
				if ok {
					if err := c.producer.SendLogBatch(c.topic, batch); err != nil {
						c.logger.Warn("Retry failed, returning to buffer", "error", err)
						c.retryBuf.Add(batch)
					}
				}
			}
		}
	}
}
