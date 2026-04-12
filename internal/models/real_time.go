package models

type UpdateType string

const (
	UpdateLogBatch       UpdateType = "LOG_BATCH"
	UpdateAnomaly        UpdateType = "ANOMALY"
	UpdateIncidentReport UpdateType = "INCIDENT_REPORT"
)

type RealTimeUpdate struct {
	Type    UpdateType  `json:"type"`
	Payload interface{} `json:"payload"`
}
