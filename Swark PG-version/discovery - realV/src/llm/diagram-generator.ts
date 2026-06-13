// import * as vscode from "vscode";
// import * as path from "path";
// import { ModelInteractor } from "./model-interactor";
// import {
//   FilteredFileInfo,
//   Swark55ProcessedMetadata,
// } from "../io/swark55-content-filter";

// export interface DiagramRequest {
//   metadata: Swark55ProcessedMetadata;
//   files: Array<{
//     path: string;
//     importance: string;
//     language: string;
//     size: number;
//     finalTokens: number;
//   }>;
//   level: "high-level" | "semi-detailed" | "detailed";
//   format: "d2" | "eraser";
// }

// export class LLMDiagramGenerator {
//   /**
//    * Generate intelligent architecture diagram using LLM
//    */
//   public static async generateDiagram(
//     request: DiagramRequest
//   ): Promise<string> {
//     try {
//       const model = await ModelInteractor.getModel();
//       const prompt = this.buildDiagramPrompt(request);
//       console.log("Diagram generation prompt:", prompt);
//       const response = await ModelInteractor.sendPrompt(model, [
//         vscode.LanguageModelChatMessage.User(prompt),
//       ]);

//       const diagram = this.extractDiagramFromResponse(response, request.format);

//       // Validate the diagram has meaningful content
//       if (this.validateDiagram(diagram, request.format)) {
//         return diagram;
//       } else {
//         throw new Error("Generated diagram does not meet quality standards");
//       }
//     } catch (error) {
//       console.warn("LLM diagram generation failed:", error);
//       return this.generateFallbackDiagram(request);
//     }
//   }

//   /**
//    * Build comprehensive diagram generation prompt
//    */
//   private static buildDiagramPrompt(request: DiagramRequest): string {
//     const { metadata, files, level, format } = request;
//     const { detectedLanguages, repositoryPath, filteredFiles } = metadata;

//     const fileContent = filteredFiles
//       .map((f: FilteredFileInfo) =>
//         f.filteredContent ? f.filteredContent : ""
//       )
//       .join("\n\n");
//     const filesByImportance = this.categorizeFilesByImportance(files);
//     const languageContext = this.buildLanguageContext(detectedLanguages);
//     const levelInstructions = this.getLevelInstructions(level);
//     const formatInstructions = this.getFormatInstructions(format, level);
//     let prompt = `You are an expert software architect creating ${format.toUpperCase()} diagrams for a ${detectedLanguages.join(
//       "/"
//     )} codebase.

// ## Repository Context:
// - **Repository**: ${repositoryPath.split(/[/\\]/).pop()}
// - **Languages: ${detectedLanguages.join(", ")}
// - **Selected Files**: ${files.length}
// - **Analysis Level**: ${level}

// **File Analysis:**
// ${this.formatFileAnalysis(filesByImportance, repositoryPath)}

// **Diagram Requirements:**
// ${levelInstructions}

// **${format.toUpperCase()} Format Guidelines:**
// ${formatInstructions}

// **Output Requirements:**
// 1. Generate ONLY the ${format} diagram code
// 2. No explanatory text before or after the diagram
// 3. Include proper styling and visual hierarchy
// 4. Use meaningful component names based on actual files
// 5. Show data flow and dependencies where relevant
// 6. Make it visually clear and professional

// Generate the ${format} diagram now:`;

//     if (format === "d2") {
//       return this.buildD2Prompt(request, fileContent);
//     } else {
//       return prompt;
//     }
//   }

//   private static buildD2Prompt(
//     request: DiagramRequest,
//     fileContent: string
//   ): string {
//     console.log(fileContent.length);
//     const { metadata, files, level, format } = request;
//     const { detectedLanguages, repositoryPath, filteredFiles } = metadata;
//     return `# Swark 4.0: D2 Diagram Generation - ${level.toUpperCase()}

// ## Repository Context
// - **Repository**: ${repositoryPath}
// - **Analysis Level**: ${level}
// - **Languages Detected**: ${detectedLanguages.join(", ")}
// - **Selected Files**: ${filteredFiles.length}

// ## Selected Files Content
// ${fileContent}

// ## Task: Generate a valid D2 diagram
// Create a **syntactically valid D2 diagram** that visualizes the architecture at the **${level}** level.

// ### D2 Diagram Requirements:
// 1. **Components**: Identify and represent all major components, classes, modules
// 2. **Relationships**: Show dependencies, inheritance, composition, and data flow
// 3. **Grouping**: Use containers to group related components
// 4. **Styling**: Apply appropriate colors and styles for clarity
// 5. **Labels**: Include meaningful labels and descriptions

// ### ✅ D2 Diagram Rules (must follow strictly)
// 1. **Shapes allowed**:
//    - \`rectangle\`, \`ellipse\`, \`cylinder\`, \`text\` only.
//    - ❌ Do NOT invent custom shapes (like "file" or "service").

