import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TokenCounter } from '../types';

export interface RepositoryMetadata {
    repositoryPath: string;
    commitHash?: string;
    totalFiles: number;
    totalLines: number;
    estimatedTokens: number;
    fileSizeDistribution: {
        small: number;    // < 1KB
        medium: number;   // 1KB - 10KB
        large: number;    // 10KB - 100KB
        extraLarge: number; // > 100KB
    };
    languageDistribution: { [language: string]: number };
    dependencyComplexity: number;
    chunkingRequired: boolean;
    estimatedChunks: number;
}

export interface FileAnalysisResult {
    filePath: string;
    language: string;
    lines: number;
    tokens: number;
    dependencies: string[];
    size: number;
}

export class RepositoryMetadataAnalyzer {
    private tokenCounter: TokenCounter;
    private includeExtensions: string[];
    private excludePatterns: string[];

    constructor(tokenCounter: TokenCounter, includeExtensions: string[], excludePatterns: string[]) {
        this.tokenCounter = tokenCounter;
        this.includeExtensions = includeExtensions;
        this.excludePatterns = excludePatterns;
    }

    /**
     * Step 1: Scan repository and calculate metadata
     */
    public async analyzeRepository(
        repositoryPath: string, 
        commitHash?: string,
        maxTokens: number = 200000
    ): Promise<RepositoryMetadata> {
        
        console.log(`🔍 Scanning repository: ${repositoryPath}`);
        if (commitHash) {
            console.log(`📝 Target commit: ${commitHash}`);
        }

        // Get all relevant files
        const files = await this.getRelevantFiles(repositoryPath);
        console.log(`📁 Found ${files.length} relevant files`);

        // Analyze each file
        const fileAnalysis = await this.analyzeFiles(files);
        
        // Calculate metadata
        const metadata = this.calculateMetadata(
            repositoryPath, 
            commitHash, 
            fileAnalysis, 
            maxTokens
        );

        console.log(`📊 Repository analysis complete:`);
        console.log(`  - Total files: ${metadata.totalFiles}`);
        console.log(`  - Total lines: ${metadata.totalLines}`);
        console.log(`  - Estimated tokens: ${metadata.estimatedTokens}`);
        console.log(`  - Chunking required: ${metadata.chunkingRequired}`);
        if (metadata.chunkingRequired) {
            console.log(`  - Estimated chunks: ${metadata.estimatedChunks}`);
        }

        return metadata;
    }

