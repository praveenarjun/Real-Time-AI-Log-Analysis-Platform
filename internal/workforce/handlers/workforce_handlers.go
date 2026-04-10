package handlers

import (
	"net/http"
	"log/slog"

	"github.com/gin-gonic/gin"
	"praveenchalla.local/ai-log-analyzer/internal/workforce/repository"
)

type WorkforceHandlers struct {
	repo *repository.EmployeeRepository
}

func NewWorkforceHandlers(repo *repository.EmployeeRepository) *WorkforceHandlers {
	return &WorkforceHandlers{repo: repo}
}

// NewWorkforceHandler is an alias for NewWorkforceHandlers with logger support
func NewWorkforceHandler(repo *repository.EmployeeRepository, l *slog.Logger) *WorkforceHandlers {
	return &WorkforceHandlers{repo: repo}
}

func (h *WorkforceHandlers) ListEmployees(c *gin.Context) {
	employees, err := h.repo.GetAllEmployees(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, employees)
}

func (h *WorkforceHandlers) ListDepartments(c *gin.Context) {
	departments, err := h.repo.GetAllDepartments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, departments)
}

func (h *WorkforceHandlers) GetHeadcount(c *gin.Context) {
	headcounts, err := h.repo.GetDepartmentHeadcounts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, headcounts)
}

func (h *WorkforceHandlers) CreateEmployee(c *gin.Context)   {}
func (h *WorkforceHandlers) TrackAttendance(c *gin.Context) {}
func (h *WorkforceHandlers) GetDepartmentHeadcount(c *gin.Context) {
	h.GetHeadcount(c)
}
