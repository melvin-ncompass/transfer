import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TokenCounter } from '../types';
import { Swark4Metadata, AnalysisLevelSelection } from '../commands/create-swark4-architecture';

/**
 * Swark 4.0: Multi-format output generator for D2 and EraserDiagram
 */
export class Swark4OutputGenerator {
    private model: vscode.LanguageModelChat;
    private tokenCounter: TokenCounter;

    constructor(model: vscode.LanguageModelChat, tokenCounter: TokenCounter) {
        this.model = model;
        this.tokenCounter = tokenCounter;
    }

    /**
     * Generate all outputs for the analysis
     */
    async generateAllOutputs(
        metadata: Swark4Metadata, 
        selections: AnalysisLevelSelection[]
    ): Promise<void> {
        
        // Create output directory
        const outputDir = path.join(metadata.repositoryPath, 'swark_output', metadata.commitHash);
        await this.ensureDirectoryExists(outputDir);

        // Generate diagrams for each level
        for (const selection of selections) {
            console.log(`📊 Generating ${selection.level} diagrams...`);
            
            // Read selected files content
            const filesContent = await this.readSelectedFiles(metadata.repositoryPath, selection.selectedFiles);
            
            // Generate D2 diagram
            const d2Content = await this.generateD2Diagram(metadata, selection, filesContent);
            await this.writeFile(path.join(outputDir, `${selection.level.replace('-', '_')}.d2`), d2Content);
            
            // Generate EraserDiagram
            const eraserContent = await this.generateEraserDiagram(metadata, selection, filesContent);
            await this.writeFile(path.join(outputDir, `${selection.level.replace('-', '_')}.eraser`), eraserContent);
        }

        // Generate token report
        console.log('📈 Generating token usage report...');
        const tokenReport = this.generateTokenReport(metadata, selections);
        await this.writeFile(path.join(outputDir, 'token_report.txt'), tokenReport);

        console.log(`✅ All outputs generated in: ${outputDir}`);
    }

    /**
     * Read content of selected files
     */
    private async readSelectedFiles(repositoryPath: string, selectedFiles: string[]): Promise<{[path: string]: string}> {
        const filesContent: {[path: string]: string} = {};
        
        for (const filePath of selectedFiles) {
            try {
                const fullPath = path.join(repositoryPath, filePath);
                const content = await fs.readFile(fullPath, 'utf-8');
                filesContent[filePath] = content;
            } catch (error) {
                console.warn(`Cannot read file ${filePath}:`, error);
                filesContent[filePath] = `// Error reading file: ${error}`;
            }
        }
        
        return filesContent;
    }

    /**
     * Generate D2 diagram content
     */
    private async generateD2Diagram(
        metadata: Swark4Metadata,
        selection: AnalysisLevelSelection,
        filesContent: {[path: string]: string}
    ): Promise<string> {
        
        const prompt = this.buildD2DiagramPrompt(metadata, selection, filesContent);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        
        try {
            const response = await this.model.sendRequest([promptMessage], {});
            const responseText = await this.readStream(response);
            
            // Extract D2 content from response
            const d2Match = responseText.match(/```d2\s*([\s\S]*?)\s*```/);
            if (d2Match) {
                return d2Match[1].trim();
            }
            
            // If no code block found, return the entire response
            return responseText;
            
        } catch (error) {
            console.error('Failed to generate D2 diagram:', error);
            return this.generateFallbackD2Diagram(metadata, selection);
        }
    }

    /**
     * Generate EraserDiagram content
     */
    private async generateEraserDiagram(
        metadata: Swark4Metadata,
        selection: AnalysisLevelSelection,
        filesContent: {[path: string]: string}
    ): Promise<string> {
        
        const prompt = this.buildEraserDiagramPrompt(metadata, selection, filesContent);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        
        try {
            const response = await this.model.sendRequest([promptMessage], {});
            const responseText = await this.readStream(response);
            
            // Extract Eraser content from response
            const eraserMatch = responseText.match(/```eraser\s*([\s\S]*?)\s*```/);
            if (eraserMatch) {
                return eraserMatch[1].trim();
            }
            
            // If no code block found, return the entire response
            return responseText;
            
        } catch (error) {
            console.error('Failed to generate EraserDiagram:', error);
            return this.generateFallbackEraserDiagram(metadata, selection);
        }
    }