// 2. **Connections**:
//    - Every connection must have a valid source and destination.
//    - Use \`A -> B: "label"\` (never leave source or destination empty).

// 3. **Containers**:
//    - Use \`container: "Name" { ... }\` for grouping related components.

// 4. **Labels & Tooltips**:
//    - Always provide a readable \`label\` for nodes.
//    - Optional: \`tooltip\` for clarifications.

// 5. **Styling**:
//    - Allowed: \`style.fill\`, \`style.stroke\`, \`style.dashed\`.
//    - For styles, always use a nested block:**
//   \`\`\`
//   style: {
//     fill: "#hex"
//     stroke: "#hex"
//   }
//   \`\`\`
//   - ❌ Never use \`style.fill =\` or \`style.stroke =\`
//   - ❌ Do NOT use unsupported attributes.

// 6. **Imports & external references**:
//    - ❌ Do NOT use \`import\` in D2.
//    - All diagram content must be self-contained.

// 7. **Formatting**:
//    - Wrap final answer in a fenced D2 code block:
//      \`\`\`d2
//      ...your diagram...
//      \`\`\`
//    - No extra commentary or markdown outside the block.

// ### Analysis Level Focus:
// ${this.getD2LevelGuidance(level)}

// **Output Format:**
// \`\`\`d2
// [Your D2 diagram code here]
// \`\`\`

// **Important**:
// - Generate ONLY the D2 code, no additional explanation
// - Focus on the most important architectural elements for this analysis level
// - Ensure the diagram is readable and well-organized
// - Use the file content analysis to create accurate relationships
// - Do not include explanations.
// - Do not generate placeholder or invalid shapes.
// - Ensure the diagram is minimal, consistent, and valid D2.  `;
//   }

//   private static getD2LevelGuidance(level: string): string {
//     const guidance = {
//       "high-level":
//         "Focus on major system boundaries, main components, and high-level data flows. Use containers to group related functionality.",
//       "semi-detailed":
//         "Include module-level components, key classes, and their interactions. Show important design patterns and architectural decisions.",
//       detailed:
//         "Comprehensive view including detailed class relationships, method calls, and implementation dependencies. Show complete component hierarchy.",
//     };

//     return guidance[level as keyof typeof guidance] || guidance["high-level"];
//   }
//   /**
//    * Build language-specific context
//    */

//   //not in use currently
//   private static buildLanguageContext(languages: string[]): string {
//     const languagePatterns: { [key: string]: string } = {
//       vue: "Vue.js application with components, stores, router, and services",
//       react: "React application with components, hooks, context, and services",
//       angular:
//         "Angular application with modules, components, services, and guards",
//       typescript:
//         "TypeScript application with modules, classes, interfaces, and services",
//       javascript:
//         "JavaScript application with modules, functions, and services",
//       python:
//         "Python application with modules, classes, packages, and services",
//       java: "Java application with packages, classes, interfaces, and services",
//       go: "Go application with packages, modules, structs, and interfaces",
//       rust: "Rust application with crates, modules, structs, and traits",
//       php: "PHP application with namespaces, classes, and services",
//     };

//     const contexts = languages.map(
//       (lang) =>
//         languagePatterns[lang] ||
//         `${lang} application with standard architecture patterns`
//     );

//     return `**Architecture Context:**\n${contexts.join("\n")}`;
//   }

//   /**
//    * Get level-specific instructions
//    */

//   /** `- Show only critical entry points and core modules
// - Focus on main application flow and key components
// - Abstract away implementation details
// - Highlight primary language/framework patterns
// - Maximum 8-12 components`;

// - Include core modules and supporting utilities
// - Show module relationships and data flow
// - Include key configuration and service layers
// - Balance detail with readability
// - Maximum 15-20 components

// `- Include all significant files and components
// - Show detailed relationships and dependencies
// - Include utilities, configs, and support files
// - Organize by logical groupings (features/layers)
// - Can include 20+ components if well organized`;
//  */

//   private static getLevelInstructions(level: string): string {
//     switch (level) {
//       case "high-level":
//         return `Focus on major system boundaries, main components, and high-level data flows. Use containers to group related functionality.`;

//       case "semi-detailed":
//         return "Include module-level components, key classes, and their interactions. Show important design patterns and architectural decisions.";

//       case "detailed":
//         return "Comprehensive view including detailed class relationships, method calls, and implementation dependencies. Show complete component hierarchy.";

//       default:
//         return "- Create a balanced architectural overview";
//     }
//   }

//   /**
//    * Get format-specific instructions
//    */
//   private static getFormatInstructions(format: string, level: string): string {
//     if (format === "d2") {
//       return `
//       ## Task: Generate a valid D2 diagram
// Create a **syntactically valid D2 diagram** that visualizes the architecture at the **${level}** level.

