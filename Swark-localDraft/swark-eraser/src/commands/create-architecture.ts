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
import { GitUtils, GitCommit } from "../io/git-utils";

export class CreateArchitectureCommand {
    public static async run(): Promise<void> {
        const selectedFolder = await selectFolder();
        const folderPath = selectedFolder.fsPath;
        
        // Check if this is a git repository
        const isGitRepo = await GitUtils.isGitRepository(folderPath);
        
        let selectedCommit: GitCommit | null = null;
        let originalBranch: string | null = null;
        let needsRestore = false;

        if (isGitRepo) {
            // Check for uncommitted changes
            const hasChanges = await GitUtils.hasUncommittedChanges(folderPath);
            if (hasChanges) {
                const choice = await vscode.window.showWarningMessage(
                    "You have uncommitted changes. The extension will temporarily checkout different commits. Do you want to continue?",
                    { modal: true },
                    "Continue",
                    "Cancel"
                );
                
                if (choice !== "Continue") {
                    return;
                }
            }

            // Get current branch for restoration later
            originalBranch = await GitUtils.getCurrentBranch(folderPath);
            
            // Get recent commits and let user select one
            selectedCommit = await this.selectCommit(folderPath);
            if (!selectedCommit) {
                return; // User cancelled
            }

            // Checkout the selected commit
            const success = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Checking out commit ${selectedCommit.shortHash}...`,
                },
                async () => {
                    return await GitUtils.checkoutCommit(folderPath, selectedCommit!.hash);
                }
            );

            if (!success) {
                vscode.window.showErrorMessage("Failed to checkout the selected commit.");
                return;
            }
            
            needsRestore = true;
        }

        try {
            const model = await ModelInteractor.getModel();
            const tokenCounter = model.countTokens;

            const files = await this.readRepositoryFiles(selectedFolder, tokenCounter, model.maxInputTokens);
            
            // Ask user which type of diagram they want
            const diagramType = await vscode.window.showQuickPick(
                [
                    { 
                        label: "$(symbol-structure) High-Level", 
                        value: "high-level", 
                        description: "Overview diagram for stakeholders",
                        detail: "Simple architecture overview with main components and connections"
                    },
                    { 
                        label: "$(symbol-module) Semi-Detailed", 
                        value: "semi", 
                        description: "Moderate detail diagram showing modules and workflows",
                        detail: "Balanced view with module interactions and key data flows"
                    },
                    { 
                        label: "$(symbol-class) Detailed", 
                        value: "detailed", 
                        description: "Comprehensive diagram for developers",
                        detail: "Technical deep-dive with classes, methods, and implementation details"
                    },
                    { 
                        label: "$(symbol-array) All 3 Types", 
                        value: "all", 
                        description: "Generate all three types of diagrams",
                        detail: "Creates high-level, semi-detailed, and detailed diagrams in one file"
                    }
                ],
                {
                    placeHolder: selectedCommit 
                        ? `Select diagram type for commit ${selectedCommit.shortHash}: ${selectedCommit.message}`
                        : "Select the type of architecture diagram to generate",
                    matchOnDescription: true,
                    ignoreFocusOut: true
                }
            );

            if (!diagramType) {
                return; // User cancelled
            }

            if (diagramType.value === "all") {
                await this.generateAllDiagrams(selectedFolder, model, tokenCounter, files, selectedCommit);
            } else {
                await this.generateSingleDiagram(selectedFolder, model, tokenCounter, files, diagramType.value, selectedCommit);
            }

        } finally {
            // Restore original branch/commit if needed
            if (needsRestore && originalBranch) {
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: `Restoring original branch ${originalBranch}...`,
                    },
                    async () => {
                        await GitUtils.checkoutCommit(folderPath, originalBranch!);
                    }
                );
            }
        }
    }

    private static async selectCommit(folderPath: string): Promise<GitCommit | null> {
        const commits = await GitUtils.getRecentCommits(folderPath, 25);
        
        if (commits.length === 0) {
            vscode.window.showInformationMessage("No commits found in this repository.");
            return null;
        }

        const quickPickItems = commits.map(commit => ({
            ...GitUtils.formatCommitForQuickPick(commit),
            commit: commit
        }));

        // Add option to use current state
        const currentCommit = await GitUtils.getCurrentCommit(folderPath);
        quickPickItems.unshift({
            label: "$(circle-filled) Current State",
            description: "Use current working directory (may include uncommitted changes)",
            detail: currentCommit ? `Current commit: ${currentCommit.substring(0, 7)}` : "No commit info",
            alwaysShow: true,
            commit: undefined as any
        });

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: "Select a commit to generate architecture diagram from",
            matchOnDescription: true,
            ignoreFocusOut: true
        });

        return selected ? selected.commit : null;
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
        diagramType?: string,
        selectedCommit?: GitCommit | null
    ): Promise<vscode.Uri> {
        const outputFolder = this.getOutputFolder(selectedFolder);
        const writer = new OutputWriter(outputFolder);
        const [diagramUri, _] = await Promise.all([
            this.writeDiagramFile(model, response, writer, diagramType, selectedCommit),
            this.writeLogFile(files, selectedFolder, model, writer, diagramType, selectedCommit),
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
        diagramType?: string,
        selectedCommit?: GitCommit | null
    ): Promise<vscode.Uri> {
        const diagramFileContent = OutputFormatter.getDiagramFileContent(model.name, response, selectedCommit);
        const uri = await writer.writeDiagramFile(diagramFileContent, diagramType);
        return uri;
    }

    private static async writeLogFile(
        files: File[],
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        writer: OutputWriter,
        diagramType?: string,
        selectedCommit?: GitCommit | null
    ): Promise<void> {
        const filePaths = files.map((file) => file.path);
        const logFileContent = OutputFormatter.getLogFileContent(selectedFolder, model, filePaths, selectedCommit);
        await writer.writeLogFile(logFileContent, diagramType);
    }

    private static async writeCombinedOutputFiles(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        highLevelResponse: string,
        semiResponse: string,
        detailedResponse: string,
        files: File[],
        selectedCommit?: GitCommit | null
    ): Promise<vscode.Uri> {
        const outputFolder = this.getOutputFolder(selectedFolder);
        const writer = new OutputWriter(outputFolder);
        
        // Create combined diagram content
        const combinedContent = this.createCombinedDiagramContent(
            model.name, 
            highLevelResponse, 
            semiResponse, 
            detailedResponse,
            selectedCommit
        );
        
        const [diagramUri, _] = await Promise.all([
            writer.writeDiagramFile(combinedContent, "all-three"),
            this.writeLogFile(files, selectedFolder, model, writer, "all-three", selectedCommit),
        ]);
        
        return diagramUri;
    }

    private static createCombinedDiagramContent(
        modelName: string,
        highLevelResponse: string,
        semiResponse: string,
        detailedResponse: string,
        selectedCommit?: GitCommit | null
    ): string {
        // Extract eraser code
        const highLevelEraser = this.extractEraserCode(highLevelResponse);
        const semiEraser = this.extractEraserCode(semiResponse);
        const detailedEraser = this.extractEraserCode(detailedResponse);

        const highLevelLinks = this.createEraserLinks(highLevelEraser);
        const semiLinks = this.createEraserLinks(semiEraser);
        const detailedLinks = this.createEraserLinks(detailedEraser);

        const commitInfo = selectedCommit 
            ? `| **Source Commit** | ${selectedCommit.shortHash}: ${selectedCommit.message} |
| **Commit Author** | ${selectedCommit.author} |
| **Commit Date** | ${selectedCommit.date} |`
            : '';

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
${commitInfo}

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
        diagramType: string,
        selectedCommit?: GitCommit | null
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
        const diagramUri = await this.writeOutputFiles(selectedFolder, model, response, files, diagramType, selectedCommit);
        await showDiagram(diagramUri);
    }

    private static async generateBothDiagrams(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        selectedCommit?: GitCommit | null
    ): Promise<void> {
        // Generate high-level diagram
        const highLevelPrompt = PromptBuilder.createPrompt(files);
        await this.logTotalTokens(highLevelPrompt, tokenCounter);
        const highLevelResponse = await this.sendPrompt(model, highLevelPrompt);
        const highLevelUri = await this.writeOutputFiles(selectedFolder, model, highLevelResponse, files, "high-level", selectedCommit);

        // Generate detailed diagram
        const detailedPrompt = PromptBuilder.createDetailedPrompt(files);
        await this.logTotalTokens(detailedPrompt, tokenCounter);
        const detailedResponse = await this.sendPrompt(model, detailedPrompt);
        const detailedUri = await this.writeOutputFiles(selectedFolder, model, detailedResponse, files, "detailed", selectedCommit);

        // Show both diagrams
        await showDiagram(highLevelUri);
        await showDiagram(detailedUri);
    }

    private static async generateAllDiagrams(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        selectedCommit?: GitCommit | null
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
            files,
            selectedCommit
        );
        
        await showDiagram(combinedUri);
    }
}
