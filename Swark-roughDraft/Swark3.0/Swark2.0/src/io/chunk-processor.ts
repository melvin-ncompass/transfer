import * as vscode from "vscode";
import { FileChunk, ChunkingResult, DependencyNode } from "./dependency-analyzer";
import { ModelInteractor } from "../llm/model-interactor";
import { PromptBuilder, DiagramFormat } from "../llm/prompt-builder";
import { TokenCounter, File } from "../types";
import { OutputFormatter } from "../view/output-formatter";
import { OutputWriter } from "../view/output-writer";
import { telemetry } from "../telemetry";

export interface ChunkProcessingResult {
    chunkId: string;
    diagramContent: string;
    summary: string;
    keyComponents: string[];
    interfaces: string[];
    dependencies: string[];
    errors?: string[];
}

export interface IntegratedResult {
    integratedDiagram: string;
    chunkResults: ChunkProcessingResult[];
    globalSummary: string;
    architecturalInsights: string[];
    crossChunkDependencies: string[];
}

export class ChunkProcessor {
    private readonly model: vscode.LanguageModelChat;
    private readonly tokenCounter: TokenCounter;

    constructor(model: vscode.LanguageModelChat, tokenCounter: TokenCounter) {
        this.model = model;
        this.tokenCounter = tokenCounter;
    }

