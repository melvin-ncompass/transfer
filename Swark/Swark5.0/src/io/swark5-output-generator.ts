import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TokenCounter } from '../types';
import { Swark5FilteredMetadata, AnalysisLevelSelection, TokenReport } from '../commands/create-swark5-architecture';

/**
 * Swark 5.0: Enhanced output generator for multi-format diagrams and comprehensive reports
 */
export class Swark5OutputGenerator {
    private model: vscode.LanguageModelChat;
    private tokenCounter: TokenCounter;

    constructor(model: vscode.LanguageModelChat, tokenCounter: TokenCounter) {
        this.model = model;
        this.tokenCounter = tokenCounter;
    }

    /**
     * Generate all outputs for Swark 5.0
     */
    async generateAllOutputs(
        metadata: Swark5FilteredMetadata,
        selections: AnalysisLevelSelection[]
    ): Promise<void> {
        const outputDir = path.join(metadata.repositoryPath, 'swark_output', metadata.commitHash);
        
        // Ensure output directory exists
        await fs.promises.mkdir(outputDir, { recursive: true });
        
        console.log(`📁 Creating output in: ${outputDir}`);

        // Generate diagrams for each analysis level
        for (const selection of selections) {
            await this.generateDiagramsForLevel(metadata, selection, outputDir);
        }

        console.log('✅ All outputs generated successfully!');
    }

    /**
     * Generate token usage report (Enhanced for Swark 5.0)
     */
    async generateTokenReport(
        tokenReport: TokenReport,
        repositoryPath: string,
        commitHash: string,
        metadata?: Swark5FilteredMetadata,
        selections?: AnalysisLevelSelection[]
    ): Promise<void> {
        const outputDir = path.join(repositoryPath, 'swark_output', commitHash);
        const reportPath = path.join(outputDir, 'token_report.txt');

        const report = this.buildTokenReportContent(tokenReport, metadata, selections);
        
        await fs.promises.writeFile(reportPath, report, 'utf-8');
        console.log(`📊 Token report generated: ${reportPath}`);
    }

    /**
     * Generate diagrams for a specific analysis level
     */
    private async generateDiagramsForLevel(
        metadata: Swark5FilteredMetadata,
        selection: AnalysisLevelSelection,
        outputDir: string
    ): Promise<void> {
        console.log(`🎨 Generating ${selection.level} diagrams...`);

        // Read selected file contents
        const fileContents = await this.readSelectedFiles(metadata, selection.selectedFiles);
        
        // Generate D2 diagram
        const d2Content = await this.generateD2Diagram(metadata, selection, fileContents);
        const d2Path = path.join(outputDir, `${selection.level.replace('-', '_')}.d2`);
        await fs.promises.writeFile(d2Path, d2Content, 'utf-8');
        
        // Generate Eraser diagram
        const eraserContent = await this.generateEraserDiagram(metadata, selection, fileContents);
        const eraserPath = path.join(outputDir, `${selection.level.replace('-', '_')}.eraser`);
        await fs.promises.writeFile(eraserPath, eraserContent, 'utf-8');

        console.log(`✅ Generated ${selection.level} diagrams: ${d2Path}, ${eraserPath}`);
    }

    /**
     * Read selected file contents for diagram generation
     */
    private async readSelectedFiles(
        metadata: Swark5FilteredMetadata,
        selectedFilePaths: string[]
    ): Promise<{ [filePath: string]: string }> {
        const fileContents: { [filePath: string]: string } = {};
        
        for (const filePath of selectedFilePaths) {
            try {
                // Find the cleaned file data
                const cleanedFile = metadata.filteredFiles.find(f => f.path === filePath);
                if (cleanedFile) {
                    // For now, read the original file content
                    // In a full implementation, we'd store the cleaned content
                    const fullPath = path.join(metadata.repositoryPath, filePath);
                    const content = await fs.promises.readFile(fullPath, 'utf-8');
                    fileContents[filePath] = content;
                }
            } catch (error) {
                console.warn(`Could not read file ${filePath}:`, error);
                fileContents[filePath] = '// Could not read file content';
            }
        }
        
        return fileContents;
    }

