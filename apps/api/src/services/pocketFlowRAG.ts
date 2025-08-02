import { Node, Flow } from 'pocketflow';
import { GeminiService } from './gemini.js';
import { CustomVectorStore } from './customVectorStore.js';
import { QueryProcessor } from './queryProcessor.js';
import { LOG_PREFIXES } from '../constants.js';

// Define shared data types for the RAG pipeline
export interface RAGSharedData {
  query?: string;
  intent?: { type: string; confidence: number };
  expandedQueries?: string[];
  searchResults?: any[];
  queryResults?: any[]; // Results from vector store search
  context?: string;
  response?: string;
  metadata?: any;
  error?: Error;
}

// Interface for accessing vector store search capabilities
interface VectorStoreAdapter {
  searchDocuments(query: string, topK: number): Promise<any[]>;
  generateLLMFallback(query: any): Promise<string>;
  generateResponseWithSources(queryText: string, results: any[], intent?: any): Promise<string>;
}

// Adapter to access private methods from CustomVectorStore
class CustomVectorStoreAdapter implements VectorStoreAdapter {
  constructor(private vectorStore: CustomVectorStore) {}

  async searchDocuments(query: string, topK: number): Promise<any[]> {
    // Use the public query method but extract just the search results
    // We'll need to add a public search method to CustomVectorStore
    try {
      // For now, let's use reflection to access the private method
      const searchMethod = (this.vectorStore as any).vectorSearch;
      if (searchMethod) {
        return await searchMethod.call(this.vectorStore, query, topK);
      }
      throw new Error('Search method not available');
    } catch (error) {
      console.warn(`${LOG_PREFIXES.VECTOR_STORE} Adapter search failed:`, error);
      return [];
    }
  }

  async generateLLMFallback(query: any): Promise<string> {
    try {
      const fallbackMethod = (this.vectorStore as any).generateLLMFallbackResponse;
      if (fallbackMethod) {
        return await fallbackMethod.call(this.vectorStore, query);
      }
      throw new Error('LLM fallback method not available');
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Fallback generation failed:`, error);
      return `## ⚠️ Information Not Found

I couldn't find specific information about "${query.original}" in the available documentation.

**What you can try:**
- Check if your question relates to topics covered in our docs
- Rephrase your question using different keywords
- Browse the documentation categories for related topics

*Note: This response uses general knowledge as no specific documentation was found.*`;
    }
  }

  async generateResponseWithSources(queryText: string, results: any[], intent?: any): Promise<string> {
    try {
      const responseMethod = (this.vectorStore as any).generateResponseWithSources;
      if (responseMethod) {
        return await responseMethod.call(this.vectorStore, queryText, results, intent);
      }
      throw new Error('Response with sources method not available');
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Response generation failed:`, error);
      return `## Error generating response

I encountered an error while generating a response with sources. Please try again.`;
    }
  }
}

// Enhanced Query Intent Classification Node
export class QueryIntentNode extends Node<RAGSharedData> {
  constructor(private geminiService: GeminiService) {
    super(3, 0.5); // 3 retries with 0.5s delay
  }

  async prep(shared: RAGSharedData): Promise<string> {
    if (!shared.query) {
      throw new Error('Query is required');
    }
    return shared.query;
  }

  async exec(query: string): Promise<{ type: string; confidence: number }> {
    try {
      return await this.geminiService.classifyQueryIntent(query);
    } catch (error) {
      console.warn(`${LOG_PREFIXES.VECTOR_STORE} Intent classification failed, using fallback`);
      return { type: 'general', confidence: 0.5 };
    }
  }

  async post(
    shared: RAGSharedData,
    prepRes: string,
    execRes: { type: string; confidence: number }
  ): Promise<string> {
    shared.intent = execRes;
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Intent classified: ${execRes.type} (${(execRes.confidence * 100).toFixed(1)}%)`);
    
    // Route to different paths based on intent
    if (execRes.type === 'troubleshooting') {
      return 'troubleshooting';
    } else if (execRes.type === 'example') {
      return 'example';
    } else {
      return 'default';
    }
  }
}

// Query Expansion Node
export class QueryExpansionNode extends Node<RAGSharedData> {
  constructor(private geminiService: GeminiService) {
    super(2, 0.3);
  }

  async prep(shared: RAGSharedData): Promise<string> {
    return shared.query || '';
  }

  async exec(query: string): Promise<string[]> {
    try {
      return await this.geminiService.expandQuery(query);
    } catch (error) {
      console.warn(`${LOG_PREFIXES.VECTOR_STORE} Query expansion failed`);
      return [];
    }
  }

  async post(
    shared: RAGSharedData,
    prepRes: string,
    execRes: string[]
  ): Promise<string> {
    shared.expandedQueries = execRes;
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Query expanded to ${execRes.length} variations`);
    return 'default';
  }
}

