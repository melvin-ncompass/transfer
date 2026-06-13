import * as fs from 'fs';
import * as path from 'path';

export interface FunctionData {
    name: string;
    filePath: string;
    startLine: number;
    endLine: number;
    code: string;
    dependsOn: string[];
    usedBy: string[];
}

export class FunctionExtractor {
    /**
     * Step 6A: Extract all functions from filtered files
     */
    async extractFunctionsFromFiles(filePaths: string[]): Promise<FunctionData[]> {
        const allFunctions: FunctionData[] = [];

        for (const filePath of filePaths) {
            if (fs.existsSync(filePath)) {
                try {
                    const functions = this.extractFunctionsFromFile(filePath);
                    allFunctions.push(...functions);
                } catch (error) {
                    console.warn(`Failed to extract functions from ${filePath}:`, error);
                }
            }
        }

        return allFunctions;
    }

    /**
     * Step 6B: Extract functions from a single file
     */
    private extractFunctionsFromFile(filePath: string): FunctionData[] {
        const ext = path.extname(filePath).toLowerCase();
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        switch (ext) {
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
                return this.extractJavaScriptFunctions(sourceCode, filePath);
            case '.py':
                return this.extractPythonFunctions(sourceCode, filePath);
            case '.java':
                return this.extractJavaFunctions(sourceCode, filePath);
            case '.c':
            case '.cpp':
            case '.cc':
            case '.cxx':
                return this.extractCFunctions(sourceCode, filePath);
            default:
                return [];
        }
    }

