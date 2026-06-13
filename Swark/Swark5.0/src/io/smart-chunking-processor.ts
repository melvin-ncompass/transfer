import * as vscode from 'vscode';
import { RepositoryMetadata, FileAnalysisResult } from './repository-metadata-analyzer';
import { DependencyAnalyzer, FileChunk, ChunkingResult } from './dependency-analyzer';
import { ModelInteractor } from '../llm/model-interactor';
import { PromptBuilder, DiagramFormat } from '../llm/prompt-builder';
import { OutputFormatter } from '../view/output-formatter';
import { OutputWriter } from '../view/output-writer';
import { RepositoryReader } from './repository-reader';
import { TokenCounter, File } from '../types';

export interface EnhancedChunk {
    id: string;
    files: string[];
    totalTokens: number;
    dependencies: string[];
    interfaces: string[];
    contextOverlap: string[]; // Files included for context from other chunks
    metadata: {
        primaryLanguages: string[];
        complexity: number;
        fileCount: number;
    };
}

export interface ChunkProcessingOptions {
    maxTokensPerChunk: number;
    overlapRatio: number; // 0.0 to 0.5
    preserveContext: boolean;
    analysisLevel: string;
    outputFormat: DiagramFormat;
}

export class SmartChunkingProcessor {
    private model: vscode.LanguageModelChat;
    private tokenCounter: TokenCounter;
    private repositoryMetadata: RepositoryMetadata;

    constructor(
        model: vscode.LanguageModelChat, 
        tokenCounter: TokenCounter,
        repositoryMetadata: RepositoryMetadata
    ) {
        this.model = model;
        this.tokenCounter = tokenCounter;
        this.repositoryMetadata = repositoryMetadata;
    }

    /**
     * Main entry point: Process repository with intelligent chunking
     */
    public async processRepository(
        repositoryPath: string,
        options: ChunkProcessingOptions
    ): Promise<string> {
        
        console.log(`🚀 Starting smart chunking analysis...`);
        console.log(`📊 Repository has ${this.repositoryMetadata.estimatedTokens} tokens`);
        console.log(`🔧 Max tokens per chunk: ${options.maxTokensPerChunk}`);
        console.log(`🔗 Context overlap: ${(options.overlapRatio * 100).toFixed(1)}%`);

        // Step 1: Create enhanced chunks with context overlap
        const chunks = await this.createEnhancedChunks(repositoryPath, options);
        console.log(`📦 Created ${chunks.length} enhanced chunks`);

        // Step 2: Process each chunk with context preservation
        const chunkResults = await this.processChunksWithContext(chunks, options);
        console.log(`✅ Processed all chunks successfully`);

        // Step 3: Intelligent integration with cross-chunk context
        const integratedResult = await this.integrateWithFullContext(
            chunkResults, 
            chunks, 
            options
        );
        console.log(`🎯 Integration complete`);

        // Step 4: Generate final output
        await this.generateFinalOutput(integratedResult, repositoryPath, options);
        console.log(`📄 Final output generated`);

        return integratedResult;
    }

    /**
     * Step 1: Create enhanced chunks with intelligent overlap
     */
    private async createEnhancedChunks(
        repositoryPath: string,
        options: ChunkProcessingOptions
    ): Promise<EnhancedChunk[]> {
        
        // First read the repository files
        const repositoryReader = new RepositoryReader(
            vscode.Uri.file(repositoryPath), 
            this.tokenCounter, 
            options.maxTokensPerChunk * 10 // Allow more files for analysis
        );
        const files = await repositoryReader.readFiles();
        
        // Use existing dependency analyzer for base chunking
        const dependencyAnalyzer = new DependencyAnalyzer(this.tokenCounter, options.maxTokensPerChunk);
        const chunkingResult = await dependencyAnalyzer.analyzeAndChunk(files);

        const enhancedChunks: EnhancedChunk[] = [];

        for (let i = 0; i < chunkingResult.chunks.length; i++) {
            const baseChunk = chunkingResult.chunks[i];
            
            // Calculate context overlap files
            const contextOverlap = await this.calculateContextOverlap(
                baseChunk,
                chunkingResult.chunks,
                options.overlapRatio
            );

            // Extract chunk metadata
            const metadata = await this.extractChunkMetadata(baseChunk, repositoryPath);

            // Extract dependencies from chunk files
            const dependencies = this.extractDependenciesFromChunk(baseChunk);
            const interfaces = this.extractInterfacesFromChunk(baseChunk);

            const enhancedChunk: EnhancedChunk = {
                id: `chunk-${i + 1}`,
                files: baseChunk.files.map(f => f.filePath),
                totalTokens: baseChunk.totalTokens,
                dependencies,
                interfaces,
                contextOverlap,
                metadata
            };

            enhancedChunks.push(enhancedChunk);
        }

        return enhancedChunks;
    }

