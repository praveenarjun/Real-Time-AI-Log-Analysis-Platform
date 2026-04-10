package kafka

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"log/slog"
	"net"
	"os"
	"time"

	kafkaGo "github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/plain"
	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"
)

type Producer struct {
	writer *kafkaGo.Writer
	logger *slog.Logger
}

func NewProducer(cfg config.KafkaConfig, l *slog.Logger, m *metrics.Metrics) (*Producer, error) {
	writer := &kafkaGo.Writer{
		Addr:     kafkaGo.TCP(cfg.Brokers...),
		Balancer: &kafkaGo.LeastBytes{},
		Async:    false,
	}

	if cfg.TLS || cfg.User != "" {
		dialer := &kafkaGo.Dialer{
			Timeout:   10 * time.Second,
			DualStack: true,
		}
		if cfg.TLS {
			dialer.TLS = buildTLSConfig(cfg, l)
		}
		if cfg.User != "" {
			dialer.SASLMechanism = plain.Mechanism{
				Username: cfg.User,
				Password: cfg.Pass,
			}
		}
		writer.Transport = &kafkaGo.Transport{
			Dial: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return dialer.DialContext(ctx, network, addr)
			},
		}
	}

	return &Producer{writer: writer, logger: l}, nil
}

func (p *Producer) Close() {
	if err := p.writer.Close(); err != nil {
		p.logger.Error("Failed to close Kafka writer", "error", err)
	}
}

func (p *Producer) SendLogBatch(topic string, batch interface{}) error {
	if batch == nil {
		return nil
	}

	payload, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	err = p.writer.WriteMessages(context.Background(), kafkaGo.Message{
		Topic: topic,
		Value: payload,
	})
	
	if err != nil {
		p.logger.Error("Failed to write messages to Kafka", "error", err, "topic", topic)
		return err
	}

	p.logger.Debug("Successfully sent log batch to Kafka", "topic", topic)
	return nil
}

type Message struct {
	Value  []byte
	Offset int64
}

type Consumer struct {
	reader *kafkaGo.Reader
}

func NewConsumer(cfg config.KafkaConfig, topic string, l *slog.Logger) (*Consumer, error) {
	config := kafkaGo.ReaderConfig{
		Brokers: cfg.Brokers,
		Topic:   topic,
	}

	if cfg.TLS || cfg.User != "" {
		dialer := &kafkaGo.Dialer{
			Timeout:   10 * time.Second,
			DualStack: true,
		}
		if cfg.TLS {
			dialer.TLS = buildTLSConfig(cfg, l)
		}
		if cfg.User != "" {
			dialer.SASLMechanism = plain.Mechanism{
				Username: cfg.User,
				Password: cfg.Pass,
			}
		}
		config.Dialer = dialer
	}

	r := kafkaGo.NewReader(config)
	return &Consumer{reader: r}, nil
}

func NewGroupConsumer(cfg config.KafkaConfig, topic string, groupID string, l *slog.Logger) (*Consumer, error) {
	config := kafkaGo.ReaderConfig{
		Brokers: cfg.Brokers,
		Topic:   topic,
		GroupID: groupID,
	}

	if cfg.TLS || cfg.User != "" {
		dialer := &kafkaGo.Dialer{
			Timeout:   10 * time.Second,
			DualStack: true,
		}
		if cfg.TLS {
			dialer.TLS = buildTLSConfig(cfg, l)
		}
		if cfg.User != "" {
			dialer.SASLMechanism = plain.Mechanism{
				Username: cfg.User,
				Password: cfg.Pass,
			}
		}
		config.Dialer = dialer
	}

	r := kafkaGo.NewReader(config)
	return &Consumer{reader: r}, nil
}

func (c *Consumer) Close() {
	if err := c.reader.Close(); err != nil {
		// log error
	}
}

func (c *Consumer) ReadMessage(ctx context.Context) (Message, error) {
	m, err := c.reader.ReadMessage(ctx)
	if err != nil {
		return Message{}, err
	}
	return Message{Value: m.Value, Offset: m.Offset}, nil
}

func buildTLSConfig(cfg config.KafkaConfig, l *slog.Logger) *tls.Config {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
	}

	if cfg.CertPath != "" && cfg.KeyPath != "" {
		cert, err := tls.LoadX509KeyPair(cfg.CertPath, cfg.KeyPath)
		if err == nil {
			tlsConfig.Certificates = []tls.Certificate{cert}
		} else if l != nil {
			l.Error("Failed to load Kafka key pair", "error", err)
		}
	}

	if cfg.CAPath != "" {
		caCert, err := os.ReadFile(cfg.CAPath)
		if err == nil {
			caCertPool := x509.NewCertPool()
			caCertPool.AppendCertsFromPEM(caCert)
			tlsConfig.RootCAs = caCertPool
		} else if l != nil {
			l.Error("Failed to load Kafka CA cert", "error", err)
		}
	}

	return tlsConfig
}
