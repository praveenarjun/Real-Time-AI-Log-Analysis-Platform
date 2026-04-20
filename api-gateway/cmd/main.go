package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/grpc_client"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/handlers"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/middleware"
	"praveenchalla.local/ai-log-analyzer/internal/gateway/websocket"
	"praveenchalla.local/ai-log-analyzer/internal/kafka"
	models "praveenchalla.local/ai-log-analyzer/internal/models"
	"praveenchalla.local/ai-log-analyzer/internal/repository"
	"praveenchalla.local/ai-log-analyzer/pkg/config"
	"praveenchalla.local/ai-log-analyzer/pkg/logger"
	"praveenchalla.local/ai-log-analyzer/pkg/metrics"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Logger
	l := logger.NewLogger("api-gateway", "INFO")
	l.Info("🚀 Booting AI Log Analysis Gateway...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("CRITICAL: Failed to load configuration: %v", err)
	}

	// 3. Initialize Metrics
	m := metrics.NewMetrics("api-gateway")

	// 4. Shared State and Lifecycle Management
	var (
		isReady       atomic.Bool
		h             *handlers.Handler
		rdb           *redis.Client
		workforceRepo *repository.WorkforceRepository
		aiRepo        *repository.AIRepository
		aiClient      *grpc_client.AIServiceClient
		wsManager     *websocket.Manager
	)

	// Central Lifecycle Context (Keeps WebSocket and Background handshakes alive)
	appCtx, appCancel := context.WithCancel(context.Background())
	defer appCancel()

	// 5. Initialize Redis (Required immediately for Middleware)
	redisAddr := cfg.Redis.URL
	redisHost := ""
	if u, err := url.Parse(cfg.Redis.URL); err == nil && u.Host != "" {
		redisAddr = u.Host
		if rHost, _, err := net.SplitHostPort(u.Host); err == nil {
			redisHost = rHost
		} else {
			redisHost = u.Host
		}
	} else {
		if rHost, _, err := net.SplitHostPort(cfg.Redis.URL); err == nil {
			redisHost = rHost
		} else {
			redisHost = cfg.Redis.URL
		}
	}

	useTLS := strings.HasPrefix(cfg.Redis.URL, "rediss://") || strings.ToLower(os.Getenv("REDIS_TLS")) == "true"
	redisOpts := &redis.Options{
		Addr:     redisAddr,
		Password: cfg.Redis.Password,
	}

	if useTLS {
		l.Info("🔒 Enabling TLS for Redis connection...", "server_name", redisHost)
		redisOpts.TLSConfig = &tls.Config{ServerName: redisHost}
	}

	rdb = redis.NewClient(redisOpts)

	// 6. Background Handshake Engine (Non-blocking)
	go func() {
		l.Info("⏳ Starting background connectivity handshake...")

		// A. Database Connection (Workforce DB)
		dbURL := cfg.Database.DSN
		if envURL := os.Getenv("DATABASE_URL"); envURL != "" && !strings.Contains(envURL, "PLACEHOLDER") {
			dbURL = envURL
		}
		if dbURL != "" {
			dbConfig, _ := pgxpool.ParseConfig(dbURL)
			if dbConfig != nil {
				dbConfig.ConnConfig.DialFunc = func(ctx context.Context, network, addr string) (net.Conn, error) {
					var d net.Dialer
					return d.DialContext(ctx, "tcp4", addr)
				}
				dbRetries := 60 // Increased for extreme CI lag
				for dbRetries > 0 {
					pool, err := pgxpool.NewWithConfig(appCtx, dbConfig)
					if err == nil {
						if err := pool.Ping(appCtx); err == nil {
							l.Info("✅ Database handshaked successfully")
							workforceRepo = repository.NewWorkforceRepository(pool, l)
							aiRepo = repository.NewAIRepository(pool, l)
							break
						}
						pool.Close()
					}
					dbRetries--
					l.Warn("⏳ DB unavailable, retrying...", "retries_left", dbRetries)
					time.Sleep(2 * time.Second)
				}
			}
		}

		// B. AI Service gRPC
		for {
			var gerr error
			aiClient, gerr = grpc_client.NewAIServiceClient(cfg.Gateway.AIServiceGRPC, l)
			if gerr == nil {
				l.Info("✅ AI Service gRPC bridge established")
				break
			}
			l.Warn("⏳ AI Service gRPC missing, retrying...", "target", cfg.Gateway.AIServiceGRPC)
			time.Sleep(5 * time.Second)
		}

		// C. Kafka Real-time Feed
		wsManager = websocket.NewManager(rdb, aiRepo, l)
		topics := []struct {
			Name string
			Type models.UpdateType
		}{
			{cfg.Kafka.Topics.RawLogs, models.UpdateLogBatch},
			{cfg.Kafka.Topics.Anomalies, models.UpdateAnomaly},
			{cfg.Kafka.Topics.IncidentReports, models.UpdateIncidentReport},
		}

		for _, t := range topics {
			consumer, err := kafka.NewConsumer(cfg.Kafka, t.Name, l)
			if err == nil {
				wsManager.AddConsumer(appCtx, t.Name, t.Type, consumer)
				l.Info("📡 Connected to Kafka stream", "topic", t.Name)
			}
		}
		go wsManager.Run(appCtx)

		// D. Activation (ONLY after critical components are non-nil)
		if aiClient != nil && rdb != nil && wsManager != nil {
			h = handlers.NewHandler(aiClient, rdb, wsManager, m, l, workforceRepo, aiRepo)
			isReady.Store(true)
			l.Info("⭐ API Gateway is fully optimized and READY")
		}
	}()

	// 7. Instant Health & Routing Setup
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	// Liveness/Readiness Probe
	router.GET("/health", func(c *gin.Context) {
		status := "STARTING"
		if isReady.Load() {
			status = "UP"
		}
		c.JSON(http.StatusOK, gin.H{
			"status":    status,
			"timestamp": time.Now(),
			"version":   "2.1.0-resilient",
		})
	})

	// Collector Ingest Proxy
	router.Any("/api/v1/ingest/*proxyPath", func(c *gin.Context) {
		target := "http://go-collector:8081/api/v1/ingest"
		if os.Getenv("KUBERNETES_SERVICE_HOST") != "" {
			target = "http://go-collector.forensic-platform.svc.cluster.local:80/api/v1/ingest"
		}
		remote, _ := url.Parse(target)
		proxy := httputil.NewSingleHostReverseProxy(remote)
		
		// Ensure the path is correctly appended to the target
		c.Request.URL.Path = strings.Replace(c.Request.URL.Path, "/api/v1/ingest", "", 1)
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// Forensic API Routes (Readiness Sensitive)
	api := router.Group("/api/v1")
	api.Use(middleware.RateLimitMiddleware(rdb, l))
	{
		readyCheck := func(c *gin.Context) bool {
			if !isReady.Load() || h == nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Handshaking with backend components. Please retry in 5s."})
				return false
			}
			return true
		}

		api.GET("/logs", func(c *gin.Context) { if readyCheck(c) { h.SearchLogs(c) } })
		api.POST("/analyze", func(c *gin.Context) { if readyCheck(c) { h.ManualAnalysis(c) } })
		api.GET("/anomalies", func(c *gin.Context) { if readyCheck(c) { h.GetAnomalies(c) } })
		api.GET("/incidents/latest", func(c *gin.Context) { if readyCheck(c) { h.GetLatestIncident(c) } })
		api.GET("/ws/stream", func(c *gin.Context) { if readyCheck(c) { h.StreamLogs(c) } })
		api.GET("/stats", func(c *gin.Context) { if readyCheck(c) { h.GetDashboardStats(c) } })
		api.GET("/workforce/employees", func(c *gin.Context) { if readyCheck(c) { h.ListEmployees(c) } })
		api.POST("/workforce/employees", func(c *gin.Context) { if readyCheck(c) { h.CreateEmployee(c) } })
		api.GET("/workforce/headcount", func(c *gin.Context) { if readyCheck(c) { h.GetDepartmentHeadcount(c) } })
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Gateway.HTTPPort),
		Handler: router,
	}

	go func() {
		l.Info("🕸️ HTTP Server started", "port", cfg.Gateway.HTTPPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("FATAL: HTTP Interface failure: %v", err)
		}
	}()

	// 8. Wait for OS termination signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("🛑 Orderly shutdown initiated...")
	appCancel() // Kill background workers and Handshake loop if still running

	ctxShut, cancelShut := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShut()

	if err := srv.Shutdown(ctxShut); err != nil {
		l.Error("WARN: Server forced to shutdown", "error", err)
	}
	if aiClient != nil {
		aiClient.Close()
	}
	l.Info("👋 API Gateway successfully shutdown")
}
