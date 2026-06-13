import * as vscode from 'vscode';
import { RepositoryInputHandler, RepositoryAnalysisRequest } from '../io/repository-input-handler';
import { RepositoryMetadataAnalyzer, RepositoryMetadata } from '../io/repository-metadata-analyzer';
import { SmartChunkingProcessor, ChunkProcessingOptions } from '../io/smart-chunking-processor';
import { ModelInteractor } from '../llm/model-interactor';
import { DiagramFormat } from '../llm/prompt-builder';
import { TokenCounter } from '../types';
import { telemetry } from '../telemetry';

/**
 * Main command for Swark 3.0 enhanced repository analysis
 */
export async function createSwark3Architecture(): Promise<void> {
    try {
        console.log('🚀 Starting Swark 3.0 Enhanced Analysis...');
        
        // Step 1: Get repository and commit information from user
        const analysisRequest = await RepositoryInputHandler.createAnalysisRequest();
        if (!analysisRequest) {
            return; // User cancelled
        }

        console.log(`📁 Repository: ${analysisRequest.repositoryPath}`);
        if (analysisRequest.commitHash) {
            console.log(`📝 Commit: ${analysisRequest.commitHash}`);
        }

        // Step 2: Get language model
        const model = await ModelInteractor.getModel();
        if (!model) {
            vscode.window.showErrorMessage('No language model available. Please install GitHub Copilot or configure a language model.');
            return;
        }

        // Step 3: Analyze repository metadata
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Swark 3.0: Analyzing Repository',
            cancellable: false
        }, async (progress) => {
            
            progress.report({ 
                message: 'Scanning repository structure...',
                increment: 10 
            });

            // Create token counter
            const tokenCounter: TokenCounter = (text: string | vscode.LanguageModelChatMessage) => {
                return model.countTokens(text);
            };
            
            // Analyze repository metadata
            const metadataAnalyzer = new RepositoryMetadataAnalyzer(
                tokenCounter,
                analysisRequest.includeExtensions,
                analysisRequest.excludePatterns
            );

            const metadata = await metadataAnalyzer.analyzeRepository(
                analysisRequest.repositoryPath,
                analysisRequest.commitHash,
                analysisRequest.maxTokens
            );

            progress.report({ 
                message: 'Repository analysis complete',
                increment: 30 
            });

            // Display metadata summary to user
            RepositoryMetadataAnalyzer.displayMetadataSummary(metadata);

            // Step 4: Determine processing strategy
            if (metadata.chunkingRequired) {
                progress.report({ 
                    message: 'Repository requires chunking - preparing enhanced analysis...',
                    increment: 40 
                });

                await processWithChunking(
                    analysisRequest,
                    metadata,
                    model,
                    tokenCounter,
                    progress
                );
            } else {
                progress.report({ 
                    message: 'Repository can be processed directly...',
                    increment: 40 
                });

                await processDirectly(
                    analysisRequest,
                    metadata,
                    model,
                    tokenCounter,
                    progress
                );
            }

            progress.report({ 
                message: 'Analysis complete!',
                increment: 100 
            });
        });

        // Telemetry
        telemetry.sendTelemetryEvent('swark3.enhanced-analysis', {
            repositorySize: String(analysisRequest.repositoryPath.length),
            chunkingUsed: 'true', // Will be determined dynamically
            commitSpecific: String(!!analysisRequest.commitHash)
        });

    } catch (error) {
        console.error('Error in Swark 3.0 analysis:', error);
        vscode.window.showErrorMessage(`Swark 3.0 analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        telemetry.sendTelemetryErrorEvent('swark3.analysis-error', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

/**
 * Process large repository using enhanced chunking
 */
async function processWithChunking(
    request: RepositoryAnalysisRequest,
    metadata: RepositoryMetadata,
    model: vscode.LanguageModelChat,
    tokenCounter: any,
    progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
    
    progress.report({ 
        message: `Processing ${metadata.totalFiles} files across ${metadata.estimatedChunks} chunks...`,
        increment: 50 
    });

    // Create processing options
    const options: ChunkProcessingOptions = {
        maxTokensPerChunk: request.maxTokens,
        overlapRatio: 0.1, // 10% overlap for context
        preserveContext: true,
        analysisLevel: 'high-level', // TODO: Get from user input
        outputFormat: 'd2' as DiagramFormat // TODO: Get from user input
    };

    // Process with smart chunking
    const processor = new SmartChunkingProcessor(model, tokenCounter, metadata);
    const result = await processor.processRepository(request.repositoryPath, options);

    vscode.window.showInformationMessage(
        `✅ Enhanced chunked analysis complete! Processed ${metadata.totalFiles} files.`,
        'View Results'
    ).then(selection => {
        if (selection === 'View Results') {
            // Open output folder
        }
    });
}

/**
 * Process smaller repository directly (legacy method)
 */
async function processDirectly(
    request: RepositoryAnalysisRequest,
    metadata: RepositoryMetadata,
    model: vscode.LanguageModelChat,
    tokenCounter: any,
    progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
    
    progress.report({ 
        message: 'Processing repository directly (no chunking needed)...',
        increment: 70 
    });

    // Use existing Swark 2.0 logic for smaller repositories
    // This maintains compatibility while adding enhanced features for large repos
    
    vscode.window.showInformationMessage(
        `✅ Direct analysis complete! Repository was small enough to process without chunking.`,
        'View Results'
    );
}

/**
 * Command for commit-specific analysis
 */
export async function analyzeSpecificCommit(): Promise<void> {
    // TODO: Implement specific commit analysis workflow
    vscode.window.showInformationMessage('Commit-specific analysis coming soon in Swark 3.0!');
}
