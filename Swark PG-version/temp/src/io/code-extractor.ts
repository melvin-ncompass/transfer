const Parser = 
const TypeScript = 
const JavaScript = 
const Python = 
const Java = 

export class CodeExtractor {
  private static parsers: Map<string, any> = new Map();

  private static initializeParsers(): void {
    if (this.parsers.size > 0) return; 

    try {
      
      const tsParser = new Parser();
      tsParser.setLanguage(TypeScript.typescript);
      this.parsers.set("typescript", tsParser);

      const jsParser = new Parser();
      jsParser.setLanguage(JavaScript);
      this.parsers.set("javascript", jsParser);

      const pyParser = new Parser();
      pyParser.setLanguage(Python);
      this.parsers.set("python", pyParser);

      const javaParser = new Parser();
      javaParser.setLanguage(Java);
      this.parsers.set("java", javaParser);

      )
      );
    } catch (error) {
      
    }
  }

  public static extractCodeStructures(
    content: string,
    filePath?: string
  ): string {
    try {
      this.initializeParsers();

      const language = this.detectLanguageFromPath(filePath || "");
      if (!language) {
        
        return content; 
      }

      const parser = this.parsers.get(language);
      if (!parser) {
        
        return content;
      }

      const tree = parser.parse(content);
      const extractedParts: string[] = [];

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
          return content; 
      }

      return extractedParts.length > 0 ? extractedParts.join("\n\n") : content;
    } catch (error) {
      
      return content; 
    }
  }

  private static extractJSTypeScriptStructures(
    node: any,
    sourceCode: string,
    extractedParts: string[]
  ): void {
    
    const targetTypes = [
      "class_declaration",
      "function_declaration",
      "method_definition",
      "arrow_function", 
      "function_expression",
    ];

    if (targetTypes.includes(node.type)) {
      const nodeText = sourceCode.slice(node.startIndex, node.endIndex);
      extractedParts.push(nodeText);
    }

    for (const child of node.children) {
      this.extractJSTypeScriptStructures(child, sourceCode, extractedParts);
    }
  }

  private static extractPythonStructures(
    node: any,
    sourceCode: string,
    extractedParts: string[]
  ): void {
    const targetTypes = [
      "class_definition",
      "function_definition",
      "decorated_definition", 
    ];

    if (targetTypes.includes(node.type)) {
      const nodeText = sourceCode.slice(node.startIndex, node.endIndex);
      extractedParts.push(nodeText);
    }

    for (const child of node.children) {
      this.extractPythonStructures(child, sourceCode, extractedParts);
    }
  }

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

    for (const child of node.children) {
      this.extractJavaStructures(child, sourceCode, extractedParts);
    }
  }

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

  public static getSupportedLanguages(): string[] {
    this.initializeParsers();
    return Array.from(this.parsers.keys());
  }
}
