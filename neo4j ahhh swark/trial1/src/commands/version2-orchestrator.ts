import * as vscode from 'vscode';
import { FileSystemTraverser } from '../io/filesystem-traverser';
import { LLMAnalysisService } from '../llm/analysis-service';
import { FunctionExtractor } from '../io/function-extractor';
import { Neo4jService } from '../io/neo4j-service';
import { WebUIServer } from '../io/webui-server';

/**
 * Version2 Main Orchestrator - Implements the complete workflow
 * 
 * PROCESS FLOW:
 * Step 1: Preprocessor - Build file system JSON
 * Step 2-4: LLM Analysis - Get filtered files (LLM Call #1)
 * Step 5: Based on LLM output (filtered files)
 * Step 6: Extract functions using function extractor
 * Step 7: WebUI with Neo4j visualization (LLM Call #2 for summaries)
 */
export class Version2Orchestrator {
    private fileSystemTraverser: FileSystemTraverser;
    private llmService: LLMAnalysisService;
    private functionExtractor: FunctionExtractor;
    private neo4jService: Neo4jService;
    private webUIServer: WebUIServer;

    constructor() {
        this.fileSystemTraverser = new FileSystemTraverser();
        this.llmService = new LLMAnalysisService();
        this.functionExtractor = new FunctionExtractor();
        this.neo4jService = new Neo4jService();
        this.webUIServer = new WebUIServer();
    }

