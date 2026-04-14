package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) SearchLogs(c *gin.Context) {
	// Fetch real logs from Redis 'recent_logs' ring buffer
	rawLogs, err := h.redisClient.LRange(c.Request.Context(), "recent_logs", 0, 99).Result()
	if err != nil {
		h.logger.Error("Failed to fetch logs from Redis", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	logs := make([]interface{}, 0)
	for _, raw := range rawLogs {
		var logEntry interface{}
		if err := json.Unmarshal([]byte(raw), &logEntry); err == nil {
			logs = append(logs, logEntry)
		}
	}

	h.logger.Info("AI Dashboard served real-time forensic logs from persistence buffer", "count", len(logs))
	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": len(logs),
	})
}

func (h *Handler) GetLogByID(c *gin.Context) {
	id := c.Param("id")
	h.logger.Debug("Fetching log", "id", id)
	
	// Implementation would call ES get
	c.JSON(http.StatusOK, gin.H{"id": id, "message": "Log details"})
}

func (h *Handler) StreamLogs(c *gin.Context) {
	// This would typically involve a WebSocket connection or SSE.
	// We'll use the websocket manager we built.
	h.wsManager.HandleConnection(c)
}

func (h *Handler) GetLogStats(c *gin.Context) {
	h.logger.Info("Fetching log stats")
	c.JSON(http.StatusOK, gin.H{
		"levels": gin.H{"ERROR": 10, "INFO": 50},
		"sources": gin.H{"APPLICATION": 45, "SECURITY": 15},
	})
}