// Vector Search Node
export class VectorSearchNode extends Node<RAGSharedData> {
  constructor(private vectorStoreAdapter: VectorStoreAdapter) {
    super(1, 0);
  }

  async prep(shared: RAGSharedData): Promise<{ query: string; expanded: string[] }> {
    return {
      query: shared.query || '',
      expanded: shared.expandedQueries || []
    };
  }

  async exec(input: { query: string; expanded: string[] }): Promise<any[]> {
    // Use both original and expanded queries for search
    const allQueries = [input.query, ...input.expanded];
    const results = [];
    
    for (const query of allQueries) {
      try {
        const queryResults = await this.vectorStoreAdapter.searchDocuments(query, 5);
        results.push(...queryResults);
      } catch (error) {
        console.warn(`${LOG_PREFIXES.VECTOR_STORE} Search failed for query: ${query}`);
      }
    }
    
    // Remove duplicates and return top results
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.document.id === result.document.id)
    );
    
    return uniqueResults.slice(0, 5);
  }

  async post(
    shared: RAGSharedData,
    prepRes: any,
    execRes: any[]
  ): Promise<string> {
    shared.searchResults = execRes;
    shared.queryResults = execRes; // Store for ResponseGenerationNode
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Found ${execRes.length} relevant documents`);
    
    if (execRes.length === 0) {
      return 'no_results';
    } else if (execRes.length >= 3) {
      return 'high_confidence';
    } else {
      return 'low_confidence';
    }
  }
}

// Context Building Node
export class ContextBuildingNode extends Node<RAGSharedData> {
  async prep(shared: RAGSharedData): Promise<any[]> {
    return shared.searchResults || [];
  }

  async exec(results: any[]): Promise<string> {
    if (results.length === 0) {
      return '';
    }

    const context = results.map((result, index) => {
      const doc = result.document;
      const section = doc.metadata.section ? ` (${doc.metadata.section})` : '';
      return `Document ${index + 1}: ${doc.metadata.file_name}${section}\n${doc.text.substring(0, 500)}...`;
    }).join('\n\n');

    return context;
  }

  async post(
    shared: RAGSharedData,
    prepRes: any,
    execRes: string
  ): Promise<string> {
    shared.context = execRes;
    return 'default';
  }
}

// Enhanced Response Generation Node
export class ResponseGenerationNode extends Node<RAGSharedData> {
  constructor(
    private geminiService: GeminiService,
    private queryProcessor: QueryProcessor,
    private vectorStoreAdapter: VectorStoreAdapter
  ) {
    super(3, 1); // 3 retries with 1s delay for response generation
  }

  async prep(shared: RAGSharedData): Promise<{
    query: string;
    context: string;
    intent: any;
  }> {
    return {
      query: shared.query || '',
      context: shared.context || '',
      intent: shared.intent || { type: 'general', confidence: 0.5 }
    };
  }

  async exec(input: { query: string; context: string; intent: any }): Promise<string> {
    if (!input.context) {
      // No context found - this will be handled by fallback node
      throw new Error('No context available for response generation');
    }

    const prompt = this.queryProcessor.buildPrompt(input.query, input.context, input.intent);
    return await this.geminiService.generateText(prompt);
  }

  async post(
    shared: RAGSharedData,
    prepRes: any,
    execRes: string
  ): Promise<string> {
    // Use vector store to generate response with sources if we have query results
    if (shared.queryResults && shared.queryResults.length > 0) {
      const responseWithSources = await this.vectorStoreAdapter.generateResponseWithSources(
        shared.query || '',
        shared.queryResults,
        shared.intent
      );
      shared.response = responseWithSources;
    } else {
      shared.response = execRes;
    }
    return 'default';
  }
}

// LLM Fallback Node for when no documents are found
export class LLMFallbackNode extends Node<RAGSharedData> {
  constructor(private vectorStoreAdapter: VectorStoreAdapter) {
    super(2, 1);
  }

  async prep(shared: RAGSharedData): Promise<{
    query: string;
    intent: any;
  }> {
    return {
      query: shared.query || '',
      intent: shared.intent || { type: 'general', confidence: 0.5 }
    };
  }

  async exec(input: { query: string; intent: any }): Promise<string> {
    // Use the vector store adapter for LLM fallback
    const enhancedQuery = {
      original: input.query,
      intent: input.intent,
      expanded: [] // Will be filled from shared context if needed
    };
    
    return await this.vectorStoreAdapter.generateLLMFallback(enhancedQuery);
  }

  async post(
    shared: RAGSharedData,
    prepRes: any,
    execRes: string
  ): Promise<string> {
    shared.response = execRes;
    return 'default';
  }
}

// Metadata Enhancement Node
export class MetadataEnhancementNode extends Node<RAGSharedData> {
  async prep(shared: RAGSharedData): Promise<any> {
    return {
      query: shared.query,
      intent: shared.intent,
      expandedQueries: shared.expandedQueries,
      searchResults: shared.searchResults,
      response: shared.response
    };
  }

  async exec(input: any): Promise<any> {
    return {
      queryAnalysis: {
        intent: input.intent?.type || 'unknown',
        confidence: input.intent?.confidence || 0,
        expansions: input.expandedQueries?.length || 0
      },
      searchMetadata: {
        documentsFound: input.searchResults?.length || 0,
        topRelevance: input.searchResults?.[0]?.similarity || 0
      },
      responseLength: input.response?.length || 0,
      timestamp: new Date().toISOString()
    };
  }

  async post(
    shared: RAGSharedData,
    prepRes: any,
    execRes: any
  ): Promise<string> {
    shared.metadata = execRes;
    return 'default';
  }
}

// Error Handling Node
export class ErrorHandlingNode extends Node<RAGSharedData> {
  async prep(shared: RAGSharedData): Promise<any> {
    return {
      query: shared.query,
      error: shared.error
    };
  }

  async exec(input: any): Promise<string> {
    const errorMessage = input.error?.message || 'Unknown error occurred';
    
    return `## ⚠️ System Error

I encountered an issue while processing your query: "${input.query}"

**Error Details:** ${errorMessage}

**What you can try:**
- Rephrase your question using different keywords
- Check if your query is related to the available documentation
- Try a simpler, more specific question

If this error persists, please contact support.`;
  }

  async post(
    shared: RAGSharedData,
    prepRes: any,
    execRes: string
  ): Promise<string> {
    shared.response = execRes;
    return 'default';
  }
}

// Enhanced RAG Service using PocketFlow
export class PocketFlowRAGService {
  private ragFlow: Flow<RAGSharedData> | null = null;
  private vectorStoreAdapter: VectorStoreAdapter;

  constructor(
    private geminiService: GeminiService,
    private vectorStore: CustomVectorStore,
    private queryProcessor: QueryProcessor
  ) {
    this.vectorStoreAdapter = new CustomVectorStoreAdapter(vectorStore);
    this.buildRAGFlow();
  }

  private buildRAGFlow(): void {
    // Create nodes
    const intentNode = new QueryIntentNode(this.geminiService);
    const expansionNode = new QueryExpansionNode(this.geminiService);
    const searchNode = new VectorSearchNode(this.vectorStoreAdapter);
    const contextNode = new ContextBuildingNode();
    const responseNode = new ResponseGenerationNode(this.geminiService, this.queryProcessor, this.vectorStoreAdapter);
    const fallbackNode = new LLMFallbackNode(this.vectorStoreAdapter);
    const metadataNode = new MetadataEnhancementNode();
    const errorNode = new ErrorHandlingNode();

    // Build the flow with conditional routing
    intentNode
      .next(expansionNode)
      .next(searchNode)
      .on('no_results', fallbackNode)
      .on('high_confidence', contextNode)
      .on('low_confidence', contextNode);

    contextNode.next(responseNode).next(metadataNode);
    fallbackNode.next(metadataNode);

    // Troubleshooting and example paths can have specialized handling
    intentNode
      .on('troubleshooting', expansionNode) // Same flow but with enhanced prompts
      .on('example', expansionNode);

    // Error handling
    responseNode.on('error', errorNode);
    fallbackNode.on('error', errorNode);

    this.ragFlow = new Flow<RAGSharedData>(intentNode);
  }

  async query(query: string): Promise<{
    response: string;
    metadata?: any;
  }> {
    if (!this.ragFlow) {
      throw new Error('RAG Flow not initialized');
    }

    const shared: RAGSharedData = { query };

    try {
      await this.ragFlow.run(shared);
      
      return {
        response: shared.response || 'No response generated',
        metadata: shared.metadata
      };
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} RAG Flow error:`, error);
      
      // Handle error through error node
      shared.error = error as Error;
      const errorNode = new ErrorHandlingNode();
      await errorNode.run(shared);
      
      return {
        response: shared.response || 'System error occurred',
        metadata: { error: true, message: (error as Error).message }
      };
    }
  }
}
