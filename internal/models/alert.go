package models

import "time"

type AlertChannel string

const (
	Slack    AlertChannel = "SLACK"
	Email    AlertChannel = "EMAIL"
	Webhook  AlertChannel = "WEBHOOK"
	Pager    AlertChannel = "PAGERDUTY"
)

type Alert struct {
	ID          string            `json:"id"`
	AnomalyID   string            `json:"anomaly_id"`
	Severity    AnomalySeverity   `json:"severity"`
	Title       string            `json:"title"`
	Message     string            `json:"message"`
	Channels    []AlertChannel    `json:"channels"`
	Metadata    map[string]string `json:"metadata"`
	Status      string            `json:"status"` // PENDING, SENT, FAILED
	CreatedAt   time.Time         `json:"created_at"`
	SentAt      *time.Time        `json:"sent_at,omitempty"`
}

func (a *Alert) AddChannel(channel AlertChannel) {
	for _, c := range a.Channels {
		if c == channel {
			return
		}
	}
	a.Channels = append(a.Channels, channel)
}
