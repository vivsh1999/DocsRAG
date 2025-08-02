import { Hono } from 'hono';
import { PocketFlowRAGService } from '../services/pocketFlowRAG.js';
import { LOG_PREFIXES } from '../constants.js';
import type { QueryRequest, QueryResponse, ErrorResponse } from '../types/index.js';

// Enhanced query response type for PocketFlow
interface EnhancedQueryResponse extends QueryResponse {
  metadata?: {
    queryAnalysis?: {
      intent: string;
      confidence: number;
      expansions: number;
    };
    searchMetadata?: {
      documentsFound: number;
      topRelevance: number;
    };
    responseLength: number;
    timestamp: string;
    approach?: string;
    fallback?: boolean;
    error?: boolean;
    message?: string;
  };
}

export function createQueryRoutes(pocketFlowService: PocketFlowRAGService) {
  const app = new Hono();

  app.get('/', (c) => {
    return c.json({ 
      message: 'API is running',
      features: {
        pocketFlowRAG: true,
        cors: true,
        docusaurusLinks: true,
        llmFallback: true,
        enhancedAnalytics: true
      }
    });
  });

  // Main query endpoint powered by PocketFlow
  app.post('/query', async (c) => {
    try {
      const body = await c.req.json() as QueryRequest;
      const { query } = body;

      if (!query) {
        const errorResponse: ErrorResponse = {
          error: 'Query parameter "query" is missing in the request body.'
        };
        return c.json(errorResponse, 400);
      }

      console.log(`${LOG_PREFIXES.API} Received query: "${query}"`);

      const result = await pocketFlowService.query(query);

      console.log(`${LOG_PREFIXES.API} Generated response: ${result.response.substring(0, Math.min(result.response.length, 200))}...`);

      const enhancedResponse: EnhancedQueryResponse = {
        response: result.response,
        metadata: {
          ...result.metadata,
          responseLength: result.response.length,
          timestamp: new Date().toISOString(),
          approach: 'pocketflow'
        }
      };

      return c.json(enhancedResponse);
    } catch (error: any) {
      console.error(`${LOG_PREFIXES.API} Error handling query:`, error);
      const errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        details: error.message
      };
      return c.json(errorResponse, 500);
    }
  });

  // Health check endpoint with detailed status
  app.get('/health', (c) => {
    return c.json({
      status: 'healthy',
      services: {
        vectorStore: true,
        pocketFlow: true,
        gemini: true,
        cors: true
      },
      endpoints: {
        '/query': 'PocketFlow enhanced RAG query with metadata',
        '/health': 'Service health check'
      }
    });
  });

  return app;
}
