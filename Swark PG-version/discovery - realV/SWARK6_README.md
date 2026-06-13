# Swark 6.0 - LLM-Powered Universal Architecture Analyzer

![Swark 6.0 Logo](assets/logo/swark-logo-dark-mode.png)

## 🚀 Revolutionary Architecture Analysis

Swark 6.0 represents a **complete paradigm shift** from hardcoded patterns to **intelligent LLM-powered analysis**. This extension can now analyze **any programming language** and generate proper architectural diagrams automatically.

## ✨ What's New in 6.0

### 🧠 **LLM-Powered Intelligence**
- **Universal Language Detection** - Automatically detects ANY programming language or framework
- **Intelligent File Classification** - LLM understands language-specific patterns and architectural conventions  
- **Dynamic Diagram Generation** - Creates appropriate D2 diagrams tailored to your specific codebase
- **Context-Aware Analysis** - Understands project structure, dependencies, and architectural patterns

### 🌍 **Universal Language Support**
Now supports **every programming language** including:
- **Web:** JavaScript, TypeScript, Vue, React, Angular, Svelte, HTML, CSS
- **Backend:** Python, Java, Go, Rust, PHP, Ruby, C#, C/C++, Kotlin, Scala
- **Data:** JSON, YAML, XML, SQL, GraphQL, MongoDB
- **Mobile:** Swift, Dart, Flutter, React Native
- **Emerging:** Any new language the LLM knows about

### 🎯 **Intelligent Analysis**
- **Smart Entry Point Detection** - Finds main application files across any language
- **Core Module Identification** - Identifies critical business logic and services
- **Dependency Understanding** - Maps relationships between components
- **Framework Recognition** - Understands Spring, Django, Express, Laravel, etc.

## 🔧 **How It Works**

1. **Open any repository** in VS Code
2. **Run Command:** `Swark 6.0: LLM-Powered Architecture Analysis`
3. **Select output folder** for generated diagrams
4. **Choose git commit** to analyze
5. **Get intelligent analysis** with proper D2 diagrams

## 📊 **Generated Outputs**

### Multi-Level Architecture Diagrams
- **High-Level:** Overview of main components and entry points
- **Semi-Detailed:** Module relationships and data flow
- **Detailed:** All processed files and dependencies

### Multiple Formats
- **D2 Diagrams** (.d2) - View with VS Code D2 extension or https://play.d2lang.com
- **Eraser Diagrams** (.eraser) - View at https://app.eraser.io
- **Analysis Summary** (.md) - Comprehensive breakdown of findings

## 🚀 **Installation & Usage**

### Requirements
- VS Code 1.91.0 or higher
- GitHub Copilot extension (for LLM access)

### Installation
1. Download `swark6-6.0.0.vsix`
2. In VS Code: `Extensions` → `...` → `Install from VSIX`
3. Select the downloaded file

### Usage
1. Open any code repository
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type: `Swark 6.0: LLM-Powered Architecture Analysis`
4. Follow the prompts to generate your architecture analysis

## 🎨 **Example Outputs**

### Vue.js Application
```d2
title: Vue.js Application Architecture

frontend: Frontend Layer {
  main_js: main.js {
    shape: circle
    style.fill: "#4CAF50"
  }
  
  app_vue: App.vue {
    shape: rectangle
    style.fill: "#4FC08D"
  }
  
  components: Components {
    shape: rectangle
    style.fill: "#35495E"
  }
}

main_js -> app_vue: bootstraps
app_vue -> components: renders
```

### Python Django Project
```d2
title: Django Application Architecture

backend: Backend Services {
  manage_py: manage.py {
    shape: circle
    style.fill: "#306998"
  }
  
  models: Models {
    shape: rectangle
    style.fill: "#FFD43B"
  }
  
  views: Views {
    shape: rectangle
    style.fill: "#306998"
  }
}

manage_py -> views: routes
views -> models: queries
```

## 🧠 **LLM Integration**

Swark 6.0 uses advanced language models to:
- **Understand context** of your codebase
- **Recognize patterns** across any programming language
- **Generate accurate diagrams** reflecting real architecture
- **Provide fallback analysis** if LLM is unavailable

## 🔒 **Privacy & Security**

- Uses GitHub Copilot's LLM infrastructure
- Only analyzes file paths and structures (not sensitive code content)
- No data stored externally
- Graceful fallback to heuristic analysis

## 📈 **Performance**

- **Smart file sampling** to avoid token limits
- **Parallel processing** for multiple diagram formats
- **Efficient caching** of LLM responses
- **Optimized prompts** for better results

## 🆚 **Comparison with Previous Versions**

| Feature | Swark 5.5 | Swark 6.0 |
|---------|-----------|-----------|
| **Language Support** | Hardcoded patterns | Universal LLM detection |
| **File Classification** | Static rules | Intelligent LLM analysis |
| **Diagram Quality** | Template-based | Context-aware generation |
| **Adaptability** | Limited to known languages | Any programming language |
| **Intelligence** | Pattern matching | LLM understanding |

## 🐛 **Troubleshooting**

### Common Issues
1. **"LLM not available"** → Ensure GitHub Copilot is installed and authenticated
2. **"No diagrams generated"** → Check output folder permissions
3. **"Analysis takes too long"** → Try with smaller repositories first

### Support
- GitHub Issues: [Report bugs and feature requests](https://github.com/swark/swark)
- Documentation: [Full documentation](https://swark.io/docs)

## 🚀 **Future Roadmap**

- **Real-time analysis** as you code
- **Architectural suggestions** and improvements  
- **Code quality insights** from LLM analysis
- **Integration** with popular development tools

---

**Swark 6.0** - *Intelligence meets Architecture*

Transform any codebase into beautiful, accurate architectural diagrams with the power of LLM analysis!
