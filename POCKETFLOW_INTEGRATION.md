# PocketFlow RAG Integration

This document explains how to use the enhanced RAG system powered by PocketFlow in the DocsRAG API.

## 🧹 Recent Cleanup

The repository has been cleaned up to remove unnecessary files:
- ✅ Removed demo files: `test-rag.js`, `chat-demo.html`, `llm-fallback-demo.html`
- ✅ Removed outdated documentation: `ENHANCED_RAG_SUMMARY.md`, `LLM_FALLBACK_IMPLEMENTATION.md`
- ✅ Cleaned up system files: `.DS_Store` files
- ✅ All remaining code is actively used and necessary

## Overview

PocketFlow is a lightweight framework for building LLM workflows using Node and Flow abstractions. Our integration provides enhanced query processing with detailed analytics and intelligent routing.

## API Endpoints

### Main Query Endpoint (`/query`)
```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I create a blog post?"}'
```

**Features:**
- JSON response with structured metadata
- Intent classification and confidence scores  
- Query expansion analytics
- Search result metrics
- Response timing and quality indicators
- Automatic fallback to traditional RAG if PocketFlow unavailable
- Markdown-formatted response content with sources (when using traditional fallback)
- Clickable Docusaurus-compatible links

### Health Check (`/health`)
```bash
curl -X GET http://localhost:3001/health
```

Shows the status of all services including PocketFlow availability.

## PocketFlow Workflow

The enhanced RAG system uses the following Node-based workflow:

1. **QueryIntentNode**: Classifies query intent (how-to, troubleshooting, example, general)
2. **QueryExpansionNode**: Generates alternative query phrasings
3. **VectorSearchNode**: Performs semantic search with expanded queries
4. **ContextBuildingNode**: Builds context from relevant documents
5. **ResponseGenerationNode**: Generates final response with context
6. **LLMFallbackNode**: Handles queries outside documentation scope
7. **MetadataEnhancementNode**: Adds analytics and tracking data
8. **ErrorHandlingNode**: Graceful error handling and recovery

## Enhanced Response Format

The `/query` endpoint returns:

```json
{
  "response": "Generated response text...",
  "metadata": {
    "queryAnalysis": {
      "intent": "how-to",
      "confidence": 0.8,
      "expansions": 3
    },
    "searchMetadata": {
      "documentsFound": 5,
      "topRelevance": 0.765
    },
    "responseLength": 792,
    "timestamp": "2025-07-18T11:43:55.578Z",
    "approach": "pocketflow"
  }
}
```

**Note**: When PocketFlow is unavailable, the system automatically falls back to traditional RAG with `"approach": "traditional"` and `"fallback": true` in metadata.

## Intent Types

The system recognizes these query intents:

- **`how-to`**: Step-by-step instructions (e.g., "How do I...")
- **`troubleshooting`**: Problem-solving queries (e.g., "Why isn't...")
- **`example`**: Request for code examples (e.g., "Show me an example...")
- **`general`**: General information requests

## Fallback Behavior

When PocketFlow is unavailable, the system automatically falls back to the traditional RAG approach with:
- `"approach": "traditional"` in metadata
- `"fallback": true` flag in metadata  
- Full functionality maintained with traditional vector search
- Graceful degradation without service interruption

## Development Features

- **CORS enabled**: Cross-origin requests allowed from any origin
- **Docusaurus integration**: Proper URL conversion for documentation links
- **LLM fallback**: Intelligent responses for queries outside documentation
- **Error recovery**: Graceful handling of API limits and failures

## Performance Monitoring

Use the metadata from the enhanced endpoint to monitor:

- **Intent classification accuracy**: Confidence scores above 0.7 indicate good classification
- **Search quality**: Top relevance scores above 0.6 suggest good document matches
- **Response time**: Timestamp differences for performance analysis
- **Document coverage**: Number of documents found vs. query complexity

## Examples

### Successful Documentation Query
```json
{
  "query": "How do I create a blog post?",
  "metadata": {
    "queryAnalysis": {
      "intent": "how-to",
      "confidence": 0.8,
      "expansions": 3
    },
    "searchMetadata": {
      "documentsFound": 5,
      "topRelevance": 0.765
    }
  }
}
```

### Out-of-Scope Query
```json
{
  "query": "What is machine learning?",
  "metadata": {
    "queryAnalysis": {
      "intent": "general",
      "confidence": 0.8,
      "expansions": 3
    },
    "searchMetadata": {
      "documentsFound": 5,
      "topRelevance": 0.394
    }
  }
}
```

Notice the lower relevance score (0.394 vs 0.765) indicating the query is outside the documentation scope.
