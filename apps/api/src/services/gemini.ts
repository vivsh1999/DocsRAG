import { GoogleGenAI } from "@google/genai";
import { getEnvironmentConfig } from "../config/index.js";

const config = getEnvironmentConfig();
const googleAI = new GoogleGenAI({ apiKey: config.geminiApiKey });

export class GeminiService {
  async getTextEmbedding(text: string): Promise<number[]> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding');
    }

    // Truncate very long texts to avoid API limits
    const maxLength = 10000;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    const result = await googleAI.models.embedContent({
      model: "text-embedding-004",
      contents: truncatedText
    });
    
    if (!result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
      throw new Error('Failed to get embedding from Gemini API');
    }
    
    return result.embeddings[0].values;
  }

  async getTextEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Filter out empty texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    
    if (validTexts.length === 0) {
      console.warn('No valid texts provided for embedding');
      return [];
    }

    // Process in batches to avoid API limits
    const batchSize = 50;
    
    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize);
      
      console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validTexts.length / batchSize)}`);
      
      for (const text of batch) {
        try {
          const embedding = await this.getTextEmbedding(text);
          embeddings.push(embedding);
        } catch (error) {
          console.error('Error getting embedding for text:', text.substring(0, 100) + '...', error);
          // Skip this text and continue
          continue;
        }
      }
      
      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < validTexts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return embeddings;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await googleAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No text generated from Gemini API');
      }
      
      return result.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      throw error;
    }
  }

  async classifyQueryIntent(query: string): Promise<{ type: string; confidence: number }> {
    const prompt = `Classify the intent of this documentation search query. Return only the category name.

Query: "${query}"

Categories:
- how-to: Questions asking how to do something (starts with "how", asks for steps/instructions)
- concept: Questions asking what something is or how it works conceptually
- reference: Questions asking for specific API details, parameters, or technical specifications
- troubleshooting: Questions about errors, problems, or debugging
- example: Questions asking for code examples or sample implementations
- general: General questions that don't fit other categories

Category:`;

    try {
      const response = await this.generateText(prompt);
      const intent = response.trim().toLowerCase();
      
      // Map response to valid intent types
      const intentMap: Record<string, string> = {
        'how-to': 'how-to',
        'howto': 'how-to',
        'concept': 'concept',
        'reference': 'reference',
        'troubleshooting': 'troubleshooting',
        'example': 'example',
        'general': 'general'
      };
      
      return {
        type: intentMap[intent] || 'general',
        confidence: 0.8 // Default confidence
      };
    } catch (error) {
      console.error('Error classifying query intent:', error);
      return { type: 'general', confidence: 0.5 };
    }
  }

  async expandQuery(query: string): Promise<string[]> {
    const prompt = `Generate 2-3 alternative phrasings for this documentation search query. Each phrasing should maintain the same meaning but use different words. Return each alternative on a new line.

Original query: "${query}"

Alternatives:`;

    try {
      const response = await this.generateText(prompt);
      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line !== query)
        .slice(0, 3); // Limit to 3 alternatives
    } catch (error) {
      console.error('Error expanding query:', error);
      return []; // Return empty array on error
    }
  }
}
