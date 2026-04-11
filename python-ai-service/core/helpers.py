import json
import re
from typing import List, Dict, Any, Optional

def parse_json_response(text: str) -> Dict[Any, Any]:
    """Safely extracts and parses JSON from the LLM response text."""
    try:
        # Look for JSON block if it exists
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            return normalize_json_response(json.loads(json_match.group(1)))
        
        # Try finding the first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            return normalize_json_response(json.loads(text[start:end+1]))
            
        return normalize_json_response(json.loads(text))
    except Exception:
        # Fallback to an empty dict if parsing fails
        return {}

def normalize_json_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Maps compressed token-saving keys back to the canonical names used by the platform."""
    mapping = {
        "summary": "executive_summary",
        "verdict": "technical_verdict",
        "actions": "action_checklist",
        "risk": "risk_assessment",
        "dept": "target_department",
        "prevention": "prevention_strategy",
        "risk": "risk_assessment",
        "blast": "blast_radius"
    }
    
    normalized = data.copy()
    for short_key, long_key in mapping.items():
        if short_key in data and long_key not in data:
            normalized[long_key] = data[short_key]
            
    # Normalize nested lists if they exist (for anomalies or predictions)
    if "anomalies" in normalized and isinstance(normalized["anomalies"], list):
        for item in normalized["anomalies"]:
             if "sev" in item: item["severity"] = item["sev"]
             if "desc" in item: item["description"] = item["desc"]
             if "svc" in item: item["affected_service"] = item["svc"]
             
    return normalized

def truncate_logs(logs: List[Dict[str, Any]], max_count: int = 50) -> List[Dict[str, Any]]:
    """Limits the number of logs to keep the LLM context window manageable."""
    if len(logs) <= max_count:
        return logs
    return logs[-max_count:] # Keep the most recent ones

def calculate_error_rate(logs: List[Dict[str, Any]]) -> float:
    """Calculates the percentage of ERROR/FATAL logs in the batch."""
    if not logs:
        return 0.0
    error_count = sum(1 for log in logs if log.get("level", "").upper() in ["ERROR", "FATAL"])
    return error_count / len(logs)

def group_logs_by_service(logs: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Groups log entries by their source service name."""
    groups = {}
    for log in logs:
        service = log.get("service_name", "unknown")
        if service not in groups:
            groups[service] = []
        groups[service].append(log)
    return groups

def group_logs_by_level(logs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Counts logs by their severity levels."""
    counts = {}
    for log in logs:
        level = log.get("level", "INFO").upper()
        counts[level] = counts.get(level, 0) + 1
    return counts

def extract_error_logs(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filters logs and returns only ERROR and FATAL entries."""
    return [log for log in logs if log.get("level", "").upper() in ["ERROR", "FATAL"]]

def generate_log_summary(logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates a high-level statistical summary of a log batch."""
    return {
        "count": len(logs),
        "levels": group_logs_by_level(logs),
        "services": list(group_logs_by_service(logs).keys()),
        "error_rate": calculate_error_rate(logs)
    }
