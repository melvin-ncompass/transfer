

Swark 5.5 introduces the most advanced repository analysis workflow yet, featuring commit awareness, intelligent regex-based filtering, and comprehensive multi-level diagram generation.

- 📋 **Automatic Commit Fetching**: Retrieves all commits from repository history
- 🎯 **Interactive Commit Selection**: Select any commit from a user-friendly list
- 🔄 **Smart Checkout**: Temporarily switches to selected commit for analysis

- 📊 **Repository Scanning**: Complete file list with sizes and estimates
- 🏗️ **Directory Structure**: Visual tree representation
- 🔗 **Dependency Analysis**: Automated discovery of file relationships

- 🧠 **Language Detection**: Automatically identifies programming languages
- 🎯 **Smart Pattern Recognition**: Dynamically applies exclusion/inclusion patterns
- 📈 **File Classification**: Categorizes files by importance:
  - `critical-entry-point` - Main application entry points
  - `core-module` - Essential business logic
  - `supporting-utility` - Helper functions and utilities
  - `low-priority` - Configuration, docs, etc.

- 🧹 **Comment Removal**: Strips inline and block comments
- 📏 **Whitespace Cleanup**: Removes unnecessary blank lines
- 🎯 **Content Preservation**: Maintains code structure and functionality

LLM generates intelligent patterns to determine:
- ✅ **Included files**: `src/**/*.ts`, `app/**/*.py`, `lib/**/*.java`
- ❌ **Excluded files**: `tests/**`, `docs/**`, `dist/**`, `node_modules/**`

Advanced filtering removes noise while preserving logic:
- 🗣️ **Logging/Debug**: `console.log()`, `print()`, `logger.info()`
- 🧪 **Test Blocks**: `describe()`, `it()`, `@Test`, assertion blocks
- 📥 **Unused Imports**: Import statements not referenced later
- 📄 **Boilerplate**: License headers, auto-generated comments

Based on regex filtering and classification:
- 🔭 **High-level view**: Entry points + architecture drivers
- 🔍 **Semi-detailed view**: Main logic modules
- 🔬 **Detailed view**: All relevant files post-filtering

Creates organized output in `swark_output/<commit-hash>/`:

- `high_level.d2` / `high_level.eraser`
- `semi_detailed.d2` / `semi_detailed.eraser`  
- `detailed.d2` / `detailed.eraser`

- Worst-case tokens (entire repo)
- Tokens after file-level filtering
- Tokens after content-level filtering
- Final tokens used
- Detailed breakdown by file and language

- 🎯 **Dynamic Language Detection**
- 🔧 **Intelligent Regex Generation**
- 📏 **Consistent Filtering Application**
- 🏗️ **Structural Diagram Correctness**

```
Swark 5.5: Commit-Aware Regex-Filtered Multi-Level Analysis
```

1. **Select Repository** - Choose your git repository
2. **Select Commit** - Pick from interactive commit list
3. **Metadata Analysis** - Automatic language detection and dependency analysis
4. **Regex Generation** - LLM creates intelligent filtering patterns
5. **Content Processing** - Apply file and content-level filters
6. **Multi-Level Output** - Generate comprehensive diagrams and reports

```
your-repo/
└── swark_output/
    └── <commit-hash>/
        ├── high_level.d2
        ├── high_level.eraser
        ├── semi_detailed.d2
        ├── semi_detailed.eraser
        ├── detailed.d2
        ├── detailed.eraser
        └── token_report.txt
```

| Feature | Swark 5.0 | Swark 5.5 |
|---------|-----------|-----------|
| Commit Selection | Manual hash entry | Interactive selection from list |
| Language Detection | Basic patterns | LLM-powered dynamic detection |
| File Filtering | Simple patterns | Intelligent regex generation |
| Content Filtering | Basic cleaning | Advanced noise removal |
| Output Levels | Single level | Three-tier detailed analysis |
| Token Reporting | Basic count | Comprehensive breakdown |

- **`Swark55MetadataExtractor`**: Repository scanning and analysis
- **`Swark55RegexGenerator`**: LLM-powered pattern generation  
- **`Swark55ContentFilter`**: Multi-level content processing
- **`Swark55OutputGenerator`**: Diagram and report generation

- VS Code Extension API
- GitHub Copilot (for LLM integration)
- Git (for commit handling)
- TypeScript/Node.js runtime

- VS Code 1.91.0+
- GitHub Copilot extension
- Git repository
- Node.js runtime

1. Install the Swark 5.5 extension
2. Open VS Code in a git repository
3. Open Command Palette (`Ctrl+Shift+P`)
4. Run "Swark 5.5: Commit-Aware Regex-Filtered Multi-Level Analysis"
5. Follow the interactive prompts
6. Review generated diagrams and reports

- 📊 **Repository Documentation**
- 🏗️ **Architecture Analysis**  
- 🔍 **Code Review Preparation**
- 📈 **Technical Debt Assessment**
- 🚀 **Onboarding New Developers**
- 📋 **Compliance Documentation**

- Real-time collaboration features
- Custom regex pattern templates
- Integration with popular diagramming tools
- Export to additional formats
- Automated documentation generation

---

**Swark 5.5**: The ultimate intelligent repository analysis tool for modern development teams.
