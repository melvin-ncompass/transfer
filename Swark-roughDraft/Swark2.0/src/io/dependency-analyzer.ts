import * as vscode from "vscode";
import * as path from "path";
import { File, TokenCounter } from "../types";

export interface DependencyNode {
    filePath: string;
    languageId: string;
    dependencies: Set<string>;
    dependents: Set<string>;
    size: number;
    content: string;
}

export interface FileChunk {
    id: string;
    files: DependencyNode[];
    totalTokens: number;
    cohesionScore: number;
    description: string;
}

export interface ChunkingResult {
    chunks: FileChunk[];
    metadata: {
        totalFiles: number;
        totalChunks: number;
        averageChunkSize: number;
        maxChunkSize: number;
        chunkingStrategy: string;
    };
}

export class DependencyAnalyzer {
    private dependencyGraph: Map<string, DependencyNode> = new Map();
    private readonly tokenCounter: TokenCounter;
    private readonly maxTokensPerChunk: number;

    constructor(tokenCounter: TokenCounter, maxTokensPerChunk: number) {
        this.tokenCounter = tokenCounter;
        this.maxTokensPerChunk = maxTokensPerChunk;
    }

    /**
     * Main entry point: Analyze dependencies and create intelligent chunks
     */
    public async analyzeAndChunk(files: File[]): Promise<ChunkingResult> {
        console.log(`Starting dependency analysis for ${files.length} files...`);
        
        // Step 1: Build dependency graph
        await this.buildDependencyGraph(files);
        
        // Step 2: Create chunks based on dependency relationships
        const chunks = await this.createDependencyBasedChunks();
        
        // Step 3: Optimize chunks for token limits
        const optimizedChunks = await this.optimizeChunks(chunks);
        
        // Step 4: Generate metadata
        const metadata = this.generateMetadata(optimizedChunks, files.length);
        
        console.log(`Created ${optimizedChunks.length} chunks from ${files.length} files`);
        
        return {
            chunks: optimizedChunks,
            metadata
        };
    }

    /**
     * Step 1: Build a comprehensive dependency graph
     */
    private async buildDependencyGraph(files: File[]): Promise<void> {
        for (const file of files) {
            const node: DependencyNode = {
                filePath: file.path,
                languageId: file.languageId,
                dependencies: new Set(),
                dependents: new Set(),
                size: file.content.length,
                content: file.content
            };

            // Extract dependencies based on language
            const dependencies = await this.extractDependencies(file);
            node.dependencies = new Set(dependencies);

            this.dependencyGraph.set(file.path, node);
        }

        // Build reverse dependency relationships (dependents)
        this.buildDependentsGraph();
    }

    /**
     * Extract dependencies from file content based on language
     */
    private async extractDependencies(file: File): Promise<string[]> {
        const dependencies: string[] = [];
        const lines = file.content.split('\n');
        const fileDir = path.dirname(file.path);

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // TypeScript/JavaScript imports
            if (file.languageId === 'typescript' || file.languageId === 'javascript') {
                const tsImports = this.extractTypeScriptImports(trimmedLine, fileDir);
                dependencies.push(...tsImports);
            }
            
            // Python imports
            else if (file.languageId === 'python') {
                const pyImports = this.extractPythonImports(trimmedLine, fileDir);
                dependencies.push(...pyImports);
            }
            
            // Java imports
            else if (file.languageId === 'java') {
                const javaImports = this.extractJavaImports(trimmedLine, fileDir);
                dependencies.push(...javaImports);
            }
            
            // C/C++ includes
            else if (file.languageId === 'c' || file.languageId === 'cpp') {
                const cImports = this.extractCIncludes(trimmedLine, fileDir);
                dependencies.push(...cImports);
            }
            
            // Go imports
            else if (file.languageId === 'go') {
                const goImports = this.extractGoImports(trimmedLine, fileDir);
                dependencies.push(...goImports);
            }
        }