// ### D2 Diagram Requirements:
// 1. **Components**: Identify and represent all major components, classes, modules
// 2. **Relationships**: Show dependencies, inheritance, composition, and data flow
// 3. **Grouping**: Use containers to group related components
// 4. **Styling**: Apply appropriate colors and styles for clarity
// 5. **Labels**: Include meaningful labels and descriptions
//       ### ✅ D2 Diagram Rules (must follow strictly)
// 1. **Shapes allowed**:
//    - \`rectangle\`, \`ellipse\`, \`cylinder\`, \`text\` only.
//    - ❌ Do NOT invent custom shapes (like "file", "service", "component").

// 2. **Connections**:
//    - Every connection must have a valid source and destination.
//    - Use \`A -> B: "label"\`.
//    - ❌ Never leave source or destination empty.

// 3. **Containers**:
//    - Use \`container: "Name" { ... }\` for grouping related components.

// 4. **Labels & Tooltips**:
//    - Always provide a readable \`label\` for nodes.
//    - Optional: \`tooltip\` for clarifications.

// 5. **Styling**:
//    - Allowed keys: \`style.fill\`, \`style.stroke\`, \`style.dashed\`.
//    - Always define styles with a nested block:
//      \`\`\`
//      style: {
//        fill: "#hex"
//        stroke: "#hex"
//      }
//      \`\`\`
//    - ❌ Never use \`style.fill =\` or \`style.stroke =\`.
//    - ❌ Do NOT use unsupported attributes.

// 6. **Imports & external references**:
//    - ❌ Do NOT use \`import\` in D2.
//    - Diagram must be fully self-contained.

// 7. **Formatting**:
//    - Wrap output in a fenced \`d2\` code block:
//      \`\`\`d2
//      ...your diagram...
//      \`\`\`
//    - No extra commentary or markdown outside the block.

// ### Example (valid D2)
// \`\`\`d2
// title: Example Architecture

// container: "Frontend" {
//   rectangle: "App.vue" {
//     label: "Root Component"
//     style: {
//       fill: "#e3f2fd"
//       stroke: "#2196f3"
//     }
//   }

//   rectangle: "main.ts" {
//     label: "Bootstrap"
//   }

//   "main.ts" -> "App.vue": "Mounts"
// }
// \`\`\``;
//     } else {
//       return `**Eraser Syntax:**
// - Use cloud diagrams with connected nodes
// - Format: [Component Name] -> [Another Component]
// - Group related components together
// - Use clear, descriptive names
// - Show data flow and relationships

// **Example Structure:**
// \`\`\`
// // Application Architecture
// [Frontend App] -> [API Gateway]
// [API Gateway] -> [Backend Services]
// [Backend Services] -> [Database]
// \`\`\``;
//     }
//   }

//   /**
//    * Categorize files by importance
//    */
//   private static categorizeFilesByImportance(files: any[]): {
//     [key: string]: any[];
//   } {
//     return files.reduce((acc, file) => {
//       const importance = file.importance || "low-priority";
//       if (!acc[importance]) acc[importance] = [];
//       acc[importance].push(file);
//       return acc;
//     }, {} as { [key: string]: any[] });
//   }

//   /**
//    * Format file analysis for prompt
//    */
//   private static formatFileAnalysis(
//     filesByImportance: { [key: string]: any[] },
//     repositoryPath: string
//   ): string {
//     let analysis = "";

//     const importanceOrder = [
//       "critical-entry-point",
//       "core-module",
//       "supporting-utility",
//       "low-priority",
//     ];

//     for (const importance of importanceOrder) {
//       const files = filesByImportance[importance] || [];
//       if (files.length === 0) continue;

//       analysis += `\n**${importance.replace("-", " ").toUpperCase()}** (${
//         files.length
//       } files):\n`;

//       // Show top files for each category
//       const topFiles = files
//         .sort((a, b) => b.finalTokens - a.finalTokens)
//         .slice(0, importance === "critical-entry-point" ? 10 : 5);

//       for (const file of topFiles) {
//         const relativePath = path.relative(repositoryPath, file.path);
//         analysis += `- ${relativePath} (${file.language}, ${file.finalTokens} tokens)\n`;
//       }
//     }

//     return analysis;
//   }

//   /**
//    * Extract diagram from LLM response
//    */
//   private static extractDiagramFromResponse(
//     response: string,
//     format: string
//   ): string {
//     // Try to extract code blocks first
//     const codeBlockRegex = new RegExp(
//       `\`\`\`(?:${format})?([\\s\\S]*?)\`\`\``,
//       "i"
//     );
//     const codeMatch = response.match(codeBlockRegex);

//     if (codeMatch) {
//       return codeMatch[1].trim();
//     }

