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
**D2 Playground**: [Edit](https://play.d2lang.com/?script=%23%20High-Level%20Architecture%20Diagram%20for%20Swark%202.0%0A%0A%23%20External%20Resources%0Aexternal_resources%3A%20%7B%0A%20%20%20%20label%3A%20%22External%20Resources%22%0A%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%0A%20%20%20%20vscode_api%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22VS%20Code%20API%5CnProvides%20extension%20APIs%22%0A%20%20%20%20%20%20%20%20shape%3A%20cloud%0A%20%20%20%20%7D%0A%0A%20%20%20%20git_repo%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Git%20Repository%5CnSource%20code%20and%20version%20control%22%0A%20%20%20%20%20%20%20%20shape%3A%20cylinder%0A%20%20%20%20%7D%0A%0A%20%20%20%20telemetry_service%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Telemetry%20Service%5CnLogs%20and%20analytics%22%0A%20%20%20%20%20%20%20%20shape%3A%20cloud%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Core%20Components%0Acore_components%3A%20%7B%0A%20%20%20%20label%3A%20%22Core%20Components%22%0A%20%20%20%20style.fill%3A%20%22%23f8f9fa%22%0A%0A%20%20%20%20extension%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Extension%20Entry%20Point%5CnActivates%20and%20manages%20commands%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20telemetry%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Telemetry%5CnHandles%20event%20logging%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20repository_reader%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Repository%20Reader%5CnReads%20and%20processes%20files%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20model_interactor%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Model%20Interactor%5CnInteracts%20with%20AI%20models%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20prompt_builder%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Prompt%20Builder%5CnGenerates%20prompts%20for%20AI%20models%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20output_formatter%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Output%20Formatter%5CnFormats%20AI%20responses%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20output_writer%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Output%20Writer%5CnWrites%20diagrams%20and%20logs%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Connections%0Aexternal_resources.vscode_api%20-%3E%20core_components.extension%0Aexternal_resources.git_repo%20-%3E%20core_components.repository_reader%0Aexternal_resources.telemetry_service%20-%3E%20core_components.telemetry%0A%0Acore_components.extension%20-%3E%20core_components.repository_reader%0Acore_components.extension%20-%3E%20core_components.model_interactor%0Acore_components.model_interactor%20-%3E%20core_components.prompt_builder%0Acore_components.prompt_builder%20-%3E%20core_components.output_formatter%0Acore_components.output_formatter%20-%3E%20core_components.output_writer) | **TerraStruct**: [Open](https://app.terrastruct.com/)

```d2
# High-Level Architecture Diagram for Swark 2.0

# External Resources
external_resources: {
    label: "External Resources"
    style.fill: "#e6f3ff"

    vscode_api: {
        label: "VS Code API\nProvides extension APIs"
        shape: cloud
    }

    git_repo: {
        label: "Git Repository\nSource code and version control"
        shape: cylinder
    }

    telemetry_service: {
        label: "Telemetry Service\nLogs and analytics"
        shape: cloud
    }
}

# Core Components
core_components: {
    label: "Core Components"
    style.fill: "#f8f9fa"

    extension: {
        label: "Extension Entry Point\nActivates and manages commands"
        shape: box
    }

    telemetry: {
        label: "Telemetry\nHandles event logging"
        shape: box
    }

    repository_reader: {
        label: "Repository Reader\nReads and processes files"
        shape: box
    }

    model_interactor: {
        label: "Model Interactor\nInteracts with AI models"
        shape: box
    }

    prompt_builder: {
        label: "Prompt Builder\nGenerates prompts for AI models"
        shape: box
    }

    output_formatter: {
        label: "Output Formatter\nFormats AI responses"
        shape: box
    }

    output_writer: {
        label: "Output Writer\nWrites diagrams and logs"
        shape: box
    }
}

# Connections
external_resources.vscode_api -> core_components.extension
external_resources.git_repo -> core_components.repository_reader
external_resources.telemetry_service -> core_components.telemetry

core_components.extension -> core_components.repository_reader
core_components.extension -> core_components.model_interactor
core_components.model_interactor -> core_components.prompt_builder
core_components.prompt_builder -> core_components.output_formatter
core_components.output_formatter -> core_components.output_writer
```