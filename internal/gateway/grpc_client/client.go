package grpc_client

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"praveenchalla.local/ai-log-analyzer/internal/models"
	pb "praveenchalla.local/ai-log-analyzer/proto/generated"
)

type AIServiceClient struct {
	conn   *grpc.ClientConn
	client pb.AIAnalysisServiceClient
	logger *slog.Logger
}

func NewAIServiceClient(addr string, l *slog.Logger) (*AIServiceClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to AI service at %s: %v", addr, err)
	}

	return &AIServiceClient{
		conn:   conn,
		client: pb.NewAIAnalysisServiceClient(conn),
		logger: l,
	}, nil
}

func (c *AIServiceClient) Close() {
	if c.conn != nil {
		c.conn.Close()
	}
}

func (c *AIServiceClient) AnalyzeLogs(ctx context.Context, batch models.LogBatch) (*models.Anomaly, error) {
	// 1. Map models.LogBatch to pb.LogBatch
	protoBatch := &pb.LogBatch{
		BatchId:   batch.BatchID,
		Timestamp: batch.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
		Count:     int32(len(batch.Logs)),
		Logs:      make([]*pb.LogEntry, len(batch.Logs)),
	}

	for i, log := range batch.Logs {
		protoBatch.Logs[i] = &pb.LogEntry{
			Id:          log.ID,
			Timestamp:   log.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
			Source:      mapSource(log.Source),
			Level:       mapLevel(log.Level),
			Message:     log.Message,
			ServiceName: log.ServiceName,
			Host:        log.Host,
			Metadata:    log.Metadata,
			StackTrace:  log.StackTrace,
			RequestId:   log.RequestID,
		}
	}

	// 2. Call gRPC Service
	resp, err := c.client.AnalyzeLogs(ctx, protoBatch)
	if err != nil {
		return nil, fmt.Errorf("gRPC AnalyzeLogs failed: %v", err)
	}

	// 3. Map Response back to models.Anomaly
	if len(resp.Anomalies) == 0 {
		return nil, nil // No anomalies detected
	}

	// For now, we take the primary/first detected anomaly
	res := resp.Anomalies[0]
	return &models.Anomaly{
		ID:              res.Id,
		Type:            models.AnomalyType(res.Type.String()),
		Severity:        models.AnomalySeverity(res.Severity.String()),
		Description:     res.Description,
		RelatedLogIDs:   res.RelatedLogIds,
		RootCause:       res.RootCause,
		Recommendations: res.Recommendations,
		ConfidenceScore: res.ConfidenceScore,
		ServiceName:     res.ServiceName,
		DetectedAt:      time.Now(), // Default to now if not parsed
	}, nil
}

func (c *AIServiceClient) GenerateReport(ctx context.Context, start, end string) (*pb.IncidentReport, error) {
	req := &pb.ReportRequest{
		TimeRangeStart: start,
		TimeRangeEnd:   end,
	}
	return c.client.GenerateReport(ctx, req)
}

func (c *AIServiceClient) PredictFailures(ctx context.Context, service string) ([]*pb.Prediction, error) {
	req := &pb.PredictionRequest{
		ServiceName: service,
	}
	resp, err := c.client.PredictFailures(ctx, req)
	if err != nil {
		return nil, err
	}
	return resp.Predictions, nil
}

func (c *AIServiceClient) Chat(ctx context.Context, message string) (pb.AIAnalysisService_ChatAboutLogsClient, error) {
	req := &pb.ChatRequest{
		Message: message,
	}
	return c.client.ChatAboutLogs(ctx, req)
}

func (c *AIServiceClient) Health(ctx context.Context) (string, error) {
	resp, err := c.client.HealthCheck(ctx, &pb.HealthCheckRequest{})
	if err != nil {
		return "DOWN", err
	}
	return resp.Status, nil
}

// Helpers for mapping
func mapSource(s models.LogSource) pb.LogSource {
	switch s {
	case models.SourceApp:
		return pb.LogSource_APPLICATION
	case models.SourceDatabase:
		return pb.LogSource_DATABASE
	case models.SourceNetwork:
		return pb.LogSource_NETWORK
	case models.SourceServer:
		return pb.LogSource_SERVER
	case models.SourceSecurity:
		return pb.LogSource_SECURITY
	default:
		return pb.LogSource_APPLICATION
	}
}

func mapLevel(l models.LogLevel) pb.LogLevel {
	switch l {
	case models.LevelDebug:
		return pb.LogLevel_DEBUG
	case models.LevelInfo:
		return pb.LogLevel_INFO
	case models.LevelWarn:
		return pb.LogLevel_WARN
	case models.LevelError:
		return pb.LogLevel_ERROR
	case models.LevelFatal:
		return pb.LogLevel_FATAL
	default:
		return pb.LogLevel_INFO
	}
}
