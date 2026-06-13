import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TokenCounter } from '../types';
import { Swark4AnalysisRequest, Swark4Metadata } from '../commands/create-swark4-architecture';

/**
 * Swark 4.0: Advanced metadata extraction with token calculation and dependency analysis
 */
export class Swark4MetadataExtractor {
    private tokenCounter: TokenCounter;

    constructor(tokenCounter: TokenCounter) {
        this.tokenCounter = tokenCounter;
    }

    /**
     * Extract comprehensive metadata from repository
     */
    async extractMetadata(request: Swark4AnalysisRequest): Promise<Swark4Metadata> {
        console.log(`📊 Extracting metadata for ${request.repositoryPath} at commit ${request.commitHash}`);

        // Get all files in repository
        const allFiles = await this.scanRepository(request.repositoryPath);
        
        // Calculate token estimates for each file
        const fileList = await Promise.all(
            allFiles.map(async (filePath) => {
                const fullPath = path.join(request.repositoryPath, filePath);
                const stats = await fs.stat(fullPath);
                const content = await this.readFileContent(fullPath);
                const estimatedTokens = await this.tokenCounter(content);
                const language = this.detectLanguage(filePath);
                const importance = this.classifyFileImportance(filePath, content);

                return {
                    path: filePath,
                    size: stats.size,
                    estimatedTokens,
                    language,
                    importance
                };
            })
        );

        // Build dependency graph
        const dependencyGraph = await this.buildDependencyGraph(request.repositoryPath, fileList);

        // Calculate total tokens
        const worstCaseTokens = fileList.reduce((sum, file) => sum + file.estimatedTokens, 0);

        // Generate repository structure
        const repositoryStructure = await this.generateRepositoryStructure(request.repositoryPath);

        return {
            repositoryPath: request.repositoryPath,
            commitHash: request.commitHash,
            totalFiles: fileList.length,
            fileList,
            dependencyGraph,
            worstCaseTokens,
            repositoryStructure
        };
    }

    /**
     * Scan repository for all relevant files
     */
    private async scanRepository(repositoryPath: string): Promise<string[]> {
        const files: string[] = [];
        
        const scanDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');
                    
                    // Skip common ignore patterns
                    if (this.shouldIgnore(entry.name, relativeFilePath)) {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        await scanDirectory(fullPath, relativeFilePath);
                    } else if (entry.isFile() && this.isRelevantFile(entry.name)) {
                        files.push(relativeFilePath);
                    }
                }
            } catch (error) {
                console.warn(`Cannot read directory ${dirPath}:`, error);
            }
        };
        
        await scanDirectory(repositoryPath);
        return files.sort();
    }

    /**
     * Read file content safely
     */
    private async readFileContent(filePath: string): Promise<string> {
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            console.warn(`Cannot read file ${filePath}:`, error);
            return '';
        }
    }

    /**
     * Detect programming language from file extension
     */
    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap: { [key: string]: string } = {
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript',
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.md': 'Markdown',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML'
        };
        
        return languageMap[ext] || 'Unknown';
    }

    /**
     * Classify file importance for analysis
     */
    private classifyFileImportance(filePath: string, content: string): 'entry-point' | 'core' | 'utility' | 'dependency' {
        const fileName = path.basename(filePath).toLowerCase();
        const dirName = path.dirname(filePath).toLowerCase();
        
        // Entry points
        if (fileName.includes('main') || fileName.includes('index') || fileName.includes('app') || 
            fileName.includes('server') || fileName.includes('extension') || fileName === 'package.json') {
            return 'entry-point';
        }
        
        // Core logic indicators
        if (dirName.includes('core') || dirName.includes('src') || dirName.includes('lib') ||
            content.includes('export class') || content.includes('export function') ||
            content.includes('export default')) {
            return 'core';
        }
        
        // Dependencies
        if (dirName.includes('node_modules') || dirName.includes('vendor') || dirName.includes('third_party')) {
            return 'dependency';
        }
        
        // Utilities
        if (dirName.includes('util') || dirName.includes('helper') || dirName.includes('tool') ||
            fileName.includes('util') || fileName.includes('helper') || fileName.includes('config')) {
            return 'utility';
        }
        
        return 'core'; // Default to core if unsure
    }

    /**
     * Build dependency graph by analyzing imports/requires
     */
    private async buildDependencyGraph(repositoryPath: string, fileList: any[]): Promise<{ [filePath: string]: string[] }> {
        const dependencyGraph: { [filePath: string]: string[] } = {};
        
        for (const file of fileList) {
            const fullPath = path.join(repositoryPath, file.path);
            const content = await this.readFileContent(fullPath);
            const dependencies = this.extractDependencies(content, file.path, repositoryPath);
            dependencyGraph[file.path] = dependencies;
        }
        
        return dependencyGraph;
    }

    /**
     * Extract dependencies from file content
     */
    private extractDependencies(content: string, filePath: string, repositoryPath: string): string[] {
        const dependencies: Set<string> = new Set();
        
        // Match import statements (ES6/TypeScript)
        const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
            importMatches.forEach(match => {
                const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
                if (depMatch) {
                    dependencies.add(depMatch[1]);
                }
            });
        }
        
        // Match require statements (CommonJS)
        const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
        if (requireMatches) {
            requireMatches.forEach(match => {
                const depMatch = match.match(/['"]([^'"]+)['"]/);
                if (depMatch) {
                    dependencies.add(depMatch[1]);
                }
            });
        }
        
        return Array.from(dependencies);
    }

    /**
     * Generate repository structure overview
     */
    private async generateRepositoryStructure(repositoryPath: string): Promise<string> {
        const structure: string[] = [];
        
        const buildStructure = async (dirPath: string, relativePath: string = '', depth: number = 0): Promise<void> => {
            if (depth > 3) return; // Limit depth to avoid huge structures
            
            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                const indent = '  '.repeat(depth);
                
                for (const entry of entries.slice(0, 20)) { // Limit entries per directory
                    if (this.shouldIgnore(entry.name, path.join(relativePath, entry.name))) {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        structure.push(`${indent}${entry.name}/`);
                        await buildStructure(path.join(dirPath, entry.name), path.join(relativePath, entry.name), depth + 1);
                    } else {
                        structure.push(`${indent}${entry.name}`);
                    }
                }
            } catch (error) {
                // Ignore errors for inaccessible directories
            }
        };
        
        await buildStructure(repositoryPath);
        return structure.join('\n');
    }

    /**
     * Check if file/directory should be ignored
     */
    private shouldIgnore(name: string, relativePath: string): boolean {
        const ignorePatterns = [
            'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
            '.vscode', '.idea', '__pycache__', '.pytest_cache', 'target',
            'vendor', '.next', '.nuxt', 'coverage', '.nyc_output'
        ];
        
        return ignorePatterns.some(pattern => 
            name.startsWith('.') && name !== '.gitignore' && name !== '.env' ||
            ignorePatterns.includes(name) ||
            relativePath.includes(`/${pattern}/`) ||
            relativePath.startsWith(`${pattern}/`)
        );
    }

    /**
     * Check if file is relevant for analysis
     */
    private isRelevantFile(fileName: string): boolean {
        const relevantExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
            '.cpp', '.c', '.cs', '.php', '.rb', '.swift', '.kt', '.scala',
            '.md', '.json', '.yaml', '.yml', '.xml', '.toml', '.ini'
        ];
        
        const ext = path.extname(fileName).toLowerCase();
        return relevantExtensions.includes(ext) || 
               fileName === 'Dockerfile' || 
               fileName === 'Makefile' ||
               fileName.startsWith('README');
    }
}
