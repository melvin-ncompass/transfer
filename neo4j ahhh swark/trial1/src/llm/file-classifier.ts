import * as vscode from 'vscode';
import { ModelInteractor } from './model-interactor';

// Simple file info interface to replace the deleted Swark55FileInfo
interface FileInfo {
    relativePath: string;
    size: number;
    language?: string;
}

export interface FileClassificationRequest {
    files: Array<{
        path: string;
        relativePath: string;
        size: number;
        language: string;
    }>;
    detectedLanguages: string[];
    dependencyGraph: { [filePath: string]: string[] };
    repositoryContext: string;
}

export interface FileClassificationResponse {
    classifications: Array<{
        relativePath: string;
        importance: 'critical-entry-point' | 'core-module' | 'supporting-utility' | 'low-priority';
        reasoning: string;
    }>;
}

export class LLMFileClassifier {
    /**
     * Classify file importance using LLM analysis
     */
    public static async classifyFiles(request: FileClassificationRequest): Promise<FileClassificationResponse> {
        const model = await ModelInteractor.getModel();
        
        const prompt = this.buildClassificationPrompt(request);
        const response = await ModelInteractor.sendPrompt(model, [
            vscode.LanguageModelChatMessage.User(prompt)
        ]);
        
        return this.parseClassificationResponse(response, request.files);
    }
    
    /**
     * Build comprehensive classification prompt
     */
    private static buildClassificationPrompt(request: FileClassificationRequest): string {
        const { files, detectedLanguages, dependencyGraph, repositoryContext } = request;
        
        // Create dependency analysis
        const dependencyAnalysis = this.analyzeDependencies(dependencyGraph);
        
        // Sample important files for context
        const sampleFiles = files.slice(0, 20).map(f => 
            `- ${f.relativePath} (${f.language}, ${f.size} bytes)`
        ).join('\n');
        
        return `You are an expert software architect analyzing a ${detectedLanguages.join('/')} codebase to classify file importance for architectural diagram generation.

**Repository Context:**
${repositoryContext}

**Detected Languages:** ${detectedLanguages.join(', ')}

**Sample Files:**
${sampleFiles}

**Dependency Analysis:**
${dependencyAnalysis}

**Classification Task:**
Classify each file into one of these importance levels:

1. **critical-entry-point**: Main entry points, application bootstrapping files, primary executable files
2. **core-module**: Core business logic, main libraries, essential components, central services
3. **supporting-utility**: Helper functions, utilities, middleware, configuration files, minor components
4. **low-priority**: Tests, documentation, build configs, temporary files, minor assets

**Analysis Guidelines:**
- Consider language-specific patterns (e.g., main.py for Python, index.js for Node.js, App.vue for Vue)
- Analyze file names, directory structures, and file sizes
- Use dependency relationships (files with many dependents are likely core)
- Consider framework conventions (e.g., components/ for React/Vue, services/ for Angular)
- Prioritize files in src/, lib/, app/ directories over root-level files
- Entry points are typically named main.*, index.*, app.*, or similar
- Core modules often contain "service", "controller", "model", "api", "engine" in their paths

**Required Output Format (JSON only):**
{
  "classifications": [
    {
      "relativePath": "src/main.ts",
      "importance": "critical-entry-point",
      "reasoning": "Main application entry point"
    }
  ]
}

**Files to Classify:**
${files.map(f => `${f.relativePath} (${f.language}, ${f.size} bytes)`).join('\n')}

Respond with ONLY the JSON object, no additional text.`;
    }
    
    /**
     * Analyze dependency relationships
     */
    private static analyzeDependencies(dependencyGraph: { [filePath: string]: string[] }): string {
        const dependentCounts: { [path: string]: number } = {};
        
        // Count how many files depend on each file
        Object.values(dependencyGraph).forEach(deps => {
            deps.forEach(dep => {
                dependentCounts[dep] = (dependentCounts[dep] || 0) + 1;
            });
        });
        
        // Get top dependencies
        const topDependencies = Object.entries(dependentCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([path, count]) => `- ${path}: ${count} dependents`)
            .join('\n');
            
        return topDependencies || 'No significant dependency relationships found.';
    }
    
    /**
     * Parse LLM response and validate classifications
     */
    private static parseClassificationResponse(
        response: string, 
        files: Array<{ relativePath: string }>
    ): FileClassificationResponse {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : response;
            
            const parsed = JSON.parse(jsonStr) as FileClassificationResponse;
            
            // Validate and ensure all files are classified
            const classifiedPaths = new Set(parsed.classifications.map(c => c.relativePath));
            const validImportance = ['critical-entry-point', 'core-module', 'supporting-utility', 'low-priority'];
            
            // Add missing files with default classification
            for (const file of files) {
                if (!classifiedPaths.has(file.relativePath)) {
                    parsed.classifications.push({
                        relativePath: file.relativePath,
                        importance: 'low-priority',
                        reasoning: 'Default classification for unanalyzed file'
                    });
                }
            }
            
            // Validate importance levels
            parsed.classifications = parsed.classifications.map(c => ({
                ...c,
                importance: validImportance.includes(c.importance) 
                    ? c.importance as any
                    : 'low-priority'
            }));
            
            return parsed;
            
        } catch (error) {
            console.warn('Failed to parse LLM classification response:', error);
            
            // Fallback: classify all files as low-priority
            return {
                classifications: files.map(f => ({
                    relativePath: f.relativePath,
                    importance: 'low-priority',
                    reasoning: 'Fallback classification due to parsing error'
                }))
            };
        }
    }
}
