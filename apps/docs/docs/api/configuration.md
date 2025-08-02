---
title: Configuration
description: Environment setup and configuration options for the DocsRAG API
sidebar_position: 5
---

# Configuration Guide

Comprehensive guide to configuring the DocsRAG API for your specific needs and deployment requirements.

## Environment Variables

The API uses environment variables for configuration. Create a `.env` file in the `apps/api/` directory.

### Required Variables

These variables must be set for the API to function:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `GEMINI_API_KEY` | Google Gemini AI API key | [Get from Google AI Studio](https://ai.google.dev/) |
| `OPENAI_API_KEY` | OpenAI API key (fallback scenarios) | [Get from OpenAI Platform](https://platform.openai.com/) |

### Optional Variables

These variables have sensible defaults but can be customized:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port number |
| `DATA_DIR` | `data` | Directory containing documents to index |
| `INDEX_STORAGE_DIR` | `index_storage` | Directory for vector storage files |

### Example Configuration

```bash title="apps/api/.env"
# Required API Keys
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional Configuration
PORT=3001
DATA_DIR=data
INDEX_STORAGE_DIR=index_storage
```

## API Key Setup

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new project or select existing one
4. Navigate to "Get API Key"
5. Generate a new API key
6. Copy the key to your `.env` file

:::tip Free Tier
Google Gemini offers a generous free tier suitable for development and small-scale production use. Check current limits at [Google AI pricing](https://ai.google.dev/pricing).
:::

### Getting an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in the dashboard
4. Create a new secret key
5. Copy the key to your `.env` file

:::note OpenAI Usage
The OpenAI key is primarily used for fallback scenarios and enhanced query processing. While required, actual usage may be minimal depending on your PocketFlow configuration.
:::

## Directory Structure Configuration

### Document Directory (`DATA_DIR`)

Configure where the API looks for your documentation files:

```bash
# Default structure
apps/api/data/
├── getting-started.md
├── tutorials/
│   ├── basic-setup.md
│   └── advanced-configuration.md
├── reference/
│   └── api-endpoints.md
└── guides/
    ├── deployment.md
    └── troubleshooting.md
```

**Supported File Types:**
- `.md` - Standard Markdown files
- `.mdx` - MDX files with React components

**Directory Features:**
- **Nested Structure**: Organize files in subdirectories
- **Automatic Discovery**: Files are found recursively
- **Path Preservation**: Directory structure is maintained in metadata

### Custom Document Directory

To use a different directory for your documents:

```bash title=".env"
DATA_DIR=/path/to/your/docs
# or relative path
DATA_DIR=../shared-docs
```

### Index Storage Directory (`INDEX_STORAGE_DIR`)

Configure where vector embeddings and metadata are stored:

```bash
# Default structure
apps/api/index_storage/
├── documents.json       # Processed document chunks
├── embeddings.json      # Vector embeddings
└── file_hashes.json     # Change detection metadata
```

**Storage Considerations:**
- **Size**: Approximately 1MB per 100 documents
- **Backup**: Include in your backup strategy
- **Permissions**: Ensure write access for the API process
- **Persistence**: Data persists between server restarts

### Custom Storage Directory

```bash title=".env"
INDEX_STORAGE_DIR=/var/lib/docsrag/storage
# or relative path
INDEX_STORAGE_DIR=../shared-storage
```

## Server Configuration

### Port Configuration

Change the server port if 3001 is already in use:

```bash title=".env"
PORT=8080
```

The API will be available at `http://localhost:8080`

### Multiple Environment Setup

For different environments (development, staging, production):

```bash title="apps/api/.env.development"
GEMINI_API_KEY=dev_key_here
OPENAI_API_KEY=dev_key_here
PORT=3001
DATA_DIR=data/development
INDEX_STORAGE_DIR=index_storage_dev
```

```bash title="apps/api/.env.production"
GEMINI_API_KEY=prod_key_here
OPENAI_API_KEY=prod_key_here
PORT=80
DATA_DIR=/opt/docsrag/docs
INDEX_STORAGE_DIR=/opt/docsrag/storage
```

## Document Processing Configuration

### Frontmatter Support

The API supports YAML frontmatter in your Markdown files for enhanced metadata:

```markdown title="example-doc.md"
---
title: "API Configuration Guide"
description: "How to configure the DocsRAG API"
sidebar_position: 2
tags: ["configuration", "setup", "api"]
category: "guides"
authors: ["developer-team"]
last_updated: "2025-01-31"
---

# Your document content here
```

**Supported Frontmatter Fields:**
- `title`: Document title (overrides filename)
- `description`: Document description
- `sidebar_position`: Ordering hint for navigation
- `sidebar_label`: Custom label for navigation
- `tags`: Array of tags for categorization
- `category`: Document category
- `authors`: Array of author names
- `last_updated`: Last modification date

### Content Processing Rules

**Markdown Processing:**
- Headers (H1-H6) are used for document structure
- Code blocks preserve language hints for syntax highlighting
- Links are automatically processed for Docusaurus compatibility
- Images and assets are referenced relatively

**Chunking Strategy:**
- Documents are split at header boundaries when possible
- Large sections are further divided at paragraph breaks
- Code blocks are kept intact within chunks
- Optimal chunk size: 500-1500 tokens

## Performance Configuration

### Memory Optimization

For large document sets, consider these optimizations:

```bash title=".env"
# Process documents in smaller batches
NODE_OPTIONS="--max-old-space-size=2048"

# Custom data directory for better organization
DATA_DIR=optimized-docs
```

### Batch Processing

The API processes documents in batches to manage memory usage:

- **Default Batch Size**: 10 documents
- **Memory per Document**: ~1-2MB during processing
- **Concurrent Processing**: 3-5 documents simultaneously

## Development Configuration

### Debug Mode

Enable detailed logging for development:

```bash title=".env.development"
NODE_ENV=development
DEBUG=docsrag:*
```

### Hot Reload Setup

For development with automatic restart on changes:

```json title="apps/api/package.json"
{
  "scripts": {
    "dev": "NODE_OPTIONS='--no-warnings --experimental-fetch' tsx watch src/index.ts",
    "start": "NODE_OPTIONS='--no-warnings --experimental-fetch' tsx watch src/index.ts"
  }
}
```

## Production Configuration

### Security Settings

For production deployment:

```bash title=".env.production"
NODE_ENV=production

# Restrict CORS origins
CORS_ORIGINS=https://yourdomain.com,https://docs.yourdomain.com

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Security headers
SECURITY_HEADERS=true
```

### Process Management

Use a process manager like PM2 for production:

```javascript title="ecosystem.config.js"
module.exports = {
  apps: [{
    name: 'docsrag-api',
    script: 'apps/api/src/index.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: 'logs/api-error.log',
    out_file: 'logs/api-out.log',
    log_file: 'logs/api-combined.log',
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

### Resource Limits

Configure resource limits for production:

```bash title=".env.production"
# Memory limits
NODE_OPTIONS="--max-old-space-size=1024"

# File descriptor limits
ulimit -n 4096

# Process limits
MAX_CONCURRENT_QUERIES=10
```

## Docker Configuration

### Dockerfile

```dockerfile title="apps/api/Dockerfile"
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Create directories
RUN mkdir -p data index_storage

# Expose port
EXPOSE 3001

# Start application
CMD ["pnpm", "start"]
```

### Docker Compose

```yaml title="docker-compose.yml"
version: '3.8'

services:
  docsrag-api:
    build: ./apps/api
    ports:
      - "3001:3001"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATA_DIR=/app/data
      - INDEX_STORAGE_DIR=/app/storage
    volumes:
      - ./docs:/app/data:ro
      - docsrag_storage:/app/storage
    restart: unless-stopped

volumes:
  docsrag_storage:
```

## Health Check Configuration

### Endpoint Configuration

The health check endpoint provides detailed status:

```typescript
// Health check response structure
{
  status: 'healthy' | 'initializing' | 'error',
  services: {
    vectorStore: boolean,
    pocketFlow: boolean,
    gemini: boolean,
    cors: boolean
  },
  endpoints: {
    '/query': 'description',
    '/health': 'description'
  }
}
```

### Monitoring Integration

Integrate with monitoring tools:

```bash title=".env.production"
# Health check URL for monitoring
HEALTH_CHECK_URL=http://localhost:3001/health

# Metrics endpoint
METRICS_ENABLED=true
METRICS_PORT=9090
```

## Troubleshooting Configuration

### Common Configuration Issues

**Environment Variables Not Loading:**
```bash
# Verify .env file location
ls -la apps/api/.env

# Check file contents
cat apps/api/.env

# Verify Node.js can read the file
node -e "require('dotenv').config({path: 'apps/api/.env'}); console.log(process.env.GEMINI_API_KEY)"
```

**Port Already in Use:**
```bash
# Check what's using the port
lsof -i :3001

# Use a different port
echo "PORT=3002" >> apps/api/.env
```

**Permission Issues:**
```bash
# Fix directory permissions
chmod -R 755 apps/api/data
chmod -R 755 apps/api/index_storage

# Check write access
touch apps/api/index_storage/test.json && rm apps/api/index_storage/test.json
```

### Validation Scripts

Create a configuration validation script:

```typescript title="apps/api/scripts/validate-config.ts"
import { getEnvironmentConfig } from '../src/config/environment.js';

try {
  const config = getEnvironmentConfig();
  console.log('✅ Configuration valid');
  console.log(`Port: ${config.port}`);
  console.log(`Data directory: ${config.dataDir}`);
  console.log(`Storage directory: ${config.indexStorageDir}`);
  console.log(`Gemini API key: ${config.geminiApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`OpenAI API key: ${config.openaiApiKey ? '✅ Set' : '❌ Missing'}`);
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}
```

---

Proper configuration ensures optimal performance and reliability. For deployment-specific questions, check our [deployment examples](./examples#deployment-examples) or [architecture documentation](./architecture).
