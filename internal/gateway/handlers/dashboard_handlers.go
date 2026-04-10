package handlers

import (
	"context"
	"encoding/json"
		"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetDashboardStats(c *gin.Context) {
	cacheKey := "dashboard_stats"
	
	// 1. Try Cache
	res, err := h.redisClient.Get(c.Request.Context(), cacheKey).Result()
	if err == nil {
		var stats interface{}
		if err := json.Unmarshal([]byte(res), &stats); err == nil {
			h.logger.Debug("Serving dashboard stats from cache")
			c.JSON(http.StatusOK, stats)
			return
		}
	}

	// 2. Fetch Fresh Stats from ES
	stats, err := h.esClient.GetAggregationStats(c.Request.Context(), "logs")
	if err != nil {
		h.logger.Error("Failed to fetch ES stats", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}

	// 3. Cache Result (10s)
	data, _ := json.Marshal(stats)
	h.redisClient.Set(c.Request.Context(), cacheKey, string(data), 10*time.Second)

	c.JSON(http.StatusOK, stats)
}

func (h *Handler) GetSystemHealth(c *gin.Context) {
	h.logger.Info("Checking system health")
	
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	health := gin.H{
		"api_gateway":   "UP",
		"elasticsearch": "UP",
		"redis":         "UP",
	}

	// ES Check
	if err := h.esClient.PingHealth(ctx); err != nil {
		health["elasticsearch"] = "DOWN"
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
