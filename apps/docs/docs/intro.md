---
sidebar_position: 1
---

# Welcome to DocsRAG

Welcome to **DocsRAG** - an intelligent documentation search and question-answering system powered by AI.

## What is DocsRAG?

DocsRAG (Retrieval-Augmented Generation) transforms your static documentation into an interactive, intelligent system that can answer questions in natural language. Instead of searching through pages of documentation, users can simply ask questions and get direct, contextual answers.

## Quick Overview

### 🧠 **AI-Powered Intelligence**
- **Semantic Search**: Understands meaning, not just keywords
- **Intent Classification**: Knows whether you want a tutorial, example, or troubleshooting help
- **Smart Responses**: Provides direct answers with relevant context

### 🚀 **Modern Architecture**
- **Dual Pipeline**: Advanced PocketFlow workflows with reliable fallback
- **TypeScript**: Full type safety and modern development experience
- **Incremental Processing**: Only updates when documents change

### 🌐 **Developer Friendly**
- **REST API**: Simple HTTP endpoints for any application
- **CORS Enabled**: Ready for web applications
- **Rich Metadata**: Detailed analytics and performance insights

## What You Can Do

### For End Users
- **Ask Natural Questions**: "How do I configure the API?" instead of searching through docs
- **Get Direct Answers**: Receive contextual responses with relevant examples
- **Find Related Information**: Discover connections between different parts of the documentation

### For Developers
- **Easy Integration**: Simple REST API that works with any technology stack
- **Customizable**: Configure for your specific documentation structure
- **Extensible**: Built with modern patterns for easy enhancement

### For Organizations
- **Improve User Experience**: Reduce friction in finding information
- **Reduce Support Load**: Users find answers without contacting support
- **Analytics**: Understand what users are looking for

## Getting Started

### 🚀 **For API Users**
Jump straight to the [API Documentation](./api/) to learn how to integrate DocsRAG into your applications.

### ⚡ **Quick Start**
Want to try it immediately? Check out the [Quick Start Guide](./api/quick-start) to get running in 5 minutes.

### 🏗️ **Understanding the System**
Learn about the architecture and design decisions in our [Architecture Guide](./api/architecture).

## Documentation Structure

This documentation is organized into clear sections:

### 📖 **API Documentation**
Complete reference for the DocsRAG API including:
- [Overview](./api/overview) - Concepts and features
- [Quick Start](./api/quick-start) - Get running in 5 minutes  
- [API Reference](./api/api-reference) - Complete endpoint documentation
- [Architecture](./api/architecture) - System design deep dive
- [Configuration](./api/configuration) - Setup and customization
- [Examples](./api/examples) - Real-world integration patterns
- [Troubleshooting](./api/troubleshooting) - Common issues and solutions

### 🔗 **Key Links**
- **Live API**: [http://localhost:3001](http://localhost:3001) (when running)
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)
- **GitHub Repository**: [DocsRAG Project](https://github.com/your-repo/DocsRAG)

## Example Usage

Here's a quick example of how simple it is to use DocsRAG:

```bash
# Ask a question about your documentation
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I configure environment variables?"}'
```

```json
{
  "response": "To configure environment variables in DocsRAG, create a `.env` file in the `apps/api/` directory with the following required variables:\n\n```bash\nGEMINI_API_KEY=your_gemini_api_key_here\nOPENAI_API_KEY=your_openai_api_key_here\n```",
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

## Why DocsRAG?

### Traditional Documentation Problems
- **Information Scattered**: Users have to search multiple pages
- **Keyword Dependency**: Search only works if you know the right terms  
- **No Context**: Results don't explain how pieces fit together
- **Static Experience**: No interaction or personalization

### DocsRAG Solutions
- **Direct Answers**: Get specific answers to specific questions
- **Semantic Understanding**: Works with natural language queries
- **Contextual Responses**: Explains relationships and provides examples
- **Interactive Experience**: Feels like talking to an expert

## Next Steps

Ready to dive in? Here are your next steps:

1. **🚀 [Start with the API Overview](./api/overview)** - Understand what DocsRAG can do
2. **⚡ [Follow the Quick Start](./api/quick-start)** - Get your first query working
3. **📖 [Explore Integration Examples](./api/examples)** - See real-world usage patterns
4. **🔧 [Read the Configuration Guide](./api/configuration)** - Customize for your needs

---

**DocsRAG transforms documentation from static content into intelligent, interactive experiences. Let's build something amazing together!**
