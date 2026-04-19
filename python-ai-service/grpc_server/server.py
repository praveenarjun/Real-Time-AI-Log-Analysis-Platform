import grpc
import logging
from concurrent import futures
import sys
import os
import time
from typing import Dict, Any

from core.config import settings

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Generate Command Reference ---
# python -m grpc_tools.protoc -I../go-services/proto --python_out=. --grpc_python_out=. ../go-services/proto/ai_analysis.proto

try:
    import ai_service_pb2
    import ai_service_pb2_grpc
except ImportError as e:
    logger = logging.getLogger("ai-service.grpc")
    logger.error(f"gRPC generated files import failed: {e}")
    raise e

logger = logging.getLogger("ai-service.grpc")


class AIAnalysisServiceServicer(ai_service_pb2_grpc.AIAnalysisServiceServicer):
    def __init__(self, supervisor):
        self.supervisor = supervisor

    def AnalyzeLogs(self, request, context):
        """Synchronous RPC to analyze a batch of logs."""
        logger.info(
            f"gRPC: Received AnalyzeLogs request with {len(request.logs)} entries"
        )

        # 1. Convert Proto -> Dict
        log_batch = {
            "batch_id": request.batch_id,
            "logs": [self._proto_to_dict(log_item) for log_item in request.logs],
            "timestamp": request.timestamp,
        }

        # 2. Run Supervisor (Sync)
        # In a real async prod environment, we'd use a dedicated loop
        result = self.supervisor.run(log_batch)

        # 3. Convert Dict -> Proto
        return ai_service_pb2.AnalysisResponse(
            anomalies=[
                self._dict_to_anomaly_proto(a) for a in result.get("anomalies", [])
            ],
            summary=result.get("root_cause", ""),
            health_score=100.0 - (result.get("risk_score", 0.0) * 100.0),
            processing_time_ms=result.get("processing_time_ms", 0)
        )

    def StreamAnalysis(self, request_iterator, context):
        """Streaming RPC for real-time log ingestion."""
        logger.info("gRPC: Started StreamAnalysis")
        for request in request_iterator:
            log_batch = {
                "logs": [self._proto_to_dict(log_item) for log_item in request.logs]
            }
            result = self.supervisor.run(log_batch)
            if result.get("anomalies_detected"):
                for a in result.get("anomalies", []):
                    yield self._dict_to_anomaly_proto(a)

    def GenerateReport(self, request, context):
        """Generates a comprehensive incident report for a specific time range."""
        logger.info(f"gRPC: Generating report for range {request.time_range_start} to {request.time_range_end}")
        
        # In a real system, we'd fetch logs for this range. 
        # For the demo, we run the supervisor on the internal state.
        result = self.supervisor.run({"report_request": True})
        report = result.get("incident_report", {})
        
        return ai_service_pb2.IncidentReport(
            id=report.get("id", "REP-" + str(int(time.time()))),
            title=report.get("title", "Forensic Incident Report"),
            severity=ai_service_pb2.Severity.Value(report.get("severity", "MEDIUM")),
            executive_summary=report.get("executive_summary", "Summary not available."),
            root_cause_analysis=report.get("root_cause_analysis", "Investigating..."),
            affected_services=report.get("affected_services", []),
            risk_score=float(report.get("risk_score", 0.0)),
            generated_at=time.ctime()
        )

    def ChatAboutLogs(self, request, context):
        """Streaming chat interface with the AI Forensic Assistant."""
        logger.info(f"gRPC: Chat request received: {request.message}")
        
        # Simulated streaming response logic
        chunks = [
            f"Analyzing query: {request.message}...",
            "Checking forensic buffer for related telemetry...",
            "Cross-referencing with known failure patterns...",
            "Conclusion: The system shows regular pulse. No anomalies detected in the provided context."
        ]
        
        for chunk in chunks:
            time.sleep(0.2)
            yield ai_service_pb2.ChatResponse(content=chunk, is_final=(chunk == chunks[-1]))

    def PredictFailures(self, request, context):
        """Predicts potential future failures based on current log trends."""
        logger.info(f"gRPC: Predicting failures for service {request.service_name}")
        
        result = self.supervisor.run({"predict_only": True})
        preds = result.get("predictions", [])
        
        proto_preds = []
        for p in preds:
            proto_preds.append(ai_service_pb2.Prediction(
                service_name=request.service_name,
                failure_type=p.get("type", "Saturation"),
                probability=p.get("confidence", 0.5),
                recommendation=p.get("mitigation", "Monitor dashboard")
            ))
            
        return ai_service_pb2.PredictionResponse(predictions=proto_preds)

    def HealthCheck(self, request, context):
        """Standard health check for the AI service."""
        return ai_service_pb2.HealthCheckResponse(
            status="SERVING",
            details={"provider": settings.LLM_PROVIDER, "model": settings.LLM_MODEL}
        )

    # --- Helper Mappers ---

    def _proto_to_dict(self, log_proto) -> Dict[str, Any]:
        return {
            "id": log_proto.id,
            "timestamp": log_proto.timestamp,
            "source": log_proto.source,
            "level": log_proto.level,
            "message": log_proto.message,
            "service_name": log_proto.service_name,
            "host": log_proto.host,
            "request_id": log_proto.request_id,
            "metadata": dict(log_proto.metadata),
        }

    def _dict_to_anomaly_proto(self, a_dict):
        return ai_service_pb2.AnomalyResult(
            id=a_dict.get("id", ""),
            type=a_dict.get("type", "PATTERN_ANOMALY"),
            severity=a_dict.get("severity", "MEDIUM"),
            description=a_dict.get("description", ""),
            related_log_ids=a_dict.get("related_log_ids", []),
            root_cause=a_dict.get("root_cause", ""),
        )


async def start_grpc_server(supervisor, port: int = 50051):
    """Starts the gRPC server in an async-friendly way."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_service_pb2_grpc.add_AIAnalysisServiceServicer_to_server(
        AIAnalysisServiceServicer(supervisor), server
    )

    listen_addr = f"[::]:{port}"
    server.add_insecure_port(listen_addr)
    logger.info(f"gRPC server starting on {listen_addr}")

    await server.start()
    return server
