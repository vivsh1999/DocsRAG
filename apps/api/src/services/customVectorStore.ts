import * as fs from 'fs';
import * as path from 'path';
import { GeminiService } from './gemini.js';
import { DocumentProcessor } from './documentProcessor.js';
import { QueryProcessor } from './queryProcessor.js';
import { 
  getFileContentHash, 
  loadStoredFileHashes, 
  saveStoredFileHashes,
  findMarkdownFiles,
  ensureDirectoryExists 
} from '../utils/index.js';
import { STORAGE_FILES, LOG_PREFIXES } from '../constants.js';
import type { EnhancedDocumentMetadata, DocumentChunk } from '../types/index.js';

interface Document {
  id: string;
  text: string;
  metadata: EnhancedDocumentMetadata;
}

interface StoredDocument {
  id: string;
  text: string;
  metadata: EnhancedDocumentMetadata;
}

interface DocumentEmbeddings {
  [documentId: string]: number[];
}

interface QueryResult {
  document: StoredDocument;
  similarity: number;
}

export class CustomVectorStore {
  private documents: Map<string, StoredDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private geminiService: GeminiService;
  private documentProcessor: DocumentProcessor;
  private queryProcessor: QueryProcessor;
  private readonly dataDir: string;
  private readonly indexStorageDir: string;
  private readonly fileHashesPath: string;
  private readonly documentsPath: string;
  private readonly embeddingsPath: string;

  constructor(dataDir: string, indexStorageDir: string) {
    this.geminiService = new GeminiService();
    this.documentProcessor = new DocumentProcessor();
    this.queryProcessor = new QueryProcessor();
    this.dataDir = dataDir;
    this.indexStorageDir = indexStorageDir;
    this.fileHashesPath = path.join(this.indexStorageDir, STORAGE_FILES.FILE_HASHES);
    this.documentsPath = path.join(this.indexStorageDir, 'documents.json');
    this.embeddingsPath = path.join(this.indexStorageDir, 'embeddings.json');
  }

