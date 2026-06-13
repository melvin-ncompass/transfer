# 🚀 Swark 3.0 - Enhanced Repository Analysis

## Overview

**Swark 3.0** is the next evolution of automatic architecture diagram generation, designed specifically for handling **very large repositories** that exceed normal token limits while providing **commit-specific analysis**.

## 🎯 Key Features

### **1. Enhanced Input Flow**
- **Repository Selection**: Intuitive folder picker
- **Commit-Specific Analysis**: Analyze any specific commit in your repository history
- **Smart Metadata Collection**: Pre-analysis repository scanning

### **2. Advanced Chunking Strategy**
```
Input Repository → Metadata Analysis → Smart Chunking → Context-Aware Processing → Unified Output
```

- **Token Size Calculation**: Calculate total repository token size upfront
- **Intelligent Chunking**: Group files by dependency relationships, not arbitrarily
- **Context Preservation**: Maintain logical connections between chunks
- **Overlap Strategy**: Include relevant context files in multiple chunks

### **3. Unified Architecture Output**
- **Single Result**: One unified diagram representing the entire repository
- **Full Context**: No loss of architectural relationships
- **Professional Quality**: Ready-to-share architectural documentation

## 🛠️ How It Works

### **Step 1: Repository Input**
```typescript
// Prompt user for repository
const repositoryPath = await promptForRepository();

// Ask for specific commit (optional)
const commitHash = await promptForCommit();
```

### **Step 2: Metadata Analysis**
```typescript
// Scan repository and calculate total size
const metadata = await analyzeRepository(repositoryPath, commitHash);

console.log(`📊 Repository Analysis:`);
console.log(`  - Total files: ${metadata.totalFiles}`);
console.log(`  - Total tokens: ${metadata.estimatedTokens}`);
console.log(`  - Chunking required: ${metadata.chunkingRequired}`);
```

### **Step 3: Smart Chunking**
```typescript
// Create intelligent chunks based on dependencies
const chunks = await createEnhancedChunks(metadata, {
  maxTokensPerChunk: 200000,
  overlapRatio: 0.1,  // 10% context overlap
  preserveContext: true
});
```

### **Step 4: Context-Aware Processing**
```typescript
// Process each chunk with context preservation
for (const chunk of chunks) {
  const result = await processChunkWithContext(chunk, {
    primaryFiles: chunk.files,
    contextFiles: chunk.contextOverlap,
    dependencies: chunk.dependencies
  });
}
```

### **Step 5: Unified Integration**
```typescript
// Combine all chunk results into unified diagram
const finalResult = await integrateWithFullContext(chunkResults);
```

## 📊 Enhanced Metadata Collection

Swark 3.0 collects comprehensive metadata before processing:

```typescript
interface RepositoryMetadata {
  repositoryPath: string;
  commitHash?: string;
  totalFiles: number;
  totalLines: number;
  estimatedTokens: number;
  fileSizeDistribution: {
    small: number;    // < 1KB
    medium: number;   // 1KB - 10KB  
    large: number;    // 10KB - 100KB
    extraLarge: number; // > 100KB
  };
  languageDistribution: { [language: string]: number };
  dependencyComplexity: number;
  chunkingRequired: boolean;
  estimatedChunks: number;
}
```

## 🧠 Intelligent Chunking Algorithm

### **Dependency-Based Grouping**
- Analyze import/include statements across all supported languages
- Build comprehensive dependency graph
- Use Tarjan's algorithm for strongly connected components
- Group tightly coupled files together

### **Context Overlap Strategy**
- Include relevant files from other chunks for context
- Configurable overlap ratio (0% - 50%)
- Smart selection based on dependency relationships
- Prevents loss of architectural context

### **Token-Aware Processing**
- Calculate actual token usage, not just file sizes
- Respect model-specific token limits
- Dynamic chunk sizing based on content complexity
- Efficient use of available context window

## 🎨 User Experience

