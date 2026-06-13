import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TokenCounter } from '../types';
import { Swark5AnalysisRequest, Swark5Metadata } from '../commands/create-swark5-architecture';

/**
 * Swark 5.0: Enhanced metadata extractor with improved dependency analysis
 */
export class Swark5MetadataExtractor {
    private tokenCounter: TokenCounter;

    constructor(tokenCounter: TokenCounter) {
        this.tokenCounter = tokenCounter;
    }

    /**
     * Extract comprehensive metadata from repository
     */
    async extractMetadata(request: Swark5AnalysisRequest): Promise<Swark5Metadata> {
        console.log(`📊 Extracting metadata for repository: ${request.repositoryPath}`);
        console.log(`🎯 Target commit: ${request.commitHash}`);

        // Get all files in repository
        const allFiles = await this.getAllFiles(request.repositoryPath);
        console.log(`📁 Found ${allFiles.length} files in repository`);

        // Analyze each file
        const fileList = await this.analyzeFiles(allFiles, request.repositoryPath);
        
        // Build dependency graph
        const dependencyGraph = await this.buildDependencyGraph(fileList, request.repositoryPath);
        
        // Calculate total tokens
        const worstCaseTokens = fileList.reduce((sum, file) => sum + file.estimatedTokens, 0);
        
        // Generate repository structure
        const repositoryStructure = await this.generateRepositoryStructure(request.repositoryPath);

        return {
            repositoryPath: request.repositoryPath,
            commitHash: request.commitHash,
            totalFiles: allFiles.length,
            fileList,
            dependencyGraph,
            worstCaseTokens,
            repositoryStructure
        };
    }

