import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ModelInteractor } from '../llm/model-interactor';

export interface EnhancedLanguageInfo {
    name: string;
    confidence: number;
    files: string[];
    extensions: string[];
    entryPoints: string[];
    keyPatterns: string[];
    frameworkIndicators: string[];
}

export class LLMLanguageDetector {
    
    public static async detectLanguages(filePaths: string[]): Promise<string[]> {
        try {
            
            const sampleFiles = this.getSampleFiles(filePaths);
            
            const model = await ModelInteractor.getModel();
            const prompt = this.buildLanguageDetectionPrompt(sampleFiles);
            
            const response = await ModelInteractor.sendPrompt(model, [
                vscode.LanguageModelChatMessage.User(prompt)
            ]);
            
            const languages = this.parseLanguageResponse(response);

            if (languages.length === 0) {
                return this.fallbackLanguageDetection(filePaths);
            }
            
            return languages;
            
        } catch (error) {
            
            return this.fallbackLanguageDetection(filePaths);
        }
    }

    public static detectFileLanguage(relativePath: string, detectedLanguages: string[]): string {
        const extension = path.extname(relativePath).toLowerCase();
        const fileName = path.basename(relativePath);

        const quickMap: { [ext: string]: string } = {
            '.js': 'javascript',
            '.jsx': 'react',
            '.ts': 'typescript', 
            '.tsx': 'react',
            '.vue': 'vue',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.sh': 'shell',
            '.sql': 'sql'
        };
        
        const quickLanguage = quickMap[extension];
        if (quickLanguage && detectedLanguages.includes(quickLanguage)) {
            return quickLanguage;
        }

        if (fileName.includes('component') && extension === '.ts') return 'angular';
        if (fileName.includes('service') && extension === '.ts') return 'angular';
        if (relativePath.includes('angular')) return 'angular';

        if (detectedLanguages.length > 0) {
            return detectedLanguages[0];
        }
        
        return quickLanguage || 'text';
    }

    private static buildLanguageDetectionPrompt(sampleFiles: string[]): string {
        return `You are an expert software engineer analyzing a codebase to detect programming languages and frameworks.

**File Analysis:**
Analyze these file paths and extensions to identify all programming languages and frameworks used:

${sampleFiles.join('\n')}

**Detection Task:**
1. Identify ALL programming languages present (not just the primary one)
2. Detect frameworks (React, Vue, Angular, Django, Spring, etc.)
3. Consider file extensions, directory structures, and naming patterns
4. Include markup languages (HTML, XML), styling (CSS, SCSS), config (JSON, YAML)

**Output Format (JSON only):**
{
  "languages": [
    "javascript",
    "typescript", 
    "python",
    "html",
    "css"
  ],
  "frameworks": [
    "react",
    "vue", 
    "angular"
  ],
  "confidence": 0.95
}

**Language Categories to Consider:**
- Programming: javascript, typescript, python, java, go, rust, php, ruby, csharp, cpp, c
- Web: html, css, scss, sass, less
- Frameworks: react, vue, angular, svelte, django, flask, spring, laravel
- Data: json, yaml, xml, sql, graphql
- Markup: markdown, rst
- Shell: bash, powershell, shell
- Other: dockerfile, makefile

Respond with ONLY the JSON object, no additional text.`;
    }

    private static getSampleFiles(filePaths: string[]): string[] {
        
        const prioritized = filePaths
            .filter(f => !f.includes('node_modules') && !f.includes('.git'))
            .sort((a, b) => {
                
                const aScore = this.getFilePriority(a);
                const bScore = this.getFilePriority(b);
                return bScore - aScore;
            });

        return prioritized.slice(0, 100);
    }

    private static getFilePriority(filePath: string): number {
        const path = filePath.toLowerCase();
        let score = 0;

        if (path.includes('/src/') || path.includes('/lib/') || path.includes('/app/')) score += 10;

        if (path.includes('main.') || path.includes('index.') || path.includes('app.')) score += 8;

        if (path.includes('package.json') || path.includes('tsconfig') || path.includes('webpack')) score += 6;

        const ext = path.split('.').pop() || '';
        const importantExts = ['js', 'ts', 'py', 'java', 'go', 'rs', 'vue', 'jsx', 'tsx'];
        if (importantExts.includes(ext)) score += 5;

        if (path.includes('test') || path.includes('spec') || path.includes('dist') || path.includes('build')) score -= 3;
        
        return score;
    }

    private static parseLanguageResponse(response: string): string[] {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : response;
            const parsed = JSON.parse(jsonStr);
            
            const languages = [...(parsed.languages || [])];

            if (parsed.frameworks) {
                languages.push(...parsed.frameworks);
            }
            
            return languages.filter((lang, index, self) => 
                lang && typeof lang === 'string' && self.indexOf(lang) === index
            );
            
        } catch (error) {
            
            return [];
        }
    }

    private static fallbackLanguageDetection(filePaths: string[]): string[] {
        const extensionCounts: { [lang: string]: number } = {};
        
        const extensionMap: { [ext: string]: string } = {
            '.js': 'javascript',
            '.jsx': 'react', 
            '.mjs': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'react',
            '.vue': 'vue',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'scss',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.sh': 'shell',
            '.sql': 'sql'
        };

        for (const filePath of filePaths) {
            const ext = path.extname(filePath).toLowerCase();
            const language = extensionMap[ext];
            if (language) {
                extensionCounts[language] = (extensionCounts[language] || 0) + 1;
            }
        }

        return Object.entries(extensionCounts)
            .filter(([lang, count]) => count >= 2)
            .sort(([,a], [,b]) => b - a)
            .map(([lang]) => lang);
    }
}
