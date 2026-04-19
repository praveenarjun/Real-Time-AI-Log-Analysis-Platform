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
	l.Info("Starting AI Log Analysis API Gateway...")

	// 2. Load Configuration
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("CRITICAL: Failed to load configuration: %v", err)
	}

	// 3. Initialize Metrics
	m := metrics.NewMetrics("api-gateway")

	// 4. Shared State for Async Readiness
	var (
		isReady       atomic.Bool
		h             *handlers.Handler
		rdb           *redis.Client
		workforceRepo *repository.WorkforceRepository
		aiRepo        *repository.AIRepository
		aiClient      *grpc_client.AIServiceClient
		wsManager     *websocket.Manager
	)

	// 5. Initialize Redis (Required for Rate Limiting & WebSockets)
	redisAddr := cfg.Redis.URL
	redisHost := ""
	if u, err := url.Parse(cfg.Redis.URL); err == nil && u.Host != "" {
		redisAddr = u.Host
		if h, _, err := net.SplitHostPort(u.Host); err == nil {
			redisHost = h
		} else {
			redisHost = u.Host
		}
	} else {
		if h, _, err := net.SplitHostPort(cfg.Redis.URL); err == nil {
			redisHost = h
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
		l.Info("Enabling TLS for Redis connection...", "server_name", redisHost)
		redisOpts.TLSConfig = &tls.Config{ServerName: redisHost}
	}

	rdb = redis.NewClient(redisOpts)

	// 6. Background Initialization (Non-blocking)
	go func() {
		l.Info("Background initialization started...")

		// A. Database Connection
		dbURL := cfg.Database.DSN
		if envURL := os.Getenv("DATABASE_URL"); envURL != "" && !strings.Contains(envURL, "PLACEHOLDER") {
			dbURL = envURL
		}
		if dbURL != "" {
			if strings.Contains(dbURL, "db.ivljtbrvvhfrkauxxojn.supabase.co") {
				dbURL = strings.ReplaceAll(dbURL, "db.ivljtbrvvhfrkauxxojn.supabase.co", "aws-1-ap-northeast-2.pooler.supabase.com")
				dbURL = strings.ReplaceAll(dbURL, ":5432", ":6543")
				if strings.Contains(dbURL, "user=postgres ") || strings.Contains(dbURL, "://postgres:") {
					dbURL = strings.ReplaceAll(dbURL, "user=postgres", "user=postgres.ivljtbrvvhfrkauxxojn")
					dbURL = strings.ReplaceAll(dbURL, "://postgres:", "://postgres.ivljtbrvvhfrkauxxojn:")
				}
			}
			if strings.Contains(dbURL, "*") && !strings.Contains(dbURL, "%2A") {
				dbURL = strings.ReplaceAll(dbURL, "*", "%2A")
			}

			dbConfig, _ := pgxpool.ParseConfig(dbURL)
			if dbConfig != nil {
				dbConfig.ConnConfig.DialFunc = func(ctx context.Context, network, addr string) (net.Conn, error) {
					var d net.Dialer
					return d.DialContext(ctx, "tcp4", addr)
				}
				dbRetries := 30
				for dbRetries > 0 {
					pool, err := pgxpool.NewWithConfig(context.Background(), dbConfig)
					if err == nil {
						if err := pool.Ping(context.Background()); err == nil {
							l.Info("Connected to PostgreSQL (Workforce DB)")
							workforceRepo = repository.NewWorkforceRepository(pool, l)
							aiRepo = repository.NewAIRepository(pool, l)
							break
						}
						pool.Close()
					}
					dbRetries--
					l.Warn("Waiting for DB...", "retries_left", dbRetries)
					time.Sleep(2 * time.Second)
				}
			}
		}

		// B. gRPC Bridge
		grpcRetries := 30
		for grpcRetries > 0 {
			var gerr error
			aiClient, gerr = grpc_client.NewAIServiceClient(cfg.Gateway.AIServiceGRPC, l)
			if gerr == nil {
				l.Info("AI Service gRPC Bridge connected")
				break
			}
			grpcRetries--
			l.Warn("Waiting for AI Service...", "retries_left", grpcRetries)
			time.Sleep(2 * time.Second)
		}

		// C. WebSocket and Kafka
		wsManager = websocket.NewManager(rdb, aiRepo, l)
		wsCtx, _ := context.WithCancel(context.Background())
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
				wsManager.AddConsumer(wsCtx, t.Name, t.Type, consumer)
				l.Info("Tuned into Kafka", "topic", t.Name)
			}
		}
		go wsManager.Run(wsCtx)

		// D. Finalize Handlers
		h = handlers.NewHandler(aiClient, rdb, wsManager, m, l, workforceRepo, aiRepo)
		isReady.Store(true)
		l.Info("API Gateway fully operational (READY)")
	}()

	// 7. HTTP Server Setup (Immediate)
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	// Health Check (Responsive immediately)
	router.GET("/health", func(c *gin.Context) {
		status := "STARTING"
		if isReady.Load() {
			status = "UP"
		}
		c.JSON(http.StatusOK, gin.H{
			"status":    status,
			"timestamp": time.Now(),
		})
	})

	// Proxy Logic
	router.Any("/api/v1/ingest/*proxyPath", func(c *gin.Context) {
		target := "http://go-collector:8081"
		if os.Getenv("KUBERNETES_SERVICE_HOST") != "" {
			target = "http://go-collector.forensic-platform.svc.cluster.local"
		}
		remote, _ := url.Parse(target)
		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	// Platform Routes (Readiness Aware)
	api := router.Group("/api/v1")
	api.Use(middleware.RateLimitMiddleware(rdb, l))
	{
		// Wrap handlers to ensure they don't crash if h is nil
		readyCheck := func(c *gin.Context) bool {
			if !isReady.Load() || h == nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Platform initializing. Please wait."})
				return false
			}
			return true
		}

		api.GET("/logs", func(c *gin.Context) {
			if readyCheck(c) {
				h.SearchLogs(c)
			}
		})
		api.POST("/analyze", func(c *gin.Context) {
			if readyCheck(c) {
				h.ManualAnalysis(c)
			}
		})
		api.GET("/anomalies", func(c *gin.Context) {
			if readyCheck(c) {
				h.GetAnomalies(c)
			}
		})
		api.GET("/incidents/latest", func(c *gin.Context) {
			if readyCheck(c) {
				h.GetLatestIncident(c)
			}
		})
		api.GET("/ws/stream", func(c *gin.Context) {
			if readyCheck(c) {
				h.StreamLogs(c)
			}
		})
		api.GET("/stats", func(c *gin.Context) {
			if readyCheck(c) {
				h.GetDashboardStats(c)
			}
		})
		api.GET("/health", func(c *gin.Context) {
			if readyCheck(c) {
				h.GetSystemHealth(c)
			}
		})
		api.GET("/workforce/employees", func(c *gin.Context) {
			if readyCheck(c) {
				h.ListEmployees(c)
			}
		})
		api.POST("/workforce/employees", func(c *gin.Context) {
			if readyCheck(c) {
				h.CreateEmployee(c)
			}
		})
		api.GET("/workforce/headcount", func(c *gin.Context) {
			if readyCheck(c) {
				h.GetDepartmentHeadcount(c)
			}
		})
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Gateway.HTTPPort),
		Handler: router,
	}

	go func() {
		l.Info("API Gateway listening", "port", cfg.Gateway.HTTPPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("CRITICAL: Server failure: %v", err)
		}
	}()

	// 8. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("Shutting down Gateway...")
	ctxShut, cancelShut := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShut()

	if err := srv.Shutdown(ctxShut); err != nil {
		l.Error("CRITICAL: Server forced to shutdown", "error", err)
	}
	if aiClient != nil {
		aiClient.Close()
	}
	l.Info("API Gateway exited cleanly")
}
