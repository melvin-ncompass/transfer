import * as vscode from "vscode";
import { selectFolder } from "../io/input-selection";
import { ModelInteractor } from "../llm/model-interactor";
import { PromptBuilder } from "../llm/prompt-builder";
import { OutputFormatter } from "../view/output-formatter";
import { OutputWriter } from "../view/output-writer";
import { TokenCounter } from "../types";
import { RepositoryReader } from "../io/repository-reader";
import { countTotalTokens, getMaxTokensForFiles } from "../llm/token-count-utils";
import { telemetry } from "../telemetry";
import { showDiagram } from "../view/viewer";
import { File } from "../types";

export class CreateArchitectureCommand {
    public static async run(): Promise<void> {
        const selectedFolder = await selectFolder();
        const model = await ModelInteractor.getModel();
        const tokenCounter = model.countTokens;

        const files = await this.readRepositoryFiles(selectedFolder, tokenCounter, model.maxInputTokens);
        
        // Ask user which type of diagram they want
        const diagramType = await vscode.window.showQuickPick(
            [
                { label: "High-Level", value: "high-level", description: "Overview diagram for stakeholders" },
                { label: "Semi", value: "semi", description: "Moderate detail diagram showing modules and workflows" },
                { label: "Detailed", value: "detailed", description: "Comprehensive diagram for developers" },
                { label: "All 3", value: "all", description: "Generate all three types of diagrams" }
            ],
            {
                placeHolder: "Select the type of architecture diagram to generate",
                matchOnDescription: true
            }
        );

        if (!diagramType) {
            return; // User cancelled
        }

        if (diagramType.value === "all") {
            await this.generateAllDiagrams(selectedFolder, model, tokenCounter, files);
        } else {
            await this.generateSingleDiagram(selectedFolder, model, tokenCounter, files, diagramType.value);
        }
    }

    private static async readRepositoryFiles(
        selectedFolder: vscode.Uri,
        tokenCounter: TokenCounter,
        llmMaxInputTokens: number
    ): Promise<File[]> {
        const maxTokens = await getMaxTokensForFiles(llmMaxInputTokens, tokenCounter);
        const repositoryReader = new RepositoryReader(selectedFolder, tokenCounter, maxTokens);
        return await repositoryReader.readFiles();
    }

    private static async logTotalTokens(
        prompt: vscode.LanguageModelChatMessage[],
        tokenCounter: TokenCounter
    ): Promise<void> {
        const totalTokens = await countTotalTokens(prompt, tokenCounter);
        console.log("Number of tokens in prompt:" + totalTokens);
        telemetry.sendTelemetryEvent("promptBuilt", {}, { totalTokens });
    }

