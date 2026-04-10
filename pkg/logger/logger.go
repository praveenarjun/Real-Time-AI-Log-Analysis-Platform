package logger

import (
	"context"
	"log/slog"
)

type contextKey string

const (
	RequestIDKey contextKey = "request_id"
)

func NewLogger(name string, level string) *slog.Logger {
	return slog.Default()
}

func WithRequestID(ctx context.Context, l *slog.Logger) *slog.Logger {
	if rid, ok := ctx.Value(RequestIDKey).(string); ok {
		return l.With("request_id", rid)
	}
	return l
}

func RequestIDContext(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, RequestIDKey, requestID)
}
