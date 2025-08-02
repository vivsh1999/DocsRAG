---
title: API Reference
description: Complete API endpoint documentation with examples
sidebar_position: 3
---

# API Reference

Complete reference for all DocsRAG API endpoints with examples, parameters, and response schemas.

## Base URL

```
http://localhost:3001
```

## Authentication

The DocsRAG API currently operates without authentication for local development. All endpoints are accessible directly.

:::note Production Security
For production deployments, consider implementing:
- API key authentication
- Rate limiting
- CORS origin restrictions
- Request validation middleware
:::

## Endpoints

### POST /query

Primary endpoint for document search and question answering using the RAG system.

#### Request

**Method:** `POST`  
**Content-Type:** `application/json`

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | The question or search query |

**Example Request:**

```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I configure environment variables?"
  }'
```

#### Response

**Content-Type:** `application/json`

**Response Schema:**

```typescript
interface QueryResponse {
  response: string;
  metadata?: {
    queryAnalysis?: {
      intent: string;           // Detected query intent
      confidence: number;       // Confidence score (0-1)
      expansions: number;       // Number of query expansions
    };
    searchMetadata?: {
      documentsFound: number;   // Total relevant documents
      topRelevance: number;     // Highest relevance score
    };
    responseLength: number;     // Character count of response
    timestamp: string;          // ISO timestamp
    approach: string;           // "pocketflow" or "traditional"
    fallback?: boolean;         // True if fallback was used
    error?: boolean;            // True if error occurred
    message?: string;           // Additional status message
  };
}
```

#### Success Response Examples

**PocketFlow Response (Primary Pipeline):**

```json
{
  "response": "To configure environment variables in DocsRAG, create a `.env` file in the `apps/api/` directory with the following required variables:\n\n```bash\nGEMINI_API_KEY=your_gemini_api_key_here\nOPENAI_API_KEY=your_openai_api_key_here\n```\n\nOptional variables include:\n- `PORT=3001` (default: 3001)\n- `DATA_DIR=data` (default: 'data')\n- `INDEX_STORAGE_DIR=index_storage` (default: 'index_storage')\n\nRestart the server after making changes to environment variables.",
  "metadata": {
    "queryAnalysis": {
      "intent": "how-to",
      "confidence": 0.95,
      "expansions": 4
    },
    "searchMetadata": {
      "documentsFound": 3,
      "topRelevance": 0.89
    },
    "responseLength": 387,
    "timestamp": "2025-01-31T10:30:45.123Z",
    "approach": "pocketflow",
    "fallback": false
  }
}
```

**Traditional RAG Response (Fallback Pipeline):**

```json
{
  "response": "Based on the documentation, you can configure environment variables by creating a `.env` file...\n\n**Sources:**\n- [Quick Start Guide](/docs/quick-start#environment-setup)\n- [Configuration Reference](/docs/configuration)",
  "metadata": {
    "approach": "traditional",
    "fallback": true,
    "responseLength": 245,
    "timestamp": "2025-01-31T10:30:45.123Z"
  }
}
```

#### Error Responses

**400 Bad Request - Missing Query:**

```json
{
  "error": "Query parameter \"query\" is missing in the request body."
}
```

**503 Service Unavailable - Vector Store Not Ready:**

```json
{
  "error": "Vector store index not initialized. Please wait for the server to fully start."
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal Server Error",
  "details": "Failed to process query: Connection timeout"
}
```

#### Query Intent Types

The system automatically classifies queries into these intent types:

| Intent | Description | Example Queries |
|--------|-------------|-----------------|
| `how-to` | Step-by-step instructions | "How do I...", "What's the process to..." |
| `troubleshooting` | Problem-solving queries | "Why isn't...", "Error when..." |
| `example` | Request for code examples | "Show me an example...", "Sample code for..." |
| `concept` | Conceptual explanations | "What is...", "Explain the concept of..." |
| `reference` | Specific parameter/API details | "What parameters...", "List all options..." |
| `general` | General information requests | "Tell me about...", "Overview of..." |

---

### GET /health

Health check endpoint providing detailed system status and service availability.

#### Request

**Method:** `GET`  
**Parameters:** None

**Example Request:**

```bash
curl -X GET http://localhost:3001/health
```