    /**
     * Extract dependencies from a chunk by analyzing file imports
     */
    private extractDependenciesFromChunk(chunk: FileChunk): string[] {
        const dependencies: Set<string> = new Set();
        
        chunk.files.forEach(file => {
            file.dependencies.forEach(dep => dependencies.add(dep));
        });
        
        return Array.from(dependencies);
    }

    /**
     * Extract interfaces from a chunk by analyzing file exports
     */
    private extractInterfacesFromChunk(chunk: FileChunk): string[] {
        const interfaces: Set<string> = new Set();
        
        // Simple heuristic: look for exported classes, interfaces, functions
        chunk.files.forEach(file => {
            const content = file.content;
            const exportMatches = content.match(/export\s+(class|interface|function|const)\s+(\w+)/g);
            if (exportMatches) {
                exportMatches.forEach(match => {
                    const name = match.split(/\s+/).pop();
                    if (name) interfaces.add(name);
                });
            }
        });
        
        return Array.from(interfaces);
    }

    /**
     * Calculate which files from other chunks should be included for context
     */
    private async calculateContextOverlap(
        currentChunk: FileChunk,
        allChunks: FileChunk[],
        overlapRatio: number
    ): Promise<string[]> {
        
        if (overlapRatio <= 0) {
            return [];
        }

        const contextFiles: string[] = [];
        const maxContextTokens = Math.floor(currentChunk.totalTokens * overlapRatio);
        let usedTokens = 0;

        // Get dependencies from current chunk
        const currentDependencies = this.extractDependenciesFromChunk(currentChunk);

        // Find files that are dependencies of this chunk
        for (const otherChunk of allChunks) {
            if (otherChunk === currentChunk) continue;

            for (const file of otherChunk.files) {
                // Check if this file is referenced by current chunk
                const isReferenced = currentDependencies.some((dep: string) => 
                    file.filePath.includes(dep) || dep.includes(file.filePath)
                );

                // Estimate file token size (simple heuristic)
                const fileTokens = Math.ceil(file.size / 4); // rough estimation

                if (isReferenced && usedTokens + fileTokens <= maxContextTokens) {
                    contextFiles.push(file.filePath);
                    usedTokens += fileTokens;
                }
            }
        }

        return contextFiles;
    }

    /**
     * Extract metadata about a chunk
     */
    private async extractChunkMetadata(
        chunk: FileChunk, 
        repositoryPath: string
    ): Promise<{
        primaryLanguages: string[];
        complexity: number;
        fileCount: number;
    }> {
        
        // Count languages in chunk
        const languageCounts: { [lang: string]: number } = {};
        chunk.files.forEach(file => {
            const ext = file.filePath.split('.').pop()?.toLowerCase() || 'unknown';
            const langMap: { [key: string]: string } = {
                'ts': 'TypeScript', 'tsx': 'TypeScript',
                'js': 'JavaScript', 'jsx': 'JavaScript',
                'py': 'Python', 'java': 'Java', 'go': 'Go', 'rs': 'Rust'
            };
            const language = langMap[ext] || ext;
            languageCounts[language] = (languageCounts[language] || 0) + 1;
        });

        const primaryLanguages = Object.entries(languageCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([lang]) => lang);

        // Calculate complexity based on dependencies and cohesion
        const dependencies = this.extractDependenciesFromChunk(chunk);
        const interfaces = this.extractInterfacesFromChunk(chunk);
        const complexity = dependencies.length + interfaces.length + chunk.files.length;

        return {
            primaryLanguages,
            complexity,
            fileCount: chunk.files.length
        };
    }

