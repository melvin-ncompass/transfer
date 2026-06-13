import * as fs from 'fs';
import * as path from 'path';
import { Swark5Metadata, Swark5FilteredMetadata } from '../commands/create-swark5-architecture';

export class CodeCleaner {
    async cleanFiles(
        filteredFiles: Swark5Metadata['fileList'], 
        repositoryPath: string
    ): Promise<Swark5FilteredMetadata['filteredFiles']> {
        console.log('🧹 Cleaning filtered files (removing comments and whitespace)...');
        
        const cleanedFiles: Swark5FilteredMetadata['filteredFiles'] = [];
        
        for (const file of filteredFiles) {
            try {
                const fullPath = path.join(repositoryPath, file.path);
                const originalContent = await fs.promises.readFile(fullPath, 'utf-8');
                
                const cleaningResult = this.cleanFileContent(originalContent, file.language);
                const cleanedTokens = Math.ceil(cleaningResult.cleanedContent.length / 4);
                
                cleanedFiles.push({
                    ...file,
                    cleanedTokens,
                    removalStats: cleaningResult.stats
                });
                
            } catch (error) {
                console.warn(`Could not clean file ${file.path}:`, error);
                cleanedFiles.push({
                    ...file,
                    cleanedTokens: file.estimatedTokens,
                    removalStats: {
                        originalLines: 0,
                        cleanedLines: 0,
                        commentsRemoved: 0,
                        whitespaceRemoved: 0
                    }
                });
            }
        }
        
        const originalTokens = filteredFiles.reduce((sum, file) => sum + file.estimatedTokens, 0);
        const cleanedTokens = cleanedFiles.reduce((sum, file) => sum + file.cleanedTokens, 0);
        const reduction = ((originalTokens - cleanedTokens) / originalTokens * 100).toFixed(1);
        
        console.log(`🧹 Cleaning complete: ${originalTokens} → ${cleanedTokens} tokens (${reduction}% reduction)`);
        
        return cleanedFiles;
    }

    private cleanFileContent(content: string, language: string): {
        cleanedContent: string;
        stats: {
            originalLines: number;
            cleanedLines: number;
            commentsRemoved: number;
            whitespaceRemoved: number;
        };
    } {
        const originalLines = content.split('\n');
        let cleanedContent = content;
        let commentsRemoved = 0;
        let whitespaceRemoved = 0;

        switch (language) {
            case 'javascript':
            case 'typescript':
            case 'java':
            case 'c':
            case 'cpp':
            case 'csharp':
            case 'go':
            case 'rust':
            case 'scala':
            case 'swift':
            case 'kotlin':
                cleanedContent = this.removeCStyleComments(cleanedContent);
                break;
                
            case 'python':
            case 'shell':
                cleanedContent = this.removePythonStyleComments(cleanedContent);
                break;
                
            case 'ruby':
                cleanedContent = this.removeRubyStyleComments(cleanedContent);
                break;
                
            case 'lua':
                cleanedContent = this.removeLuaStyleComments(cleanedContent);
                break;
                
            default:
                cleanedContent = this.removeGenericComments(cleanedContent);
        }

        commentsRemoved = (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length +
                         (content.match(/#.*$/gm) || []).length;

        const lines = cleanedContent.split('\n');
        const processedLines: string[] = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === '') {
                if (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== '') {
                    processedLines.push('');
                } else {
                    whitespaceRemoved++;
                }
            } else {
                const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
                const normalizedIndent = leadingWhitespace.replace(/\t/g, '  ');
                processedLines.push(normalizedIndent + trimmedLine);
            }
        }

        while (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() === '') {
            processedLines.pop();
            whitespaceRemoved++;
        }

        const cleanedLines = processedLines;

        return {
            cleanedContent: cleanedLines.join('\n'),
            stats: {
                originalLines: originalLines.length,
                cleanedLines: cleanedLines.length,
                commentsRemoved,
                whitespaceRemoved
            }
        };
    }

    private removeCStyleComments(content: string): string {
        content = content.replace(/\/\/.*$/gm, '');
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        return content;
    }

    private removePythonStyleComments(content: string): string {
        const lines = content.split('\n');
        const processedLines: string[] = [];
        let inTripleQuote = false;
        let tripleQuoteChar = '';

        for (const line of lines) {
            let processedLine = line;
            
            if (!inTripleQuote) {
                const tripleQuoteMatch = line.match(/(['"])(\1\1)/);
                if (tripleQuoteMatch) {
                    inTripleQuote = true;
                    tripleQuoteChar = tripleQuoteMatch[1];
                } else {
                    processedLine = this.removeHashComments(line);
                }
            } else {
                if (line.includes(tripleQuoteChar.repeat(3))) {
                    inTripleQuote = false;
                    tripleQuoteChar = '';
                }
            }
            
            processedLines.push(processedLine);
        }

        return processedLines.join('\n');
    }

    private removeHashComments(line: string): string {
        let result = '';
        let inString = false;
        let stringChar = '';
        let escaped = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (escaped) {
                result += char;
                escaped = false;
                continue;
            }
            
            if (char === '\\' && inString) {
                escaped = true;
                result += char;
                continue;
            }
            
            if ((char === '"' || char === "'") && !inString) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (char === stringChar && inString) {
                inString = false;
                stringChar = '';
                result += char;
            } else if (char === '#' && !inString) {
                break;
            } else {
                result += char;
            }
        }
        
        return result;
    }

    private removeRubyStyleComments(content: string): string {
        content = content.replace(/^=begin[\s\S]*?^=end$/gm, '');
        content = content.replace(/#.*$/gm, '');
        return content;
    }

    private removeLuaStyleComments(content: string): string {
        content = content.replace(/--\[\[[\s\S]*?\]\]/g, '');
        content = content.replace(/--.*$/gm, '');
        return content;
    }

    private removeGenericComments(content: string): string {
        content = content.replace(/\/\/.*$/gm, '');
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/#.*$/gm, '');
        content = content.replace(/;.*$/gm, '');
        return content;
    }
}
