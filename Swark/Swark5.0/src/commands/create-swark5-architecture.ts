import * as vscode from 'vscode';
import { RepositoryInputHandler } from '../io/repository-input-handler';
import { Swark5MetadataExtractor } from '../io/swark5-metadata-extractor';
import { Swark5FileFilter } from '../io/swark5-file-filter';
import { CodeCleaner } from '../io/code-cleaner';
import { LLMGuidedFileSelector } from '../io/llm-guided-file-selector';
import { Swark5OutputGenerator } from '../io/swark5-output-generator';
import { TokenCounter } from '../types';

export interface Swark5AnalysisRequest {
    repositoryPath: string;
    commitHash: string;
    analysisLevels: ('high-level' | 'semi-detailed' | 'detailed')[];
}

export interface Swark5Metadata {
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

export interface Swark5FilteredMetadata extends Swark5Metadata {
    filteredFiles: {
        path: string;
        size: number;
        estimatedTokens: number;
        language: string;
        importance: 'entry-point' | 'core' | 'utility' | 'dependency';
        cleanedTokens: number;
        removalStats: {
            originalLines: number;
            cleanedLines: number;
            commentsRemoved: number;
            whitespaceRemoved: number;
        };
    }[];
    tokensAfterFiltering: number;
    tokensAfterCleaning: number;
}

export interface AnalysisLevelSelection {
    level: 'high-level' | 'semi-detailed' | 'detailed';
    selectedFiles: string[];
    actualTokens: number;
    reasoning: string;
}

export interface TokenReport {
    worstCaseTokens: number;
    tokensAfterFiltering: number;
    tokensAfterCleaning: number;
    actualTokensUsed: number;
    reductionPercentage: {
        afterFiltering: number;
        afterCleaning: number;
        total: number;
    };
    filesProcessed: {
        original: number;
        afterFiltering: number;
        selected: number;
    };
}

/**
 * Swark 5.0: Advanced orchestrator for intelligent repository analysis with filtering and cleaning
 */
export async function createSwark5Architecture(): Promise<void> {
    try {
        console.log('🚀 Starting Swark 5.0 - Advanced Repository Analysis with Filtering & Cleaning...');
        
        // Get GitHub Copilot model
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4'
        });

