// Package generated provides a placeholder for gRPC code.
// This file exists to satisfy the Go type-checker in the local IDE.
// Real gRPC types are generated autonomously during the Docker build process.
package generated

import (
	"context"
	"google.golang.org/grpc"
)

// AIAnalysisServiceClient is a placeholder to satisfy the Gateway handlers.
type AIAnalysisServiceClient interface {
	AnalyzeLogs(ctx context.Context, in *LogBatch, opts ...grpc.CallOption) (*AnalysisResponse, error)
	GenerateReport(ctx context.Context, in *ReportRequest, opts ...grpc.CallOption) (*IncidentReport, error)
	PredictFailures(ctx context.Context, in *PredictionRequest, opts ...grpc.CallOption) (*PredictionResponse, error)
	HealthCheck(ctx context.Context, in *HealthCheckRequest, opts ...grpc.CallOption) (*HealthCheckResponse, error)
}

func NewAIAnalysisServiceClient(cc grpc.ClientConnInterface) AIAnalysisServiceClient {
	return nil
}

// Stubs for missing types
type LogBatch struct{}
type AnalysisResponse struct{ Anomalies []*AnomalyResult }
type AnomalyResult struct{ Id string }
type ReportRequest struct{ TimeRangeStart, TimeRangeEnd string }
type IncidentReport struct{ Id string }
type PredictionRequest struct{ ServiceName string }
type PredictionResponse struct{ Predictions []*Prediction }
type Prediction struct{}
type HealthCheckRequest struct{}
type HealthCheckResponse struct{ Status string }

// Service stream stubs
type AIAnalysisService_ChatAboutLogsClient interface{}
