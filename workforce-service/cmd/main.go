package main

import (
	"fmt"

	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/internal/database"
	"praveenchalla.local/ai-log-analyzer/internal/workforce/handlers"
	"praveenchalla.local/ai-log-analyzer/internal/workforce/repository"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Logger
	l := logger.NewLogger("workforce-service", "INFO")
	l.Info("Starting AI Log Analysis Workforce Service...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("CRITICAL: Failed to load configuration: %v", err)
	}

	// 3. Initialize Postgres Engine
	dbURL := cfg.Database.URL
	if dbURL == "" {
		dbURL = cfg.Database.DSN
	}
	db, err := database.NewPostgresDB(dbURL, l)
	if err != nil {
		log.Fatalf("CRITICAL: Postgres failed: %v", err)
	}
	defer db.Close()
	l.Info("Postgres Workforce database connected")

	// 4. Setup Repository & Handlers (Using new internal path)
	repo := repository.NewEmployeeRepository(db)
	h := handlers.NewWorkforceHandlers(repo)

	// 5. Setup Router
	router := gin.Default()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "READY", "db": "CONNECTED"})
	})

	api := router.Group("/api/v1/workforce")
	{
		api.GET("/employees", h.ListEmployees)
		api.GET("/departments", h.ListDepartments)
		api.GET("/headcount", h.GetHeadcount)
	}

	// 6. Graceful Shutdown
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Workforce.HTTPPort),
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("CRITICAL: Workforce Service failure: %v", err)
		}
	}()

	l.Info("Workforce Service listening", "port", cfg.Workforce.HTTPPort)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("Shutting down Workforce Service...")
	
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("CRITICAL: Server forced to shutdown: %v", err)
	}

	l.Info("Workforce Service exited cleanly")
}