    /**
     * Step 2: Process chunks with context preservation
     */
    private async processChunksWithContext(
        chunks: EnhancedChunk[],
        options: ChunkProcessingOptions
    ): Promise<any[]> {
        
        const results = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Processing chunk ${i + 1}/${chunks.length}`,
                cancellable: false
            }, async (progress) => {
                
                progress.report({ 
                    message: `Analyzing ${chunk.files.length} files + ${chunk.contextOverlap.length} context files`,
                    increment: 0 
                });

                // Build enhanced prompt with context
                const prompt = await this.buildContextAwarePrompt(chunk, options);
                
                progress.report({ 
                    message: 'Sending to language model...',
                    increment: 50 
                });

                // Process with LLM
                const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
                const result = await ModelInteractor.sendPrompt(this.model, [promptMessage]);
                
                progress.report({ 
                    message: 'Processing complete',
                    increment: 100 
                });

                return result;
            });

            results.push({
                chunkId: chunk.id,
                result: await this.processChunkWithLLM(chunk, options),
                metadata: chunk.metadata
            });
        }

        return results;
    }

    /**
     * Build context-aware prompt for chunk processing
     */
    private async buildContextAwarePrompt(
        chunk: EnhancedChunk,
        options: ChunkProcessingOptions
    ): Promise<string> {
        
        let prompt = `# Swark 3.0: Enhanced Chunk Analysis

## Repository Context
- **Repository**: ${this.repositoryMetadata.repositoryPath}
- **Total Files**: ${this.repositoryMetadata.totalFiles}
- **Total Tokens**: ${this.repositoryMetadata.estimatedTokens}
- **Languages**: ${Object.keys(this.repositoryMetadata.languageDistribution).join(', ')}

## Current Chunk: ${chunk.id}
- **Files**: ${chunk.files.length} primary files
- **Context Files**: ${chunk.contextOverlap.length} for cross-chunk understanding
- **Primary Languages**: ${chunk.metadata.primaryLanguages.join(', ')}
- **Complexity Score**: ${chunk.metadata.complexity}

## Analysis Instructions
Generate a ${options.analysisLevel} architecture analysis for this chunk, considering:

1. **Primary Files** (main focus):
${chunk.files.map(f => `   - ${f}`).join('\n')}

2. **Context Files** (for understanding dependencies):
${chunk.contextOverlap.map(f => `   - ${f} (context only)`).join('\n')}

3. **External Dependencies**: ${chunk.dependencies.join(', ')}
4. **Exposed Interfaces**: ${chunk.interfaces.join(', ')}

## Output Requirements
- Focus on the PRIMARY files for the main analysis
- Use CONTEXT files only to understand relationships and dependencies
- Indicate which components connect to other chunks
- Generate ${options.outputFormat} format diagram
- Include chunk integration metadata

## Analysis Level: ${options.analysisLevel}
${this.getAnalysisLevelInstructions(options.analysisLevel)}

`;

        return prompt;
    }

    /**
     * Get specific instructions based on analysis level
     */
    private getAnalysisLevelInstructions(level: string): string {
        const instructions: { [key: string]: string } = {
            'high-level': `
Focus on:
- Main architectural components and their roles
- High-level data flows between components
- Key system boundaries and interfaces
- Overall system structure and organization`,

            'semi-detailed': `
Focus on:
- Module-level components and their interactions
- Data flow patterns and communication protocols
- Key classes and their relationships
- Interface definitions and contracts`,

            'detailed': `
Focus on:
- All classes, functions, and their relationships
- Detailed dependency mappings
- Implementation patterns and architectural decisions
- Complete component interaction flows`,

            'all': `
Provide complete analysis at all levels:
1. High-level system overview
2. Semi-detailed module interactions
3. Detailed implementation structure`
        };

        return instructions[level] || instructions['high-level'];
    }

    /**
     * Process individual chunk with LLM
     */
    private async processChunkWithLLM(
        chunk: EnhancedChunk,
        options: ChunkProcessingOptions
    ): Promise<string> {
        
        const prompt = await this.buildContextAwarePrompt(chunk, options);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        const result = await ModelInteractor.sendPrompt(this.model, [promptMessage]);
        return result;
    }

    /**
     * Step 3: Intelligent integration with full repository context
     */
    private async integrateWithFullContext(
        chunkResults: any[],
        chunks: EnhancedChunk[],
        options: ChunkProcessingOptions
    ): Promise<string> {
        
        const integrationPrompt = `# Swark 3.0: Final Integration

## Repository Overview
${JSON.stringify(this.repositoryMetadata, null, 2)}

## Chunk Results Integration
You have analyzed ${chunks.length} chunks of this repository. Now integrate them into a unified architecture diagram.

${chunkResults.map((result, i) => `
### ${result.chunkId}
**Metadata**: ${JSON.stringify(result.metadata, null, 2)}
**Analysis Result**:
${result.result}
`).join('\n')}

## Integration Requirements
1. **Merge all chunk diagrams** into one comprehensive ${options.outputFormat} diagram
2. **Preserve all relationships** between components across chunks
3. **Eliminate duplicates** while maintaining connections
4. **Show clear boundaries** between different system areas
5. **Maintain ${options.analysisLevel} level of detail** consistently

## Final Output Format
Generate a single, unified ${options.outputFormat} diagram that represents the complete repository architecture.
Include a summary of the integration process and any notable cross-chunk relationships discovered.

## Output Structure
\`\`\`${options.outputFormat}
[Your integrated diagram here]
\`\`\`

## Integration Summary
[Explain how chunks were combined and key relationships discovered]
`;

        const promptMessage = vscode.LanguageModelChatMessage.User(integrationPrompt);
        const integratedResult = await ModelInteractor.sendPrompt(this.model, [promptMessage]);
        return integratedResult;
    }

