import json
import logging
import statistics
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

from core.prompts import DETECTOR_SYSTEM_PROMPT
from core.helpers import parse_json_response, truncate_logs

logger = logging.getLogger("ai-service.detector")


@tool
def check_error_rate(logs_json: str) -> str:
    """Calculate error rate and determine if abnormal. Returns JSON summary."""
    try:
        logs = json.loads(logs_json)
        if not logs:
            return json.dumps({"error": "No logs provided"})

        total = len(logs)
        error_logs = [
            log_item
            for log_item in logs
            if log_item.get("level", "").upper() in ["ERROR", "FATAL"]
        ]
        count = len(error_logs)
        rate = (count / total) * 100 if total > 0 else 0

        severity = "low"
        is_anomaly = False

        if rate > 20:
            severity = "critical"
            is_anomaly = True
        elif rate > 10:
            severity = "high"
            is_anomaly = True
        elif rate > 5:
            severity = "medium"
            is_anomaly = True

        return json.dumps(
            {
                "error_rate": f"{rate:.2f}%",
                "error_count": count,
                "total": total,
                "is_anomaly": is_anomaly,
                "severity": severity,
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def check_log_patterns(logs_json: str) -> str:
    """Detect suspicious patterns like repeated errors or cascading failures. Returns JSON."""
    try:
        logs = json.loads(logs_json)
        if not logs:
            return json.dumps({"error": "Empty batch"})

        # Group repeated errors (first 100 chars)
        patterns = {}
        service_failures = {}

        for log_item in logs:
            if log_item.get("level", "").upper() in ["ERROR", "FATAL"]:
                msg = log_item.get("message", "")[:100]
                svc = log_item.get("service_name", "unknown")
                patterns[msg] = patterns.get(msg, 0) + 1
                service_failures[svc] = service_failures.get(svc, 0) + 1

        repeated = {m: c for m, c in patterns.items() if c >= 3}
        failing_svcs = [s for s, c in service_failures.items() if c >= 2]

        # Simple cascade detection (concurrent failures in different services)
        cascade = len(failing_svcs) >= 2

        return json.dumps(
            {
                "repeated_errors": repeated,
                "failing_services": failing_svcs,
                "cascade_detected": cascade,
                "pattern_count": len(repeated),
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def check_frequency_anomaly(logs_json: str) -> str:
    """Detect abnormal log frequency spikes or drops using statistics. Returns JSON."""
    try:
        logs = json.loads(logs_json)
        if len(logs) < 5:
            return json.dumps({"info": "Insufficient data for frequency analysis"})

        # Group by minute
        minute_counts = {}
        active_services = set()

        for log_item in logs:
            ts = log_item.get("timestamp", "")[:16]  # ISO minute
            svc = log_item.get("service_name", "unknown")
            minute_counts[ts] = minute_counts.get(ts, 0) + 1
            active_services.add(svc)
            # This is a bit simplified as we don't have the global service list here
            # In production, we'd fetch this from service discovery or config

        counts = list(minute_counts.values())
        avg_freq = statistics.mean(counts)
        max_freq = max(counts)
        stdev = statistics.stdev(counts) if len(counts) > 1 else 0

        spike = max_freq > (avg_freq + 3 * stdev) or max_freq > (3 * avg_freq)
        spike_mins = [ts for ts, c in minute_counts.items() if c == max_freq]

        return json.dumps(
            {
                "avg_per_minute": round(avg_freq, 2),
                "max_per_minute": max_freq,
                "spike_detected": spike,
                "spike_minutes": spike_mins,
                "silent_services": [],  # Would compare against a global registry
            }
        )
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def check_critical_errors(logs_json: str) -> str:
    """Scan for high-priority infrastructure failure signatures. Returns JSON."""
    crit_patterns = [
        "OutOfMemoryError",
        "StackOverflowError",
        "ConnectionRefused",
        "TimeoutException",
        "DeadlockException",
        "DiskFull",
        "PermissionDenied",
        "CertificateExpired",
        "SecurityBreach",
        "DataCorruption",
        "SegmentationFault",
    ]

    try:
        logs = json.loads(logs_json)
        found = []
        for log_item in logs:
            msg = log_item.get("message", "")
            for p in crit_patterns:
                if p.lower() in msg.lower():
                    found.append(
                        {
                            "pattern": p,
                            "service": log_item.get("service_name"),
                            "context": msg[:200],
                        }
                    )

        return json.dumps({"critical_issues": found, "count": len(found)})
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def check_security_anomalies(logs_json: str) -> str:
    """Heuristic check for security threats (logins, IPs, injections). Returns JSON."""
    sec_patterns = {
        "BRUTE_FORCE": ["login failed", "unauthorized access", "invalid password"],
        "INJECTION": ["SELECT * FROM", "DROP TABLE", "<script>", "../"],
        "AUTH_BYPASS": ["privilege escalation", "sudo failed", "root access denied"],
    }

    try:
        logs = json.loads(logs_json)
        issues = []
        for log_item in logs:
            msg = log_item.get("message", "").lower()
            for p_type, patterns in sec_patterns.items():
                for p in patterns:
                    if p in msg:
                        issues.append(
                            {
                                "type": p_type,
                                "details": msg[:100],
                                "service": log_item.get("service_name"),
                            }
                        )

        risk = "low"
        if len(issues) > 5:
            risk = "high"
        elif len(issues) > 0:
            risk = "medium"

        return json.dumps({"security_issues": issues, "risk_level": risk})
    except Exception as e:
        return json.dumps({"error": str(e)})


class DetectorAgent:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm
        self.tools = [
            check_error_rate,
            check_log_patterns,
            check_frequency_anomaly,
            check_critical_errors,
            check_security_anomalies,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)

    def detect(self, log_entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Scans log entries for anomalies using multi-tool analysis or local rules."""
        if not log_entries:
            return {"has_anomalies": False, "anomalies": [], "severity": "none"}

        # --- TOKEN SAVER: Local Pre-Check for obvious Fatal/Critical errors ---
        critical_logs = [
            log_item
            for log_item in log_entries
            if isinstance(log_item, dict)
            and log_item.get("level", "").upper() in ["FATAL", "CRITICAL"]
        ]
        if critical_logs:
            logger.warning(
                f"TOKEN SAVER: {len(critical_logs)} FATAL/CRITICAL logs found. Bypassing AI Detection to save quota."
            )
            anomalies = []
            for log_item in critical_logs:
                anomalies.append(
                    {
                        "type": "CRITICAL_LOG",
                        "service": log_item.get("service_name"),
                        "message": log_item.get("message"),
                        "severity": "CRITICAL",
                        "timestamp": log_item.get("timestamp"),
                    }
                )
            return {
                "has_anomalies": True,
                "anomalies": anomalies,
                "max_severity": "CRITICAL",
                "risk_score": 10.0,
                "brief_summary": f"Immediate forensic trigger: {len(critical_logs)} critical system failures detected.",
            }

        # --- Normal AI Path (only if no obvious fatal errors) ---

        # 1. Sanitize and Truncate
        valid_logs = []
        has_critical = False
        for log_item in log_entries:
            if isinstance(log_item, dict) and "message" in log_item:
                valid_logs.append(log_item)
                if str(log_item.get("level", "")).upper() in ["FATAL", "CRITICAL"]:
                    has_critical = True

        # Max context window safety
        logs_for_analysis = truncate_logs(valid_logs, 200)
        logs_json = json.dumps(logs_for_analysis)

        # 2. Prepare Messages
        prompt_hint = ""
        if has_critical:
            prompt_hint = "\nIMPORTANT: This batch contains FATAL/CRITICAL errors. These MUST be flagged as anomalies."

        messages = [
            SystemMessage(content=DETECTOR_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Analyze this telemetry batch for anomalies: {prompt_hint}\n\n{logs_json}"
            ),
        ]

        # 3. Tool Loop
        try:
            # Initial call
            ai_msg = self.llm_with_tools.invoke(messages)
            messages.append(ai_msg)

            # Process tool calls in a loop (max 5 iterations to prevent infinite loops)
            for _ in range(5):
                if not ai_msg.tool_calls:
                    break

                for tool_call in ai_msg.tool_calls:
                    tool_func = {
                        "check_error_rate": check_error_rate,
                        "check_log_patterns": check_log_patterns,
                        "check_frequency_anomaly": check_frequency_anomaly,
                        "check_critical_errors": check_critical_errors,
                        "check_security_anomalies": check_security_anomalies,
                    }.get(tool_call["name"])

                    if tool_func:
                        t_args = tool_call["args"]
                        t_input = t_args.get("logs_json", logs_json)

                        logger.info(f"Triggering detector tool: {tool_call['name']}")
                        result = tool_func.invoke(t_input)
                        messages.append(
                            ToolMessage(content=result, tool_call_id=tool_call["id"])
                        )

                # Get next response from LLM
                ai_msg = self.llm_with_tools.invoke(messages)
                messages.append(ai_msg)

            # 4. Parse Final Response
            final_data = parse_json_response(ai_msg.content)

            is_anomaly = final_data.get("has_anomalies", False)
            severity = final_data.get("max_severity", "none")

            if has_critical:
                logger.warning(
                    "Agent check bypassed: FATAL/CRITICAL logs detected. Forcing Forensic Pipeline."
                )
                is_anomaly = True
                severity = "CRITICAL"
                anoms = final_data.get("anomalies", [])
                for log_item in log_entries:
                    if isinstance(log_item, dict) and str(
                        log_item.get("level", "")
                    ).upper() in ["FATAL", "CRITICAL"]:
                        anoms.append(
                            {
                                "type": "CRITICAL_LOG",
                                "service": log_item.get("service_name"),
                                "message": log_item.get("message"),
                                "severity": "CRITICAL",
                                "timestamp": log_item.get("timestamp"),
                            }
                        )
                final_data["anomalies"] = anoms

            return {
                "has_anomalies": is_anomaly,
                "anomalies": final_data.get("anomalies", []),
                "max_severity": severity,
                "summary": ai_msg.content[:1000],
                "confidence": 0.99 if has_critical else (0.85 if is_anomaly else 0.95),
            }

        except Exception as e:
            logger.warning(
                f"AI Quota/Connection issue in Detector. Handing over to Local Safe-Mode. Error: {e}"
            )
            raise  # Let the orchestrator's Safe-Mode catch this!
