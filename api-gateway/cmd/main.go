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
	"strings"
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

	// 4. Initialize Infrastructure (Smart Redis Security)
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
		redisOpts.TLSConfig = &tls.Config{
			ServerName: redisHost,
		}
	} else {
		l.Info("Connecting to Redis via plain TCP (No TLS)...")
	}

	rdb := redis.NewClient(redisOpts)
	ctxPing, cancelPing := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelPing()
	if err := rdb.Ping(ctxPing).Err(); err != nil {
		l.Error("CRITICAL: Redis connection failed", "error", err)
	} else {
		l.Info("Connected to Redis Cache")
	}

	// 5. Database Connection
	dbURL := cfg.Database.DSN
	if envURL := os.Getenv("DATABASE_URL"); envURL != "" && !strings.Contains(envURL, "PLACEHOLDER") {
		dbURL = envURL
	}

	if dbURL != "" {
		if strings.Contains(dbURL, "db.ivljtbrvvhfrkauxxojn.supabase.co") {
			l.Warn("Self-healing: Detected Direct IPv6 host. Redirecting to IPv4 Pooler Tunnel...")
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
	}

	var pool *pgxpool.Pool
	if dbURL != "" {
		dbConfig, err := pgxpool.ParseConfig(dbURL)
		if err != nil {
			l.Error("CRITICAL: PostgreSQL config parsing failed", "error", err)
		} else {
			dbConfig.ConnConfig.DialFunc = func(ctx context.Context, network, addr string) (net.Conn, error) {
				var d net.Dialer
				return d.DialContext(ctx, "tcp4", addr)
			}

			dbRetries := 6
			for dbRetries > 0 {
				pool, err = pgxpool.NewWithConfig(context.Background(), dbConfig)
				if err == nil {
					ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
					if err := pool.Ping(ctx); err == nil {
						l.Info("Connected to PostgreSQL (Workforce DB)")
						cancel()
						break
					}
					cancel()
					pool.Close()
				}
				dbRetries--
				l.Warn("Waiting for Database to wake up...", "retries_left", dbRetries)
				time.Sleep(5 * time.Second)
			}
			if pool == nil {
				log.Fatalf("CRITICAL: Failed to connect to Database after multiple attempts")
			}
			defer pool.Close()
		}
	}

	workforceRepo := repository.NewWorkforceRepository(pool, l)
	aiRepo := repository.NewAIRepository(pool, l)

	// 6. gRPC Bridge
	var aiClient *grpc_client.AIServiceClient
	grpcRetries := 5
	for grpcRetries > 0 {
		aiClient, err = grpc_client.NewAIServiceClient(cfg.Gateway.AIServiceGRPC, l)
		if err == nil {
			break
		}
		grpcRetries--
		l.Warn("Failed to connect to AI Service gRPC (waiting for boot...)", "error", err, "retries_left", grpcRetries)
		if grpcRetries == 0 {
			log.Fatalf("CRITICAL: Failed to connect to AI Service gRPC: %v", err)
		}
		time.Sleep(5 * time.Second)
	}
	defer aiClient.Close()

	// 7. WebSocket and Kafka
	wsManager := websocket.NewManager(rdb, aiRepo, l)
	wsCtx, wsCancel := context.WithCancel(context.Background())
	defer wsCancel()

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
		if err != nil {
			l.Error("Failed to initialize consumer", "topic", t.Name, "error", err)
		} else {
			wsManager.AddConsumer(wsCtx, t.Name, t.Type, consumer)
			l.Info("Tuned into Kafka topic", "topic", t.Name)
		}
	}

	go wsManager.Run(wsCtx)

	// 8. Handlers and Router
	h := handlers.NewHandler(aiClient, rdb, wsManager, m, l, workforceRepo, aiRepo)
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	// Proxy
	router.Any("/api/v1/ingest/*proxyPath", func(c *gin.Context) {
		target := "http://go-collector:8081"
		if os.Getenv("KUBERNETES_SERVICE_HOST") != "" {
			target = "http://go-collector.forensic-platform.svc.cluster.local"
		}
		remote, _ := url.Parse(target)
		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.ServeHTTP(c.Writer, c.Request)
	})

	router.Use(middleware.RateLimitMiddleware(rdb, l))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "timestamp": time.Now()})
	})

	api := router.Group("/api/v1")
	{
		api.GET("/logs", h.SearchLogs)
		api.POST("/analyze", h.ManualAnalysis)
		api.GET("/anomalies", h.GetAnomalies)
		api.GET("/incidents/latest", h.GetLatestIncident)
		api.GET("/ws/stream", h.StreamLogs)
		api.GET("/stats", h.GetDashboardStats)
		api.GET("/health", h.GetSystemHealth)
		api.GET("/workforce/employees", h.ListEmployees)
		api.POST("/workforce/employees", h.CreateEmployee)
		api.GET("/workforce/headcount", h.GetDepartmentHeadcount)
	}

	// 9. Start Server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Gateway.HTTPPort),
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("CRITICAL: Server failure: %v", err)
		}
	}()

	l.Info("API Gateway is listening", "port", cfg.Gateway.HTTPPort)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	l.Info("Shutting down...")
	ctxShut, cancelShut := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShut()
	srv.Shutdown(ctxShut)
}