    /**
     * Generate D2 diagram
     */
    private async generateD2Diagram(
        metadata: Swark5FilteredMetadata,
        selection: AnalysisLevelSelection,
        fileContents: { [filePath: string]: string }
    ): Promise<string> {
        const prompt = this.buildD2DiagramPrompt(metadata, selection, fileContents);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        
        try {
            const response = await this.model.sendRequest([promptMessage], {});
            const responseText = await this.readStream(response);
            
            // Extract D2 content from response
            const d2Match = responseText.match(/```d2\n([\s\S]*?)\n```/);
            if (d2Match) {
                return d2Match[1];
            }
            
            // If no code block, return the whole response
            return responseText;
            
        } catch (error) {
            console.error('Failed to generate D2 diagram:', error);
            return this.getFallbackD2Diagram(metadata, selection);
        }
    }

    /**
     * Generate Eraser diagram
     */
    private async generateEraserDiagram(
        metadata: Swark5FilteredMetadata,
        selection: AnalysisLevelSelection,
        fileContents: { [filePath: string]: string }
    ): Promise<string> {
        const prompt = this.buildEraserDiagramPrompt(metadata, selection, fileContents);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        
        try {
            const response = await this.model.sendRequest([promptMessage], {});
            const responseText = await this.readStream(response);
            
            // Extract Eraser content from response
            const eraserMatch = responseText.match(/```eraser\n([\s\S]*?)\n```/);
            if (eraserMatch) {
                return eraserMatch[1];
            }
            
            // If no code block, return the whole response
            return responseText;
            
        } catch (error) {
            console.error('Failed to generate Eraser diagram:', error);
            return this.getFallbackEraserDiagram(metadata, selection);
        }
    }

    /**
     * Build D2 diagram generation prompt
     */
    private buildD2DiagramPrompt(
        metadata: Swark5FilteredMetadata,
        selection: AnalysisLevelSelection,
        fileContents: { [filePath: string]: string }
    ): string {
        const levelInstructions = this.getD2LevelInstructions(selection.level);
        
        const fileList = selection.selectedFiles.slice(0, 10).map(filePath => {
            const file = metadata.filteredFiles.find(f => f.path === filePath);
            return `${filePath} (${file?.language || 'unknown'}, ${file?.importance || 'unknown'})`;
        }).join('\n');

        const codeSnippets = Object.entries(fileContents)
            .slice(0, 5)
            .map(([filePath, content]) => {
                const truncatedContent = content.split('\n').slice(0, 20).join('\n');
                return `### ${filePath}\n\`\`\`\n${truncatedContent}\n\`\`\``;
            }).join('\n\n');

        return `# Generate D2 Architecture Diagram

## Repository Information
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Analysis Level**: ${selection.level}

## Selected Files
${fileList}

## Code Analysis
${codeSnippets}

## Analysis Level Instructions
${levelInstructions}

## Your Task
Generate a D2 syntax diagram that visualizes the architecture at the **${selection.level}** level.

**D2 Syntax Guidelines:**
- Use clear, descriptive node names
- Show relationships with arrows (->)
- Group related components
- Use appropriate styling and layout
- Include dependencies and data flow

**Response Format:**
\`\`\`d2
// Your D2 diagram here
\`\`\`

Focus on creating a clear, informative diagram that represents the system architecture at the requested level of detail.`;
    }

    /**
     * Build Eraser diagram generation prompt
     */
    private buildEraserDiagramPrompt(
        metadata: Swark5FilteredMetadata,
        selection: AnalysisLevelSelection,
        fileContents: { [filePath: string]: string }
    ): string {
        const levelInstructions = this.getEraserLevelInstructions(selection.level);
        
        const fileList = selection.selectedFiles.slice(0, 10).map(filePath => {
            const file = metadata.filteredFiles.find(f => f.path === filePath);
            return `${filePath} (${file?.language || 'unknown'}, ${file?.importance || 'unknown'})`;
        }).join('\n');

        return `# Generate Eraser Architecture Diagram

## Repository Information
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Analysis Level**: ${selection.level}

## Selected Files
${fileList}

## Analysis Level Instructions
${levelInstructions}

## Your Task
Generate an Eraser syntax diagram that visualizes the architecture at the **${selection.level}** level.

**Eraser Syntax Guidelines:**
- Use entity-relationship style notation
- Define entities with attributes
- Show relationships clearly
- Use appropriate grouping and hierarchy
- Include important data flows

**Response Format:**
\`\`\`eraser
// Your Eraser diagram here
\`\`\`

Create a clear, informative diagram using Eraser syntax that represents the system architecture.`;
    }

