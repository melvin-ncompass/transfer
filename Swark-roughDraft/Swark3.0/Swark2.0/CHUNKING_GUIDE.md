# Dependency-Based Repository Chunking Strategy

## Overview

This document explains Swark 2.0's intelligent chunking system for handling very large repositories that exceed LLM token limits. Instead of arbitrary file splits, our system uses **dependency analysis** to create meaningful chunks that preserve context and relationships.

## 🚀 How It Works

### 1. **Dependency Analysis**
- **Multi-Language Support**: Analyzes imports/includes across TypeScript, JavaScript, Python, Java, C/C++, Go, and more
- **Graph Construction**: Builds a comprehensive dependency graph showing file relationships
- **Strongly Connected Components**: Uses Tarjan's algorithm to find tightly coupled file groups

### 2. **Intelligent Chunking**
- **Cohesion-Based Grouping**: Files that depend on each other stay together
- **Token-Aware Splitting**: Respects LLM token limits while maximizing context  
- **Interface Identification**: Tracks what each chunk exposes to other chunks
- **Seamless Integration**: Works behind the scenes - you only see the final result

### 3. **Integrated Processing**
- **Chunk-by-Chunk Analysis**: Each chunk gets specialized analysis prompts
- **Cross-Chunk Integration**: AI combines all chunks into unified architecture diagrams
- **Clean Final Output**: Only the integrated result is saved - no chunk clutter

## 📋 Usage Instructions

### Quick Start

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. **Run Command**: `Swark 2.0: Create Chunked Architecture Diagram`
3. **Select Folder**: Choose your large repository
4. **Choose Analysis Level**: High-level, Semi-detailed, Detailed, or All
5. **Wait for Processing**: The system works behind the scenes and delivers the final result

### Keyboard Shortcuts

- **Regular Analysis**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Chunked Analysis**: `Ctrl+Shift+Alt+R` (Windows/Linux) or `Cmd+Shift+Alt+R` (Mac)

### When to Use Chunking

The system **automatically detects** when chunking is needed based on:
- Repository size vs. token limits
- Configurable threshold (default: 80% of token limit)
- File count and complexity

## ⚙️ Configuration

Add these settings to your VS Code settings:

```json
{
  // Enable/disable chunking feature
  "swark2.enableChunking": true,
  
  // Token threshold for triggering chunking (0.1-1.0)
  "swark2.chunkingThreshold": 0.8,
  
  // Maximum files to process
  "swark2.maxFiles": 1000,
  
  // Supported file extensions
  "swark2.fileExtensions": [
    "py", "js", "jsx", "ts", "tsx", "java", "c", "cpp", "go", "rs"
  ]
}
```

## 📊 Analysis Levels

### High-Level Architecture
- **Best for**: Stakeholders, executives, architecture reviews
- **Shows**: Main system components and their relationships
- **Output**: Clean, unified system overview

### Semi-Detailed Architecture  
- **Best for**: Technical leads, system architects
- **Shows**: Module interactions, data flows, key interfaces
- **Output**: Balanced technical view with component details

### Detailed Architecture
- **Best for**: Developers, code reviews, technical documentation
- **Shows**: All classes, functions, detailed dependencies
- **Output**: Comprehensive technical diagrams

### All Levels
- **Best for**: Complete analysis suites
- **Shows**: All three levels above
- **Output**: Complete set of diagrams at different abstraction levels

## 📁 Output Structure

The chunking system generates clean, focused output:

```
swark-output/
├── 2025-01-XX__HH-MM-SS__high-level-diagram.md
├── 2025-01-XX__HH-MM-SS__high-level-log.md
├── 2025-01-XX__HH-MM-SS__semi-diagram.md
├── 2025-01-XX__HH-MM-SS__semi-log.md
└── 2025-01-XX__HH-MM-SS__detailed-diagram.md
```

### File Types

- **`*-diagram.md`**: Your final architecture diagram (the main result)
- **`*-log.md`**: Processing details and analysis summary
- **All formats**: Available in D2, Eraser, or both formats
- **No chunk files**: Individual chunks are processed internally but not saved

## 🔍 Dependency Analysis Features

### Supported Languages

| Language | Import Detection | Path Resolution |
|----------|------------------|-----------------|
| TypeScript/JavaScript | ✅ `import`, `require` | ✅ Relative paths, index files |
| Python | ✅ `import`, `from ... import` | ✅ Module paths, relative imports |
| Java | ✅ `import` statements | ✅ Package paths |
| C/C++ | ✅ `#include` | ✅ Header files |
| Go | ✅ `import` | ✅ Package imports |

