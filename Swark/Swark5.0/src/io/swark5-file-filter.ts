import * as vscode from 'vscode';
import { TokenCounter } from '../types';
import { Swark5Metadata } from '../commands/create-swark5-architecture';

/**
 * Swark 5.0: LLM-guided intelligent file filtering to exclude unnecessary files
 */
export class Swark5FileFilter {
    private model: vscode.LanguageModelChat;
    private tokenCounter: TokenCounter;

    constructor(model: vscode.LanguageModelChat, tokenCounter: TokenCounter) {
        this.model = model;
        this.tokenCounter = tokenCounter;
    }

    /**
     * Filter out unnecessary files using LLM guidance
     */
    async filterUnnecessaryFiles(metadata: Swark5Metadata): Promise<Swark5Metadata['fileList']> {
        console.log('🔍 Using LLM to filter out unnecessary files...');
        
        const prompt = this.buildFileFilteringPrompt(metadata);
        const promptMessage = vscode.LanguageModelChatMessage.User(prompt);
        
        try {
            const response = await this.model.sendRequest([promptMessage], {});
            const responseText = await this.readStream(response);
            
            // Parse LLM response to get filtered file list
            const filteredPaths = this.parseFilteringResponse(responseText);
            
            // Filter the original file list
            const filteredFiles = metadata.fileList.filter(file => 
                filteredPaths.includes(file.path)
            );
            
            console.log(`📁 Filtered from ${metadata.fileList.length} to ${filteredFiles.length} files`);
            console.log(`💾 Token reduction: ${metadata.worstCaseTokens} → ${filteredFiles.reduce((sum, file) => sum + file.estimatedTokens, 0)}`);
            
            return filteredFiles;
            
        } catch (error) {
            console.error('Failed to get LLM file filtering:', error);
            // Fallback to rule-based filtering
            return this.fallbackFileFiltering(metadata);
        }
    }

    /**
     * Build file filtering prompt for LLM
     */
    private buildFileFilteringPrompt(metadata: Swark5Metadata): string {
        // Prepare file summary for LLM (limit to prevent token overflow)
        const fileSummary = metadata.fileList
            .slice(0, 200) // Limit to first 200 files
            .map(file => `${file.path} (${file.language}, ${file.importance}, ${file.estimatedTokens} tokens)`)
            .join('\n');

        return `# Swark 5.0: Intelligent File Filtering

## Repository Context
- **Repository**: ${metadata.repositoryPath}
- **Commit**: ${metadata.commitHash}
- **Total Files**: ${metadata.totalFiles}
- **Total Tokens**: ${metadata.worstCaseTokens}

## Repository Structure Preview
\`\`\`
${metadata.repositoryStructure.split('\n').slice(0, 30).join('\n')}
\`\`\`

## Available Files (showing first 200)
${fileSummary}

## Your Task: Filter Out Unnecessary Files

You need to **EXCLUDE** files that do not contribute to architectural or functional understanding. 
**EXCLUDE** the following types of files:

### 🚫 Documentation Files
- *.md, *.rst, *.txt (README, CHANGELOG, etc.)
- LICENSE, NOTICE, COPYING files
- Documentation directories (docs/, documentation/)

### 🚫 Auto-Generated Files
- *.pb.go, *.gen.ts, *.generated.*
- openapi.json, swagger.json
- Build artifacts in dist/, build/, out/
- Compiled files (*.class, *.pyc, *.o)

### 🚫 Test Files
- test directories (tests/, __tests__, spec/)
- Test files (*.test.js, *.spec.ts, *_test.py, *Test.java)
- Mock files and fixtures

### 🚫 Configuration & Environment Files
- .env, .env.*
- package-lock.json, yarn.lock, poetry.lock
- *.toml, *.ini configuration files
- IDE configurations (.vscode/, .idea/)
- CI/CD configurations (.github/, .gitlab-ci.yml)

### 🚫 Asset & Media Files
- Images (*.png, *.jpg, *.svg, *.gif)
- Fonts, audio, video files
- Binary files and archives

### ✅ KEEP These Important Files
- Main entry points (main.*, index.*, app.*)
- Core source code files
- Important configuration (package.json, tsconfig.json, etc.)
- Schema and API definitions
- Database migrations and models

## Response Format
Return **ONLY** the JSON array of file paths to **KEEP** (not exclude):

\`\`\`json
[
  "src/main.ts",
  "src/app.ts",
  "package.json",
  "src/models/user.ts",
  "src/services/api.ts"
]
\`\`\`

**Important**: 
- Return ONLY the JSON array, no additional text or explanation
- Include only files that contribute to understanding the system architecture and functionality
- Prioritize files marked as 'entry-point' and 'core' importance
- Be aggressive in filtering - aim to reduce token usage by 40-70%
- Focus on source code that shows the system's structure and logic`;
    }