    /**
     * Get all files that should be included in analysis
     */
    private async getRelevantFiles(repositoryPath: string): Promise<string[]> {
        const allFiles: string[] = [];
        
        const scanDirectory = (dirPath: string) => {
            try {
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    const relativePath = path.relative(repositoryPath, fullPath);
                    
                    // Check exclude patterns
                    if (this.shouldExclude(relativePath)) {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).substring(1).toLowerCase();
                        if (this.includeExtensions.includes(ext)) {
                            allFiles.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not scan directory ${dirPath}:`, error);
            }
        };

        scanDirectory(repositoryPath);
        return allFiles;
    }

    /**
     * Check if a file should be excluded based on patterns
     */
    private shouldExclude(relativePath: string): boolean {
        return this.excludePatterns.some(pattern => {
            // Simple glob-like matching
            const regex = new RegExp(
                pattern
                    .replace(/\*\*/g, '.*')
                    .replace(/\*/g, '[^/]*')
                    .replace(/\?/g, '[^/]')
            );
            return regex.test(relativePath);
        });
    }

    /**
     * Analyze individual files for metadata
     */
    private async analyzeFiles(filePaths: string[]): Promise<FileAnalysisResult[]> {
        const results: FileAnalysisResult[] = [];
        
        for (const filePath of filePaths) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n').length;
                const tokens = await this.tokenCounter(content);
                const size = fs.statSync(filePath).size;
                const language = this.detectLanguage(filePath);
                const dependencies = this.extractDependencies(content, language);
                
                results.push({
                    filePath,
                    language,
                    lines,
                    tokens,
                    dependencies,
                    size
                });
            } catch (error) {
                console.warn(`Warning: Could not analyze file ${filePath}:`, error);
            }
        }
        
        return results;
    }

    /**
     * Detect programming language from file extension
     */
    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).substring(1).toLowerCase();
        const languageMap: { [key: string]: string } = {
            'ts': 'TypeScript',
            'tsx': 'TypeScript',
            'js': 'JavaScript',
            'jsx': 'JavaScript',
            'py': 'Python',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'cc': 'C++',
            'cxx': 'C++',
            'h': 'C/C++',
            'hpp': 'C++',
            'go': 'Go',
            'rs': 'Rust',
            'php': 'PHP',
            'rb': 'Ruby',
            'cs': 'C#',
            'swift': 'Swift',
            'kt': 'Kotlin',
            'scala': 'Scala',
            'clj': 'Clojure'
        };
        
        return languageMap[ext] || 'Unknown';
    }

    /**
     * Extract dependencies from file content (simplified)
     */
    private extractDependencies(content: string, language: string): string[] {
        const dependencies: string[] = [];
        
        try {
            switch (language) {
                case 'TypeScript':
                case 'JavaScript':
                    // Match import statements
                    const importMatches = content.match(/import.*?from\s+['"]([^'"]+)['"]/g);
                    if (importMatches) {
                        importMatches.forEach(match => {
                            const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
                            if (depMatch) {
                                dependencies.push(depMatch[1]);
                            }
                        });
                    }
                    break;
                    
                case 'Python':
                    // Match import statements
                    const pythonImports = content.match(/(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
                    if (pythonImports) {
                        pythonImports.forEach(match => {
                            const depMatch = match.match(/(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                            if (depMatch) {
                                dependencies.push(depMatch[1]);
                            }
                        });
                    }
                    break;
                    
                case 'Java':
                    // Match import statements
                    const javaImports = content.match(/import\s+([a-zA-Z_][a-zA-Z0-9_.]*);/g);
                    if (javaImports) {
                        javaImports.forEach(match => {
                            const depMatch = match.match(/import\s+([a-zA-Z_][a-zA-Z0-9_.]*);/);
                            if (depMatch) {
                                dependencies.push(depMatch[1]);
                            }
                        });
                    }
                    break;
            }
        } catch (error) {
            // Ignore parsing errors
        }
        
        return dependencies;
    }

    /**
     * Calculate comprehensive repository metadata
     */
    private calculateMetadata(
        repositoryPath: string,
        commitHash: string | undefined,
        fileAnalysis: FileAnalysisResult[],
        maxTokens: number
    ): RepositoryMetadata {
        
        // Basic statistics
        const totalFiles = fileAnalysis.length;
        const totalLines = fileAnalysis.reduce((sum, file) => sum + file.lines, 0);
        const estimatedTokens = fileAnalysis.reduce((sum, file) => sum + file.tokens, 0);
        
        // File size distribution
        const fileSizeDistribution = {
            small: 0,
            medium: 0,
            large: 0,
            extraLarge: 0
        };
        
        fileAnalysis.forEach(file => {
            if (file.size < 1024) {
                fileSizeDistribution.small++;
            } else if (file.size < 10240) {
                fileSizeDistribution.medium++;
            } else if (file.size < 102400) {
                fileSizeDistribution.large++;
            } else {
                fileSizeDistribution.extraLarge++;
            }
        });
        
        // Language distribution
        const languageDistribution: { [language: string]: number } = {};
        fileAnalysis.forEach(file => {
            languageDistribution[file.language] = (languageDistribution[file.language] || 0) + 1;
        });
        
        // Dependency complexity (average dependencies per file)
        const totalDependencies = fileAnalysis.reduce((sum, file) => sum + file.dependencies.length, 0);
        const dependencyComplexity = totalFiles > 0 ? totalDependencies / totalFiles : 0;
        
        // Chunking analysis
        const chunkingRequired = estimatedTokens > maxTokens * 0.8; // 80% threshold
        const estimatedChunks = chunkingRequired ? Math.ceil(estimatedTokens / (maxTokens * 0.7)) : 1;
        
        return {
            repositoryPath,
            commitHash,
            totalFiles,
            totalLines,
            estimatedTokens,
            fileSizeDistribution,
            languageDistribution,
            dependencyComplexity,
            chunkingRequired,
            estimatedChunks
        };
    }

    /**
     * Display metadata summary to user
     */
    public static displayMetadataSummary(metadata: RepositoryMetadata): void {
        const items = [
            `📁 **Repository**: ${path.basename(metadata.repositoryPath)}`,
            metadata.commitHash ? `📝 **Commit**: ${metadata.commitHash}` : `📝 **State**: Current working directory`,
            `📊 **Files**: ${metadata.totalFiles.toLocaleString()}`,
            `📏 **Lines**: ${metadata.totalLines.toLocaleString()}`,
            `🔤 **Tokens**: ${metadata.estimatedTokens.toLocaleString()}`,
            ``,
            `**Languages**:`,
            ...Object.entries(metadata.languageDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([lang, count]) => `  • ${lang}: ${count} files`),
            ``,
            `**File Sizes**:`,
            `  • Small (<1KB): ${metadata.fileSizeDistribution.small}`,
            `  • Medium (1-10KB): ${metadata.fileSizeDistribution.medium}`,
            `  • Large (10-100KB): ${metadata.fileSizeDistribution.large}`,
            `  • Extra Large (>100KB): ${metadata.fileSizeDistribution.extraLarge}`,
            ``,
            `🧠 **Chunking**: ${metadata.chunkingRequired ? `Required (${metadata.estimatedChunks} chunks)` : 'Not required'}`,
            `🔗 **Dependency Complexity**: ${metadata.dependencyComplexity.toFixed(1)} dependencies/file`
        ];

        const message = items.join('\n');
        
        vscode.window.showInformationMessage(
            `Repository analysis complete!`,
            'View Details',
            'Continue'
        ).then(selection => {
            if (selection === 'View Details') {
                vscode.workspace.openTextDocument({
                    content: `# Repository Analysis Summary\n\n${message}`,
                    language: 'markdown'
                }).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    }
}
