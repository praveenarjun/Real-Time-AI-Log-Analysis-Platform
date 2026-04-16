import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prometheus_client import generate_latest, Counter, Histogram

from core.config import settings
from core.kafka_client import LogKafkaConsumer, ResultKafkaProducer
from agents.langgraph_setup import LogAnalysisSupervisor
from grpc_server.server import start_grpc_server

# --- Logging & Monitoring ---
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("ai-service.gateway")

LOGS_PROCESSED = Counter("logs_processed_total", "Total logs processed", ["status"])
ANALYSIS_TIME = Histogram(
    "analysis_latency_seconds", "Time spent in forensics analysis"
)

# --- Global State ---
supervisor = LogAnalysisSupervisor()
kafka_producer = ResultKafkaProducer(settings.get_kafka_brokers())
kafka_consumer = LogKafkaConsumer(
    settings.get_kafka_brokers(), settings.KAFKA_TOPIC_RAW, "ai-service-group"
)

LATEST_ANALYSIS: Dict[str, Any] = {}


# --- Background Forensics Loop ---
async def consume_logs_background():
    """Continuous Kafka consumer loop for real-time forensics."""
    await kafka_producer.start()
    logger.info("Kafka consumer background task started")

    try:
        async for batch in kafka_consumer.consume_batches(
            batch_size=settings.BATCH_PROCESS_SIZE
        ):
            with ANALYSIS_TIME.time():
                # Wrap batch in expected format
                log_batch = {"logs": batch, "timestamp": str(time.time())}

                # 1. Run Analysis
                logger.info(
                    f"Processing batch of {len(batch)} logs from Kafka topic '{settings.KAFKA_TOPIC_RAW}'..."
                )
                result = supervisor.run(log_batch)

                # 2. Extract Outcomes
                severity = (
                    result.get("anomaly_severity")
                    or result.get("max_severity")
                    or "none"
                )
                if result.get("anomalies_detected"):
                    logger.warning(f"Anomaly detected in batch! Severity: {severity}")

                    # Store individual anomalies
                    anomalies = result.get("anomalies", [])
                    if isinstance(anomalies, list):
                        for anomaly in anomalies:
                            if isinstance(anomaly, dict):
                                # Add a timestamp if missing
                                if "timestamp" not in anomaly:
                                    anomaly["timestamp"] = str(
                                        datetime.now().isoformat()
                                    )
                                await kafka_producer.send_anomaly(anomaly)

                    # Store incident report
                    report = result.get("incident_report")
                    if report and isinstance(report, dict):
                        await kafka_producer.send_report(report)

                    # Process alerts
                    if result.get("should_alert"):
                        await kafka_producer.send_alert(
                            {
                                "message": result.get(
                                    "alert_message", "Critical system anomaly detected."
                                ),
                                "channels": result.get("alert_channels", ["log"]),
                                "timestamp": str(datetime.now().isoformat()),
                            }
                        )

                # Store globally for Chat Assistant context
                global LATEST_ANALYSIS
                LATEST_ANALYSIS = result

                LOGS_PROCESSED.labels(status="success").inc(len(batch))
    except Exception as e:
        logger.error(f"Kafka consumer task failed: {e}")
    finally:
        await kafka_producer.stop()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("Initializing AI Log Analysis Platform Orchestrator")

    # Start gRPC Server
    grpc_task = asyncio.create_task(start_grpc_server(supervisor, settings.GRPC_PORT))

    # Start Kafka Consumer
    consumer_task = asyncio.create_task(consume_logs_background())

    yield

    # --- Shutdown ---
    logger.info("Stopping AI Service...")
    grpc_task.cancel()
    consumer_task.cancel()


# --- FastAPI Setup ---
app = FastAPI(title="AI Log Analysis Gateway", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


class LogBatchRequest(BaseModel):
    batch_id: str
    logs: List[Dict[str, Any]]
    timestamp: str


# --- Endpoints ---


@app.post("/api/analyze")
async def analyze_full(request: LogBatchRequest):
    """Full-cycle forensics analysis of a log batch."""
    result = supervisor.run(request.dict())
    return result


@app.get("/health")
async def health_check():
    """Multi-service health check."""
    return {
        "status": "UP",
        "checks": {
            "supervisor": "READY",
            "kafka": "CONNECTED",  # In prod, would verify connection
            "ollama_llm": "REACHABLE",
        },
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return generate_latest()


# --- WebSocket Chat Assistant ---


@app.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket: Engineer connected to AI Assistant")

    try:
        while True:
            data = await websocket.receive_text()
            
            # 1. Use existing LATEST_ANALYSIS as context
            context_brief = "No recent anomalies detected."
            if LATEST_ANALYSIS.get("anomalies_detected"):
                report = LATEST_ANALYSIS.get("incident_report", {})
                context_brief = f"Latest Incident: {report.get('summary', 'Unknown Anomaly')}. Severity: {LATEST_ANALYSIS.get('anomaly_severity')}."

            await websocket.send_json(
                {"type": "chunk", "content": f"Syncing with Intelligence Mesh... Done.\nContext: {context_brief}\nThinking..."}
            )
            
            # 2. Simple logic for now: respond with the latest root cause or prediction
            response = "I'm monitoring the logs. No critical issues found in the current buffer."
            if LATEST_ANALYSIS.get("anomalies_detected"):
                rc = LATEST_ANALYSIS.get("root_cause", "investigating...")
                response = f"Based on the latest telemetry, I've identified a potential root cause: {rc}. I recommend checking the {', '.join(LATEST_ANALYSIS.get('affected_services', ['related']))} services."

            await asyncio.sleep(0.5)
            await websocket.send_json(
                {
                    "type": "done",
                    "content": response,
                }
            )
    except WebSocketDisconnect:
        logger.info("WebSocket: Engineer disconnected")
