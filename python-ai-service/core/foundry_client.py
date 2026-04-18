import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage, SystemMessage

logger = logging.getLogger("ai-service.foundry")

class DirectFoundryChatModel:
    """
    A simplified, direct REST client for Azure AI Foundry (MaaS).
    Bypasses SDK pathing assumptions to ensure 100% compatibility with the 'responses' endpoint.
    """
    def __init__(self, endpoint: str, api_key: str, model_name: str, api_version: str = "2025-04-01-preview", temperature: float = 0.0):
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.model_name = model_name
        self.api_version = api_version
        self.temperature = temperature
        # Dynamic URL construction to replace hardcoded fix
        self.url = f"{self.endpoint}/openai/responses?api-version={self.api_version}"

    def bind_tools(self, tools: List[Any]):
        """Placeholder for LangGraph compatibility. Foundry MaaS logic usually handles this via system prompts."""
        # Note: We return self to allow chaining as expected by the Supervisor
        return self

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        """Synchronous invocation matching the LangChain interface."""
        payload = self._prepare_payload(messages)
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json"
        }

        logger.info(f"Direct Foundry Handshake (MaaS): Connecting to {self.model_name}...")
        
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(self.url, headers=headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                content = self._extract_content(data)
                
                logger.info("Direct Foundry Handshake: Success (200 OK)")
                return AIMessage(content=content)
        except Exception as e:
            # Capturing body for diagnostic in case of 400
            error_body = ""
            if hasattr(e, 'response') and e.response:
                error_body = f" | Body: {e.response.text}"
            logger.error(f"Direct Foundry Handshake Failed: {str(e)}{error_body}")
            raise e

    def _prepare_payload(self, messages: List[BaseMessage]) -> Dict[str, Any]:
        # Refinement: Merge all instructions into a single 'user' role.
        # Strict Foundry MaaS models often reject the 'system' role or multiple alternating roles.
        full_content = ""
        for m in messages:
            if m.content:
                full_content += f"{m.content}\n\n"

        return {
            "model": self.model_name,
            "input": [
                {
                    "role": "user", 
                    "content": full_content.strip()
                }
            ]
        }

    def _extract_content(self, data: Dict[str, Any]) -> str:
        # Surgical Mapping for the 2025 'resp_' Envelope (Responses API)
        try:
            output = data.get("output", [])
            if isinstance(output, list) and len(output) > 0:
                # The first item in 'output' is the assistant message
                msg_content = output[0].get("content", [])
                if isinstance(msg_content, list) and len(msg_content) > 0:
                    # The first item in 'content' is the output_text block
                    text = msg_content[0].get("text", "")
                    if text:
                        logger.info(f"Direct Foundry Handshake EXTRACTION: Success ({len(text)} characters)")
                        return text
        except (KeyError, IndexError, TypeError):
            pass

        # Fallback to Molecular Extraction if structure differs
        def find_string(obj: Any) -> Optional[str]:
            if isinstance(obj, str) and len(obj.strip()) > 20:
                return obj
            if isinstance(obj, dict):
                for key in ["text", "content"]:
                    res = find_string(obj.get(key))
                    if res: return res
                for val in obj.values():
                    res = find_string(val)
                    if res: return res
            if isinstance(obj, list):
                for item in obj:
                    res = find_string(item)
                    if res: return res
            return None

        content = find_string(data)
        if not content:
            content = str(data)

        logger.info(f"Direct Foundry Handshake EXTRACTION: Fallback ({len(content)} characters)")
        return content
