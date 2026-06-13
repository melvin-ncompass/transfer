/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import * as path from 'path';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';
import Java from 'tree-sitter-java';
import { Neo4jService } from './neo4j.service';

interface FunctionInfo {
  functionName: string;
  filePath: string;
  starts: number;
  ends: number;
  usedBy: { path: string; name: string; starts: number; ends: number }[];
  dependsOn: { path: string; name: string; starts: number; ends: number }[];
}

// Enhanced interface for Neo4j (we'll gradually migrate to this)
interface EnhancedFunctionInfo extends FunctionInfo {
  // Metadata for better graph analysis
  id: string; // Unique identifier: "src/App.js#App"
  module: string; // "user-management", "auth", "utils"
  language: string; // "typescript", "javascript", etc.
  functionType: 'entry' | 'controller' | 'service' | 'util' | 'business-logic';
  complexity: number; // Lines of code or other metric
  isEntryPoint: boolean; // main(), init(), App() functions
  isIsolated: boolean; // No dependencies or dependents
  isPublicAPI: boolean; // Exported/public function

  // Statistics for graph analysis
  dependsOnCount: number; // How many functions it calls
  usedByCount: number; // How many functions call it
}

const supportedLanguages = ['typescript', 'javascript', 'python', 'java'];

export class GraphGenerator {
  private parser: Parser;
  private typescriptParser: Parser;
  private javascriptParser: Parser;
  private pythonParser: Parser;
  private javaParser: Parser;

  constructor(private neo4jService?: Neo4jService) {
    // Initialize TypeScript parser
    this.typescriptParser = new Parser();
    this.typescriptParser.setLanguage(TypeScript.typescript);

    // Initialize JavaScript parser
    this.javascriptParser = new Parser();
    this.javascriptParser.setLanguage(JavaScript);

    // Initialize Python parser
    this.pythonParser = new Parser();
    this.pythonParser.setLanguage(Python);

    // Initialize Java parser
    this.javaParser = new Parser();
    this.javaParser.setLanguage(Java);

    // Default parser (will be set based on language type)
    this.parser = this.typescriptParser;
  }

