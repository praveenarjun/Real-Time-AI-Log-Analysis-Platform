// Package generated provides a high-fidelity placeholder for gRPC code.
// This file EXACTLY matches the fields used in the Gateway client to silence IDE errors.
// Real gRPC code is generated autonomously during the Docker build process.
package generated

import (
	"context"
	"google.golang.org/grpc"
)

// --- ENUMS ---

type LogSource int32
const (
	LogSource_APPLICATION LogSource = 0
	LogSource_SERVER      LogSource = 1
	LogSource_NETWORK     LogSource = 2
	LogSource_DATABASE    LogSource = 3
	LogSource_SECURITY    LogSource = 4
)

type LogLevel int32
const (
	LogLevel_DEBUG LogLevel = 0
	LogLevel_INFO  LogLevel = 1
	LogLevel_WARN  LogLevel = 2
	LogLevel_ERROR LogLevel = 3
	LogLevel_FATAL LogLevel = 4
)

type AnomalyType int32
func (AnomalyType) String() string { return "" }

type Severity int32
func (Severity) String() string { return "" }

// --- MESSAGES ---

type LogEntry struct {
	Id          string
	Timestamp   string
	Source      LogSource
	Level       LogLevel
	Message     string
	ServiceName string
	Host        string
	Metadata    map[string]string
	StackTrace  string
	RequestId   string
}

type LogBatch struct {
	BatchId   string
	Logs      []*LogEntry
	Timestamp string
	Count     int32
}

type AnomalyResult struct {
	Id              string
	Type            AnomalyType
	Severity        Severity
	Description     string
	RelatedLogIds   []string
	RootCause       string
	Recommendations []string
	ConfidenceScore float32
	ServiceName     string
}

type AnalysisResponse struct {
	Anomalies []*AnomalyResult
}

type ReportRequest struct {
	TimeRangeStart string
	TimeRangeEnd   string
}

type IncidentReport struct {
	Id string
}

type PredictionRequest struct {
	ServiceName string
}

type Prediction struct{}

type PredictionResponse struct {
	Predictions []*Prediction
}

type ChatRequest struct {
	Message string
}

type ChatResponse struct {
	Content string
	IsFinal bool
}

type HealthCheckRequest struct{}
type HealthCheckResponse struct {
	Status string
}

// --- CLIENT INTERFACES ---

type AIAnalysisService_ChatAboutLogsClient interface {
	Recv() (*ChatResponse, error)
	grpc.ClientStream
}

type AIAnalysisServiceClient interface {
	AnalyzeLogs(ctx context.Context, in *LogBatch, opts ...grpc.CallOption) (*AnalysisResponse, error)
	GenerateReport(ctx context.Context, in *ReportRequest, opts ...grpc.CallOption) (*IncidentReport, error)
	PredictFailures(ctx context.Context, in *PredictionRequest, opts ...grpc.CallOption) (*PredictionResponse, error)
	ChatAboutLogs(ctx context.Context, in *ChatRequest, opts ...grpc.CallOption) (AIAnalysisService_ChatAboutLogsClient, error)
	HealthCheck(ctx context.Context, in *HealthCheckRequest, opts ...grpc.CallOption) (*HealthCheckResponse, error)
}

type aiAnalysisServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewAIAnalysisServiceClient(cc grpc.ClientConnInterface) AIAnalysisServiceClient {
	return &aiAnalysisServiceClient{cc}
}

func (c *aiAnalysisServiceClient) AnalyzeLogs(ctx context.Context, in *LogBatch, opts ...grpc.CallOption) (*AnalysisResponse, error) {
	return nil, nil
}

func (c *aiAnalysisServiceClient) GenerateReport(ctx context.Context, in *ReportRequest, opts ...grpc.CallOption) (*IncidentReport, error) {
	return nil, nil
}

func (c *aiAnalysisServiceClient) PredictFailures(ctx context.Context, in *PredictionRequest, opts ...grpc.CallOption) (*PredictionResponse, error) {
	return nil, nil
}

func (c *aiAnalysisServiceClient) ChatAboutLogs(ctx context.Context, in *ChatRequest, opts ...grpc.CallOption) (AIAnalysisService_ChatAboutLogsClient, error) {
	return nil, nil
}

func (c *aiAnalysisServiceClient) HealthCheck(ctx context.Context, in *HealthCheckRequest, opts ...grpc.CallOption) (*HealthCheckResponse, error) {
	return nil, nil
}
