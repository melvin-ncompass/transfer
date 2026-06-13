import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { Swark55ProcessedMetadata } from './swark55-content-filter';
import { ModelInteractor } from '../llm/model-interactor';
import { LLMDiagramGenerator, DiagramRequest } from '../llm/diagram-generator';

const writeFile = promisify(fs.writeFile);

export interface Swark55OutputPaths {
    outputDir: string;
    summary: string;
    highLevelD2: string;
    highLevelEraser: string;
    semiDetailedD2: string;
    semiDetailedEraser: string;
    detailedD2: string;
    detailedEraser: string;
}

export class Swark55OutputGenerator {
    /**
     * Generate comprehensive outputs with intelligent language-based diagrams
     */
    static async generateOutputs(
        metadata: Swark55ProcessedMetadata,
        outputPath: string
    ): Promise<void> {
        const paths = this.createOutputPaths(outputPath, metadata);
        
        // Create output directory
        await fs.promises.mkdir(paths.outputDir, { recursive: true });
        
        // Generate all outputs in parallel
        await Promise.all([
            this.generateSummaryReport(metadata, paths),
            this.generateHighLevelDiagrams(metadata, paths),
            this.generateSemiDetailedDiagrams(metadata, paths),
            this.generateDetailedDiagrams(metadata, paths)
        ]);
        
        vscode.window.showInformationMessage(
            `✅ Swark 5.5 analysis complete! Generated ${metadata.filteredFiles.length} files analysis in ${paths.outputDir}`
        );
    }
    
    /**
     * Create output file paths
     */
    private static createOutputPaths(outputPath: string, metadata: Swark55ProcessedMetadata): Swark55OutputPaths {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const commitHash = metadata.selectedCommit.shortHash;
        const baseDir = path.join(outputPath, `swark55-${commitHash}-${timestamp}`);
        
        return {
            outputDir: baseDir,
            summary: path.join(baseDir, 'swark55-analysis-summary.md'),
            highLevelD2: path.join(baseDir, 'high-level-architecture.d2'),
            highLevelEraser: path.join(baseDir, 'high-level-architecture.eraser'),
            semiDetailedD2: path.join(baseDir, 'semi-detailed-architecture.d2'),
            semiDetailedEraser: path.join(baseDir, 'semi-detailed-architecture.eraser'),
            detailedD2: path.join(baseDir, 'detailed-architecture.d2'),
            detailedEraser: path.join(baseDir, 'detailed-architecture.eraser')
        };
    }
    
    /**
     * Generate summary report
     */
    private static async generateSummaryReport(metadata: Swark55ProcessedMetadata, paths: Swark55OutputPaths): Promise<void> {
        const { filteredFiles } = metadata;
        
        const report = `# Swark 5.5 Repository Analysis Summary

**Repository:** ${path.basename(metadata.repositoryPath)}
**Commit:** ${metadata.selectedCommit.shortHash} - ${metadata.selectedCommit.message}
**Analysis Date:** ${new Date().toISOString()}
**Languages Detected:** ${metadata.detectedLanguages.join(', ')}

## Processing Summary
- **Total Files Processed:** ${filteredFiles.length}
- **Total Tokens:** ${filteredFiles.reduce((sum, f) => sum + f.finalTokens, 0).toLocaleString()}
- **Primary Language:** ${metadata.detectedLanguages[0] || 'Unknown'}

${this.getImportanceBreakdown(filteredFiles)}

${this.getLanguageBreakdown(filteredFiles)}

## Generated Diagrams
- **High-level architecture** - Overview of main components and entry points
- **Semi-detailed architecture** - Module relationships and data flow  
- **Detailed architecture** - All processed files and their dependencies

**Formats:** D2 (.d2) and Eraser (.eraser) for each level
- View .d2 files with VS Code D2 extension or at https://play.d2lang.com
- View .eraser files at https://app.eraser.io

## Language-Specific Architecture
Primary language **${metadata.detectedLanguages[0]}** detected - diagrams include:
${this.getLanguageFeatures(metadata.detectedLanguages[0])}
`;
        
        await writeFile(paths.summary, report, 'utf8');
    }
    
