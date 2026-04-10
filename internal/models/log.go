package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type LogLevel string

const (
	LevelDebug LogLevel = "DEBUG"
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
	LevelFatal LogLevel = "FATAL"
)

type LogSource string

const (
	SourceApp      LogSource = "APPLICATION"
	SourceServer   LogSource = "SERVER"
	SourceNetwork  LogSource = "NETWORK"
	SourceDatabase LogSource = "DATABASE"
	SourceSecurity LogSource = "SECURITY"
)

type LogEntry struct {
	ID          string            `json:"id"`
	Timestamp   time.Time         `json:"timestamp"`
	Source      LogSource         `json:"source"`
	Level       LogLevel          `json:"level"`
	Message     string            `json:"message"`
	ServiceName string            `json:"service_name"`
	Host        string            `json:"host"`
	Metadata    map[string]string `json:"metadata"`
	StackTrace  string            `json:"stack_trace,omitempty"`
	RequestID   string            `json:"request_id,omitempty"`
}

type LogBatch struct {
	BatchID   string     `json:"batch_id"`
	Logs      []LogEntry `json:"logs"`
	Timestamp time.Time  `json:"timestamp"`
	Count     int        `json:"count"`
}

func NewLogEntry() LogEntry {
	return LogEntry{
		ID:        uuid.New().String(),
		Timestamp: time.Now(),
		Metadata:  make(map[string]string),
	}
}

func (l *LogEntry) Validate() error {
	if l.Message == "" {
		return fmt.Errorf("message is required")
	}
	if l.ServiceName == "" {
		return fmt.Errorf("service_name is required")
	}
	return nil
}