    /**
     * Get all files in repository (excluding .git and common build directories)
     */
    private async getAllFiles(repositoryPath: string): Promise<string[]> {
        const files: string[] = [];
        const excludePatterns = [
            '.git',
            'node_modules',
            '.vscode',
            '.idea',
            '__pycache__',
            '.pytest_cache',
            'dist',
            'build',
            'out',
            'target',
            '.next',
            '.nuxt',
            'coverage',
            '.nyc_output'
        ];

        const traverseDirectory = async (dir: string): Promise<void> => {
            try {
                const entries = await fs.promises.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(repositoryPath, fullPath);
                    
                    // Skip excluded directories
                    if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        await traverseDirectory(fullPath);
                    } else if (entry.isFile()) {
                        files.push(relativePath);
                    }
                }
            } catch (error) {
                console.warn(`Could not read directory ${dir}:`, error);
            }
        };

        await traverseDirectory(repositoryPath);
        return files;
    }

    /**
     * Analyze files to extract metadata
     */
    private async analyzeFiles(filePaths: string[], repositoryPath: string): Promise<Swark5Metadata['fileList']> {
        const fileList: Swark5Metadata['fileList'] = [];
        
        for (const filePath of filePaths) {
            try {
                const fullPath = path.join(repositoryPath, filePath);
                const stats = await fs.promises.stat(fullPath);
                
                // Skip very large files (>1MB)
                if (stats.size > 1024 * 1024) {
                    continue;
                }
                
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const language = this.detectLanguage(filePath);
                const estimatedTokens = await this.tokenCounter(content);
                const importance = this.classifyFileImportance(filePath, content);
                
                fileList.push({
                    path: filePath,
                    size: stats.size,
                    estimatedTokens,
                    language,
                    importance
                });
                
            } catch (error) {
                console.warn(`Could not analyze file ${filePath}:`, error);
            }
        }
        
        return fileList.sort((a, b) => {
            // Sort by importance first, then by tokens
            const importanceOrder = { 'entry-point': 0, 'core': 1, 'utility': 2, 'dependency': 3 };
            const aOrder = importanceOrder[a.importance];
            const bOrder = importanceOrder[b.importance];
            
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            
            return b.estimatedTokens - a.estimatedTokens;
        });
    }

    /**
     * Detect programming language from file extension
     */
    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap: { [key: string]: string } = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.h': 'c',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.lua': 'lua',
            '.r': 'r',
            '.sql': 'sql',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.toml': 'toml',
            '.md': 'markdown',
            '.sh': 'shell',
            '.bat': 'batch',
            '.ps1': 'powershell'
        };
        
        return languageMap[ext] || 'text';
    }

    /**
     * Classify file importance based on patterns
     */
    private classifyFileImportance(filePath: string, content: string): 'entry-point' | 'core' | 'utility' | 'dependency' {
        const fileName = path.basename(filePath).toLowerCase();
        const dirPath = path.dirname(filePath).toLowerCase();
        
        // Entry point patterns
        const entryPointPatterns = [
            'main.', 'index.', 'app.', 'server.', 'client.',
            '__init__.py', 'package.json', 'cargo.toml', 'go.mod',
            'pom.xml', 'build.gradle', 'makefile'
        ];
        
        if (entryPointPatterns.some(pattern => fileName.includes(pattern))) {
            return 'entry-point';
        }
        
        // Core logic patterns
        const corePatterns = [
            'src/', 'lib/', 'core/', 'service/', 'controller/',
            'model/', 'repository/', 'handler/', 'manager/',
            'processor/', 'engine/', 'api/'
        ];
        
        if (corePatterns.some(pattern => dirPath.includes(pattern))) {
            return 'core';
        }
        
        // Utility patterns
        const utilityPatterns = [
            'util/', 'utils/', 'helper/', 'common/', 'shared/',
            'tool/', 'support/', 'misc/'
        ];
        
        if (utilityPatterns.some(pattern => dirPath.includes(pattern))) {
            return 'utility';
        }
        
        return 'dependency';
    }

    /**
     * Build dependency graph by analyzing imports/requires
     */
    private async buildDependencyGraph(fileList: Swark5Metadata['fileList'], repositoryPath: string): Promise<{ [filePath: string]: string[] }> {
        const dependencyGraph: { [filePath: string]: string[] } = {};
        
        for (const file of fileList) {
            try {
                const fullPath = path.join(repositoryPath, file.path);
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const dependencies = this.extractDependencies(content, file.language, file.path, repositoryPath);
                dependencyGraph[file.path] = dependencies;
            } catch (error) {
                console.warn(`Could not extract dependencies for ${file.path}:`, error);
                dependencyGraph[file.path] = [];
            }
        }
        
        return dependencyGraph;
    }

    /**
     * Extract dependencies from file content based on language
     */
    private extractDependencies(content: string, language: string, currentFilePath: string, repositoryPath: string): string[] {
        const dependencies: string[] = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            switch (language) {
                case 'javascript':
                case 'typescript':
                    // import/require statements
                    const jsImportMatch = trimmedLine.match(/^(?:import.*from\s+['"`]([^'"`]+)['"`]|const.*=.*require\(['"`]([^'"`]+)['"`]\))/);
                    if (jsImportMatch) {
                        const importPath = jsImportMatch[1] || jsImportMatch[2];
                        if (importPath.startsWith('.')) {
                            const resolvedPath = this.resolveRelativePath(importPath, currentFilePath);
                            if (resolvedPath) {
                                dependencies.push(resolvedPath);
                            }
                        }
                    }
                    break;
                    
                case 'python':
                    // import statements
                    const pythonImportMatch = trimmedLine.match(/^(?:from\s+(\S+)\s+import|import\s+(\S+))/);
                    if (pythonImportMatch) {
                        const importModule = pythonImportMatch[1] || pythonImportMatch[2];
                        if (importModule.startsWith('.')) {
                            const resolvedPath = this.resolveRelativePath(importModule, currentFilePath);
                            if (resolvedPath) {
                                dependencies.push(resolvedPath);
                            }
                        }
                    }
                    break;
                    
                case 'java':
                    // import statements
                    const javaImportMatch = trimmedLine.match(/^import\s+([^;]+);/);
                    if (javaImportMatch) {
                        // For Java, we'd need more sophisticated resolution
                        // For now, just record the import
                        dependencies.push(javaImportMatch[1]);
                    }
                    break;
                    
                case 'go':
                    // import statements
                    const goImportMatch = trimmedLine.match(/^import\s+['"`]([^'"`]+)['"`]/);
                    if (goImportMatch && goImportMatch[1].startsWith('.')) {
                        const resolvedPath = this.resolveRelativePath(goImportMatch[1], currentFilePath);
                        if (resolvedPath) {
                            dependencies.push(resolvedPath);
                        }
                    }
                    break;
            }
        }
        
        return dependencies;
    }

    /**
     * Resolve relative import paths
     */
    private resolveRelativePath(importPath: string, currentFilePath: string): string | null {
        try {
            const currentDir = path.dirname(currentFilePath);
            const resolvedPath = path.normalize(path.join(currentDir, importPath));
            
            // Common file extensions to try
            const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go'];
            
            // Try with different extensions
            for (const ext of extensions) {
                const pathWithExt = resolvedPath + ext;
                if (fs.existsSync(pathWithExt)) {
                    return pathWithExt;
                }
            }
            
            // Try as directory with index file
            for (const ext of extensions) {
                const indexPath = path.join(resolvedPath, 'index' + ext);
                if (fs.existsSync(indexPath)) {
                    return indexPath;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate repository structure overview
     */
    private async generateRepositoryStructure(repositoryPath: string): Promise<string> {
        const structure: string[] = [];
        
        const traverseDirectory = async (dir: string, prefix: string = '', maxDepth: number = 3, currentDepth: number = 0): Promise<void> => {
            if (currentDepth >= maxDepth) {
                return;
            }
            
            try {
                const entries = await fs.promises.readdir(dir, { withFileTypes: true });
                const sortedEntries = entries.sort((a, b) => {
                    if (a.isDirectory() && !b.isDirectory()) return -1;
                    if (!a.isDirectory() && b.isDirectory()) return 1;
                    return a.name.localeCompare(b.name);
                });
                
                for (let i = 0; i < Math.min(sortedEntries.length, 10); i++) {
                    const entry = sortedEntries[i];
                    const isLast = i === Math.min(sortedEntries.length, 10) - 1;
                    const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
                    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
                    
                    structure.push(currentPrefix + entry.name + (entry.isDirectory() ? '/' : ''));
                    
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        await traverseDirectory(path.join(dir, entry.name), nextPrefix, maxDepth, currentDepth + 1);
                    }
                }
                
                if (sortedEntries.length > 10) {
                    structure.push(prefix + '└── ... and ' + (sortedEntries.length - 10) + ' more items');
                }
            } catch (error) {
                console.warn(`Could not read directory ${dir}:`, error);
            }
        };
        
        const repoName = path.basename(repositoryPath);
        structure.push(repoName + '/');
        await traverseDirectory(repositoryPath, '', 3, 0);
        
        return structure.join('\n');
    }
}