    /**
     * Get language-specific features description
     */
    private static getLanguageFeatures(language: string): string {
        const features = {
            vue: '- Vue components and their relationships\n- Vue Router navigation structure\n- State management (Pinia/Vuex)\n- API services and utilities\n- CSS/SCSS styling architecture',
            react: '- React components hierarchy\n- Custom hooks and their usage\n- Context providers and state\n- Service layer architecture\n- Component relationships',
            typescript: '- Module imports and exports\n- Type definitions and interfaces\n- Service layer architecture\n- Configuration and utilities\n- Test coverage structure',
            javascript: '- Module dependencies\n- Function and object relationships\n- Service and utility layers\n- Configuration structure\n- Build and tooling setup',
            python: '- Module and package structure\n- Class inheritance and composition\n- Function call hierarchies\n- Django/Flask app architecture\n- Data models and views'
        };
        
        return features[language?.toLowerCase() as keyof typeof features] || 
               '- Core module structure\n- Dependency relationships\n- Configuration and utilities\n- Application architecture layers';
    }
    
    /**
     * Generate high-level diagrams using LLM
     */
    private static async generateHighLevelDiagrams(metadata: Swark55ProcessedMetadata, paths: Swark55OutputPaths): Promise<void> {
        const criticalFiles = metadata.filteredFiles.filter(f => f.importance === 'critical-entry-point');
        const coreFiles = metadata.filteredFiles.filter(f => f.importance === 'core-module');
        
        const importantFiles = [...criticalFiles, ...coreFiles.slice(0, 5)];
        
        const d2Request: DiagramRequest = {
            metadata,
            files: importantFiles,
            level: 'high-level',
            format: 'd2'
        };
        
        const eraserRequest: DiagramRequest = {
            ...d2Request,
            format: 'eraser'
        };
        
        const [d2Content, eraserContent] = await Promise.all([
            LLMDiagramGenerator.generateDiagram(d2Request),
            LLMDiagramGenerator.generateDiagram(eraserRequest)
        ]);
        
        await Promise.all([
            writeFile(paths.highLevelD2, d2Content, 'utf8'),
            writeFile(paths.highLevelEraser, eraserContent, 'utf8')
        ]);
    }
    
    /**
     * Generate semi-detailed diagrams using LLM
     */
    private static async generateSemiDetailedDiagrams(metadata: Swark55ProcessedMetadata, paths: Swark55OutputPaths): Promise<void> {
        const importantFiles = metadata.filteredFiles.filter(f => 
            f.importance === 'critical-entry-point' || f.importance === 'core-module'
        );
        
        const d2Request: DiagramRequest = {
            metadata,
            files: importantFiles,
            level: 'semi-detailed',
            format: 'd2'
        };
        
        const eraserRequest: DiagramRequest = {
            ...d2Request,
            format: 'eraser'
        };
        
        const [d2Content, eraserContent] = await Promise.all([
            LLMDiagramGenerator.generateDiagram(d2Request),
            LLMDiagramGenerator.generateDiagram(eraserRequest)
        ]);
        
        await Promise.all([
            writeFile(paths.semiDetailedD2, d2Content, 'utf8'),
            writeFile(paths.semiDetailedEraser, eraserContent, 'utf8')
        ]);
    }
    
    /**
     * Generate detailed diagrams using LLM
     */
    private static async generateDetailedDiagrams(metadata: Swark55ProcessedMetadata, paths: Swark55OutputPaths): Promise<void> {
        const d2Request: DiagramRequest = {
            metadata,
            files: metadata.filteredFiles,
            level: 'detailed',
            format: 'd2'
        };
        
        const eraserRequest: DiagramRequest = {
            ...d2Request,
            format: 'eraser'
        };
        
        const [d2Content, eraserContent] = await Promise.all([
            LLMDiagramGenerator.generateDiagram(d2Request),
            LLMDiagramGenerator.generateDiagram(eraserRequest)
        ]);
        
        await Promise.all([
            writeFile(paths.detailedD2, d2Content, 'utf8'),
            writeFile(paths.detailedEraser, eraserContent, 'utf8')
        ]);
    }
    
