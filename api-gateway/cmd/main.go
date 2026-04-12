package main

import (
	"fmt"
	"net"

	"context"
	"crypto/tls"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/grpc_client"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/handlers"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/middleware"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/websocket"
	"praveenchalla.local/ai-log-analyzer/internal/kafka"
	"praveenchalla.local/ai-log-analyzer/internal/repository"
	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Logger
	l := logger.NewLogger("api-gateway", "INFO")
	l.Info("Starting AI Log Analysis API Gateway...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("CRITICAL: Failed to load configuration: %v", err)
	}

	// 3. Initialize Metrics
	m := metrics.NewMetrics("api-gateway")

	// 4. Initialize Infrastructure

	// Extract hostname for TLS SNI (Required for Upstash/Managed Redis)
	redisHost := cfg.Redis.URL
	if h, _, err := net.SplitHostPort(cfg.Redis.URL); err == nil {
		redisHost = h
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.URL,
		Password: cfg.Redis.Password,
		TLSConfig: &tls.Config{
			ServerName: redisHost,
		},
	})

	ctx_ping, cancel_ping := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel_ping()
	if err := rdb.Ping(ctx_ping).Err(); err != nil {
		l.Error("CRITICAL: Redis connection failed", "error", err)
	} else {
		l.Info("Connected to Redis Cache (Protected with TLS)")
	}

	// 5. Initialize PostgreSQL for Workforce
	dbURL := os.Getenv("SUPABASE_DB_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		dbURL = "postgres://PLACEHOLDER_USER:PLACEHOLDER_PASS@postgres:5432/workforce_db"
	}
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		l.Error("PostgreSQL connection failed", "error", err)
	} else {
		defer pool.Close()
		l.Info("Connected to PostgreSQL (Workforce DB)")
	}

	workforceRepo := repository.NewWorkforceRepository(pool, l)

	// 6. Initialize gRPC Bridge
	aiClient, err := grpc_client.NewAIServiceClient(cfg.Gateway.AIServiceGRPC, l)
	if err != nil {
		log.Fatalf("CRITICAL: Failed to connect to AI Service gRPC: %v", err)
	}
	defer aiClient.Close()
	l.Info("gRPC Bridge established", "addr", cfg.Gateway.AIServiceGRPC)

	// 6. Initialize WebSocket Manager & Multichannel Kafka Bridge
	wsManager := websocket.NewManager(l)
	wsCtx, wsCancel := context.WithCancel(context.Background())
	defer wsCancel()

	// Tune into the three forensic frequencies
	logConsumer, _ := kafka.NewConsumer(cfg.Kafka, cfg.Kafka.Topics.RawLogs, l)
	wsManager.AddConsumer(wsCtx, cfg.Kafka.Topics.RawLogs, models.UpdateLogBatch, logConsumer)

	anomalyConsumer, _ := kafka.NewConsumer(cfg.Kafka, cfg.Kafka.Topics.Anomalies, l)
	wsManager.AddConsumer(wsCtx, cfg.Kafka.Topics.Anomalies, models.UpdateAnomaly, anomalyConsumer)

	reportConsumer, _ := kafka.NewConsumer(cfg.Kafka, cfg.Kafka.Topics.IncidentReports, l)
	wsManager.AddConsumer(wsCtx, cfg.Kafka.Topics.IncidentReports, models.UpdateIncidentReport, reportConsumer)

	go wsManager.Run(wsCtx)
	l.Info("WebSocket Forensic Radio Station initialized with Multichannel Bridge")

	// 8. Setup Handlers
	h := handlers.NewHandler(aiClient, rdb, wsManager, m, l, workforceRepo)

	// 8. Setup Gin Router
	router := gin.Default()
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware())

	// Apply Redis Rate Limiting Middleware
	router.Use(middleware.RateLimitMiddleware(rdb, l))

	// Health Check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "timestamp": time.Now()})
	})

	// API Routes
	api := router.Group("/api/v1")
	{
		api.GET("/logs", h.SearchLogs)
		api.POST("/analyze", h.ManualAnalysis)
		api.GET("/ws/stream", h.StreamLogs)

		// Dashboard & Stats
		api.GET("/stats", h.GetDashboardStats)
		api.GET("/health", h.GetSystemHealth)

		// Workforce
		api.GET("/workforce/employees", h.ListEmployees)
		api.POST("/workforce/employees", h.CreateEmployee)
		api.GET("/workforce/headcount", h.GetDepartmentHeadcount)
	}

	// 8.5 Ingestion Proxy Bridge
	// Routes /api/v1/ingest/* to the internal go-collector service
	router.Any("/api/v1/ingest/*proxyPath", func(c *gin.Context) {
		target := "http://go-collector.forensic-platform.svc.cluster.local"
		remote, err := url.Parse(target)
		if err != nil {
			l.Error("Failed to parse collector proxy target", "error", err)
			c.JSON(502, gin.H{"error": "Collector Gateway unavailable"})
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(remote)
		
		// Optional: Override Director to handle path rewriting if needed
		// In this case, the collector expects /api/v1/ingest/batch, which is what we receive
		
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// 9. Graceful Shutdown HTTP Server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Gateway.HTTPPort),
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("CRITICAL: HTTP Server failure: %v", err)
		}
	}()

	l.Info("API Gateway is listening", "port", cfg.Gateway.HTTPPort)

	// Wait for interrupt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("Shutting down API Gateway...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("CRITICAL: Server forced to shutdown: %v", err)
	}

	l.Info("API Gateway exited cleanly")
}
