# 🚀 Swark 4.0 - Intelligent Repository Analysis

## 🎯 Revolutionary Architecture Analysis System

Swark 4.0 represents the next generation of intelligent repository analysis, featuring **LLM-guided file selection** and **multi-format diagram generation**. Unlike previous versions that used chunking strategies, Swark 4.0 employs artificial intelligence to intelligently select the most relevant files for analysis at different levels of detail.

## ✨ Key Features

### 🧠 LLM-Guided File Selection
- **Intelligent Analysis**: AI determines which files to read based on repository structure and metadata
- **Three Analysis Levels**: High-level, semi-detailed, and detailed views with optimized file selection
- **Context-Aware**: Considers file importance, dependencies, and architectural significance
- **Token Optimization**: Dramatically reduces token usage while maintaining comprehensive coverage

### 📊 Multi-Format Diagram Generation
- **D2 Syntax**: Modern, clean diagram format for technical documentation
- **EraserDiagram**: Entity-relationship style diagrams for detailed system modeling
- **Level-Specific Output**: Each analysis level produces appropriate diagram complexity
- **Automated Generation**: AI creates diagrams based on selected file analysis

### 📈 Comprehensive Token Reporting
- **Before/After Analysis**: Shows worst-case vs. actual token usage
- **Efficiency Metrics**: Quantifies optimization achieved through intelligent selection
- **File Breakdown**: Detailed report of which files were selected and why
- **Cost Transparency**: Clear understanding of LLM token consumption

### 🎯 Structured Output Organization
- **Commit-Specific Folders**: `swark_output/<commit-hash>/` for version tracking
- **Consistent Naming**: Standardized file naming across all output formats
- **Complete Documentation**: Token reports accompany every analysis

## 🔄 Workflow Overview

### Input Stage
1. **Repository Selection**: Interactive prompt to choose target repository
2. **Commit Specification**: Select specific commit hash for analysis
3. **Validation**: Verify repository structure and accessibility

### Metadata Extraction
1. **Repository Scanning**: Comprehensive file discovery and categorization
2. **Token Estimation**: Calculate worst-case scenario token requirements
3. **Dependency Mapping**: Build relationship graph between files
4. **Importance Classification**: Categorize files as entry-point, core, utility, or dependency

### LLM-Guided File Selection
1. **Context Preparation**: Send repository metadata to LLM
2. **Intelligent Selection**: AI chooses optimal files for each analysis level
3. **Reasoning Documentation**: LLM explains selection criteria and rationale
4. **Token Calculation**: Compute actual token usage for selected files

### Processing & Output Generation
1. **Content Analysis**: Read and process selected files
2. **Diagram Generation**: Create D2 and EraserDiagram outputs for each level
3. **Report Creation**: Generate comprehensive token usage and selection reports
4. **Structured Storage**: Organize outputs in commit-specific folders

## 📁 Output Structure

```
swark_output/
└── <commit-hash>/
    ├── high_level.d2              # High-level D2 diagram
    ├── high_level.eraser          # High-level EraserDiagram
    ├── semi_detailed.d2           # Semi-detailed D2 diagram
    ├── semi_detailed.eraser       # Semi-detailed EraserDiagram
    ├── detailed.d2                # Detailed D2 diagram
    ├── detailed.eraser            # Detailed EraserDiagram
    └── token_report.txt           # Comprehensive analysis report
```

## 🎮 How to Use Swark 4.0

### Prerequisites
- VS Code with GitHub Copilot extension installed and authenticated
- Repository with git history (for commit-specific analysis)

### Running Analysis
1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. **Execute Command**: Type "Swark 4.0: Intelligent Repository Analysis"
3. **Select Repository**: Choose the repository folder you want to analyze
4. **Specify Commit**: Enter the commit hash for analysis (or use current state)
5. **Wait for Analysis**: Watch progress as the system processes your repository
6. **Review Results**: Open the generated output folder to explore diagrams and reports

### Understanding Output Files

