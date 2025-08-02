export interface DocumentMetadata {
  file_path: string;
  file_name: string;
  file_type: string;
  file_hash: string;
}

export interface EnhancedDocumentMetadata extends DocumentMetadata {
  title?: string;
  sidebar_position?: number;
  sidebar_label?: string;
  tags?: string[];
  authors?: string[];
  category?: string;
  last_updated?: string;
  word_count: number;
  heading_structure: string[];
  code_languages: string[];
  internal_links: string[];
  external_links: string[];
  section?: string;
  chunk_index?: number;
  chunk_type: 'full_document' | 'section' | 'subsection';
  // URL mapping for frontend links
  frontend_url?: string;
  docusaurus_id?: string;
  edit_url?: string;
}

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: EnhancedDocumentMetadata;
}

export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

export interface CodeBlock {
  language: string;
  code: string;
  title?: string;
  startLine: number;
  endLine: number;
}

export interface QueryIntent {
  type: 'how-to' | 'concept' | 'reference' | 'troubleshooting' | 'example' | 'general';
  confidence: number;
}

export interface EnhancedQuery {
  original: string;
  expanded: string[];
  intent: QueryIntent;
  filters: Record<string, any>;
  language?: string;
}

export interface FileChangeResult {
  documentsToInsert: any[];
  documentIdsToDelete: string[];
  documentsToUpdate: any[];
}

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  response: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
