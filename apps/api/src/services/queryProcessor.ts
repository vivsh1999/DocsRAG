import { GeminiService } from './gemini.js';
import { EnhancedQuery, QueryIntent } from '../types/index.js';
import { LOG_PREFIXES } from '../constants.js';

export class QueryProcessor {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Process a user query to enhance it with additional context
   */
  async processQuery(query: string): Promise<EnhancedQuery> {
    try {
      console.log(`${LOG_PREFIXES.VECTOR_STORE} Processing query: "${query}"`);

      // Run intent classification and query expansion in parallel
      const [intent, expandedQueries] = await Promise.all([
        this.classifyIntent(query),
        this.expandQuery(query)
      ]);

      const filters = this.extractFilters(query);
      const language = this.detectLanguage(query);

      const enhancedQuery: EnhancedQuery = {
        original: query,
        expanded: expandedQueries,
        intent,
        filters,
        language
      };

      console.log(`${LOG_PREFIXES.VECTOR_STORE} Query processed - Intent: ${intent.type}, Expanded: ${expandedQueries.length} variations`);
      
      return enhancedQuery;
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Error processing query:`, error);
      
      // Return basic query on error
      return {
        original: query,
        expanded: [],
        intent: { type: 'general', confidence: 0.5 },
        filters: {},
        language: 'en'
      };
    }
  }

  /**
   * Classify the intent of a query
   */
  private async classifyIntent(query: string): Promise<QueryIntent> {
    try {
      const result = await this.geminiService.classifyQueryIntent(query);
      return {
        type: result.type as QueryIntent['type'],
        confidence: result.confidence
      };
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Error classifying intent:`, error);
      return { type: 'general', confidence: 0.5 };
    }
  }

  /**
   * Expand query with alternative phrasings
   */
  private async expandQuery(query: string): Promise<string[]> {
    try {
      return await this.geminiService.expandQuery(query);
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Error expanding query:`, error);
      return [];
    }
  }

  /**
   * Extract filters from the query text
   */
  private extractFilters(query: string): Record<string, any> {
    const filters: Record<string, any> = {};

    // Extract category filters
    const categoryMatches = query.match(/\b(?:in|about|from)\s+(tutorial|guide|api|reference|workflow|testing)\b/i);
    if (categoryMatches) {
      filters.category = categoryMatches[1].toLowerCase();
    }

    // Extract language filters for code examples
    const langMatches = query.match(/\b(javascript|typescript|python|java|css|html|jsx|tsx|markdown|mdx)\b/i);
    if (langMatches) {
      filters.language = langMatches[1].toLowerCase();
    }

    // Extract file type filters
    const fileTypeMatches = query.match(/\b\.(md|mdx|js|ts|json|yaml|yml)\b/i);
    if (fileTypeMatches) {
      filters.file_type = fileTypeMatches[1].toLowerCase();
    }

    // Extract difficulty level
    const difficultyMatches = query.match(/\b(beginner|basic|advanced|expert)\b/i);
    if (difficultyMatches) {
      filters.difficulty = difficultyMatches[1].toLowerCase();
    }

    return filters;
  }

  /**
   * Detect the language of the query
   */
  private detectLanguage(query: string): string {
    // Simple language detection based on common patterns
    // Could be enhanced with a proper language detection library
    
    // Check for non-English characters
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(query)) {
      return 'other';
    }
    
    // Default to English for now
    return 'en';
  }

  /**
   * Build context-aware prompt for response generation
   */
  buildPrompt(query: string, context: string, intent: QueryIntent): string {
    const basePrompt = `You are a helpful documentation assistant for a Docusaurus-based documentation site. Answer the user's question based ONLY on the provided context from the documentation.

Context from documentation:
${context}

User Question: ${query}

Instructions:
- Provide a clear, accurate answer based only on the provided context
- Use proper markdown formatting throughout your response
- Include relevant code examples with proper syntax highlighting using \`\`\`language blocks
- Use headings (##, ###) to structure your response
- Use bullet points (-) or numbered lists (1.) where appropriate
- Use **bold** for important terms and *italics* for emphasis
- Use \`inline code\` for file names, commands, and short code snippets
- When referencing documentation files, create Docusaurus links:
  - For tutorial files: [text](/docs/tutorial-basics/filename) (without .md extension)
  - For API reference: [text](/docs/api-reference/filename)
  - For guides: [text](/docs/guides/filename) 
  - For general docs: [text](/docs/filename)
- Create proper markdown links [text](url) when referencing external resources
- Use blockquotes (>) for important notes or warnings
- If the context doesn't contain enough information, say so clearly
- Be concise but comprehensive
- Format the response to be easily readable in a chat interface`;

    // Customize based on intent
    switch (intent.type) {
      case 'how-to':
        return basePrompt + `

**Additional Instructions for How-To Responses:**
- Structure your response with clear numbered steps (1., 2., 3., etc.)
- Include any prerequisites or setup steps in a separate section
- Use code blocks with proper syntax highlighting for commands and code
- Include file paths using \`inline code\` formatting
- Add a "Next Steps" section if relevant
- Use > blockquotes for important warnings or tips`;

      case 'reference':
        return basePrompt + `

**Additional Instructions for Reference Responses:**
- Use tables for parameter descriptions when appropriate
- Structure technical details with clear headings
- Include comprehensive code examples with syntax highlighting
- Use \`inline code\` for all technical terms, parameters, and values
- Create a clear hierarchy with ## and ### headings`;

      case 'troubleshooting':
        return basePrompt + `

**Additional Instructions for Troubleshooting Responses:**
- Start with a brief problem summary
- List potential causes using bullet points
- Provide step-by-step solutions with numbered lists
- Use > blockquotes for important warnings
- Include code examples for fixes with proper syntax highlighting
- End with "Additional Resources" section if relevant`;

      case 'example':
        return basePrompt + `

**Additional Instructions for Example Responses:**
- Focus primarily on code examples with proper syntax highlighting
- Explain what each example demonstrates using clear headings
- Include step-by-step implementation instructions
- Use \`inline code\` for file names and short code snippets
- Add comments in code blocks to explain key parts`;

      case 'concept':
        return basePrompt + `

**Additional Instructions for Concept Responses:**
- Start with a clear definition using **bold** formatting
- Break down complex ideas into digestible sections with headings
- Use examples from the context to illustrate concepts
- Include code examples when they help explain the concept
- Use bullet points for key characteristics or features`;

      default:
        return basePrompt;
    }
  }

  /**
   * Generate search terms for hybrid search
   */
  generateSearchTerms(enhancedQuery: EnhancedQuery): string[] {
    const terms = [enhancedQuery.original];
    
    // Add expanded queries
    terms.push(...enhancedQuery.expanded);
    
    // Add filter-based terms
    if (enhancedQuery.filters.category) {
      terms.push(enhancedQuery.filters.category);
    }
    
    if (enhancedQuery.filters.language) {
      terms.push(enhancedQuery.filters.language);
    }
    
    // Extract key terms from original query
    const keyTerms = enhancedQuery.original
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 3 && !this.isStopWord(term));
    
    terms.push(...keyTerms);
    
    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as',
      'was', 'with', 'for', 'his', 'by', 'in', 'have', 'he', 'it', 'not',
      'or', 'be', 'an', 'you', 'all', 'this', 'how', 'what', 'when',
      'where', 'why', 'can', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'about', 'from', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }
}
