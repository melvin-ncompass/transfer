# Swark 2.0 Changelog

## Version 2.0.0 - "Unified Architecture Generator" (August 29, 2025)

### 🎯 Major Features

#### Dual Format Support
- **NEW**: Generate diagrams in both D2 and Eraser formats
- **NEW**: Choose specific format or generate both simultaneously
- **ENHANCED**: Format-specific prompts optimized for each diagram type
- **NEW**: Configuration option for default output format

#### Git Commit Integration
- **NEW**: Analyze any commit in repository history
- **NEW**: Commit selection interface with metadata
- **NEW**: Safe checkout and restore functionality
- **NEW**: Uncommitted changes detection and warning
- **NEW**: Organized output by commit information

#### Enhanced Architecture Analysis
- **IMPROVED**: Better AI prompts for both D2 and Eraser formats
- **NEW**: Comprehensive system layer analysis
- **NEW**: Enhanced technical detail levels
- **IMPROVED**: Better component relationship mapping

### 🏗️ Repository Structure Organization

Following the handwritten specification diagram:

#### Output File Naming
```
YYYY-MM-DD__HH-MM-SS__[commit-hash]__[level]-[format]-diagram.[ext]
```

#### Supported Formats
- **D2 Format**: `.md` files with D2 syntax for technical documentation
- **Eraser Format**: `.yaml` files with Eraser.io syntax for visual presentations

#### Detail Levels
- **High-Level**: Stakeholder overview diagrams
- **Semi-Detailed**: Balanced technical and business view
- **Detailed**: Comprehensive developer documentation
- **All Three**: Generate all levels in one command

### 🔧 Technical Improvements

#### Codebase Structure
- **MERGED**: Combined Swark-Terrastruct and Swark-eraser codebases
- **NEW**: Unified command structure supporting both formats
- **ENHANCED**: Better error handling and user feedback
- **NEW**: Git utilities for repository management
- **IMPROVED**: Configuration system with more options

#### User Experience
- **NEW**: Format selection in quick pick interface
- **NEW**: Commit selection with rich metadata display
- **IMPROVED**: Progress indicators and status messages
- **NEW**: Better validation and error messages
- **ENHANCED**: Keyboard shortcuts and command palette integration

### 📊 Configuration Options

#### New Settings
- `swark2.defaultOutputFormat`: Default format (d2, eraser, both)
- `swark2.maxFiles`: Maximum files to analyze
- `swark2.fileExtensions`: Supported file types
- `swark2.excludePatterns`: Exclusion patterns
- `swark2.languageModel`: AI model selection

#### Commands
- `swark2.architecture`: Main architecture diagram generation command

#### Keybindings
- `Ctrl+Shift+R` / `Cmd+Shift+R`: Quick diagram generation

### 🎨 Output Enhancements

#### D2 Format Features
- Technical diagram structure
- Proper D2 syntax with nested containers
- Component relationships and data flows
- Integration with D2 ecosystem tools
- TerraStruct and D2 Playground links

#### Eraser Format Features
- Visual, icon-rich diagrams
- Comprehensive system layers
- Professional presentation format
- Proper Eraser.io syntax
- Group-based organization

### 🔍 Analysis Capabilities

#### Git Integration
- Recent commit browsing
- Commit metadata display (author, date, message)
- Temporal architecture analysis
- Evolution tracking support
- Branch management and restoration

#### Code Analysis
- Multi-language support
- Smart file filtering
- Token limit management
- Comprehensive system mapping
- Cross-layer relationship detection

### 📦 Package Information

#### Metadata
- **Name**: swark2
- **Display Name**: Swark 2.0
- **Version**: 2.0.0
- **Publisher**: swark
- **Engine**: VS Code ^1.91.0

#### Dependencies
- GitHub Copilot extension (required)
- Standard VS Code APIs
- Git (optional, for commit analysis)

### 🚀 Installation & Usage

#### Installation
1. Download or build the .vsix package
2. Install via VS Code Extensions: Install from VSIX
3. Reload VS Code window

#### Quick Start
1. Open any codebase in VS Code
2. Press `Ctrl+Shift+R` or use Command Palette
3. Select commit (if git repository) or use current directory
4. Choose diagram detail level and format
5. Wait for AI generation
6. View results in `swark-output/` folder

### 🎯 Breaking Changes from 1.x

#### Command Changes
- Old: `swark.architecture` → New: `swark2.architecture`
- Old: `swark.eraser.architecture` → Merged into unified command

#### Configuration Changes
- Settings moved from `swark.*` to `swark2.*`
- New configuration options for format selection
- Enhanced file filtering options

#### Output Changes
- New file naming convention with commit information
- Support for multiple formats in single generation
- Structured output organization

### 🔮 Future Roadmap

#### Planned Features
- Additional diagram formats (Mermaid, PlantUML)
- Advanced git analysis (branch comparisons, merge analysis)
- Architecture diff visualization
- Custom template support
- Team collaboration features

#### Improvements
- Performance optimizations
- Better AI model integration
- Enhanced error handling
- More customization options
- Extended language support

---

**Note**: This version represents a complete rewrite and unification of the original Swark extensions, providing a comprehensive solution for architecture diagram generation with both D2 and Eraser format support, plus advanced git integration for tracking architectural evolution over time.