    /**
     * Complete Version2 Analysis Workflow
     */
    async analyzeCodebase(rootPath: string): Promise<void> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Version2 Analysis",
            cancellable: false
        }, async (progress, token) => {
            try {
                // Step 1: Preprocessor - Build file system JSON
                progress.report({ increment: 10, message: "Step 1: Building file system JSON..." });
                console.log('=== Step 1: Building file system JSON ===');
                const fileSystemJSON = this.fileSystemTraverser.buildFileSystemJSON(rootPath);
                const stats = this.fileSystemTraverser.getStatistics(fileSystemJSON);
                console.log(`Found ${stats.files} files and ${stats.directories} directories`);

                // Step 2-4: LLM Analysis (First LLM Call)
                progress.report({ increment: 20, message: "Step 2-4: Analyzing with LLM..." });
                console.log('=== Step 2-4: LLM Analysis (Call #1) ===');
                const analysis = await this.llmService.analyzeFileSystem(fileSystemJSON);
                console.log(`Languages detected: ${analysis.languages.join(', ')}`);
                console.log(`Files to analyze: ${analysis.analyzable.length}`);
                console.log(`Files to ignore: ${analysis.ignorable.length}`);

            // Step 5: Based on LLM output (filtered files)
            progress.report({ increment: 10, message: "Step 5: Finding code files..." });
            console.log('=== Step 5: Finding code files in workspace ===');
            
            // Instead of using LLM paths, find all code files directly
            const validFiles = this.findAllCodeFiles(rootPath);
            console.log(`Valid files for analysis: ${validFiles.length}`);
            
            // Log first few files for debugging
            if (validFiles.length > 0) {
                console.log('Sample files to analyze:');
                validFiles.slice(0, 5).forEach(file => {
                    console.log(`  - ${file}`);
                });
            }                // Step 6A-6B: Extract functions and build relationships
                progress.report({ increment: 30, message: "Step 6: Extracting functions..." });
                console.log('=== Step 6: Function Extraction ===');
                const allFunctions = await this.functionExtractor.extractFunctionsFromFiles(validFiles);
                console.log(`Extracted ${allFunctions.length} functions`);

                const functionsWithRelationships = this.functionExtractor.buildFunctionRelationships(allFunctions);
                const totalDependencies = functionsWithRelationships.reduce((sum, f) => sum + f.dependsOn.length, 0);
                console.log(`Built ${totalDependencies} dependency relationships`);

                // Step 6B3: Insert into Neo4j
                progress.report({ increment: 20, message: "Step 6B3: Inserting into Neo4j..." });
                console.log('=== Step 6B3: Neo4j Database Operations ===');
                await this.neo4jService.connect(rootPath);
                await this.neo4jService.clearDatabase();
                await this.neo4jService.insertAllFunctions(functionsWithRelationships);
                await this.neo4jService.close();

                // Step 7: Launch WebUI
                progress.report({ increment: 10, message: "Step 7: Starting WebUI..." });
                console.log('=== Step 7: Starting WebUI Server ===');
                await this.webUIServer.start(3000, rootPath);

                // Show completion message
                const message = `Analysis complete! 
                
Found ${analysis.languages.length} programming languages
Extracted ${allFunctions.length} functions 
Created ${totalDependencies} dependency relationships

WebUI is now running at http://localhost:3000`;

                vscode.window.showInformationMessage(message, 'Open WebUI').then(selection => {
                    if (selection === 'Open WebUI') {
                        vscode.env.openExternal(vscode.Uri.parse('http://localhost:3000'));
                    }
                });

                console.log('=== Version2 Analysis Complete! ===');
                console.log(`Total functions: ${allFunctions.length}`);
                console.log(`Total relationships: ${totalDependencies}`);
                console.log(`Languages: ${analysis.languages.join(', ')}`);
                console.log('WebUI available at: http://localhost:3000');

            } catch (error) {
                console.error('Version2 analysis failed:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Version2 analysis failed: ${errorMessage}`);
                throw error;
            }
        });
    }

    /**
     * Stop the WebUI server
     */
    async stopWebUI(): Promise<void> {
        try {
            await this.webUIServer.stop();
            console.log('WebUI server stopped');
            vscode.window.showInformationMessage('WebUI server stopped');
        } catch (error) {
            console.error('Failed to stop WebUI:', error);
            vscode.window.showErrorMessage('Failed to stop WebUI');
        }
    }

    /**
     * Get analysis status
     */
    async getStatus(): Promise<string> {
        try {
            // Check if Neo4j has data
            await this.neo4jService.connect();
            const functions = await this.neo4jService.getAllFunctions();
            await this.neo4jService.close();
            
            return `Analysis Status: ${functions.length} functions in database. WebUI available at http://localhost:3000`;
        } catch (error) {
            return 'Analysis Status: No data found. Run analysis first.';
        }
    }

    /**
     * Find all code files in the workspace
     */
    private findAllCodeFiles(rootPath: string): string[] {
        const fs = require('fs');
        const path = require('path');
        const codeFiles: string[] = [];
        
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.go', '.rs'];
        const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'out', 'coverage', '.vscode', 'vendor', '__pycache__'];
        
        const scanDirectory = (dirPath: string, depth = 0): void => {
            if (depth > 10) return; // Prevent infinite recursion
            
            try {
                const items = fs.readdirSync(dirPath);
                
                for (const item of items) {
                    const fullPath = path.join(dirPath, item);
                    
                    // Skip hidden files and ignore directories
                    if (item.startsWith('.') || ignoreDirs.includes(item)) {
                        continue;
                    }
                    
                    try {
                        const stats = fs.statSync(fullPath);
                        
                        if (stats.isDirectory()) {
                            scanDirectory(fullPath, depth + 1);
                        } else if (stats.isFile()) {
                            const ext = path.extname(fullPath).toLowerCase();
                            if (codeExtensions.includes(ext)) {
                                codeFiles.push(fullPath);
                            }
                        }
                    } catch (error) {
                        // Skip files we can't access
                        continue;
                    }
                }
            } catch (error) {
                console.warn(`Cannot read directory: ${dirPath}`);
            }
        };
        
        scanDirectory(rootPath);
        return codeFiles;
    }

    /**
     * Validate that file paths exist and are readable
     */
    private validateFilePaths(filePaths: string[]): string[] {
        const fs = require('fs');
        const validFiles: string[] = [];

        for (const filePath of filePaths) {
            try {
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    validFiles.push(filePath);
                } else {
                    console.warn(`File not found or not readable: ${filePath}`);
                }
            } catch (error) {
                console.warn(`Error validating file ${filePath}:`, error);
            }
        }

        return validFiles;
    }



    /**
     * Clean up resources
     */
    async dispose(): Promise<void> {
        try {
            await this.stopWebUI();
            await this.neo4jService.close();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}
