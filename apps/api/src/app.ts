import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { getEnvironmentConfig } from './config/index.js';
import { PocketFlowRAGService } from './services/pocketFlowRAG.js';
import { CustomVectorStore } from './services/customVectorStore.js';
import { GeminiService } from './services/gemini.js';
import { QueryProcessor } from './services/queryProcessor.js';
import { createQueryRoutes } from './routes/index.js';
import { LOG_PREFIXES, CORS_CONFIG } from './constants.js';

/**
 * Main application class that orchestrates the setup and startup
 */
class Application {
  private app: Hono;
  private pocketFlowService: PocketFlowRAGService;
  private vectorStore: CustomVectorStore;
  private config = getEnvironmentConfig();

  constructor() {
    this.app = new Hono();
    
    // Enable CORS for documentation site and development
    this.app.use('*', cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [...CORS_CONFIG.ALLOWED_ORIGINS].filter(origin => !origin.includes('localhost'))
        : [...CORS_CONFIG.ALLOWED_ORIGINS],
      allowMethods: [...CORS_CONFIG.ALLOWED_METHODS],
      allowHeaders: [...CORS_CONFIG.ALLOWED_HEADERS],
    }));
    
    this.vectorStore = new CustomVectorStore(this.config.dataDir, this.config.indexStorageDir);
    
    // Initialize required services for PocketFlow
    const geminiService = new GeminiService();
    const queryProcessor = new QueryProcessor();
    
    this.pocketFlowService = new PocketFlowRAGService(geminiService, this.vectorStore, queryProcessor);
  }

  /**
   * Initializes the application
   */
  async initialize(): Promise<void> {
    console.log(`${LOG_PREFIXES.APP} Initializing application...`);

    // Initialize vector store
    await this.vectorStore.initialize();
    console.log(`${LOG_PREFIXES.APP} PocketFlow RAG service initialized`);
    console.log(`${LOG_PREFIXES.APP} Vector store initialized.`);

    // Setup routes
    this.setupRoutes();
    console.log(`${LOG_PREFIXES.APP} Routes configured.`);
  }

  /**
   * Sets up the application routes
   */
  private setupRoutes(): void {
    const queryRoutes = createQueryRoutes(this.pocketFlowService);
    this.app.route('/', queryRoutes);
  }

  /**
   * Starts the HTTP server
   */
  async start(): Promise<void> {
    console.log(`${LOG_PREFIXES.APP} Starting server on http://localhost:${this.config.port}`);
    
    serve({
      fetch: this.app.fetch,
      port: this.config.port,
    }, (info) => {
      console.log(`${LOG_PREFIXES.APP} Server started on http://localhost:${info.port}`);
    });
  }
}

/**
 * Application bootstrap function
 */
async function bootstrap(): Promise<void> {
  try {
    const app = new Application();
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error(`${LOG_PREFIXES.APP} Failed to start application:`, error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
