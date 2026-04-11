package internal

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/redis/go-redis/v9"
)

type AlertChannel interface {
	Name() string
	Send(ctx context.Context, alert models.Alert) error
}

type Alerter struct {
	channels    map[string]AlertChannel
	redis       *redis.Client
	logger      *slog.Logger
	mu          sync.RWMutex
}

func NewAlerter(rdb *redis.Client, logger *slog.Logger) *Alerter {
	return &Alerter{
		channels: make(map[string]AlertChannel),
		redis:    rdb,
		logger:   logger,
	}
}

func (a *Alerter) RegisterChannel(ch AlertChannel) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.channels[ch.Name()] = ch
}

func (a *Alerter) ProcessAlert(ctx context.Context, alert models.Alert) error {
	// 1. Deduplication (hash anomaly ID + title)
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(alert.AnomalyID+alert.Title)))
	dedupKey := fmt.Sprintf("alert_dedup:%s", hash)

	set, err := a.redis.Set(ctx, dedupKey, "true", 5*time.Minute).Result()
	if err != nil && err != redis.Nil {
		a.logger.Error("Redis deduplication check failed", "error", err)
	} else if err == redis.Nil || set == "" {
		a.logger.Info("Alert suppressed due to deduplication", "anomaly_id", alert.AnomalyID)
		return nil
	}

	// 2. Dispatch concurrently
	var wg sync.WaitGroup
	for _, channelName := range alert.Channels {
		a.mu.RLock()
		channel, exists := a.channels[string(channelName)]
		a.mu.RUnlock()

		if !exists {
			a.logger.Warn("Alert channel not registered", "channel", channelName)
			continue
		}

		wg.Add(1)
		go func(ch AlertChannel, al models.Alert) {
			defer wg.Done()
			
			// Rate limiting check
			rateKey := fmt.Sprintf("alert_rate:%s:%s", ch.Name(), al.Title)
			count, _ := a.redis.Incr(ctx, rateKey).Result()
			if count == 1 {
				a.redis.Expire(ctx, rateKey, time.Minute)
			}
			if count > 10 { // Max 10 per minute per unique alert
				a.logger.Warn("Rate limit exceeded for channel", "channel", ch.Name(), "alert", al.Title)
				return
			}

			if err := ch.Send(ctx, al); err != nil {
				a.logger.Error("Failed to send alert", "channel", ch.Name(), "error", err)
			} else {
				a.logger.Info("Alert sent successfully", "channel", ch.Name(), "anomaly_id", al.AnomalyID)
			}
		}(channel, alert)
	}

	wg.Wait()

	// Alert persisting to Elasticsearch is decommissioned.
	a.logger.Debug("Alert persistent logging skipped (ES removed)", "anomaly_id", alert.AnomalyID)

	return err
}

func (a *Alerter) HandleKafkaMessage(msg []byte) error {
	var alert models.Alert
	if err := json.Unmarshal(msg, &alert); err != nil {
		return fmt.Errorf("failed to unmarshal alert: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return a.ProcessAlert(ctx, alert)
}
