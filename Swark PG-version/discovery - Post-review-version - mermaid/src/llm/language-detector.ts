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
    /**
     * Detect languages using LLM analysis of file patterns
     */
    public static async detectLanguages(filePaths: string[]): Promise<string[]> {
        try {
            // Sample files for analysis (limit to avoid token overflow)
            const sampleFiles = this.getSampleFiles(filePaths);
            
            const model = await ModelInteractor.getModel();
            const prompt = this.buildLanguageDetectionPrompt(sampleFiles);
            
            const response = await ModelInteractor.sendPrompt(model, [
                vscode.LanguageModelChatMessage.User(prompt)
            ]);
            
            const languages = this.parseLanguageResponse(response);
            
            // Fallback to extension-based detection if LLM fails
            if (languages.length === 0) {
                return this.fallbackLanguageDetection(filePaths);
            }
            
            return languages;
            
        } catch (error) {
            console.warn('LLM language detection failed, using fallback:', error);
            return this.fallbackLanguageDetection(filePaths);
        }
    }
    
    /**
     * Detect file language using LLM or fallback patterns
     */
    public static detectFileLanguage(relativePath: string, detectedLanguages: string[]): string {
        const extension = path.extname(relativePath).toLowerCase();
        const fileName = path.basename(relativePath);
        
        // Quick extension mapping for common cases
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
        
        // Framework-specific detection
        if (fileName.includes('component') && extension === '.ts') return 'angular';
        if (fileName.includes('service') && extension === '.ts') return 'angular';
        if (relativePath.includes('angular')) return 'angular';
        
        // Use primary detected language as fallback
        if (detectedLanguages.length > 0) {
            return detectedLanguages[0];
        }
        
        return quickLanguage || 'text';
    }
    
    /**
     * Build comprehensive language detection prompt
     */
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
    
    /**
     * Get representative sample of files for analysis
     */
    private static getSampleFiles(filePaths: string[]): string[] {
        // Prioritize important files and get diverse sample
        const prioritized = filePaths
            .filter(f => !f.includes('node_modules') && !f.includes('.git'))
            .sort((a, b) => {
                // Prioritize source files over others
                const aScore = this.getFilePriority(a);
                const bScore = this.getFilePriority(b);
                return bScore - aScore;
            });
            
        // Take up to 100 most representative files
        return prioritized.slice(0, 100);
    }
    
    /**
     * Calculate file priority for sampling
     */
    private static getFilePriority(filePath: string): number {
        const path = filePath.toLowerCase();
        let score = 0;
        
        // Boost source directories
        if (path.includes('/src/') || path.includes('/lib/') || path.includes('/app/')) score += 10;
        
        // Boost entry points
        if (path.includes('main.') || path.includes('index.') || path.includes('app.')) score += 8;
        
        // Boost config files
        if (path.includes('package.json') || path.includes('tsconfig') || path.includes('webpack')) score += 6;
        
        // Boost common extensions
        const ext = path.split('.').pop() || '';
        const importantExts = ['js', 'ts', 'py', 'java', 'go', 'rs', 'vue', 'jsx', 'tsx'];
        if (importantExts.includes(ext)) score += 5;
        
        // Penalize test files, build artifacts
        if (path.includes('test') || path.includes('spec') || path.includes('dist') || path.includes('build')) score -= 3;
        
        return score;
    }
    
    /**
     * Parse LLM response for detected languages
     */
    private static parseLanguageResponse(response: string): string[] {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : response;
            const parsed = JSON.parse(jsonStr);
            
            const languages = [...(parsed.languages || [])];
            
            // Include frameworks as languages for our purposes
            if (parsed.frameworks) {
                languages.push(...parsed.frameworks);
            }
            
            return languages.filter((lang, index, self) => 
                lang && typeof lang === 'string' && self.indexOf(lang) === index
            );
            
        } catch (error) {
            console.warn('Failed to parse language detection response:', error);
            return [];
        }
    }
    
    /**
     * Fallback language detection using file extensions
     */
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
        
        // Count file extensions
        for (const filePath of filePaths) {
            const ext = path.extname(filePath).toLowerCase();
            const language = extensionMap[ext];
            if (language) {
                extensionCounts[language] = (extensionCounts[language] || 0) + 1;
            }
        }
        
        // Return languages with significant file counts
        return Object.entries(extensionCounts)
            .filter(([lang, count]) => count >= 2)
            .sort(([,a], [,b]) => b - a)
            .map(([lang]) => lang);
    }
}