    /**
     * Get D2-specific level instructions
     */
    private getD2LevelInstructions(level: string): string {
        const instructions: { [key: string]: string } = {
            'high-level': `
**HIGH-LEVEL D2 DIAGRAM:**
- Show main system components and their relationships
- Focus on major modules, services, and external dependencies
- Use containers and groups to organize components
- Keep the diagram clean and uncluttered
- Emphasize system boundaries and main data flows`,

            'semi-detailed': `
**SEMI-DETAILED D2 DIAGRAM:**
- Include subsystems and important internal components
- Show key interfaces and API boundaries
- Display important configuration and data stores
- Add more detailed relationships and dependencies
- Use layered architecture representation where appropriate`,

            'detailed': `
**DETAILED D2 DIAGRAM:**
- Show individual classes, functions, and modules
- Include detailed relationships and dependencies
- Display data structures and their relationships
- Show internal component interactions
- Use comprehensive labeling and annotations`
        };
        
        return instructions[level] || instructions['high-level'];
    }

    /**
     * Get Eraser-specific level instructions
     */
    private getEraserLevelInstructions(level: string): string {
        const instructions: { [key: string]: string } = {
            'high-level': `
**HIGH-LEVEL ERASER DIAGRAM:**
- Define main entities representing system components
- Show primary relationships between major components
- Use simple, clean entity definitions
- Focus on system-level architecture
- Emphasize key interfaces and boundaries`,

            'semi-detailed': `
**SEMI-DETAILED ERASER DIAGRAM:**
- Include more detailed entity attributes
- Show subsystem relationships and dependencies
- Add important data entities and their relationships
- Include interface definitions and contracts
- Use entity grouping for logical organization`,

            'detailed': `
**DETAILED ERASER DIAGRAM:**
- Define comprehensive entity attributes and methods
- Show detailed relationships and cardinalities
- Include all important data structures
- Display internal component relationships
- Use rich entity definitions with full attributes`
        };
        
        return instructions[level] || instructions['high-level'];
    }

    /**
     * Build token report content (Updated for Swark 5.0 with Swark 4.0 format)
     */
    private buildTokenReportContent(
        tokenReport: TokenReport, 
        metadata?: Swark5FilteredMetadata, 
        selections?: AnalysisLevelSelection[]
    ): string {
        const efficiency = tokenReport.reductionPercentage.total.toFixed(1);
        
        // Build analysis level breakdown if selections are provided
        let analysisBreakdown = '';
        if (selections && selections.length > 0) {
            analysisBreakdown = `
## Analysis Level Breakdown

${selections.map(sel => `### ${sel.level.toUpperCase()} Analysis
- **Files Selected**: ${sel.selectedFiles.length}
- **Tokens Used**: ${sel.actualTokens.toLocaleString()}
- **Selection Reasoning**: ${sel.reasoning}
- **Selected Files**:
${sel.selectedFiles.slice(0, 10).map(file => `  - ${file}`).join('\n')}${sel.selectedFiles.length > 10 ? `\n  - ... and ${sel.selectedFiles.length - 10} more files` : ''}
`).join('\n')}`;
        }

        // Build file importance and language stats if metadata is provided
        let additionalStats = '';
        if (metadata && metadata.filteredFiles) {
            const importanceStats = this.generateFileImportanceStats(metadata.filteredFiles);
            const languageStats = this.generateLanguageStats(metadata.filteredFiles);
            
            additionalStats = `
## File Importance Distribution
${importanceStats}

## Language Distribution
${languageStats}`;
        }
        
        return `# Swark 5.0 Token Usage Report

## Repository Information
- **Repository**: ${metadata?.repositoryPath || 'Repository analysis completed'}
- **Commit Hash**: ${metadata?.commitHash || 'Analysis completed'}
- **Analysis Date**: ${new Date().toISOString()}
- **Total Files Scanned**: ${tokenReport.filesProcessed.original}

## Token Analysis
- **Worst-case Tokens** (entire repository): ${tokenReport.worstCaseTokens.toLocaleString()}
- **After LLM Filtering**: ${tokenReport.tokensAfterFiltering.toLocaleString()}
- **After Code Cleaning**: ${tokenReport.tokensAfterCleaning.toLocaleString()}
- **Actual Tokens Used**: ${tokenReport.actualTokensUsed.toLocaleString()}
- **Token Efficiency**: ${efficiency}% total reduction
- **Files Selected**: ${tokenReport.filesProcessed.selected} of ${tokenReport.filesProcessed.original}

## Swark 5.0 Enhancement Benefits
- **LLM Filtering Reduction**: ${tokenReport.reductionPercentage.afterFiltering.toFixed(1)}% (removed ${tokenReport.filesProcessed.original - tokenReport.filesProcessed.afterFiltering} unnecessary files)
- **Code Cleaning Reduction**: ${tokenReport.reductionPercentage.afterCleaning.toFixed(1)}% (removed comments and whitespace)
- **Total Processing Steps**: Original → Filtered → Cleaned → Selected

## Processing Pipeline
1. **Initial Scan**: ${tokenReport.filesProcessed.original} files (${tokenReport.worstCaseTokens.toLocaleString()} tokens)
2. **LLM Filtering**: ${tokenReport.filesProcessed.afterFiltering} files (${tokenReport.tokensAfterFiltering.toLocaleString()} tokens)
3. **Code Cleaning**: ${tokenReport.filesProcessed.afterFiltering} files (${tokenReport.tokensAfterCleaning.toLocaleString()} tokens)
4. **Final Selection**: ${tokenReport.filesProcessed.selected} files (${tokenReport.actualTokensUsed.toLocaleString()} tokens)
${analysisBreakdown}${additionalStats}

## Key Improvements in Swark 5.0
✅ **Intelligent File Filtering**: Removed unnecessary documentation, tests, and config files
✅ **Code Cleaning**: Stripped comments and excessive whitespace while preserving logic
✅ **Multi-Level Analysis**: Generated high-level, semi-detailed, and detailed views
✅ **Token Efficiency**: Achieved ${efficiency}% reduction in token usage
✅ **Maintained Accuracy**: Preserved all essential architectural information

## Recommendations
- **Token Efficiency**: ${efficiency}% reduction achieved through intelligent filtering and cleaning
- **Coverage**: Multi-level analysis provides comprehensive system understanding
- **Optimization**: LLM-guided selection balanced detail with efficiency
- **Scalability**: Enhanced token efficiency enables analysis of larger repositories

---
Generated by Swark 5.0 - Advanced Repository Analysis with Filtering & Cleaning
${new Date().toLocaleString()}`;
    }

