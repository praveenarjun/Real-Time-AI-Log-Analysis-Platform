from langchain_community.tools.tavily_search import TavilySearchResults
import os

def get_k8s_docs_tool():
    """Tool to search Kubernetes documentation for error codes."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return None
    return TavilySearchResults(max_results=3, search_depth="advanced")

def get_internal_kb_tool():
    """Tool to search internal knowledge base (placeholder)."""
    # In a real app, this would use a vector store like FAISS or Pinecone
    return lambda q: "Internal KB query: " + q

all_tools = [
    get_k8s_docs_tool(),
    get_internal_kb_tool()
]
