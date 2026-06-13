import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ModelInteractor } from '../llm/model-interactor';

export interface LanguageInfo {
    name: string;
    confidence: number;
    files: string[];
    patterns: {
        include: string[];
        exclude: string[];
    };
    entryPoints: string[];
    configFiles: string[];
    testDirectories: string[];
    buildArtifacts: string[];
}

export interface ProjectStructure {
    type: string; // 'web-app', 'library', 'microservice', 'desktop-app', etc.
    framework: string; // 'react', 'vue', 'angular', 'django', 'spring', etc.
    languages: LanguageInfo[];
    architecture: string; // 'monolith', 'microservices', 'layered', etc.
    buildSystem: string; // 'npm', 'maven', 'gradle', 'cargo', etc.
    confidence: number;
}

export class DynamicLanguageAnalyzer {
    /**
     * Analyze repository to detect languages and project structure
     */
    async analyzeRepository(repositoryPath: string): Promise<ProjectStructure> {
        try {
            // Get repository structure snapshot
            const structureSnapshot = await this.getRepositorySnapshot(repositoryPath);
            
            // Use LLM to analyze the structure
            const analysisPrompt = this.buildAnalysisPrompt(structureSnapshot);
            const model = await ModelInteractor.getModel();
            const prompt = [vscode.LanguageModelChatMessage.User(analysisPrompt)];
            const response = await ModelInteractor.sendPrompt(model, prompt);
            
            // Parse LLM response
            const structure = this.parseStructureResponse(response, repositoryPath);
            
            // Enhance with file-level analysis
            await this.enhanceWithFileAnalysis(structure, repositoryPath);
            
            return structure;
        } catch (error) {
            console.error('Error analyzing repository structure:', error);
            throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get a snapshot of repository structure for LLM analysis
     */
    private async getRepositorySnapshot(repositoryPath: string): Promise<string> {
        const snapshot: string[] = [];
        
        // Get top-level files and directories
        const items = await this.readDirectory(repositoryPath);
        
        for (const item of items.slice(0, 50)) { // Limit to prevent token overflow
            const fullPath = path.join(repositoryPath, item);
            const stats = await fs.promises.stat(fullPath);
            
            if (stats.isDirectory()) {
                snapshot.push(`📁 ${item}/`);
                
                // Sample some files from important directories
                if (this.isImportantDirectory(item)) {
                    const subItems = await this.readDirectory(fullPath);
                    for (const subItem of subItems.slice(0, 10)) {
                        snapshot.push(`  📄 ${subItem}`);
                    }
                }
            } else {
                snapshot.push(`📄 ${item}`);
            }
        }
        
        return snapshot.join('\n');
    }

    /**
     * Build analysis prompt for LLM
     */
    private buildAnalysisPrompt(structureSnapshot: string): string {
        return `Analyze this repository structure and provide a detailed assessment:

REPOSITORY STRUCTURE:
${structureSnapshot}

Please analyze and respond with the following information in JSON format:

{
  "type": "project type (web-app, library, microservice, desktop-app, mobile-app, etc.)",
  "framework": "primary framework or none",
  "architecture": "architecture pattern (monolith, microservices, layered, etc.)",
  "buildSystem": "build system (npm, maven, gradle, cargo, etc.)",
  "confidence": 0.0-1.0,
  "languages": [
    {
      "name": "language name",
      "confidence": 0.0-1.0,
      "patterns": {
        "include": ["patterns for source files"],
        "exclude": ["patterns to exclude"]
      },
      "entryPoints": ["likely entry point files"],
      "configFiles": ["configuration files"],
      "testDirectories": ["test directories"],
      "buildArtifacts": ["build output patterns"]
    }
  ]
}

ANALYSIS GUIDELINES:
1. Identify primary and secondary programming languages
2. Detect framework/library usage patterns
3. Classify project type and architecture
4. Suggest include/exclude patterns for each language
5. Identify entry points, configuration, test, and build files
6. Provide confidence scores for your assessments

Focus on accuracy and provide specific file patterns that would help filter code for analysis.`;
    }

    /**
     * Parse LLM response into structured data
     */
    private parseStructureResponse(response: string, repositoryPath: string): ProjectStructure {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response');
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate and normalize the structure
            return {
                type: parsed.type || 'unknown',
                framework: parsed.framework || 'none',
                languages: parsed.languages || [],
                architecture: parsed.architecture || 'unknown',
                buildSystem: parsed.buildSystem || 'unknown',
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
            };
        } catch (error) {
            console.warn('Failed to parse LLM response, using fallback analysis:', error);
            return this.fallbackAnalysis(repositoryPath);
        }
    }

    /**
     * Enhance structure with actual file analysis
     */
    private async enhanceWithFileAnalysis(structure: ProjectStructure, repositoryPath: string): Promise<void> {
        for (const language of structure.languages) {
            const files = await this.findFilesByLanguage(repositoryPath, language);
            language.files = files;
            
            // Adjust confidence based on actual file findings
            if (files.length === 0) {
                language.confidence *= 0.3;
            } else if (files.length > 10) {
                language.confidence = Math.min(1.0, language.confidence * 1.2);
            }
        }
        
        // Sort languages by confidence
        structure.languages.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Find files matching language patterns
     */
    private async findFilesByLanguage(repositoryPath: string, language: LanguageInfo): Promise<string[]> {
        const files: string[] = [];
        
        const scanDirectory = async (dir: string, depth = 0): Promise<void> => {
            if (depth > 5) return; // Prevent deep recursion
            
            try {
                const items = await this.readDirectory(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const relativePath = path.relative(repositoryPath, fullPath);
                    const stats = await fs.promises.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        // Skip excluded directories
                        if (!this.isExcludedPath(relativePath, language.patterns.exclude)) {
                            await scanDirectory(fullPath, depth + 1);
                        }
                    } else {
                        // Check if file matches include patterns and not exclude patterns
                        if (this.matchesPatterns(relativePath, language.patterns.include) &&
                            !this.isExcludedPath(relativePath, language.patterns.exclude)) {
                            files.push(relativePath);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error scanning directory ${dir}:`, error);
            }
        };
        
        await scanDirectory(repositoryPath);
        return files;
    }

    /**
     * Fallback analysis when LLM fails
     */
    private fallbackAnalysis(repositoryPath: string): ProjectStructure {
        return {
            type: 'unknown',
            framework: 'none',
            architecture: 'unknown',
            buildSystem: 'unknown',
            confidence: 0.3,
            languages: [
                {
                    name: 'JavaScript',
                    confidence: 0.5,
                    files: [],
                    patterns: {
                        include: ['**/*.js', '**/*.jsx'],
                        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**']
                    },
                    entryPoints: ['index.js', 'main.js', 'app.js'],
                    configFiles: ['package.json', 'webpack.config.js'],
                    testDirectories: ['test/', 'tests/', '__tests__/'],
                    buildArtifacts: ['dist/', 'build/', 'out/']
                },
                {
                    name: 'TypeScript',
                    confidence: 0.5,
                    files: [],
                    patterns: {
                        include: ['**/*.ts', '**/*.tsx'],
                        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**']
                    },
                    entryPoints: ['index.ts', 'main.ts', 'app.ts'],
                    configFiles: ['tsconfig.json', 'package.json'],
                    testDirectories: ['test/', 'tests/', '__tests__/'],
                    buildArtifacts: ['dist/', 'build/', 'out/']
                }
            ]
        };
    }

    /**
     * Helper methods
     */
    private async readDirectory(dirPath: string): Promise<string[]> {
        try {
            return await fs.promises.readdir(dirPath);
        } catch (error) {
            console.warn(`Cannot read directory ${dirPath}:`, error);
            return [];
        }
    }

    private isImportantDirectory(name: string): boolean {
        const important = ['src', 'lib', 'app', 'components', 'modules', 'pages', 'routes', 'api', 'services'];
        return important.includes(name.toLowerCase());
    }

    private matchesPatterns(filePath: string, patterns: string[]): boolean {
        return patterns.some(pattern => {
            const regex = this.globToRegex(pattern);
            return regex.test(filePath);
        });
    }

    private isExcludedPath(filePath: string, excludePatterns: string[]): boolean {
        return excludePatterns.some(pattern => {
            const regex = this.globToRegex(pattern);
            return regex.test(filePath);
        });
    }

    private globToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
        return new RegExp(`^${escaped}$`, 'i');
    }

    /**
     * Static utility methods for Swark 5.5
     */
    public static async detectLanguages(filePaths: string[]): Promise<string[]> {
        const languageMap = new Map<string, number>();
        
        for (const filePath of filePaths) {
            const ext = path.extname(filePath).toLowerCase();
            const language = this.getLanguageFromExtension(ext);
            if (language) {
                languageMap.set(language, (languageMap.get(language) || 0) + 1);
            }
        }
        
        // Return languages sorted by frequency
        return Array.from(languageMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang);
    }
    
    public static detectFileLanguage(relativePath: string, detectedLanguages: string[]): string {
        const ext = path.extname(relativePath).toLowerCase();
        const language = this.getLanguageFromExtension(ext);
        
        if (language && detectedLanguages.includes(language)) {
            return language;
        }
        
        // Fallback to most common detected language or 'unknown'
        return detectedLanguages[0] || 'unknown';
    }
    
    private static getLanguageFromExtension(ext: string): string | null {
        const extensionMap: { [key: string]: string } = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.mjs': 'javascript',
            '.cjs': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.pyw': 'python',
            '.java': 'java',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.cpp': 'cpp',
            '.cxx': 'cpp',
            '.cc': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.clj': 'clojure',
            '.hs': 'haskell',
            '.ml': 'ocaml',
            '.fs': 'fsharp',
            '.vb': 'vbnet',
            '.dart': 'dart',
            '.r': 'r',
            '.m': 'matlab',
            '.sh': 'shell',
            '.bash': 'shell',
            '.zsh': 'shell',
            '.fish': 'shell',
            '.ps1': 'powershell',
            '.sql': 'sql',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.json': 'json',
            '.xml': 'xml',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.vue': 'vue',
            '.svelte': 'svelte'
        };
        
        return extensionMap[ext] || null;
    }
}
