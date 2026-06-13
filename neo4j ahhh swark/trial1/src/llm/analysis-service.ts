import * as vscode from 'vscode';
import { ModelInteractor } from './model-interactor';
import { FileSystemNode } from '../io/filesystem-traverser';

export interface LLMAnalysisResult {
    languages: string[];
    ignorable: string[];
    analyzable: string[];
}

export interface FunctionSummaryRequest {
    name: string;
    filePath: string;
    code: string;
    dependencies: string[];
    usedBy: string[];
}

export class LLMAnalysisService {
    private maxTokenSize = 30000;

    constructor() {
    }

    /**
     * Step 2: Build prompt for LLM to analyze file system
     * Step 3: Estimate token size
     * Step 4: Submit to LLM if within limits
     */
    async analyzeFileSystem(fileSystemJSON: FileSystemNode): Promise<LLMAnalysisResult> {
        const prompt = this.buildFileSystemAnalysisPrompt(fileSystemJSON);
        
        // Step 3: Check token size
        const estimatedTokens = this.estimateTokens(prompt);
        console.log(`Estimated tokens: ${estimatedTokens}`);
        
        if (estimatedTokens > this.maxTokenSize) {
            throw new Error(`Prompt too large: ${estimatedTokens} tokens exceeds limit of ${this.maxTokenSize}`);
        }

        // Step 4: Submit to LLM
        try {
            const model = await ModelInteractor.getModel();
            const messages = [vscode.LanguageModelChatMessage.User(prompt)];
            const response = await ModelInteractor.sendPrompt(model, messages);
            return this.parseAnalysisResponse(response);
        } catch (error) {
            console.error('LLM analysis failed:', error);
            throw new Error(`LLM analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Step 7A3: LLM call for function summarization
     */
    async summarizeFunction(functionData: FunctionSummaryRequest): Promise<string> {
        const prompt = this.buildFunctionSummaryPrompt(functionData);
        
        try {
            const model = await ModelInteractor.getModel();
            const messages = [vscode.LanguageModelChatMessage.User(prompt)];
            const response = await ModelInteractor.sendPrompt(model, messages);
            return response.trim();
        } catch (error) {
            console.error('Function summary failed:', error);
            throw new Error(`Function summary failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Step 2A-2C: Build the file system analysis prompt
     */
    private buildFileSystemAnalysisPrompt(fileSystemJSON: FileSystemNode): string {
        return `You are a system architect. I want you to study the file system provided as a JSON object.

JSON Object:
${JSON.stringify(fileSystemJSON, null, 2)}

Based on your study, let me know:
1. What are all the programming languages present in this file system
2. To construct a mindmap at a detailed level, what files and folders can be safely ignored (if in doubt, include it)
3. List the files that should NOT be ignored for code analysis

Please respond in this exact JSON format:
{
    "languages": ["language1", "language2"],
    "ignorable": ["/absolute/path/to/ignore1", "/absolute/path/to/ignore2"],
    "analyzable": ["/absolute/path/to/analyze1", "/absolute/path/to/analyze2"]
}

Important: 
- Only include actual programming language files in analyzable (not config files, docs, etc.)
- Use absolute paths exactly as they appear in the JSON
- Include common ignorable items like build outputs, dependencies, logs, cache directories`;
    }

    private buildFunctionSummaryPrompt(functionData: FunctionSummaryRequest): string {
        return `Analyze this function and provide a concise summary:

Function: ${functionData.name}
File: ${functionData.filePath}
Dependencies: ${functionData.dependencies.join(', ') || 'None'}
Used by: ${functionData.usedBy.join(', ') || 'None'}

Code:
${functionData.code}

Provide a concise summary (2-3 sentences) of what this function does and its role in the codebase.`;
    }

    /**
     * Step 3: Estimate token count (rough approximation)
     */
    private estimateTokens(text: string): number {
        // Rough estimation: ~4 characters per token for English text
        return Math.ceil(text.length / 4);
    }

    private parseAnalysisResponse(response: string): LLMAnalysisResult {
        try {
            // Clean the response - remove any markdown formatting
            const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanResponse);
            
            // Validate the response structure
            if (!parsed.languages || !Array.isArray(parsed.languages)) {
                throw new Error('Invalid response: missing or invalid languages array');
            }
            if (!parsed.ignorable || !Array.isArray(parsed.ignorable)) {
                throw new Error('Invalid response: missing or invalid ignorable array');
            }
            if (!parsed.analyzable || !Array.isArray(parsed.analyzable)) {
                throw new Error('Invalid response: missing or invalid analyzable array');
            }

            return {
                languages: parsed.languages,
                ignorable: parsed.ignorable,
                analyzable: parsed.analyzable
            };
        } catch (error) {
            console.error('Failed to parse LLM response:', response);
            throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
