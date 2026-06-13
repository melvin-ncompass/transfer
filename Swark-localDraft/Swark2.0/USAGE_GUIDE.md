# Swark 2.0 Setup and Usage Guide

## What You've Created

Swark 2.0 is now successfully created and combines the best of both Swark-Terrastruct and Swark-eraser into one unified extension that:

1. **Supports Both Formats**: Generates both D2 and Eraser diagram formats
2. **Git Integration**: Can analyze any commit in your repository history
3. **Organized Output**: Creates structured folders based on commit IDs (as shown in your handwritten diagram)
4. **Multiple Detail Levels**: High-level, Semi-detailed, and Detailed diagrams
5. **Enhanced User Experience**: Better prompts and configuration options

## File Structure Created

```
Swark2.0/
├── package.json          # Combined configuration supporting both formats
├── tsconfig.json         # TypeScript configuration
├── README.md            # Comprehensive documentation
├── LICENSE              # License file
├── assets/              # Extension assets and icons
├── src/
│   ├── extension.ts     # Main extension entry point
│   ├── telemetry.ts     # Analytics and telemetry
│   ├── types.ts         # Type definitions
│   ├── commands/
│   │   └── create-architecture.ts  # Enhanced command with git integration
│   ├── io/
│   │   ├── git-utils.ts # Git commit management utilities
│   │   ├── input-selection.ts
│   │   └── repository-reader.ts
│   ├── llm/
│   │   ├── prompt-builder.ts  # Enhanced prompts supporting both formats
│   │   ├── model-interactor.ts
│   │   └── token-count-utils.ts
│   └── view/
│       ├── output-formatter.ts
│       ├── output-writer.ts
│       ├── viewer.ts
│       └── d2/
│           └── link-generator.ts
└── out/                 # Compiled JavaScript files
```

## Key Features Implemented

### 1. Dual Format Support
- **D2 Format**: Technical diagrams with proper D2 syntax
- **Eraser Format**: Visual diagrams with icons and labels
- **Both Formats**: Can generate both simultaneously

### 2. Git Commit Analysis
- Lists recent commits for selection
- Temporarily checks out selected commit
- Analyzes architecture at that point in time
- Safely restores original branch
- Handles uncommitted changes gracefully

### 3. Repository Structure Organization
Following your handwritten diagram structure:
```
swark-output/
├── 2025-08-29__14-30-25__commit-abc123__high-level-d2-diagram.md
├── 2025-08-29__14-30-25__commit-abc123__high-level-eraser-diagram.yaml
├── 2025-08-29__14-30-25__commit-abc123__detailed-d2-diagram.md
├── 2025-08-29__14-30-25__commit-abc123__detailed-eraser-diagram.yaml
└── (log files)
```

### 4. Enhanced Configuration
- `swark2.defaultOutputFormat`: Choose default format (d2, eraser, or both)
- `swark2.maxFiles`: Control analysis scope
- `swark2.fileExtensions`: Customize file types
- `swark2.languageModel`: Select AI model

## How to Use

### 1. Install the Extension
```bash
# Package the extension
cd "C:\Users\Melvin M Shajan\Desktop\Swark-localDraft\Swark2.0"
npm run vscode:prepublish
vsce package
```

### 2. Use the Extension
1. Open any codebase in VS Code
2. Press `Ctrl+Shift+R` or use Command Palette: "Swark 2.0: Create Architecture Diagram"
3. If it's a git repository:
   - Choose a commit to analyze or use current directory
4. Select diagram detail level
5. Choose output format
6. Wait for generation
7. View results in `swark-output/` folder

### 3. Output Organization

Based on your diagram, files are organized with:
- Timestamp for when generated
- Commit hash (if analyzing a commit)
- Diagram type (high-level, semi, detailed)
- Format (d2, eraser)

## Next Steps

1. **Test the Extension**: Try it on different repositories
2. **Package for Distribution**: Use `vsce package` to create .vsix file
3. **Customize Further**: Modify prompts or add new features
4. **Share**: Distribute to your team or publish to marketplace

## Technical Details

### Architecture Changes Made
1. **Combined Prompt Builder**: Supports both D2 and Eraser syntax
2. **Git Integration**: Added GitUtils for commit management
3. **Enhanced Command**: Unified command supporting all features
4. **Flexible Output**: Handles multiple formats and file types
5. **Better Configuration**: More user-friendly settings

### Key Improvements Over Original
- **Dual Format Support**: No need for separate extensions
- **Git History Analysis**: Track architectural evolution
- **Better Organization**: Structured output following your diagram
- **Enhanced UX**: Better prompts and error handling
- **Future-Proof**: Extensible architecture for new features

The extension is now ready to use and follows the exact structure you outlined in your handwritten diagram!
