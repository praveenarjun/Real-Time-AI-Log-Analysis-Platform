package handlers

import (
	"net/http"
	"strconv"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	c.JSON(http.StatusOK, gin.H{"employees": employees})
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
	c.JSON(http.StatusOK, gin.H{"headcount": stats})
}

func (h *Handler) GetMonthlyAttendanceReport(c *gin.Context) {
	month, _ := strconv.Atoi(c.Query("month"))
	year, _ := strconv.Atoi(c.Query("year"))

	if month == 0 || year == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "month and year are required"})
		return
	}

	report, err := h.repo.GetMonthlyAttendanceReport(c.Request.Context(), month, year)
	if err != nil {
		h.logger.Error("Failed to fetch attendance report", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": report})
}

func (h *Handler) GetLeaveBalance(c *gin.Context) {
	employeeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid employee id"})
		return
	}
	year, _ := strconv.Atoi(c.Query("year"))
	if year == 0 {
		year = 2024
	}

	balance, err := h.repo.CalculateLeaveBalance(c.Request.Context(), employeeID, year)
	if err != nil {
		h.logger.Error("Failed to calculate leave balance", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"balance": balance})
}
