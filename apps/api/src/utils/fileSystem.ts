import * as fs from 'fs';
import * as path from 'path';
import { FILE_EXTENSIONS, LOG_PREFIXES } from '../constants.js';

/**
 * Recursively finds all markdown (.md, .mdx) files within a directory.
 * @param dir The directory to search.
 * @returns An array of full paths to markdown files.
 */
export function findMarkdownFiles(dir: string): string[] {
  const markdownFiles: string[] = [];
  
  if (!fs.existsSync(dir)) {
    console.warn(`${LOG_PREFIXES.FILE_UTILS} Directory does not exist: ${dir}`);
    return markdownFiles;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      markdownFiles.push(...findMarkdownFiles(fullPath));
    } else if (item.isFile() && FILE_EXTENSIONS.MARKDOWN.some(ext => item.name.endsWith(ext))) {
      markdownFiles.push(fullPath);
    }
  }
  
  return markdownFiles;
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath Path to the directory
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${LOG_PREFIXES.FILE_UTILS} Created directory: ${dirPath}`);
  }
}
