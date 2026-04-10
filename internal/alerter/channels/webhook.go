package channels

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"praveenchalla.local/ai-log-analyzer/internal/models"
)

type WebhookChannel struct {
	url     string
	headers map[string]string
	logger  *slog.Logger
	client  *http.Client
}

func NewWebhookChannel(url string, headers map[string]string, logger *slog.Logger) *WebhookChannel {
	return &WebhookChannel{
		url:     url,
		headers: headers,
		logger:  logger,
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

func (w *WebhookChannel) Name() string {
	return string(models.Webhook)
}

func (w *WebhookChannel) Send(ctx context.Context, alert models.Alert) error {
	data, err := json.Marshal(alert)
	if err != nil {
		return err
	}

	for i := 0; i < 3; i++ { // Retry 3 times
		req, err := http.NewRequestWithContext(ctx, "POST", w.url, bytes.NewBuffer(data))
		if err != nil {
			return err
		}

		req.Header.Set("Content-Type", "application/json")
		for k, v := range w.headers {
			req.Header.Set(k, v)
		}

		resp, err := w.client.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode < 400 {
				return nil
			}
			err = fmt.Errorf("webhook returned status: %d", resp.StatusCode)
		}

		w.logger.Warn("Webhook retry", "attempt", i+1, "error", err)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	return fmt.Errorf("failed to send webhook alert after retries")
}
