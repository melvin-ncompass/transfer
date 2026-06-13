# 📁 Pure Syntax Files Added

## ✅ **New File Types Created**

I've added creation of pure syntax files with the exact content you need, in addition to the formatted markdown files.

### 🔧 **New Files Generated:**

For each diagram level (high-level, semi, detailed), you'll now get:

#### **Formatted Files** (existing):
- `[timestamp]__[level]-d2-diagram.md` - D2 in markdown format
- `[timestamp]__[level]-eraser-diagram.md` - Eraser in markdown format

#### **Pure Syntax Files** (NEW):
- `[timestamp]__[level].d2` - **Pure D2 syntax only**
- `[timestamp]__[level].eraserdiagram` - **Pure Eraser syntax only**

### 📁 **Output Structure Example:**
```
swark-output/
├── commit-abc123d/
│   ├── 2025-09-01__12-00-00__high-level-d2-diagram.md     # Formatted D2
│   ├── 2025-09-01__12-00-00__high-level.d2               # Pure D2 ✨ NEW
│   ├── 2025-09-01__12-00-00__high-level-eraser-diagram.md # Formatted Eraser
│   ├── 2025-09-01__12-00-00__high-level.eraserdiagram    # Pure Eraser ✨ NEW
│   ├── 2025-09-01__12-00-00__semi-d2-diagram.md
│   ├── 2025-09-01__12-00-00__semi.d2                     # Pure D2 ✨ NEW
│   ├── 2025-09-01__12-00-00__semi-eraser-diagram.md
│   ├── 2025-09-01__12-00-00__semi.eraserdiagram          # Pure Eraser ✨ NEW
│   ├── 2025-09-01__12-00-00__detailed-d2-diagram.md
│   ├── 2025-09-01__12-00-00__detailed.d2                 # Pure D2 ✨ NEW
│   ├── 2025-09-01__12-00-00__detailed-eraser-diagram.md
│   └── 2025-09-01__12-00-00__detailed.eraserdiagram      # Pure Eraser ✨ NEW
```

### 📝 **Pure Syntax File Content Example:**

#### **.d2 file:**
```d2
# High-Level Architecture Diagram

# Frontend
frontend: {
  label: "Frontend"
  style.fill: "#e6f3ff"
  
  vue_app: {
    label: "Vue Application\nUser interface built with Vue.js"
    shape: browser
  }
}

# Backend
backend: {
  label: "Backend"
  style.fill: "#f8f9fa"
  
  amplify_backend: {
    label: "AWS Amplify Backend\nManages authentication and data services"
    shape: cloud
  }
}

# Connections
frontend.vue_app -> backend.amplify_backend: "Amplify.configure(outputs)"
```

#### **.eraserdiagram file:**
```yaml
title High-Level Architecture

Frontend [icon: globe] {
  Vue Application [icon: browser, label: "User interface built with Vue.js"]
}

Backend [icon: cloud] {
  AWS Amplify Backend [icon: aws, label: "Manages authentication and data services"]
}

Vue Application > AWS Amplify Backend: "Amplify.configure(outputs)"
```

### 🔧 **Implementation Details:**

1. **Content Extraction**: Smart extraction of pure syntax from AI responses
2. **Code Block Parsing**: Handles content within ```d2 and ```yaml blocks
3. **Markdown Cleanup**: Removes headers, bold text, and formatting
4. **Custom Extensions**: Uses `.d2` and `.eraserdiagram` extensions
5. **Clean Syntax**: Only the diagram syntax, no extra formatting

### 🚀 **Usage:**

- **Direct Copy-Paste**: Copy content directly from `.d2` or `.eraserdiagram` files
- **Tool Integration**: Use with D2 CLI or Eraser.io directly
- **No Formatting**: Pure syntax without markdown wrapper

The extension is compiled and ready! Next time you generate diagrams, you'll get both the formatted markdown files AND the pure syntax files with clean `.d2` and `.eraserdiagram` extensions! 🎯