//     // If no code blocks, try to extract the diagram content
//     const lines = response.split("\\n");
//     let diagramStart = -1;
//     let diagramEnd = -1;

//     // Look for diagram markers
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i].trim().toLowerCase();
//       if (
//         format === "d2" &&
//         (line.includes("title:") ||
//           line.includes("->") ||
//           line.includes("shape:"))
//       ) {
//         if (diagramStart === -1) diagramStart = i;
//         diagramEnd = i;
//       } else if (
//         format === "eraser" &&
//         line.includes("[") &&
//         line.includes("]") &&
//         line.includes("->")
//       ) {
//         if (diagramStart === -1) diagramStart = i;
//         diagramEnd = i;
//       }
//     }

//     if (diagramStart !== -1) {
//       return lines
//         .slice(diagramStart, diagramEnd + 1)
//         .join("\\n")
//         .trim();
//     }

//     // Fallback: return the whole response if it looks like a diagram
//     if (format === "d2" && response.includes("->")) {
//       return response.trim();
//     }
//     if (
//       format === "eraser" &&
//       response.includes("[") &&
//       response.includes("]")
//     ) {
//       return response.trim();
//     }

//     return response.trim();
//   }

//   /**
//    * Validate diagram quality
//    */
//   private static validateDiagram(diagram: string, format: string): boolean {
//     if (!diagram || diagram.length < 50) return false;

//     if (format === "d2") {
//       // D2 should have arrows and components
//       return (
//         diagram.includes("->") &&
//         (diagram.includes(":") ||
//           diagram.includes("shape:") ||
//           diagram.includes("style."))
//       );
//     } else {
//       // Eraser should have bracketed components and arrows
//       return (
//         diagram.includes("->") && diagram.includes("[") && diagram.includes("]")
//       );
//     }
//   }

//   /**
//    * Generate fallback diagram when LLM fails
//    */
//   private static generateFallbackDiagram(request: DiagramRequest): string {
//     const { metadata, files, format } = request;
//     const entryPoints = files.filter(
//       (f) => f.importance === "critical-entry-point"
//     );
//     const coreModules = files.filter((f) => f.importance === "core-module");

//     if (format === "d2") {
//       return this.generateFallbackD2(metadata, entryPoints, coreModules);
//     } else {
//       return this.generateFallbackEraser(metadata, entryPoints, coreModules);
//     }
//   }

//   /**
//    * Generate fallback D2 diagram
//    */
//   private static generateFallbackD2(
//     metadata: any,
//     entryPoints: any[],
//     coreModules: any[]
//   ): string {
//     const title = `${
//       metadata.detectedLanguages[0] || "Application"
//     } Architecture`;

//     let diagram = `title: ${title}\\n\\n`;

//     // Add entry points
//     entryPoints.slice(0, 3).forEach((file, i) => {
//       const relativePath = path.relative(metadata.repositoryPath, file.path);
//       diagram += `entry_${i}: ${path.basename(relativePath)} {\\n`;
//       diagram += `  shape: circle\\n`;
//       diagram += `  style.fill: "#4CAF50"\\n`;
//       diagram += `}\\n\\n`;
//     });

//     // Add core modules
//     coreModules.slice(0, 5).forEach((file, i) => {
//       const relativePath = path.relative(metadata.repositoryPath, file.path);
//       diagram += `core_${i}: ${path.basename(relativePath)} {\\n`;
//       diagram += `  shape: rectangle\\n`;
//       diagram += `  style.fill: "#2196F3"\\n`;
//       diagram += `}\\n\\n`;
//     });

//     // Add connections
//     if (entryPoints.length > 0 && coreModules.length > 0) {
//       diagram += `entry_0 -> core_0: calls\\n`;
//     }

//     return diagram;
//   }

//   /**
//    * Generate fallback Eraser diagram
//    */
//   private static generateFallbackEraser(
//     metadata: any,
//     entryPoints: any[],
//     coreModules: any[]
//   ): string {
//     let diagram = `// ${
//       metadata.detectedLanguages[0] || "Application"
//     } Architecture\\n\\n`;

//     const entryName = entryPoints[0]
//       ? path.basename(
//           path.relative(metadata.repositoryPath, entryPoints[0].path)
//         )
//       : "Entry Point";
//     const coreName = coreModules[0]
//       ? path.basename(
//           path.relative(metadata.repositoryPath, coreModules[0].path)
//         )
//       : "Core Module";

//     diagram += `[${entryName}] -> [${coreName}]\\n`;

//     if (coreModules.length > 1) {
//       const secondCore = path.basename(
//         path.relative(metadata.repositoryPath, coreModules[1].path)
//       );
//       diagram += `[${coreName}] -> [${secondCore}]\\n`;
//     }

//     return diagram;
//   }
// }
