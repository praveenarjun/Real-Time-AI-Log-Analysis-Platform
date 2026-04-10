package grpc_client
import (
	"context"
	"log/slog"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)
type AIServiceClient struct{}
func NewAIServiceClient(addr string, l *slog.Logger) (*AIServiceClient, error) { return &AIServiceClient{}, nil }
func (c *AIServiceClient) Close() {}
func (c *AIServiceClient) AnalyzeLogs(ctx context.Context, batch models.LogBatch) (*models.Anomaly, error) {
	return &models.Anomaly{}, nil
}
