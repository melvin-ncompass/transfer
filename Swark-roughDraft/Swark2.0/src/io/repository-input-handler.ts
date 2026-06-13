import * as vscode from 'vscode';
import * as path from 'path';

export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    date: Date;
    filesChanged: string[];
}

export interface RepositoryAnalysisRequest {
    repositoryPath: string;
    commitHash?: string;
    includeExtensions: string[];
    excludePatterns: string[];
    maxTokens: number;
}

export class RepositoryInputHandler {
    
    /**
     * Step 1: Prompt for repository path
     */
    public static async promptForRepository(): Promise<vscode.Uri | undefined> {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select Repository',
            title: 'Swark 3.0: Select Repository for Analysis'
        };

        const folderUri = await vscode.window.showOpenDialog(options);
        if (folderUri && folderUri[0]) {
            return folderUri[0];
        }
        return undefined;
    }

    /**
     * Step 2: Prompt for specific commit (optional)
     */
    public static async promptForCommit(repositoryPath: string): Promise<string | undefined> {
        const useSpecificCommit = await vscode.window.showQuickPick(
            [
                {
                    label: '$(git-branch) Current State',
                    description: 'Analyze current working directory',
                    detail: 'Use files as they currently exist',
                    isCurrentState: true
                },
                {
                    label: '$(git-commit) Specific Commit',
                    description: 'Analyze a specific commit',
                    detail: 'Enter commit hash to analyze that point in time',
                    isCurrentState: false
                }
            ],
            {
                placeHolder: 'Choose analysis target',
                title: 'Swark 3.0: Select Analysis Target'
            }
        );

        if (!useSpecificCommit) {
            return undefined;
        }

        if (useSpecificCommit.isCurrentState) {
            return 'HEAD'; // Use current state
        }

        // Prompt for commit hash
        const commitHash = await vscode.window.showInputBox({
            prompt: 'Enter commit hash (full or short)',
            placeHolder: 'e.g., abc123ef or abc123ef456789...',
            title: 'Swark 3.0: Specify Commit',
            validateInput: (value: string) => {
                if (!value || value.trim().length === 0) {
                    return 'Commit hash cannot be empty';
                }
                if (value.trim().length < 6) {
                    return 'Commit hash must be at least 6 characters';
                }
                if (!/^[a-fA-F0-9]+$/.test(value.trim())) {
                    return 'Commit hash must contain only hexadecimal characters';
                }
                return null;
            }
        });

        return commitHash?.trim();
    }

    /**
     * Step 3: Get analysis configuration
     */
    public static async getAnalysisConfiguration(): Promise<{
        analysisLevel: string;
        outputFormat: string;
        maxTokens: number;
    } | undefined> {
        
        const analysisLevel = await vscode.window.showQuickPick(
            [
                {
                    label: '$(telescope) High-Level Architecture',
                    description: 'System overview and main components',
                    detail: 'Best for stakeholders and executive summaries',
                    value: 'high-level'
                },
                {
                    label: '$(gear) Semi-Detailed Architecture',
                    description: 'Module interactions and data flows',
                    detail: 'Best for technical leads and architects',
                    value: 'semi-detailed'
                },
                {
                    label: '$(code) Detailed Architecture',
                    description: 'All classes, functions, and dependencies',
                    detail: 'Best for developers and technical documentation',
                    value: 'detailed'
                },
                {
                    label: '$(layers) Complete Analysis Suite',
                    description: 'All three levels above',
                    detail: 'Comprehensive analysis at all abstraction levels',
                    value: 'all'
                }
            ],
            {
                placeHolder: 'Select analysis depth',
                title: 'Swark 3.0: Choose Analysis Level'
            }
        );

        if (!analysisLevel) {
            return undefined;
        }

        const outputFormat = await vscode.window.showQuickPick(
            [
                {
                    label: '$(symbol-structure) D2 Format',
                    description: 'Modern declarative diagrams',
                    detail: 'Recommended - supports advanced layouts and styling',
                    value: 'd2'
                },
                {
                    label: '$(pencil) Eraser Format',
                    description: 'Hand-drawn style diagrams',
                    detail: 'Casual, sketch-like appearance',
                    value: 'eraser'
                },
                {
                    label: '$(files) Both Formats',
                    description: 'Generate both D2 and Eraser versions',
                    detail: 'Maximum compatibility and choice',
                    value: 'both'
                }
            ],
            {
                placeHolder: 'Select output format',
                title: 'Swark 3.0: Choose Output Format'
            }
        );

        if (!outputFormat) {
            return undefined;
        }

        // Get configuration from settings
        const config = vscode.workspace.getConfiguration('swark3');
        const maxTokens = config.get<number>('maxTokens', 200000);

        return {
            analysisLevel: analysisLevel.value,
            outputFormat: outputFormat.value,
            maxTokens
        };
    }

    /**
     * Create complete analysis request
     */
    public static async createAnalysisRequest(): Promise<RepositoryAnalysisRequest | undefined> {
        // Step 1: Repository selection
        const repositoryUri = await this.promptForRepository();
        if (!repositoryUri) {
            vscode.window.showWarningMessage('No repository selected. Analysis cancelled.');
            return undefined;
        }

        // Step 2: Commit selection
        const commitHash = await this.promptForCommit(repositoryUri.fsPath);
        if (commitHash === undefined) {
            vscode.window.showWarningMessage('No commit specified. Analysis cancelled.');
            return undefined;
        }

        // Step 3: Analysis configuration
        const config = await this.getAnalysisConfiguration();
        if (!config) {
            vscode.window.showWarningMessage('Analysis configuration cancelled.');
            return undefined;
        }

        // Get file patterns from settings
        const workspaceConfig = vscode.workspace.getConfiguration('swark3');
        const includeExtensions = workspaceConfig.get<string[]>('includeExtensions', [
            'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'c', 'cpp', 'go', 'rs'
        ]);
        const excludePatterns = workspaceConfig.get<string[]>('excludePatterns', [
            'node_modules/**', '*.min.js', 'dist/**', 'build/**', '.git/**'
        ]);

        return {
            repositoryPath: repositoryUri.fsPath,
            commitHash: commitHash === 'HEAD' ? undefined : commitHash,
            includeExtensions,
            excludePatterns,
            maxTokens: config.maxTokens
        };
    }
}