### Graph Analysis

- **Strongly Connected Components**: Finds circular dependencies
- **Cohesion Scoring**: Measures how tightly files are related
- **Interface Detection**: Identifies public APIs between chunks
- **Dependency Mapping**: Tracks external dependencies per chunk

## 🎯 Benefits

### For Large Repositories
- **No Token Limit Issues**: Handle repositories of any size
- **Preserves Context**: Related files stay together
- **Maintains Relationships**: Cross-chunk dependencies tracked
- **Scalable Processing**: Efficient parallel chunk processing

### For Architecture Understanding
- **Clean Results**: Single, coherent architecture diagram per analysis level
- **No Clutter**: Chunking happens behind the scenes - you see the unified result
- **Complete Coverage**: Every file analyzed and integrated seamlessly
- **Professional Output**: Ready-to-share diagrams for stakeholders

### for Teams
- **Stakeholder-Ready**: Clean diagrams perfect for presentations
- **Simplified Workflow**: One command, one result per analysis level
- **Professional Documentation**: Architecture diagrams without technical clutter
- **Easy Sharing**: Single files that tell the complete story

## 🛠️ Advanced Usage

### Custom Chunking Strategies

The system supports multiple chunking approaches:

1. **Dependency-Based** (default): Groups by file relationships
2. **Directory-Based**: Respects folder structure
3. **Language-Based**: Separates by programming language
4. **Size-Based**: Balances chunk sizes optimally

### Integration with Git

- **Commit-Based Analysis**: Analyze specific commits
- **Branch Comparison**: See architectural evolution
- **Temporal Analysis**: Track changes over time
- **Diff Integration**: Understand architectural impacts

### Performance Optimization

- **Parallel Processing**: Chunks processed simultaneously when possible
- **Intelligent Caching**: Reuse analysis results
- **Incremental Updates**: Only reprocess changed chunks
- **Memory Management**: Efficient handling of large codebases

## 🐛 Troubleshooting

### Common Issues

**"Chunking threshold too low"**
- Increase `swark2.chunkingThreshold` value
- Check if repository is actually large enough to need chunking

**"Dependency analysis failed"**
- Verify file extensions in configuration
- Check for unsupported language patterns
- Review exclude patterns in settings

**"Integration failed"**
- Token limits may be exceeded even with chunking
- Try a higher-capacity model (Claude, GPT-4o)
- Use more aggressive exclude patterns to reduce code size
- Consider analyzing specific subdirectories instead of entire repository

### Performance Tips

1. **Optimize File Selection**: Use exclude patterns to skip generated files
2. **Tune Chunk Size**: Adjust threshold based on your model's capabilities
3. **Language Focus**: Limit to specific file types for faster analysis
4. **Incremental Processing**: Process one level at a time for large repositories

## 📈 Future Enhancements

Planned improvements include:
- **Semantic Chunking**: AI-powered chunk boundary detection
- **Interactive Chunking**: Manual chunk boundary adjustment
- **Chunk Visualization**: Visual dependency graph exploration
- **Performance Analytics**: Detailed timing and efficiency metrics
- **Custom Patterns**: User-defined dependency patterns
- **Multi-Repository**: Analysis across multiple repositories

## 💡 Best Practices

### Repository Preparation
1. **Clean Dependencies**: Remove unused imports
2. **Consistent Structure**: Follow consistent file organization
3. **Documentation**: Add comments explaining complex relationships
4. **Exclude Generated Files**: Use `.gitignore` patterns in exclude settings

### Analysis Strategy
1. **Start with High-Level**: Get system overview first
2. **Focus on What Matters**: Use exclude patterns for generated/vendor code
3. **One Level at a Time**: Generate specific analysis levels as needed
4. **Validate Results**: Review the final diagram for accuracy and completeness

### Team Usage
1. **Shared Configuration**: Standardize settings across team
2. **Regular Analysis**: Integrate into development workflow
3. **Documentation Updates**: Keep architectural diagrams current
4. **Review Process**: Include diagram updates in code reviews

---

This chunking system transforms how you analyze large codebases by working invisibly behind the scenes. You get clean, professional architecture diagrams that represent your entire system - regardless of size - without having to deal with the complexity of chunking. The dependency-based approach ensures your architectural insights are accurate and complete, while you focus on the results that matter.
