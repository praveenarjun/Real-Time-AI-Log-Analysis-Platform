package handlers

import (
	"net/http"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateEmployee(c *gin.Context) {
	var emp models.Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.CreateEmployee(c.Request.Context(), &emp); err != nil {
		h.logger.Error("Failed to create employee", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to save employee"})
		return
	}

	c.JSON(http.StatusCreated, emp)
}

func (h *Handler) ListEmployees(c *gin.Context) {
	employees, err := h.repo.ListEmployees(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to list employees", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}
	c.JSON(http.StatusOK, employees)
}

func (h *Handler) TrackAttendance(c *gin.Context) {
	var att models.Attendance
	if err := c.ShouldBindJSON(&att); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.RecordAttendance(c.Request.Context(), &att); err != nil {
		h.logger.Error("Failed to record attendance", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to record attendance"})
		return
	}

	c.JSON(http.StatusCreated, att)
}

func (h *Handler) GetDepartmentHeadcount(c *gin.Context) {
	stats, err := h.repo.GetDepartmentHeadcount(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to fetch department stats", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