    /**
     * Build D2 diagram generation prompt
     */
    private buildD2DiagramPrompt(
        metadata: Swark4Metadata,
        selection: AnalysisLevelSelection,
        filesContent: {[path: string]: string}
    ): string {
        
        const filesSummary = Object.entries(filesContent)
            .map(([path, content]) => `### ${path}\n\`\`\`\n${content.substring(0, 2000)}${content.length > 2000 ? '\n...[truncated]' : ''}\n\`\`\``)
            .join('\n\n');

        return `# Swark 4.0: D2 Diagram Generation - ${selection.level.toUpperCase()}

## Repository Context
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Analysis Level**: ${selection.level}
- **Selected Files**: ${selection.selectedFiles.length}
- **Reasoning**: ${selection.reasoning}

## Selected Files Content
${filesSummary}

## Task: Generate D2 Diagram
Create a comprehensive D2 diagram that visualizes the architecture at the **${selection.level}** level.

### D2 Diagram Requirements:
1. **Components**: Identify and represent all major components, classes, modules
2. **Relationships**: Show dependencies, inheritance, composition, and data flow
3. **Grouping**: Use containers to group related components
4. **Styling**: Apply appropriate colors and styles for clarity
5. **Labels**: Include meaningful labels and descriptions

### Analysis Level Focus:
${this.getD2LevelGuidance(selection.level)}

### D2 Syntax Guidelines:
- Use \`component_name\` for simple components
- Use \`container: { inner_component }\` for grouping
- Use \`component1 -> component2: "relationship label"\` for connections
- Use \`component.style.fill: "color"\` for styling
- Use \`component.tooltip: "description"\` for additional info

**Output Format:**
\`\`\`d2
[Your D2 diagram code here]
\`\`\`

**Important**: 
- Generate ONLY the D2 code, no additional explanation
- Focus on the most important architectural elements for this analysis level
- Ensure the diagram is readable and well-organized
- Use the file content analysis to create accurate relationships`;
    }

    /**
     * Build EraserDiagram generation prompt
     */
    private buildEraserDiagramPrompt(
        metadata: Swark4Metadata,
        selection: AnalysisLevelSelection,
        filesContent: {[path: string]: string}
    ): string {
        
        const filesSummary = Object.entries(filesContent)
            .map(([path, content]) => `### ${path}\n\`\`\`\n${content.substring(0, 2000)}${content.length > 2000 ? '\n...[truncated]' : ''}\n\`\`\``)
            .join('\n\n');

        return `# Swark 4.0: EraserDiagram Generation - ${selection.level.toUpperCase()}

## Repository Context
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Analysis Level**: ${selection.level}
- **Selected Files**: ${selection.selectedFiles.length}
- **Reasoning**: ${selection.reasoning}

## Selected Files Content
${filesSummary}

## Task: Generate EraserDiagram
Create a comprehensive EraserDiagram that visualizes the architecture at the **${selection.level}** level.

### EraserDiagram Requirements:
1. **Entities**: Define entities for major components, classes, services
2. **Relationships**: Show associations, dependencies, and interactions
3. **Attributes**: Include key properties and methods
4. **Grouping**: Use packages or modules for organization
5. **Annotations**: Add notes and descriptions for clarity

### Analysis Level Focus:
${this.getEraserLevelGuidance(selection.level)}

### EraserDiagram Syntax Guidelines:
- Use \`entity EntityName { ... }\` for defining entities
- Use \`EntityA --> EntityB : relationship\` for connections
- Use \`package PackageName { ... }\` for grouping
- Use \`note as N1\` for annotations
- Use attributes like \`+ publicMethod()\`, \`- privateField\`

**Output Format:**
\`\`\`eraser
[Your EraserDiagram code here]
\`\`\`

**Important**: 
- Generate ONLY the EraserDiagram code, no additional explanation
- Focus on the most important entities and relationships for this analysis level
- Ensure the diagram clearly shows the system structure
- Use the file content analysis to create accurate entity definitions`;
    }

    /**
     * Get D2-specific level guidance
     */
    private getD2LevelGuidance(level: string): string {
        const guidance = {
            'high-level': 'Focus on major system boundaries, main components, and high-level data flows. Use containers to group related functionality.',
            'semi-detailed': 'Include module-level components, key classes, and their interactions. Show important design patterns and architectural decisions.',
            'detailed': 'Comprehensive view including detailed class relationships, method calls, and implementation dependencies. Show complete component hierarchy.'
        };
        
        return guidance[level as keyof typeof guidance] || guidance['high-level'];
    }

    /**
     * Get EraserDiagram-specific level guidance
     */
    private getEraserLevelGuidance(level: string): string {
        const guidance = {
            'high-level': 'Define main system entities and their primary relationships. Focus on business logic and major architectural components.',
            'semi-detailed': 'Include detailed entity attributes and methods. Show inheritance, composition, and important behavioral relationships.',
            'detailed': 'Comprehensive entity modeling with full attribute and method definitions. Include utility classes and detailed dependency relationships.'
        };
        
        return guidance[level as keyof typeof guidance] || guidance['high-level'];
    }

