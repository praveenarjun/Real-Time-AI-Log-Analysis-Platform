package handlers

import (
		"net/http"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/gin-gonic/gin"
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
	c.JSON(200, gin.H{"status":"ok"})
}
