import * as vscode from "vscode";
import { D2LinkGenerator } from "./d2/link-generator";
import { telemetry } from "../telemetry";

export class OutputFormatter {
    public static getDiagramFileContent(modelName: string, llmResponse: string): string {
        let d2Block = this.getD2Block(llmResponse);
        let d2Code = d2Block.replace(/```d2|```/g, "").trim();

        const linkGenerator = new D2LinkGenerator(d2Code);

        return `<p align="center">
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
2. **Recommended Model**: If available for you, use \`claude-3.5-sonnet\` [language model](vscode://settings/swark.languageModel). It can process more files and generates better diagrams.
3. **Iterate for Best Results**: Language models are non-deterministic. Generate the diagram multiple times and choose the best result.

## Generated Content
**Model**: ${modelName} - [Change Model](vscode://settings/swark.languageModel)  
**D2 Playground**: [Edit](${linkGenerator.createViewLink()}) | **TerraStruct**: [Open](${linkGenerator.createTerraStructLink()})

${d2Block}`;
    }

    public static getD2Block(llmResponse: string): string {
        const matches = llmResponse.match(/```d2[\s\S]*```/);

        if (!matches) {
            throw new Error("No D2 block found in the language model response. Please try again.");
        }

        const block = matches[0];

        if (block !== llmResponse) {
            telemetry.sendTelemetryEvent("llmResponseContainedExtraPayload");
        }

        return block;
    }

    public static getLogFileContent(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        filePaths: string[]
    ): string {
        const json = JSON.stringify(
            {
                selectedFolder: selectedFolder.fsPath,
                model: { family: model.family, name: model.name, maxInputTokens: model.maxInputTokens },
                numFilesUsed: filePaths.length,
            },
            null,
            4
        );

        return `# Swark Log File

## Info
\`\`\`json
${json}
\`\`\`

## Files Used
\`\`\`
total ${filePaths.length}  
${filePaths.join("\n")}
\`\`\``;
    }
}