    /**
     * Step 4: Generate final output files
     */
    private async generateFinalOutput(
        integratedResult: string,
        repositoryPath: string,
        options: ChunkProcessingOptions
    ): Promise<void> {
        
        const outputFormatter = OutputFormatter.getChunkedDiagramFileContent(
            this.model.name,
            integratedResult
        );

        const outputWriter = new OutputWriter(vscode.Uri.file(repositoryPath));
        await outputWriter.writeDiagramFile(outputFormatter, options.analysisLevel);

        // Also generate a comprehensive log
        const logContent = this.generateProcessingLog(options);
        await outputWriter.writeLogFile(logContent, options.analysisLevel);

        vscode.window.showInformationMessage(
            `🎉 Swark 3.0 analysis complete! Processed ${this.repositoryMetadata.totalFiles} files across ${this.repositoryMetadata.estimatedChunks} chunks.`,
            'View Results'
        ).then(selection => {
            if (selection === 'View Results') {
                // Open the output folder in VS Code
                vscode.commands.executeCommand('vscode.openFolder', this.repositoryMetadata.repositoryPath + '/swark-output');
            }
        });
    }

    /**
     * Generate comprehensive processing log
     */
    private generateProcessingLog(options: ChunkProcessingOptions): string {
        return `# Swark 3.0 Processing Log

## Repository Analysis
- **Path**: ${this.repositoryMetadata.repositoryPath}
- **Commit**: ${this.repositoryMetadata.commitHash || 'Current state'}
- **Total Files**: ${this.repositoryMetadata.totalFiles}
- **Total Lines**: ${this.repositoryMetadata.totalLines}
- **Estimated Tokens**: ${this.repositoryMetadata.estimatedTokens}

## Chunking Strategy
- **Chunks Created**: ${this.repositoryMetadata.estimatedChunks}
- **Max Tokens/Chunk**: ${options.maxTokensPerChunk}
- **Context Overlap**: ${(options.overlapRatio * 100).toFixed(1)}%
- **Analysis Level**: ${options.analysisLevel}
- **Output Format**: ${options.outputFormat}

## Language Distribution
${Object.entries(this.repositoryMetadata.languageDistribution)
    .map(([lang, count]) => `- **${lang}**: ${count} files`)
    .join('\n')}

## File Size Distribution
- **Small (<1KB)**: ${this.repositoryMetadata.fileSizeDistribution.small} files
- **Medium (1-10KB)**: ${this.repositoryMetadata.fileSizeDistribution.medium} files  
- **Large (10-100KB)**: ${this.repositoryMetadata.fileSizeDistribution.large} files
- **Extra Large (>100KB)**: ${this.repositoryMetadata.fileSizeDistribution.extraLarge} files

## Processing Summary
✅ Successfully analyzed entire repository using intelligent chunking
✅ Preserved cross-chunk dependencies and context
✅ Generated unified architecture diagram
✅ Maintained ${options.analysisLevel} level of detail throughout

Generated by Swark 3.0 - Advanced Repository Analysis
${new Date().toISOString()}
`;
    }
}
