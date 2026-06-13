import * as vscode from 'vscode';
import * as path from 'path';
import { ModelInteractor } from './model-interactor';
import { Swark55ProcessedMetadata } from '../io/swark55-content-filter';

export interface DiagramRequest {
    metadata: Swark55ProcessedMetadata;
    files: Array<{
        path: string;
        importance: string;
        language: string;
        size: number;
        finalTokens: number;
    }>;
    level: 'high-level' | 'semi-detailed' | 'detailed';
    format: 'd2' | 'eraser';
}

export class LLMDiagramGenerator {
    /**
     * Generate intelligent architecture diagram using LLM
     */
    public static async generateDiagram(request: DiagramRequest): Promise<string> {
        try {
            const model = await ModelInteractor.getModel();
            const prompt = this.buildDiagramPrompt(request);
            
            const response = await ModelInteractor.sendPrompt(model, [
                vscode.LanguageModelChatMessage.User(prompt)
            ]);
            
            const diagram = this.extractDiagramFromResponse(response, request.format);
            
            // Validate the diagram has meaningful content
            if (this.validateDiagram(diagram, request.format)) {
                return diagram;
            } else {
                throw new Error('Generated diagram does not meet quality standards');
            }
            
        } catch (error) {
            console.warn('LLM diagram generation failed:', error);
            return this.generateFallbackDiagram(request);
        }
    }
    
    /**
     * Build comprehensive diagram generation prompt
     */
    private static buildDiagramPrompt(request: DiagramRequest): string {
        const { metadata, files, level, format } = request;
        const { detectedLanguages, repositoryPath } = metadata;
        
        const filesByImportance = this.categorizeFilesByImportance(files);
        const languageContext = this.buildLanguageContext(detectedLanguages);
        const levelInstructions = this.getLevelInstructions(level);
        const formatInstructions = this.getFormatInstructions(format);
        
        return `You are an expert software architect creating ${format.toUpperCase()} diagrams for a ${detectedLanguages.join('/')} codebase.

**Project Context:**
- Repository: ${repositoryPath.split(/[/\\]/).pop()}
- Languages: ${detectedLanguages.join(', ')}
- Files analyzed: ${files.length}
- Architecture level: ${level}

${languageContext}

**File Analysis:**
${this.formatFileAnalysis(filesByImportance, repositoryPath)}

**Diagram Requirements:**
${levelInstructions}

**${format.toUpperCase()} Format Guidelines:**
${formatInstructions}

**Output Requirements:**
1. Generate ONLY the ${format} diagram code
2. No explanatory text before or after the diagram
3. Include proper styling and visual hierarchy
4. Use meaningful component names based on actual files
5. Show data flow and dependencies where relevant
6. Make it visually clear and professional

Generate the ${format} diagram now:`;
    }
    
    /**
     * Build language-specific context
     */
    private static buildLanguageContext(languages: string[]): string {
        const languagePatterns: { [key: string]: string } = {
            'vue': 'Vue.js application with components, stores, router, and services',
            'react': 'React application with components, hooks, context, and services', 
            'angular': 'Angular application with modules, components, services, and guards',
            'typescript': 'TypeScript application with modules, classes, interfaces, and services',
            'javascript': 'JavaScript application with modules, functions, and services',
            'python': 'Python application with modules, classes, packages, and services',
            'java': 'Java application with packages, classes, interfaces, and services',
            'go': 'Go application with packages, modules, structs, and interfaces',
            'rust': 'Rust application with crates, modules, structs, and traits',
            'php': 'PHP application with namespaces, classes, and services'
        };
        
        const contexts = languages.map(lang => 
            languagePatterns[lang] || `${lang} application with standard architecture patterns`
        );
        
        return `**Architecture Context:**\n${contexts.join('\n')}`;
    }
    