#### D2 Diagrams (`.d2`)
- **Format**: Modern, declarative diagram syntax
- **Use Case**: Technical documentation, system architecture presentations
- **Rendering**: Can be rendered with D2 CLI tool or online viewers
- **Style**: Clean, professional appearance with automatic layout

#### EraserDiagram Files (`.eraser`)
- **Format**: Entity-relationship diagram syntax
- **Use Case**: Detailed system modeling, database design documentation
- **Rendering**: Compatible with EraserDiagram tools and editors
- **Style**: Focused on entities, relationships, and detailed attributes

#### Token Report (`token_report.txt`)
- **Content**: Comprehensive analysis metrics and file selections
- **Sections**: Repository info, token analysis, level breakdown, recommendations
- **Purpose**: Understand optimization achieved and validate coverage

## 🧩 Analysis Levels Explained

### High-Level Analysis
- **Focus**: System architecture and major components
- **File Selection**: Entry points, main configuration, primary interfaces
- **Token Usage**: Minimal - typically 5-15 files
- **Diagram Detail**: Bird's-eye view of system structure
- **Use Case**: Executive overviews, architectural presentations

### Semi-Detailed Analysis
- **Focus**: Component interactions and key implementations
- **File Selection**: Core business logic, important utilities, interface definitions
- **Token Usage**: Moderate - typically 15-30 files
- **Diagram Detail**: Module-level interactions and data flows
- **Use Case**: Technical documentation, design reviews

### Detailed Analysis
- **Focus**: Comprehensive system understanding
- **File Selection**: Most relevant source files, detailed implementations
- **Token Usage**: Higher - typically 30+ files
- **Diagram Detail**: Complete component relationships and internals
- **Use Case**: Code reviews, refactoring planning, onboarding

## 💡 Advanced Features

### File Importance Classification
- **Entry-Point**: Main application files, primary configuration
- **Core**: Business logic, key modules, important implementations
- **Utility**: Helper functions, tools, secondary configurations
- **Dependency**: Third-party libraries, external dependencies

### Intelligent Selection Criteria
- **Relevance**: Files most representative of the system at each level
- **Coverage**: Broad understanding of system components
- **Efficiency**: Optimal token usage without sacrificing comprehension
- **Dependencies**: Files that help understand component relationships

### Fallback Mechanisms
- **LLM Unavailable**: Rule-based selection using importance rankings
- **Parsing Failures**: Pattern matching for file extraction
- **Generation Errors**: Fallback diagram templates with basic structure

## 🔧 Technical Architecture

### Core Components
- **Swark4MetadataExtractor**: Repository scanning and analysis
- **LLMGuidedFileSelector**: AI-powered file selection system
- **Swark4OutputGenerator**: Multi-format diagram and report generation
- **RepositoryInputHandler**: User interaction and validation

### Key Technologies
- **VS Code API**: Extension framework and user interface
- **GitHub Copilot**: LLM integration for intelligent analysis
- **TypeScript**: Type-safe development with robust error handling
- **File System API**: Cross-platform repository access and processing

## 📊 Performance Metrics

### Token Efficiency
- **Traditional Approach**: Process entire repository (high token usage)
- **Swark 4.0 Approach**: Intelligent selection (typically 60-90% reduction)
- **Quality Maintenance**: Comprehensive coverage with optimized selection

### Analysis Speed
- **Metadata Extraction**: Fast repository scanning with selective reading
- **LLM Processing**: Optimized prompts for efficient AI interaction
- **Output Generation**: Parallel processing of multiple diagram formats

### Scalability
- **Large Repositories**: Handles codebases with thousands of files
- **Complex Dependencies**: Manages intricate relationship graphs
- **Memory Efficiency**: Streaming file processing without loading entire codebase

## 🚀 Getting Started

Ready to experience next-generation repository analysis? Install Swark 4.0 and discover how AI-powered file selection can transform your understanding of complex codebases while optimizing resource usage.

**Command**: `Swark 4.0: Intelligent Repository Analysis`

Transform your repository analysis workflow with the power of artificial intelligence! 🤖✨

---

*Swark 4.0 - Where Intelligence Meets Architecture Analysis*
