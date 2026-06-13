<p align="center">
    <a href="https://swark.io">
        <img src="https://raw.githubusercontent.com/swark-io/swark/refs/heads/main/assets/logo/swark-logo-dark-mode.png" width="10%" />
    </a>
</p>
<p align="center">
    <b>Automatic Architecture Diagrams from Code</b><br />
    <a href="https://github.com/swark-io/swark">GitHub</a> • <a href="https://swark.io">Website</a> • <a href="mailto:contact@swark.io">Contact Us</a>
</p>

## Usage Instructions

1. **Render the Diagram**: Copy the Eraser.io syntax below and paste it into [Eraser.io](https://app.eraser.io/) to render the diagram.
2. **Edit and Customize**: Use Eraser.io's visual editor to modify colors, layouts, and add additional elements.
3. **Export Options**: Export as PNG, SVG, or share via link directly from Eraser.io.

## Generated Content
**Generated**: 2025-09-01T05:03:06.430Z

**Format**: Eraser.io Architecture Diagram

```yaml
```yaml
title Swark 2.0 – High-Level Architecture

VS Code Extension [icon: code] {
  Commands [icon: terminal, label: "Handles user-triggered actions"] {
    Create Architecture Command [icon: flow, label: "Generates architecture diagrams"]
  }
  Telemetry [icon: graph, label: "Tracks usage and errors"]
}

Core Logic [icon: layers] {
  Repository Reader [icon: folder, label: "Reads and filters code files"]
  Prompt Builder [icon: pencil, label: "Generates prompts for AI"]
  Model Interactor [icon: robot, label: "Interacts with AI models"]
}

External Systems [icon: cloud] {
  AI Model [icon: brain, label: "Processes prompts and generates diagrams"]
  Git [icon: branch, label: "Provides repository metadata"]
}

# Connections
Commands > Repository Reader
Repository Reader > Prompt Builder
Prompt Builder > Model Interactor
Model Interactor > AI Model
Repository Reader > Git
Telemetry > AI Model
```
```