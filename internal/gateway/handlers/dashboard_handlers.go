package handlers

import (
	"context"
	"encoding/json"
		"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetDashboardStats(c *gin.Context) {
	// Calculate dynamic stats from Redis buffers
	totalLogs, _ := h.redisClient.LLen(c.Request.Context(), "recent_logs").Result()
	totalAnomalies, _ := h.redisClient.LLen(c.Request.Context(), "recent_anomalies").Result()

	// Hardcoded health for stability; could be linked to actual probe results
	healthScore := 100
	if totalAnomalies > 50 {
		healthScore = 85
	} else if totalAnomalies > 100 {
		healthScore = 60
	}

	stats := map[string]interface{}{
		"total_logs":      totalLogs,
		"total_anomalies": totalAnomalies,
		"critical_alerts": totalAnomalies / 2, // Heuristic for demo impact
		"health_score":    healthScore,
		"logsPerSec":      totalLogs / 10,     // Heuristic for dashboard flow
		"systemHealth":    healthScore,
		"storageUtil":     65,
	}

	h.logger.Info("Dashboard stats dynamically calculated from Redis buffers", "logs", totalLogs, "anomalies", totalAnomalies)
	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

func (h *Handler) GetSystemHealth(c *gin.Context) {
	h.logger.Info("Checking system health")
	
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	health := gin.H{
		"api_gateway":   "UP",
		"redis":         "UP",
		"observability": "LOKI/DATADOG",
	}

	// Redis Check
	if err := h.redisClient.Ping(ctx).Err(); err != nil {
		health["redis"] = "DOWN"
	}

	c.JSON(http.StatusOK, health)
}

func (h *Handler) GetTimeline(c *gin.Context) {
	h.logger.Info("Fetching event timeline")
	c.JSON(http.StatusOK, gin.H{
		"events": []interface{}{},
	})
}