    /**
     * Parse LLM response to extract filtered file paths
     */
    private parseFilteringResponse(responseText: string): string[] {
        try {
            // Clean the response text
            const cleanResponse = responseText.trim();
            
            // Find JSON array in the response
            const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            
            const jsonString = jsonMatch[0];
            const filteredPaths = JSON.parse(jsonString);
            
            if (!Array.isArray(filteredPaths)) {
                throw new Error('Response is not an array');
            }
            
            return filteredPaths.filter(path => typeof path === 'string');
            
        } catch (error) {
            console.error('Failed to parse LLM filtering response:', error);
            console.log('Raw response:', responseText);
            throw error;
        }
    }

    /**
     * Fallback rule-based file filtering
     */
    private fallbackFileFiltering(metadata: Swark5Metadata): Swark5Metadata['fileList'] {
        console.log('🔄 Using fallback rule-based file filtering...');
        
        const excludePatterns = [
            // Documentation
            /\.(md|rst|txt)$/i,
            /^(readme|changelog|license|notice|copying)/i,
            /\/(docs?|documentation)\//i,
            
            // Auto-generated
            /\.(pb\.go|gen\.ts|generated\.|class|pyc|o)$/i,
            /openapi\.json|swagger\.json/i,
            /\/(dist|build|out|target)\//i,
            
            // Tests
            /\/(tests?|__tests__|spec)\//i,
            /\.(test|spec)\.(js|ts|py|java)$/i,
            /_test\.(py|go)$/i,
            /Test\.java$/i,
            
            // Config & Environment
            /^\.env/i,
            /package-lock\.json|yarn\.lock|poetry\.lock/i,
            /\.(toml|ini)$/i,
            /^\.vscode|^\.idea/i,
            /^\.github|\.gitlab-ci\.yml/i,
            
            // Assets & Media
            /\.(png|jpg|jpeg|gif|svg|ico|pdf|mp4|mp3|wav|zip|tar|gz)$/i,
            /\/(assets|static|public)\/.*\.(png|jpg|jpeg|gif|svg|ico)$/i
        ];
        
        const includePatterns = [
            // Important configs
            /package\.json$/i,
            /tsconfig\.json$/i,
            /Cargo\.toml$/i,
            /go\.mod$/i,
            /pom\.xml$/i,
            /build\.gradle$/i,
            /Makefile$/i
        ];
        
        return metadata.fileList.filter(file => {
            // Always include important config files
            if (includePatterns.some(pattern => pattern.test(file.path))) {
                return true;
            }
            
            // Exclude files matching exclude patterns
            if (excludePatterns.some(pattern => pattern.test(file.path))) {
                return false;
            }
            
            // Include source code files
            const sourceExtensions = [
                '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
                '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.lua'
            ];
            
            const ext = file.path.substring(file.path.lastIndexOf('.'));
            return sourceExtensions.includes(ext.toLowerCase());
        });
    }

    /**
     * Read stream response from LLM
     */
    private async readStream(response: vscode.LanguageModelChatResponse): Promise<string> {
        let fullResponse = '';
        for await (const chunk of response.text) {
            fullResponse += chunk;
        }
        return fullResponse;
    }
}
