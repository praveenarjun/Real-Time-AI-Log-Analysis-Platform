package handlers

import (
		"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *Handler) SearchLogs(c *gin.Context) {
	query := c.Query("q")
	level := c.Query("level")
	service := c.Query("service")
	from := c.Query("from")
	to := c.Query("to")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	if h.esClient == nil {
		h.logger.Warn("Elasticsearch is disabled. Loki migration in progress.")
		c.JSON(http.StatusNotImplemented, gin.H{"message": "Log search via API is disabled. Please query Grafana Loki directly."})
		return
	}

	results, err := h.esClient.SearchLogs(c.Request.Context(), "logs", query, level, service, from, to, page, size)
	if err != nil {
		h.logger.Error("Elasticsearch search failed", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to query logs"})
		return
	}
	
	c.JSON(http.StatusOK, results)
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
