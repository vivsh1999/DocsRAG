---
title: Integration Examples
description: Real-world examples of integrating the DocsRAG API into applications
sidebar_position: 6
---

# Integration Examples

Practical examples showing how to integrate the DocsRAG API into various applications and use cases.

## Frontend Integration

### React Chat Interface

Build a documentation chat interface with React:

```tsx title="components/DocsChat.tsx"
import React, { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  metadata?: any;
}

export function DocsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="docs-chat">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="content">
              {message.content}
            </div>
            {message.metadata && (
              <div className="metadata">
                <small>
                  Intent: {message.metadata.queryAnalysis?.intent} | 
                  Confidence: {message.metadata.queryAnalysis?.confidence.toFixed(2)} |
                  Approach: {message.metadata.approach}
                </small>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="loading">Thinking...</div>}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about the documentation..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
```

### Vue.js Search Widget

Add intelligent search to a Vue.js documentation site:

```vue title="components/SmartSearch.vue"
<template>
  <div class="smart-search">
    <div class="search-input">
      <input
        v-model="query"
        @input="handleInput"
        @keyup.enter="search"
        placeholder="Search documentation..."
        :disabled="loading"
      />
      <button @click="search" :disabled="loading || !query.trim()">
        Search
      </button>
    </div>

    <div v-if="results" class="search-results">
      <div class="result-info">
        <p><strong>Answer:</strong></p>
        <div v-html="formatMarkdown(results.response)"></div>
        
        <div v-if="results.metadata" class="metadata">
          <small>
            Found {{ results.metadata.searchMetadata?.documentsFound || 0 }} relevant documents
            ({{ results.metadata.approach }} approach)
          </small>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { marked } from 'marked';

const query = ref('');
const results = ref(null);
const loading = ref(false);
const error = ref('');

const search = async () => {
  if (!query.value.trim()) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('http://localhost:3001/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.value })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    results.value = await response.json();
  } catch (err) {
    error.value = `Search failed: ${err.message}`;
    results.value = null;
  } finally {
    loading.value = false;
  }
};

const formatMarkdown = (text: string): string => {
  return marked(text);
};

// Debounced search as user types
let timeout: NodeJS.Timeout;
const handleInput = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    if (query.value.trim().length > 3) {
      search();
    }
  }, 500);
};
</script>
```

## Backend Integration

### Express.js Proxy

Create a proxy server that adds authentication and rate limiting:

```typescript title="server/docsrag-proxy.ts"
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !isValidApiKey(apiKey as string)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Logging middleware
const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// Apply middleware
app.use(express.json());
app.use(limiter);
app.use('/api/docs', authenticate);
app.use('/api/docs', requestLogger);

// Proxy to DocsRAG API
app.use('/api/docs', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/docs': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Request-ID', generateRequestId());
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log response
    console.log(`Response: ${proxyRes.statusCode}`);
  }
}));

function isValidApiKey(key: string): boolean {
  // Implement your API key validation logic
  return process.env.VALID_API_KEYS?.split(',').includes(key) || false;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

app.listen(8080, () => {
  console.log('DocsRAG proxy server running on port 8080');
});
```

### Next.js API Route

Integrate DocsRAG into a Next.js application:

```typescript title="pages/api/search.ts"
import type { NextApiRequest, NextApiResponse } from 'next';

interface QueryRequest {
  query: string;
}

interface QueryResponse {
  response: string;
  metadata?: any;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QueryResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query }: QueryRequest = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Query parameter is required and must be a string' 
    });
  }

  try {
    // Call DocsRAG API
    const response = await fetch('http://localhost:3001/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`DocsRAG API error: ${response.status}`);
    }

    const data = await response.json();

    // Add Next.js specific enhancements
    const enhancedResponse = {
      ...data,
      metadata: {
        ...data.metadata,
        nextjs: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      }
    };

    res.status(200).json(enhancedResponse);
  } catch (error) {
    console.error('DocsRAG query failed:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

## CLI Integration

### Node.js CLI Tool

Create a command-line tool for querying documentation:

```typescript title="cli/docs-query.ts"
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('docs-query')
  .description('Query documentation using DocsRAG API')
  .version('1.0.0');

