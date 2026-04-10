import os

base_dir = "/Users/praveenchalla/Downloads/ai-log-analyzer"

files = {
    "internal/collector/buffer/buffer.go": """package buffer
type RingBuffer struct{}
func NewRingBuffer(size int) *RingBuffer { return &RingBuffer{} }
func (r *RingBuffer) Len() int { return 0 }
func (r *RingBuffer) Get() (interface{}, bool) { return nil, false }
""",

    "internal/collector/handlers/handlers.go": """package handlers
import ("github.com/gin-gonic/gin"; "praveenchalla.local/ai-log-analyzer/internal/collector/buffer")
type IngestHandler struct{}
func NewIngestHandler(rb *buffer.RingBuffer) *IngestHandler { return &IngestHandler{} }
func (h *IngestHandler) Collect(c *gin.Context) {}
""",

    "internal/config/config.go": """package config
type Config struct {
	Kafka struct { Brokers []string; RawLogsTopic string; AnomaliesTopic string }
	Collector struct { BufferSize int; FlushInterval int; Port string }
	Gateway struct { Port string }
	Redis struct { URL string }
	Alerts struct { SlackWebhook string; SMTPServer string; SMTPPort int; SMTPUser string; SMTPPass string; FromEmail string; RecipientEmail string }
	Elasticsearch struct { URL string }
	AIService struct { GRPCAddr string }
}
func LoadConfig(path string) (*Config, error) { return &Config{}, nil }
""",

    "internal/kafka/producer.go": """package kafka
import ("praveenchalla.local/ai-log-analyzer/pkg/logger"; "praveenchalla.local/ai-log-analyzer/pkg/metrics")
type Producer struct{}
func NewProducer(brokers []string, l *logger.Logger, m *metrics.Metrics) (*Producer, error) { return &Producer{}, nil }
func (p *Producer) Close() {}
func (p *Producer) SendLogBatch(topic string, batch interface{}) error { return nil }
""",

    "internal/kafka/consumer.go": """package kafka
import ("praveenchalla.local/ai-log-analyzer/pkg/logger")
type Consumer struct{}
func NewConsumer(brokers []string, topic string, l *logger.Logger) (*Consumer, error) { return &Consumer{}, nil }
func (c *Consumer) Close() {}
""",

    "pkg/logger/logger.go": """package logger
type Logger struct{}
func NewLogger(name string, level string) *Logger { return &Logger{} }
func (l *Logger) Info(msg string, args ...interface{}) {}
func (l *Logger) Error(msg string, args ...interface{}) {}
""",

    "pkg/metrics/metrics.go": """package metrics
type Metrics struct{}
func NewMetrics(name string) *Metrics { return &Metrics{} }
""",

    "internal/alerter/channels/channels.go": """package channels
import ("praveenchalla.local/ai-log-analyzer/pkg/logger")
type SlackChannel struct{}
func NewSlackChannel(webhook string, l *logger.Logger) *SlackChannel { return &SlackChannel{} }
type EmailChannel struct{}
func NewEmailChannel(server string, port int, user, pass, from string, to []string, l *logger.Logger) *EmailChannel { return &EmailChannel{} }
""",

    "internal/alerter/processor/processor.go": """package processor
import ("context"; "praveenchalla.local/ai-log-analyzer/pkg/logger"; "praveenchalla.local/ai-log-analyzer/internal/redis"; "praveenchalla.local/ai-log-analyzer/internal/alerter/channels"; "praveenchalla.local/ai-log-analyzer/internal/kafka")
type AlertProcessor struct{}
func NewAlertProcessor(rdb *redis.Client, slack *channels.SlackChannel, email *channels.EmailChannel, l *logger.Logger) *AlertProcessor { return &AlertProcessor{} }
func (p *AlertProcessor) Start(ctx context.Context, c *kafka.Consumer) {}
""",

    "internal/redis/redis.go": """package redis
type Client struct{}
func NewClient(url string) *Client { return &Client{} }
""",

    "internal/elasticsearch/elasticsearch.go": """package elasticsearch
import ("praveenchalla.local/ai-log-analyzer/pkg/logger")
type Client struct{}
func NewClient(url string, l *logger.Logger) (*Client, error) { return &Client{}, nil }
""",

    "internal/gateway/grpc_client/client.go": """package grpc_client
import ("praveenchalla.local/ai-log-analyzer/pkg/logger")
type AIServiceClient struct{}
func NewAIServiceClient(addr string, l *logger.Logger) (*AIServiceClient, error) { return &AIServiceClient{}, nil }
func (c *AIServiceClient) Close() {}
""",

    "internal/gateway/websocket/manager.go": """package websocket
import ("praveenchalla.local/ai-log-analyzer/pkg/logger")
type Manager struct{}
func NewManager(l *logger.Logger) *Manager { return &Manager{} }
func (m *Manager) Run() {}
""",

    "internal/gateway/handlers/handlers.go": """package handlers
import ("github.com/gin-gonic/gin"; "praveenchalla.local/ai-log-analyzer/pkg/logger"; "praveenchalla.local/ai-log-analyzer/pkg/metrics"; "praveenchalla.local/ai-log-analyzer/internal/gateway/grpc_client"; "praveenchalla.local/ai-log-analyzer/internal/elasticsearch"; "praveenchalla.local/ai-log-analyzer/internal/redis"; "praveenchalla.local/ai-log-analyzer/internal/gateway/websocket")
type Handler struct{}
func NewHandler(ai *grpc_client.AIServiceClient, es *elasticsearch.Client, rdb *redis.Client, ws *websocket.Manager, m *metrics.Metrics, l *logger.Logger) *Handler { return &Handler{} }
func (h *Handler) SearchLogs(c *gin.Context) {}
func (h *Handler) ManualAnalysis(c *gin.Context) {}
func (h *Handler) StreamLogs(c *gin.Context) {}
"""
}

for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)

print("Scaffolded minimal dependent pkgs!")
