import * as vscode from 'vscode';
import { TokenCounter } from '../types';
import { Swark4Metadata, AnalysisLevelSelection } from '../commands/create-swark4-architecture';

/**
 * Swark 4.0: LLM-guided intelligent file selection for different analysis levels
 */
export class LLMGuidedFileSelector {
    private model: vscode.LanguageModelChat;
    private tokenCounter: TokenCounter;

    constructor(model: vscode.LanguageModelChat, tokenCounter: TokenCounter) {
        this.model = model;
        this.tokenCounter = tokenCounter;
    }

    /**
     * Select files for all analysis levels using LLM guidance
     */
    async selectFilesForAllLevels(metadata: Swark4Metadata): Promise<AnalysisLevelSelection[]> {
        const selections: AnalysisLevelSelection[] = [];

        // High-level analysis
        console.log('🔍 LLM selecting files for high-level analysis...');
        const highLevel = await this.selectFilesForLevel(metadata, 'high-level');
        selections.push(highLevel);

        // Semi-detailed analysis
        console.log('🔍 LLM selecting files for semi-detailed analysis...');
        const semiDetailed = await this.selectFilesForLevel(metadata, 'semi-detailed');
        selections.push(semiDetailed);

        // Detailed analysis
        console.log('🔍 LLM selecting files for detailed analysis...');
        const detailed = await this.selectFilesForLevel(metadata, 'detailed');
        selections.push(detailed);

        return selections;
    }

    /**
     * Select files for a specific analysis level
     */
    private async selectFilesForLevel(
        metadata: Swark4Metadata, 
        level: 'high-level' | 'semi-detailed' | 'detailed'
    ): Promise<AnalysisLevelSelection> {
        
        const prompt = this.buildFileSelectionPrompt(metadata, level);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        
        try {
            const response = await this.model.sendRequest([promptMessage], {});
            const responseText = await this.readStream(response);
            
            // Parse LLM response to extract file selections and reasoning
            const parsedResponse = this.parseFileSelectionResponse(responseText, metadata);
            
            // Calculate actual tokens for selected files
            const actualTokens = await this.calculateSelectedTokens(parsedResponse.selectedFiles, metadata);
            
            return {
                level,
                selectedFiles: parsedResponse.selectedFiles,
                actualTokens,
                reasoning: parsedResponse.reasoning
            };
            
        } catch (error) {
            console.error(`Failed to get LLM file selection for ${level}:`, error);
            // Fallback to rule-based selection
            return this.fallbackFileSelection(metadata, level);
        }
    }

    /**
     * Build file selection prompt for LLM
     */
    private buildFileSelectionPrompt(metadata: Swark4Metadata, level: string): string {
        const levelInstructions = this.getLevelInstructions(level);
        
        // Prepare file summary for LLM
        const fileSummary = metadata.fileList
            .slice(0, 100) // Limit to first 100 files to avoid token overflow
            .map(file => `${file.path} (${file.language}, ${file.importance}, ${file.estimatedTokens} tokens)`)
            .join('\n');

        return `# Swark 4.0: Intelligent File Selection for ${level.toUpperCase()} Analysis

## Repository Context
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Total Files**: ${metadata.totalFiles}
- **Worst-case Tokens**: ${metadata.worstCaseTokens}

## Repository Structure Preview
\`\`\`
${metadata.repositoryStructure.split('\n').slice(0, 50).join('\n')}
\`\`\`

## Available Files (showing first 100)
${fileSummary}

## Analysis Level: ${level.toUpperCase()}
${levelInstructions}

## Your Task
Based on the repository structure and file information above, intelligently select the most relevant files for a **${level}** analysis.

**Selection Criteria:**
1. **Relevance**: Choose files that best represent the system at this analysis level
2. **Coverage**: Ensure broad coverage of the system's key components
3. **Efficiency**: Balance comprehensiveness with token usage
4. **Dependencies**: Include files that help understand relationships

**Response Format:**
\`\`\`json
{
  "selectedFiles": [
    "path/to/file1.ext",
    "path/to/file2.ext"
  ],
  "reasoning": "Explain why these files were selected for ${level} analysis. Describe what aspects of the system they represent and how they provide the appropriate level of detail."
}
\`\`\`

**Important**: 
- Return ONLY the JSON response, no additional text
- Select 5-15 files for high-level, 15-30 for semi-detailed, 30+ for detailed
- Focus on files marked as 'entry-point' and 'core' for higher priority
- Consider the repository structure and dependencies when making selections`;
    }

