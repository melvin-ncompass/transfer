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
    type: string; 
    framework: string; 
    languages: LanguageInfo[];
    architecture: string; 
    buildSystem: string; 
    confidence: number;
}

export class DynamicLanguageAnalyzer {
    
    async analyzeRepository(repositoryPath: string): Promise<ProjectStructure> {
        try {
            
            const structureSnapshot = await this.getRepositorySnapshot(repositoryPath);

            const analysisPrompt = this.buildAnalysisPrompt(structureSnapshot);
            const model = await ModelInteractor.getModel();
            const prompt = [vscode.LanguageModelChatMessage.User(analysisPrompt)];
            const response = await ModelInteractor.sendPrompt(model, prompt);

            const structure = this.parseStructureResponse(response, repositoryPath);

            await this.enhanceWithFileAnalysis(structure, repositoryPath);
            
            return structure;
        } catch (error) {
            
            throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async getRepositorySnapshot(repositoryPath: string): Promise<string> {
        const snapshot: string[] = [];

        const items = await this.readDirectory(repositoryPath);
        
        for (const item of items.slice(0, 50)) { 
            const fullPath = path.join(repositoryPath, item);
            const stats = await fs.promises.stat(fullPath);
            
            if (stats.isDirectory()) {
                snapshot.push(`📁 ${item}/`);

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

    private parseStructureResponse(response: string, repositoryPath: string): ProjectStructure {
        try {
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response');
            }
            
            const parsed = JSON.parse(jsonMatch[0]);

            return {
                type: parsed.type || 'unknown',
                framework: parsed.framework || 'none',
                languages: parsed.languages || [],
                architecture: parsed.architecture || 'unknown',
                buildSystem: parsed.buildSystem || 'unknown',
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
            };
        } catch (error) {
            
            return this.fallbackAnalysis(repositoryPath);
        }
    }

    private async enhanceWithFileAnalysis(structure: ProjectStructure, repositoryPath: string): Promise<void> {
        for (const language of structure.languages) {
            const files = await this.findFilesByLanguage(repositoryPath, language);
            language.files = files;

            if (files.length === 0) {
                language.confidence *= 0.3;
            } else if (files.length > 10) {
                language.confidence = Math.min(1.0, language.confidence * 1.2);
            }
        }

        structure.languages.sort((a, b) => b.confidence - a.confidence);
    }

    private async findFilesByLanguage(repositoryPath: string, language: LanguageInfo): Promise<string[]> {
        const files: string[] = [];
        
        const scanDirectory = async (dir: string, depth = 0): Promise<void> => {
            if (depth > 5) return; 
            
            try {
                const items = await this.readDirectory(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const relativePath = path.relative(repositoryPath, fullPath);
                    const stats = await fs.promises.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        
                        if (!this.isExcludedPath(relativePath, language.patterns.exclude)) {
                            await scanDirectory(fullPath, depth + 1);
                        }
                    } else {
                        
                        if (this.matchesPatterns(relativePath, language.patterns.include) &&
                            !this.isExcludedPath(relativePath, language.patterns.exclude)) {
                            files.push(relativePath);
                        }
                    }
                }
            } catch (error) {
                
            }
        };
        
        await scanDirectory(repositoryPath);
        return files;
    }

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
                        include: ['***.jsx'],
                        exclude: ['**/node_modulesdistbuild*.ts', '**node_modulesdistbuild
    private async readDirectory(dirPath: string): Promise<string[]> {
        try {
            return await fs.promises.readdir(dirPath);
        } catch (error) {
            
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

    public static async detectLanguages(filePaths: string[]): Promise<string[]> {
        const languageMap = new Map<string, number>();
        
        for (const filePath of filePaths) {
            const ext = path.extname(filePath).toLowerCase();
            const language = this.getLanguageFromExtension(ext);
            if (language) {
                languageMap.set(language, (languageMap.get(language) || 0) + 1);
            }
        }

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
