package models

import "time"

type TimelineEvent struct {
	Timestamp time.Time `json:"timestamp"`
	Event     string    `json:"event"`
	Service   string    `json:"service"`
}

type Recommendations struct {
	Immediate []string `json:"immediate"`
	ShortTerm []string `json:"short_term"`
	LongTerm  []string `json:"long_term"`
}

type ActionItem struct {
	Task         string    `json:"task"`
	Priority     string    `json:"priority"` // LOW, MEDIUM, HIGH, CRITICAL
	AssigneeRole string    `json:"assignee_role"`
	Deadline     time.Time `json:"deadline"`
}

type IncidentReport struct {
	ID                 string          `json:"id"`
	Title              string          `json:"title"`
	Severity          AnomalySeverity `json:"severity"`
	ExecutiveSummary  string          `json:"executive_summary"`
	Timeline          []TimelineEvent `json:"timeline"`
	RootCauseAnalysis string          `json:"root_cause_analysis"`
	ImpactAssessment  string          `json:"impact_assessment"`
	AffectedServices  []string        `json:"affected_services"`
	RiskScore         float32         `json:"risk_score"`
	Recommendations   Recommendations `json:"recommendations"`
	ActionItems       []ActionItem    `json:"action_items"`
	GeneratedAt       time.Time       `json:"generated_at"`
}

func (r *IncidentReport) AddEvent(service, msg string) {
	r.Timeline = append(r.Timeline, TimelineEvent{
		Timestamp: time.Now(),
		Service:   service,
		Event:     msg,
	})
}
