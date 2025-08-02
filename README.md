# DocsRAG - Enhanced Documentation RAG System

A powerful RAG (Retrieval-Augmented Generation) system for documentation search with PocketFlow workflow integration and intelligent query processing.

## 🚀 Features

### Core RAG Capabilities
- **Semantic Search**: Vector-based document retrieval with Gemini embeddings
- **Smart Chunking**: Intelligent document segmentation for optimal context
- **Incremental Indexing**: Efficient updates when documents change
- **Docusaurus Integration**: Proper URL mapping for documentation links

### Enhanced with PocketFlow
- **Workflow Architecture**: Modular Node-based processing pipeline
- **Intent Classification**: AI-powered query intent detection
- **Query Expansion**: Automatic generation of alternative phrasings
- **Advanced Analytics**: Detailed metadata and performance tracking
- **Intelligent Routing**: Different processing paths based on query type

### Developer Experience
- **CORS Enabled**: Cross-origin requests supported
- **LLM Fallback**: Graceful handling of out-of-scope queries
- **Rich Responses**: Markdown formatting with clickable sources
- **Health Monitoring**: Service status and availability tracking
- **TypeScript**: Full type safety and IntelliSense support
- **Modular Architecture**: Clean separation of concerns for maintainability

## 📁 Project Structure

```
DocsRAG/
├── apps/
│   ├── api/                    # RAG API Server
│   │   ├── src/
│   │   │   ├── services/       # Core services
│   │   │   │   ├── pocketFlowRAG.ts      # PocketFlow integration
│   │   │   │   ├── customVectorStore.ts  # Vector storage & search
│   │   │   │   ├── gemini.ts             # AI model integration
│   │   │   │   ├── queryProcessor.ts     # Query enhancement
│   │   │   │   └── documentProcessor.ts  # Document processing
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── types/          # TypeScript types
│   │   │   └── config/         # Configuration
│   │   ├── data/               # Documentation files
│   │   └── index_storage/      # Vector embeddings
│   └── docs/                   # Docusaurus documentation site
├── packages/                   # Shared packages
├── POCKETFLOW_INTEGRATION.md   # Integration guide
└── README.md                   # This file
```

### Code Simplification
- ✅ **Unified API Endpoint**: Single `/query` endpoint with intelligent routing
- ✅ **Automatic Fallback**: PocketFlow with graceful traditional RAG fallback
- ✅ **Clean Dependencies**: All packages are actively used, no unused imports
- ✅ **File Usage Validation**: Every TypeScript file is imported and necessary

### Repository Statistics
- **Before**: ~1,200+ files including demos and outdated docs
- **After**: Clean production-ready codebase with focused documentation
- **Maintenance**: Proper `.gitignore`, meaningful commits, clean git history

### Benefits
- **Faster Development**: Clear structure, no dead code or confusing alternatives
- **Better Documentation**: Consolidated guides that stay up-to-date
- **Professional Appearance**: Clean, organized file hierarchy
- **Easier Onboarding**: New developers can understand the codebase quickly

## 🛠 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- Google Gemini API key

### Environment Setup
Create a `.env` file in `apps/api/` with:
```bash
GEMINI_API_KEY=your_gemini_api_key    # Required
PORT=3001                             # Optional, defaults to 3001
DATA_DIR=data                         # Optional, defaults to 'data'
INDEX_STORAGE_DIR=index_storage       # Optional, defaults to 'index_storage'
```

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repo-url>
cd DocsRAG
pnpm install
```

2. **Configure environment:**
```bash
cd apps/api
cp .env.example .env
# Add your GEMINI_API_KEY and other settings
```

3. **Start the services:**
```bash
# Start both API and docs (from root)
pnpm start

# Or start individually
cd apps/api && pnpm start    # API server on :3001
cd apps/docs && pnpm start   # Documentation site on :3000
```

The API will automatically:
1. Scan the data directory for markdown files
2. Build or update the vector index
3. Start the HTTP server with health monitoring
4. Handle incremental updates on subsequent runs

##  Dependencies

### Core Technologies
- **Hono**: Fast web framework
- **PocketFlow**: LLM workflow framework
- **Google Gemini**: AI model for embeddings and generation
- **TypeScript**: Type-safe development

### Key Features
- Vector similarity search
- Intelligent document chunking
- CORS-enabled API
- Incremental indexing
- Error recovery

##  Development

## 🔧 Development

### Adding Documents
Place markdown files in `apps/api/data/` - the system automatically indexes them on startup with incremental update detection.

### Architecture Overview
- **Configuration**: Environment validation and service setup
- **Services**: Core business logic for vector operations
- **Utils**: Reusable utility functions (file hashing, filesystem operations)
- **Routes**: HTTP endpoint handlers with CORS support
- **Types**: TypeScript interfaces and comprehensive type definitions

## 📚 Documentation

- **[PocketFlow Integration Guide](./POCKETFLOW_INTEGRATION.md)**: Detailed workflow and API documentation
- **[Live API Health Check](http://localhost:3001/health)**: Service status and availability
- **[Documentation Site](http://localhost:3000)**: Complete Docusaurus documentation

## 🤝 Contributing

1. **TypeScript Best Practices**: Use strict type checking and meaningful interfaces
2. **Testing**: Add tests for new features in the respective service directories
3. **Documentation**: Update README.md and integration guides for API changes
4. **CORS Compatibility**: Ensure new endpoints support cross-origin requests
5. **Backward Compatibility**: Maintain existing API contracts when possible

## 📄 License

MIT License - see LICENSE file for details.
