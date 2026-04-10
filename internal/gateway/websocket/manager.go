package websocket
import (
	"log/slog"
	"github.com/gin-gonic/gin"
)
type Manager struct{}
func NewManager(l *slog.Logger) *Manager { return &Manager{} }
func (m *Manager) Run() {}
func (m *Manager) HandleConnection(c *gin.Context) {}
