import * as fs from 'fs';
import * as path from 'path';
import { EnhancedDocumentMetadata, DocumentChunk, MarkdownSection, CodeBlock } from '../types/index.js';
import { getFileContentHash } from '../utils/index.js';
import { LOG_PREFIXES } from '../constants.js';

export class DocumentProcessor {
  private readonly maxChunkSize: number = 1000; // characters
  private readonly chunkOverlap: number = 200; // characters

  /**
   * Generate frontend URL from file path
   * Assumes docs are served from /docs/ path
   */
  private generateFrontendUrl(filePath: string): string {
    // Remove common prefixes and normalize path
    const cleanPath = filePath
      .replace(/^.*\/data\//, '')
      .replace(/^data\//, '')
      .replace(/^apps\/docs\//, '')
      .replace(/^docs\//, '')
      .replace(/\.mdx?$/, '');
    
    // Handle index files
    const finalPath = cleanPath.replace(/\/index$/, '');
    
    return `/docs/${finalPath}`;
  }

  /**
   * Generate edit URL for documentation
   */
  private generateEditUrl(filePath: string): string {
    // Convert absolute path to relative path from project root
    const relativePath = filePath.includes('/apps/api/data/') 
      ? filePath.replace(/^.*\/apps\/api\/data\//, 'apps/docs/docs/')
      : filePath.replace(/^.*\/data\//, 'apps/docs/docs/');
      
    return `https://github.com/your-org/your-repo/edit/main/${relativePath}`;
  }

  /**
   * Process a markdown file into enhanced document chunks
   */
  async processMarkdownFile(filePath: string): Promise<DocumentChunk[]> {
    try {
      const rawContent = fs.readFileSync(filePath, 'utf8');
      const fileHash = getFileContentHash(filePath);
      
      // Clean and normalize content
      const cleanedContent = this.cleanMarkdown(rawContent);
      
      // Extract frontmatter and content
      const frontmatter = this.extractFrontmatter(cleanedContent);
      const contentWithoutFrontmatter = this.removeFrontmatter(cleanedContent);
      
      // Process MDX components
      const processedContent = this.processMDXComponents(contentWithoutFrontmatter);
      
      // Extract structured data
      const codeBlocks = this.extractCodeBlocks(processedContent);
      const sections = this.extractSections(processedContent);
      const links = this.extractLinks(processedContent);
      const headingStructure = sections.map(s => s.heading);
      
      // Generate URLs
      const frontendUrl = this.generateFrontendUrl(filePath);
      const editUrl = this.generateEditUrl(filePath);
      
      // Create base metadata
      const baseMetadata: EnhancedDocumentMetadata = {
        file_path: filePath,
        file_name: path.basename(filePath),
        file_type: path.extname(filePath).slice(1),
        file_hash: fileHash,
        title: frontmatter.title || this.extractTitleFromContent(processedContent),
        sidebar_position: frontmatter.sidebar_position,
        sidebar_label: frontmatter.sidebar_label,
        tags: frontmatter.tags || [],
        authors: frontmatter.authors || [],
        category: this.inferCategory(filePath),
        word_count: this.countWords(processedContent),
        heading_structure: headingStructure,
        code_languages: [...new Set(codeBlocks.map(cb => cb.language).filter(Boolean))],
        internal_links: links.filter(l => this.isInternalLink(l)),
        external_links: links.filter(l => this.isExternalLink(l)),
        chunk_type: 'full_document',
        // URL mapping fields
        frontend_url: frontendUrl,
        docusaurus_id: path.basename(filePath, path.extname(filePath)),
        edit_url: editUrl
      };
      
      // Create chunks based on content structure
      return this.createChunks(processedContent, sections, baseMetadata);
      
    } catch (error) {
      console.error(`${LOG_PREFIXES.VECTOR_STORE} Error processing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Clean markdown content
   */
  private cleanMarkdown(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();
  }

  /**
   * Extract frontmatter from markdown
   */
  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};
    
    const frontmatterText = frontmatterMatch[1];
    const frontmatter: Record<string, any> = {};
    
    // Simple YAML parsing for common fields
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        frontmatter[key] = this.parseYamlValue(value);
      }
    }
    
    return frontmatter;
  }

  /**
   * Parse YAML values
   */
  private parseYamlValue(value: string): any {
    value = value.trim();
    
    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
    }
    
    // Handle numbers
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    // Handle booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Handle strings (remove quotes)
    return value.replace(/^['"]|['"]$/g, '');
  }

  /**
   * Remove frontmatter from content
   */
  private removeFrontmatter(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n?/, '');
  }

  /**
   * Process MDX components to readable text
   */
  private processMDXComponents(content: string): string {
    return content
      // Convert Highlight components
      .replace(/<Highlight[^>]*color="([^"]*)"[^>]*>([^<]*)<\/Highlight>/g, '**$2** (highlighted in $1)')
      // Convert admonitions
      .replace(/:::(\w+)[^\n]*\n([\s\S]*?)\n:::/g, '**$1**: $2')
      // Convert JSX buttons to text
      .replace(/<button[^>]*onClick[^>]*>([^<]*)<\/button>/g, '[Button: $1]')
      // Remove other JSX tags but keep content
      .replace(/<[^>]+>/g, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Extract code blocks from content
   */
  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const regex = /```(\w+)?\s*(?:title="([^"]*)")?\s*\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || '',
        title: match[2],
        code: match[3],
        startLine: content.substring(0, match.index).split('\n').length,
        endLine: content.substring(0, match.index + match[0].length).split('\n').length
      });
    }
    
    return codeBlocks;
  }

  /**
   * Extract sections based on markdown headers
   */
  private extractSections(content: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    const lines = content.split('\n');
    let currentSection: MarkdownSection | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.endLine = i - 1;
          currentSection.content = lines
            .slice(currentSection.startLine + 1, currentSection.endLine + 1)
            .join('\n')
            .trim();
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          heading: headerMatch[2],
          level: headerMatch[1].length,
          content: '',
          startLine: i,
          endLine: -1
        };
      }
    }
    
    // Handle last section
    if (currentSection) {
      currentSection.endLine = lines.length - 1;
      currentSection.content = lines
        .slice(currentSection.startLine + 1)
        .join('\n')
        .trim();
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Extract links from content
   */
  private extractLinks(content: string): string[] {
    const links: string[] = [];
    
    // Markdown links
    const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (markdownLinks) {
      markdownLinks.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) links.push(match[2]);
      });
    }
    
    // Direct URLs
    const urlPattern = /https?:\/\/[^\s)]+/g;
    const urls = content.match(urlPattern);
    if (urls) {
      links.push(...urls);
    }
    
    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Create chunks from content and sections
   */
  private createChunks(content: string, sections: MarkdownSection[], baseMetadata: EnhancedDocumentMetadata): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    // If document is small, create single chunk
    if (content.length <= this.maxChunkSize) {
      chunks.push({
        id: baseMetadata.file_path,
        text: content,
        metadata: { ...baseMetadata, chunk_type: 'full_document' }
      });
      return chunks;
    }
    