    /**
     * Get analysis level specific instructions
     */
    private getLevelInstructions(level: string): string {
        const instructions: { [key: string]: string } = {
            'high-level': `
**HIGH-LEVEL ANALYSIS FOCUS:**
- Select only the most important entry points and core architectural files
- Focus on main application files, key configuration, and primary interfaces
- Aim for a bird's-eye view of the system architecture
- Prioritize files that show the overall system structure and main data flows
- Typical selection: 5-15 files including main entry points, core modules, and key configs`,

            'semi-detailed': `
**SEMI-DETAILED ANALYSIS FOCUS:**
- Include all high-level files plus important implementation details
- Add key business logic modules, important utilities, and interface definitions
- Show component interactions and data flow patterns
- Include files that demonstrate how the system components work together
- Typical selection: 15-30 files covering main architecture plus key implementation files`,

            'detailed': `
**DETAILED ANALYSIS FOCUS:**
- Comprehensive coverage including most relevant source files
- Include utilities, helpers, detailed implementations, and important configurations
- Provide complete picture of system internals and component relationships
- Cover edge cases, error handling, and detailed business logic
- Typical selection: 30+ files for thorough understanding of system implementation`
        };

        return instructions[level] || instructions['high-level'];
    }

    /**
     * Parse LLM response to extract file selections
     */
    private parseFileSelectionResponse(response: string, metadata: Swark4Metadata): {
        selectedFiles: string[];
        reasoning: string;
    } {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                
                // Validate selected files exist in metadata
                const validFiles = parsed.selectedFiles.filter((file: string) => 
                    metadata.fileList.some(f => f.path === file)
                );
                
                return {
                    selectedFiles: validFiles,
                    reasoning: parsed.reasoning || 'LLM file selection completed'
                };
            }
        } catch (error) {
            console.error('Failed to parse LLM response:', error);
        }
        
        // Fallback: try to extract file paths from response
        const fileMatches = response.match(/["']([^"']+\.[a-zA-Z]{1,4})["']/g);
        if (fileMatches) {
            const extractedFiles = fileMatches
                .map(match => match.replace(/["']/g, ''))
                .filter(file => metadata.fileList.some(f => f.path === file));
            
            return {
                selectedFiles: extractedFiles,
                reasoning: 'Extracted files from LLM response using pattern matching'
            };
        }
        
        // Last resort: return empty selection
        return {
            selectedFiles: [],
            reasoning: 'Failed to parse LLM response, using fallback selection'
        };
    }

    /**
     * Calculate total tokens for selected files
     */
    private async calculateSelectedTokens(selectedFiles: string[], metadata: Swark4Metadata): Promise<number> {
        return selectedFiles.reduce((total, filePath) => {
            const file = metadata.fileList.find(f => f.path === filePath);
            return total + (file?.estimatedTokens || 0);
        }, 0);
    }

    /**
     * Fallback file selection when LLM fails
     */
    private fallbackFileSelection(
        metadata: Swark4Metadata, 
        level: 'high-level' | 'semi-detailed' | 'detailed'
    ): AnalysisLevelSelection {
        
        console.log(`Using fallback file selection for ${level}`);
        
        // Sort files by importance
        const sortedFiles = metadata.fileList.sort((a, b) => {
            const importance = { 'entry-point': 4, 'core': 3, 'utility': 2, 'dependency': 1 };
            return importance[b.importance] - importance[a.importance];
        });
        
        let selectedFiles: string[] = [];
        let targetCount = 0;
        
        switch (level) {
            case 'high-level':
                targetCount = 10;
                // Select entry points and top core files
                selectedFiles = sortedFiles
                    .filter(f => f.importance === 'entry-point' || f.importance === 'core')
                    .slice(0, targetCount)
                    .map(f => f.path);
                break;
                
            case 'semi-detailed':
                targetCount = 25;
                // Select entry points, core, and some utilities
                selectedFiles = sortedFiles
                    .filter(f => f.importance !== 'dependency')
                    .slice(0, targetCount)
                    .map(f => f.path);
                break;
                
            case 'detailed':
                targetCount = 50;
                // Select all except dependencies
                selectedFiles = sortedFiles
                    .filter(f => f.importance !== 'dependency')
                    .slice(0, targetCount)
                    .map(f => f.path);
                break;
        }
        
        const actualTokens = selectedFiles.reduce((total, filePath) => {
            const file = metadata.fileList.find(f => f.path === filePath);
            return total + (file?.estimatedTokens || 0);
        }, 0);
        
        return {
            level,
            selectedFiles,
            actualTokens,
            reasoning: `Fallback selection: chose top ${targetCount} files based on importance ranking (${level} analysis)`
        };
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