    /**
     * Get level-specific instructions
     */
    private static getLevelInstructions(level: string): string {
        switch (level) {
            case 'high-level':
                return `- Show only critical entry points and core modules
- Focus on main application flow and key components  
- Abstract away implementation details
- Highlight primary language/framework patterns
- Maximum 8-12 components`;
                
            case 'semi-detailed':
                return `- Include core modules and supporting utilities
- Show module relationships and data flow
- Include key configuration and service layers
- Balance detail with readability
- Maximum 15-20 components`;
                
            case 'detailed':
                return `- Include all significant files and components
- Show detailed relationships and dependencies
- Include utilities, configs, and support files
- Organize by logical groupings (features/layers)
- Can include 20+ components if well organized`;
                
            default:
                return '- Create a balanced architectural overview';
        }
    }
    
    /**
     * Get format-specific instructions
     */
    private static getFormatInstructions(format: string): string {
        if (format === 'd2') {
            return `**D2 Syntax:**
- Use shape types: rectangle, circle, cylinder, diamond, oval
- Connect with arrows: component1 -> component2
- Group with containers: group { component1; component2 }
- Style with: component.style.fill: "#color"
- Add labels: component: "Label Text"
- Use classes for consistent styling

**Example Structure:**
\`\`\`
title: Application Architecture

frontend: Frontend {
  shape: rectangle
  style.fill: "#e1f5fe"
}

backend: Backend {
  shape: rectangle  
  style.fill: "#f3e5f5"
}

frontend -> backend: API Requests
\`\`\``;
        } else {
            return `**Eraser Syntax:**
- Use cloud diagrams with connected nodes
- Format: [Component Name] -> [Another Component]
- Group related components together
- Use clear, descriptive names
- Show data flow and relationships

**Example Structure:**
\`\`\`
// Application Architecture
[Frontend App] -> [API Gateway]
[API Gateway] -> [Backend Services]
[Backend Services] -> [Database]
\`\`\``;
        }
    }
    
    /**
     * Categorize files by importance
     */
    private static categorizeFilesByImportance(files: any[]): { [key: string]: any[] } {
        return files.reduce((acc, file) => {
            const importance = file.importance || 'low-priority';
            if (!acc[importance]) acc[importance] = [];
            acc[importance].push(file);
            return acc;
        }, {} as { [key: string]: any[] });
    }
    
    /**
     * Format file analysis for prompt
     */
    private static formatFileAnalysis(filesByImportance: { [key: string]: any[] }, repositoryPath: string): string {
        let analysis = '';
        
        const importanceOrder = ['critical-entry-point', 'core-module', 'supporting-utility', 'low-priority'];
        
        for (const importance of importanceOrder) {
            const files = filesByImportance[importance] || [];
            if (files.length === 0) continue;
            
            analysis += `\n**${importance.replace('-', ' ').toUpperCase()}** (${files.length} files):\n`;
            
            // Show top files for each category
            const topFiles = files
                .sort((a, b) => b.finalTokens - a.finalTokens)
                .slice(0, importance === 'critical-entry-point' ? 10 : 5);
                
            for (const file of topFiles) {
                const relativePath = path.relative(repositoryPath, file.path);
                analysis += `- ${relativePath} (${file.language}, ${file.finalTokens} tokens)\n`;
            }
        }
        
        return analysis;
    }
    
    /**
     * Extract diagram from LLM response
     */
    private static extractDiagramFromResponse(response: string, format: string): string {
        // Try to extract code blocks first
        const codeBlockRegex = new RegExp(`\`\`\`(?:${format})?([\\s\\S]*?)\`\`\``, 'i');
        const codeMatch = response.match(codeBlockRegex);
        
        if (codeMatch) {
            return codeMatch[1].trim();
        }
        
        // If no code blocks, try to extract the diagram content
        const lines = response.split('\\n');
        let diagramStart = -1;
        let diagramEnd = -1;
        
        // Look for diagram markers
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toLowerCase();
            if (format === 'd2' && (line.includes('title:') || line.includes('->') || line.includes('shape:'))) {
                if (diagramStart === -1) diagramStart = i;
                diagramEnd = i;
            } else if (format === 'eraser' && (line.includes('[') && line.includes(']') && line.includes('->'))) {
                if (diagramStart === -1) diagramStart = i;
                diagramEnd = i;
            }
        }
        
