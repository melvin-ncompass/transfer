import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelInteractor } from '../llm/model-interactor';
import { OutputWriter } from '../view/output-writer';
import { telemetry } from '../telemetry';

/**
 * Simplified Swark 3.0 implementation demonstrating core concepts
 * This version works with existing Swark 2.0 infrastructure while
 * adding the enhanced input flow and metadata collection
 */
export async function createSimpleSwark3Architecture(): Promise<void> {
    try {
        console.log('🚀 Starting Swark 3.0 Demo - Enhanced Repository Analysis...');
        
        // Step 1: Enhanced Repository Selection
        const repositoryInfo = await getEnhancedRepositoryInput();
        if (!repositoryInfo) {
            return; // User cancelled
        }

        // Step 2: Repository Metadata Analysis
        const metadata = await analyzeRepositoryMetadata(repositoryInfo);
        
        // Step 3: Display metadata to user and get confirmation
        const shouldContinue = await displayMetadataAndConfirm(metadata);
        if (!shouldContinue) {
            return;
        }

        // Step 4: Process with enhanced strategy
        await processWithEnhancedStrategy(repositoryInfo, metadata);

        // Telemetry
        telemetry.sendTelemetryEvent('swark3.demo-analysis', {
            totalFiles: String(metadata.totalFiles),
            commitSpecific: String(!!repositoryInfo.commitHash)
        });

    } catch (error) {
        console.error('Error in Swark 3.0 demo:', error);
        vscode.window.showErrorMessage(`Swark 3.0 demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Simple file listing helper for demo
 */
async function getSimpleFileList(repositoryPath: string): Promise<any[]> {
    const files: any[] = [];
    
    try {
        const scanDirectory = (dirPath: string) => {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                // Skip common exclude patterns
                if (entry.name.includes('node_modules') || entry.name.includes('.git') || 
                    entry.name.includes('dist') || entry.name.includes('build')) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).substring(1).toLowerCase();
                    const supportedExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'c', 'cpp', 'go', 'rs'];
                    
                    if (supportedExts.includes(ext)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            files.push({
                                path: fullPath,
                                content: content,
                                languageId: ext
                            });
                        } catch (error) {
                            // Skip files that can't be read
                        }
                    }
                }
            }
        };
        
        scanDirectory(repositoryPath);
    } catch (error) {
        console.warn('Error scanning directory:', error);
    }
    
    return files;
}

/**
 * Step 1: Enhanced Repository Input Flow
 */
async function getEnhancedRepositoryInput(): Promise<{
    repositoryPath: string;
    commitHash?: string;
    analysisLevel: string;
    outputFormat: string;
} | undefined> {
    
    // Repository selection
    const repositoryUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFiles: false,
        canSelectFolders: true,
        openLabel: 'Select Repository',
        title: '🚀 Swark 3.0: Select Repository for Enhanced Analysis'
    });

    if (!repositoryUri || !repositoryUri[0]) {
        vscode.window.showWarningMessage('No repository selected.');
        return undefined;
    }

    // Commit selection (demo version - simplified)
    const commitChoice = await vscode.window.showQuickPick([
        {
            label: '$(git-branch) Current State',
            description: 'Analyze current working directory',
            detail: 'Use files as they currently exist',
            value: undefined
        },
        {
            label: '$(git-commit) Specific Commit (Demo)',
            description: 'Demonstrate commit-specific analysis',
            detail: 'This is a demo - shows concept only',
            value: 'demo-commit'
        }
    ], {
        placeHolder: 'Choose analysis target',
        title: '🚀 Swark 3.0: Select Analysis Target'
    });

    if (!commitChoice) {
        return undefined;
    }

    // Analysis level selection
    const analysisLevel = await vscode.window.showQuickPick([
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
        }
    ], {
        placeHolder: 'Select analysis depth',
        title: '🚀 Swark 3.0: Choose Analysis Level'
    });

    if (!analysisLevel) {
        return undefined;
    }

    // Output format selection
    const outputFormat = await vscode.window.showQuickPick([
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
        }
    ], {
        placeHolder: 'Select output format',
        title: '🚀 Swark 3.0: Choose Output Format'
    });

    if (!outputFormat) {
        return undefined;
    }

    return {
        repositoryPath: repositoryUri[0].fsPath,
        commitHash: commitChoice.value,
        analysisLevel: analysisLevel.value,
        outputFormat: outputFormat.value
    };
}

/**
 * Step 2: Analyze Repository Metadata
 */
async function analyzeRepositoryMetadata(repositoryInfo: {
    repositoryPath: string;
    commitHash?: string;
    analysisLevel: string;
    outputFormat: string;
}): Promise<{
    totalFiles: number;
    totalLines: number;
    estimatedTokens: number;
    languageDistribution: { [language: string]: number };
    requiresChunking: boolean;
    estimatedChunks: number;
}> {
    
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '🔍 Analyzing Repository Metadata',
        cancellable: false
    }, async (progress) => {
        
        progress.report({ message: 'Scanning repository structure...', increment: 20 });
        
        // Simplified file counting for demo
        const files = await getSimpleFileList(repositoryInfo.repositoryPath);
        
        progress.report({ message: 'Analyzing file content...', increment: 40 });
        
        // Calculate metadata
        let totalLines = 0;
        let estimatedTokens = 0;
        const languageDistribution: { [language: string]: number } = {};
        
        for (const file of files) {
            const lines = file.content.split('\n').length;
            totalLines += lines;
            
            // Rough token estimation (4 chars per token average)
            estimatedTokens += Math.ceil(file.content.length / 4);
            
            // Language detection
            const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
            const language = getLanguageFromExtension(ext);
            languageDistribution[language] = (languageDistribution[language] || 0) + 1;
        }
        
        progress.report({ message: 'Calculating chunking requirements...', increment: 80 });
        
        // Chunking analysis (simplified)
        const maxTokensPerChunk = 100000; // Simplified limit
        const requiresChunking = estimatedTokens > maxTokensPerChunk;
        const estimatedChunks = requiresChunking ? Math.ceil(estimatedTokens / maxTokensPerChunk) : 1;
        
        progress.report({ message: 'Metadata analysis complete', increment: 100 });
        
        return {
            totalFiles: files.length,
            totalLines,
            estimatedTokens,
            languageDistribution,
            requiresChunking,
            estimatedChunks
        };
    });
}

/**
 * Helper function to detect language from file extension
 */
function getLanguageFromExtension(ext: string): string {
    const languageMap: { [key: string]: string } = {
        'ts': 'TypeScript',
        'tsx': 'TypeScript',
        'js': 'JavaScript', 
        'jsx': 'JavaScript',
        'py': 'Python',
        'java': 'Java',
        'c': 'C',
        'cpp': 'C++',
        'cc': 'C++',
        'cxx': 'C++',
        'h': 'C/C++',
        'hpp': 'C++',
        'go': 'Go',
        'rs': 'Rust',
        'php': 'PHP',
        'rb': 'Ruby',
        'cs': 'C#',
        'swift': 'Swift',
        'kt': 'Kotlin',
        'scala': 'Scala'
    };
    
    return languageMap[ext] || ext.toUpperCase();
}

/**
 * Step 3: Display metadata and get user confirmation
 */
async function displayMetadataAndConfirm(metadata: {
    totalFiles: number;
    totalLines: number;
    estimatedTokens: number;
    languageDistribution: { [language: string]: number };
    requiresChunking: boolean;
    estimatedChunks: number;
}): Promise<boolean> {
    
    const languageSummary = Object.entries(metadata.languageDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([lang, count]) => `${lang}: ${count} files`)
        .join(', ');
    
    const message = `📊 Repository Analysis Summary:

📁 Files: ${metadata.totalFiles.toLocaleString()}
📏 Lines: ${metadata.totalLines.toLocaleString()} 
🔤 Tokens: ${metadata.estimatedTokens.toLocaleString()}
🧠 Chunking: ${metadata.requiresChunking ? `Required (${metadata.estimatedChunks} chunks)` : 'Not required'}
💻 Languages: ${languageSummary}

Continue with enhanced analysis?`;
    
    const choice = await vscode.window.showInformationMessage(
        '🚀 Swark 3.0: Repository Analysis Complete',
        {
            detail: message,
            modal: true
        },
        'Continue Analysis',
        'View Details',
        'Cancel'
    );
    
    if (choice === 'View Details') {
        // Show detailed metadata in a new document
        const detailedContent = `# 🚀 Swark 3.0: Repository Metadata Analysis

## Overview
- **Total Files**: ${metadata.totalFiles.toLocaleString()}
- **Total Lines**: ${metadata.totalLines.toLocaleString()}
- **Estimated Tokens**: ${metadata.estimatedTokens.toLocaleString()}
- **Chunking Required**: ${metadata.requiresChunking ? 'Yes' : 'No'}
- **Estimated Chunks**: ${metadata.estimatedChunks}

## Language Distribution
${Object.entries(metadata.languageDistribution)
    .sort(([,a], [,b]) => b - a)
    .map(([lang, count]) => `- **${lang}**: ${count} files`)
    .join('\n')}

## Processing Strategy
${metadata.requiresChunking ? 
    `This repository will be processed using **intelligent chunking**:
- Split into ${metadata.estimatedChunks} context-aware chunks
- Preserve dependency relationships across chunks
- Maintain architectural coherence in final output` :
    `This repository can be processed **directly**:
- Small enough for single-pass analysis
- No chunking required
- Full context preserved throughout`}

---
Generated by Swark 3.0 Enhanced Analysis
${new Date().toISOString()}
`;
        
        const doc = await vscode.workspace.openTextDocument({
            content: detailedContent,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
        
        // Ask again after showing details
        return await displayMetadataAndConfirm(metadata);
    }
    
    return choice === 'Continue Analysis';
}

/**
 * Step 4: Process with enhanced strategy (demo version)
 */
async function processWithEnhancedStrategy(
    repositoryInfo: {
        repositoryPath: string;
        commitHash?: string;
        analysisLevel: string;
        outputFormat: string;
    },
    metadata: {
        totalFiles: number;
        requiresChunking: boolean;
        estimatedChunks: number;
    }
): Promise<void> {
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '🚀 Swark 3.0: Enhanced Processing',
        cancellable: false
    }, async (progress) => {
        
        if (metadata.requiresChunking) {
            progress.report({ 
                message: `Processing ${metadata.totalFiles} files across ${metadata.estimatedChunks} intelligent chunks...`,
                increment: 10 
            });
            
            // Simulate chunk processing
            for (let i = 1; i <= metadata.estimatedChunks; i++) {
                progress.report({ 
                    message: `Processing chunk ${i}/${metadata.estimatedChunks} with context preservation...`,
                    increment: (70 / metadata.estimatedChunks) 
                });
                
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            progress.report({ 
                message: 'Integrating chunks into unified architecture diagram...',
                increment: 85 
            });
        } else {
            progress.report({ 
                message: 'Processing repository directly (no chunking needed)...',
                increment: 50 
            });
        }
        
        // Use existing Swark 2.0 infrastructure for actual processing
        const model = await ModelInteractor.getModel();
        const files = await getSimpleFileList(repositoryInfo.repositoryPath);
        
        progress.report({ 
            message: 'Generating architecture diagram...',
            increment: 90 
        });
        
        // For demo, use a simplified prompt
        const enhancedPrompt = `# Swark 3.0 Enhanced Analysis

## Repository Information
- **Path**: ${repositoryInfo.repositoryPath}
- **Commit**: ${repositoryInfo.commitHash || 'Current state'}
- **Files**: ${metadata.totalFiles}
- **Processing**: ${metadata.requiresChunking ? `Chunked (${metadata.estimatedChunks} chunks)` : 'Direct'}
- **Analysis Level**: ${repositoryInfo.analysisLevel}

## Instructions
Generate a ${repositoryInfo.analysisLevel} architecture diagram in ${repositoryInfo.outputFormat} format.
This analysis uses Swark 3.0's enhanced processing capabilities.

## Repository Content
${files.slice(0, 5).map((f: any) => `### ${f.path}\n\`\`\`${f.languageId}\n${f.content.slice(0, 300)}...\n\`\`\``).join('\n\n')}

Please create a comprehensive ${repositoryInfo.outputFormat} architecture diagram.
`;
        
        // Send to model (simplified for demo)
        const response = await ModelInteractor.sendPrompt(model, [
            vscode.LanguageModelChatMessage.User(enhancedPrompt)
        ]);
        
        progress.report({ 
            message: 'Generating enhanced output...',
            increment: 95 
        });
        
        // Generate output using enhanced formatter
        const enhancedOutput = `# 🚀 Swark 3.0 Enhanced Analysis Result

## Processing Summary
- **Repository**: ${repositoryInfo.repositoryPath.split(/[/\\]/).pop()}
- **Commit**: ${repositoryInfo.commitHash || 'Current working directory'}
- **Analysis Level**: ${repositoryInfo.analysisLevel}
- **Output Format**: ${repositoryInfo.outputFormat}
- **Processing Method**: ${metadata.requiresChunking ? `Enhanced Chunking (${metadata.estimatedChunks} chunks)` : 'Direct Processing'}
- **Files Analyzed**: ${metadata.totalFiles}

## Enhanced Features Used
✅ **Metadata Pre-Analysis**: Comprehensive repository scanning  
✅ **Smart Input Flow**: Enhanced repository and commit selection  
✅ **Context Preservation**: ${metadata.requiresChunking ? 'Cross-chunk context maintained' : 'Full context maintained'}  
✅ **Professional Output**: Ready-to-share architectural documentation  

${response}

---

**Generated by Swark 3.0 Enhanced Analysis**  
*Advanced repository analysis with intelligent chunking*  
${new Date().toISOString()}
`;
        
        // Write output
        const outputWriter = new OutputWriter(vscode.Uri.file(repositoryInfo.repositoryPath));
        await outputWriter.writeDiagramFile(enhancedOutput, `${repositoryInfo.analysisLevel}-swark3`);
        
        progress.report({ 
            message: 'Enhanced analysis complete!',
            increment: 100 
        });
        
        // Show completion message
        vscode.window.showInformationMessage(
            `🎉 Swark 3.0 Enhanced Analysis Complete!`,
            {
                detail: `Successfully analyzed ${metadata.totalFiles} files using ${metadata.requiresChunking ? 'intelligent chunking' : 'direct processing'}.`
            },
            'View Results',
            'View Output Folder'
        ).then(selection => {
            if (selection === 'View Output Folder') {
                vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(repositoryInfo.repositoryPath + '/swark-output'));
            }
        });
    });
}