#### Response

**Content-Type:** `application/json`

**Response Schema:**

```typescript
interface HealthResponse {
  status: 'healthy' | 'initializing' | 'error';
  services: {
    vectorStore: boolean;     // Vector store initialization status
    pocketFlow: boolean;      // PocketFlow availability
    gemini: boolean;          // Gemini AI service status
    cors: boolean;            // CORS configuration status
  };
  endpoints: {
    [endpoint: string]: string;  // Available endpoints with descriptions
  };
}
```

#### Success Response:

```json
{
  "status": "healthy",
  "services": {
    "vectorStore": true,
    "pocketFlow": true,
    "gemini": true,
    "cors": true
  },
  "endpoints": {
    "/query": "PocketFlow enhanced RAG query with metadata",
    "/health": "Service health check"
  }
}
```

#### Initializing Response:

```json
{
  "status": "initializing",
  "services": {
    "vectorStore": false,
    "pocketFlow": false,
    "gemini": true,
    "cors": true
  },
  "endpoints": {
    "/query": "PocketFlow enhanced RAG query with metadata",
    "/health": "Service health check"
  }
}
```

---

### GET /

Root endpoint providing basic API information and feature status.

#### Request

**Method:** `GET`  
**Parameters:** None

**Example Request:**

```bash
curl -X GET http://localhost:3001/
```

#### Response

```json
{
  "message": "API is running",
  "features": {
    "pocketFlowRAG": true,
    "cors": true,
    "docusaurusLinks": true,
    "llmFallback": true,
    "enhancedAnalytics": true
  }
}
```

## Response Formats

### Markdown Formatting

Responses include properly formatted Markdown with:

- **Headers** for section organization
- **Code blocks** with syntax highlighting
- **Lists** for step-by-step instructions
- **Links** to relevant documentation (when using traditional pipeline)
- **Bold/italic** text for emphasis

### Link Handling

When using the traditional RAG pipeline, responses include clickable links:

```markdown
**Sources:**
- [Configuration Guide](/docs/configuration)
- [Quick Start](/docs/quick-start#environment-setup)
```

Links are automatically converted to work with Docusaurus routing.

## Rate Limiting

Currently, no rate limiting is implemented for local development. For production use, consider implementing:

- **Request rate limiting** (e.g., 100 requests/minute)
- **Concurrent request limits** (e.g., 5 simultaneous queries)
- **Query complexity analysis** for resource management

## Error Handling

The API implements comprehensive error handling:

1. **Validation Errors**: Invalid request format or missing parameters
2. **Service Errors**: AI service timeouts or API key issues
3. **System Errors**: Database unavailable or file system issues
4. **Graceful Degradation**: Automatic fallback from PocketFlow to traditional RAG

All errors include:
- Clear error messages
- Appropriate HTTP status codes
- Optional details for debugging (non-production)

## CORS Support

The API includes full CORS support configured for development:

```typescript
cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
})
```

For production, restrict origins to your specific domains:

```typescript
cors({
  origin: ['https://yourdomain.com', 'https://docs.yourdomain.com'],
  // ... other options
})
```

## Integration Examples

### JavaScript/Node.js

```javascript
async function queryDocsRAG(question) {
  const response = await fetch('http://localhost:3001/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: question })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('Answer:', data.response);
    console.log('Approach:', data.metadata?.approach);
  } else {
    console.error('Error:', data.error);
  }
}

// Usage
await queryDocsRAG("How do I configure the API?");
```

### Python

```python
import requests
import json

def query_docs_rag(question):
    url = "http://localhost:3001/query"
    payload = {"query": question}
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Answer: {data['response']}")
        print(f"Approach: {data.get('metadata', {}).get('approach', 'unknown')}")
    else:
        print(f"Error: {response.json().get('error', 'Unknown error')}")

# Usage
query_docs_rag("How do I get started?")
```

### Frontend Integration

```typescript
interface QueryResponse {
  response: string;
  metadata?: {
    approach: string;
    queryAnalysis?: {
      intent: string;
      confidence: number;
    };
  };
}

async function searchDocs(query: string): Promise<QueryResponse> {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
```

---

Need help with integration? Check our [Examples Guide](./examples) for more detailed implementation patterns.