program
  .command('ask <question>')
  .description('Ask a question about the documentation')
  .option('-v, --verbose', 'Show detailed metadata')
  .option('-u, --url <url>', 'DocsRAG API URL', 'http://localhost:3001')
  .action(async (question: string, options) => {
    const spinner = ora('Searching documentation...').start();

    try {
      const response = await fetch(`${options.url}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      spinner.stop();

      // Display response
      console.log(chalk.blue('\n📚 Answer:'));
      console.log(chalk.white(data.response));

      // Show metadata if verbose
      if (options.verbose && data.metadata) {
        console.log(chalk.gray('\n📊 Metadata:'));
        console.log(chalk.gray(`  Intent: ${data.metadata.queryAnalysis?.intent || 'unknown'}`));
        console.log(chalk.gray(`  Confidence: ${data.metadata.queryAnalysis?.confidence || 'unknown'}`));
        console.log(chalk.gray(`  Approach: ${data.metadata.approach || 'unknown'}`));
        console.log(chalk.gray(`  Documents found: ${data.metadata.searchMetadata?.documentsFound || 'unknown'}`));
      }

    } catch (error) {
      spinner.fail('Query failed');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('health')
  .description('Check DocsRAG API health')
  .option('-u, --url <url>', 'DocsRAG API URL', 'http://localhost:3001')
  .action(async (options) => {
    try {
      const response = await fetch(`${options.url}/health`);
      const data = await response.json();

      console.log(chalk.green('✅ DocsRAG API Status'));
      console.log(`Status: ${data.status}`);
      console.log(`Vector Store: ${data.services.vectorStore ? '✅' : '❌'}`);
      console.log(`PocketFlow: ${data.services.pocketFlow ? '✅' : '❌'}`);
      console.log(`Gemini: ${data.services.gemini ? '✅' : '❌'}`);

    } catch (error) {
      console.error(chalk.red(`❌ Health check failed: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
```

### Bash Script Integration

Simple bash script for documentation queries:

```bash title="scripts/query-docs.sh"
#!/bin/bash

# DocsRAG query script
DOCSRAG_URL="${DOCSRAG_URL:-http://localhost:3001}"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"Your question here\""
    exit 1
fi

QUESTION="$1"

# Make the API call
RESPONSE=$(curl -s -X POST "$DOCSRAG_URL/query" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUESTION\"}")

# Check if curl succeeded
if [ $? -ne 0 ]; then
    echo "Error: Failed to connect to DocsRAG API at $DOCSRAG_URL"
    exit 1
fi

# Extract response using jq
if command -v jq &> /dev/null; then
    echo "📚 Answer:"
    echo "$RESPONSE" | jq -r '.response'
    
    echo ""
    echo "📊 Metadata:"
    echo "  Approach: $(echo "$RESPONSE" | jq -r '.metadata.approach // "unknown"')"
    echo "  Intent: $(echo "$RESPONSE" | jq -r '.metadata.queryAnalysis.intent // "unknown"')"
else
    echo "Response: $RESPONSE"
    echo ""
    echo "Install 'jq' for formatted output: brew install jq"
fi
```

## Webhook Integration

### Discord Bot

Create a Discord bot that answers documentation questions:

```typescript title="bots/discord-docsrag.ts"
import { Client, GatewayIntentBits, Message } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const DOCSRAG_URL = process.env.DOCSRAG_URL || 'http://localhost:3001';
const PREFIX = '!docs';

client.on('messageCreate', async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check for command prefix
  if (!message.content.startsWith(PREFIX)) return;

  const query = message.content.slice(PREFIX.length).trim();
  
  if (!query) {
    await message.reply('Please provide a question. Example: `!docs How do I configure the API?`');
    return;
  }

  // Show typing indicator
  await message.channel.sendTyping();

  try {
    const response = await fetch(`${DOCSRAG_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Format response for Discord (max 2000 characters)
    let reply = `📚 **Answer:**\n${data.response}`;
    
    if (reply.length > 2000) {
      reply = reply.substring(0, 1950) + '...\n\n*Response truncated*';
    }

    if (data.metadata?.approach) {
      reply += `\n\n*Powered by ${data.metadata.approach} RAG*`;
    }

    await message.reply(reply);

  } catch (error) {
    console.error('DocsRAG query failed:', error);
    await message.reply('❌ Sorry, I couldn\'t process your question right now. Please try again later.');
  }
});

client.on('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);
```

### Slack Bot

Integrate with Slack for team documentation support:

```typescript title="bots/slack-docsrag.ts"
import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const DOCSRAG_URL = process.env.DOCSRAG_URL || 'http://localhost:3001';

// Listen for mentions
app.event('app_mention', async ({ event, client, say }) => {
  try {
    // Extract question from mention
    const mention = `<@${event.user}>`;
    const question = event.text.replace(mention, '').trim();

    if (!question) {
      await say('Hi! Ask me anything about our documentation. 📚');
      return;
    }

    // Query DocsRAG
    const response = await fetch(`${DOCSRAG_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Format response with Slack blocks
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📚 Documentation Answer:*\n${data.response}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Approach:* ${data.metadata?.approach || 'unknown'} | *Intent:* ${data.metadata?.queryAnalysis?.intent || 'unknown'}`
            }
          ]
        }
      ]
    });

  } catch (error) {
    console.error('DocsRAG query failed:', error);
    await say('❌ Sorry, I couldn\'t process your question right now. Our documentation system might be temporarily unavailable.');
  }
});

// Slash command
app.command('/docs', async ({ command, ack, respond }) => {
  await ack();

  const question = command.text.trim();

  if (!question) {
    await respond('Please provide a question. Example: `/docs How do I configure the API?`');
    return;
  }

  try {
    const response = await fetch(`${DOCSRAG_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question })
    });

    const data = await response.json();

    await respond({
      response_type: 'in_channel',
      text: `📚 **${question}**\n\n${data.response}`
    });

  } catch (error) {
    await respond('❌ Failed to query documentation. Please try again later.');
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack DocsRAG bot is running!');
})();
```

## Deployment Examples

### Docker Deployment

Complete Docker setup with production optimizations:

```dockerfile title="Dockerfile"
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Build application
RUN cd apps/api && pnpm build

# Production stage
FROM node:18-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=base /app/apps/api/dist ./apps/api/dist

# Create necessary directories
RUN mkdir -p apps/api/data apps/api/index_storage

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "apps/api/dist/index.js"]
```

### Kubernetes Deployment

Kubernetes manifests for scalable deployment:

```yaml title="k8s/deployment.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docsrag-api
  labels:
    app: docsrag-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: docsrag-api
  template:
    metadata:
      labels:
        app: docsrag-api
    spec:
      containers:
      - name: docsrag-api
        image: docsrag/api:latest
        ports:
        - containerPort: 3001
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: docsrag-secrets
              key: gemini-api-key
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: docsrag-secrets
              key: openai-api-key
        - name: DATA_DIR
          value: "/app/data"
        - name: INDEX_STORAGE_DIR
          value: "/app/storage"
        volumeMounts:
        - name: docs-volume
          mountPath: /app/data
          readOnly: true
        - name: storage-volume
          mountPath: /app/storage
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: docs-volume
        configMap:
          name: documentation-content
      - name: storage-volume
        persistentVolumeClaim:
          claimName: docsrag-storage
---
apiVersion: v1
kind: Service
metadata:
  name: docsrag-api-service
spec:
  selector:
    app: docsrag-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Railway Deployment

One-click deployment to Railway:

```json title="railway.json"
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd apps/api && pnpm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

These examples demonstrate various integration patterns. Choose the approach that best fits your architecture and requirements. For more specific use cases, check our [GitHub discussions](https://github.com/your-repo/discussions) or reach out to the community.
