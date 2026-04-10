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

type SlackChannel struct {
	webhookURL string
	logger     *slog.Logger
	client     *http.Client
}

func NewSlackChannel(webhookURL string, logger *slog.Logger) *SlackChannel {
	return &SlackChannel{
		webhookURL: webhookURL,
		logger:     logger,
		client:     &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *SlackChannel) Name() string {
	return string(models.Slack)
}

func (s *SlackChannel) Send(ctx context.Context, alert models.Alert) error {
	color := "#FF0000" // Red for high
	if alert.Severity == models.SeverityLow {
		color = "#FFFF00" // Yellow
	}

	payload := map[string]interface{}{
		"attachments": []map[string]interface{}{
			{
				"color": color,
				"blocks": []map[string]interface{}{
					{
						"type": "header",
						"text": map[string]string{
							"type": "plain_text",
							"text": fmt.Sprintf("🚨 Alert: %s", alert.Title),
						},
					},
					{
						"type": "section",
						"fields": []map[string]string{
							{"type": "mrkdwn", "text": fmt.Sprintf("*Severity:* %s", alert.Severity)},
							{"type": "mrkdwn", "text": fmt.Sprintf("*Service:* %s", alert.Metadata["service"])},
						},
					},
					{
						"type": "section",
						"text": map[string]string{
							"type": "mrkdwn",
							"text": fmt.Sprintf("*Message:* %s", alert.Message),
						},
					},
					{
						"type": "divider",
					},
					{
						"type": "context",
						"elements": []map[string]string{
							{"type": "mrkdwn", "text": fmt.Sprintf("Detected At: %s", alert.CreatedAt.Format(time.RFC1123))},
						},
					},
				},
			},
		},
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	for i := 0; i < 3; i++ { // Retry 3 times
		req, _ := http.NewRequestWithContext(ctx, "POST", s.webhookURL, bytes.NewBuffer(data))
		req.Header.Set("Content-Type", "application/json")

		resp, err := s.client.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
			err = fmt.Errorf("slack returned status: %d", resp.StatusCode)
		}

		s.logger.Warn("Slack retry", "attempt", i+1, "error", err)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	return fmt.Errorf("failed to send slack alert after retries")
}
