import * as vscode from "vscode";
import { selectFolder } from "../io/input-selection";
import { ModelInteractor } from "../llm/model-interactor";
import { DiagramFormat } from "../llm/prompt-builder";
import { TokenCounter } from "../types";
import { RepositoryReader } from "../io/repository-reader";
import { getMaxTokensForFiles } from "../llm/token-count-utils";
import { telemetry } from "../telemetry";
import { File } from "../types";
import { GitUtils, GitCommit } from "../io/git-utils";
import { DependencyAnalyzer } from "../io/dependency-analyzer";
import { ChunkProcessor } from "../io/chunk-processor";

export class CreateChunkedArchitectureCommand {
    public static async run(): Promise<void> {
        const selectedFolder = await selectFolder();
        if (!selectedFolder) {
            return;
        }

        const folderPath = selectedFolder.fsPath;
        const isGitRepo = await GitUtils.isGitRepository(folderPath);
        let selectedCommit: GitCommit | null = null;
        let needsRestore = false;
        let originalBranch: string | null = null;

        if (isGitRepo) {
            // Get current branch for restoration
            originalBranch = await GitUtils.getCurrentBranch(folderPath);
            
            // Ask user if they want to analyze a specific commit
            const commitChoice = await vscode.window.showQuickPick([
                { 
                    label: "$(git-branch) Current State", 
                    description: "Analyze the current working directory",
                    value: "current" 
                },
                { 
                    label: "$(history) Specific Commit", 
                    description: "Choose a commit from git history",
                    value: "commit" 
                }
            ], {
                placeHolder: "What would you like to analyze?"
            });

            if (!commitChoice) {
                return;
            }

            if (commitChoice.value === "commit") {
                selectedCommit = await this.selectCommit(selectedFolder);
                if (!selectedCommit) {
                    return;
                }

                // Checkout the selected commit
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: `Checking out commit ${selectedCommit.shortHash}...`,
                    },
                    async () => {
                        await GitUtils.checkoutCommit(folderPath, selectedCommit!.hash);
                        needsRestore = true;
                    }
                );
            }
        }

        try {
            const model = await ModelInteractor.getModel();
            const tokenCounter = model.countTokens;

            // Step 1: Read all files first
            const allFiles = await this.readRepositoryFiles(selectedFolder, tokenCounter, model.maxInputTokens);
            
            // Check if we need chunking
            const shouldChunk = await this.shouldUseChunking(allFiles, tokenCounter, model.maxInputTokens);
            
            if (!shouldChunk) {
                // Use regular processing for small repositories
                vscode.window.showInformationMessage("Repository size is manageable - using standard analysis");
                return this.processRegularMode(selectedFolder, model, tokenCounter, allFiles, selectedCommit);
            }

            // Step 2: Use chunking for large repositories
            vscode.window.showInformationMessage("Repository is large - using intelligent analysis for complete coverage");
            await this.processChunkedMode(selectedFolder, model, tokenCounter, allFiles, selectedCommit);

        } catch (error) {
            console.error("Error in chunked architecture command:", error);
            vscode.window.showErrorMessage(
                `Error generating architecture: ${error instanceof Error ? error.message : "Unknown error"}`
            );
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

    /**
     * Determine if chunking is needed based on repository size
     */
    private static async shouldUseChunking(
        files: File[],
        tokenCounter: TokenCounter,
        maxInputTokens: number
    ): Promise<boolean> {
        // Get configuration for chunking threshold
        const config = vscode.workspace.getConfiguration("swark2");
        const chunkingThreshold = config.get<number>("chunkingThreshold", 0.8); // Use 80% of token limit as threshold
        
        const maxTokensForFiles = await getMaxTokensForFiles(maxInputTokens, tokenCounter);
        const thresholdTokens = maxTokensForFiles * chunkingThreshold;
        
        // Calculate total tokens
        let totalTokens = 0;
        for (const file of files) {
            const fileTokens = await tokenCounter(file.content);
            totalTokens += fileTokens;
            
            // Early exit if we exceed threshold
            if (totalTokens > thresholdTokens) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Process repository using chunking strategy
     */
    private static async processChunkedMode(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        commit?: GitCommit | null
    ): Promise<void> {
        // Get output format preference
        const config = vscode.workspace.getConfiguration("swark2");
        const defaultFormat = config.get<string>("defaultOutputFormat", "both") as DiagramFormat;
        
        // Ask user which type of analysis they want
        const analysisOptions = [
            { 
                label: "$(symbol-structure) High-Level Architecture", 
                value: "high-level", 
                description: "System overview with main components",
                detail: "Best for stakeholders - unified view of entire system"
            },
            { 
                label: "$(symbol-module) Semi-Detailed Architecture", 
                value: "semi", 
                description: "Technical architecture with module interactions",
                detail: "Balanced view - shows components and data flows"
            },
            { 
                label: "$(symbol-class) Detailed Architecture", 
                value: "detailed", 
                description: "Complete technical implementation view",
                detail: "Full technical details - all classes and relationships"
            },
            { 
                label: "$(list-ordered) All Levels", 
                value: "all", 
                description: "Generate all three architecture levels",
                detail: "Complete analysis suite at all abstraction levels"
            }
        ];

        const analysisType = await vscode.window.showQuickPick(analysisOptions, {
            placeHolder: "Select architecture analysis level (chunking handled automatically)"
        });

        if (!analysisType) {
            return;
        }

        // Step 1: Analyze dependencies and create chunks
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Generating architecture diagram...",
                cancellable: false
            },
            async (progress) => {
                const maxTokensForFiles = await getMaxTokensForFiles(model.maxInputTokens, tokenCounter);
                const dependencyAnalyzer = new DependencyAnalyzer(tokenCounter, maxTokensForFiles);
                
                progress.report({ message: "Analyzing codebase structure..." });
                const chunkingResult = await dependencyAnalyzer.analyzeAndChunk(files);
                
                progress.report({ message: `Processing ${chunkingResult.chunks.length} code sections...` });
                
                // Step 2: Process chunks
                const chunkProcessor = new ChunkProcessor(model, tokenCounter);
                
                if (analysisType.value === "all") {
                    // Process all levels
                    for (const level of ["high-level", "semi", "detailed"]) {
                        progress.report({ message: `Generating ${level} architecture...` });
                        await chunkProcessor.processChunks(chunkingResult, level, defaultFormat, selectedFolder);
                    }
                } else {
                    // Process single level
                    progress.report({ message: `Generating ${analysisType.value} architecture...` });
                    await chunkProcessor.processChunks(chunkingResult, analysisType.value, defaultFormat, selectedFolder);
                }
                
                progress.report({ message: "Finalizing architecture diagram..." });
                
                // Send telemetry
                telemetry.sendTelemetryEvent("chunkedAnalysisCompleted", {
                    analysisType: analysisType.value,
                    totalChunks: chunkingResult.chunks.length.toString(),
                    totalFiles: files.length.toString(),
                    averageChunkSize: chunkingResult.metadata.averageChunkSize.toString(),
                    format: defaultFormat,
                    hasCommit: (commit !== null).toString()
                }, {
                    maxChunkSize: chunkingResult.metadata.maxChunkSize,
                    totalFiles: chunkingResult.metadata.totalFiles
                });
            }
        );
    }

    /**
     * Process repository using regular (non-chunked) mode
     */
    private static async processRegularMode(
        selectedFolder: vscode.Uri,
        model: vscode.LanguageModelChat,
        tokenCounter: TokenCounter,
        files: File[],
        commit?: GitCommit | null
    ): Promise<void> {
        // For now, show a message that regular mode would be used
        // In a full implementation, you could refactor the existing CreateArchitectureCommand
        // to avoid code duplication
        vscode.window.showInformationMessage(
            "Repository is small enough for standard analysis. Use the regular 'Create Architecture Diagram' command."
        );
    }

    /**
     * Read repository files with improved error handling
     */
    private static async readRepositoryFiles(
        selectedFolder: vscode.Uri,
        tokenCounter: TokenCounter,
        llmMaxInputTokens: number
    ): Promise<File[]> {
        const maxTokens = await getMaxTokensForFiles(llmMaxInputTokens, tokenCounter);
        const repositoryReader = new RepositoryReader(selectedFolder, tokenCounter, maxTokens);
        return await repositoryReader.readFiles();
    }

    /**
     * Select a git commit for analysis
     */
    private static async selectCommit(selectedFolder: vscode.Uri): Promise<GitCommit | null> {
        const folderPath = selectedFolder.fsPath;
        const commits = await GitUtils.getRecentCommits(folderPath, 20);

        if (commits.length === 0) {
            vscode.window.showWarningMessage("No commits found in this repository");
            return null;
        }

        const commitOptions = commits.map((commit) => ({
            label: `$(git-commit) ${commit.shortHash}`,
            description: commit.message,
            detail: `${commit.author} • ${commit.date}`,
            commit: commit,
        }));

        const selectedCommit = await vscode.window.showQuickPick(commitOptions, {
            placeHolder: "Select a commit to analyze",
            matchOnDescription: true,
            matchOnDetail: true,
        });

        return selectedCommit?.commit || null;
    }
}
