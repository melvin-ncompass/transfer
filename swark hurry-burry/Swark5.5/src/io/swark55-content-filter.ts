import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Swark55Metadata } from './swark55-metadata-extractor';
import { Swark55RegexPatterns } from './swark55-regex-generator';

const readFile = promisify(fs.readFile);

export interface Swark55ProcessedMetadata extends Swark55Metadata {
    regexPatterns: Swark55RegexPatterns;
    filteredFiles: FilteredFileInfo[];
    tokenReport: {
        worstCaseTokens: number;
        tokensAfterFileFiltering: number;
        tokensAfterContentFiltering: number;
        finalTokens: number;
    };
}

export interface ContentFilterStats {
    originalLines: number;
    filteredLines: number;
    loggingRemoved: number;
    testsRemoved: number;
    importsRemoved: number;
    boilerplateRemoved: number;
}

export interface FilteredFileInfo {
    path: string;
    size: number;
    estimatedTokens: number;
    language: string;
    importance: 'critical-entry-point' | 'core-module' | 'supporting-utility' | 'low-priority';
    originalContent: string;
    filteredContent: string;
    contentFilterStats: ContentFilterStats;
    finalTokens: number;
}

export class Swark55ContentFilter {
    /**
     * Process files through file-level and content-level filtering
     */
    public static async processFiles(
        metadata: Swark55Metadata, 
        regexPatterns: Swark55RegexPatterns
    ): Promise<Swark55ProcessedMetadata> {
        
        // Step 1: Apply file-level filtering
        const filteredFiles = this.applyFileFiltering(metadata.fileList, regexPatterns, metadata.repositoryPath);
        
        // Step 2: Apply content-level filtering
        const processedFiles: FilteredFileInfo[] = [];
        
        for (const file of filteredFiles) {
            const processedFile = await this.processFileContent(file, regexPatterns);
            if (processedFile) {
                processedFiles.push(processedFile);
            }
        }
        
        // Step 3: Calculate token report
        const tokenReport = this.calculateTokenReport(metadata, processedFiles);
        
        return {
            ...metadata,
            regexPatterns,
            filteredFiles: processedFiles,
            tokenReport
        };
    }
    
    /**
     * Apply file-level filtering based on inclusion/exclusion patterns
     */
    private static applyFileFiltering(
        fileList: Swark55Metadata['fileList'], 
        regexPatterns: Swark55RegexPatterns,
        repositoryPath: string
    ): Swark55Metadata['fileList'] {
        
        return fileList.filter(file => {
            const relativePath = path.relative(repositoryPath, file.path);
            
            // Check exclusion patterns first
            for (const excludePattern of regexPatterns.fileExclusion) {
                if (this.matchesPattern(relativePath, excludePattern)) {
                    return false;
                }
            }
            
            // Check inclusion patterns
            if (regexPatterns.fileInclusion.length === 0) {
                return true; // Include all if no inclusion patterns
            }
            
            for (const includePattern of regexPatterns.fileInclusion) {
                if (this.matchesPattern(relativePath, includePattern)) {
                    return true;
                }
            }
            
            return false;
        });
    }
    
    /**
     * Process individual file content with regex filtering
     */
    private static async processFileContent(
        file: Swark55Metadata['fileList'][0], 
        regexPatterns: Swark55RegexPatterns
    ): Promise<FilteredFileInfo | null> {
        try {
            const originalContent = await readFile(file.path, 'utf8');
            const contentFilters = regexPatterns.contentFilters[file.language];
            
            if (!contentFilters) {
                // No filters for this language, return as-is
                return {
                    ...file,
                    originalContent,
                    filteredContent: originalContent,
                    contentFilterStats: {
                        originalLines: originalContent.split('\n').length,
                        filteredLines: originalContent.split('\n').length,
                        loggingRemoved: 0,
                        testsRemoved: 0,
                        importsRemoved: 0,
                        boilerplateRemoved: 0
                    },
                    finalTokens: this.estimateTokens(originalContent)
                };
            }
            
            let filteredContent = originalContent;
            const stats: ContentFilterStats = {
                originalLines: originalContent.split('\n').length,
                filteredLines: 0,
                loggingRemoved: 0,
                testsRemoved: 0,
                importsRemoved: 0,
                boilerplateRemoved: 0
            };
            
            // Apply logging statement removal
            for (const pattern of contentFilters.loggingStatements) {
                const regex = new RegExp(pattern, 'gm');
                const matches = filteredContent.match(regex);
                if (matches) {
                    stats.loggingRemoved += matches.length;
                    filteredContent = filteredContent.replace(regex, '');
                }
            }
            
            // Apply test block removal
            for (const pattern of contentFilters.testBlocks) {
                const regex = new RegExp(pattern, 'gm');
                const matches = filteredContent.match(regex);
                if (matches) {
                    stats.testsRemoved += matches.length;
                    filteredContent = filteredContent.replace(regex, '');
                }
            }
            
            // Apply unused import removal
            for (const pattern of contentFilters.unusedImports) {
                const regex = new RegExp(pattern, 'gm');
                const matches = filteredContent.match(regex);
                if (matches) {
                    stats.importsRemoved += matches.length;
                    filteredContent = filteredContent.replace(regex, '');
                }
            }
            
            // Apply boilerplate removal
            for (const pattern of contentFilters.boilerplate) {
                const regex = new RegExp(pattern, 'gm');
                const matches = filteredContent.match(regex);
                if (matches) {
                    stats.boilerplateRemoved += matches.length;
                    filteredContent = filteredContent.replace(regex, '');
                }
            }
            
            // Clean up excessive whitespace
            filteredContent = this.cleanupWhitespace(filteredContent);
            stats.filteredLines = filteredContent.split('\n').length;
            
            return {
                ...file,
                originalContent,
                filteredContent,
                contentFilterStats: stats,
                finalTokens: this.estimateTokens(filteredContent)
            };
            
        } catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
            return null;
        }
    }
    
    /**
     * Clean up excessive whitespace while preserving code structure
     */
    private static cleanupWhitespace(content: string): string {
        return content
            // Remove multiple consecutive empty lines (keep max 2)
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Remove trailing whitespace
            .replace(/[ \t]+$/gm, '')
            // Remove leading/trailing empty lines
            .trim();
    }
    
    /**
     * Calculate comprehensive token report
     */
    private static calculateTokenReport(
        metadata: Swark55Metadata, 
        processedFiles: FilteredFileInfo[]
    ): Swark55ProcessedMetadata['tokenReport'] {
        
        const tokensAfterFileFiltering = processedFiles.reduce(
            (sum, file) => sum + file.estimatedTokens, 0
        );
        
        const tokensAfterContentFiltering = processedFiles.reduce(
            (sum, file) => sum + this.estimateTokens(file.filteredContent), 0
        );
        
        const finalTokens = processedFiles.reduce(
            (sum, file) => sum + file.finalTokens, 0
        );
        
        return {
            worstCaseTokens: metadata.worstCaseTokens,
            tokensAfterFileFiltering,
            tokensAfterContentFiltering,
            finalTokens
        };
    }
    
    /**
     * Match file path against glob-like pattern
     */
    private static matchesPattern(filePath: string, pattern: string): boolean {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')
            .replace(/\{([^}]+)\}/g, '($1)')
            .replace(/,/g, '|');
            
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filePath) || regex.test(filePath.replace(/\\/g, '/'));
    }
    
    /**
     * Estimate tokens from content (rough approximation)
     */
    private static estimateTokens(content: string): number {
        // More accurate token estimation
        // Average ~4 characters per token for code
        return Math.ceil(content.length / 4);
    }
}
