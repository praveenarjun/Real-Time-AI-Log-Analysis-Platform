import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ai-service.tools.history")

# This will be injected by main.py
buffer_reference = None

def set_buffer_reference(buf):
    global buffer_reference
    buffer_reference = buf

def query_log_history(
    service_name: Optional[str] = None, 
    level: Optional[str] = None, 
    keyword: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Forensic Tool: Search the internal 1000-log rolling buffer for historical patterns.
    Use this to look back at logs that occurred BEFORE an anomaly was detected.
    """
    if buffer_reference is None:
        return []

    results = []
    # Search backwards (newest to oldest)
    for log in reversed(list(buffer_reference)):
        if len(results) >= limit:
            break
            
        # Match filters (logical AND)
        if service_name and log.get("service") != service_name:
            continue
        if level and log.get("level") != level:
            continue
        if keyword and keyword.lower() not in str(log.get("message", "")).lower():
            continue
            
        results.append(log)
    
    logger.info(f"ForensicSearch executed: found {len(results)} matches for service={service_name}, keyword={keyword}")
    return results
