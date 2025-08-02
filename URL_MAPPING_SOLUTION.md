# URL Mapping Solution for DocsRAG

## Problem
The LLM is not able to correctly map the sources to the documentation links because:

1. **File Path Mismatch**: Documents are indexed from `apps/api/data/` but the frontend URLs expect Docusaurus structure
2. **Missing Metadata**: The system lacks information about the actual frontend URLs
3. **Manual URL Generation**: The current `convertToDocusaurusUrl` function tries to guess URLs instead of using authoritative data

## Solution Overview

The solution involves three main components:

### 1. Enhanced Document Metadata
Added new fields to `EnhancedDocumentMetadata` interface:
- `frontend_url`: The actual URL where users can view the document
- `docusaurus_id`: The Docusaurus document ID for reference
- `edit_url`: Link to edit the document (if available)

### 2. URL Mapper Service
Created `urlMapper.ts` that:
- Reads Docusaurus-generated metadata files from `.docusaurus/` directory
- Maps source file paths to their corresponding frontend permalinks
- Handles both documentation and blog posts
- Provides fallback mechanisms when metadata is unavailable

### 3. Improved Source Attribution
Updated the source building functions to:
- Use actual frontend URLs from metadata instead of guessing
- Include edit links when available
- Provide more accurate source references

## How It Works

1. **Initialization**: When processing documents, the URL mapper reads metadata from:
   - `.docusaurus/docusaurus-plugin-content-docs/default/`
   - `.docusaurus/docusaurus-plugin-content-blog/default/`

2. **Document Processing**: For each document:
   - Extract file path and normalize it
   - Look up the corresponding Docusaurus metadata
   - Store the frontend URL and other metadata in the document chunk

3. **Source Generation**: When building responses:
   - Use the stored `frontend_url` if available
   - Include edit links for better user experience
   - Fall back to the old URL conversion method if needed

## Implementation Details

### Files Changed

1. **`src/types/index.ts`**: Enhanced metadata interface
2. **`src/services/urlMapper.ts`**: New URL mapping service
3. **`src/services/documentProcessor.ts`**: Updated to use URL mapper
4. **`src/services/customVectorStore.ts`**: Improved source attribution
5. **`src/services/index.ts`**: Export new URL mapper

### Key Features

- **Automatic URL Detection**: Reads actual Docusaurus permalinks
- **Fallback Support**: Works even when Docusaurus metadata is unavailable
- **Edit Links**: Includes edit URLs for contributor workflow
- **Path Variants**: Handles different file path formats and locations
- **Type Safety**: Full TypeScript support with proper interfaces

## Testing the Solution

### Setup Test Data
Run the setup script to copy Docusaurus documents to the data directory:

```bash
cd apps/api
node setup-test-data.js
```

This copies real documentation files from `apps/docs/docs/` and `apps/docs/blog/` to the `data/` directory with proper structure.

### Expected Behavior

After implementing this solution:

1. **Accurate URLs**: Source links point to the correct frontend pages
2. **Rich Metadata**: Sources include relevance scores and edit links
3. **Better UX**: Users can click source links to view full documentation
4. **Maintainable**: No need to manually update URL mapping logic

### Example Output

Before:
```
Sources:
1. **architecture.md (System Architecture)** (87.3% match)
```

After:
```
## 📚 Sources

1. **[architecture.md](/docs/api/architecture)** - System Architecture `api`
   - 📍 Path: `docs/api/architecture.md`
   - 🎯 Relevance: 87.3%
   - ✏️ [Edit this page](https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/api/architecture.md)
```

## Next Steps

1. **Full Integration**: Update the data processing pipeline to index actual Docusaurus files
2. **Live Updates**: Watch for Docusaurus rebuilds and update URL mappings
3. **Performance**: Cache URL mappings for better performance
4. **Additional Metadata**: Include more Docusaurus metadata like tags, categories, etc.

## Benefits

- **Accurate Source Links**: LLM responses include correct, clickable documentation links
- **Better User Experience**: Users can easily navigate to full documentation
- **Maintainable**: System automatically adapts to Docusaurus URL structure changes
- **Rich Metadata**: Includes edit links, categories, and other useful information
- **Type Safe**: Full TypeScript support prevents runtime errors