    /**
     * Generate intelligent D2 diagram based on detected languages
     */
    private static async generateIntelligentD2Diagram(
        metadata: Swark55ProcessedMetadata, 
        files: Swark55ProcessedMetadata['filteredFiles'], 
        level: string
    ): Promise<string> {
        try {
            // Always use language-specific diagram generation
            const languageSpecificDiagram = this.generateLanguageSpecificDiagram(metadata, level);
            
            // If we have files, try to enhance with LLM
            if (files.length > 0) {
                try {
                    const prompt = this.buildEnhancedD2Prompt(metadata, files, level);
                    const model = await ModelInteractor.getModel();
                    const response = await ModelInteractor.sendPrompt(model, [vscode.LanguageModelChatMessage.User(prompt)]);
                    
                    const llmDiagram = this.extractDiagramFromResponse(response, 'd2');
                    
                    // Use LLM diagram if it's substantial, otherwise use language-specific
                    if (llmDiagram.length > 200 && llmDiagram.includes('->')) {
                        return llmDiagram;
                    }
                } catch (llmError) {
                    console.warn('LLM diagram generation failed, using language-specific fallback:', llmError);
                }
            }
            
            return languageSpecificDiagram;
        } catch (error) {
            console.error('Error generating D2 diagram:', error);
            return this.generateLanguageSpecificDiagram(metadata, level);
        }
    }
    
    /**
     * Generate language-specific diagram based on detected languages and actual files
     */
    private static generateLanguageSpecificDiagram(metadata: Swark55ProcessedMetadata, level: string): string {
        const primaryLanguage = metadata.detectedLanguages[0]?.toLowerCase() || 'unknown';
        
        let diagram = `# ${level.toUpperCase()} ${primaryLanguage.toUpperCase()} Architecture\n`;
        diagram += `# Repository: ${path.basename(metadata.repositoryPath)}\n`;
        diagram += `# Commit: ${metadata.selectedCommit.shortHash}\n`;
        diagram += `# Files Analyzed: ${metadata.filteredFiles.length}\n`;
        diagram += `# Languages: ${metadata.detectedLanguages.join(', ')}\n\n`;
        diagram += `direction: right\n\n`;
        
        // Add actual file analysis if we have files
        if (metadata.filteredFiles.length > 0) {
            diagram += this.generateActualFileArchitecture(metadata, level);
        } else {
            // Fallback to generic language architecture
            switch (primaryLanguage) {
                case 'vue':
                    diagram += this.generateVueArchitecture();
                    break;
                case 'react':
                    diagram += this.generateReactArchitecture();
                    break;
                case 'typescript':
                case 'javascript':
                    diagram += this.generateJSArchitecture();
                    break;
                case 'python':
                    diagram += this.generatePythonArchitecture();
                    break;
                default:
                    diagram += this.generateGenericArchitecture();
            }
        }
        
        return diagram;
    }
    