        if (diagramStart !== -1) {
            return lines.slice(diagramStart, diagramEnd + 1).join('\\n').trim();
        }
        
        // Fallback: return the whole response if it looks like a diagram
        if (format === 'd2' && response.includes('->')) {
            return response.trim();
        }
        if (format === 'eraser' && response.includes('[') && response.includes(']')) {
            return response.trim();
        }
        
        return response.trim();
    }
    
    /**
     * Validate diagram quality
     */
    private static validateDiagram(diagram: string, format: string): boolean {
        if (!diagram || diagram.length < 50) return false;
        
        if (format === 'd2') {
            // D2 should have arrows and components
            return diagram.includes('->') && (
                diagram.includes(':') || 
                diagram.includes('shape:') || 
                diagram.includes('style.')
            );
        } else {
            // Eraser should have bracketed components and arrows
            return diagram.includes('->') && 
                   diagram.includes('[') && 
                   diagram.includes(']');
        }
    }
    
    /**
     * Generate fallback diagram when LLM fails
     */
    private static generateFallbackDiagram(request: DiagramRequest): string {
        const { metadata, files, format } = request;
        const entryPoints = files.filter(f => f.importance === 'critical-entry-point');
        const coreModules = files.filter(f => f.importance === 'core-module');
        
        if (format === 'd2') {
            return this.generateFallbackD2(metadata, entryPoints, coreModules);
        } else {
            return this.generateFallbackEraser(metadata, entryPoints, coreModules);
        }
    }
    
    /**
     * Generate fallback D2 diagram
     */
    private static generateFallbackD2(metadata: any, entryPoints: any[], coreModules: any[]): string {
        const title = `${metadata.detectedLanguages[0] || 'Application'} Architecture`;
        
        let diagram = `title: ${title}\\n\\n`;
        
        // Add entry points
        entryPoints.slice(0, 3).forEach((file, i) => {
            const relativePath = path.relative(metadata.repositoryPath, file.path);
            diagram += `entry_${i}: ${path.basename(relativePath)} {\\n`;
            diagram += `  shape: circle\\n`;
            diagram += `  style.fill: "#4CAF50"\\n`;
            diagram += `}\\n\\n`;
        });
        
        // Add core modules
        coreModules.slice(0, 5).forEach((file, i) => {
            const relativePath = path.relative(metadata.repositoryPath, file.path);
            diagram += `core_${i}: ${path.basename(relativePath)} {\\n`;
            diagram += `  shape: rectangle\\n`;
            diagram += `  style.fill: "#2196F3"\\n`;
            diagram += `}\\n\\n`;
        });
        
        // Add connections
        if (entryPoints.length > 0 && coreModules.length > 0) {
            diagram += `entry_0 -> core_0: calls\\n`;
        }
        
        return diagram;
    }
    
    /**
     * Generate fallback Eraser diagram
     */
    private static generateFallbackEraser(metadata: any, entryPoints: any[], coreModules: any[]): string {
        let diagram = `// ${metadata.detectedLanguages[0] || 'Application'} Architecture\\n\\n`;
        
        const entryName = entryPoints[0] ? path.basename(path.relative(metadata.repositoryPath, entryPoints[0].path)) : 'Entry Point';
        const coreName = coreModules[0] ? path.basename(path.relative(metadata.repositoryPath, coreModules[0].path)) : 'Core Module';
        
        diagram += `[${entryName}] -> [${coreName}]\\n`;
        
        if (coreModules.length > 1) {
            const secondCore = path.basename(path.relative(metadata.repositoryPath, coreModules[1].path));
            diagram += `[${coreName}] -> [${secondCore}]\\n`;
        }
        
        return diagram;
    }
}
