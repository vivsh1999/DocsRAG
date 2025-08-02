export const DEFAULT_PORTS = {
  API: 3001,
} as const;

export const FILE_EXTENSIONS = {
  MARKDOWN: ['.md', '.mdx'],
} as const;

export const STORAGE_FILES = {
  FILE_HASHES: 'file_hashes.json',
} as const;

export const LOG_PREFIXES = {
  APP: '[App]',
  VECTOR_STORE: '[VectorStore]',
  API: '[API]',
  FILE_UTILS: '[FileUtils]',
} as const;

export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:3000', // Docusaurus dev server
    'http://localhost:3001', // API server
    'https://your-docs-domain.com', // Production docs domain
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
} as const;
