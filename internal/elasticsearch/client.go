package elasticsearch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"praveenchalla.local/ai-log-analyzer/internal/models"
	"github.com/elastic/go-elasticsearch/v8"
)

type Client struct {
	es     *elasticsearch.Client
	logger *slog.Logger
}

func NewClient(url string, logger *slog.Logger) (*Client, error) {
	cfg := elasticsearch.Config{
		Addresses: []string{url},
	}
	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create elasticsearch client: %w", err)
	}

	// Verify connection
	res, err := es.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to elasticsearch: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("elasticsearch error: %s", res.Status())
	}

	return &Client{
		es:     es,
		logger: logger,
	}, nil
}

func (c *Client) IndexLog(ctx context.Context, index string, log models.LogEntry) error {
	return c.IndexDocument(ctx, index, log.ID, log)
}

func (c *Client) IndexDocument(ctx context.Context, index string, id string, doc interface{}) error {
	data, err := json.Marshal(doc)
	if err != nil {
		return err
	}

	res, err := c.es.Index(
		index,
		bytes.NewReader(data),
		c.es.Index.WithContext(ctx),
		c.es.Index.WithDocumentID(id),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("failed to index document: %s", res.Status())
	}

	return nil
}

func (c *Client) CreateIndexTemplate(ctx context.Context, name string, pattern string) error {
	template := fmt.Sprintf(`{
		"index_patterns": ["%s"],
		"template": {
			"mappings": {
				"properties": {
					"timestamp": { "type": "date" },
					"generated_at": { "type": "date" },
					"service_name": { "type": "keyword" },
					"target_department": { "type": "keyword" },
					"severity": { "type": "keyword" },
					"level": { "type": "keyword" },
					"source": { "type": "keyword" }
				}
			}
		}
	}`, pattern)

	res, err := c.es.Indices.PutIndexTemplate(
		name,
		strings.NewReader(template),
		c.es.Indices.PutIndexTemplate.WithContext(ctx),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("failed to create index template: %s", res.Status())
	}

	return nil
}

func (c *Client) SearchLogs(ctx context.Context, index string, query, level, service string, from, to string, page, size int) (map[string]interface{}, error) {
	// 1. Build Query
	bq := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must": []map[string]interface{}{},
			},
		},
		"from": (page - 1) * size,
		"size": size,
		"sort": []map[string]interface{}{
			{"timestamp": map[string]interface{}{"order": "desc"}},
		},
	}

	must := bq["query"].(map[string]interface{})["bool"].(map[string]interface{})["must"].([]map[string]interface{})

	if query != "" {
		must = append(must, map[string]interface{}{"match": map[string]interface{}{"message": query}})
	}
	if level != "" {
		must = append(must, map[string]interface{}{"term": map[string]interface{}{"level": level}})
	}
	if service != "" {
		must = append(must, map[string]interface{}{"term": map[string]interface{}{"service_name": service}})
	}

	bq["query"].(map[string]interface{})["bool"].(map[string]interface{})["must"] = must

	data, _ := json.Marshal(bq)
	res, err := c.es.Search(
		c.es.Search.WithContext(ctx),
		c.es.Search.WithIndex(index),
		c.es.Search.WithIgnoreUnavailable(true),
		c.es.Search.WithBody(strings.NewReader(string(data))),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *Client) GetAggregationStats(ctx context.Context, index string) (*DashboardStats, error) {
	// Aggr for total count and anomaly counts
	aggrQuery := `{
		"size": 0,
		"aggs": {
			"total_logs": { "value_count": { "field": "id" } },
			"error_count": { "filter": { "term": { "level": "ERROR" } } },
			"anomalies": { "filter": { "range": { "severity": { "gte": 0.7 } } } }
		}
	}`

	res, err := c.es.Search(
		c.es.Search.WithContext(ctx),
		c.es.Search.WithIndex(index),
		c.es.Search.WithBody(strings.NewReader(aggrQuery)),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(res.Body).Decode(&result)
	
	aggs := result["aggregations"].(map[string]interface{})
	
	return &DashboardStats{
		TotalLogs:      int64(aggs["total_logs"].(map[string]interface{})["value"].(float64)),
		TotalAnomalies: int64(aggs["anomalies"].(map[string]interface{})["doc_count"].(float64)),
		CriticalAlerts: int64(aggs["error_count"].(map[string]interface{})["doc_count"].(float64)),
		SystemHealthScore: 100.0, // Placeholder score
	}, nil
}

func (c *Client) PingHealth(ctx context.Context) error {
	res, err := c.es.Ping(c.es.Ping.WithContext(ctx))
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		return fmt.Errorf("ES health check failed: %s", res.Status())
	}
	return nil
}

type DashboardStats struct {
	TotalLogs         int64   `json:"total_logs"`
	TotalAnomalies    int64   `json:"total_anomalies"`
	CriticalAlerts    int64   `json:"critical_alerts"`
	SystemHealthScore float64 `json:"system_health_score"`
}