    /**
     * Generate architecture based on actual analyzed files
     */
    private static generateActualFileArchitecture(metadata: Swark55ProcessedMetadata, level: string): string {
        const entryPoints = metadata.filteredFiles.filter(f => f.importance === 'critical-entry-point');
        const coreModules = metadata.filteredFiles.filter(f => f.importance === 'core-module');
        const utilities = metadata.filteredFiles.filter(f => f.importance === 'supporting-utility');
        
        let diagram = '';
        
        // Entry points
        if (entryPoints.length > 0) {
            diagram += '# Entry Points\n';
            entryPoints.slice(0, 5).forEach((file, idx) => {
                const name = this.sanitizeName(path.basename(file.path, path.extname(file.path)));
                diagram += `${name}: "${path.basename(file.path)}" {\n`;
                diagram += `  shape: hexagon\n`;
                diagram += `  style.fill: "#4fc08d"\n`;
                diagram += `  style.stroke: "#2c3e50"\n`;
                diagram += `}\n\n`;
            });
        }
        
        // Core modules
        if (coreModules.length > 0) {
            diagram += '# Core Modules\n';
            coreModules.slice(0, level === 'detailed' ? 10 : 5).forEach((file, idx) => {
                const name = this.sanitizeName(path.basename(file.path, path.extname(file.path)));
                diagram += `${name}: "${path.basename(file.path)}" {\n`;
                diagram += `  shape: rectangle\n`;
                diagram += `  style.fill: "#41b883"\n`;
                diagram += `  style.stroke: "#2c3e50"\n`;
                diagram += `}\n\n`;
            });
        }
        
        // Supporting utilities (only for detailed view)
        if (level === 'detailed' && utilities.length > 0) {
            diagram += '# Utilities\n';
            utilities.slice(0, 5).forEach((file, idx) => {
                const name = this.sanitizeName(path.basename(file.path, path.extname(file.path)));
                diagram += `${name}: "${path.basename(file.path)}" {\n`;
                diagram += `  shape: rectangle\n`;
                diagram += `  style.fill: "#ab47bc"\n`;
                diagram += `  style.stroke: "#2c3e50"\n`;
                diagram += `}\n\n`;
            });
        }
        
        // Add relationships
        if (entryPoints.length > 0 && coreModules.length > 0) {
            diagram += '# Relationships\n';
            entryPoints.slice(0, 3).forEach(entry => {
                const entryName = this.sanitizeName(path.basename(entry.path, path.extname(entry.path)));
                coreModules.slice(0, 3).forEach(core => {
                    const coreName = this.sanitizeName(path.basename(core.path, path.extname(core.path)));
                    diagram += `${entryName} -> ${coreName}: "uses"\n`;
                });
            });
        }
        
        return diagram;
    }
    
