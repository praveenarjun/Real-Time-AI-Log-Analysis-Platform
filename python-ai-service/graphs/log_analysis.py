from typing import Annotated, Dict, List, TypedDict
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage
import json
import os

class AnalysisState(TypedDict):
    logs: List[Dict]
    anomalies: List[Dict]
    root_cause: str
    recommendations: List[str]
    severity: str
    service_name: str

def parse_logs(state: AnalysisState):
    """Initial parsing and aggregation node."""
    logs = state["logs"]
    service_name = logs[0].get("service_name", "unknown") if logs else "unknown"
    return {"service_name": service_name}

def detect_anomalies(state: AnalysisState):
    """LLM-powered anomaly detection node."""
    llm = ChatOpenAI(model="gpt-4-turbo-preview")
    logs_str = json.dumps(state["logs"], indent=2)
    
    prompt = f"Analyze these logs for anomalies, error spikes, or security threats:\n{logs_str}"
    response = llm.invoke([HumanMessage(content=prompt)])
    
    # In a real app, you'd use a structured output parser here
    # Placeholder logic for demonstration:
    return {"anomalies": [{"type": "PATTERN_ANOMALY", "description": response.content}]}

def analyze_root_cause(state: AnalysisState):
    """Deep-dive root cause analysis node."""
    if not state["anomalies"]:
        return {"root_cause": "No significant anomalies detected."}
    
    llm = ChatOpenAI(model="gpt-4-turbo-preview")
    prompt = f"Identify the root cause of these detected anomalies:\n{state['anomalies']}"
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {"root_cause": response.content}

def generate_recommendations(state: AnalysisState):
    """Actionable remediation strategy node."""
    llm = ChatOpenAI(model="gpt-4-turbo-preview")
    prompt = f"Generate 3 remediation steps for this root cause:\n{state['root_cause']}"
    response = llm.invoke([HumanMessage(content=prompt)])
    
    recs = response.content.split("\n")
    return {"recommendations": recs[:3]}

# Build the Graph
workflow = StateGraph(AnalysisState)

workflow.add_node("parser", parse_logs)
workflow.add_node("detector", detect_anomalies)
workflow.add_node("analyzer", analyze_root_cause)
workflow.add_node("recommender", generate_recommendations)

workflow.set_entry_point("parser")
workflow.add_edge("parser", "detector")
workflow.add_edge("detector", "analyzer")
workflow.add_edge("analyzer", "recommender")
workflow.add_edge("recommender", END)

# Compile the graph
log_analyzer_graph = workflow.compile()
