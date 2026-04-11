package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Kafka         KafkaConfig         `yaml:"kafka"`
	Redis         RedisConfig         `yaml:"redis"`
	Collector     CollectorConfig     `yaml:"collector"`
	Gateway       GatewayConfig       `yaml:"gateway"`
	Alerter       AlerterConfig       `yaml:"alerter"`
	Metrics       MetricsConfig       `yaml:"metrics"`
	Database      DatabaseConfig      `yaml:"database"`
	Workforce     WorkforceConfig     `yaml:"workforce"`
}

type KafkaConfig struct {
	Brokers []string `yaml:"brokers"`
	User    string   `yaml:"user"`
	Pass    string   `yaml:"pass"`
	TLS      bool     `yaml:"tls"`
	CAPath   string   `yaml:"ca_path"`
	CertPath string   `yaml:"cert_path"`
	KeyPath  string   `yaml:"key_path"`
	Topics   struct {
		RawLogs         string `yaml:"raw_logs"`
		AnalyzedLogs    string `yaml:"analyzed_logs"`
		Anomalies       string `yaml:"anomalies"`
		Alerts          string `yaml:"alerts"`
		IncidentReports string `yaml:"incident_reports"`
	} `yaml:"topics"`
}


type RedisConfig struct {
	URL      string `yaml:"url"`
	Password string `yaml:"password"`
}

type CollectorConfig struct {
	HTTPPort      int `yaml:"http_port"`
	BatchSize     int `yaml:"batch_size"`
	FlushInterval int `yaml:"flush_interval"`
}

type GatewayConfig struct {
	HTTPPort      int    `yaml:"http_port"`
	AIServiceGRPC string `yaml:"ai_service_grpc"`
}

type AlerterConfig struct {
	SlackWebhook   string `yaml:"slack_webhook"`
	SMTPHost       string `yaml:"smtp_host"`
	SMTPServer     string
	SMTPPort       int
	SMTPUser       string
	SMTPPass       string
	FromEmail      string
	RecipientEmail string
}

type MetricsConfig struct {
	HTTPPort int `yaml:"http_port"`
}

func LoadConfig(path string) (*Config, error) {
	config := &Config{}

	// Defaults
	config.Kafka.Brokers = []string{"localhost:9092"}
	config.Kafka.Topics.RawLogs = "raw-logs"
	config.Kafka.Topics.AnalyzedLogs = "analyzed-logs"
	config.Kafka.Topics.Anomalies = "anomalies"
	config.Kafka.Topics.Alerts = "alerts"
	config.Kafka.Topics.IncidentReports = "incident-reports"
	config.Collector.HTTPPort = 8081
	config.Collector.BatchSize = 100
	config.Collector.FlushInterval = 5
	config.Gateway.HTTPPort = 8080
	config.Gateway.AIServiceGRPC = "localhost:50051"
	config.Workforce.HTTPPort = 8082

	// 1. Load from YAML if exists
	if _, err := os.Stat(path); err == nil {
		file, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		if err := yaml.Unmarshal(file, config); err != nil {
			return nil, fmt.Errorf("failed to unmarshal config: %w", err)
		}
	}

	// 2. Override with Environment Variables
	overrideWithEnv(config)

	return config, nil
}

func overrideWithEnv(cfg *Config) {
	if v := os.Getenv("KAFKA_BROKERS"); v != "" {
		cfg.Kafka.Brokers = strings.Split(v, ",")
	}
	if v := os.Getenv("KAFKA_USER"); v != "" {
		cfg.Kafka.User = v
	}
	if v := os.Getenv("KAFKA_PASS"); v != "" {
		cfg.Kafka.Pass = v
	}
	if v := os.Getenv("KAFKA_TLS"); v != "" {
		cfg.Kafka.TLS = strings.ToLower(v) == "true"
	}
	if v := os.Getenv("KAFKA_CA_PATH"); v != "" {
		cfg.Kafka.CAPath = v
	}
	if v := os.Getenv("KAFKA_CERT_PATH"); v != "" {
		cfg.Kafka.CertPath = v
	}
	if v := os.Getenv("KAFKA_KEY_PATH"); v != "" {
		cfg.Kafka.KeyPath = v
	}
	if v := os.Getenv("REDIS_URL"); v != "" {
		cfg.Redis.URL = v
	} else if v := os.Getenv("UPSTASH_REDIS_URL"); v != "" {
		cfg.Redis.URL = v
	}
	if v := os.Getenv("REDIS_PASS"); v != "" {
		cfg.Redis.Password = v
	}
	if v := os.Getenv("SLACK_WEBHOOK_URL"); v != "" {
		cfg.Alerter.SlackWebhook = v
	}
	if v := os.Getenv("AI_SERVICE_GRPC"); v != "" {
		cfg.Gateway.AIServiceGRPC = v
	}
	if v := os.Getenv("DATABASE_URL"); v != "" {
		cfg.Database.URL = v
	}
	if v := os.Getenv("COLLECTOR_HTTP_PORT"); v != "" {
		if p, err := strconv.Atoi(v); err == nil {
			cfg.Collector.HTTPPort = p
		}
	}
	if v := os.Getenv("BATCH_SIZE"); v != "" {
		if bs, err := strconv.Atoi(v); err == nil {
			cfg.Collector.BatchSize = bs
		}
	}
	if v := os.Getenv("FLUSH_INTERVAL"); v != "" {
		v = strings.TrimSuffix(v, "s")
		if fi, err := strconv.Atoi(v); err == nil {
			cfg.Collector.FlushInterval = fi
		}
	}
}

func (c *Config) Validate() error {
	if len(c.Kafka.Brokers) == 0 {
		return fmt.Errorf("kafka brokers are required")
	}
	return nil
}

type DatabaseConfig struct {
	URL string `yaml:"url"`
	DSN string `yaml:"dsn"`
}

type WorkforceConfig struct {
	HTTPPort int `yaml:"http_port"`
}