        return dependencies.filter(dep => this.dependencyGraph.has(dep));
    }

    /**
     * Extract TypeScript/JavaScript imports
     */
    private extractTypeScriptImports(line: string, fileDir: string): string[] {
        const imports: string[] = [];
        
        // import ... from "path"
        const importFromMatch = line.match(/import\s+.*\s+from\s+["']([^"']+)["']/);
        if (importFromMatch) {
            const importPath = this.resolvePath(importFromMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }
        
        // import "path"
        const importMatch = line.match(/import\s+["']([^"']+)["']/);
        if (importMatch) {
            const importPath = this.resolvePath(importMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }
        
        // require("path")
        const requireMatch = line.match(/require\s*\(\s*["']([^"']+)["']\s*\)/);
        if (requireMatch) {
            const importPath = this.resolvePath(requireMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }

        return imports;
    }

    /**
     * Extract Python imports
     */
    private extractPythonImports(line: string, fileDir: string): string[] {
        const imports: string[] = [];
        
        // from ... import ...
        const fromImportMatch = line.match(/from\s+([^\s]+)\s+import/);
        if (fromImportMatch) {
            const importPath = this.resolvePythonPath(fromImportMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }
        
        // import ...
        const importMatch = line.match(/^import\s+([^\s,]+)/);
        if (importMatch) {
            const importPath = this.resolvePythonPath(importMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }

        return imports;
    }

    /**
     * Extract Java imports
     */
    private extractJavaImports(line: string, fileDir: string): string[] {
        const imports: string[] = [];
        
        const importMatch = line.match(/import\s+([^;]+);/);
        if (importMatch) {
            const importPath = this.resolveJavaPath(importMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }

        return imports;
    }

    /**
     * Extract C/C++ includes
     */
    private extractCIncludes(line: string, fileDir: string): string[] {
        const imports: string[] = [];
        
        const includeMatch = line.match(/#include\s*["<]([^">]+)[">]/);
        if (includeMatch) {
            const importPath = this.resolvePath(includeMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }

        return imports;
    }

    /**
     * Extract Go imports
     */
    private extractGoImports(line: string, fileDir: string): string[] {
        const imports: string[] = [];
        
        const importMatch = line.match(/import\s+["']([^"']+)["']/);
        if (importMatch) {
            const importPath = this.resolveGoPath(importMatch[1], fileDir);
            if (importPath) imports.push(importPath);
        }

        return imports;
    }

    /**
     * Resolve relative paths to absolute paths
     */
    private resolvePath(importPath: string, fileDir: string): string | null {
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolved = path.resolve(fileDir, importPath);
            
            // Try different extensions
            const extensions = ['.ts', '.js', '.tsx', '.jsx', '.d.ts'];
            for (const ext of extensions) {
                const withExt = resolved + ext;
                if (this.dependencyGraph.has(withExt)) {
                    return withExt;
                }
            }
            
            // Try index files
            for (const ext of extensions) {
                const indexFile = path.join(resolved, 'index' + ext);
                if (this.dependencyGraph.has(indexFile)) {
                    return indexFile;
                }
            }
        }
        
        return null;
    }

    /**
     * Resolve Python module paths
     */
    private resolvePythonPath(modulePath: string, fileDir: string): string | null {
        if (modulePath.startsWith('.')) {
            const parts = modulePath.split('.');
            const relativePath = parts.join('/') + '.py';
            const resolved = path.resolve(fileDir, relativePath);
            if (this.dependencyGraph.has(resolved)) {
                return resolved;
            }
        }
        return null;
    }

    /**
     * Resolve Java class paths
     */
    private resolveJavaPath(className: string, fileDir: string): string | null {
        const relativePath = className.replace(/\./g, '/') + '.java';
        const resolved = path.resolve(fileDir, relativePath);
        if (this.dependencyGraph.has(resolved)) {
            return resolved;
        }
        return null;
    }

    /**
     * Resolve Go import paths
     */
    private resolveGoPath(importPath: string, fileDir: string): string | null {
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolved = path.resolve(fileDir, importPath) + '.go';
            if (this.dependencyGraph.has(resolved)) {
                return resolved;
            }
        }
        return null;
    }

    /**
     * Build reverse dependency relationships
     */
    private buildDependentsGraph(): void {
        for (const [filePath, node] of this.dependencyGraph) {
            for (const dependency of node.dependencies) {
                const depNode = this.dependencyGraph.get(dependency);
                if (depNode) {
                    depNode.dependents.add(filePath);
                }
            }
        }
    }

    /**
     * Step 2: Create dependency-based chunks using graph algorithms
     */
    private async createDependencyBasedChunks(): Promise<FileChunk[]> {
        const chunks: FileChunk[] = [];
        const visited = new Set<string>();
        
        // Find strongly connected components and high-cohesion groups
        const componentGroups = this.findStronglyConnectedComponents();
        
        for (const group of componentGroups) {
            if (group.length === 0) continue;
            
            const chunkFiles: DependencyNode[] = [];
            let totalTokens = 0;
            
            for (const filePath of group) {
                if (visited.has(filePath)) continue;
                
                const node = this.dependencyGraph.get(filePath);
                if (!node) continue;
                
                const fileTokens = await this.tokenCounter(node.content);
                
                if (totalTokens + fileTokens <= this.maxTokensPerChunk) {
                    chunkFiles.push(node);
                    totalTokens += fileTokens;
                    visited.add(filePath);
                } else {
                    // Start a new chunk if we've accumulated files
                    if (chunkFiles.length > 0) {
                        break;
                    }
                }
            }
            
            if (chunkFiles.length > 0) {
                const cohesionScore = this.calculateCohesionScore(chunkFiles);
                chunks.push({
                    id: `chunk-${chunks.length + 1}`,
                    files: chunkFiles,
                    totalTokens,
                    cohesionScore,
                    description: this.generateChunkDescription(chunkFiles)
                });
            }
        }
        
        // Handle remaining unvisited files
        const remainingFiles = Array.from(this.dependencyGraph.values())
            .filter(node => !visited.has(node.filePath));
            
        if (remainingFiles.length > 0) {
            const additionalChunks = await this.createChunksFromRemainingFiles(remainingFiles);
            chunks.push(...additionalChunks);
        }
        
        return chunks;
    }

    /**
     * Find strongly connected components using Tarjan's algorithm
     */
    private findStronglyConnectedComponents(): string[][] {
        const components: string[][] = [];
        const visited = new Set<string>();
        const stack: string[] = [];
        const indices = new Map<string, number>();
        const lowLinks = new Map<string, number>();
        const onStack = new Set<string>();
        let index = 0;

        const strongConnect = (filePath: string): void => {
            indices.set(filePath, index);
            lowLinks.set(filePath, index);
            index++;
            stack.push(filePath);
            onStack.add(filePath);

            const node = this.dependencyGraph.get(filePath);
            if (node) {
                for (const dependency of node.dependencies) {
                    if (!indices.has(dependency)) {
                        strongConnect(dependency);
                        lowLinks.set(filePath, Math.min(lowLinks.get(filePath)!, lowLinks.get(dependency)!));
                    } else if (onStack.has(dependency)) {
                        lowLinks.set(filePath, Math.min(lowLinks.get(filePath)!, indices.get(dependency)!));
                    }
                }
            }

            if (lowLinks.get(filePath) === indices.get(filePath)) {
                const component: string[] = [];
                let w: string;
                do {
                    w = stack.pop()!;
                    onStack.delete(w);
                    component.push(w);
                } while (w !== filePath);
                
                if (component.length > 0) {
                    components.push(component);
                }
            }
        };

        for (const filePath of this.dependencyGraph.keys()) {
            if (!indices.has(filePath)) {
                strongConnect(filePath);
            }
        }

        return components;
    }

    /**
     * Calculate cohesion score for a chunk based on internal dependencies
     */
    private calculateCohesionScore(files: DependencyNode[]): number {
        if (files.length <= 1) return 1.0;
        
        const filePaths = new Set(files.map(f => f.filePath));
        let internalConnections = 0;
        let totalPossibleConnections = 0;
        
        for (const file of files) {
            totalPossibleConnections += file.dependencies.size + file.dependents.size;
            
            for (const dep of file.dependencies) {
                if (filePaths.has(dep)) {
                    internalConnections++;
                }
            }
            
            for (const dependent of file.dependents) {
                if (filePaths.has(dependent)) {
                    internalConnections++;
                }
            }
        }
        
        return totalPossibleConnections > 0 ? internalConnections / totalPossibleConnections : 0;
    }

    /**
     * Generate descriptive name for chunk based on contents
     */
    private generateChunkDescription(files: DependencyNode[]): string {
        const directories = new Set<string>();
        const languages = new Set<string>();
        
        for (const file of files) {
            directories.add(path.dirname(file.filePath).split(path.sep).pop() || 'root');
            languages.add(file.languageId);
        }
        
        const dirStr = Array.from(directories).slice(0, 3).join(', ');
        const langStr = Array.from(languages).join(', ');
        
        return `${dirStr} (${langStr}) - ${files.length} files`;
    }

    /**
     * Create chunks from remaining files that weren't part of components
     */
    private async createChunksFromRemainingFiles(files: DependencyNode[]): Promise<FileChunk[]> {
        const chunks: FileChunk[] = [];
        let currentChunk: DependencyNode[] = [];
        let currentTokens = 0;
        
        for (const file of files) {
            const fileTokens = await this.tokenCounter(file.content);
            
            if (currentTokens + fileTokens <= this.maxTokensPerChunk) {
                currentChunk.push(file);
                currentTokens += fileTokens;
            } else {
                if (currentChunk.length > 0) {
                    chunks.push({
                        id: `chunk-remaining-${chunks.length + 1}`,
                        files: currentChunk,
                        totalTokens: currentTokens,
                        cohesionScore: this.calculateCohesionScore(currentChunk),
                        description: this.generateChunkDescription(currentChunk)
                    });
                }
                
                currentChunk = [file];
                currentTokens = fileTokens;
            }
        }
        
        if (currentChunk.length > 0) {
            chunks.push({
                id: `chunk-remaining-${chunks.length + 1}`,
                files: currentChunk,
                totalTokens: currentTokens,
                cohesionScore: this.calculateCohesionScore(currentChunk),
                description: this.generateChunkDescription(currentChunk)
            });
        }
        
        return chunks;
    }

    /**
     * Step 3: Optimize chunks for better token distribution
     */
    private async optimizeChunks(chunks: FileChunk[]): Promise<FileChunk[]> {
        // Sort chunks by cohesion score (higher is better)
        chunks.sort((a, b) => b.cohesionScore - a.cohesionScore);
        
        // Try to merge small chunks with high cohesion
        const optimized: FileChunk[] = [];
        
        for (const chunk of chunks) {
            if (chunk.totalTokens < this.maxTokensPerChunk * 0.3 && optimized.length > 0) {
                // Try to merge with the last chunk if it won't exceed token limit
                const lastChunk = optimized[optimized.length - 1];
                if (lastChunk.totalTokens + chunk.totalTokens <= this.maxTokensPerChunk) {
                    lastChunk.files.push(...chunk.files);
                    lastChunk.totalTokens += chunk.totalTokens;
                    lastChunk.cohesionScore = this.calculateCohesionScore(lastChunk.files);
                    lastChunk.description = this.generateChunkDescription(lastChunk.files);
                    continue;
                }
            }
            
            optimized.push(chunk);
        }
        
        return optimized;
    }

    /**
     * Generate metadata about the chunking process
     */
    private generateMetadata(chunks: FileChunk[], totalFiles: number): ChunkingResult['metadata'] {
        const chunkSizes = chunks.map(c => c.totalTokens);
        
        return {
            totalFiles,
            totalChunks: chunks.length,
            averageChunkSize: chunkSizes.reduce((a, b) => a + b, 0) / chunks.length,
            maxChunkSize: Math.max(...chunkSizes),
            chunkingStrategy: 'dependency-based'
        };
    }
}