        if (models.length === 0) {
            vscode.window.showErrorMessage('GitHub Copilot is required for Swark 5.0. Please ensure it is installed and authenticated.');
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
            title: 'Swark 5.0 Analysis',
            cancellable: false
        }, async (progress) => {
            
            // Stage 1: Input Collection
            progress.report({ message: 'Collecting repository and commit information...', increment: 10 });
            const analysisRequest = await collectUserInput();
            
            // Stage 2: Metadata Extraction
            progress.report({ message: 'Extracting repository metadata and calculating tokens...', increment: 15 });
            const metadataExtractor = new Swark5MetadataExtractor(tokenCounter);
            const metadata = await metadataExtractor.extractMetadata(analysisRequest);
            
            // Stage 3: LLM-Guided File Filtering (NEW IN 5.0)
            progress.report({ message: 'Using LLM to filter out unnecessary files...', increment: 25 });
            const fileFilter = new Swark5FileFilter(model, tokenCounter);
            const filteredFiles = await fileFilter.filterUnnecessaryFiles(metadata);
            
            // Stage 4: File Pre-Processing - Code Cleaning (NEW IN 5.0)
            progress.report({ message: 'Cleaning filtered files (removing comments and whitespace)...', increment: 40 });
            const codeCleaner = new CodeCleaner();
            const cleanedFiles = await codeCleaner.cleanFiles(filteredFiles, analysisRequest.repositoryPath);
            
            // Create enhanced metadata with filtering and cleaning info
            const enhancedMetadata: Swark5FilteredMetadata = {
                ...metadata,
                filteredFiles: cleanedFiles,
                tokensAfterFiltering: filteredFiles.reduce((sum: number, file: any) => sum + file.estimatedTokens, 0),
                tokensAfterCleaning: cleanedFiles.reduce((sum: number, file: any) => sum + file.cleanedTokens, 0)
            };
            
            // Stage 5: LLM-Guided File Selection by Analysis Level
            progress.report({ message: 'Using LLM to select files for different analysis levels...', increment: 55 });
            const fileSelector = new LLMGuidedFileSelector(model, tokenCounter);
            const selections = await fileSelector.selectFilesForAllLevels(enhancedMetadata);
            
            // Stage 6: Output Generation
            progress.report({ message: 'Generating multi-format diagrams and reports...', increment: 75 });
            const outputGenerator = new Swark5OutputGenerator(model, tokenCounter);
            await outputGenerator.generateAllOutputs(enhancedMetadata, selections);
            
            // Stage 7: Token Report Generation
            progress.report({ message: 'Generating comprehensive token usage report...', increment: 90 });
            const tokenReport = await generateTokenReport(enhancedMetadata, selections);
            await outputGenerator.generateTokenReport(
                tokenReport,
                analysisRequest.repositoryPath, 
                analysisRequest.commitHash,
                enhancedMetadata, 
                selections
            );
            
            progress.report({ message: 'Swark 5.0 analysis complete!', increment: 100 });
            
            vscode.window.showInformationMessage(
                `🎉 Swark 5.0 analysis complete! Output saved to: swark_output/${enhancedMetadata.commitHash}/`,
                'Open Output Folder',
                'View Token Report'
            ).then(selection => {
                if (selection === 'Open Output Folder') {
                    vscode.commands.executeCommand('vscode.openFolder', 
                        vscode.Uri.file(`${analysisRequest.repositoryPath}/swark_output/${analysisRequest.commitHash}`));
                } else if (selection === 'View Token Report') {
                    vscode.workspace.openTextDocument(
                        vscode.Uri.file(`${analysisRequest.repositoryPath}/swark_output/${analysisRequest.commitHash}/token_report.txt`)
                    ).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });
        });
        
    } catch (error) {
        console.error('Swark 5.0 analysis failed:', error);
        vscode.window.showErrorMessage(
            `Swark 5.0 analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Collect user input for repository and commit information
 */
async function collectUserInput(): Promise<Swark5AnalysisRequest> {
    // Step 1: Get repository path
    const repositoryUri = await RepositoryInputHandler.promptForRepository();
    if (!repositoryUri) {
        throw new Error('No repository selected');
    }
    const repositoryPath = repositoryUri.fsPath;
    
    // Step 2: Get commit hash
    const commitHash = await getCommitHash(repositoryPath);
    
    // Step 3: Get analysis levels (for now, include all levels)
    const analysisLevels: ('high-level' | 'semi-detailed' | 'detailed')[] = ['high-level', 'semi-detailed', 'detailed'];
    
    return {
        repositoryPath,
        commitHash,
        analysisLevels
    };
}

/**
 * Get commit hash from user
 */
async function getCommitHash(repositoryPath: string): Promise<string> {
    const commitInput = await vscode.window.showInputBox({
        prompt: 'Enter the commit hash to analyze (leave empty for current HEAD)',
        placeHolder: 'e.g., abc123def456 or leave empty for HEAD',
        validateInput: (value) => {
            if (value && value.trim() && !/^[a-f0-9]{6,40}$/i.test(value.trim())) {
                return 'Please enter a valid commit hash (6-40 hexadecimal characters)';
            }
            return null;
        }
    });
    
    if (commitInput === undefined) {
        throw new Error('Operation cancelled by user');
    }
    
    // If empty, use HEAD
    if (!commitInput || !commitInput.trim()) {
        return 'HEAD';
    }
    
    return commitInput.trim();
}

/**
 * Generate comprehensive token usage report
 */
async function generateTokenReport(
    metadata: Swark5FilteredMetadata, 
    selections: AnalysisLevelSelection[]
): Promise<TokenReport> {
    const actualTokensUsed = selections.reduce((sum, selection) => sum + selection.actualTokens, 0);
    
    const reductionAfterFiltering = ((metadata.worstCaseTokens - metadata.tokensAfterFiltering) / metadata.worstCaseTokens) * 100;
    const reductionAfterCleaning = ((metadata.tokensAfterFiltering - metadata.tokensAfterCleaning) / metadata.tokensAfterFiltering) * 100;
    const totalReduction = ((metadata.worstCaseTokens - actualTokensUsed) / metadata.worstCaseTokens) * 100;
    
    return {
        worstCaseTokens: metadata.worstCaseTokens,
        tokensAfterFiltering: metadata.tokensAfterFiltering,
        tokensAfterCleaning: metadata.tokensAfterCleaning,
        actualTokensUsed,
        reductionPercentage: {
            afterFiltering: reductionAfterFiltering,
            afterCleaning: reductionAfterCleaning,
            total: totalReduction
        },
        filesProcessed: {
            original: metadata.totalFiles,
            afterFiltering: metadata.filteredFiles.length,
            selected: selections.reduce((sum, s) => sum + s.selectedFiles.length, 0)
        }
    };
}
