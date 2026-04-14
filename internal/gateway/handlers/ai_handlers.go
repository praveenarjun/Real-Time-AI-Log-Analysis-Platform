package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)

func (h *Handler) AnalyzeLogs(c *gin.Context) {
	var req struct {
		From string `json:"from"`
		To   string `json:"to"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Fetch logs from ES
	// 2. Wrap them into a LogBatch
	batch := models.LogBatch{
		BatchID: "analysis-req",
		Logs:    []models.LogEntry{}, // Would be filled here
	}

	// 3. Call AI service via gRPC
	anomaly, err := h.aiClient.AnalyzeLogs(c.Request.Context(), batch)
	if err != nil {
		h.logger.Error("AI analysis failed", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": anomaly})
}

func (h *Handler) GetAnomalies(c *gin.Context) {
	h.logger.Info("Searching anomalies")
	c.JSON(http.StatusOK, gin.H{"anomalies": []interface{}{}})
}

func (h *Handler) GetAnomalyByID(c *gin.Param) {
	// Implementation would fetch from ES
}

func (h *Handler) GenerateReport(c *gin.Context) {
	h.logger.Info("Generating report")
	// gRPC call to GenerateReport
	c.JSON(http.StatusAccepted, gin.H{"message": "Report generation started"})
}

func (h *Handler) ChatWithAI(c *gin.Context) {
	// WebSocket connection for streaming chat
	h.wsManager.HandleConnection(c)
}

func (h *Handler) PredictFailures(c *gin.Context) {
	h.logger.Info("Predicting failures")
	c.JSON(http.StatusOK, gin.H{"predictions": []interface{}{}})
}

func (h *Handler) ManualAnalysis(c *gin.Context) {
	// For the Cloudflare/Pro-Level Demo, we trigger a manual forensic audit
	// of the recent log window captured in the buffer.
	h.logger.Info("Triggering Manual AI Forensic Audit from Redis buffer...")

	// 1. Fetch real logs from Redis 'recent_logs'
	rawLogs, err := h.redisClient.LRange(c.Request.Context(), "recent_logs", 0, 49).Result()
	if err != nil {
		h.logger.Error("Failed to fetch logs for AI analysis", "error", err)
	}

	logs := make([]models.LogEntry, 0)
	for _, raw := range rawLogs {
		var entry models.LogEntry
		if err := json.Unmarshal([]byte(raw), &entry); err == nil {
			logs = append(logs, entry)
		}
	}

	batch := models.LogBatch{
		BatchID:   "manual-audit-" + time.Now().Format("150405"),
		Timestamp: time.Now(),
		Logs:      logs,
	}

	result, err := h.aiClient.AnalyzeLogs(c.Request.Context(), batch)
	if err != nil {
		h.logger.Error("AI Analysis call failed", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI Service currently busy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "success",
		"analysis": result,
	})
}
