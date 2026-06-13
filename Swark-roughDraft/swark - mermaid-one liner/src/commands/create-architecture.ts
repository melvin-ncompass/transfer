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
import { MermaidLinkGenerator } from "../view/mermaid/link-generator";

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
        const header = `<p align="center">
    <a href="https://swark.io">
        <img src="https://raw.githubusercontent.com/swark-io/swark/refs/heads/main/assets/logo/swark-logo-dark-mode.png" width="10%" />
    </a>
</p>
<p align="center">
    <b>Automatic Architecture Diagrams from Code</b><br />
    <a href="https://github.com/swark-io/swark">GitHub</a> • <a href="https://swark.io">Website</a> • <a href="mailto:contact@swark.io">Contact Us</a>
</p>

## Usage Instructions

1. **Render the Diagrams**: Use the links below to open them in Mermaid Live Editor, or install the [Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension.
2. **Recommended Model**: If available for you, use \`claude-3.5-sonnet\` [language model](vscode://settings/swark.languageModel). It can process more files and generates better diagrams.
3. **Iterate for Best Results**: Language models are non-deterministic. Generate the diagram multiple times and choose the best result.

## Generated Content
**Model**: ${modelName} - [Change Model](vscode://settings/swark.languageModel)

---

`;

        // Extract mermaid code and create proper links for each diagram
        const highLevelMermaid = this.extractMermaidCode(highLevelResponse);
        const semiMermaid = this.extractMermaidCode(semiResponse);
        const detailedMermaid = this.extractMermaidCode(detailedResponse);

        const highLevelLinks = this.createMermaidLinks(highLevelMermaid);
        const semiLinks = this.createMermaidLinks(semiMermaid);
        const detailedLinks = this.createMermaidLinks(detailedMermaid);

        const highLevelSection = `## 🏗️ High-Level Architecture Diagram
*Overview diagram for stakeholders and business understanding*

**Mermaid Live Editor**: [View](${highLevelLinks.view}) | [Edit](${highLevelLinks.edit})

${highLevelResponse}

---

`;

        const semiSection = `## 🔧 Semi-Detailed Architecture Diagram  
*Module-level diagram showing system layers and key workflows*

**Mermaid Live Editor**: [View](${semiLinks.view}) | [Edit](${semiLinks.edit})

${semiResponse}

---

`;

        const detailedSection = `## 🔬 Detailed Architecture Diagram
*Comprehensive technical diagram for developers*

**Mermaid Live Editor**: [View](${detailedLinks.view}) | [Edit](${detailedLinks.edit})

${detailedResponse}

`;

        return header + highLevelSection + semiSection + detailedSection;
    }

    private static extractMermaidCode(response: string): string {
        try {
            const mermaidBlock = OutputFormatter.getMermaidBlock(response);
            return mermaidBlock.replace(/```mermaid|```/g, "").trim();
        } catch (error) {
            console.error("Error extracting Mermaid code:", error);
            return ""; // Return empty string if extraction fails
        }
    }

    private static createMermaidLinks(mermaidCode: string): { view: string; edit: string } {
        try {
            if (!mermaidCode) {
                return {
                    view: "https://mermaid.live/view",
                    edit: "https://mermaid.live/edit"
                };
            }
            
            const linkGenerator = new MermaidLinkGenerator(mermaidCode);
            return {
                view: linkGenerator.createViewLink(),
                edit: linkGenerator.createEditLink()
            };
        } catch (error) {
            console.error("Error creating Mermaid links:", error);
            return {
                view: "https://mermaid.live/view",
                edit: "https://mermaid.live/edit"
            };
        }
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
