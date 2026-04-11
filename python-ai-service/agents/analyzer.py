import json
import logging
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

from core.prompts import ANALYZER_SYSTEM_PROMPT
from core.helpers import parse_json_response

logger = logging.getLogger("ai-service.analyzer")


@tool
def search_historical_logs(query: str, hours_back: int = 168) -> str:
    """Search for similar past incidents in Elasticsearch history. Returns JSON."""
    # Note: In production, we'd use settings.ELASTICSEARCH_URL
    # For now, we'll implement a robust simulation with an option for real httpx query

    try:
        # Simulated "Known Issues" Database
        known_issues = [
            {
                "pattern": "ConnectionRefused",
                "resolution": "Restarted user-db pod. Fixed by increasing max_connections.",
            },
            {
                "pattern": "OutOfMemoryError",
                "resolution": "Memory leak in auth-v2. Rolled back to v1.4.",
            },
            {
                "pattern": "TimeoutException",
                "resolution": "Cascading failure due to api-gateway bottleneck. Scaling replicas to 5.",
            },
        ]

        matches = [i for i in known_issues if i["pattern"].lower() in query.lower()]

        return json.dumps(
            {
                "similar_incidents": matches,
                "occurrence_count": len(matches),
                "is_recurring": len(matches) > 0,
                "data_source": "historical_archive",
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def correlate_events(
    primary_service: str, error_message: str, time_window_minutes: int = 10
) -> str:
    """Find correlated events across services using request_id or time-window logic. Returns JSON."""
    try:
        # Logic to correlate:
        # 1. Matching request_id
        # 2. Sequential failures in a dependency chain

        # Simulated correlation logic
        correlations = [
            {
                "service": "api-gateway",
                "event": "504 Gateway Timeout",
                "relative_time": "+2s",
            },
            {
                "service": "auth-service",
                "event": "Connection Attempt Failed",
                "relative_time": "0s",
            },
            {
                "service": "user-db",
                "event": "Postgres Pool Exhaustion",
                "relative_time": "-1s",
            },
        ]

        return json.dumps(
            {
                "correlated_events": correlations,
                "correlation_confidence": 0.92,
                "likely_chain": "user-db -> auth-service -> api-gateway",
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def check_service_dependencies(service_name: str) -> str:
    """Look up the dependency graph for a specific microservice. Returns JSON."""
    dependency_map = {
        "api-gateway": {
            "depends_on": ["auth-service", "order-service", "product-service"],
            "depended_by": ["user-ui"],
        },
        "auth-service": {
            "depends_on": ["user-db", "cache-redis"],
            "depended_by": ["api-gateway"],
        },
        "order-service": {
            "depends_on": ["payment-service", "user-db"],
            "depended_by": ["api-gateway"],
        },
        "payment-service": {
            "depends_on": ["external-payment-api"],
            "depended_by": ["order-service"],
        },
        "user-db": {
            "depends_on": [],
            "depended_by": ["auth-service", "order-service", "payment-service"],
        },
    }

    deps = dependency_map.get(
        service_name.lower(), {"depends_on": [], "depended_by": []}
    )
    return json.dumps(deps)


@tool
def query_system_metrics(service_name: str, metric_type: str) -> str:
    """Query system metrics like CPU, Memory, or Latency for a service. Returns JSON."""
    # Simulated metrics engine
    # In production: query Prometheus/OpenTelemetry

    metrics = {
        "cpu": {"current": 85.4, "avg": 42.1, "threshold": 80.0},
        "memory": {"current": 92.1, "avg": 65.0, "threshold": 90.0},
        "latency": {"current": 1200, "avg": 150, "threshold": 500},
    }

    m = metrics.get(metric_type.lower(), {"current": 0, "avg": 0, "threshold": 0})
    is_abnormal = m["current"] > m["threshold"]

    return json.dumps(
        {
            "service": service_name,
            "type": metric_type,
            "current_value": m["current"],
            "average_value": m["avg"],
            "is_abnormal": is_abnormal,
            "trend": "upward" if is_abnormal else "stable",
        }
    )


@tool
def analyze_stack_trace(stack_trace: str) -> str:
    """Parse and decompose a stack trace to pinpoint the originating code and type. Returns JSON."""
    try:
        # Heuristic stack trace parsing
        # Example: "at com.app.Service.execute(Service.java:45)"

        exception_type = "UnknownException"
        if "OutOfMemory" in stack_trace:
            exception_type = "java.lang.OutOfMemoryError"
        elif "Timeout" in stack_trace:
            exception_type = "socket.timeout"
        elif "ConnectionRefused" in stack_trace:
            exception_type = "ConnectException"

        is_library = "lib" in stack_trace.lower() or "framework" in stack_trace.lower()

        return json.dumps(
            {
                "exception_type": exception_type,
                "root_location": "Service.java:45"
                if "java" in stack_trace.lower()
                else "main.go:120",
                "is_library_issue": is_library,
                "suggested_fixes": [
                    "Increase heap size",
                    "Check pool configuration",
                    "Verify network security groups",
                ],
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


class AnalyzerAgent:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm
        self.tools = [
            search_historical_logs,
            correlate_events,
            check_service_dependencies,
            query_system_metrics,
            analyze_stack_trace,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)

    def analyze(
        self, log_entries: List[Dict[str, Any]], anomalies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Performs deep-root cause investigation for detected anomalies."""
        if not anomalies:
            return {"error": "No anomalies provided for analysis"}

        context = {
            "detected_anomalies": anomalies,
            "recent_logs": log_entries[:10],  # Representative slice
        }

        messages = [
            SystemMessage(content=ANALYZER_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Conduct a Root Cause Analysis for these events: \n\n{json.dumps(context)}"
            ),
        ]

        try:
            # 1. Initial LLM Investigation
            ai_msg = self.llm_with_tools.invoke(messages)
            messages.append(ai_msg)

            # 2. Iterative Tool Loop (Max 5 investigations)
            for i in range(5):
                if not ai_msg.tool_calls:
                    break

                logger.info(f"Analyzer investigation step {i + 1}")
                for tool_call in ai_msg.tool_calls:
                    tool_func = {
                        "search_historical_logs": search_historical_logs,
                        "correlate_events": correlate_events,
                        "check_service_dependencies": check_service_dependencies,
                        "query_system_metrics": query_system_metrics,
                        "analyze_stack_trace": analyze_stack_trace,
                    }.get(tool_call["name"])

                    if tool_func:
                        result = tool_func.invoke(tool_call["args"])
                        messages.append(
                            ToolMessage(content=result, tool_call_id=tool_call["id"])
                        )

                ai_msg = self.llm_with_tools.invoke(messages)
                messages.append(ai_msg)

            # 3. Final Synthesis
            final_data = parse_json_response(ai_msg.content)

            return {
                "root_cause": final_data.get("root_cause", "Undetermined"),
                "business_impact": final_data.get("business_impact", "Unknown"),
                "target_department": final_data.get("target_department", "Engineering"),
                "severity_score": final_data.get("severity_score", 5),
                "recovery_plan": final_data.get("recovery_plan", []),
                "evidence": final_data.get("evidence", ""),
                "confidence": final_data.get("confidence", 0.0),
            }

        except Exception as e:
            logger.warning(
                f"AI Quota/Connection issue. Handing over to Local Safe-Mode. Error: {e}"
            )
            raise  # Force fail-over to local safe-mode
