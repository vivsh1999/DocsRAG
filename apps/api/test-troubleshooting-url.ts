#!/usr/bin/env tsx
import { DocumentProcessor } from './src/services/documentProcessor.js';

console.log('🔍 Testing URL generation for troubleshooting file');
console.log('=================================================\n');

const processor = new DocumentProcessor();

// Test the specific troubleshooting file
const testPath = 'data/api/troubleshooting.md';
const frontendUrl = (processor as any).generateFrontendUrl(testPath);
const editUrl = (processor as any).generateEditUrl(testPath);

console.log('📁 File path:', testPath);
console.log('🔗 Generated frontend URL:', frontendUrl);
console.log('✏️  Generated edit URL:', editUrl);
console.log('✅ Expected frontend URL: /docs/api/troubleshooting');
console.log('');

// Test a few variations to understand the pattern
const variations = [
  'data/api/troubleshooting.md',
  '/Users/viveksharma/Projects/DocsRAG/apps/api/data/api/troubleshooting.md',
  'api/troubleshooting.md'
];

console.log('🧪 Testing variations:');
variations.forEach(path => {
  const url = (processor as any).generateFrontendUrl(path);
  console.log(`   ${path} → ${url}`);
});

// Also test with actual document processing if the file exists
import * as fs from 'fs';
import * as path from 'path';

const fullPath = path.join(process.cwd(), 'data', 'api', 'troubleshooting.md');
if (fs.existsSync(fullPath)) {
  try {
    console.log('\n📄 Processing actual document...');
    const chunks = await processor.processMarkdownFile(fullPath);
    console.log(`✅ Processed successfully: ${chunks.length} chunks`);
    console.log(`🔗 Frontend URL in metadata: ${chunks[0]?.metadata.frontend_url}`);
    console.log(`✏️  Edit URL in metadata: ${chunks[0]?.metadata.edit_url}`);
    console.log(`📝 Title: ${chunks[0]?.metadata.title}`);
  } catch (error) {
    console.log(`❌ Error processing: ${error}`);
  }
} else {
  console.log(`⚠️  File not found: ${fullPath}`);
}
