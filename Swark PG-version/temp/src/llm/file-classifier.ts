import * as vscode from 'vscode';
import { ModelInteractor } from './model-interactor';
import { Swark55FileInfo } from '../io/swark55-metadata-extractor';

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
    
    public static async classifyFiles(request: FileClassificationRequest): Promise<FileClassificationResponse> {
        const model = await ModelInteractor.getModel();
        
        const prompt = this.buildClassificationPrompt(request);
        const response = await ModelInteractor.sendPrompt(model, [
            vscode.LanguageModelChatMessage.User(prompt)
        ]);
        
        return this.parseClassificationResponse(response, request.files);
    }

    private static buildClassificationPrompt(request: FileClassificationRequest): string {
        const { files, detectedLanguages, dependencyGraph, repositoryContext } = request;

        const dependencyAnalysis = this.analyzeDependencies(dependencyGraph);

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

    private static analyzeDependencies(dependencyGraph: { [filePath: string]: string[] }): string {
        const dependentCounts: { [path: string]: number } = {};

        Object.values(dependencyGraph).forEach(deps => {
            deps.forEach(dep => {
                dependentCounts[dep] = (dependentCounts[dep] || 0) + 1;
            });
        });

        const topDependencies = Object.entries(dependentCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([path, count]) => `- ${path}: ${count} dependents`)
            .join('\n');
            
        return topDependencies || 'No significant dependency relationships found.';
    }

    private static parseClassificationResponse(
        response: string, 
        files: Array<{ relativePath: string }>
    ): FileClassificationResponse {
        try {
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : response;
            
            const parsed = JSON.parse(jsonStr) as FileClassificationResponse;

            const classifiedPaths = new Set(parsed.classifications.map(c => c.relativePath));
            const validImportance = ['critical-entry-point', 'core-module', 'supporting-utility', 'low-priority'];

            for (const file of files) {
                if (!classifiedPaths.has(file.relativePath)) {
                    parsed.classifications.push({
                        relativePath: file.relativePath,
                        importance: 'low-priority',
                        reasoning: 'Default classification for unanalyzed file'
                    });
                }
            }

            parsed.classifications = parsed.classifications.map(c => ({
                ...c,
                importance: validImportance.includes(c.importance) 
                    ? c.importance as any
                    : 'low-priority'
            }));
            
            return parsed;
            
        } catch (error) {

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