    /**
     * Sanitize name for D2 diagram
     */
    private static sanitizeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    }
    
    /**
     * Generate Vue.js specific architecture
     */
    private static generateVueArchitecture(): string {
        return `# Vue.js Application Architecture
app: Vue Application {
  shape: hexagon
  style.fill: "#4fc08d"
  style.stroke: "#2c3e50"
}

components: Vue Components {
  shape: rectangle
  style.fill: "#41b883"
  style.stroke: "#2c3e50"
}

router: Vue Router {
  shape: rectangle
  style.fill: "#35495e"
  style.stroke: "#2c3e50"
}

store: State Management {
  shape: rectangle
  style.fill: "#ff6b6b"
  style.stroke: "#2c3e50"
}

api: API Services {
  shape: rectangle
  style.fill: "#ffa726"
  style.stroke: "#2c3e50"
}

utils: Utilities {
  shape: rectangle
  style.fill: "#ab47bc"
  style.stroke: "#2c3e50"
}

# Relationships
app -> components: "renders"
app -> router: "navigation"
components -> store: "state management"
components -> api: "data fetching"
router -> components: "route components"`;
    }
    
    /**
     * Generate React architecture
     */
    private static generateReactArchitecture(): string {
        return `# React Application Architecture
app: React Application {
  shape: hexagon
  style.fill: "#61dafb"
  style.stroke: "#20232a"
}

components: React Components {
  shape: rectangle
  style.fill: "#282c34"
  style.stroke: "#61dafb"
}

hooks: Custom Hooks {
  shape: rectangle
  style.fill: "#ff6b6b"
  style.stroke: "#20232a"
}

context: Context Providers {
  shape: rectangle
  style.fill: "#4ecdc4"
  style.stroke: "#20232a"
}

services: API Services {
  shape: rectangle
  style.fill: "#ffa726"
  style.stroke: "#20232a"
}

# Relationships
app -> components: "renders"
components -> hooks: "uses"
components -> context: "consumes"
components -> services: "data fetching"`;
    }
    
    /**
     * Generate TypeScript/JavaScript architecture
     */
    private static generateJSArchitecture(): string {
        return `# TypeScript/JavaScript Application
app: Main Application {
  shape: hexagon
  style.fill: "#3178c6"
  style.stroke: "#ffffff"
}

modules: Core Modules {
  shape: rectangle
  style.fill: "#f7df1e"
  style.stroke: "#000000"
}

types: Type Definitions {
  shape: rectangle
  style.fill: "#007acc"
  style.stroke: "#ffffff"
}

utils: Utilities {
  shape: rectangle
  style.fill: "#ff6b6b"
  style.stroke: "#ffffff"
}

config: Configuration {
  shape: rectangle
  style.fill: "#26a69a"
  style.stroke: "#ffffff"
}

# Relationships
app -> modules: "imports"
modules -> types: "type safety"
modules -> utils: "helper functions"
config -> app: "configuration"`;
    }
    
    /**
     * Generate Python architecture
     */
    private static generatePythonArchitecture(): string {
        return `# Python Application
app: Main Application {
  shape: hexagon
  style.fill: "#3776ab"
  style.stroke: "#ffd43b"
}

modules: Core Modules {
  shape: rectangle
  style.fill: "#306998"
  style.stroke: "#ffd43b"
}

models: Data Models {
  shape: rectangle
  style.fill: "#4b8bbe"
  style.stroke: "#ffd43b"
}

utils: Utilities {
  shape: rectangle
  style.fill: "#646464"
  style.stroke: "#ffd43b"
}

# Relationships
app -> modules: "imports"
modules -> models: "data handling"
modules -> utils: "helper functions"`;
    }
    
    /**
     * Generate generic architecture for unknown languages
     */
    private static generateGenericArchitecture(): string {
        return `# Application Architecture
app: Main Application {
  shape: hexagon
  style.fill: "#6c5ce7"
  style.stroke: "#ffffff"
}

core: Core Modules {
  shape: rectangle
  style.fill: "#74b9ff"
  style.stroke: "#ffffff"
}

data: Data Layer {
  shape: rectangle
  style.fill: "#00b894"
  style.stroke: "#ffffff"
}

config: Configuration {
  shape: rectangle
  style.fill: "#fdcb6e"
  style.stroke: "#000000"
}

utils: Utilities {
  shape: rectangle
  style.fill: "#e17055"
  style.stroke: "#ffffff"
}

# Relationships
app -> core: "uses"
core -> data: "accesses"
config -> app: "configures"
utils -> core: "supports"`;
    }
    
    /**
     * Build enhanced D2 prompt with better language context
     */
    private static buildEnhancedD2Prompt(
        metadata: Swark55ProcessedMetadata, 
        files: Swark55ProcessedMetadata['filteredFiles'], 
        level: string
    ): string {
        const primaryLanguage = metadata.detectedLanguages[0] || 'unknown';
        
        return `Generate a professional ${level} D2 diagram for this ${primaryLanguage} project.

**Project Details:**
- Primary Language: ${primaryLanguage}
- Repository: ${path.basename(metadata.repositoryPath)}
- Files analyzed: ${files.length}

**Key Files:**
${files.slice(0, 10).map(f => {
    const relativePath = path.relative(metadata.repositoryPath, f.path);
    return `- ${relativePath} (${f.language}, ${f.importance})`;
}).join('\n')}

**Requirements:**
- Use clear D2 syntax with shapes, colors, and relationships
- Focus on ${level === 'high-level' ? 'main components' : level === 'semi-detailed' ? 'module relationships' : 'detailed file dependencies'}
- Include proper styling (shape, style.fill, style.stroke)
- Show realistic connections between components
- Use ${primaryLanguage}-specific terminology

Return ONLY the D2 code with no explanations.`;
    }
    
    /**
     * Generate Eraser diagram
     */
    private static async generateEraserDiagram(
        metadata: Swark55ProcessedMetadata, 
        files: Swark55ProcessedMetadata['filteredFiles'], 
        level: string
    ): Promise<string> {
        try {
            const prompt = this.buildEraserPrompt(metadata, files, level);
            const model = await ModelInteractor.getModel();
            const response = await ModelInteractor.sendPrompt(model, [vscode.LanguageModelChatMessage.User(prompt)]);
            
            return this.extractDiagramFromResponse(response, 'eraser');
        } catch (error) {
            console.error('Error generating Eraser diagram:', error);
            return this.getFallbackEraserDiagram(metadata, files, level);
        }
    }
    
    /**
     * Build Eraser diagram prompt
     */
    private static buildEraserPrompt(
        metadata: Swark55ProcessedMetadata, 
        files: Swark55ProcessedMetadata['filteredFiles'], 
        level: string
    ): string {
        return `Generate a ${level} Eraser diagram for this ${metadata.detectedLanguages[0]} project.

**Files (${files.length}):**
${files.slice(0, 15).map(f => {
    const relativePath = path.relative(metadata.repositoryPath, f.path);
    return `${relativePath} (${f.importance})`;
}).join('\n')}

Create a clear architectural diagram showing component relationships and data flow.
Return only the Eraser code.`;
    }
    
    /**
     * Extract diagram code from LLM response
     */
    private static extractDiagramFromResponse(response: string, format: 'd2' | 'eraser'): string {
        // Try to extract code block
        const codeBlockRegex = new RegExp(`\`\`\`(?:${format})?\n([\\s\\S]*?)\n\`\`\``, 'i');
        const match = response.match(codeBlockRegex);
        
        if (match) {
            return match[1].trim();
        }
        
        // Fallback: return the whole response cleaned up
        return response.trim();
    }
    
    /**
     * Generate fallback Eraser diagram
     */
    private static getFallbackEraserDiagram(
        metadata: Swark55ProcessedMetadata, 
        files: Swark55ProcessedMetadata['filteredFiles'], 
        level: string
    ): string {
        const entryPoints = files.filter(f => f.importance === 'critical-entry-point');
        const coreModules = files.filter(f => f.importance === 'core-module');
        
        return `title: ${level.toUpperCase()} Architecture - ${metadata.selectedCommit.shortHash}

// Entry Points
${entryPoints.map(f => {
    const name = path.basename(f.path, path.extname(f.path));
    return `${name} [icon: browser-alt]`;
}).join('\n')}

// Core Modules  
${coreModules.slice(0, level === 'detailed' ? coreModules.length : 5).map(f => {
    const name = path.basename(f.path, path.extname(f.path));
    return `${name} [icon: server]`;
}).join('\n')}

// Relationships
${entryPoints.map(entry => {
    const entryName = path.basename(entry.path, path.extname(entry.path));
    return coreModules.slice(0, 3).map(core => {
        const coreName = path.basename(core.path, path.extname(core.path));
        return `${entryName} > ${coreName}`;
    }).join('\n');
}).join('\n')}`;
    }
    
    /**
     * Get breakdown by file importance
     */
    private static getImportanceBreakdown(files: Swark55ProcessedMetadata['filteredFiles']): string {
        const breakdown = files.reduce((acc, file) => {
            acc[file.importance] = (acc[file.importance] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        let result = '## File Importance Breakdown\n';
        result += Object.entries(breakdown)
            .map(([importance, count]) => `- **${importance}**: ${count} files`)
            .join('\n');
        
        return result;
    }
    
    /**
     * Get breakdown by language
     */
    private static getLanguageBreakdown(files: Swark55ProcessedMetadata['filteredFiles']): string {
        const breakdown = files.reduce((acc, file) => {
            acc[file.language] = (acc[file.language] || 0) + file.finalTokens;
            return acc;
        }, {} as Record<string, number>);
        
        let result = '## Language Token Breakdown\n';
        result += Object.entries(breakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([language, tokens]) => `- **${language}**: ${tokens.toLocaleString()} tokens`)
            .join('\n');
            
        return result;
    }
}
