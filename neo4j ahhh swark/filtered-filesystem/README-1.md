

<p align="center">
    <img src="assets/logo/swark-logo-dark-mode.png" width="20%" />
</p>

Swark 2.0 is an enhanced VS Code extension that automatically generates architecture diagrams from your codebase using AI. It supports **both D2 and Eraser diagram formats** and includes **git commit-based analysis** for tracking architectural evolution over time.

- **D2 Format**: Clean, technical diagrams perfect for documentation
- **Eraser Format**: Visual, icon-rich diagrams ideal for presentations
- **Both Formats**: Generate diagrams in both formats simultaneously

- **High-Level**: Overview diagrams for stakeholders
- **Semi-Detailed**: Balanced view with module interactions
- **Detailed**: Comprehensive technical diagrams for developers
- **All Three**: Generate all levels at once

- **Commit-Based Analysis**: Analyze any commit in your repository history
- **Architecture Evolution**: Track how your architecture changes over time
- **Organized Output**: Files are organized by commit ID as shown in your reference diagram

Based on your handwritten diagram, Swark 2.0 organizes output files by commit structure:

```
<CHOSEN_REPO>/
├── Commit_ID_1/
│   ├── ERASER/
│   │   ├── High.md
│   │   ├── Semi.md
│   │   ├── Detail.md
│   │   ├── High-Eraser_Diagram
│   │   ├── Semi-Eraser_Diagram
│   │   └── Detail-Eraser_Diagram
│   └── D2/
│       ├── High.md
│       ├── Semi.md
│       ├── Detail.md
│       ├── High-D2_Diagram
│       ├── Semi-D2_Diagram
│       └── Detail-D2_Diagram
└── Commit_ID_2/
    └── (same structure)
```

1. Download the `.vsix` file from releases
2. In VS Code, run: `Extensions: Install from VSIX...`
3. Select the downloaded file

1. Open a folder/workspace in VS Code
2. Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. Or use Command Palette: `Swark 2.0: Create Architecture Diagram`

1. **Select Repository**: Choose the folder to analyze
2. **Git Integration** (if repository):
   - Choose from recent commits
   - Or analyze current working directory
3. **Choose Detail Level**: High-level, Semi-detailed, Detailed, or All
4. **Select Output Format**: D2, Eraser, or Both
5. **Wait for Generation**: AI analyzes your code and creates diagrams
6. **View Results**: Diagrams open automatically

- Technical, structured diagrams
- Perfect for documentation
- Integrates with D2 ecosystem
- Includes TerraStruct and D2 Playground links

- Visual, icon-rich diagrams
- Great for presentations
- Supports visual grouping
- Uses Eraser.io syntax

Access settings via `File > Preferences > Settings > Swark 2.0`:

- **Max Files**: Maximum number of files to analyze
- **File Extensions**: Which file types to include
- **Exclude Patterns**: Folders/files to ignore
- **Language Model**: AI model for generation
- **Default Output Format**: D2, Eraser, or Both

Swark 2.0 can analyze any commit in your repository:

1. **Automatic Detection**: Detects if folder is a git repository
2. **Commit Selection**: Shows recent commits with details
3. **Safe Checkout**: Temporarily switches to selected commit
4. **Automatic Restore**: Returns to original branch after analysis
5. **Change Warning**: Alerts about uncommitted changes

Files are organized by timestamp and commit information:

```
YYYY-MM-DD__HH-MM-SS__commit-<hash>__<level>-<format>-diagram.<ext>
```

```
2025-08-29__14-30-25__commit-abc123__high-level-d2-diagram.md
2025-08-29__14-30-25__commit-abc123__detailed-eraser-diagram.yaml
2025-08-29__14-30-25__commit-abc123__semi-log.md
```

- Python, JavaScript/TypeScript, Java, C/C++
- Go, Rust, PHP, Ruby, C
- Scala, Swift, Kotlin, Dart, Lua
- And more (configurable)

- VS Code 1.91.0+
- GitHub Copilot extension (for AI models)
- Git (optional, for commit analysis)

- `swark2.architecture`: Create Architecture Diagram

- `Ctrl+Shift+R` / `Cmd+Shift+R`: Generate diagram

Track how your architecture evolves:

1. Generate diagrams for different commits
2. Compare architectural changes over time
3. Document major refactoring efforts
4. Visualize system growth and complexity

- GPT-4o (recommended)
- Claude 3.5 Sonnet
- OpenAI o1 & o3-mini
- Gemini 2.0 Flash

1. **Use Claude 3.5 Sonnet** when available for better diagram quality
2. **Generate multiple times** - AI is non-deterministic
3. **Use commit analysis** to track architectural changes
4. **Choose appropriate detail level** for your audience
5. **Both formats** provide different perspectives on your architecture

**No diagrams generated**: Check file extensions and exclude patterns
**Git errors**: Ensure repository is clean or commit changes
**Large repositories**: Adjust max files setting
**Model errors**: Try different AI model

- 🎯 Dual format support (D2 + Eraser)
- 🔄 Git commit-based analysis
- 📊 Enhanced detail levels
- 🏗️ Organized output structure
- ⚡ Improved AI prompts

See LICENSE file for details.

- **GitHub**: [Issues and discussions](https://github.com/swark-io/swark)
- **Website**: [swark.io](https://swark.io)
- **Email**: contact@swark.io

---

**Swark 2.0** - Automatically visualize your code architecture in multiple formats and track its evolution over time.
