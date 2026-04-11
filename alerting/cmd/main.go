package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"praveenchalla.local/ai-log-analyzer/internal/alerter/channels"
	"praveenchalla.local/ai-log-analyzer/internal/alerter/processor"
	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/internal/kafka"
	"github.com/redis/go-redis/v9"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"
)

func main() {
	// 1. Initialize Logger
	l := logger.NewLogger("alert-dispatcher", "INFO")
	l.Info("Starting AI Log Analysis Alerter...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("CRITICAL: Failed to load configuration: %v", err)
	}

	// 3. Initialize Infrastructure (Injecting logger into Kafka and Redis)
	rdb := redis.NewClient(&redis.Options{Addr: cfg.Redis.URL})
	l.Info("Redis Cache initialized for deduplication")

	// Kafka Consumer (NewConsumer(cfg.Kafka, topic, logger))
	consumer, err := kafka.NewConsumer(cfg.Kafka, cfg.Kafka.Topics.Anomalies, l)
	if err != nil {
		log.Fatalf("CRITICAL: Kafka Consumer failed: %v", err)
	}
	defer consumer.Close()
	l.Info("Alerter Mesh established", "topic", cfg.Kafka.Topics.Anomalies)

	// 4. Initialize Alert Channels (Slack & Email)
	slack := channels.NewSlackChannel(cfg.Alerter.SlackWebhook, l)
	
	// Email Channel (7 Arguments: host, port, user, pass, from, to, logger)
	email := channels.NewEmailChannel(
		cfg.Alerter.SMTPServer,
		cfg.Alerter.SMTPPort,
		cfg.Alerter.SMTPUser,
		cfg.Alerter.SMTPPass,
		cfg.Alerter.FromEmail,
		[]string{cfg.Alerter.RecipientEmail},
		l,
	)
	
	l.Info("Alerting channels configured", "slack", "enabled", "email", "enabled")

	// 5. Start Alert Processor
	p := processor.NewAlertProcessor(rdb, slack, email, l)
	
	ctx, cancel := context.WithCancel(context.Background())
	go p.Start(ctx, consumer)

	l.Info("Alert Dispatcher is monitoring for anomalies...")

	// 6. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("Shutting down Alerter...")
	cancel()
	
	l.Info("Alerter exited cleanly")
}
