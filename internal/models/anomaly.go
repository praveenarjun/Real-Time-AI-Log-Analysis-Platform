package models

import "time"

type AnomalySeverity string

const (
	SeverityLow      AnomalySeverity = "LOW"
	SeverityMedium   AnomalySeverity = "MEDIUM"
	SeverityHigh     AnomalySeverity = "HIGH"
	SeverityCritical AnomalySeverity = "CRITICAL"
)

type AnomalyType string

const (
	TypeErrSpike     AnomalyType = "ERROR_SPIKE"
	TypeCascadeFail  AnomalyType = "CASCADE_FAILURE"
	TypePattern      AnomalyType = "PATTERN_ANOMALY"
	TypeResExhaust   AnomalyType = "RESOURCE_EXHAUSTION"
	TypeSecurity     AnomalyType = "SECURITY_THREAT"
)

type Anomaly struct {
	ID              string           `json:"id"`
	Type            AnomalyType      `json:"type"`
	Severity       AnomalySeverity  `json:"severity"`
	Description     string           `json:"description"`
	RelatedLogIDs   []string         `json:"related_log_ids"`
	RootCause       string           `json:"root_cause,omitempty"`
	Recommendations []string         `json:"recommendations,omitempty"`
	ConfidenceScore float32          `json:"confidence_score"`
	DetectedAt      time.Time        `json:"detected_at"`
	ServiceName     string           `json:"service_name"`
}

func (a *Anomaly) IsCritical() bool {
	return a.Severity == SeverityCritical || a.Severity == SeverityHigh
}
