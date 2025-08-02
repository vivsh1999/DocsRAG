import * as fs from 'fs';
import * as crypto from 'crypto';
import { LOG_PREFIXES } from '../constants.js';

/**
 * Calculates the SHA256 hash of a file's content.
 * @param filePath The path to the file.
 * @returns The SHA256 hash as a hexadecimal string.
 */
export function getFileContentHash(filePath: string): string {
  const fileContent = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileContent).digest('hex');
}

/**
 * Loads the stored file hashes from disk.
 * @param fileHashesPath Path to the file hashes JSON file
 * @returns A Map of file paths to their stored hashes.
 */
export function loadStoredFileHashes(fileHashesPath: string): Map<string, string> {
  if (fs.existsSync(fileHashesPath)) {
    try {
      const data = fs.readFileSync(fileHashesPath, 'utf8');
      const hashObj = JSON.parse(data);
      return new Map(Object.entries(hashObj));
    } catch (error) {
      console.error(`${LOG_PREFIXES.FILE_UTILS} Error loading stored file hashes:`, error);
    }
  }
  return new Map();
}

/**
 * Save stored file hashes to JSON file
 * @param fileHashes Map of file paths to their hashes.
 * @param fileHashesPath Path to save the file hashes JSON file
 */
export function saveStoredFileHashes(fileHashes: Map<string, string>, fileHashesPath: string): void {
  try {
    const hashObj = Object.fromEntries(fileHashes);
    fs.writeFileSync(fileHashesPath, JSON.stringify(hashObj));
  } catch (error) {
    console.error(`${LOG_PREFIXES.FILE_UTILS} Error saving file hashes:`, error);
  }
}