    // Create chunks based on sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionContent = `# ${section.heading}\n\n${section.content}`;
      
      if (sectionContent.length <= this.maxChunkSize) {
        // Section fits in one chunk
        chunks.push({
          id: `${baseMetadata.file_path}#${this.sanitizeId(section.heading)}`,
          text: sectionContent,
          metadata: {
            ...baseMetadata,
            section: section.heading,
            chunk_type: section.level === 1 ? 'section' : 'subsection'
          }
        });
      } else {
        // Split large section with sliding window
        const subChunks = this.slidingWindowChunk(sectionContent);
        subChunks.forEach((chunk, index) => {
          chunks.push({
            id: `${baseMetadata.file_path}#${this.sanitizeId(section.heading)}#${index}`,
            text: chunk,
            metadata: {
              ...baseMetadata,
              section: section.heading,
              chunk_index: index,
              chunk_type: 'subsection'
            }
          });
        });
      }
    }
    
    return chunks;
  }

  /**
   * Create sliding window chunks for large content
   */
  private slidingWindowChunk(content: string): string[] {
    const chunks: string[] = [];
    const words = content.split(/\s+/);
    const wordsPerChunk = Math.floor(this.maxChunkSize / 6); // Rough estimate: 6 chars per word
    const overlapWords = Math.floor(this.chunkOverlap / 6);
    
    for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      chunks.push(chunkWords.join(' '));
    }
    
    return chunks;
  }

  /**
   * Helper methods
   */
  private extractTitleFromContent(content: string): string {
    const firstHeader = content.match(/^#\s+(.+)$/m);
    return firstHeader ? firstHeader[1] : '';
  }

  private inferCategory(filePath: string): string {
    const pathParts = filePath.split(path.sep);
    // Extract category from path structure
    const relevantParts = pathParts.filter(part => 
      !['apps', 'docs', 'data', 'tutorial-basics', 'tutorial-extras'].includes(part)
    );
    return relevantParts.length > 1 ? relevantParts[relevantParts.length - 2] : 'general';
  }

  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private isInternalLink(link: string): boolean {
    return link.startsWith('./') || link.startsWith('/') || link.startsWith('../');
  }

  private isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  private sanitizeId(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
