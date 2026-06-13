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
**D2 Playground**: [Edit](https://play.d2lang.com/?script=%23%20High-Level%20Architecture%20Diagram%20for%20Swark%202.0%0A%0A%23%20External%20Systems%0Aexternal_systems%3A%20%7B%0A%20%20%20%20label%3A%20%22External%20Systems%22%0A%20%20%20%20shape%3A%20cloud%0A%20%20%20%20style.fill%3A%20%22%23f0f8ff%22%0A%0A%20%20%20%20vscode_marketplace%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22VS%20Code%20Marketplace%5CnExtension%20Distribution%22%0A%20%20%20%20%20%20%20%20shape%3A%20cloud%0A%20%20%20%20%7D%0A%0A%20%20%20%20azure_monitor%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Azure%20Application%20Insights%5CnTelemetry%20Data%22%0A%20%20%20%20%20%20%20%20shape%3A%20cloud%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Core%20Components%0Acore_components%3A%20%7B%0A%20%20%20%20label%3A%20%22Core%20Components%22%0A%20%20%20%20style.fill%3A%20%22%23e6f3ff%22%0A%0A%20%20%20%20extension_entry%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Extension%20Entry%20Point%5Cn(Activate%2FDeactivate)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%0A%20%20%20%20telemetry_module%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Telemetry%20Module%5Cn(Usage%20Tracking)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%0A%20%20%20%20command_handler%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Command%20Handler%5Cn(Generate%20Diagrams)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%0A%20%20%20%20llm_interaction%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22LLM%20Interaction%5Cn(Model%20Selection%20%26%20Prompting)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%0A%20%20%20%20repository_reader%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Repository%20Reader%5Cn(File%20Analysis)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%0A%20%20%20%20output_generator%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22Output%20Generator%5Cn(Diagram%20%26%20Logs)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20User%20Interface%0Auser_interface%3A%20%7B%0A%20%20%20%20label%3A%20%22User%20Interface%22%0A%20%20%20%20style.fill%3A%20%22%23f8f9fa%22%0A%0A%20%20%20%20vscode_ui%3A%20%7B%0A%20%20%20%20%20%20%20%20label%3A%20%22VS%20Code%20UI%5Cn(Command%20Palette%2C%20Notifications)%22%0A%20%20%20%20%20%20%20%20shape%3A%20rectangle%0A%20%20%20%20%7D%0A%7D%0A%0A%23%20Connections%0Aexternal_systems.vscode_marketplace%20-%3E%20core_components.extension_entry%3A%20%22Extension%20Activation%22%0Acore_components.extension_entry%20-%3E%20core_components.telemetry_module%3A%20%22Initialize%20Telemetry%22%0Acore_components.extension_entry%20-%3E%20core_components.command_handler%3A%20%22Register%20Commands%22%0Acore_components.command_handler%20-%3E%20core_components.llm_interaction%3A%20%22Send%20Prompts%22%0Acore_components.command_handler%20-%3E%20core_components.repository_reader%3A%20%22Analyze%20Repository%22%0Acore_components.command_handler%20-%3E%20core_components.output_generator%3A%20%22Generate%20Outputs%22%0Acore_components.llm_interaction%20-%3E%20external_systems.azure_monitor%3A%20%22Send%20Telemetry%20Data%22%0Acore_components.output_generator%20-%3E%20user_interface.vscode_ui%3A%20%22Show%20Diagrams%20%26%20Logs%22) | **TerraStruct**: [Open](https://app.terrastruct.com/)

```d2
# High-Level Architecture Diagram for Swark 2.0

# External Systems
external_systems: {
    label: "External Systems"
    shape: cloud
    style.fill: "#f0f8ff"

    vscode_marketplace: {
        label: "VS Code Marketplace\nExtension Distribution"
        shape: cloud
    }

    azure_monitor: {
        label: "Azure Application Insights\nTelemetry Data"
        shape: cloud
    }
}

# Core Components
core_components: {
    label: "Core Components"
    style.fill: "#e6f3ff"

    extension_entry: {
        label: "Extension Entry Point\n(Activate/Deactivate)"
        shape: rectangle
    }

    telemetry_module: {
        label: "Telemetry Module\n(Usage Tracking)"
        shape: rectangle
    }

    command_handler: {
        label: "Command Handler\n(Generate Diagrams)"
        shape: rectangle
    }

    llm_interaction: {
        label: "LLM Interaction\n(Model Selection & Prompting)"
        shape: rectangle
    }

    repository_reader: {
        label: "Repository Reader\n(File Analysis)"
        shape: rectangle
    }

    output_generator: {
        label: "Output Generator\n(Diagram & Logs)"
        shape: rectangle
    }
}

# User Interface
user_interface: {
    label: "User Interface"
    style.fill: "#f8f9fa"

    vscode_ui: {
        label: "VS Code UI\n(Command Palette, Notifications)"
        shape: rectangle
    }
}

# Connections
external_systems.vscode_marketplace -> core_components.extension_entry: "Extension Activation"
core_components.extension_entry -> core_components.telemetry_module: "Initialize Telemetry"
core_components.extension_entry -> core_components.command_handler: "Register Commands"
core_components.command_handler -> core_components.llm_interaction: "Send Prompts"
core_components.command_handler -> core_components.repository_reader: "Analyze Repository"
core_components.command_handler -> core_components.output_generator: "Generate Outputs"
core_components.llm_interaction -> external_systems.azure_monitor: "Send Telemetry Data"
core_components.output_generator -> user_interface.vscode_ui: "Show Diagrams & Logs"
```