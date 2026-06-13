# Swark 5.0: Advanced Repository Analysis with Intelligent Filtering & Code Cleaning

**Swark 5.0** represents the next evolution in intelligent repository analysis, introducing revolutionary **LLM-guided file filtering** and **automatic code cleaning** to dramatically reduce token usage while maintaining analysis accuracy.

## 🚀 What's New in Swark 5.0

### 🔍 LLM-Guided File Filtering
- **Intelligent Exclusion**: Automatically excludes unnecessary files that don't contribute to architectural understanding
- **Pattern Recognition**: Filters out documentation (*.md, *.rst), auto-generated files (*.pb.go, *.gen.ts), tests, configs, and media files
- **Context-Aware**: Uses LLM to understand which files are truly relevant for analysis

### 🧹 Automatic Code Cleaning
- **Comment Removal**: Strips out all inline and block comments while preserving code logic
- **Whitespace Optimization**: Removes unnecessary blank lines and normalizes indentation
- **Language-Aware**: Supports cleaning for JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, and more
- **Token Reduction**: Achieves 40-70% token reduction while maintaining code structure

### 📊 Comprehensive Token Reporting
- **Multi-Stage Analysis**: Tracks tokens at every stage (original → filtered → cleaned → used)
- **Reduction Metrics**: Shows exact percentage savings from filtering and cleaning
- **File Processing Stats**: Detailed breakdown of files processed at each stage

## 🎯 Complete Workflow

### 1. **Input Stage**
- Prompts for repository selection
- Requests specific commit hash for analysis
- Validates input and sets up analysis scope

### 2. **Metadata Extraction**
- Scans repository and calculates total token size
- Analyzes file dependencies and relationships
- Classifies files by importance (entry-point, core, utility, dependency)
- Generates repository structure overview

### 3. **LLM-Guided File Filtering** ⭐ *New in 5.0*
- Passes metadata to LLM for intelligent filtering
- Excludes unnecessary files that don't contribute to understanding:
  - Documentation files (*.md, *.rst, LICENSE)
  - Auto-generated files (*.pb.go, *.gen.ts, openapi.json)
  - Test files (tests/, *.test.js, *.spec.ts)
  - Configuration files (.env, package-lock.json, *.toml)
  - Asset files (images, fonts, media)

### 4. **File Pre-Processing** ⭐ *New in 5.0*
- **Comment Stripping**: Removes all comments while preserving code logic
- **Whitespace Optimization**: Eliminates unnecessary blank lines and normalizes indentation
- **Token Recalculation**: Updates token estimates post-cleaning for accurate reporting

### 5. **File Selection by Analysis Level**
- **High-level**: Entry points and core architectural components (5-15 files)
- **Semi-detailed**: Core business logic and important modules (15-30 files)
- **Detailed**: Comprehensive analysis including utilities and implementations (30+ files)

### 6. **Multi-Format Output Generation**
Creates a `swark_output/<commit-hash>/` folder containing:
- **D2 Diagrams**: `high_level.d2`, `semi_detailed.d2`, `detailed.d2`
- **Eraser Diagrams**: `high_level.eraser`, `semi_detailed.eraser`, `detailed.eraser`
- **Token Report**: `token_report.txt` with comprehensive usage analytics

## 📈 Performance Benefits

### Token Efficiency
- **Filtering Stage**: 40-60% reduction by removing irrelevant files
- **Cleaning Stage**: 20-40% additional reduction by removing comments/whitespace
- **Total Reduction**: Up to 70% overall token usage reduction
- **Maintained Accuracy**: Preserves all essential architectural information

### Analysis Quality
- **Precision Filtering**: LLM understands context better than rule-based systems
- **Multi-Level Views**: Provides appropriate detail for different stakeholder needs
- **Dependency Awareness**: Maintains critical relationship information
- **Scalability**: Enables analysis of larger repositories within token limits

## 🛠️ Usage Instructions

### Prerequisites
- **VS Code**: Latest version
- **GitHub Copilot**: Installed and authenticated
- **Git Repository**: Local repository to analyze

### Running Swark 5.0

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. **Run Command**: Type "Swark 5.0: Advanced Repository Analysis with Filtering & Cleaning"
3. **Select Repository**: Choose the repository folder when prompted
4. **Specify Commit**: Enter commit hash or leave empty for HEAD
5. **Wait for Analysis**: Progress will be shown in the notification area

### Output Location
Results are saved to: `<repository>/swark_output/<commit-hash>/`

### Generated Files
- `high_level.d2` - High-level D2 architecture diagram
- `high_level.eraser` - High-level Eraser diagram
- `semi_detailed.d2` - Semi-detailed D2 architecture diagram
- `semi_detailed.eraser` - Semi-detailed Eraser diagram
- `detailed.d2` - Detailed D2 architecture diagram
- `detailed.eraser` - Detailed Eraser diagram
- `token_report.txt` - Comprehensive token usage report

## 📊 Token Report Example

```
# Swark 5.0 Token Usage Report

## Token Reduction Summary
📊 WORST-CASE (Full Repository):     125,000 tokens
🔍 AFTER LLM FILTERING:              45,000 tokens
🧹 AFTER CODE CLEANING:              32,000 tokens
🎯 ACTUAL TOKENS USED:               28,000 tokens

## Reduction Percentages
🔍 Filtering Reduction:              64.0%
🧹 Cleaning Reduction:               28.9%
🚀 TOTAL REDUCTION:                  77.6%

## File Processing Summary
📁 Original Files:                  1,247
🔍 After Filtering:                 267
🎯 Finally Selected:                89
```

## 🔧 Technical Implementation

### Architecture
- **Modular Design**: Separate modules for filtering, cleaning, selection, and output
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Error Handling**: Robust fallback mechanisms for each stage
- **Progress Tracking**: Real-time progress updates during analysis

### Key Components
- `Swark5MetadataExtractor`: Enhanced metadata extraction with dependency analysis
- `Swark5FileFilter`: LLM-powered intelligent file filtering
- `CodeCleaner`: Multi-language comment and whitespace removal
- `Swark5OutputGenerator`: Enhanced output generation with token reporting

### Supported Languages
- **File Filtering**: All file types
- **Code Cleaning**: JavaScript, TypeScript, Python, Java, C/C++, C#, Go, Rust, Ruby, Lua, Scala, Swift, Kotlin, PHP
- **Dependency Analysis**: JavaScript/TypeScript, Python, Java, Go

## 🆚 Comparison with Previous Versions

| Feature | Swark 4.0 | Swark 5.0 |
|---------|-----------|-----------|
| File Filtering | Rule-based | LLM-guided |
| Code Processing | Raw files | Cleaned files |
| Token Reduction | ~30% | ~70% |
| Analysis Quality | Good | Excellent |
| Report Detail | Basic | Comprehensive |
| Multi-format Output | ✅ | ✅ |
| Scalability | Limited | Enhanced |

## 🤝 Contributing

Swark 5.0 is built to be extensible:
- Add new language support in `CodeCleaner`
- Enhance filtering patterns in `Swark5FileFilter`
- Improve diagram generation prompts in `Swark5OutputGenerator`
- Extend metadata extraction in `Swark5MetadataExtractor`

## 📝 License

See LICENSE file for details.

---

**Swark 5.0**: Where intelligent filtering meets code clarity for unprecedented repository analysis efficiency! 🚀
