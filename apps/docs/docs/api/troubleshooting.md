---
title: Troubleshooting
description: Common issues and solutions for the DocsRAG API
sidebar_position: 7
---

# Troubleshooting Guide

Common issues, solutions, and debugging tips for the DocsRAG API.

## Quick Diagnostics

### Health Check

First, verify the API is running and healthy:

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "vectorStore": true,
    "pocketFlow": true,
    "gemini": true,
    "cors": true
  }
}
```

**Problem Indicators:**
- `"status": "initializing"` - API is still starting up
- `"vectorStore": false` - Document indexing failed
- `"pocketFlow": false` - Advanced features unavailable (fallback works)
- No response - API server isn't running

## Installation & Setup Issues

### Environment Variables Not Set

**Error:**
```bash
Error: GEMINI_API_KEY environment variable is not set.
```

**Solutions:**
1. **Check .env file exists:**
   ```bash
   ls -la apps/api/.env
   ```

2. **Verify file contents:**
   ```bash
   cat apps/api/.env
   # Should show your API keys
   ```

3. **Create .env file if missing:**
   ```bash
   cd apps/api
   touch .env
   echo "GEMINI_API_KEY=your_key_here" >> .env
   echo "OPENAI_API_KEY=your_key_here" >> .env
   ```

4. **Test environment loading:**
   ```bash
   node -e "require('dotenv').config({path: 'apps/api/.env'}); console.log(process.env.GEMINI_API_KEY)"
   ```

### Import/Module Errors

**Error:**
```bash
Cannot find module './services/something'
```

**Causes & Solutions:**
1. **Missing .js extension in imports:**
   ```typescript
   // ❌ Wrong
   import { Service } from './services/myService';
   
   // ✅ Correct
   import { Service } from './services/myService.js';
   ```

2. **Node.js version incompatibility:**
   ```bash
   node --version  # Should be 18+
   ```

3. **ESM modules not supported:**
   - Ensure `"type": "module"` in package.json
   - Use Node.js 18+ with ESM support

### Port Already in Use

**Error:**
```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
1. **Find what's using the port:**
   ```bash
   lsof -i :3001
   # or
   netstat -tulpn | grep :3001
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Use a different port:**
   ```bash
   echo "PORT=3002" >> apps/api/.env
   ```

## Runtime Issues

### No Documents Found

**Error:**
```bash
[VECTOR_STORE] Found 0 documents to process
```

**Solutions:**
1. **Check data directory exists:**
   ```bash
   ls -la apps/api/data/
   ```

2. **Add markdown files:**
   ```bash
   mkdir -p apps/api/data
   echo "# Test Doc\nThis is a test document." > apps/api/data/test.md
   ```

3. **Verify file permissions:**
   ```bash
   chmod -R 755 apps/api/data/
   ```

4. **Check custom DATA_DIR:**
   ```bash
   # If using custom directory
   echo $DATA_DIR
   ls -la $DATA_DIR/
   ```

### Vector Store Initialization Failed

**Error:**
```bash
[VECTOR_STORE] Failed to initialize: Permission denied
```

**Solutions:**
1. **Check storage directory permissions:**
   ```bash
   mkdir -p apps/api/index_storage
   chmod -R 755 apps/api/index_storage/
   ```

2. **Verify write access:**
   ```bash
   touch apps/api/index_storage/test.json && rm apps/api/index_storage/test.json
   ```

3. **Clear corrupted storage:**
   ```bash
   rm -rf apps/api/index_storage/*
   # Restart API to rebuild
   ```

### API Key Issues

**Error:**
```bash
[GEMINI] API error: 401 Unauthorized
```

**Solutions:**
1. **Verify API key format:**
   - Gemini keys start with `AIzaSy`
   - OpenAI keys start with `sk-`

2. **Test API key directly:**
   ```bash
   curl -H "Authorization: Bearer $GEMINI_API_KEY" \
        https://generativelanguage.googleapis.com/v1/models
   ```

3. **Check API key permissions:**
   - Ensure Gemini API is enabled in Google Cloud Console
   - Verify usage limits haven't been exceeded

4. **Regenerate API key:**
   - Create new key in respective platform
   - Update .env file

## Query & Response Issues

### Empty or Poor Responses

**Symptoms:**
- Responses are too generic
- No relevant information returned
- "I don't have information about that" responses

**Solutions:**
1. **Check document content:**
   ```bash
   # Verify documents contain relevant information
   grep -r "your search term" apps/api/data/
   ```

2. **Improve document structure:**
   ```markdown
   ---
   title: Clear Descriptive Title
   description: What this document covers
   tags: ["relevant", "keywords"]
   ---
   
   # Clear Headers
   Use descriptive headers and sections.
   
   ## Specific Topics
   Include specific examples and code.
   ```

3. **Rebuild index:**
   ```bash
   rm -rf apps/api/index_storage/*
   # Restart API to rebuild with improved documents
   ```

### PocketFlow Fallback

**Warning:**
```bash
PocketFlow workflow failed, using fallback
```

**This is Normal Behavior:**
- PocketFlow enhances responses but isn't required
- Traditional RAG maintains full functionality
- No action needed unless you specifically need PocketFlow features

**If PocketFlow is Required:**
1. **Check PocketFlow installation:**
   ```bash
   npm list pocketflow
   ```

2. **Verify dependencies:**
   ```bash
   cd apps/api && pnpm install
   ```

### Slow Response Times

**Symptoms:**
- Queries take > 5 seconds
- Timeout errors

**Solutions:**
1. **Check document count:**
   ```bash
   find apps/api/data -name "*.md" -o -name "*.mdx" | wc -l
   ```

2. **Optimize large documents:**
   - Split very large files into smaller sections
   - Use clear heading structure for better chunking

3. **Monitor memory usage:**
   ```bash
   # Check if system is memory constrained
   free -h
   top -p $(pgrep node)
   ```

4. **Reduce concurrent requests:**
   - Limit simultaneous queries
   - Implement client-side queuing

## Performance Issues

### Memory Problems

**Error:**
```bash
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**
1. **Increase Node.js memory:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=2048"
   pnpm start
   ```

2. **Process documents in batches:**
   - Move some documents temporarily
   - Process in smaller groups
   - Monitor memory usage

3. **Check for memory leaks:**
   ```bash
   # Monitor memory over time
   while true; do ps aux | grep node | grep -v grep; sleep 5; done
   ```

### High CPU Usage

**Symptoms:**
- CPU constantly at 100%
- System becomes unresponsive

**Solutions:**
1. **Limit concurrent processing:**
   - Reduce batch sizes in document processing
   - Add delays between operations

2. **Check for infinite loops:**
   - Review logs for repeated errors
   - Restart API if needed

3. **Profile the application:**
   ```bash
   node --prof apps/api/src/index.ts
   ```

## Network & Connectivity Issues

### CORS Errors

**Error in Browser:**
```
Access to fetch at 'http://localhost:3001/query' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
The API has CORS enabled by default. If you see this error:

1. **Verify API is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check custom CORS configuration:**
   - Review any proxy or reverse proxy settings
   - Ensure headers are properly forwarded

### API Unreachable

**Error:**
```bash
curl: (7) Failed to connect to localhost port 3001: Connection refused
```

**Solutions:**
1. **Verify API is running:**
   ```bash
   ps aux | grep node
   ```

2. **Check server logs:**
   ```bash
   cd apps/api && pnpm start
   # Look for startup errors
   ```

3. **Test different port:**
   ```bash
   curl http://localhost:3002/health
   ```

## Development Issues

### Hot Reload Not Working

**Problem:** Changes to code don't trigger restart

**Solutions:**
1. **Verify tsx is watching:**
   ```bash
   cd apps/api
   pnpm start
   # Should show "watching for changes"
   ```

2. **Check file permissions:**
   ```bash
   chmod -R 755 apps/api/src/
   ```

3. **Restart development server:**
   ```bash
   # Kill existing process
   pkill -f "tsx watch"
   # Restart
   pnpm start
   ```

### TypeScript Compilation Errors

**Error:**
```bash
TS2307: Cannot find module './something' or its corresponding type declarations.
```

**Solutions:**
1. **Check import paths:**
   ```typescript
   // Ensure .js extension for relative imports
   import { MyClass } from './myClass.js';
   ```

2. **Verify tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "Node"
     }
   }
   ```

3. **Clear TypeScript cache:**
   ```bash
   rm -rf apps/api/dist/
   rm -rf node_modules/.cache/
   ```

## Debugging Tips

### Enable Debug Logging

Add more detailed logging to understand what's happening:

```typescript title="Debug Configuration"
// In your .env file
DEBUG=docsrag:*
LOG_LEVEL=debug

// Or set environment variables
export DEBUG=docsrag:*
export LOG_LEVEL=debug
```

### API Response Debugging

Test API responses systematically:

```bash
# Test basic connectivity
curl http://localhost:3001/

# Test health endpoint
curl http://localhost:3001/health

# Test simple query
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# Test with verbose output
curl -v -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### File System Debugging

Check file system state:

```bash
# Document files
find apps/api/data -type f -name "*.md" -o -name "*.mdx"

# Storage files
ls -la apps/api/index_storage/

# File permissions
ls -la apps/api/data/ apps/api/index_storage/

# Disk space
df -h
```

### Service Status Check

```bash
#!/bin/bash
# Create a debug script

echo "=== DocsRAG Debug Information ==="
echo "Date: $(date)"
echo ""

echo "=== Environment ==="
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"
echo ""

echo "=== Process Status ==="
ps aux | grep -E "(node|tsx)" | grep -v grep
echo ""

echo "=== Port Status ==="
lsof -i :3001 || echo "Port 3001 not in use"
echo ""

echo "=== File System ==="
echo "Data directory:"
ls -la apps/api/data/ 2>/dev/null || echo "Data directory not found"
echo ""
echo "Storage directory:"
ls -la apps/api/index_storage/ 2>/dev/null || echo "Storage directory not found"
echo ""

echo "=== API Health ==="
curl -s http://localhost:3001/health || echo "API not responding"
```

## Getting Further Help

### Before Seeking Help

1. **Check this troubleshooting guide** for your specific issue
2. **Review the logs** for error messages and context
3. **Test with minimal configuration** to isolate the problem
4. **Verify your environment** meets the requirements

### Information to Include

When reporting issues, include:

- **Error messages** (complete stack traces)
- **Environment details** (OS, Node.js version, package versions)
- **Configuration** (.env contents without API keys)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**

### Resources

- **[Configuration Guide](./configuration)** - Environment setup
- **[Architecture Documentation](./architecture)** - System understanding
- **[API Reference](./api-reference)** - Endpoint details
- **[Integration Examples](./examples)** - Working code samples

---

Most issues can be resolved by checking configuration, file permissions, and API key validity. The system is designed to be robust and self-healing, so many problems resolve automatically once the underlying cause is addressed.
