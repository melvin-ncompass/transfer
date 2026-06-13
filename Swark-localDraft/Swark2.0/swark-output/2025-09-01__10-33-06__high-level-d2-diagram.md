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

1. **Render the Diagram**: Use the links below to open it in D2 Playground (free) or TerraStruct (requires account), or install the [D2 VS Code extension](https://marketplace.visualstudio.com/items?itemName=terrastruct.d2) for local rendering.
2. **Recommended Model**: If available for you, use `claude-3.5-sonnet` [language model](vscode://settings/swark.languageModel). It can process more files and generates better diagrams.
3. **Iterate for Best Results**: Language models are non-deterministic. Generate the diagram multiple times and choose the best result.

## Generated Content
**Model**: gpt-4o gpt-4o-2024-11-20 - [Change Model](vscode://settings/swark.languageModel)  
**D2 Playground**: [Edit](https://play.d2lang.com/?script=%23%20Main%20Components%0Aextension%3A%20%7B%0A%20%20%20%20label%3A%20%22VS%20Code%20Extension%5CnEntry%20point%20for%20the%20extension%22%0A%20%20%20%20shape%3A%20box%0A%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%0A%20%20%20%20commands%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Commands%5CnHandles%20user-triggered%20actions%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23f8f9fa%22%0A%0A%20%20%20%20%20%20%20%20create_architecture%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Create%20Architecture%20Command%5CnGenerates%20architecture%20diagrams%22%0A%20%20%20%20%20%20%20%20%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20telemetry%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Telemetry%5CnTracks%20usage%20and%20errors%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23f8f9fa%22%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Core%20Logic%0Acore%3A%20%7B%0A%20%20%20%20label%3A%20%22Core%20Logic%5CnProcesses%20repository%20data%22%0A%20%20%20%20shape%3A%20box%0A%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%0A%20%20%20%20repository_reader%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Repository%20Reader%5CnReads%20and%20filters%20code%20files%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%20%20%20%20%7D%0A%0A%20%20%20%20model_interactor%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Model%20Interactor%5CnInteracts%20with%20AI%20models%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%20%20%20%20%7D%0A%0A%20%20%20%20prompt_builder%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Prompt%20Builder%5CnGenerates%20prompts%20for%20AI%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20External%20Systems%0Aexternal%3A%20%7B%0A%20%20%20%20label%3A%20%22External%20Systems%22%0A%20%20%20%20shape%3A%20cloud%0A%20%20%20%20style.fill%3A%20%22%23f8f9fa%22%0A%0A%20%20%20%20ai_model%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22AI%20Model%5CnProcesses%20prompts%20and%20generates%20diagrams%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%20%20%20%20%7D%0A%0A%20%20%20%20git%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Git%5CnProvides%20repository%20metadata%22%0A%20%20%20%20%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Connections%0Aextension.commands.create_architecture%20-%3E%20core.repository_reader%0Acore.repository_reader%20-%3E%20core.prompt_builder%0Acore.prompt_builder%20-%3E%20core.model_interactor%0Acore.model_interactor%20-%3E%20external.ai_model%0Acore.repository_reader%20-%3E%20external.git%0Aextension.telemetry%20-%3E%20external.ai_model) | **TerraStruct**: [Open](https://app.terrastruct.com/)

```d2
# Main Components
extension: {
    label: "VS Code Extension\nEntry point for the extension"
    shape: box
    style.fill: "#e6f3ff"

    commands: {
        label: "Commands\nHandles user-triggered actions"
        style.fill: "#f8f9fa"

        create_architecture: {
            label: "Create Architecture Command\nGenerates architecture diagrams"
            style.fill: "#e6f3ff"
        }
    }

    telemetry: {
        label: "Telemetry\nTracks usage and errors"
        style.fill: "#f8f9fa"
    }
}

# Core Logic
core: {
    label: "Core Logic\nProcesses repository data"
    shape: box
    style.fill: "#e6f3ff"

    repository_reader: {
        label: "Repository Reader\nReads and filters code files"
        style.fill: "#e6f3ff"
    }

    model_interactor: {
        label: "Model Interactor\nInteracts with AI models"
        style.fill: "#e6f3ff"
    }

    prompt_builder: {
        label: "Prompt Builder\nGenerates prompts for AI"
        style.fill: "#e6f3ff"
    }
}

# External Systems
external: {
    label: "External Systems"
    shape: cloud
    style.fill: "#f8f9fa"

    ai_model: {
        label: "AI Model\nProcesses prompts and generates diagrams"
        style.fill: "#e6f3ff"
    }

    git: {
        label: "Git\nProvides repository metadata"
        style.fill: "#e6f3ff"
    }
}

# Connections
extension.commands.create_architecture -> core.repository_reader
core.repository_reader -> core.prompt_builder
core.prompt_builder -> core.model_interactor
core.model_interactor -> external.ai_model
core.repository_reader -> external.git
extension.telemetry -> external.ai_model
```