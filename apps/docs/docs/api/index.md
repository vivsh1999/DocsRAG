---
title: API Documentation
description: Complete documentation for the DocsRAG API
sidebar_position: 1
slug: /api
---

# DocsRAG API Documentation

Welcome to the comprehensive documentation for the DocsRAG API - a modern, intelligent document search and question-answering system powered by AI.

## What You'll Find Here

This documentation covers everything you need to know about the DocsRAG API:

### 🚀 [Getting Started](./overview)
Learn what the DocsRAG API is, its key features, and core concepts. Perfect introduction for new users.

### ⚡ [Quick Start Guide](./quick-start)
Get up and running in 5 minutes with our step-by-step installation and setup guide.

### 📖 [API Reference](./api-reference)
Complete endpoint documentation with examples, parameters, and response schemas.

### 🏗️ [Architecture Deep Dive](./architecture)
Understand the system architecture, components, and design decisions behind the API.

### ⚙️ [Configuration Guide](./configuration)
Environment setup, customization options, and deployment configurations.

### 💡 [Integration Examples](./examples)
Real-world examples showing how to integrate the API into your applications.

## Quick Navigation

### For Developers
- **New to RAG?** Start with the [Overview](./overview) to understand the concepts
- **Want to try it?** Jump to the [Quick Start](./quick-start) guide
- **Building an integration?** Check [API Reference](./api-reference) and [Examples](./examples)

### For DevOps/Deployment
- **Setting up production?** Review [Configuration](./configuration) and [Architecture](./architecture)
- **Need deployment examples?** See [Integration Examples - Deployment](./examples#deployment-examples)

### For System Architects
- **Understanding the system?** Read the [Architecture](./architecture) documentation
- **Performance planning?** Check [Architecture - Performance](./architecture#performance-characteristics)

## Key Features at a Glance

### 🧠 **Dual Intelligence Pipeline**
- **PocketFlow Workflow**: Advanced AI-driven query processing with intent classification
- **Traditional RAG**: Reliable fallback with vector similarity search
- **Automatic Routing**: Smart selection of the best approach for each query

### 🔍 **Advanced Search Capabilities**
- **Semantic Understanding**: Goes beyond keyword matching to understand intent
- **Query Expansion**: Automatically generates alternative phrasings
- **Smart Chunking**: Intelligent document segmentation for optimal context

### ⚡ **Performance & Reliability**
- **Incremental Indexing**: Only processes changed documents
- **Fast Responses**: Typically under 500ms query response time
- **Graceful Fallback**: Never fails - always provides an answer
- **Health Monitoring**: Built-in status and performance tracking

## API Overview

### Base Endpoint
```
http://localhost:3001
```

### Primary Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/query` | POST | Submit questions and get AI-powered answers |
| `/health` | GET | Check system status and service availability |
| `/` | GET | Basic API information and feature status |

### Example Query

```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I configure environment variables?"}'
```

```json
{
  "response": "To configure environment variables...",
  "metadata": {
    "queryAnalysis": {
      "intent": "how-to",
      "confidence": 0.95
    },
    "approach": "pocketflow",
    "responseLength": 247
  }
}
```

## Common Use Cases

### 📚 **Documentation Sites**
Transform static documentation into interactive, searchable experiences where users can ask questions in natural language.

### 🔧 **API Documentation**
Help developers find specific information, code examples, and implementation guidance for complex APIs.

### 📖 **Knowledge Bases**
Convert knowledge repositories into intelligent systems that provide direct answers instead of search results.

### 🎓 **Learning Resources**
Educational content that can answer student questions with relevant examples and step-by-step explanations.

## Technology Stack

- **Framework**: [Hono.js](https://hono.dev/) - Fast, lightweight web framework
- **AI Platform**: [Google Gemini](https://ai.google.dev/) - Advanced language model
- **Workflow Engine**: [PocketFlow](https://www.npmjs.com/package/pocketflow) - LLM workflow orchestration
- **Language**: TypeScript with ESM modules
- **Runtime**: Node.js 18+ with modern JavaScript features

## Community & Support

### Getting Help
- **Documentation Issues**: Check this documentation first
- **Integration Questions**: See [Integration Examples](./examples)
- **Configuration Problems**: Review [Configuration Guide](./configuration)
- **Architecture Questions**: Read [Architecture Deep Dive](./architecture)

### Contributing
The DocsRAG API is actively developed. Contributions are welcome:
- **Bug Reports**: Submit detailed issue reports
- **Feature Requests**: Propose new capabilities
- **Documentation**: Help improve these docs
- **Code Contributions**: Follow our development guidelines

### Status & Updates
- **Health Check**: Monitor API status at `/health`
- **Performance**: Built-in metrics and monitoring
- **Updates**: Regular feature additions and improvements

---

Ready to get started? Head to the [Quick Start Guide](./quick-start) or explore the specific topic that interests you most!
