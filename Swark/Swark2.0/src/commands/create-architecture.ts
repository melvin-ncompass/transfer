import * as vscode from "vscode";
import { selectFolder } from "../io/input-selection";
import { ModelInteractor } from "../llm/model-interactor";
import { PromptBuilder, DiagramFormat } from "../llm/prompt-builder";
import { OutputFormatter } from "../view/output-formatter";
import { OutputWriter } from "../view/output-writer";
import { TokenCounter } from "../types";
import { RepositoryReader } from "../io/repository-reader";
import { countTotalTokens, getMaxTokensForFiles } from "../llm/token-count-utils";
import { telemetry } from "../telemetry";
import { showDiagram } from "../view/viewer";
import { File } from "../types";
import { D2LinkGenerator } from "../view/d2/link-generator";
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
            const commitSelection = await this.selectCommit(folderPath);
            if (commitSelection === null) {
                return; // User cancelled
            }
            
            if (commitSelection === 'current') {
                // User selected current working directory - no checkout needed
                selectedCommit = null;
                needsRestore = false;
            } else {
                // User selected a specific commit - checkout required
                selectedCommit = commitSelection;
                
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
        }

        try {
            const model = await ModelInteractor.getModel();
            const tokenCounter = model.countTokens;

            const files = await this.readRepositoryFiles(selectedFolder, tokenCounter, model.maxInputTokens);
            
            // Get output format preference
            const config = vscode.workspace.getConfiguration("swark2");
            const defaultFormat = config.get<string>("defaultOutputFormat", "both") as DiagramFormat;
            
            // Ask user which type of diagram they want
            const diagramOptions = [
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
                    description: "Generate all three diagram types",
                    detail: "Creates high-level, semi-detailed, and detailed diagrams"
                }
            ];

            const diagramType = await vscode.window.showQuickPick(diagramOptions, {
                placeHolder: "Select the type of architecture diagram to generate",
                matchOnDescription: true
            });

            if (!diagramType) {
                return; // User cancelled
            }

            // Ask for output format if not in config
            let outputFormat = defaultFormat;
            if (defaultFormat === "both") {
                const formatOptions = [
                    { label: "Both D2 and Eraser", value: "both", description: "Generate diagrams in both formats" },
                    { label: "D2 Only", value: "d2", description: "Generate D2 format only" },
                    { label: "Eraser Only", value: "eraser", description: "Generate Eraser format only" }
                ];

                const formatChoice = await vscode.window.showQuickPick(formatOptions, {
                    placeHolder: "Select output format",
                    matchOnDescription: true
                });

                if (!formatChoice) {
                    return; // User cancelled
                }

                outputFormat = formatChoice.value as DiagramFormat;
            }

            const commitInfo = selectedCommit ? `Commit: ${selectedCommit.shortHash} - ${selectedCommit.message}` : "Current working directory";
            vscode.window.showInformationMessage(`Generating architecture diagrams for: ${commitInfo}`);

            if (diagramType.value === "all") {
                await this.generateAllDiagrams(selectedFolder, model, tokenCounter, files, outputFormat, selectedCommit);
            } else {
                await this.generateSingleDiagram(selectedFolder, model, tokenCounter, files, diagramType.value, outputFormat, selectedCommit);
            }
        } finally {
            // Restore original branch if needed
            if (needsRestore && originalBranch && isGitRepo) {
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: `Restoring branch ${originalBranch}...`,
                    },
                    async () => {
                        await GitUtils.checkoutCommit(folderPath, originalBranch!);
                    }
                );
            }
        }
    }

    private static async selectCommit(folderPath: string): Promise<GitCommit | null | 'current'> {
        const commits = await GitUtils.getRecentCommits(folderPath, 20);
        
        if (commits.length === 0) {
            vscode.window.showWarningMessage("No commits found in this repository.");
            return 'current'; // Use current directory if no commits
        }

        // Add option to use current working directory
        const quickPickItems = [
            {
                label: "$(file-directory) Current Working Directory",
                description: "Use current state (including uncommitted changes)",
                detail: "Analyze the current state of the repository",
                alwaysShow: true
            },
            ...commits.map(commit => GitUtils.formatCommitForQuickPick(commit))
        ];

        const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: "Select a commit to analyze",
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selectedItem) {
            return null; // User cancelled
        }

        // If user selected current directory
        if (selectedItem.label.includes("Current Working Directory")) {
            return 'current'; // Special value for current directory
        }

        // Find the corresponding commit
        const selectedCommit = commits.find(commit => 
            selectedItem.label!.includes(commit.shortHash)
        );

        return selectedCommit || null;
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

    private static async generateAllDiagrams(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        format: DiagramFormat,
        commit?: GitCommit | null
    ): Promise<void> {
        const diagramTypes = ["high-level", "semi", "detailed"];
        
        for (const diagramType of diagramTypes) {
            try {
                await this.generateSingleDiagram(selectedFolder, model, tokenCounter, files, diagramType, format, commit);
            } catch (error) {
                console.error(`Failed to generate ${diagramType} diagram:`, error);
                vscode.window.showErrorMessage(`Failed to generate ${diagramType} diagram`);
            }
        }
    }

    private static async generateSingleDiagram(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        diagramType: string,
        format: DiagramFormat,
        commit?: GitCommit | null
    ): Promise<void> {
        try {
            let prompt: vscode.LanguageModelChatMessage[];
            
            switch (diagramType) {
                case "detailed":
                    prompt = PromptBuilder.createDetailedPrompt(files, format);
                    break;
                case "semi":
                    prompt = PromptBuilder.createSemiPrompt(files, format);
                    break;
                default:
                    prompt = PromptBuilder.createPrompt(files, format);
                    break;
            }

            await this.logTotalTokens(prompt, tokenCounter);
            const response = await this.sendPrompt(model, prompt);
            
            if (!response || response.trim().length === 0) {
                throw new Error("Empty response from AI model");
            }
            
            const diagramUri = await this.writeOutputFiles(selectedFolder, model, response, files, diagramType, format, commit);
            
            await showDiagram(diagramUri);
            telemetry.sendTelemetryEvent("diagramGenerated", { type: diagramType, format });
            
            vscode.window.showInformationMessage(`✅ ${diagramType} diagram generated successfully`);
        } catch (error) {
            console.error(`Failed to generate ${diagramType} diagram:`, error);
            
            let errorMessage = `Failed to generate ${diagramType} diagram`;
            if (error instanceof Error) {
                errorMessage += `: ${error.message}`;
            }
            
            vscode.window.showErrorMessage(errorMessage);
            throw error; // Re-throw to stop execution
        }
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
        diagramType: string,
        format: DiagramFormat,
        commit?: GitCommit | null
    ): Promise<vscode.Uri> {
        try {
            const outputFolder = this.getOutputFolder(selectedFolder, commit);
            const writer = new OutputWriter(outputFolder);
            
            const diagramUri = await this.writeDiagramFile(model, response, writer, diagramType, format, commit);

            return diagramUri;
        } catch (error) {
            console.error("Error writing output files:", error);
            throw new Error(`Failed to write output files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private static async writeDiagramFile(
        model: vscode.LanguageModelChat,
        response: string,
        writer: OutputWriter,
        diagramType: string,
        format: DiagramFormat,
        commit?: GitCommit | null
    ): Promise<vscode.Uri> {
        // If both formats were generated, split them and write separate files
        if (format === "both" && response.includes("===== ERASER FORMAT =====")) {
            const parts = response.split("===== ERASER FORMAT =====");
            const d2Content = parts[0].trim();
            const eraserContent = parts[1].trim();
            
            // Format and write D2 content
            const d2FormattedContent = this.formatDiagramContent(model, d2Content, "d2", commit);
            const d2Uri = await writer.writeDiagramFile(d2FormattedContent, `${diagramType}-d2`);
            
            // Write pure D2 syntax file
            const pureD2Content = this.extractPureD2Syntax(d2Content);
            await this.writePureSyntaxFile(writer, pureD2Content, diagramType, "d2");
            
            // Format and write Eraser content
            const eraserFormattedContent = this.formatEraserContent(eraserContent, commit);
            await writer.writeDiagramFile(eraserFormattedContent, `${diagramType}-eraser`);
            
            // Write pure Eraser syntax file
            const pureEraserContent = this.extractPureEraserSyntax(eraserContent);
            await this.writePureSyntaxFile(writer, pureEraserContent, diagramType, "eraserdiagram");
            
            return d2Uri; // Return D2 URI as primary
        } else if (format === "eraser") {
            // Single Eraser format
            const eraserFormattedContent = this.formatEraserContent(response, commit);
            const eraserUri = await writer.writeDiagramFile(eraserFormattedContent, `${diagramType}-eraser`);
            
            // Write pure Eraser syntax file
            const pureEraserContent = this.extractPureEraserSyntax(response);
            await this.writePureSyntaxFile(writer, pureEraserContent, diagramType, "eraserdiagram");
            
            return eraserUri;
        } else {
            // Single D2 format
            const d2FormattedContent = this.formatDiagramContent(model, response, "d2", commit);
            const d2Uri = await writer.writeDiagramFile(d2FormattedContent, diagramType);
            
            // Write pure D2 syntax file
            const pureD2Content = this.extractPureD2Syntax(response);
            await this.writePureSyntaxFile(writer, pureD2Content, diagramType, "d2");
            
            return d2Uri;
        }
    }

    private static formatDiagramContent(model: vscode.LanguageModelChat, response: string, format: string, commit?: GitCommit | null): string {
        const modelName = `${model.family} ${model.version}`;
        const commitInfo = commit ? `\n**Commit**: ${commit.shortHash} - ${commit.message}\n**Author**: ${commit.author}\n**Date**: ${commit.date}` : "";
        
        // Ensure the response is properly formatted as a D2 code block
        let formattedResponse = response.trim();
        
        // If it doesn't already have a D2 code block, wrap it
        if (!formattedResponse.includes('```d2') && !formattedResponse.includes('```')) {
            formattedResponse = `\`\`\`d2\n${formattedResponse}\n\`\`\``;
        } else if (formattedResponse.includes('```') && !formattedResponse.includes('```d2')) {
            // If it has code blocks but not D2, replace with D2
            formattedResponse = formattedResponse.replace(/```[\w]*\n/, '```d2\n');
        }
        
        try {
            return OutputFormatter.getDiagramFileContent(modelName, formattedResponse) + commitInfo;
        } catch (error) {
            // If OutputFormatter fails, create a basic formatted output
            console.warn("OutputFormatter failed, creating basic format:", error);
            
            return `<p align="center">
    <a href="https://swark.io">
        <img src="https://raw.githubusercontent.com/swark-io/swark/refs/heads/main/assets/logo/swark-logo-dark-mode.png" width="10%" />
    </a>
</p>
<p align="center">
    <b>Automatic Architecture Diagrams from Code</b><br />
    <a href="https://github.com/swark-io/swark">GitHub</a> • <a href="https://swark.io">Website</a> • <a href="mailto:contact@swark.io">Contact Us</a>
</p>

## Generated Content
**Model**: ${modelName}${commitInfo}

${formattedResponse}`;
        }
    }

    private static formatEraserContent(response: string, commit?: GitCommit | null): string {
        const commitInfo = commit ? `\n**Commit**: ${commit.shortHash} - ${commit.message}\n**Author**: ${commit.author}\n**Date**: ${commit.date}\n\n` : `\n**Generated**: ${new Date().toISOString()}\n\n`;
        
        // Format as markdown with code block for Eraser syntax
        const eraserBlock = `\`\`\`yaml\n${response.trim()}\n\`\`\``;
        
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

1. **Render the Diagram**: Copy the Eraser.io syntax below and paste it into [Eraser.io](https://app.eraser.io/) to render the diagram.
2. **Edit and Customize**: Use Eraser.io's visual editor to modify colors, layouts, and add additional elements.
3. **Export Options**: Export as PNG, SVG, or share via link directly from Eraser.io.

## Generated Content${commitInfo}**Format**: Eraser.io Architecture Diagram

${eraserBlock}`;
    }

    private static async writePureSyntaxFile(
        writer: OutputWriter,
        content: string,
        diagramType: string,
        extension: string
    ): Promise<void> {
        // Get the output folder from the writer's path
        const outputFolder = (writer as any).outputFolder as vscode.Uri;
        
        // Create filename with custom extension (no timestamp)
        const filename = `${diagramType}.${extension}`;
        const fileUri = vscode.Uri.joinPath(outputFolder, filename);
        
        // Write the file
        const encoded = new TextEncoder().encode(content);
        await vscode.workspace.fs.createDirectory(outputFolder);
        await vscode.workspace.fs.writeFile(fileUri, encoded);
    }

    private static extractPureD2Syntax(content: string): string {
        // Extract content from D2 code blocks
        const d2BlockRegex = /```d2\s*([\s\S]*?)\s*```/;
        const match = content.match(d2BlockRegex);
        
        if (match && match[1]) {
            return match[1].trim();
        }
        
        // If no code block found, assume the content is already pure D2
        // Remove any markdown formatting
        return content
            .replace(/```[\w]*\n?/g, '') // Remove any code block markers
            .replace(/^#+\s*.*$/gm, '') // Remove markdown headers
            .replace(/^\*\*.*\*\*$/gm, '') // Remove bold text lines
            .replace(/^>\s*.*$/gm, '') // Remove blockquotes
            .replace(/^\s*\n/gm, '') // Remove empty lines
            .trim();
    }

    private static extractPureEraserSyntax(content: string): string {
        // Extract content from yaml/eraser code blocks
        const eraserBlockRegex = /```(?:yaml|eraser)?\s*([\s\S]*?)\s*```/;
        const match = content.match(eraserBlockRegex);
        
        if (match && match[1]) {
            return match[1].trim();
        }
        
        // If no code block found, assume the content is already pure Eraser syntax
        // Remove any markdown formatting
        return content
            .replace(/```[\w]*\n?/g, '') // Remove any code block markers
            .replace(/^#+\s*.*$/gm, '') // Remove markdown headers
            .replace(/^\*\*.*\*\*$/gm, '') // Remove bold text lines
            .replace(/^>\s*.*$/gm, '') // Remove blockquotes
            .replace(/^\s*\n/gm, '') // Remove empty lines
            .trim();
    }

    private static getOutputFolder(selectedFolder: vscode.Uri, commit?: GitCommit | null): vscode.Uri {
        const baseOutputFolder = vscode.Uri.joinPath(selectedFolder, "swark-output");
        
        // Create commit-specific subfolder
        let commitFolderName: string;
        if (commit) {
            // Use commit hash and sanitized message
            const sanitizedMessage = commit.message
                .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .toLowerCase()
                .substring(0, 50); // Limit length
            commitFolderName = `commit-${commit.shortHash}__${sanitizedMessage}`;
        } else {
            commitFolderName = "current-working-directory";
        }
        
        return vscode.Uri.joinPath(baseOutputFolder, commitFolderName);
    }
}
