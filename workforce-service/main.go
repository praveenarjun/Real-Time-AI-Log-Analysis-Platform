package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/workforce/handlers"
	"praveenchalla.local/ai-log-analyzer/internal/workforce/repository"
	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// 1. Load Config
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Initialize Logger
	logr := logger.NewLogger("workforce-service", "INFO")
	logr.Info("Configuration loaded successfully", "brokers", cfg.Kafka.Brokers)

	// 3. Initialize Metrics
	m := metrics.NewMetrics("workforce")
	_ = m // Ensure m is used if not fully integrated yet

	// 4. Initialize Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://user:pass@localhost:5432/workforce"
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		logr.Error("Failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// 5. Initialize Repository & Handlers
	repo := repository.NewWorkforceRepository(pool, logr)
	h := handlers.NewWorkforceHandler(repo, logr)

	// 6. Setup Gin Router
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	r.Use(gin.Recovery())

	// Routes
	api := r.Group("/api/v1/workforce")
	{
		api.POST("/employees", h.CreateEmployee)
		api.GET("/employees", h.ListEmployees)
		api.POST("/attendance", h.TrackAttendance)
		api.GET("/stats/headcount", h.GetDepartmentHeadcount)

		// Metrics
		api.GET("/metrics", metrics.MetricsHandler())
	}

	// 7. Start Server
	srv := &http.Server{
		Addr:    ":8082",
		Handler: r,
	}

	go func() {
		logr.Info("🚀 Workforce Service starting", "port", 8082)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logr.Error("Server failed", "error", err)
		}
	}()

	// 8. Graceful Shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigChan
	logr.Info("Shutting down Workforce Service...", "signal", sig)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	if err := srv.Shutdown(ctx); err != nil {
		logr.Error("Server forced shutdown", "error", err)
	}

	logr.Info("Workforce Service stopped gracefully")
}
