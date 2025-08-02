import { getEnvironmentConfig } from '../config/index.js';
import { CustomVectorStore } from './customVectorStore.js';
import { PocketFlowRAGService } from './pocketFlowRAG.js';
import { GeminiService } from './gemini.js';
import { QueryProcessor } from './queryProcessor.js';
import { LOG_PREFIXES } from '../constants.js';

export class VectorStoreService {
  private vectorStore: CustomVectorStore;
  private pocketFlowRAG: PocketFlowRAGService | null = null;
  private initialized = false;

  constructor() {
    const config = getEnvironmentConfig();
    this.vectorStore = new CustomVectorStore(
      config.dataDir,
      config.indexStorageDir
    );
  }

  /**
   * Initialize the vector store and PocketFlow RAG service
   */
  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    
    // Initialize PocketFlow RAG service
    try {
      const geminiService = new GeminiService();
      const queryProcessor = new QueryProcessor();
      this.pocketFlowRAG = new PocketFlowRAGService(
        geminiService,
        this.vectorStore,
        queryProcessor
      );
      console.log(`${LOG_PREFIXES.APP} PocketFlow RAG service initialized`);
    } catch (error) {
      console.warn(`${LOG_PREFIXES.APP} Failed to initialize PocketFlow RAG service:`, error);
    }
    
    this.initialized = true;
  }

  /**
   * Get the index (for compatibility with the existing interface)
   */
  getIndex(): any {
    return this.initialized ? {} : null;
  }

  /**
   * Query using PocketFlow RAG service with enhanced capabilities
   */
  async query(queryText: string): Promise<{
    response: string;
    metadata?: any;
  }> {
    if (!this.pocketFlowRAG) {
      console.warn(`${LOG_PREFIXES.APP} PocketFlow not available, falling back to traditional approach`);
      const response = await this.vectorStore.query(queryText);
      return {
        response,
        metadata: { fallback: true, approach: 'traditional' }
      };
    }

    return await this.pocketFlowRAG.query(queryText);
  }

  /**
   * Check if PocketFlow is available
   */
  isPocketFlowAvailable(): boolean {
    return this.pocketFlowRAG !== null;
  }
}
