import { urlMapper } from './src/services/urlMapper.ts';
import { DocumentProcessor } from './src/services/documentProcessor.ts';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script to demonstrate URL mapping functionality
 */
async function testUrlMapping() {
  console.log('🧪 Testing URL Mapping Functionality');
  console.log('=====================================\n');

  // Initialize URL mapper
  console.log('1. Initializing URL mapper...');
  await urlMapper.initialize();
  
  if (!urlMapper.isReady()) {
    console.log('❌ URL mapper could not be initialized');
    console.log('📝 Make sure Docusaurus has been built by running:');
    console.log('   cd ../docs && npm run build');
    return;
  }

  console.log('✅ URL mapper initialized successfully\n');

  // Show available mappings
  const mappings = urlMapper.getAllMappings();
  console.log('2. Available URL mappings:');
  console.log(`📄 Documentation files: ${mappings.docs.length}`);
  console.log(`📝 Blog posts: ${mappings.blog.length}`);
  
  if (mappings.docs.length > 0) {
    console.log('\nSample documentation mappings:');
    mappings.docs.slice(0, 3).forEach(path => {
      const url = urlMapper.getFrontendUrl(path);
      console.log(`  ${path} → ${url}`);
    });
  }
  
  if (mappings.blog.length > 0) {
    console.log('\nSample blog mappings:');
    mappings.blog.slice(0, 3).forEach(path => {
      const url = urlMapper.getFrontendUrl(path);
      console.log(`  ${path} → ${url}`);
    });
  }

  console.log('\n');

  // Test document processing with URL mapping
  console.log('3. Testing document processing with URL mapping...');
  
  const processor = new DocumentProcessor();
  const testFiles = ['data/getting-started.md'];
  
  // Check if we have copied docs
  const docsPath = 'data/docs';
  if (fs.existsSync(docsPath)) {
    const docFiles = fs.readdirSync(docsPath, { recursive: true })
      .filter(file => typeof file === 'string' && file.endsWith('.md'))
      .slice(0, 2); // Test first 2 files
    
    testFiles.push(...docFiles.map(file => path.join(docsPath, file)));
  }

  for (const filePath of testFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    try {
      console.log(`\n📄 Processing: ${filePath}`);
      const chunks = await processor.processMarkdownFile(filePath);
      
      if (chunks.length > 0) {
        const metadata = chunks[0].metadata;
        console.log(`   Title: ${metadata.title || 'No title'}`);
        console.log(`   Frontend URL: ${metadata.frontend_url || 'Not mapped'}`);
        console.log(`   Docusaurus ID: ${metadata.docusaurus_id || 'N/A'}`);
        console.log(`   Edit URL: ${metadata.edit_url || 'N/A'}`);
        console.log(`   Tags: ${metadata.tags?.join(', ') || 'None'}`);
      }
    } catch (error) {
      console.log(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  console.log('\n4. URL mapping test scenarios:');
  
  const testPaths = [
    'docs/intro.md',
    'docs/api/overview.md',
    'docs/api/architecture.md',
    'blog/2021-08-26-welcome/index.md',
    'blog/2021-08-01-mdx-blog-post.mdx',
    'getting-started.md'
  ];

  for (const testPath of testPaths) {
    const url = urlMapper.getFrontendUrl(testPath);
    const metadata = urlMapper.getDocumentMetadata(testPath);
    
    console.log(`\n🔗 Testing: ${testPath}`);
    console.log(`   Frontend URL: ${url || 'Not found'}`);
    console.log(`   Has metadata: ${metadata ? 'Yes' : 'No'}`);
    
    if (metadata) {
      console.log(`   Title: ${metadata.title}`);
      console.log(`   Type: ${urlMapper.isDocsMetadata(metadata) ? 'Documentation' : 'Blog'}`);
    }
  }

  console.log('\n🎉 URL mapping test completed!');
  console.log('\n📝 Summary:');
  console.log('- URL mapper reads Docusaurus-generated metadata files');
  console.log('- Documents are processed with accurate frontend URLs');
  console.log('- Source attribution will now include correct links');
  console.log('- Users can click source links to view full documentation');
}

// Run the test
testUrlMapping().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