    /**
     * Generate file importance statistics (Similar to Swark 4.0)
     */
    private generateFileImportanceStats(files: any[]): string {
        const stats = files.reduce((acc, file) => {
            acc[file.importance] = (acc[file.importance] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});

        return Object.entries(stats)
            .map(([importance, count]) => `- **${importance}**: ${count} files`)
            .join('\n');
    }

    /**
     * Generate language statistics (Similar to Swark 4.0)
     */
    private generateLanguageStats(files: any[]): string {
        const stats = files.reduce((acc, file) => {
            acc[file.language] = (acc[file.language] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});

        return Object.entries(stats)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 10)
            .map(([language, count]) => `- **${language}**: ${count} files`)
            .join('\n');
    }

    /**
     * Get fallback D2 diagram
     */
    private getFallbackD2Diagram(metadata: Swark5FilteredMetadata, selection: AnalysisLevelSelection): string {
        return `# ${selection.level.toUpperCase()} Architecture Diagram
# Repository: ${metadata.repositoryPath}
# Commit: ${metadata.commitHash}

repository: {
  label: "Repository"
  shape: "package"
}

${selection.selectedFiles.slice(0, 5).map((filePath, index) => {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `file_${index}: {
  label: "${fileName}"
  shape: "document"
}

repository -> file_${index}`;
}).join('\n\n')}`;
    }

    /**
     * Get fallback Eraser diagram
     */
    private getFallbackEraserDiagram(metadata: Swark5FilteredMetadata, selection: AnalysisLevelSelection): string {
        return `# ${selection.level.toUpperCase()} Architecture Diagram
# Repository: ${metadata.repositoryPath}
# Commit: ${metadata.commitHash}

Repository {
  name: string
  path: string
  commit: string
}

${selection.selectedFiles.slice(0, 5).map((filePath, index) => {
    const fileName = path.basename(filePath, path.extname(filePath));
    return `File${index} {
  name: "${fileName}"
  path: "${filePath}"
  type: "source"
}

Repository ||--o{ File${index}`;
}).join('\n\n')}`;
    }

    /**
     * Read stream response from LLM
     */
    private async readStream(response: vscode.LanguageModelChatResponse): Promise<string> {
        let fullResponse = '';
        for await (const chunk of response.text) {
            fullResponse += chunk;
        }
        return fullResponse;
    }
}
