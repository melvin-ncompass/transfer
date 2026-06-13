import * as vscode from 'vscode';
import { TokenCounter } from '../types';
import { Swark5FilteredMetadata, AnalysisLevelSelection } from '../commands/create-swark5-architecture';
import { Swark4Metadata } from '../commands/create-swark4-architecture';

/**
 * Swark 5.0: Enhanced LLM-guided intelligent file selection for different analysis levels
 */
export class LLMGuidedFileSelector {
    private model: vscode.LanguageModelChat;
    private tokenCounter: TokenCounter;

    constructor(model: vscode.LanguageModelChat, tokenCounter: TokenCounter) {
        this.model = model;
        this.tokenCounter = tokenCounter;
    }

    /**
     * Select files for all analysis levels using LLM guidance (Updated for Swark 5.0)
     */
    async selectFilesForAllLevels(metadata: Swark5FilteredMetadata | Swark4Metadata): Promise<AnalysisLevelSelection[]> {
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
     * Select files for a specific analysis level (Updated for Swark 5.0)
     */
    private async selectFilesForLevel(
        metadata: Swark5FilteredMetadata | Swark4Metadata, 
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
     * Build file selection prompt for LLM (Updated for Swark 5.0)
     */
    private buildFileSelectionPrompt(metadata: Swark5FilteredMetadata | Swark4Metadata, level: string): string {
        const levelInstructions = this.getLevelInstructions(level);
        
        // Check if this is Swark5 or Swark4 metadata
        const isSwark5 = 'filteredFiles' in metadata;
        const fileList = isSwark5 ? (metadata as Swark5FilteredMetadata).filteredFiles : (metadata as Swark4Metadata).fileList;
        const tokensInfo = isSwark5 ? (metadata as Swark5FilteredMetadata).tokensAfterCleaning : (metadata as Swark4Metadata).worstCaseTokens;
        
        // Use appropriate files
        const fileSummary = fileList
            .slice(0, 100) // Limit to first 100 files to avoid token overflow
            .map((file: any) => {
                if (isSwark5) {
                    return `${file.path} (${file.language}, ${file.importance}, cleaned: ${file.cleanedTokens} tokens)`;
                } else {
                    return `${file.path} (${file.language}, ${file.importance}, ${file.estimatedTokens} tokens)`;
                }
            }).join('\n');

        const versionSpecificInfo = isSwark5 
            ? `- **After Filtering**: ${(metadata as Swark5FilteredMetadata).filteredFiles.length} files
- **Tokens After Cleaning**: ${(metadata as Swark5FilteredMetadata).tokensAfterCleaning}`
            : `- **Worst-case Tokens**: ${(metadata as Swark4Metadata).worstCaseTokens}`;

        return `# Swark ${isSwark5 ? '5.0' : '4.0'}: Intelligent File Selection for ${level.toUpperCase()} Analysis

## Repository Context
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Total Files**: ${metadata.totalFiles}
${versionSpecificInfo}

## Repository Structure Preview
\`\`\`
${metadata.repositoryStructure.split('\n').slice(0, 50).join('\n')}
\`\`\`

## Available ${isSwark5 ? 'Filtered & Cleaned ' : ''}Files (showing first 100)
${fileSummary}

## Analysis Level: ${level.toUpperCase()}
${levelInstructions}

## Your Task
Based on the ${isSwark5 ? '**already filtered and cleaned** ' : ''}files above, intelligently select the most relevant files for a **${level}** analysis.

${isSwark5 ? '**Note**: Files have already been filtered (unnecessary files removed) and cleaned (comments/whitespace stripped), so focus on selecting the right subset for the analysis level.' : ''}

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
- Consider the repository structure and dependencies when making selections${isSwark5 ? '\n- Files are already cleaned, so focus on logical selection rather than content cleanup' : ''}`;
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
     * Parse LLM response to extract file selections (Updated for Swark 5.0)
     */
    private parseFileSelectionResponse(response: string, metadata: Swark5FilteredMetadata | Swark4Metadata): {
        selectedFiles: string[];
        reasoning: string;
    } {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                
                // Validate selected files exist in metadata
                const isSwark5 = 'filteredFiles' in metadata;
                const fileList = isSwark5 ? (metadata as Swark5FilteredMetadata).filteredFiles : (metadata as Swark4Metadata).fileList;
                
                const validFiles = parsed.selectedFiles.filter((file: string) => 
                    fileList.some((f: any) => f.path === file)
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
            const isSwark5 = 'filteredFiles' in metadata;
            const fileList = isSwark5 ? (metadata as Swark5FilteredMetadata).filteredFiles : (metadata as Swark4Metadata).fileList;
            
            const extractedFiles = fileMatches
                .map(match => match.replace(/["']/g, ''))
                .filter(file => fileList.some((f: any) => f.path === file));
            
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
     * Calculate total tokens for selected files (Updated for Swark 5.0)
     */
    private async calculateSelectedTokens(selectedFiles: string[], metadata: Swark5FilteredMetadata | Swark4Metadata): Promise<number> {
        const isSwark5 = 'filteredFiles' in metadata;
        
        return selectedFiles.reduce((total, filePath) => {
            if (isSwark5) {
                const file = (metadata as Swark5FilteredMetadata).filteredFiles.find((f: any) => f.path === filePath);
                return total + (file?.cleanedTokens || 0);
            } else {
                const file = (metadata as Swark4Metadata).fileList.find((f: any) => f.path === filePath);
                return total + (file?.estimatedTokens || 0);
            }
        }, 0);
    }

    /**
     * Fallback file selection when LLM fails (Updated for Swark 5.0)
     */
    private fallbackFileSelection(
        metadata: Swark5FilteredMetadata | Swark4Metadata, 
        level: 'high-level' | 'semi-detailed' | 'detailed'
    ): AnalysisLevelSelection {
        
        console.log(`Using fallback file selection for ${level}`);
        
        const isSwark5 = 'filteredFiles' in metadata;
        const fileList = isSwark5 ? (metadata as Swark5FilteredMetadata).filteredFiles : (metadata as Swark4Metadata).fileList;
        
        // Sort files by importance
        const sortedFiles = fileList.sort((a: any, b: any) => {
            const importance: { [key: string]: number } = { 'entry-point': 4, 'core': 3, 'utility': 2, 'dependency': 1 };
            return importance[b.importance] - importance[a.importance];
        });
        
        let selectedFiles: string[] = [];
        let targetCount = 0;
        
        switch (level) {
            case 'high-level':
                targetCount = 10;
                // Select entry points and top core files
                selectedFiles = sortedFiles
                    .filter((f: any) => f.importance === 'entry-point' || f.importance === 'core')
                    .slice(0, targetCount)
                    .map((f: any) => f.path);
                break;
                
            case 'semi-detailed':
                targetCount = 25;
                // Select entry points, core, and some utilities
                selectedFiles = sortedFiles
                    .filter((f: any) => f.importance !== 'dependency')
                    .slice(0, targetCount)
                    .map((f: any) => f.path);
                break;
                
            case 'detailed':
                targetCount = 50;
                // Select all except dependencies
                selectedFiles = sortedFiles
                    .filter((f: any) => f.importance !== 'dependency')
                    .slice(0, targetCount)
                    .map((f: any) => f.path);
                break;
        }
        
        const actualTokens = selectedFiles.reduce((total, filePath) => {
            if (isSwark5) {
                const file = (metadata as Swark5FilteredMetadata).filteredFiles.find((f: any) => f.path === filePath);
                return total + (file?.cleanedTokens || 0);
            } else {
                const file = (metadata as Swark4Metadata).fileList.find((f: any) => f.path === filePath);
                return total + (file?.estimatedTokens || 0);
            }
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
