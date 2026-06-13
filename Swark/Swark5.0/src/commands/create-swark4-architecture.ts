import * as vscode from 'vscode';
import { RepositoryInputHandler } from '../io/repository-input-handler';
import { Swark4MetadataExtractor } from '../io/swark4-metadata-extractor';
import { LLMGuidedFileSelector } from '../io/llm-guided-file-selector';
import { Swark4OutputGenerator } from '../io/swark4-output-generator';
import { TokenCounter } from '../types';

export interface Swark4AnalysisRequest {
    repositoryPath: string;
    commitHash: string;
    analysisLevels: ('high-level' | 'semi-detailed' | 'detailed')[];
}

export interface Swark4Metadata {
    repositoryPath: string;
    commitHash: string;
    totalFiles: number;
    fileList: {
        path: string;
        size: number;
        estimatedTokens: number;
        language: string;
        importance: 'entry-point' | 'core' | 'utility' | 'dependency';
    }[];
    dependencyGraph: {
        [filePath: string]: string[];
    };
    worstCaseTokens: number;
    repositoryStructure: string;
}

export interface AnalysisLevelSelection {
    level: 'high-level' | 'semi-detailed' | 'detailed';
    selectedFiles: string[];
    actualTokens: number;
    reasoning: string;
}

/**
 * Swark 4.0: Main orchestrator for intelligent repository analysis
 */
export async function createSwark4Architecture(): Promise<void> {
    try {
        console.log('🚀 Starting Swark 4.0 - Intelligent Repository Analysis...');
        
        // Get GitHub Copilot model
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4'
        });

        if (models.length === 0) {
            vscode.window.showErrorMessage('GitHub Copilot is required for Swark 4.0. Please ensure it is installed and authenticated.');
            return;
        }

        const model = models[0];
        
        // Get token counter
        const tokenCounter: TokenCounter = async (text: string | vscode.LanguageModelChatMessage) => {
            if (typeof text === 'string') {
                return Math.ceil(text.length / 4); // Rough estimation
            }
            return Math.ceil(text.content.length / 4);
        };

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Swark 4.0 Analysis',
            cancellable: false
        }, async (progress) => {
            
            // Stage 1: Input Collection
            progress.report({ message: 'Collecting repository and commit information...', increment: 10 });
            const analysisRequest = await collectUserInput();
            
            // Stage 2: Metadata Extraction
            progress.report({ message: 'Extracting repository metadata and calculating tokens...', increment: 20 });
            const metadataExtractor = new Swark4MetadataExtractor(tokenCounter);
            const metadata = await metadataExtractor.extractMetadata(analysisRequest);
            
            // Stage 3: LLM-Guided File Selection
            progress.report({ message: 'Using LLM to intelligently select files for analysis...', increment: 30 });
            const fileSelector = new LLMGuidedFileSelector(model, tokenCounter);
            const selections = await fileSelector.selectFilesForAllLevels(metadata);
            
            // Stage 4: Output Generation
            progress.report({ message: 'Generating multi-format diagrams and reports...', increment: 40 });
            const outputGenerator = new Swark4OutputGenerator(model, tokenCounter);
            await outputGenerator.generateAllOutputs(metadata, selections);
            
            progress.report({ message: 'Swark 4.0 analysis complete!', increment: 100 });
            
            vscode.window.showInformationMessage(
                `🎉 Swark 4.0 analysis complete! Output saved to: swark_output/${metadata.commitHash}/`,
                'Open Output Folder',
                'View Report'
            ).then(selection => {
                if (selection === 'Open Output Folder') {
                    vscode.commands.executeCommand('vscode.openFolder', 
                        vscode.Uri.file(`${metadata.repositoryPath}/swark_output/${metadata.commitHash}`));
                } else if (selection === 'View Report') {
                    vscode.commands.executeCommand('vscode.open', 
                        vscode.Uri.file(`${metadata.repositoryPath}/swark_output/${metadata.commitHash}/token_report.txt`));
                }
            });
        });

    } catch (error) {
        console.error('Swark 4.0 analysis failed:', error);
        vscode.window.showErrorMessage(`Swark 4.0 analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Collect user input for repository and commit
 */
async function collectUserInput(): Promise<Swark4AnalysisRequest> {
    // Get repository path
    const repositoryUri = await RepositoryInputHandler.promptForRepository();
    if (!repositoryUri) {
        throw new Error('Repository path is required');
    }
    
    const repositoryPath = repositoryUri.fsPath;
    
    // Get commit hash
    const commitHash = await RepositoryInputHandler.promptForCommit(repositoryPath);
    if (!commitHash) {
        throw new Error('Commit hash is required');
    }
    
    // For Swark 4.0, we analyze all three levels by default
    const analysisLevels: ('high-level' | 'semi-detailed' | 'detailed')[] = [
        'high-level', 
        'semi-detailed', 
        'detailed'
    ];
    
    return {
        repositoryPath,
        commitHash,
        analysisLevels
    };
}
