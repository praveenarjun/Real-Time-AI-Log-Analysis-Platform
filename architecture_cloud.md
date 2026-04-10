# Azure Deployment Guide: AI Log Analyzer

This guide explains how to deploy the AI Log Analysis Platform to Azure, leveraging the **Azure Student Free Trial** and **Azure OpenAI**.

## ☁️ Service Mapping (Local vs. Azure)

| Service | Local (Docker) | Azure Recommended (Free Tier Friendly) |
| :--- | :--- | :--- |
| **Compute** | Docker Compose | **Azure Container Apps (ACA)** |
| **AI Brain** | Gemini / Local | **Azure OpenAI (GPT-4o)** |
| **Database** | Postgres | **Azure Database for PostgreSQL (Flexible Server)** |
| **Forensic Storage** | Elasticsearch | **Azure Cognitive Search** or Managed ELK |
| **Streaming** | Kafka | **Azure Event Hubs** (with Kafka endpoint) |
| **Cache** | Redis | **Azure Cache for Redis** |

---

## 🚀 Setting up Azure OpenAI

1. **Create Resource**: In Azure Portal, search for "Azure OpenAI".
2. **Deploy Model**: Go to Azure OpenAI Studio and deploy `gpt-4o`.
3. **Get Credentials**: Copy your **Endpoint** and **Key**.

### `.env` Configuration for Azure

```bash
LLM_PROVIDER=azure
LLM_MODEL=gpt-4o  # Your deployment name
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
OPENAI_API_VERSION=2023-05-15
```

---

## 🛠️ Deployment Steps (Azure Container Apps)

Azure Container Apps (ACA) is the best way to deploy multiple microservices for free/low-cost.

1. **Install Azure CLI**: `brew install azure-cli` (on Mac).
2. **Login**: `az login`.
3. **Create Container Registry**: `az acr create --name myloganalyzer --sku Basic`.
4. **Build & Push**: 
   ```bash
   az acr build --registry myloganalyzer --image ai-service:v1 ./python-ai-service
   ```
5. **Deploy to ACA**:
   Use the Azure Portal to create a **Container App Environment** and deploy each service.

---

## 🛡️ Cloud Security (TLS/SSL)

Azure managed services (SQL, Event Hubs) require TLS/SSL by default.
- **Postgres**: Ensure your `DATABASE_URL` uses `sslmode=require`.
- **Event Hubs**: Use the connection string provided in the Portal under "Shared Access Policies".

---

## 💸 Saving Money (Student Credits)

1. **Pause Simulators**: Turn off the `log-simulator` when not in use to save compute credits.
2. **Scale to Zero**: Azure Container Apps can scale to **0 replicas** when not in use, which means you pay $0 for idle time!
