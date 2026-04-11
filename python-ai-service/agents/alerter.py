import json
import logging
from typing import List, Dict, Any, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from core.prompts import ALERTER_SYSTEM_PROMPT
from core.helpers import parse_json_response

logger = logging.getLogger("ai-service.alerter")

class AlerterAgent:
    RULES = {
        "critical": {"channels": ["slack", "email", "pagerduty"], "urgency": "immediate"},
        "high": {"channels": ["slack", "email"], "urgency": "within_15_min"},
        "medium": {"channels": ["slack"], "urgency": "within_1_hour"},
        "low": {"channels": [], "urgency": "next_business_day"}
    }

    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    def decide(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrates the alerting strategy based on incident severity and risk."""
        
        # 1. Prepare Decision Context
        severity = data.get("severity", "MEDIUM").lower()
        risk_score = data.get("risk_score", 0.0)
        incident_report = data.get("incident_report", {})
        
        # Hard-coded rule lookup as baseline
        rule_base = self.RULES.get(severity, self.RULES["medium"])
        
        context = {
            "severity": severity,
            "risk_score": risk_score,
            "report_summary": incident_report.get("executive_summary", "RCA pending..."),
            "suggested_channels": rule_base["channels"]
        }

        # 2. Let the LLM refine the strategy
        messages = [
            SystemMessage(content=ALERTER_SYSTEM_PROMPT),
            HumanMessage(content=f"Decide the optimal alerting strategy for this incident: \n\n{json.dumps(context)}")
        ]

        try:
            ai_msg = self.llm.invoke(messages)
            decision = parse_json_response(ai_msg.content)
            
            # 3. Finalize Alerting Strategy
            return {
                "should_alert": decision.get("should_alert", context["risk_score"] > 0.4),
                "channels": decision.get("channels", rule_base["channels"]),
                "message": decision.get("message", f"Incident detected in {incident_report.get('title')}"),
                "urgency": decision.get("urgency", rule_base["urgency"]),
                "escalation_needed": decision.get("escalation_needed", severity == "critical"),
                "suppress_reason": decision.get("suppress_reason", "")
            }
        except Exception as e:
            logger.warning(f"AI Offline for Alerter. Using local notification routing. Error: {e}")
            raise # Force fail-over