    /**
     * Main entry point: Process all chunks and integrate results
     */
    public async processChunks(
        chunkingResult: ChunkingResult,
        diagramType: string,
        format: DiagramFormat,
        selectedFolder: vscode.Uri
    ): Promise<IntegratedResult> {
        console.log(`Processing ${chunkingResult.chunks.length} chunks...`);
        
        const chunkResults: ChunkProcessingResult[] = [];
        
        // Step 1: Process each chunk individually
        for (let i = 0; i < chunkingResult.chunks.length; i++) {
            const chunk = chunkingResult.chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunkingResult.chunks.length}: ${chunk.description}`);
            
            try {
                const result = await this.processSingleChunk(chunk, diagramType, format, i + 1);
                chunkResults.push(result);
                
                // Show progress to user (but don't mention individual chunk files)
                vscode.window.showInformationMessage(
                    `Analyzing chunk ${i + 1}/${chunkingResult.chunks.length}: ${chunk.description}`
                );
            } catch (error) {
                console.error(`Error processing chunk ${chunk.id}:`, error);
                const errorResult: ChunkProcessingResult = {
                    chunkId: chunk.id,
                    diagramContent: "",
                    summary: `Error processing chunk: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    keyComponents: [],
                    interfaces: [],
                    dependencies: [],
                    errors: [error instanceof Error ? error.message : 'Unknown error']
                };
                chunkResults.push(errorResult);
            }
        }
        
        // Step 2: Integrate all chunk results
        console.log("Integrating chunk results...");
        const integratedResult = await this.integrateChunkResults(
            chunkResults, 
            chunkingResult, 
            diagramType, 
            format
        );
        
        // Step 3: Save integrated results
        await this.saveIntegratedResults(integratedResult, selectedFolder, diagramType, format);
        
        return integratedResult;
    }

    /**
     * Process a single chunk
     */
    private async processSingleChunk(
        chunk: FileChunk,
        diagramType: string,
        format: DiagramFormat,
        chunkNumber: number
    ): Promise<ChunkProcessingResult> {
        // Convert DependencyNodes back to Files for prompt building
        const files: File[] = chunk.files.map(node => ({
            path: node.filePath,
            content: node.content,
            languageId: node.languageId
        }));

        // Build specialized chunk prompt
        const prompt = this.buildChunkPrompt(files, chunk, diagramType, format, chunkNumber);
        
        // Send to LLM
        const response = await ModelInteractor.sendPrompt(this.model, prompt);
        
        // Parse response
        const parsedResult = this.parseChunkResponse(response, chunk.id);
        
        // Send telemetry
        telemetry.sendTelemetryEvent("chunkProcessed", {
            chunkId: chunk.id,
            fileCount: files.length.toString(),
            cohesionScore: chunk.cohesionScore.toString(),
            diagramType,
            format
        }, {
            tokenCount: chunk.totalTokens
        });
        
        return parsedResult;
    }

    /**
     * Build specialized prompt for chunk processing
     */
    private buildChunkPrompt(
        files: File[],
        chunk: FileChunk,
        diagramType: string,
        format: DiagramFormat,
        chunkNumber: number
    ): vscode.LanguageModelChatMessage[] {
        const systemPrompt = this.getChunkSystemPrompt(diagramType, format, chunk, chunkNumber);
        const filesContents = files.map(PromptBuilder.encodeFile).join("\n");
        const filesPrompt = vscode.LanguageModelChatMessage.User(filesContents);
        
        return [systemPrompt, filesPrompt];
    }

    /**
     * Get system prompt specialized for chunk processing
     */
    private getChunkSystemPrompt(
        diagramType: string,
        format: DiagramFormat,
        chunk: FileChunk,
        chunkNumber: number
    ): vscode.LanguageModelChatMessage {
        let prompt = `You are analyzing CHUNK ${chunkNumber} of a large codebase (${chunk.description}).

This chunk contains ${chunk.files.length} files with a cohesion score of ${chunk.cohesionScore.toFixed(2)}.

**CRITICAL**: You are analyzing only a SUBSET of the full repository. Focus on:
1. **Local Architecture**: Diagram the components within THIS chunk
2. **Interface Identification**: Identify interfaces/APIs this chunk exposes to other parts
3. **External Dependencies**: Note what this chunk depends on (likely in other chunks)
4. **Key Components**: List the main classes/modules/functions in this chunk
5. **Summary**: Provide a concise summary of this chunk's purpose

**RESPONSE FORMAT REQUIRED**:
Please structure your response with these sections:

## DIAGRAM
[Your ${format} diagram code here]

## SUMMARY
[Brief summary of this chunk's purpose and functionality]

## KEY_COMPONENTS
[List of main classes, modules, or functions - one per line]

## INTERFACES
[APIs or interfaces this chunk exposes - one per line]

## DEPENDENCIES
[External dependencies this chunk needs - one per line]

Generate a ${diagramType} level diagram showing:`;

        if (diagramType === "high-level") {
            prompt += `
- Main modules and their relationships within this chunk
- Key data flows between components
- External interfaces and dependencies`;
        } else if (diagramType === "semi") {
            prompt += `
- Detailed component relationships within this chunk
- Internal workflows and data flows
- Public interfaces and external connections
- Key business logic patterns`;
        } else if (diagramType === "detailed") {
            prompt += `
- All classes, functions, and modules within this chunk
- Complete dependency relationships
- Data structures and their relationships
- Detailed interaction patterns`;
        }

        if (format === "d2") {
            prompt += `

**D2 FORMAT REQUIREMENTS**:
✅ Use proper D2 syntax with containers and connections
✅ Wrap code in \`\`\`d2 blocks
✅ Include descriptive labels and styling
✅ Focus on THIS chunk's internal structure`;
        } else if (format === "eraser") {
            prompt += `

**ERASER FORMAT REQUIREMENTS**:
✅ Create visually rich diagrams with detailed labels
✅ Use appropriate icons and shapes
✅ Wrap code in \`\`\`eraser blocks
✅ Focus on THIS chunk's internal structure`;
        } else if (format === "both") {
            prompt += `

**DUAL FORMAT REQUIREMENTS**:
✅ Generate BOTH D2 and Eraser diagrams
✅ D2: Technical, clean architecture
✅ Eraser: Visual, icon-rich presentation
✅ Both should show THIS chunk's internal structure`;
        }

        return vscode.LanguageModelChatMessage.User(prompt);
    }

    /**
     * Parse LLM response for chunk processing
     */
    private parseChunkResponse(response: string, chunkId: string): ChunkProcessingResult {
        const sections = this.extractSections(response);
        
        return {
            chunkId,
            diagramContent: typeof sections.diagram === 'string' ? sections.diagram : "",
            summary: typeof sections.summary === 'string' ? sections.summary : "No summary provided",
            keyComponents: Array.isArray(sections.key_components) ? sections.key_components : [],
            interfaces: Array.isArray(sections.interfaces) ? sections.interfaces : [],
            dependencies: Array.isArray(sections.dependencies) ? sections.dependencies : []
        };
    }

    /**
     * Extract structured sections from LLM response
     */
    private extractSections(response: string): { [key: string]: string | string[] } {
        const sections: { [key: string]: string | string[] } = {};
        
        // Extract diagram (everything between ```d2 or ```eraser blocks, or first section)
        const diagramMatch = response.match(/```(?:d2|eraser)([\s\S]*?)```/);
        if (diagramMatch) {
            sections.diagram = diagramMatch[0];
        } else {
            // If no code blocks, try to find diagram in first section
            const firstSection = response.split('## ')[1];
            if (firstSection && firstSection.includes('DIAGRAM')) {
                sections.diagram = firstSection.split('\n').slice(1).join('\n').trim();
            }
        }
        
        // Extract other sections
        const sectionMatches = response.matchAll(/## ([A-Z_]+)\s*\n([\s\S]*?)(?=\n## [A-Z_]+|\n```|$)/g);
        
        for (const match of sectionMatches) {
            const sectionName = match[1].toLowerCase();
            const content = match[2].trim();
            
            if (sectionName.includes('component') || sectionName.includes('interface') || 
                sectionName.includes('dependencies') || sectionName.includes('insights')) {
                // Parse as list
                sections[sectionName] = content.split('\n')
                    .map(line => line.replace(/^[-*•]\s*/, '').trim())
                    .filter(line => line.length > 0);
            } else {
                // Parse as string
                sections[sectionName] = content;
            }
        }
        
        return sections;
    }

    /**
     * Integrate results from all chunks
     */
    private async integrateChunkResults(
        chunkResults: ChunkProcessingResult[],
        chunkingResult: ChunkingResult,
        diagramType: string,
        format: DiagramFormat
    ): Promise<IntegratedResult> {
        // Build integration prompt
        const integrationPrompt = this.buildIntegrationPrompt(chunkResults, chunkingResult, diagramType, format);
        
        // Send to LLM for integration
        const response = await ModelInteractor.sendPrompt(this.model, integrationPrompt);
        
        // Parse integrated response
        const sections = this.extractSections(response);
        
        return {
            integratedDiagram: sections.diagram as string || "",
            chunkResults,
            globalSummary: sections.summary as string || "No global summary provided",
            architecturalInsights: sections.insights as string[] || [],
            crossChunkDependencies: sections.cross_dependencies as string[] || []
        };
    }

    /**
     * Build prompt for integrating chunk results
     */
    private buildIntegrationPrompt(
        chunkResults: ChunkProcessingResult[],
        chunkingResult: ChunkingResult,
        diagramType: string,
        format: DiagramFormat
    ): vscode.LanguageModelChatMessage[] {
        let prompt = `You are integrating architecture analysis from ${chunkResults.length} chunks of a large codebase.

**TASK**: Create a unified ${diagramType} architecture diagram that shows how all chunks work together.

**CHUNK ANALYSIS SUMMARY**:
`;

        // Add chunk summaries
        chunkResults.forEach((result, index) => {
            prompt += `
### Chunk ${index + 1}: ${result.chunkId}
**Summary**: ${result.summary}
**Key Components**: ${result.keyComponents.join(', ')}
**Interfaces**: ${result.interfaces.join(', ')}
**Dependencies**: ${result.dependencies.join(', ')}
`;
        });

        prompt += `

**INTEGRATION REQUIREMENTS**:
1. **Unified Diagram**: Create ONE diagram showing all chunks and their relationships
2. **Cross-Chunk Dependencies**: Map dependencies between chunks
3. **Global Architecture**: Show the overall system architecture
4. **Interface Mapping**: Connect interfaces between chunks

**RESPONSE FORMAT REQUIRED**:

## DIAGRAM
[Your integrated ${format} diagram here]

## SUMMARY
[Global summary of the entire architecture]

## INSIGHTS
[Key architectural insights and patterns - one per line]

## CROSS_DEPENDENCIES
[Dependencies between chunks - one per line]

Focus on creating a coherent, unified view of the entire system architecture.`;

        if (format === "d2") {
            prompt += `

**D2 FORMAT**: Use proper D2 syntax with clear containers for each chunk and connections between them.`;
        } else if (format === "eraser") {
            prompt += `

**ERASER FORMAT**: Create a visually rich diagram showing the complete system architecture.`;
        } else if (format === "both") {
            prompt += `

**DUAL FORMAT**: Generate both D2 and Eraser versions of the integrated diagram.`;
        }

        return [vscode.LanguageModelChatMessage.User(prompt)];
    }

    /**
     * Save integrated results to files
     */
    private async saveIntegratedResults(
        result: IntegratedResult,
        selectedFolder: vscode.Uri,
        diagramType: string,
        format: DiagramFormat
    ): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '__' + 
                         new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
        
        // Save integrated diagram using chunked formatter (final result only)
        const diagramContent = OutputFormatter.getChunkedDiagramFileContent(this.model.name, result.integratedDiagram);
        const diagramWriter = new OutputWriter(selectedFolder);
        await diagramWriter.writeDiagramFile(diagramContent, diagramType);
        
        // Save integration log with processing details (but not individual chunk files)
        const logContent = this.generateIntegrationLog(result, diagramType);
        const logWriter = new OutputWriter(selectedFolder);
        await logWriter.writeLogFile(logContent, diagramType);
        
        // Note: Individual chunk diagrams are NOT saved - user only wants final result
        
        vscode.window.showInformationMessage(
            `✅ Architecture analysis complete! Processed ${result.chunkResults.length} chunks into unified diagram`
        );
    }

    /**
     * Generate detailed log of integration process
     */
    private generateIntegrationLog(
        result: IntegratedResult,
        diagramType: string
    ): string {
        let log = `# Integration Log - ${diagramType}

Generated at: ${new Date().toISOString()}
Model: ${this.model.name}
Chunks Processed: ${result.chunkResults.length}

## Global Summary
${result.globalSummary}

## Architectural Insights
${Array.isArray(result.architecturalInsights) ? 
    result.architecturalInsights.map(insight => `- ${insight}`).join('\n') : 
    `- ${result.architecturalInsights || 'No architectural insights provided'}`}

## Cross-Chunk Dependencies
${Array.isArray(result.crossChunkDependencies) ? 
    result.crossChunkDependencies.map(dep => `- ${dep}`).join('\n') : 
    `- ${result.crossChunkDependencies || 'No cross-chunk dependencies identified'}`}

## Chunk Analysis Details

`;

        result.chunkResults.forEach((chunk, index) => {
            log += `### Chunk ${index + 1}: ${chunk.chunkId}

**Summary**: ${chunk.summary}

**Key Components**:
${chunk.keyComponents.map(comp => `- ${comp}`).join('\n')}

**Interfaces**:
${chunk.interfaces.map(iface => `- ${iface}`).join('\n')}

**Dependencies**:
${chunk.dependencies.map(dep => `- ${dep}`).join('\n')}

`;

            if (chunk.errors && chunk.errors.length > 0) {
                log += `**Errors**:
${chunk.errors.map(error => `- ${error}`).join('\n')}

`;
            }
        });

        return log;
    }
}