    private static async sendPrompt(
        model: vscode.LanguageModelChat,
        prompt: vscode.LanguageModelChatMessage[]
    ): Promise<string> {
        const startTime = performance.now();

        const response = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Creating architecture diagram...",
            },
            async (_progress) => {
                return await ModelInteractor.sendPrompt(model, prompt);
            }
        );

        const endTime = performance.now();
        telemetry.sendTelemetryEvent("promptSent", {}, { responseTime: endTime - startTime });
        return response;
    }

    private static async writeOutputFiles(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        response: string,
        files: File[],
        diagramType?: string
    ): Promise<vscode.Uri> {
        const outputFolder = this.getOutputFolder(selectedFolder);
        const writer = new OutputWriter(outputFolder);
        const [diagramUri, _] = await Promise.all([
            this.writeDiagramFile(model, response, writer, diagramType),
            this.writeLogFile(files, selectedFolder, model, writer, diagramType),
        ]);
        return diagramUri;
    }

    private static getOutputFolder(selectedFolder: vscode.Uri): vscode.Uri {
        const rootFolder = this.getRootFolder(selectedFolder);
        return vscode.Uri.joinPath(rootFolder, "swark-output");
    }

    private static getRootFolder(selectedFolder: vscode.Uri): vscode.Uri {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (workspaceFolder) {
            return workspaceFolder.uri;
        }

        telemetry.sendTelemetryEvent("noWorkspaceFolder");
        return selectedFolder;
    }

    private static async writeDiagramFile(
        model: vscode.LanguageModelChat,
        response: string,
        writer: OutputWriter,
        diagramType?: string
    ): Promise<vscode.Uri> {
        const diagramFileContent = OutputFormatter.getDiagramFileContent(model.name, response);
        const uri = await writer.writeDiagramFile(diagramFileContent, diagramType);
        return uri;
    }

    private static async writeLogFile(
        files: File[],
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        writer: OutputWriter,
        diagramType?: string
    ): Promise<void> {
        const filePaths = files.map((file) => file.path);
        const logFileContent = OutputFormatter.getLogFileContent(selectedFolder, model, filePaths);
        await writer.writeLogFile(logFileContent, diagramType);
    }

    private static async writeCombinedOutputFiles(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        highLevelResponse: string,
        semiResponse: string,
        detailedResponse: string,
        files: File[]
    ): Promise<vscode.Uri> {
        const outputFolder = this.getOutputFolder(selectedFolder);
        const writer = new OutputWriter(outputFolder);
        
        // Create combined diagram content
        const combinedContent = this.createCombinedDiagramContent(
            model.name, 
            highLevelResponse, 
            semiResponse, 
            detailedResponse
        );
        
        const [diagramUri, _] = await Promise.all([
            writer.writeDiagramFile(combinedContent, "all-three"),
            this.writeLogFile(files, selectedFolder, model, writer, "all-three"),
        ]);
        
        return diagramUri;
    }

    private static createCombinedDiagramContent(
        modelName: string,
        highLevelResponse: string,
        semiResponse: string,
        detailedResponse: string
    ): string {
        // Extract eraser code
        const highLevelEraser = this.extractEraserCode(highLevelResponse);
        const semiEraser = this.extractEraserCode(semiResponse);
        const detailedEraser = this.extractEraserCode(detailedResponse);

        const highLevelLinks = this.createEraserLinks(highLevelEraser);
        const semiLinks = this.createEraserLinks(semiEraser);
        const detailedLinks = this.createEraserLinks(detailedEraser);

        return `# 🏗️ Architecture Diagrams

<div align="center">

[![Swark](https://raw.githubusercontent.com/swark-io/swark/refs/heads/main/assets/logo/swark-logo-dark-mode.png)](https://swark.io)

**Automatic Architecture Diagrams from Code**  
[GitHub](https://github.com/swark-io/swark) • [Website](https://swark.io) • [Contact](mailto:contact@swark.io)

</div>

---

## 📋 Diagram Information

| **Property** | **Value** |
|--------------|-----------|
| **Generated by** | ${modelName} |
| **Timestamp** | ${new Date().toLocaleString()} |
| **Format** | Eraser.io Cloud Architecture |
| **Diagram Types** | High-Level, Semi-Detailed, Detailed |

---

## 🚀 Quick Actions

<div align="center">

### [⚙️ **Change Language Model**](vscode://settings/swark.eraser.languageModel)
*Switch to a different AI model for better results*

### [🏠 **Open Eraser Workspace**](https://app.eraser.io/workspace/qaNiop5qECxiRnMwgmYj)
*Access your workspace to create new diagrams*

</div>

---

## 📖 How to Use

### ✨ Quick Start (Recommended)
1. **Click any "Open in Eraser Workspace" link below** → Instantly opens with your diagram ready to edit
2. **Choose your diagram type** → High-level for overview, Detailed for technical depth
3. **Customize visually** → Add colors, rearrange components, modify layout
4. **Export & Share** → Download as PNG, SVG, or share with your team

### 🔧 Advanced Options
- **Better AI Models**: Try \`claude-3.5-sonnet\` for more complex architectures
- **Iterate**: Generate multiple times to get the best result
- **Integration**: Embed diagrams in documentation or presentations

### 💡 Pro Tips
- **Real-time Collaboration**: Share workspace link for team editing
- **Version Control**: Export diagrams to track architecture evolution  
- **Professional Formats**: Use for technical documentation and presentations

---

## 🏗️ High-Level Architecture Diagram
*Overview diagram for stakeholders and business understanding*

<div align="center">

### [🎨 **Open in Eraser Workspace**](${highLevelLinks.autoCreate})
*Click to automatically create and edit this diagram online*

</div>

\`\`\`eraser
${highLevelEraser}
\`\`\`

---

## 🔧 Semi-Detailed Architecture Diagram  
*Module-level diagram showing system layers and key workflows*

<div align="center">

### [🎨 **Open in Eraser Workspace**](${semiLinks.autoCreate})
*Click to automatically create and edit this diagram online*

</div>

\`\`\`eraser
${semiEraser}
\`\`\`

---

## 🔬 Detailed Architecture Diagram
*Comprehensive technical diagram for developers*

<div align="center">

### [🎨 **Open in Eraser Workspace**](${detailedLinks.autoCreate})
*Click to automatically create and edit this diagram online*

</div>

\`\`\`eraser
${detailedEraser}
\`\`\`

---

<div align="center">
<em>Generated by Swark - Bringing your code architecture to life</em>
</div>
`;
    }

    private static extractEraserCode(response: string): string {
        try {
            const eraserBlock = OutputFormatter.getEraserBlock(response);
            return eraserBlock.replace(/```eraser|```/g, "").trim();
        } catch (error) {
            console.error("Error extracting Eraser code:", error);
            return ""; // Return empty string if extraction fails
        }
    }

    private static createEraserLinks(eraserCode: string): { edit: string; autoCreate: string } {
        return {
            edit: `https://app.eraser.io/workspace/qaNiop5qECxiRnMwgmYj`,
            autoCreate: `https://app.eraser.io/workspace/qaNiop5qECxiRnMwgmYj`
        };
    }

    private static async generateSingleDiagram(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        diagramType: string
    ): Promise<void> {
        let prompt: vscode.LanguageModelChatMessage[];
        
        switch (diagramType) {
            case "detailed":
                prompt = PromptBuilder.createDetailedPrompt(files);
                break;
            case "semi":
                prompt = PromptBuilder.createSemiPrompt(files);
                break;
            case "high-level":
            default:
                prompt = PromptBuilder.createPrompt(files);
                break;
        }
        
        await this.logTotalTokens(prompt, tokenCounter);
        const response = await this.sendPrompt(model, prompt);
        const diagramUri = await this.writeOutputFiles(selectedFolder, model, response, files, diagramType);
        await showDiagram(diagramUri);
    }

    private static async generateBothDiagrams(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[]
    ): Promise<void> {
        // Generate high-level diagram
        const highLevelPrompt = PromptBuilder.createPrompt(files);
        await this.logTotalTokens(highLevelPrompt, tokenCounter);
        const highLevelResponse = await this.sendPrompt(model, highLevelPrompt);
        const highLevelUri = await this.writeOutputFiles(selectedFolder, model, highLevelResponse, files, "high-level");

        // Generate detailed diagram
        const detailedPrompt = PromptBuilder.createDetailedPrompt(files);
        await this.logTotalTokens(detailedPrompt, tokenCounter);
        const detailedResponse = await this.sendPrompt(model, detailedPrompt);
        const detailedUri = await this.writeOutputFiles(selectedFolder, model, detailedResponse, files, "detailed");

        // Show both diagrams
        await showDiagram(highLevelUri);
        await showDiagram(detailedUri);
    }

    private static async generateAllDiagrams(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[]
    ): Promise<void> {
        // Generate high-level diagram
        const highLevelPrompt = PromptBuilder.createPrompt(files);
        await this.logTotalTokens(highLevelPrompt, tokenCounter);
        const highLevelResponse = await this.sendPrompt(model, highLevelPrompt);

        // Generate semi diagram
        const semiPrompt = PromptBuilder.createSemiPrompt(files);
        await this.logTotalTokens(semiPrompt, tokenCounter);
        const semiResponse = await this.sendPrompt(model, semiPrompt);

        // Generate detailed diagram
        const detailedPrompt = PromptBuilder.createDetailedPrompt(files);
        await this.logTotalTokens(detailedPrompt, tokenCounter);
        const detailedResponse = await this.sendPrompt(model, detailedPrompt);

        // Create combined diagram file
        const combinedUri = await this.writeCombinedOutputFiles(
            selectedFolder, 
            model, 
            highLevelResponse, 
            semiResponse, 
            detailedResponse, 
            files
        );
        
        await showDiagram(combinedUri);
    }
}
