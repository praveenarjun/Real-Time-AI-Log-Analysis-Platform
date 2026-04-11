import json
import logging
import numpy as np
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

from core.prompts import PREDICTOR_SYSTEM_PROMPT
from core.helpers import parse_json_response

logger = logging.getLogger("ai-service.predictor")


@tool
def analyze_error_trend(logs_json: str, service_name: str) -> str:
    """Calculate error rate trend using linear regression and project threshold breaches. Returns JSON."""
    try:
        logs = json.loads(logs_json)
        # Filter for service and group by minute
        minute_counts = {}
        for log_item in logs:
            if log_item.get("service_name") == service_name:
                ts = log_item.get("timestamp", "")[:16]  # Minute precision
                if log_item.get("level", "").upper() in ["ERROR", "FATAL"]:
                    minute_counts[ts] = minute_counts.get(ts, 0) + 1

        if len(minute_counts) < 2:
            return json.dumps(
                {"trend": "stable", "info": "Insufficient data for regression"}
            )

        # Linear Regression: y = mx + c
        y = np.array(list(minute_counts.values()))
        x = np.arange(len(y))

        m, c = np.polyfit(x, y, 1)

        trend = "stable"
        if m > 0.5:
            trend = "increasing"
        elif m < -0.5:
            trend = "decreasing"

        # Project when y hits 20 errors/min (critical threshold)
        projected_mins = -1
        if m > 0:
            projected_mins = (20 - c) / m

        return json.dumps(
            {
                "trend": trend,
                "slope": round(float(m), 4),
                "projected_critical_time": f"{round(float(projected_mins), 1)} mins"
                if projected_mins > 0
                else "N/A",
                "current_rate": int(y[-1]),
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def check_resource_trajectory(service_name: str) -> str:
    """Forecast resource exhaustion based on current utilization trajectories. Returns JSON."""
    # Simulated trajectory analysis
    # In production: query Prometheus range vectors
    try:
        trajectories = {
            "memory": {
                "usage_trend": "+1.2%/min",
                "time_to_exhaustion": "45 mins",
                "recommendation": "Check for memory leak in /api/data",
            },
            "disk": {
                "usage_trend": "stable",
                "time_to_exhaustion": "14 days",
                "recommendation": "None",
            },
            "cpu": {
                "usage_trend": "+5%/min",
                "time_to_exhaustion": "12 mins",
                "recommendation": "Scale replicas to 3",
            },
        }

        # Heuristic: check-auth service often has memory issues in this platform
        res = "memory" if "auth" in service_name.lower() else "cpu"
        return json.dumps(
            {"service": service_name, "resource": res, "trajectory": trajectories[res]}
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def match_failure_patterns(anomalies_json: str) -> str:
    """Identify known failure progression patterns like Root Cause Cascades. Returns JSON."""
    patterns = [
        {"name": "Memory Leak", "progression": ["warn", "high usage", "OOM", "crash"]},
        {
            "name": "Database Cascade",
            "progression": ["pool warning", "exhausted", "timeout", "total outage"],
        },
        {
            "name": "Network Partition",
            "progression": ["latency spike", "retries", "circuit-breaker-open", "503"],
        },
    ]

    try:
        anomalies = json.loads(anomalies_json)
        matches = []
        for p in patterns:
            # Simple probability heuristic for the simulation
            prob = 0.1
            if any(p["name"].lower() in str(a).lower() for a in anomalies):
                prob = 0.85

            matches.append(
                {
                    "pattern": p["name"],
                    "probability": prob,
                    "next_event": p["progression"][2],
                    "time_estimate": "15-30 mins",
                }
            )

        return json.dumps({"matched_patterns": matches})
    except Exception as e:
        return json.dumps({"error": str(e)})


class PredictorAgent:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm
        self.tools = [
            analyze_error_trend,
            check_resource_trajectory,
            match_failure_patterns,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)

    def predict(
        self, log_entries: List[Dict[str, Any]], anomalies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Orchestrates failure forecasting and risk assessment."""
        # 1. Feature Extraction & Scoring (Simulated ML)
        # In production: feed vectorized logs to the isolation forest
        risk_score = 0.1
        if len(anomalies) > 0:
            risk_score = (
                0.75
                if any(a.get("severity") == "CRITICAL" for a in anomalies)
                else 0.45
            )

        context = {"logs": log_entries[:10], "anomalies": anomalies}

        messages = [
            SystemMessage(content=PREDICTOR_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Analyze the current system state and predict future failures: \n\n{json.dumps(context)}"
            ),
        ]

        try:
            ai_msg = self.llm_with_tools.invoke(messages)
            messages.append(ai_msg)

            # Tool loop
            for _ in range(3):
                if not ai_msg.tool_calls:
                    break

                for tool_call in ai_msg.tool_calls:
                    tool_func = {
                        "analyze_error_trend": analyze_error_trend,
                        "check_resource_trajectory": check_resource_trajectory,
                        "match_failure_patterns": match_failure_patterns,
                    }.get(tool_call["name"])

                    if tool_func:
                        result = tool_func.invoke(tool_call["args"])
                        messages.append(
                            ToolMessage(content=result, tool_call_id=tool_call["id"])
                        )

                ai_msg = self.llm_with_tools.invoke(messages)
                messages.append(ai_msg)

            final_data = parse_json_response(ai_msg.content)

            return {
                "predictions": final_data.get("predictions", []),
                "risk_score": risk_score,
                "summary": ai_msg.content[:300],
            }
        except Exception as e:
            logger.warning(
                f"AI Quota issue in Predictor. Switching to baseline risk model. Error: {e}"
            )
            raise  # Force fail-over