### **Simplified Workflow**
1. **One Command**: `Ctrl+Shift+Alt+A` or "Swark 3.0: Enhanced Repository Analysis"
2. **Select Repository**: Choose any Git repository
3. **Choose Commit**: Current state or specific commit hash
4. **Configure Analysis**: Level of detail and output format
5. **Watch Progress**: Real-time progress updates
6. **Get Results**: Single, unified architecture diagram

### **Smart Notifications**
```
🔍 Scanning repository structure...
📊 Found 1,247 files (estimated 450,000 tokens)
📦 Creating 3 intelligent chunks...
🧠 Processing chunk 1/3 (Backend Services)...
🔗 Integrating all chunks into unified diagram...
✅ Analysis complete! View results.
```

## 📈 Configuration Options

```json
{
  "swark3.maxTokensPerChunk": 200000,
  "swark3.contextOverlap": 0.1,
  "swark3.enableGitIntegration": true,
  "swark3.defaultAnalysisLevel": "high-level",
  "swark3.enhancedMetadata": true
}
```

## 🎯 Benefits Over Swark 2.0

| Feature | Swark 2.0 | Swark 3.0 |
|---------|-----------|-----------|
| **Repository Size Limit** | ~32K-200K tokens | Unlimited |
| **Context Preservation** | Single chunk context | Cross-chunk context |
| **Commit Analysis** | Current state only | Any commit in history |
| **Metadata Collection** | Basic file counting | Comprehensive analysis |
| **Chunking Strategy** | Simple dependency grouping | Advanced overlap strategy |
| **User Experience** | Technical chunking details | Seamless unified output |
| **Processing Intelligence** | Fixed chunk processing | Adaptive context-aware |

## 🚀 Commands & Shortcuts

### **Main Commands**
- `Swark 3.0: Enhanced Repository Analysis` - Full repository analysis with smart chunking
- `Swark 3.0: Analyze Specific Commit` - Commit-specific architectural analysis

### **Keyboard Shortcuts**
- `Ctrl+Shift+Alt+A` - Enhanced repository analysis
- `Ctrl+Shift+Alt+C` - Commit-specific analysis

## 🔮 Future Enhancements

- **Semantic Chunking**: AI-powered chunk boundary detection
- **Interactive Chunking**: Manual chunk boundary adjustment
- **Temporal Analysis**: Track architectural evolution over time
- **Multi-Repository**: Cross-repository architectural analysis
- **Performance Analytics**: Detailed processing metrics
- **Custom Strategies**: User-defined chunking patterns

## 💡 Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Swark 3.0 Engine                    │
├─────────────────────────────────────────────────────┤
│  Repository Input Handler                           │
│  ├── Repository Selection                           │
│  ├── Commit Selection                               │
│  └── Configuration Collection                       │
├─────────────────────────────────────────────────────┤
│  Metadata Analyzer                                  │
│  ├── File Discovery & Filtering                    │
│  ├── Token Calculation                              │
│  ├── Language Distribution                          │
│  └── Dependency Complexity Analysis                 │
├─────────────────────────────────────────────────────┤
│  Smart Chunking Processor                           │
│  ├── Enhanced Chunk Creation                        │
│  ├── Context Overlap Calculation                    │
│  ├── Context-Aware Processing                       │
│  └── Intelligent Integration                        │
├─────────────────────────────────────────────────────┤
│  Output Generation                                  │
│  ├── Unified Diagram Creation                       │
│  ├── Processing Log Generation                      │
│  └── Professional Formatting                       │
└─────────────────────────────────────────────────────┘
```

---

**Swark 3.0** transforms large repository analysis from a technical challenge into a seamless experience. By working invisibly behind the scenes with intelligent chunking and context preservation, it delivers professional architectural insights for repositories of any size while maintaining the simplicity and elegance that makes Swark powerful.

**Ready to analyze any repository, any commit, any size.** 🚀
