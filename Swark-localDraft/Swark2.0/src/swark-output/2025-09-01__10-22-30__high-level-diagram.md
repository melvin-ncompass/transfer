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
**D2 Playground**: [Edit](https://play.d2lang.com/?script=%23%20High-Level%20Architecture%20Diagram%20for%20Swark%202.0%0A%0A%23%20External%20Systems%0Aexternal_systems%3A%20%7B%0A%20%20%20%20label%3A%20%22External%20Systems%22%0A%20%20%20%20shape%3A%20cloud%0A%20%20%20%20style.fill%3A%20%22%23f0f8ff%22%0A%0A%20%20%20%20vscode%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22VS%20Code%5CnIDE%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20github%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22GitHub%5CnCopilot%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20telemetry_service%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Telemetry%20Service%5Cn(Azure%20App%20Insights)%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Core%20Application%0Acore_application%3A%20%7B%0A%20%20%20%20label%3A%20%22Swark%202.0%20Core%22%0A%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%0A%20%20%20%20commands%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Commands%5Cn(e.g.%2C%20Create%20Architecture)%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%0A%20%20%20%20io_layer%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22I%2FO%20Layer%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%0A%20%20%20%20%20%20%20%20repository_reader%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Repository%20Reader%5CnReads%20and%20filters%20files%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20git_utils%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Git%20Utils%5CnHandles%20Git%20operations%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20llm_layer%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22LLM%20Interaction%20Layer%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%0A%20%20%20%20%20%20%20%20model_interactor%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Model%20Interactor%5CnManages%20AI%20model%20requests%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20prompt_builder%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Prompt%20Builder%5CnGenerates%20prompts%20for%20AI%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20view_layer%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22View%20Layer%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%0A%20%20%20%20%20%20%20%20output_formatter%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Output%20Formatter%5CnFormats%20diagrams%20and%20logs%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20output_writer%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Output%20Writer%5CnWrites%20files%20to%20disk%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20viewer%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20label%3A%20%22Viewer%5CnDisplays%20diagrams%20in%20VS%20Code%22%0A%20%20%20%20%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20telemetry%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Telemetry%5CnLogs%20usage%20data%22%0A%20%20%20%20%20%20%20%20shape%3A%20box%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Connections%0Aexternal_systems.vscode%20-%3E%20core_application.commands%3A%20%22User%20triggers%20commands%22%0Acore_application.commands%20-%3E%20core_application.io_layer.repository_reader%3A%20%22Reads%20repository%20files%22%0Acore_application.commands%20-%3E%20core_application.llm_layer.model_interactor%3A%20%22Sends%20prompts%20to%20AI%22%0Acore_application.llm_layer.model_interactor%20-%3E%20external_systems.github%3A%20%22Interacts%20with%20GitHub%20Copilot%22%0Acore_application.llm_layer.prompt_builder%20-%3E%20core_application.llm_layer.model_interactor%3A%20%22Builds%20prompts%22%0Acore_application.commands%20-%3E%20core_application.view_layer.output_formatter%3A%20%22Formats%20AI%20responses%22%0Acore_application.view_layer.output_formatter%20-%3E%20core_application.view_layer.output_writer%3A%20%22Writes%20output%20files%22%0Acore_application.view_layer.output_writer%20-%3E%20external_systems.vscode%3A%20%22Saves%20files%20to%20workspace%22%0Acore_application.view_layer.viewer%20-%3E%20external_systems.vscode%3A%20%22Displays%20diagrams%22%0Acore_application.telemetry%20-%3E%20external_systems.telemetry_service%3A%20%22Sends%20telemetry%20data%22) | **TerraStruct**: [Open](https://app.terrastruct.com/)

```d2
# High-Level Architecture Diagram for Swark 2.0

# External Systems
external_systems: {
    label: "External Systems"
    shape: cloud
    style.fill: "#f0f8ff"

    vscode: {
        label: "VS Code\nIDE"
        shape: box
    }

    github: {
        label: "GitHub\nCopilot"
        shape: box
    }

    telemetry_service: {
        label: "Telemetry Service\n(Azure App Insights)"
        shape: box
    }
}

# Core Application
core_application: {
    label: "Swark 2.0 Core"
    style.fill: "#e6f3ff"

    commands: {
        label: "Commands\n(e.g., Create Architecture)"
        shape: box
    }

    io_layer: {
        label: "I/O Layer"
        shape: box

        repository_reader: {
            label: "Repository Reader\nReads and filters files"
            shape: box
        }

        git_utils: {
            label: "Git Utils\nHandles Git operations"
            shape: box
        }
    }

    llm_layer: {
        label: "LLM Interaction Layer"
        shape: box

        model_interactor: {
            label: "Model Interactor\nManages AI model requests"
            shape: box
        }

        prompt_builder: {
            label: "Prompt Builder\nGenerates prompts for AI"
            shape: box
        }
    }

    view_layer: {
        label: "View Layer"
        shape: box

        output_formatter: {
            label: "Output Formatter\nFormats diagrams and logs"
            shape: box
        }

        output_writer: {
            label: "Output Writer\nWrites files to disk"
            shape: box
        }

        viewer: {
            label: "Viewer\nDisplays diagrams in VS Code"
            shape: box
        }
    }

    telemetry: {
        label: "Telemetry\nLogs usage data"
        shape: box
    }
}

# Connections
external_systems.vscode -> core_application.commands: "User triggers commands"
core_application.commands -> core_application.io_layer.repository_reader: "Reads repository files"
core_application.commands -> core_application.llm_layer.model_interactor: "Sends prompts to AI"
core_application.llm_layer.model_interactor -> external_systems.github: "Interacts with GitHub Copilot"
core_application.llm_layer.prompt_builder -> core_application.llm_layer.model_interactor: "Builds prompts"
core_application.commands -> core_application.view_layer.output_formatter: "Formats AI responses"
core_application.view_layer.output_formatter -> core_application.view_layer.output_writer: "Writes output files"
core_application.view_layer.output_writer -> external_systems.vscode: "Saves files to workspace"
core_application.view_layer.viewer -> external_systems.vscode: "Displays diagrams"
core_application.telemetry -> external_systems.telemetry_service: "Sends telemetry data"
```