  /**
   * Initialize the vector store by loading existing data or building from scratch
   */
  async initialize(): Promise<void> {
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Initializing custom vector store...`);

    ensureDirectoryExists(this.indexStorageDir);

    const { currentDocuments, currentFileHashes } = await this.scanCurrentDocuments();

    if (await this.tryLoadExistingIndex()) {
      await this.performIncrementalUpdate(currentDocuments, currentFileHashes);
    } else {
      await this.buildIndexFromScratch(currentDocuments, currentFileHashes);
    }

    console.log(`${LOG_PREFIXES.VECTOR_STORE} Custom vector store initialization complete.`);
  }

  /**
   * Public method to search documents (used by PocketFlow)
   */
  async searchDocuments(queryText: string, topK: number = 5): Promise<QueryResult[]> {
    if (this.documents.size === 0) {
      throw new Error('Vector store not initialized or empty');
    }

    console.log(`${LOG_PREFIXES.VECTOR_STORE} Searching documents for: "${queryText}"`);
    
    // Perform vector similarity search
    const results = await this.vectorSearch(queryText, topK);
    
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Found ${results.length} relevant documents`);
    return results;
  }

  /**
   * Perform vector similarity search
   */
  private async vectorSearch(queryText: string, topK: number): Promise<QueryResult[]> {
    // Get embedding for query
    const queryEmbedding = await this.geminiService.getTextEmbedding(queryText);

    // Calculate similarities and get top results
    const results: QueryResult[] = [];
    
    for (const doc of this.documents.values()) {
      const docEmbedding = this.embeddings.get(doc.id);
      if (docEmbedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        results.push({ document: doc, similarity });
      }
    }

    // Sort by similarity and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Public method for PocketFlow to generate responses with sources
   */
  async generateResponseWithSources(queryText: string, results: QueryResult[], intent?: any): Promise<string> {
    // Build enhanced context for the response
    const context = this.buildContextFromResults(results);
    
    // Create enhanced prompt that emphasizes using exact URLs from metadata
    const prompt = this.buildEnhancedPromptWithURLInstructions(queryText, context, intent);
    
    try {
      const response = await this.geminiService.generateText(prompt);
      
      // Always include sources section
      const sources = this.buildMarkdownSourcesSection(results);
      
      return `${response}\n\n---\n\n${sources}`;
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Error generating response with sources:`, error);
      
      // Fallback to formatted context return
      return this.buildFallbackMarkdownResponse(results, queryText);
    }
  }

  /**
   * Build enhanced prompt that instructs LLM to use exact URLs from metadata
   */
  private buildEnhancedPromptWithURLInstructions(query: string, context: string, intent?: any): string {
    const basePrompt = `You are a helpful documentation assistant. Answer the user's question based ONLY on the provided documentation context.

CRITICAL URL INSTRUCTIONS:
- NEVER create or generate your own URLs or links
- When referencing documents, you may only use the exact URLs provided in the document metadata
- If you see frontend_url in the metadata, use that exact URL for links
- DO NOT convert relative paths like "./api/troubleshooting" to URLs - these are not valid URLs
- DO NOT create links like "/docs/troubleshooting" unless that exact URL is in the metadata
- If no frontend_url is provided in metadata, do not create links

User's question: "${query}"

Documentation context:
${context}

Instructions:
- Provide a helpful, accurate answer based on the documentation
- Use proper markdown formatting with headings (##, ###), code blocks, and lists
- Be specific and include relevant details from the documentation
- If you reference a document, use the exact frontend_url from its metadata if available
- Do not create or invent any URLs that are not explicitly provided in the metadata
- Focus on being helpful while staying strictly within the provided documentation`;

    // Customize based on intent if provided
    if (intent?.type === 'troubleshooting') {
      return basePrompt + `

This is a troubleshooting question, so focus on:
- Step-by-step solutions and debugging approaches
- Common causes and fixes
- Specific error handling
- Prevention strategies`;
    }

    return basePrompt;
  }

  /**
   * Build context string from search results
   */
  private buildContextFromResults(results: QueryResult[]): string {
    return results.map((result, index) => {
      const doc = result.document;
      const section = doc.metadata.section ? ` - ${doc.metadata.section}` : '';
      return `[Document ${index + 1}] ${doc.metadata.file_name}${section}:\n${doc.text}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Build sources section for the response
   */
  private buildSourcesSection(results: QueryResult[]): string {
    const sources = results.map((result, index) => {
      const doc = result.document;
      const fileName = doc.metadata.file_name;
      const section = doc.metadata.section ? ` (${doc.metadata.section})` : '';
      const similarity = (result.similarity * 100).toFixed(1);
      
      // Use the stored frontend URL if available
      if (doc.metadata.frontend_url) {
        return `${index + 1}. **[${fileName}](${doc.metadata.frontend_url})${section}** (${similarity}% match)`;
      } else {
        return `${index + 1}. **${fileName}${section}** (${similarity}% match)`;
      }
    });
    
    return `**Sources:**\n${sources.join('\n')}`;
  }

  /**
   * Convert file path to Docusaurus URL (docs only)
   */
  private convertToDocusaurusUrl(filePath: string): string {
    // Remove the 'data/' prefix and file extension
    let docPath = filePath.replace(/^data\//, '').replace(/\.(md|mdx)$/, '');
    
    // Handle special cases
    if (docPath === 'intro') {
      return '/docs/intro';
    }
    
    if (docPath === 'index') {
      return '/docs';
    }
    
    // Handle nested index files (e.g., api-reference/internal/index -> /docs/api-reference/internal)
    if (docPath.endsWith('/index')) {
      docPath = docPath.replace('/index', '');
    }
    
    // Clean up any double slashes
    docPath = docPath.replace(/\/+/g, '/');
    
    // Handle regular docs
    return `/docs/${docPath}`;
  }

  /**
   * Build enhanced markdown sources section with proper Docusaurus links
   */
  private buildMarkdownSourcesSection(results: QueryResult[]): string {
    const sources = results.map((result, index) => {
      const doc = result.document;
      const fileName = doc.metadata.file_name;
      const section = doc.metadata.section ? ` - ${doc.metadata.section}` : '';
      const category = doc.metadata.category ? ` \`${doc.metadata.category}\`` : '';
      const similarity = (result.similarity * 100).toFixed(1);
      const filePath = doc.metadata.file_path.replace(/.*\/data\//, 'data/');
      
      // Use the stored frontend URL if available, otherwise fallback to conversion
      const docusaurusUrl = doc.metadata.frontend_url || this.convertToDocusaurusUrl(filePath);
      
      return `${index + 1}. **[${section}](${docusaurusUrl})**${category}
   - 📍 File Path: \`${filePath}\`
   - 🎯 Relevance: ${similarity}%`;
    });
    
    return `## 📚 Sources

${sources.join('\n\n')}

> These sources were used to generate the above response. Click on any file name to view the original documentation.`;
  }

  /**
   * Build fallback markdown response when AI generation fails
   */
  private buildFallbackMarkdownResponse(results: QueryResult[], query: string): string {
    const context = this.buildFormattedContextFromResults(results);
    const sources = this.buildMarkdownSourcesSection(results);
    
    return `## 📖 Documentation Content

Based on your query: **"${query}"**

${context}

---

${sources}`;
  }

  /**
   * Build formatted context from search results for fallback
   */
  private buildFormattedContextFromResults(results: QueryResult[]): string {
    return results.map((result, index) => {
      const doc = result.document;
      const section = doc.metadata.section ? ` - ${doc.metadata.section}` : '';
      const fileName = doc.metadata.file_name;
      
      return `### ${index + 1}. ${fileName}${section}

${doc.text}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Scan the data directory for current documents
   */
  private async scanCurrentDocuments(): Promise<{ currentDocuments: DocumentChunk[], currentFileHashes: Map<string, string> }> {
    const currentMarkdownFiles = findMarkdownFiles(this.dataDir);
    const currentDocuments: DocumentChunk[] = [];
    const currentFileHashes: Map<string, string> = new Map();

    console.log(`${LOG_PREFIXES.VECTOR_STORE} Scanning documents from: ${this.dataDir}`);
    
    for (const filePath of currentMarkdownFiles) {
      try {
        const fileHash = getFileContentHash(filePath);
        currentFileHashes.set(filePath, fileHash);

        // Use DocumentProcessor to create enhanced chunks
        const chunks = await this.documentProcessor.processMarkdownFile(filePath);
        currentDocuments.push(...chunks);
        
      } catch (error) {
        console.error(`${LOG_PREFIXES.VECTOR_STORE} Error loading file ${filePath}:`, error);
      }
    }

    console.log(`${LOG_PREFIXES.VECTOR_STORE} Found ${currentMarkdownFiles.length} markdown files with ${currentDocuments.length} total chunks.`);
    return { currentDocuments, currentFileHashes };
  }

  /**
   * Try to load existing index from storage
   */
  private async tryLoadExistingIndex(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.documentsPath) || !fs.existsSync(this.embeddingsPath)) {
        console.log(`${LOG_PREFIXES.VECTOR_STORE} No existing index found. Building from scratch.`);
        return false;
      }

      // Load documents
      const documentsData = fs.readFileSync(this.documentsPath, 'utf8');
      const storedDocuments: StoredDocument[] = JSON.parse(documentsData);

      // Load embeddings
      const embeddingsData = fs.readFileSync(this.embeddingsPath, 'utf8');
      const storedEmbeddings: DocumentEmbeddings = JSON.parse(embeddingsData);

      this.documents.clear();
      this.embeddings.clear();
      
      for (const doc of storedDocuments) {
        this.documents.set(doc.id, doc);
      }

      for (const [docId, embedding] of Object.entries(storedEmbeddings)) {
        this.embeddings.set(docId, embedding);
      }

      console.log(`${LOG_PREFIXES.VECTOR_STORE} Loaded ${this.documents.size} documents and ${this.embeddings.size} embeddings from storage.`);
      return true;
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Error loading existing index:`, error);
      return false;
    }
  }

  /**
   * Build index from scratch
   */
  private async buildIndexFromScratch(currentDocuments: DocumentChunk[], currentFileHashes: Map<string, string>): Promise<void> {
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Building index from scratch...`);

    this.documents.clear();
    this.embeddings.clear();

    // Filter out empty documents
    const validDocuments = currentDocuments.filter(doc => doc.text && doc.text.trim().length > 0);
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Processing ${validDocuments.length} valid documents out of ${currentDocuments.length} total`);

    // Process documents in batches to avoid API limits
    const batchSize = 10; // Reduced batch size for more reliable processing
    
    for (let i = 0; i < validDocuments.length; i += batchSize) {
      const batch = validDocuments.slice(i, i + batchSize);
      console.log(`${LOG_PREFIXES.VECTOR_STORE} Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validDocuments.length / batchSize)}`);

      try {
        // Get embeddings for the batch
        const texts = batch.map(doc => doc.text);
        const embeddings = await this.geminiService.getTextEmbeddings(texts);

        // Only store documents that got embeddings successfully
        for (let j = 0; j < Math.min(batch.length, embeddings.length); j++) {
          const doc = batch[j];
          const embedding = embeddings[j];
          
          if (embedding && embedding.length > 0) {
            const storedDoc: StoredDocument = {
              id: doc.id,
              text: doc.text,
              metadata: doc.metadata,
            };
            this.documents.set(doc.id, storedDoc);
            this.embeddings.set(doc.id, embedding);
          } else {
            console.warn(`${LOG_PREFIXES.VECTOR_STORE} Skipping document with invalid embedding: ${doc.id}`);
          }
        }
      } catch (error) {
        console.error(`${LOG_PREFIXES.VECTOR_STORE} Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Continue with next batch
        continue;
      }

      // Add delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await this.saveIndex();
    saveStoredFileHashes(currentFileHashes, this.fileHashesPath);
    
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Built index with ${this.documents.size} documents and ${this.embeddings.size} embeddings.`);
  }

  /**
   * Perform incremental update
   */
  private async performIncrementalUpdate(currentDocuments: DocumentChunk[], currentFileHashes: Map<string, string>): Promise<void> {
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Checking for document changes...`);

    const storedFileHashes = loadStoredFileHashes(this.fileHashesPath);
    const documentsToInsert: DocumentChunk[] = [];
    const documentIdsToDelete: string[] = [];
    const documentsToUpdate: DocumentChunk[] = [];

    // For incremental updates, we need to check by file path rather than chunk ID
    // since chunking strategy might change
    const currentFilesPaths = new Set(currentDocuments.map(d => d.metadata.file_path));
    const storedFilePaths = new Set();
    
    // Collect all stored file paths
    for (const doc of this.documents.values()) {
      storedFilePaths.add(doc.metadata.file_path);
    }

    // Find files that were deleted
    for (const storedFilePath of storedFilePaths) {
      if (!currentFilesPaths.has(storedFilePath as string)) {
        // Remove all chunks from this file
        const chunksToDelete = Array.from(this.documents.values())
          .filter(d => d.metadata.file_path === storedFilePath)
          .map(d => d.id);
        documentIdsToDelete.push(...chunksToDelete);
      }
    }

    // Find files that were updated or are new
    for (const filePath of currentFilesPaths) {
      const storedHash = storedFileHashes.get(filePath);
      const currentHash = currentFileHashes.get(filePath);
      
      if (!storedHash) {
        // New file - add all chunks
        const newChunks = currentDocuments.filter(d => d.metadata.file_path === filePath);
        documentsToInsert.push(...newChunks);
      } else if (currentHash !== storedHash) {
        // Updated file - remove old chunks and add new ones
        const oldChunks = Array.from(this.documents.values())
          .filter(d => d.metadata.file_path === filePath)
          .map(d => d.id);
        documentIdsToDelete.push(...oldChunks);
        
        const newChunks = currentDocuments.filter(d => d.metadata.file_path === filePath);
        documentsToInsert.push(...newChunks);
      }
    }

    console.log(`${LOG_PREFIXES.VECTOR_STORE} Changes: ${documentsToInsert.length} new, ${documentIdsToDelete.length} deleted`);

    if (documentsToInsert.length === 0 && documentIdsToDelete.length === 0) {
      console.log(`${LOG_PREFIXES.VECTOR_STORE} No changes detected.`);
      return;
    }

    // Apply deletions
    for (const docId of documentIdsToDelete) {
      this.documents.delete(docId);
      this.embeddings.delete(docId);
      console.log(`${LOG_PREFIXES.VECTOR_STORE} Deleted: ${docId}`);
    }

    // Process new/updated documents
    if (documentsToInsert.length > 0) {
      const texts = documentsToInsert.map(doc => doc.text);
      const embeddings = await this.geminiService.getTextEmbeddings(texts);

      for (let i = 0; i < documentsToInsert.length; i++) {
        const doc = documentsToInsert[i];
        const storedDoc: StoredDocument = {
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
        };
        this.documents.set(doc.id, storedDoc);
        this.embeddings.set(doc.id, embeddings[i]);
        
        console.log(`${LOG_PREFIXES.VECTOR_STORE} Inserted: ${doc.id}`);
      }
    }

    await this.saveIndex();
    saveStoredFileHashes(currentFileHashes, this.fileHashesPath);
  }

  /**
   * Save the index to storage
   */
  private async saveIndex(): Promise<void> {
    // Save documents
    const documentsArray = Array.from(this.documents.values());
    fs.writeFileSync(this.documentsPath, JSON.stringify(documentsArray));
    
    // Save embeddings
    const embeddingsObject: DocumentEmbeddings = {};
    for (const [docId, embedding] of this.embeddings.entries()) {
      embeddingsObject[docId] = embedding;
    }
    fs.writeFileSync(this.embeddingsPath, JSON.stringify(embeddingsObject));
    
    console.log(`${LOG_PREFIXES.VECTOR_STORE} Index saved to storage (documents: ${this.documents.size}, embeddings: ${this.embeddings.size}).`);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
