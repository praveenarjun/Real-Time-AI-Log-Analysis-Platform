package handlers

import (
	"log/slog"

	"praveenchalla.local/ai-log-analyzer/internal/gateway/grpc_client"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/websocket"
	"praveenchalla.local/ai-log-analyzer/internal/repository"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"
	"github.com/redis/go-redis/v9"
)

type Handler struct {
	aiClient    *grpc_client.AIServiceClient
	redisClient *redis.Client
	wsManager   *websocket.Manager
	metrics     *metrics.Metrics
	logger      *slog.Logger
	repo        *repository.WorkforceRepository
	aiRepo      *repository.AIRepository
}

func NewHandler(
	aiClient *grpc_client.AIServiceClient,
	redisClient *redis.Client,
	wsManager *websocket.Manager,
	metrics *metrics.Metrics,
	logger *slog.Logger,
	repo *repository.WorkforceRepository,
	aiRepo *repository.AIRepository,
) *Handler {
	return &Handler{
		aiClient:    aiClient,
		redisClient: redisClient,
		wsManager:   wsManager,
		metrics:     metrics,
		logger:      logger,
		repo:        repo,
		aiRepo:      aiRepo,
	}
}
