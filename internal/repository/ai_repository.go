package repository

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"praveenchalla.local/ai-log-analyzer/internal/models"
)

type AIRepository struct {
	db     *pgxpool.Pool
	logger *slog.Logger
}

func NewAIRepository(db *pgxpool.Pool, logger *slog.Logger) *AIRepository {
	return &AIRepository{
		db:     db,
		logger: logger,
	}
}

// SaveAnomaly persists a detected anomaly to the database
func (r *AIRepository) SaveAnomaly(ctx context.Context, anomaly models.Anomaly) error {
	query := `
		INSERT INTO forensic_anomalies (
			type, severity, description, related_log_ids, root_cause, 
			recommendations, confidence_score, service_name, detected_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.Exec(ctx, query,
		anomaly.Type,
		anomaly.Severity,
		anomaly.Description,
		anomaly.RelatedLogIDs,
		anomaly.RootCause,
		anomaly.Recommendations,
		anomaly.ConfidenceScore,
		anomaly.ServiceName,
		time.Now(),
	)

	if err != nil {
		r.logger.Error("Failed to save anomaly to DB", "error", err)
		return err
	}
	return nil
}

// SaveIncident persists a full forensic incident report
func (r *AIRepository) SaveIncident(ctx context.Context, report models.IncidentReport) error {
	timelineJSON, _ := json.Marshal(report.Timeline)
	recommendationsJSON, _ := json.Marshal(report.Recommendations)
	actionItemsJSON, _ := json.Marshal(report.ActionItems)

	query := `
		INSERT INTO forensic_incidents (
			id, title, severity, executive_summary, timeline, 
			root_cause_analysis, impact_assessment, affected_services, 
			risk_score, recommendations, action_items, generated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			severity = EXCLUDED.severity,
			executive_summary = EXCLUDED.executive_summary,
			timeline = EXCLUDED.timeline,
			root_cause_analysis = EXCLUDED.root_cause_analysis,
			risk_score = EXCLUDED.risk_score`

	_, err := r.db.Exec(ctx, query,
		report.ID,
		report.Title,
		report.Severity,
		report.ExecutiveSummary,
		timelineJSON,
		report.RootCauseAnalysis,
		report.ImpactAssessment,
		report.AffectedServices,
		report.RiskScore,
		recommendationsJSON,
		actionItemsJSON,
		time.Now(),
	)

	if err != nil {
		r.logger.Error("Failed to save incident report to DB", "error", err)
		return err
	}
	return nil
}

// GetRecentAnomalies fetches the last X anomalies
func (r *AIRepository) GetRecentAnomalies(ctx context.Context, limit int) ([]models.Anomaly, error) {
	query := `
		SELECT id, type, severity, description, related_log_ids, root_cause, 
		       recommendations, confidence_score, service_name, detected_at 
		FROM forensic_anomalies 
		ORDER BY detected_at DESC 
		LIMIT $1`

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var anomalies []models.Anomaly
	for rows.Next() {
		var a models.Anomaly
		var id string // UUID as string
		err := rows.Scan(
			&id, &a.Type, &a.Severity, &a.Description, &a.RelatedLogIDs,
			&a.RootCause, &a.Recommendations, &a.ConfidenceScore,
			&a.ServiceName, &a.DetectedAt,
		)
		if err != nil {
			return nil, err
		}
		a.ID = id
		anomalies = append(anomalies, a)
	}
	return anomalies, nil
}

// GetLatestIncident fetches the most recent forensic report
func (r *AIRepository) GetLatestIncident(ctx context.Context) (*models.IncidentReport, error) {
	query := `
		SELECT id, title, severity, executive_summary, timeline, 
		       root_cause_analysis, impact_assessment, affected_services, 
		       risk_score, recommendations, action_items, generated_at 
		FROM forensic_incidents 
		ORDER BY generated_at DESC 
		LIMIT 1`

	var report models.IncidentReport
	var timelineRaw, recommendationsRaw, actionItemsRaw []byte

	err := r.db.QueryRow(ctx, query).Scan(
		&report.ID, &report.Title, &report.Severity, &report.ExecutiveSummary,
		&timelineRaw, &report.RootCauseAnalysis, &report.ImpactAssessment,
		&report.AffectedServices, &report.RiskScore, &recommendationsRaw,
		&actionItemsRaw, &report.GeneratedAt,
	)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(timelineRaw, &report.Timeline)
	json.Unmarshal(recommendationsRaw, &report.Recommendations)
	json.Unmarshal(actionItemsRaw, &report.ActionItems)

	return &report, nil
}