  async generateGraph(query: {
    filteredRepoPath: string;
    extractedRepoPath: string;
    llmResponse: Record<string, any>;
    repo: string;
    username: string;
  }) {
    const { filteredRepoPath, extractedRepoPath, llmResponse } = query;

    // Phase 1: Setup basic structure
    console.log('🚀 Starting function analysis...');
    console.log(`📁 Filtered repo path: ${filteredRepoPath}`);
    console.log(`📁 Extracted repo path: ${extractedRepoPath}`);

    // Create output directory structure
    const functionsOutputDir = path.join(filteredRepoPath, 'functions');
    await this.ensureDirectoryExists(functionsOutputDir);

    // Phase 2: Process only code files (skip JSON/MD)
    const fileInclusionData = llmResponse.fileIncluded || llmResponse.fileInclusion || null;
    let codeFiles = this.getCodeFiles(fileInclusionData);
    
    // Fallback: If no files provided by LLM, scan the filtered filesystem
    if (codeFiles.length === 0) {
      console.log('⚠️ No files provided by LLM, scanning filtered filesystem...');
      codeFiles = await this.scanFilteredFilesystem(extractedRepoPath);
    }
    
    console.log(`📂 Found ${codeFiles.length} code files to analyze`);

    const results: FunctionInfo[] = [];
    const fileContents = new Map<string, string>(); // Store file contents for dependency analysis

    // Process files by language to set correct parser
    if (fileInclusionData && Object.keys(fileInclusionData).length > 0) {
      // Process files grouped by language (from LLM response)
      for (const [preprocessedlanguage, files] of Object.entries(fileInclusionData)) {
        const language = preprocessedlanguage.toLowerCase();
        if (!this.isCodeLanguage(language)) continue;
        
        // Ensure files is an array
        const fileList = Array.isArray(files) ? files : [];
        if (fileList.length === 0) continue;

        // Set parser for this language
        this.setParserForLanguage(language);
        console.log(`🔧 Using ${language} parser for ${fileList.length} files`);

        for (const filePath of fileList) {
          const fullPath = path.join(extractedRepoPath, filePath);
          if (await this.fileExists(fullPath)) {
            console.log(`🔍 Analyzing: ${filePath}`);
            const content = await fs.promises.readFile(fullPath, 'utf8');
            fileContents.set(filePath, content); // Store for later analysis

            const functions = this.extractFunctionsWithContent(
              fullPath,
              filePath,
              content,
            );
            results.push(...functions);
          }
        }
      }
    } else {
      // Process individual files (from filesystem scan)
      console.log('📂 Processing scanned files individually...');
      for (const filePath of codeFiles) {
        const fullPath = path.join(extractedRepoPath, filePath);
        if (await this.fileExists(fullPath)) {
          // Detect language from file extension
          const language = this.detectLanguageFromFile(filePath);
          if (!this.isCodeLanguage(language)) continue;

          // Set parser for this file's language
          this.setParserForLanguage(language);
          
          console.log(`🔍 Analyzing: ${filePath} (${language})`);
          const content = await fs.promises.readFile(fullPath, 'utf8');
          fileContents.set(filePath, content); // Store for later analysis

          const functions = this.extractFunctionsWithContent(
            fullPath,
            filePath,
            content,
          );
          results.push(...functions);
        }
      }
    }

    console.log(`✅ Found ${results.length} functions total`);

    // Phase 3: Dependency Analysis
    console.log('🔍 Starting dependency analysis...');
    const functionsWithDependencies = this.analyzeDependencies(
      results,
      fileContents,
    );
    console.log('✅ Dependency analysis complete');

    // Phase 4: Generate JSON files
    console.log('📝 Generating JSON files...');
    const jsonFiles = await this.generateJsonFiles(
      functionsWithDependencies,
      functionsOutputDir,
    );
    console.log('✅ JSON file generation complete');

    // NEW Phase 5: Create Neo4j Graph (Learning Step!)
    let neo4jStats: any = null;
    console.log(
      '🔍 Neo4j service check:',
      this.neo4jService ? 'Available' : 'Not available',
    );
    if (this.neo4jService) {
      console.log('🔗 Creating Neo4j project graph...');
      console.log('📊 Full query object:', query);
      console.log('📊 Project data:', {
        repo: query.repo,
        functionsCount: functionsWithDependencies.length,
      });
      try {
        neo4jStats = await this.createProjectGraph(
          functionsWithDependencies,
          query,
        );
        console.log('✅ Neo4j graph created successfully!', neo4jStats);
      } catch (error) {
        console.error('❌ Neo4j graph creation failed:', error);
        console.log('💡 Make sure Neo4j is running and accessible');
      }
    } else {
      console.log('⚠️ Neo4j service not available, skipping graph creation');
    }

    return {
      success: true,
      functionsFound: functionsWithDependencies.length,
      outputPath: functionsOutputDir,
      jsonFilesCreated: jsonFiles.length,
      preview: functionsWithDependencies.slice(0, 3), // Show first 3 for debugging

      // NEW: Neo4j graph information
      neo4jGraph: neo4jStats
        ? {
            nodesCreated: neo4jStats.nodesCreated,
            relationshipsCreated: neo4jStats.relationshipsCreated,
            projectName: neo4jStats.projectName,
            graphUrl: 'http://localhost:7474', // Neo4j Browser URL
          }
        : null,
    };
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory: ${dirPath}`, error);
      throw error;
    }
  }

  private getCodeFiles(fileIncluded: Record<string, string[]> | null | undefined): string[] {
    const codeFiles: string[] = [];

    if (!fileIncluded) {
      console.log('⚠️ No file inclusion data provided');
      return codeFiles;
    }

    for (const [language, files] of Object.entries(fileIncluded)) {
      if (supportedLanguages.includes(language) && Array.isArray(files)) {
        codeFiles.push(...files);
      }
    }

    return codeFiles;
  }

  private async scanFilteredFilesystem(extractedRepoPath: string): Promise<string[]> {
    const codeFiles: string[] = [];
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'];
    
    console.log(`🔍 Scanning directory: ${extractedRepoPath}`);

    try {
      // First check if directory exists
      const dirExists = await this.fileExists(extractedRepoPath);
      if (!dirExists) {
        console.log(`❌ Directory does not exist: ${extractedRepoPath}`);
        return codeFiles;
      }

      const scanDirectory = async (dirPath: string, relativePath: string = '') => {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        console.log(`📂 Scanning ${dirPath}: found ${entries.length} entries`);

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            // Skip common non-code directories
            if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
              console.log(`📁 Entering directory: ${entry.name}`);
              await scanDirectory(fullPath, relativeFilePath);
            } else {
              console.log(`⏭️ Skipping directory: ${entry.name}`);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            console.log(`📄 Found file: ${entry.name} (${ext})`);
            if (codeExtensions.includes(ext)) {
              console.log(`✅ Added code file: ${relativeFilePath}`);
              codeFiles.push(relativeFilePath);
            }
          }
        }
      };

      await scanDirectory(extractedRepoPath);
      console.log(`📁 Scanned filesystem and found ${codeFiles.length} code files`);
      if (codeFiles.length > 0) {
        console.log(`📋 Code files found: ${codeFiles.slice(0, 5).join(', ')}${codeFiles.length > 5 ? '...' : ''}`);
      }
    } catch (error) {
      console.error('❌ Error scanning filtered filesystem:', error);
    }

    return codeFiles;
  }

  private detectLanguageFromFile(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.py':
        return 'python';
      case '.java':
        return 'java';
      default:
        return 'unknown';
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async extractFunctions(
    fullPath: string,
    relativePath: string,
  ): Promise<FunctionInfo[]> {
    try {
      const content = await fs.promises.readFile(fullPath, 'utf8');
      return this.extractFunctionsWithContent(fullPath, relativePath, content);
    } catch (error) {
      console.error(`Error reading file: ${fullPath}`, error);
      return [];
    }
  }

  private extractFunctionsWithContent(
    fullPath: string,
    relativePath: string,
    content: string,
  ): FunctionInfo[] {
    try {
      // Parser is already set for the current language batch
      const tree = this.parser.parse(content);
      const functions = this.findFunctionsWithTreeSitter(tree, relativePath);

      return functions;
    } catch (error) {
      console.error(`Error parsing file: ${fullPath}`, error);
      return [];
    }
  }

  private isCodeLanguage(language: string): boolean {
    return supportedLanguages.includes(language);
  }

  private setParserForLanguage(language: string): void {
    switch (language) {
      case 'typescript':
        this.parser = this.typescriptParser;
        console.log(`🔧 Using TypeScript parser`);
        break;
      case 'javascript':
        this.parser = this.javascriptParser;
        console.log(`🔧 Using JavaScript parser`);
        break;
      case 'python':
        this.parser = this.pythonParser;
        console.log(`🔧 Using Python parser`);
        break;
      case 'java':
        this.parser = this.javaParser;
        console.log(`🔧 Using Java parser`);
        break;
      default:
        // Fallback for any other languages
        this.parser = this.typescriptParser;
        console.warn(
          `⚠️ No specific parser for ${language}, using TypeScript parser`,
        );
        break;
    }
  }

  private getFunctionNodeTypes(): string[] {
    // Return function node types based on current parser
    if (
      this.parser === this.typescriptParser ||
      this.parser === this.javascriptParser
    ) {
      return [
        'function_declaration',
        'method_definition',
        'arrow_function',
        'function_expression',
        'generator_function_declaration',
      ];
    } else if (this.parser === this.pythonParser) {
      return ['function_definition', 'async_function_definition'];
    } else if (this.parser === this.javaParser) {
      return ['method_declaration', 'constructor_declaration'];
    }

    // Default to TypeScript/JavaScript types
    return [
      'function_declaration',
      'method_definition',
      'arrow_function',
      'function_expression',
      'generator_function_declaration',
    ];
  }

  private findFunctionsWithTreeSitter(
    tree: Parser.Tree,
    filePath: string,
  ): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    // Function node types to look for (language-specific)
    const functionNodeTypes = this.getFunctionNodeTypes();

    // Traverse the AST to find function nodes
    const traverse = (node: Parser.SyntaxNode) => {
      if (functionNodeTypes.includes(node.type)) {
        const functionName = this.extractFunctionName(node);
        if (functionName) {
          const startLine = node.startPosition.row + 1; // Convert to 1-based
          const endLine = node.endPosition.row + 1;

          functions.push({
            functionName,
            filePath,
            starts: startLine,
            ends: endLine,
            usedBy: [],
            dependsOn: [],
          });

          console.log(
            `  📍 Found function: ${functionName} (lines ${startLine}-${endLine})`,
          );
        }
      }

      // Recursively traverse child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(tree.rootNode);
    return functions;
  }

  private extractFunctionName(node: Parser.SyntaxNode): string | null {
    // Handle different function declaration patterns for all languages
    const name = this.extractRawFunctionName(node);
    
    // Filter out invalid function names (keywords, empty, etc.)
    if (!name || this.isInvalidFunctionName(name)) {
      return null;
    }
    
    return name;
  }

  private extractRawFunctionName(node: Parser.SyntaxNode): string | null {
    switch (node.type) {
      // TypeScript/JavaScript function types
      case 'function_declaration':
      case 'generator_function_declaration': {
        const identifier = node.childForFieldName('name');
        return identifier ? identifier.text : null;
      }
      case 'method_definition': {
        const property = node.childForFieldName('name');
        return property ? property.text : null;
      }
      case 'arrow_function': {
        const parent = node.parent;
        if (parent && parent.type === 'variable_declarator') {
          const varName = parent.childForFieldName('name');
          return varName ? varName.text : null;
        }
        return null;
      }
      case 'function_expression': {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }

      // Python function types
      case 'function_definition':
      case 'async_function_definition': {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }

      // Java function types
      case 'method_declaration': {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      case 'constructor_declaration': {
        // For constructors, use the class name or 'constructor'
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : 'constructor';
      }

      default:
        return null;
    }
  }

  private isInvalidFunctionName(name: string): boolean {
    // Filter out JavaScript/TypeScript keywords and invalid names
    const keywords = [
      'if', 'else', 'for', 'while', 'do', 'try', 'catch', 'finally', 'throw',
      'return', 'break', 'continue', 'switch', 'case', 'default', 'var', 'let', 'const',
      'function', 'class', 'interface', 'type', 'enum', 'namespace', 'import', 'export',
      'public', 'private', 'protected', 'static', 'readonly', 'abstract', 'async', 'await',
      'true', 'false', 'null', 'undefined', 'void', 'any', 'never', 'unknown', 'object',
      'string', 'number', 'boolean', 'symbol', 'bigint'
    ];
    
    // Check if name is a keyword
    if (keywords.includes(name.toLowerCase())) {
      console.log(`⏭️ Skipping keyword: ${name}`);
      return true;
    }
    
    // Check for very short or invalid names
    if (name.length < 2) {
      console.log(`⏭️ Skipping short name: ${name}`);
      return true;
    }
    
    // Check for names that are just numbers or special characters
    if (/^[\d\W]+$/.test(name)) {
      console.log(`⏭️ Skipping invalid name: ${name}`);
      return true;
    }
    
    return false;
  }

  // Phase 3: Dependency Analysis Methods
  private analyzeDependencies(
    functions: FunctionInfo[],
    fileContents: Map<string, string>,
  ): FunctionInfo[] {
    console.log('📋 Building function registry...');
    const functionRegistry = this.buildFunctionRegistry(functions);

    console.log('🔗 Analyzing function calls...');
    // For each function, find what it calls and update relationships
    for (const func of functions) {
      const content = fileContents.get(func.filePath);
      if (content) {
        const calls = this.findFunctionCallsInFunction(func, content);
        func.dependsOn = this.resolveFunctionCalls(
          calls,
          functionRegistry,
          func,
        );
      }
    }

    // Build reverse relationships (usedBy)
    console.log('🔄 Building reverse relationships...');
    this.buildReverseRelationships(functions);

    return functions;
  }

  private buildFunctionRegistry(
    functions: FunctionInfo[],
  ): Map<string, FunctionInfo[]> {
    const registry = new Map<string, FunctionInfo[]>();

    for (const func of functions) {
      if (!registry.has(func.functionName)) {
        registry.set(func.functionName, []);
      }
      registry.get(func.functionName)!.push(func);
    }

    console.log(
      `📚 Registry built with ${registry.size} unique function names`,
    );
    return registry;
  }

  private findFunctionCallsInFunction(
    functionInfo: FunctionInfo,
    fileContent: string,
  ): string[] {
    console.log(`🔍 Analyzing calls in ${functionInfo.functionName}`);

    try {
      // Parse the file to get AST
      const tree = this.parser.parse(fileContent);
      const calls: string[] = [];

      // Find the specific function node in the AST
      const functionNode = this.findFunctionNodeByLocation(
        tree.rootNode,
        functionInfo,
      );

      if (functionNode) {
        // Look for call expressions within this function
        this.extractCallsFromNode(functionNode, calls);
        console.log(`  📞 Found ${calls.length} calls: ${calls.join(', ')}`);
      }

      return calls;
    } catch (error) {
      console.error(
        `Error analyzing calls in ${functionInfo.functionName}:`,
        error,
      );
      return [];
    }
  }

  private findFunctionNodeByLocation(
    rootNode: Parser.SyntaxNode,
    functionInfo: FunctionInfo,
  ): Parser.SyntaxNode | null {
    // Find function node that matches our line numbers
    const traverse = (node: Parser.SyntaxNode): Parser.SyntaxNode | null => {
      const nodeStartLine = node.startPosition.row + 1;
      const nodeEndLine = node.endPosition.row + 1;

      // Check if this node matches our function's location
      if (
        nodeStartLine === functionInfo.starts &&
        nodeEndLine === functionInfo.ends
      ) {
        const functionNodeTypes = this.getFunctionNodeTypes();

        if (functionNodeTypes.includes(node.type)) {
          return node;
        }
      }

      // Recursively search children
      for (let i = 0; i < node.childCount; i++) {
        const result = traverse(node.child(i)!);
        if (result) return result;
      }

      return null;
    };

    return traverse(rootNode);
  }

  private extractCallsFromNode(node: Parser.SyntaxNode, calls: string[]): void {
    // Look for call expressions
    if (node.type === 'call_expression') {
      const functionNode = node.childForFieldName('function');
      if (functionNode) {
        const functionName = this.extractCallName(functionNode);
        if (functionName && !calls.includes(functionName)) {
          calls.push(functionName);
        }
      }
    }

    // Recursively check all child nodes
    for (let i = 0; i < node.childCount; i++) {
      this.extractCallsFromNode(node.child(i)!, calls);
    }
  }

  private extractCallName(node: Parser.SyntaxNode): string | null {
    switch (node.type) {
      case 'identifier':
        return node.text;
      case 'member_expression': {
        // For obj.method(), extract 'method'
        const property = node.childForFieldName('property');
        return property ? property.text : null;
      }
      default:
        return null;
    }
  }

  private resolveFunctionCalls(
    calls: string[],
    registry: Map<string, FunctionInfo[]>,
    caller: FunctionInfo,
  ): { path: string; name: string; starts: number; ends: number }[] {
    const dependencies: {
      path: string;
      name: string;
      starts: number;
      ends: number;
    }[] = [];

    for (const callName of calls) {
      const matchingFunctions = registry.get(callName);
      if (matchingFunctions) {
        // 🎯 SMART RESOLUTION: Choose the best matching function based on scope analysis
        const target = this.resolveBestFunctionMatch(
          callName,
          matchingFunctions,
          caller,
        );

        if (target) {
          dependencies.push({
            path: target.filePath,
            name: target.functionName,
            starts: target.starts,
            ends: target.ends,
          });
          console.log(
            `  ➡️ ${caller.functionName} depends on ${target.functionName} (${target.filePath}, lines ${target.starts}-${target.ends})`,
          );
        }
      }
    }

    return dependencies;
  }

  /**
   * 🎯 SMART FUNCTION RESOLUTION
   *
   * When multiple functions have the same name, choose the best match using:
   * 1. Same file priority (local functions first)
   * 2. Same module priority (related files)
   * 3. Import analysis (if available)
   * 4. Distance scoring (file path similarity)
   */
  private resolveBestFunctionMatch(
    callName: string,
    candidates: FunctionInfo[],
    caller: FunctionInfo,
  ): FunctionInfo | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    console.log(
      `    🔍 Resolving "${callName}" from ${candidates.length} candidates for ${caller.functionName}`,
    );

    // Priority 1: Same file (highest priority)
    const sameFile = candidates.find(
      (func) => func.filePath === caller.filePath,
    );
    if (sameFile) {
      console.log(`    ✅ Found same-file match: ${sameFile.filePath}`);
      return sameFile;
    }

    // Priority 2: Same module/directory
    const callerModule = this.detectModule(caller.filePath);
    const sameModule = candidates.find(
      (func) => this.detectModule(func.filePath) === callerModule,
    );
    if (sameModule) {
      console.log(
        `    ✅ Found same-module match: ${sameModule.filePath} (module: ${callerModule})`,
      );
      return sameModule;
    }

    // Priority 3: Path similarity scoring
    const scored = candidates.map((func) => ({
      func,
      score: this.calculatePathSimilarity(caller.filePath, func.filePath),
    }));

    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);
    const bestMatch = scored[0].func;

    console.log(
      `    ✅ Best path similarity match: ${bestMatch.filePath} (score: ${scored[0].score.toFixed(2)})`,
    );

    return bestMatch;
  }

  /**
   * Calculate similarity between two file paths
   * Returns score 0-1 (1 = identical, 0 = completely different)
   */
  private calculatePathSimilarity(path1: string, path2: string): number {
    const parts1 = path1.split('/');
    const parts2 = path2.split('/');

    // Count common directory segments
    let commonParts = 0;
    const minLength = Math.min(parts1.length - 1, parts2.length - 1); // Exclude filename

    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        commonParts++;
      } else {
        break; // Stop at first difference
      }
    }

    // Score based on common parts vs total parts
    const totalParts = Math.max(parts1.length - 1, parts2.length - 1);
    return totalParts > 0 ? commonParts / totalParts : 0;
  }

  private buildReverseRelationships(functions: FunctionInfo[]): void {
    // Clear existing usedBy arrays
    functions.forEach((func) => (func.usedBy = []));

    // Build reverse relationships from dependsOn
    for (const func of functions) {
      for (const dependency of func.dependsOn) {
        // Find the target function and add this function to its usedBy array
        const targetFunction = functions.find(
          (f) =>
            f.functionName === dependency.name &&
            f.filePath === dependency.path,
        );

        if (targetFunction) {
          targetFunction.usedBy.push({
            path: func.filePath,
            name: func.functionName,
            starts: func.starts,
            ends: func.ends,
          });
          console.log(
            `  ⬅️ ${targetFunction.functionName} is used by ${func.functionName} (lines ${func.starts}-${func.ends})`,
          );
        }
      }
    }
  }

  // Phase 4: JSON File Generation
  private async generateJsonFiles(
    functions: FunctionInfo[],
    outputDir: string,
  ): Promise<string[]> {
    const createdFiles: string[] = [];

    for (const func of functions) {
      try {
        // Create nested directory structure: functions/functionName/
        const functionDir = path.join(outputDir, func.functionName);
        await this.ensureDirectoryExists(functionDir);

        // Create JSON file: functions/functionName/functionName.json
        const jsonFilePath = path.join(
          functionDir,
          `${func.functionName}.json`,
        );

        // Create clean JSON object
        const jsonData = {
          functionName: func.functionName,
          filePath: func.filePath,
          starts: func.starts,
          ends: func.ends,
          usedBy: func.usedBy,
          dependsOn: func.dependsOn,
        };

        // Write JSON file
        await fs.promises.writeFile(
          jsonFilePath,
          JSON.stringify(jsonData, null, 2),
          'utf8',
        );

        createdFiles.push(jsonFilePath);
        console.log(
          `  📄 Created: ${func.functionName}/${func.functionName}.json`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to create JSON for ${func.functionName}:`,
          error,
        );
      }
    }

    console.log(
      `📁 Created ${createdFiles.length} JSON files in nested directories`,
    );
    return createdFiles;
  }

  // =====================================
  // 🎓 NEO4J LEARNING SECTION
  // =====================================

  /**
   * 🎓 LESSON: Creating Your First Neo4j Graph
   *
   * This method demonstrates:
   * 1. How to enhance data with metadata
   * 2. How to create nodes in Neo4j
   * 3. How to create relationships
   * 4. How to run basic queries
   */
  private async createProjectGraph(functions: FunctionInfo[], query: any) {
    if (!this.neo4jService) {
      throw new Error('Neo4j service not available');
    }

    console.log('📊 Step 1: Enhancing functions with metadata...');
    const enhancedFunctions = this.enhanceFunctionsWithMetadata(functions);

    console.log('📝 Step 2: Creating project and function nodes...');
    const nodesCreated = await this.createNodes(enhancedFunctions, query);

    console.log('🔗 Step 3: Creating relationships...');
    const relationshipsCreated =
      await this.createRelationships(enhancedFunctions);

    console.log('🎯 Step 4: Graph statistics...');
    const stats = await this.getGraphStatistics(query.repo);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      nodesCreated,
      relationshipsCreated,
      projectName: query.repo,
      ...stats,
    };
  }

  /**
   * 🎓 LESSON: Enhancing Data for Better Graph Analysis
   *
   * We add metadata to make our graph more intelligent:
   * - Module detection (which part of the app)
   * - Function type classification
   * - Entry point identification
   * - Isolation detection
   */
  private enhanceFunctionsWithMetadata(
    functions: FunctionInfo[],
  ): EnhancedFunctionInfo[] {
    return functions.map((func) => ({
      ...func,
      id: `${func.filePath}#${func.functionName}`,
      module: this.detectModule(func.filePath),
      language: this.detectLanguage(func.filePath),
      functionType: this.classifyFunctionType(func),
      complexity: func.ends - func.starts + 1, // Simple: line count
      isEntryPoint: this.isEntryPoint(func),
      isIsolated: func.dependsOn.length === 0 && func.usedBy.length === 0,
      isPublicAPI: this.isPublicFunction(func),
      dependsOnCount: func.dependsOn.length,
      usedByCount: func.usedBy.length,
    }));
  }

  /**
   * 🎓 LESSON: Creating Nodes in Neo4j
   *
   * Cypher Syntax:
   * CREATE (node:Label {property: value})
   */
  private async createNodes(
    functions: EnhancedFunctionInfo[],
    query: any,
  ): Promise<number> {
    const session = this.neo4jService!.getSession();
    let nodesCreated = 0;

    try {
      // 0. Optional: Clean entire database (uncomment if needed)
      // console.log('🧹 Cleaning entire Neo4j database...');
      // await session.run('MATCH (n) DETACH DELETE n');

      // 1. Create Project Node (the root of our graph) - FIXED: Use MERGE to avoid duplicates
      console.log('🔧 Creating/finding project node with name:', query.repo);
      await session.run(
        'MERGE (p:Project {name: $projectName}) SET p.lastUpdated = datetime()',
        {
          projectName: query.repo,
        },
      );
      nodesCreated += 1;

      // 2. Clean existing functions for this project to avoid duplicates
      console.log('🧹 Cleaning existing functions for this project...');
      await session.run(
        'MATCH (f:Function) WHERE f.filePath STARTS WITH $projectPrefix DELETE f',
        { projectPrefix: query.repo },
      );

      // 3. Create Function Nodes (now safe from duplicates)
      console.log('🔧 Creating function nodes...');
      for (const func of functions) {
        console.log(`  📝 Creating function: ${func.functionName}`);
        await session.run(
          'CREATE (f:Function {id: $id, name: $name, filePath: $filePath, starts: $starts, ends: $ends, language: $language, module: $module, functionType: $functionType, complexity: $complexity, isEntryPoint: $isEntryPoint, isIsolated: $isIsolated, isPublicAPI: $isPublicAPI, dependsOnCount: $dependsOnCount, usedByCount: $usedByCount})',
          {
            id: func.id,
            name: func.functionName,
            filePath: func.filePath,
            starts: func.starts,
            ends: func.ends,
            language: func.language,
            module: func.module,
            functionType: func.functionType,
            complexity: func.complexity,
            isEntryPoint: func.isEntryPoint,
            isIsolated: func.isIsolated,
            isPublicAPI: func.isPublicAPI,
            dependsOnCount: func.dependsOnCount,
            usedByCount: func.usedByCount,
          },
        );
        nodesCreated += 1;
      }

      console.log(
        `📝 Created ${nodesCreated} nodes (1 project + ${functions.length} functions)`,
      );
      return nodesCreated;
    } finally {
      await session.close();
    }
  }

  /**
   * 🎓 LESSON: Creating Function Dependencies in Neo4j
   *
   * We create DEPENDS_ON relationships to show function call dependencies
   *
   * (FunctionA)-[:DEPENDS_ON]->(FunctionB) - A calls B
   */
  private async createRelationships(
    functions: EnhancedFunctionInfo[],
  ): Promise<number> {
    const session = this.neo4jService!.getSession();
    let relationshipsCreated = 0;

    try {
      console.log('🔗 Creating DEPENDS_ON relationships...');

      for (const func of functions) {
        for (const dependency of func.dependsOn) {
          const dependencyId = `${dependency.path}#${dependency.name}`;

          // Create DEPENDS_ON relationship (A depends on B)
          await session.run(
            'MATCH (caller:Function {id: $callerId}) MATCH (callee:Function {id: $calleeId}) CREATE (caller)-[:DEPENDS_ON {calledAtLine: $starts, targetStarts: $targetStarts, targetEnds: $targetEnds}]->(callee)',
            {
              callerId: func.id,
              calleeId: dependencyId,
              starts: dependency.starts,
              targetStarts: dependency.starts,
              targetEnds: dependency.ends,
            },
          );
          relationshipsCreated += 1;
        }
      }

      console.log(
        `🔗 Created ${relationshipsCreated} DEPENDS_ON relationships`,
      );
      return relationshipsCreated;
    } finally {
      await session.close();
    }
  }

  /**
   * 🎓 LESSON: Querying Neo4j for Statistics
   *
   * This shows how to run analytical queries
   */
  private async getGraphStatistics(projectName: string) {
    const session = this.neo4jService!.getSession();

    try {
      const result = await session.run(
        'MATCH (p:Project {name: $projectName}) MATCH (f:Function) OPTIONAL MATCH (entry:Function {isEntryPoint: true}) OPTIONAL MATCH (isolated:Function {isIsolated: true}) RETURN {totalFunctions: count(f), entryPoints: count(entry), isolatedFunctions: count(isolated), modules: size(collect(DISTINCT f.module)), languages: collect(DISTINCT f.language)} as stats',
        { projectName },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result.records[0]?.get('stats') || {};
    } finally {
      await session.close();
    }
  }

  // Helper methods for metadata detection
  private detectModule(filePath: string): string {
    const pathLower = filePath.toLowerCase();
    if (pathLower.includes('auth')) return 'authentication';
    if (pathLower.includes('user')) return 'user-management';
    if (pathLower.includes('api')) return 'api-layer';
    if (pathLower.includes('util') || pathLower.includes('helper'))
      return 'utilities';
    if (pathLower.includes('component')) return 'ui-components';
    if (pathLower.includes('service')) return 'business-services';
    return 'core';
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    if (ext === '.js' || ext === '.jsx') return 'javascript';
    if (ext === '.py') return 'python';
    if (ext === '.java') return 'java';
    return 'unknown';
  }

  private classifyFunctionType(
    func: FunctionInfo,
  ): 'entry' | 'controller' | 'service' | 'util' | 'business-logic' {
    const name = func.functionName.toLowerCase();
    const path = func.filePath.toLowerCase();

    if (['main', 'init', 'app', 'start'].includes(name)) return 'entry';
    if (path.includes('controller') || path.includes('route'))
      return 'controller';
    if (path.includes('service')) return 'service';
    if (path.includes('util') || path.includes('helper')) return 'util';
    return 'business-logic';
  }

  private isEntryPoint(func: FunctionInfo): boolean {
    const name = func.functionName.toLowerCase();
    return ['main', 'init', 'app', 'start', 'index'].includes(name);
  }

  private isPublicFunction(func: FunctionInfo): boolean {
    // Simple heuristic: functions in service/controller files are likely public
    const path = func.filePath.toLowerCase();
    return (
      path.includes('controller') ||
      path.includes('service') ||
      path.includes('api')
    );
  }
}
