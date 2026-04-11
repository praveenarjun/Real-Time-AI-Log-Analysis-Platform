import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from core.prompts import REPORTER_SYSTEM_PROMPT
from core.helpers import parse_json_response

logger = logging.getLogger("ai-service.reporter")


class ReporterAgent:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    def generate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesizes a structured incident report from the analysis pipeline."""

        context = {
            "anomalies": data.get("anomalies", []),
            "root_cause_analysis": data.get("root_cause", "Pending"),
            "affected_services": data.get("affected_services", []),
            "predictions": data.get("predictions", []),
            "risk_score": data.get("risk_score", 0.0),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

        messages = [
            SystemMessage(content=REPORTER_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Generate a professional incident report from this forensics data: \n\n{json.dumps(context)}"
            ),
        ]

        try:
            ai_msg = self.llm.invoke(messages)
            report = parse_json_response(ai_msg.content)

            # Ensure metadata exists
            report["generated_at"] = context["generated_at"]
            report["id"] = f"INC-{datetime.now().strftime('%Y%m%d%H%M')}"

            return report
        except Exception as e:
            logger.warning(
                f"AI Quota issue in Reporter. Generating local Executive Verdict. Error: {e}"
            )
            raise  # Force fail-over

    def generate_markdown(self, report: Dict[str, Any]) -> str:
        """Converts the JSON report into beautifully formatted GitHub-flavored Markdown."""

        md = f"# 🚨 Incident Report: {report.get('title', 'Unknown Failure')}\n\n"
        md += f"**ID:** `{report.get('id')}`  |  **Severity:** `{report.get('severity', 'HIGH')}`  |  **Generated:** `{report.get('generated_at')}`\n\n"

        md += "## 📝 Executive Summary\n"
        md += f"{report.get('executive_summary', 'No summary provided')}\n\n"

        md += "## 🕒 Incident Timeline\n"
        for t in report.get("timeline", []):
            md += f"- {t}\n"
        md += "\n"

        md += "### 🔍 Root Cause Analysis (RCA)\n"
        md += "> [!IMPORTANT]\n"
        md += f"> {report.get('root_cause_analysis', 'RCA pending')}\n\n"

        md += "### 🛠️ Recommendations & Action Items\n"
        md += "| Task | Priority | Assignee | Deadline |\n"
        md += "| :--- | :--- | :--- | :--- |\n"
        for item in report.get("action_items", []):
            md += f"| {item.get('task')} | **{item.get('priority')}** | {item.get('assignee_role')} | {item.get('deadline')} |\n"
        md += "\n"

        md += "--- \n"
        md += "*This report was generated automatically by the AI Log Forensics Platform.*"

        return md
