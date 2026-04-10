package handlers

import (
		"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetAlerts(c *gin.Context) {
	h.logger.Info("Fetching alerts")
	c.JSON(http.StatusOK, gin.H{
		"alerts": []interface{}{},
	})
}

func (h *Handler) ConfigureAlerts(c *gin.Context) {
	var alertConfig interface{}
	if err := c.ShouldBindJSON(&alertConfig); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.logger.Info("Configuring alerts", "config", alertConfig)
	c.JSON(http.StatusCreated, gin.H{"message": "Alert configuration saved"})
}
