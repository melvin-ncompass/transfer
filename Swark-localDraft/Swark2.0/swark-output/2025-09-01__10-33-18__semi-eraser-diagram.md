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
**Generated**: 2025-09-01T05:03:18.346Z

**Format**: Eraser.io Architecture Diagram

```yaml
```yaml
title VS Code Extension – Architecture Diagram

VS Code Extension [icon: vscode] {
  Activation Layer [icon: play-circle] {
    Activate Function [icon: play, label: "Initializes telemetry and commands"]
    Deactivate Function [icon: stop, label: "Cleans up resources"]
  }
  Command Layer [icon: terminal] {
    Create Architecture Command [icon: code, label: "Handles diagram generation"]
  }
}

Core Logic [icon: layers] {
  Telemetry [icon: chart-bar, label: "Logs user actions and events"]
  Repository Reader [icon: folder, label: "Reads and filters code files"]
  Prompt Builder [icon: pencil, label: "Generates prompts for AI models"]
  Model Interactor [icon: robot, label: "Interacts with AI models"]
}

External Integrations [icon: cloud] {
  VS Code API [icon: plug, label: "Provides extension APIs"]
  AI Models [icon: brain, label: "Processes prompts and generates diagrams"]
}

# Connections
Activate Function > Create Architecture Command
Create Architecture Command > Repository Reader
Repository Reader > Prompt Builder
Prompt Builder > Model Interactor
Model Interactor > AI Models
AI Models > Model Interactor
Model Interactor > Create Architecture Command
```
```