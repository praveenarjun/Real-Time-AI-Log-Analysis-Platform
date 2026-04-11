import grpc
import logging
import asyncio
from concurrent import futures
import sys
import os
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Generate Command Reference ---
# python -m grpc_tools.protoc -I../go-services/proto --python_out=. --grpc_python_out=. ../go-services/proto/ai_analysis.proto

try:
    import ai_analysis_pb2
    import ai_analysis_pb2_grpc
except ImportError as e:
    logger = logging.getLogger("ai-service.grpc")
    logger.error(f"gRPC generated files import failed: {e}")
    raise e

logger = logging.getLogger("ai-service.grpc")

class AIAnalysisServiceServicer(ai_analysis_pb2_grpc.AIAnalysisServiceServicer):
    def __init__(self, supervisor):
        self.supervisor = supervisor

    def AnalyzeLogs(self, request, context):
        """Synchronous RPC to analyze a batch of logs."""
        logger.info(f"gRPC: Received AnalyzeLogs request with {len(request.logs)} entries")
        
        # 1. Convert Proto -> Dict
        log_batch = {
            "batch_id": request.batch_id,
            "logs": [self._proto_to_dict(l) for l in request.logs],
            "timestamp": request.timestamp
        }

        # 2. Run Supervisor (Sync)
        # In a real async prod environment, we'd use a dedicated loop
        result = self.supervisor.run(log_batch)

        # 3. Convert Dict -> Proto
        return ai_analysis_pb2.AnalysisResponse(
            batch_id=request.batch_id,
            has_anomalies=result.get("anomalies_detected", False),
            anomalies=[self._dict_to_anomaly_proto(a) for a in result.get("anomalies", [])],
            root_cause=result.get("root_cause", ""),
            report_summary=result.get("incident_report", {}).get("executive_summary", ""),
            risk_score=result.get("risk_score", 0.0)
        )

    def StreamAnalysis(self, request_iterator, context):
        """Streaming RPC for real-time log ingestion."""
        logger.info("gRPC: Started StreamAnalysis")
        for request in request_iterator:
            log_batch = {
                "logs": [self._proto_to_dict(l) for l in request.logs]
            }
            result = self.supervisor.run(log_batch)
            if result.get("anomalies_detected"):
                for a in result.get("anomalies", []):
                    yield self._dict_to_anomaly_proto(a)

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
            "metadata": dict(log_proto.metadata)
        }

    def _dict_to_anomaly_proto(self, a_dict):
        return ai_analysis_pb2.AnomalyResult(
            id=a_dict.get("id", ""),
            type=a_dict.get("type", "PATTERN_ANOMALY"),
            severity=a_dict.get("severity", "MEDIUM"),
            description=a_dict.get("description", ""),
            related_log_ids=a_dict.get("related_log_ids", []),
            root_cause=a_dict.get("root_cause", "")
        )

async def start_grpc_server(supervisor, port: int = 50051):
    """Starts the gRPC server in an async-friendly way."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    ai_analysis_pb2_grpc.add_AIAnalysisServiceServicer_to_server(
        AIAnalysisServiceServicer(supervisor), server
    )
    
    listen_addr = f'[::]:{port}'
    server.add_insecure_port(listen_addr)
    logger.info(f"gRPC server starting on {listen_addr}")
    
    await server.start()
    return server
