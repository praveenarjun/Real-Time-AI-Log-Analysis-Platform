package metrics

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Metrics struct {
	HttpRequestsTotal    *prometheus.CounterVec
	HttpRequestDuration  *prometheus.HistogramVec
	KafkaMessagesSent    *prometheus.CounterVec
	KafkaMessagesRecv    *prometheus.CounterVec
	AnomalyDetections    *prometheus.CounterVec
}

func NewMetrics(namespace string) *Metrics {
	// Prometheus namespaces cannot contain hyphens
	namespace = strings.ReplaceAll(namespace, "-", "_")

	m := &Metrics{
		HttpRequestsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "http_requests_total",
				Help:      "Total number of HTTP requests.",
			},
			[]string{"method", "endpoint", "status"},
		),
		HttpRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: namespace,
				Name:      "http_request_duration_seconds",
				Help:      "Duration of HTTP requests.",
				Buckets:   prometheus.DefBuckets,
			},
			[]string{"method", "endpoint"},
		),
		KafkaMessagesSent: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "kafka_messages_sent_total",
				Help:      "Total number of Kafka messages sent.",
			},
			[]string{"topic"},
		),
		KafkaMessagesRecv: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "kafka_messages_received_total",
				Help:      "Total number of Kafka messages received.",
			},
			[]string{"topic"},
		),
		AnomalyDetections: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: namespace,
				Name:      "anomaly_detections_total",
				Help:      "Total number of anomalies detected.",
			},
			[]string{"severity", "type"},
		),
	}

	prometheus.MustRegister(
		m.HttpRequestsTotal,
		m.HttpRequestDuration,
		m.KafkaMessagesSent,
		m.KafkaMessagesRecv,
		m.AnomalyDetections,
	)

	return m
}

func (m *Metrics) GinMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}

		c.Next()

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())

		m.HttpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		m.HttpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
	}
}

func MetricsHandler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}
