const Parser = require("tree-sitter");
const TypeScript = require("tree-sitter-typescript");
const JavaScript = require("tree-sitter-javascript");
const Python = require("tree-sitter-python");
const Java = require("tree-sitter-java");

export class CodeExtractor {
  private static parsers: Map<string, any> = new Map();

  /**
   * Initialize parsers for different languages
   */
  private static initializeParsers(): void {
    if (this.parsers.size > 0) return; // Already initialized

    try {
      // TypeScript parser
      const tsParser = new Parser();
      tsParser.setLanguage(TypeScript.typescript);
      this.parsers.set("typescript", tsParser);

      // JavaScript parser
      const jsParser = new Parser();
      jsParser.setLanguage(JavaScript);
      this.parsers.set("javascript", jsParser);

      // Python parser
      const pyParser = new Parser();
      pyParser.setLanguage(Python);
      this.parsers.set("python", pyParser);

      // Java parser
      const javaParser = new Parser();
      javaParser.setLanguage(Java);
      this.parsers.set("java", javaParser);

      console.log(
        "Code extractors initialized for:",
        Array.from(this.parsers.keys())
      );
    } catch (error) {
      console.warn("Failed to initialize some parsers:", error);
    }
  }

  /**
   * Extract classes and functions from code content
   * @param content The source code content
   * @param filePath File path to determine language (fallback if language not provided)
   * @returns Extracted code containing only classes and functions
   */
  public static extractCodeStructures(
    content: string,
    filePath?: string
  ): string {
    try {
      this.initializeParsers();

      // Determine language from file extension if not provided
      const language = this.detectLanguageFromPath(filePath || "");
      if (!language) {
        console.warn(`No parser available for file: ${filePath}`);
        return content; // Return original content if no parser
      }

      const parser = this.parsers.get(language);
      if (!parser) {
        console.warn(`Parser not found for language: ${language}`);
        return content;
      }

      // Parse the code
      const tree = parser.parse(content);
      const extractedParts: string[] = [];

      // Extract based on language
      switch (language) {
        case "typescript":
        case "javascript":
          this.extractJSTypeScriptStructures(
            tree.rootNode,
            content,
            extractedParts
          );
          break;
        case "python":
          this.extractPythonStructures(tree.rootNode, content, extractedParts);
          break;
        case "java":
          this.extractJavaStructures(tree.rootNode, content, extractedParts);
          break;
        default:
          return content; // Unsupported language
      }

      // Join extracted parts with newlines
      return extractedParts.length > 0 ? extractedParts.join("\n\n") : content;
    } catch (error) {
      console.error("Error extracting code structures:", error);
      return content; // Return original content on error
    }
  }

  /**
   * Extract structures from JavaScript/TypeScript AST
   */
  private static extractJSTypeScriptStructures(
    node: any,
    sourceCode: string,
    extractedParts: string[]
  ): void {
    // Types we want to extract
    const targetTypes = [
      "class_declaration",
      "function_declaration",
      "method_definition",
      "arrow_function", // For arrow functions assigned to variables
      "function_expression",
    ];

    if (targetTypes.includes(node.type)) {
      const nodeText = sourceCode.slice(node.startIndex, node.endIndex);
      extractedParts.push(nodeText);
    }

    // Recursively process child nodes
    for (const child of node.children) {
      this.extractJSTypeScriptStructures(child, sourceCode, extractedParts);
    }
  }

  /**
   * Extract structures from Python AST
   */
  private static extractPythonStructures(
    node: any,
    sourceCode: string,
    extractedParts: string[]
  ): void {
    const targetTypes = [
      "class_definition",
      "function_definition",
      "decorated_definition", // For @decorator functions/classes
    ];

    if (targetTypes.includes(node.type)) {
      const nodeText = sourceCode.slice(node.startIndex, node.endIndex);
      extractedParts.push(nodeText);
    }

    // Recursively process child nodes
    for (const child of node.children) {
      this.extractPythonStructures(child, sourceCode, extractedParts);
    }
  }

  /**
   * Extract structures from Java AST
   */
  private static extractJavaStructures(
    node: any,
    sourceCode: string,
    extractedParts: string[]
  ): void {
    const targetTypes = [
      "class_declaration",
      "interface_declaration",
      "method_declaration",
      "constructor_declaration",
    ];

    if (targetTypes.includes(node.type)) {
      const nodeText = sourceCode.slice(node.startIndex, node.endIndex);
      extractedParts.push(nodeText);
    }

    // Recursively process child nodes
    for (const child of node.children) {
      this.extractJavaStructures(child, sourceCode, extractedParts);
    }
  }

  /**
   * Detect programming language from file path
   */
  private static detectLanguageFromPath(filePath: string): string | null {
    const extension = filePath.toLowerCase().split(".").pop();

    const extensionMap: { [key: string]: string } = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      mjs: "javascript",
      py: "python",
      java: "java",
    };

    return extensionMap[extension || ""] || null;
  }

  /**
   * Get supported languages
   */
  public static getSupportedLanguages(): string[] {
    this.initializeParsers();
    return Array.from(this.parsers.keys());
  }
}
