

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

interface EnhancedFunctionInfo extends FunctionInfo {
  
  id: string; 
  module: string; 
  language: string; 
  functionType: 'entry' | 'controller' | 'service' | 'util' | 'business-logic';
  complexity: number; 
  isEntryPoint: boolean; 
  isIsolated: boolean; 
  isPublicAPI: boolean; 

  dependsOnCount: number; 
  usedByCount: number; 
}

const supportedLanguages = ['typescript', 'javascript', 'python', 'java'];

export class GraphGenerator {
  private parser: Parser;
  private typescriptParser: Parser;
  private javascriptParser: Parser;
  private pythonParser: Parser;
  private javaParser: Parser;

  constructor(private neo4jService?: Neo4jService) {
    
    this.typescriptParser = new Parser();
    this.typescriptParser.setLanguage(TypeScript.typescript);

    this.javascriptParser = new Parser();
    this.javascriptParser.setLanguage(JavaScript);

    this.pythonParser = new Parser();
    this.pythonParser.setLanguage(Python);

    this.javaParser = new Parser();
    this.javaParser.setLanguage(Java);

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

    const functionsOutputDir = path.join(filteredRepoPath, 'functions');
    await this.ensureDirectoryExists(functionsOutputDir);

    const fileInclusionData = llmResponse.fileIncluded || llmResponse.fileInclusion || null;
    let codeFiles = this.getCodeFiles(fileInclusionData);

    if (codeFiles.length === 0) {
      
      codeFiles = await this.scanFilteredFilesystem(extractedRepoPath);
    }

    const results: FunctionInfo[] = [];
    const fileContents = new Map<string, string>(); 

    if (fileInclusionData && Object.keys(fileInclusionData).length > 0) {
      
      for (const [preprocessedlanguage, files] of Object.entries(fileInclusionData)) {
        const language = preprocessedlanguage.toLowerCase();
        if (!this.isCodeLanguage(language)) continue;

        const fileList = Array.isArray(files) ? files : [];
        if (fileList.length === 0) continue;

        this.setParserForLanguage(language);

        for (const filePath of fileList) {
          const fullPath = path.join(extractedRepoPath, filePath);
          if (await this.fileExists(fullPath)) {
            
            const content = await fs.promises.readFile(fullPath, 'utf8');
            fileContents.set(filePath, content); 

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

      for (const filePath of codeFiles) {
        const fullPath = path.join(extractedRepoPath, filePath);
        if (await this.fileExists(fullPath)) {
          
          const language = this.detectLanguageFromFile(filePath);
          if (!this.isCodeLanguage(language)) continue;

          this.setParserForLanguage(language);
          
          `);
          const content = await fs.promises.readFile(fullPath, 'utf8');
          fileContents.set(filePath, content); 

          const functions = this.extractFunctionsWithContent(
            fullPath,
            filePath,
            content,
          );
          results.push(...functions);
        }
      }
    }

    const functionsWithDependencies = this.analyzeDependencies(
      results,
      fileContents,
    );

    const jsonFiles = await this.generateJsonFiles(
      functionsWithDependencies,
      functionsOutputDir,
    );

    let neo4jStats: any = null;
    
    if (this.neo4jService) {

      try {
        neo4jStats = await this.createProjectGraph(
          functionsWithDependencies,
          query,
        );
        
      } catch (error) {

      }
    } else {
      
    }

    return {
      success: true,
      functionsFound: functionsWithDependencies.length,
      outputPath: functionsOutputDir,
      jsonFilesCreated: jsonFiles.length,
      preview: functionsWithDependencies.slice(0, 3), 

      neo4jGraph: neo4jStats
        ? {
            nodesCreated: neo4jStats.nodesCreated,
            relationshipsCreated: neo4jStats.relationshipsCreated,
            projectName: neo4jStats.projectName,
            graphUrl: 'http:
          }
        : null,
    };
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      
      throw error;
    }
  }

  private getCodeFiles(fileIncluded: Record<string, string[]> | null | undefined): string[] {
    const codeFiles: string[] = [];

    if (!fileIncluded) {
      
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

    try {
      
      const dirExists = await this.fileExists(extractedRepoPath);
      if (!dirExists) {
        
        return codeFiles;
      }

      const scanDirectory = async (dirPath: string, relativePath: string = '') => {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            
            if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
              
              await scanDirectory(fullPath, relativeFilePath);
            } else {
              
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            `);
            if (codeExtensions.includes(ext)) {
              
              codeFiles.push(relativeFilePath);
            }
          }
        }
      };

      await scanDirectory(extractedRepoPath);
      
      if (codeFiles.length > 0) {
        .join(', ')}${codeFiles.length > 5 ? '...' : ''}`);
      }
    } catch (error) {
      
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
      
      return [];
    }
  }

  private extractFunctionsWithContent(
    fullPath: string,
    relativePath: string,
    content: string,
  ): FunctionInfo[] {
    try {
      
      const tree = this.parser.parse(content);
      const functions = this.findFunctionsWithTreeSitter(tree, relativePath);

      return functions;
    } catch (error) {
      
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
        
        break;
      case 'javascript':
        this.parser = this.javascriptParser;
        
        break;
      case 'python':
        this.parser = this.pythonParser;
        
        break;
      case 'java':
        this.parser = this.javaParser;
        
        break;
      default:
        
        this.parser = this.typescriptParser;
        
        break;
    }
  }

  private getFunctionNodeTypes(): string[] {
    
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

    const functionNodeTypes = this.getFunctionNodeTypes();

    const traverse = (node: Parser.SyntaxNode) => {
      if (functionNodeTypes.includes(node.type)) {
        const functionName = this.extractFunctionName(node);
        if (functionName) {
          const startLine = node.startPosition.row + 1; 
          const endLine = node.endPosition.row + 1;

          functions.push({
            functionName,
            filePath,
            starts: startLine,
            ends: endLine,
            usedBy: [],
            dependsOn: [],
          });

          `,
          );
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(tree.rootNode);
    return functions;
  }

  private extractFunctionName(node: Parser.SyntaxNode): string | null {
    
    switch (node.type) {
      
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

      case 'function_definition':
      case 'async_function_definition': {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }

      case 'method_declaration': {
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : null;
      }
      case 'constructor_declaration': {
        
        const nameNode = node.childForFieldName('name');
        return nameNode ? nameNode.text : 'constructor';
      }

      default:
        return null;
    }
  }

  private analyzeDependencies(
    functions: FunctionInfo[],
    fileContents: Map<string, string>,
  ): FunctionInfo[] {
    
    const functionRegistry = this.buildFunctionRegistry(functions);

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

    return registry;
  }

  private findFunctionCallsInFunction(
    functionInfo: FunctionInfo,
    fileContent: string,
  ): string[] {

    try {
      
      const tree = this.parser.parse(fileContent);
      const calls: string[] = [];

      const functionNode = this.findFunctionNodeByLocation(
        tree.rootNode,
        functionInfo,
      );

      if (functionNode) {
        
        this.extractCallsFromNode(functionNode, calls);
        }`);
      }

      return calls;
    } catch (error) {
      
      return [];
    }
  }

  private findFunctionNodeByLocation(
    rootNode: Parser.SyntaxNode,
    functionInfo: FunctionInfo,
  ): Parser.SyntaxNode | null {
    
    const traverse = (node: Parser.SyntaxNode): Parser.SyntaxNode | null => {
      const nodeStartLine = node.startPosition.row + 1;
      const nodeEndLine = node.endPosition.row + 1;

      if (
        nodeStartLine === functionInfo.starts &&
        nodeEndLine === functionInfo.ends
      ) {
        const functionNodeTypes = this.getFunctionNodeTypes();

        if (functionNodeTypes.includes(node.type)) {
          return node;
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        const result = traverse(node.child(i)!);
        if (result) return result;
      }

      return null;
    };

    return traverse(rootNode);
  }

  private extractCallsFromNode(node: Parser.SyntaxNode, calls: string[]): void {
    
    if (node.type === 'call_expression') {
      const functionNode = node.childForFieldName('function');
      if (functionNode) {
        const functionName = this.extractCallName(functionNode);
        if (functionName && !calls.includes(functionName)) {
          calls.push(functionName);
        }
      }
    }

    for (let i = 0; i < node.childCount; i++) {
      this.extractCallsFromNode(node.child(i)!, calls);
    }
  }

  private extractCallName(node: Parser.SyntaxNode): string | null {
    switch (node.type) {
      case 'identifier':
        return node.text;
      case 'member_expression': {
        
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
          `,
          );
        }
      }
    }

    return dependencies;
  }

  private resolveBestFunctionMatch(
    callName: string,
    candidates: FunctionInfo[],
    caller: FunctionInfo,
  ): FunctionInfo | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    const sameFile = candidates.find(
      (func) => func.filePath === caller.filePath,
    );
    if (sameFile) {
      
      return sameFile;
    }

    const callerModule = this.detectModule(caller.filePath);
    const sameModule = candidates.find(
      (func) => this.detectModule(func.filePath) === callerModule,
    );
    if (sameModule) {
      `,
      );
      return sameModule;
    }

    const scored = candidates.map((func) => ({
      func,
      score: this.calculatePathSimilarity(caller.filePath, func.filePath),
    }));

    scored.sort((a, b) => b.score - a.score);
    const bestMatch = scored[0].func;

    })`,
    );

    return bestMatch;
  }

  private calculatePathSimilarity(path1: string, path2: string): number {
    const parts1 = path1.split('/');
    const parts2 = path2.split('/');

    let commonParts = 0;
    const minLength = Math.min(parts1.length - 1, parts2.length - 1); 

    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        commonParts++;
      } else {
        break; 
      }
    }

    const totalParts = Math.max(parts1.length - 1, parts2.length - 1);
    return totalParts > 0 ? commonParts / totalParts : 0;
  }

  private buildReverseRelationships(functions: FunctionInfo[]): void {
    
    functions.forEach((func) => (func.usedBy = []));

    for (const func of functions) {
      for (const dependency of func.dependsOn) {
        
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
          `,
          );
        }
      }
    }
  }

  private async generateJsonFiles(
    functions: FunctionInfo[],
    outputDir: string,
  ): Promise<string[]> {
    const createdFiles: string[] = [];

    for (const func of functions) {
      try {
        
        const functionDir = path.join(outputDir, func.functionName);
        await this.ensureDirectoryExists(functionDir);

        const jsonFilePath = path.join(
          functionDir,
          `${func.functionName}.json`,
        );

        const jsonData = {
          functionName: func.functionName,
          filePath: func.filePath,
          starts: func.starts,
          ends: func.ends,
          usedBy: func.usedBy,
          dependsOn: func.dependsOn,
        };

        await fs.promises.writeFile(
          jsonFilePath,
          JSON.stringify(jsonData, null, 2),
          'utf8',
        );

        createdFiles.push(jsonFilePath);
        
      } catch (error) {
        
      }
    }

    return createdFiles;
  }

  private async createProjectGraph(functions: FunctionInfo[], query: any) {
    if (!this.neo4jService) {
      throw new Error('Neo4j service not available');
    }

    const enhancedFunctions = this.enhanceFunctionsWithMetadata(functions);

    const nodesCreated = await this.createNodes(enhancedFunctions, query);

    const relationshipsCreated =
      await this.createRelationships(enhancedFunctions);

    const stats = await this.getGraphStatistics(query.repo);

    return {
      nodesCreated,
      relationshipsCreated,
      projectName: query.repo,
      ...stats,
    };
  }

  private enhanceFunctionsWithMetadata(
    functions: FunctionInfo[],
  ): EnhancedFunctionInfo[] {
    return functions.map((func) => ({
      ...func,
      id: `${func.filePath}#${func.functionName}`,
      module: this.detectModule(func.filePath),
      language: this.detectLanguage(func.filePath),
      functionType: this.classifyFunctionType(func),
      complexity: func.ends - func.starts + 1, 
      isEntryPoint: this.isEntryPoint(func),
      isIsolated: func.dependsOn.length === 0 && func.usedBy.length === 0,
      isPublicAPI: this.isPublicFunction(func),
      dependsOnCount: func.dependsOn.length,
      usedByCount: func.usedBy.length,
    }));
  }

  private async createNodes(
    functions: EnhancedFunctionInfo[],
    query: any,
  ): Promise<number> {
    const session = this.neo4jService!.getSession();
    let nodesCreated = 0;

    try {

      await session.run(
        'MERGE (p:Project {name: $projectName}) SET p.lastUpdated = datetime()',
        {
          projectName: query.repo,
        },
      );
      nodesCreated += 1;

      await session.run(
        'MATCH (f:Function) WHERE f.filePath STARTS WITH $projectPrefix DELETE f',
        { projectPrefix: query.repo },
      );

      for (const func of functions) {
        
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

      `,
      );
      return nodesCreated;
    } finally {
      await session.close();
    }
  }

  private async createRelationships(
    functions: EnhancedFunctionInfo[],
  ): Promise<number> {
    const session = this.neo4jService!.getSession();
    let relationshipsCreated = 0;

    try {

      for (const func of functions) {
        for (const dependency of func.dependsOn) {
          const dependencyId = `${dependency.path}#${dependency.name}`;

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

          await session.run(
            'MATCH (caller:Function {id: $callerId}) MATCH (callee:Function {id: $calleeId}) CREATE (callee)-[:USED_BY {calledAtLine: $starts, sourceStarts: $sourceStarts, sourceEnds: $sourceEnds}]->(caller)',
            {
              callerId: func.id,
              calleeId: dependencyId,
              starts: dependency.starts,
              sourceStarts: func.starts,
              sourceEnds: func.ends,
            },
          );
          relationshipsCreated += 1;
        }
      }

      `,
      );
      return relationshipsCreated;
    } finally {
      await session.close();
    }
  }

  private async getGraphStatistics(projectName: string) {
    const session = this.neo4jService!.getSession();

    try {
      const result = await session.run(
        'MATCH (p:Project {name: $projectName}) MATCH (f:Function) OPTIONAL MATCH (entry:Function {isEntryPoint: true}) OPTIONAL MATCH (isolated:Function {isIsolated: true}) RETURN {totalFunctions: count(f), entryPoints: count(entry), isolatedFunctions: count(isolated), modules: size(collect(DISTINCT f.module)), languages: collect(DISTINCT f.language)} as stats',
        { projectName },
      );

      return result.records[0]?.get('stats') || {};
    } finally {
      await session.close();
    }
  }

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
    
    const path = func.filePath.toLowerCase();
    return (
      path.includes('controller') ||
      path.includes('service') ||
      path.includes('api')
    );
  }
}
