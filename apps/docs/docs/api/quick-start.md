---
title: Quick Start
description: Get the DocsRAG API running in 5 minutes
sidebar_position: 2
---

# Quick Start Guide

Get the DocsRAG API up and running in just a few minutes with this step-by-step guide.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** with ESM support ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install guide](https://pnpm.io/installation))
- **Google Gemini API key** ([Get your key](https://ai.google.dev/))
- **OpenAI API key** (optional, for fallback scenarios) ([Get your key](https://platform.openai.com/))

## Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd DocsRAG

# Install all dependencies
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the `apps/api/` directory:

```bash
cd apps/api
touch .env
```

Add your configuration to the `.env` file:

```bash title="apps/api/.env"
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional Configuration (with defaults)
PORT=3001                           # API server port
DATA_DIR=data                       # Documents directory
INDEX_STORAGE_DIR=index_storage     # Vector storage directory
```

:::tip Getting API Keys
- **Gemini API**: Visit [Google AI Studio](https://ai.google.dev/) to get your free API key
- **OpenAI API**: Go to [OpenAI Platform](https://platform.openai.com/) for your API key
:::

### 3. Add Your Documents

Place your Markdown or MDX files in the `apps/api/data/` directory:

```bash
# Create the data directory if it doesn't exist
mkdir -p apps/api/data

# Add your documentation files
apps/api/data/
├── getting-started.md
├── api-guide.mdx
├── tutorials/
│   ├── basic-setup.md
│   └── advanced-features.md
└── reference/
    └── api-endpoints.md
```

:::info Supported Formats
The API supports:
- **`.md`** - Standard Markdown files
- **`.mdx`** - MDX files with React components
- **Nested directories** - Organize your docs however you like
- **Frontmatter** - YAML metadata for better categorization
:::

### 4. Start the API Server

From the root directory:

```bash
# Start both API and documentation site
pnpm start
```

Or start just the API:

```bash
cd apps/api
pnpm start
```

You should see output similar to:

```bash
[APP] Initializing application...
[VECTOR_STORE] Scanning for documents in data/
[VECTOR_STORE] Found 5 documents to process
[GEMINI] Generating embeddings for documents...
[VECTOR_STORE] Vector store initialized.
[APP] Routes configured.
[APP] Starting server on http://localhost:3001
[APP] Server started on http://localhost:3001
```

## Verify Installation

### 1. Health Check

Test that the API is running:

```bash
curl http://localhost:3001/health
```

Expected response:
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

### 2. Test Query

Try your first query:

```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I get started?"}'
```

Expected response:
```json
{
  "response": "To get started with DocsRAG, you need to...",
  "metadata": {
    "queryAnalysis": {
      "intent": "how-to",
      "confidence": 0.95,
      "expansions": 3
    },
    "searchMetadata": {
      "documentsFound": 5,
      "topRelevance": 0.87
    },
    "approach": "pocketflow",
    "fallback": false,
    "responseLength": 247,
    "timestamp": "2025-01-31T..."
  }
}
```

## What Happens Next?

When you start the API for the first time:

1. **Document Discovery**: Scans your `data/` directory for Markdown files
2. **Content Processing**: Extracts text and metadata from each document
3. **Chunking**: Splits large documents into optimal-sized pieces
4. **Embedding Generation**: Creates AI vectors using Google Gemini
5. **Index Storage**: Saves everything to `index_storage/` for future use
6. **Server Ready**: API becomes available for queries

### Incremental Updates

On subsequent starts, the API is smart:

- ✅ **Fast Startup**: Skips processing if no files changed
- ✅ **Selective Updates**: Only re-processes modified documents
- ✅ **Change Detection**: Uses file hashing to detect modifications
- ✅ **Partial Indexing**: Adds new files without rebuilding everything

## Next Steps

Now that your API is running:

1. **[Explore the API Reference](./api-reference)** - Learn about all available endpoints
2. **[Configure Advanced Settings](./configuration)** - Customize behavior for your needs
3. **[Check Integration Examples](./examples)** - See how to use the API in real applications
4. **[Understanding Architecture](./architecture)** - Deep dive into how it all works

## Troubleshooting

### Common Issues

**❌ API Keys Missing**
```bash
Error: GEMINI_API_KEY environment variable is not set.
```
**✅ Solution**: Check your `.env` file exists and contains the required keys.

**❌ Import Errors**
```bash
Cannot find module './services/something'
```
**✅ Solution**: This is a TypeScript ESM project. Ensure you're using Node.js 18+ and all imports include `.js` extensions.

**❌ No Documents Found**
```bash
[VECTOR_STORE] Found 0 documents to process
```
**✅ Solution**: Add `.md` or `.mdx` files to the `apps/api/data/` directory.

**❌ PocketFlow Unavailable**
```bash
PocketFlow workflow failed, using fallback
```
**✅ Solution**: This is normal behavior. The system automatically uses the traditional vector store when PocketFlow is unavailable.

### Getting Help

- Check the **[Configuration Guide](./configuration)** for environment variables
- Review **[Architecture Documentation](./architecture)** for system understanding
- Browse **[Integration Examples](./examples)** for implementation patterns

---

🎉 **Congratulations!** Your DocsRAG API is now ready to provide intelligent answers from your documentation.
