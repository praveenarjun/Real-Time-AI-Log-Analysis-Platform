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
    def __init__(self, endpoint: str, api_key: str, model_name: str, temperature: float = 0.0):
        self.endpoint = endpoint
        self.api_key = api_key
        self.model_name = model_name
        self.temperature = temperature
        # Surgical Fix: Hard-coding the exact proved URL to prevent double-slashes or SDK folder injection
        self.url = "https://ailogger.openai.azure.com/openai/responses?api-version=2025-04-01-preview"

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
            logger.error(f"Direct Foundry Handshake Failed: {str(e)}")
            raise e

    def _prepare_payload(self, messages: List[BaseMessage]) -> Dict[str, Any]:
        formatted_messages = []
        for m in messages:
            role = "user"
            if isinstance(m, SystemMessage):
                role = "system"
            elif isinstance(m, AIMessage):
                role = "assistant"
            
            formatted_messages.append({
                "role": role,
                "content": m.content
            })

        return {
            "messages": formatted_messages,
            "max_tokens": 4000,
            "temperature": self.temperature
        }

    def _extract_content(self, data: Dict[str, Any]) -> str:
        # Foundry MaaS response pattern: choices -> message -> content
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            # Fallback for different Foundry versions
            return data.get("content", str(data))