    private extractJavaScriptFunctions(sourceCode: string, filePath: string): FunctionData[] {
        const functions: FunctionData[] = [];
        const lines = sourceCode.split('\n');

        // Regex patterns for different function types - more precise to avoid control structures
        const patterns = [
            // function declaration: function myFunc() {}
            /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            // arrow functions: const myFunc = () => {}
            /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>)/g,
            // class methods with explicit modifiers: public async myMethod() {}
            /\b(?:public|private|protected|static|async)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*:\s*[^{]*{/g,
            // simple method definitions in classes/objects: myMethod() {}
            /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/gm
        ];

        for (const pattern of patterns) {
            let match;
            pattern.lastIndex = 0; // Reset regex state
            
            while ((match = pattern.exec(sourceCode)) !== null) {
                const functionName = match[1];
                if (this.isValidFunctionName(functionName)) {
                    const startIndex = match.index;
                    const startLine = sourceCode.substring(0, startIndex).split('\n').length;
                    
                    const functionData = this.extractFunctionBlock(sourceCode, startIndex, startLine, functionName, filePath);
                    if (functionData) {
                        functions.push(functionData);
                    }
                }
            }
        }

        return this.deduplicateFunctions(functions);
    }

    private extractPythonFunctions(sourceCode: string, filePath: string): FunctionData[] {
        const functions: FunctionData[] = [];
        const lines = sourceCode.split('\n');
        
        const functionPattern = /^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm;
        let match;

        while ((match = functionPattern.exec(sourceCode)) !== null) {
            const indentation = match[1];
            const functionName = match[2];
            const startIndex = match.index;
            const startLine = sourceCode.substring(0, startIndex).split('\n').length;

            const functionData = this.extractPythonFunctionBlock(sourceCode, lines, startLine - 1, functionName, filePath, indentation);
            if (functionData) {
                functions.push(functionData);
            }
        }

        return functions;
    }

    private extractJavaFunctions(sourceCode: string, filePath: string): FunctionData[] {
        const functions: FunctionData[] = [];
        
        // Java method pattern: [modifiers] returnType methodName(...) {
        const methodPattern = /(?:public|private|protected|static|final|abstract|synchronized|native|strictfp|\s)*\s+(?:[a-zA-Z_<>[\]]+\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?:throws\s+[^{]+)?\s*{/g;
        let match;

        while ((match = methodPattern.exec(sourceCode)) !== null) {
            const functionName = match[1];
            if (this.isValidFunctionName(functionName) && !this.isJavaKeyword(functionName)) {
                const startIndex = match.index;
                const startLine = sourceCode.substring(0, startIndex).split('\n').length;
                
                const functionData = this.extractFunctionBlock(sourceCode, startIndex, startLine, functionName, filePath);
                if (functionData) {
                    functions.push(functionData);
                }
            }
        }

        return functions;
    }

    private extractCFunctions(sourceCode: string, filePath: string): FunctionData[] {
        const functions: FunctionData[] = [];
        
        // C/C++ function pattern: returnType functionName(...) {
        const functionPattern = /(?:[a-zA-Z_][a-zA-Z0-9_*\s]*\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*{/g;
        let match;

        while ((match = functionPattern.exec(sourceCode)) !== null) {
            const functionName = match[1];
            if (this.isValidFunctionName(functionName) && !this.isCKeyword(functionName)) {
                const startIndex = match.index;
                const startLine = sourceCode.substring(0, startIndex).split('\n').length;
                
                const functionData = this.extractFunctionBlock(sourceCode, startIndex, startLine, functionName, filePath);
                if (functionData) {
                    functions.push(functionData);
                }
            }
        }

        return functions;
    }

    private extractFunctionBlock(sourceCode: string, startIndex: number, startLine: number, functionName: string, filePath: string): FunctionData | null {
        let braceCount = 0;
        let functionStart = startIndex;
        let inFunction = false;
        let endIndex = startIndex;

        // Find the opening brace
        for (let i = startIndex; i < sourceCode.length; i++) {
            const char = sourceCode[i];
            if (char === '{') {
                if (!inFunction) {
                    functionStart = i;
                    inFunction = true;
                }
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (inFunction && braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }

        if (!inFunction || braceCount !== 0) {
            return null;
        }

        const endLine = sourceCode.substring(0, endIndex).split('\n').length;
        const code = sourceCode.substring(startIndex, endIndex);
        const dependsOn = this.extractDependencies(code);

        return {
            name: functionName,
            filePath,
            startLine,
            endLine,
            code,
            dependsOn,
            usedBy: []
        };
    }

    private extractPythonFunctionBlock(sourceCode: string, lines: string[], startLineIndex: number, functionName: string, filePath: string, baseIndentation: string): FunctionData | null {
        let endLineIndex = startLineIndex;
        
        // Find the end of the function by looking for the next line with same or less indentation
        for (let i = startLineIndex + 1; i < lines.length; i++) {
            const line = lines[i].trimEnd();
            if (line.length === 0) continue; // Skip empty lines
            
            if (!line.startsWith(baseIndentation + '    ') && !line.startsWith(baseIndentation + '\t')) {
                // This line has same or less indentation, function ends here
                endLineIndex = i - 1;
                break;
            }
            endLineIndex = i;
        }

        const code = lines.slice(startLineIndex, endLineIndex + 1).join('\n');
        const dependsOn = this.extractDependencies(code);

        return {
            name: functionName,
            filePath,
            startLine: startLineIndex + 1,
            endLine: endLineIndex + 1,
            code,
            dependsOn,
            usedBy: []
        };
    }

    /**
     * Step 6B2: Extract dependencies (function calls within the function)
     */
    private extractDependencies(code: string): string[] {
        const dependencies = new Set<string>();
        
        // Function call patterns
        const callPatterns = [
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,  // functionName()
            /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g // object.method()
        ];

        for (const pattern of callPatterns) {
            let match;
            pattern.lastIndex = 0;
            
            while ((match = pattern.exec(code)) !== null) {
                const funcName = match[1];
                if (this.isValidFunctionName(funcName) && !this.isBuiltInFunction(funcName)) {
                    dependencies.add(funcName);
                }
            }
        }

        return Array.from(dependencies);
    }

    /**
     * Step 6B: Build relationships between functions
     */
    buildFunctionRelationships(functions: FunctionData[]): FunctionData[] {
        const functionMap = new Map<string, FunctionData>();
        
        // Index functions by name
        for (const func of functions) {
            functionMap.set(func.name, func);
        }

        // Build "used by" relationships
        for (const func of functions) {
            for (const dependency of func.dependsOn) {
                const dependencyFunc = functionMap.get(dependency);
                if (dependencyFunc && !dependencyFunc.usedBy.includes(func.name)) {
                    dependencyFunc.usedBy.push(func.name);
                }
            }
        }

        return functions;
    }

    private isValidFunctionName(name: string): boolean {
        // Check for valid identifier and exclude control flow keywords
        const controlFlowKeywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'try', 'catch', 'finally',
            'with', 'return', 'break', 'continue', 'throw', 'var', 'let', 'const', 'function', 'class',
            'interface', 'type', 'enum', 'namespace', 'module', 'export', 'import', 'from', 'as',
            'extends', 'implements', 'static', 'public', 'private', 'protected', 'readonly', 'abstract'
        ];
        
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) && 
               name.length > 1 && 
               !controlFlowKeywords.includes(name.toLowerCase());
    }

    private isBuiltInFunction(name: string): boolean {
        const builtIns = [
            // JavaScript
            'console', 'require', 'import', 'export', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
            // Python
            'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'type',
            // Java
            'System', 'String', 'Integer', 'Object', 'Class',
            // C/C++
            'printf', 'scanf', 'malloc', 'free', 'strlen', 'strcpy', 'strcmp'
        ];
        return builtIns.includes(name);
    }

    private isJavaKeyword(name: string): boolean {
        const keywords = ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'class', 'interface', 'extends', 'implements'];
        return keywords.includes(name);
    }

    private isCKeyword(name: string): boolean {
        const keywords = ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'sizeof', 'typedef', 'struct', 'union', 'enum'];
        return keywords.includes(name);
    }

    private deduplicateFunctions(functions: FunctionData[]): FunctionData[] {
        const seen = new Set<string>();
        return functions.filter(func => {
            const key = `${func.name}:${func.startLine}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}
