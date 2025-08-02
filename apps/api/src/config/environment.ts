import 'dotenv/config';
import { DEFAULT_PORTS } from '../constants.js';

export interface EnvironmentConfig {
  geminiApiKey: string;
  port: number;
  dataDir: string;
  indexStorageDir: string;
}

/**
 * Validates and returns environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Validate required environment variables
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY,
    port: parseInt(process.env.PORT || DEFAULT_PORTS.API.toString(), 10),
    dataDir: process.env.DATA_DIR || 'data',
    indexStorageDir: process.env.INDEX_STORAGE_DIR || 'index_storage',
  };
}