    /**
     * Generate token usage report
     */
    private generateTokenReport(metadata: Swark4Metadata, selections: AnalysisLevelSelection[]): string {
        const totalActualTokens = selections.reduce((sum, sel) => sum + sel.actualTokens, 0);
        const efficiency = ((metadata.worstCaseTokens - totalActualTokens) / metadata.worstCaseTokens * 100).toFixed(1);

        return `# Swark 4.0 Token Usage Report

## Repository Information
- **Repository**: ${metadata.repositoryPath}
- **Commit Hash**: ${metadata.commitHash}
- **Analysis Date**: ${new Date().toISOString()}
- **Total Files Scanned**: ${metadata.totalFiles}

## Token Analysis
- **Worst-case Tokens** (entire repository): ${metadata.worstCaseTokens.toLocaleString()}
- **Actual Tokens Used**: ${totalActualTokens.toLocaleString()}
- **Token Efficiency**: ${efficiency}% reduction
- **Files Selected**: ${selections.reduce((sum, sel) => sum + sel.selectedFiles.length, 0)} of ${metadata.totalFiles}

## Analysis Level Breakdown

${selections.map(sel => `### ${sel.level.toUpperCase()} Analysis
- **Files Selected**: ${sel.selectedFiles.length}
- **Tokens Used**: ${sel.actualTokens.toLocaleString()}
- **Selection Reasoning**: ${sel.reasoning}
- **Selected Files**:
${sel.selectedFiles.map(file => `  - ${file}`).join('\n')}
`).join('\n')}

## File Importance Distribution
${this.generateFileImportanceStats(metadata)}

## Language Distribution
${this.generateLanguageStats(metadata)}

## Recommendations
- **Token Efficiency**: ${efficiency}% reduction achieved through intelligent file selection
- **Coverage**: Multi-level analysis provides comprehensive system understanding
- **Optimization**: LLM-guided selection balanced detail with efficiency

---
Generated by Swark 4.0 - Intelligent Repository Analysis
${new Date().toLocaleString()}`;
    }

    /**
     * Generate file importance statistics
     */
    private generateFileImportanceStats(metadata: Swark4Metadata): string {
        const stats = metadata.fileList.reduce((acc, file) => {
            acc[file.importance] = (acc[file.importance] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});

        return Object.entries(stats)
            .map(([importance, count]) => `- **${importance}**: ${count} files`)
            .join('\n');
    }

    /**
     * Generate language statistics
     */
    private generateLanguageStats(metadata: Swark4Metadata): string {
        const stats = metadata.fileList.reduce((acc, file) => {
            acc[file.language] = (acc[file.language] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});

        return Object.entries(stats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([language, count]) => `- **${language}**: ${count} files`)
            .join('\n');
    }

    /**
     * Generate fallback D2 diagram
     */
    private generateFallbackD2Diagram(metadata: Swark4Metadata, selection: AnalysisLevelSelection): string {
        return `# Fallback D2 Diagram - ${selection.level}

Repository: ${metadata.repositoryPath}
Commit: ${metadata.commitHash}

# Main Components
${selection.selectedFiles.map(file => {
    const component = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9]/g, '_');
    return `${component}: "${file}"`;
}).join('\n')}

# Basic Structure
main_system: {
  ${selection.selectedFiles.slice(0, 5).map(file => {
    const component = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9]/g, '_');
    return `  ${component}`;
  }).join('\n  ')}
}

# Note: LLM diagram generation failed, showing basic structure`;
    }

    /**
     * Generate fallback EraserDiagram
     */
    private generateFallbackEraserDiagram(metadata: Swark4Metadata, selection: AnalysisLevelSelection): string {
        return `// Fallback EraserDiagram - ${selection.level}
// Repository: ${metadata.repositoryPath}
// Commit: ${metadata.commitHash}

${selection.selectedFiles.map(file => {
    const entityName = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9]/g, '');
    return `entity ${entityName} {
  + file: "${file}"
}`;
}).join('\n\n')}

// Note: LLM diagram generation failed, showing basic entities`;
    }

    /**
     * Ensure directory exists
     */
    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Write file content
     */
    private async writeFile(filePath: string, content: string): Promise<void> {
        await fs.writeFile(filePath, content, 'utf-8');
    }

    /**
     * Read stream response from LLM
     */
    private async readStream(response: vscode.LanguageModelChatResponse): Promise<string> {
        let result = '';
        for await (const fragment of response.text) {
            result += fragment;
        }
        return result;
    }
}
