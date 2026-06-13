import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileAnalyzerService } from '../preprocess/utils/file-analyzer.service';
import * as fs from 'fs';
import * as path from 'path';

export interface FunctionMetadata {
  functionName: string;
  filePath: string;
  starts: number;
  ends: number;
  usedBy: Array<{
    path: string;
    name: string;
    starts: number;
    ends: number;
  }>;
  dependsOn: Array<{
    path: string;
    name: string;
    starts: number;
    ends: number;
  }>;
}

export interface CodeExplanation {
  functionName: string;
  filePath: string;
  lineRange: string;
  purpose: string;
  parameters: string;
  returns: string;
  logic: string;
  dependencies: string;
  codeBlock: string;
  language: string;
}

@Injectable()
export class CodeAnalyzerService {
  private readonly logger = new Logger(CodeAnalyzerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fileAnalyzerService: FileAnalyzerService,
  ) {}

  async explainFunction(
    relativePath: string,
    repo: string,
    username: string,
  ): Promise<CodeExplanation> {
    this.logger.log(`📊 Starting function explanation for: ${relativePath}`);

    // Step 1: Read function metadata from JSON file
    const functionMetadata = await this.readFunctionMetadata(
      relativePath,
      repo,
      username,
    );

    // Step 2: Extract code from source file
    const codeBlock = await this.extractCodeFromFile(
      functionMetadata.filePath,
      functionMetadata.starts,
      functionMetadata.ends,
      repo,
      username,
    );

    // Step 3: Generate explanation using LLM
    const explanation = await this.generateExplanation(
      functionMetadata,
      codeBlock,
    );

    return explanation;
  }

  private async readFunctionMetadata(
    relativePath: string,
    repo: string,
    username: string,
  ): Promise<FunctionMetadata> {
    try {
      const USERS_ROOT =
        this.configService.get<string>('USERS_ROOT') ||
        process.env.USERS_ROOT ||
        '/Users/praveen-ncompass/mindmap';

      const jsonFilePath = path.join(
        USERS_ROOT,
        username,
        repo,
        'graph',
        relativePath,
      );

      this.logger.log(`📄 Reading JSON metadata from: ${jsonFilePath}`);

      // Validate path for security
      if (
        !relativePath.startsWith('functions/') ||
        relativePath.includes('..') ||
        !relativePath.endsWith('.json')
      ) {
        throw new Error('Invalid relativePath format');
      }

      const jsonContent = await fs.promises.readFile(jsonFilePath, 'utf8');
      const metadata = JSON.parse(jsonContent) as FunctionMetadata;

      this.logger.log(
        `✅ Function metadata loaded: ${metadata.functionName} (lines ${metadata.starts}-${metadata.ends})`,
      );

      return metadata;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Error reading function metadata: ${errorMsg}`);
      throw new Error(`Failed to read function metadata: ${errorMsg}`);
    }
  }

  private async extractCodeFromFile(
    filePath: string,
    startLine: number,
    endLine: number,
    repo: string,
    username: string,
  ): Promise<string> {
    try {
      const USERS_ROOT =
        this.configService.get<string>('USERS_ROOT') ||
        process.env.USERS_ROOT ||
        '/Users/praveen-ncompass/mindmap';

      // Construct path to the extracted repository
      const sourceFilePath = path.join(
        USERS_ROOT,
        username,
        repo,
        'extracted',
        filePath,
      );

      this.logger.log(
        `📖 Reading source code from: ${sourceFilePath} (lines ${startLine}-${endLine})`,
      );

      const fileContent = await fs.promises.readFile(sourceFilePath, 'utf8');
      const lines = fileContent.split('\n');

      // Extract the specific lines (convert to 0-based indexing)
      const codeLines = lines.slice(startLine - 1, endLine);
      const codeBlock = codeLines.join('\n');

      this.logger.log(
        `✅ Code extracted: ${codeLines.length} lines, ${codeBlock.length} characters`,
      );

      return codeBlock;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Error extracting code: ${errorMsg}`);
      throw new Error(`Failed to extract code from file: ${errorMsg}`);
    }
  }

  private async generateExplanation(
    metadata: FunctionMetadata,
    codeBlock: string,
  ): Promise<CodeExplanation> {
    try {
      const language = this.detectLanguage(metadata.filePath);

      const prompt = this.buildExplanationPrompt(metadata, codeBlock, language);

      this.logger.log(`🤖 Sending code to LLM for explanation...`);

      // Use existing FileAnalyzerService to call LLM
      const llmResponse = await this.fileAnalyzerService.analyzeFileUsingOpenAI(
        prompt,
        this.estimateTokens(prompt), // Simple token estimation
      );
      // Parse LLM response
      const cleanedResponse = this.extractJsonFromResponse(llmResponse);

      return {
        functionName: metadata.functionName,
        filePath: metadata.filePath,
        lineRange: `${metadata.starts}-${metadata.ends}`,
        purpose:
          (cleanedResponse.purpose as string) || 'Purpose not identified',
        parameters:
          (cleanedResponse.parameters as string) || 'Parameters not identified',
        returns:
          (cleanedResponse.returns as string) || 'Return value not identified',
        logic: (cleanedResponse.logic as string) || 'Logic not analyzed',
        dependencies: this.formatDependencies(metadata),
        codeBlock,
        language,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Error generating explanation: ${errorMsg}`);
      throw new Error(`Failed to generate explanation: ${errorMsg}`);
    }
  }

  private buildExplanationPrompt(
    metadata: FunctionMetadata,
    codeBlock: string,
    language: string,
  ): string {
    const dependenciesText =
      metadata.dependsOn.map((dep) => dep.name).join(', ') || 'None';

    const usedByText =
      metadata.usedBy.map((caller) => caller.name).join(', ') || 'None';

    return `
Analyze this ${language} function and provide a clear explanation in JSON format:

FUNCTION: ${metadata.functionName}
FILE: ${metadata.filePath}
LINES: ${metadata.starts}-${metadata.ends}

CODE:
\`\`\`${language}
${codeBlock}
\`\`\`

CONTEXT:
- Dependencies: ${dependenciesText}
- Used by: ${usedByText}

Please respond with a JSON object containing:
{
  "purpose": "What does this function do? (1-2 sentences)",
  "parameters": "What inputs does it accept? List each parameter",
  "returns": "What does it return?",
  "logic": "How does it work? Explain the main steps (3-5 bullet points)"
}

Focus on clarity and conciseness. Avoid overly technical jargon.
`;
  }

  private extractJsonFromResponse(response: any): any {
    let responseText: string;

    // Handle different response types
    if (typeof response === 'string') {
      responseText = response;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if (response && typeof response.rawText === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      responseText = response.rawText;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if (response && typeof response.content === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      responseText = response.content;
    } else {
      responseText = JSON.stringify(response);
    }

    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = responseText.match(
      /```(?:json)?\s*\n([\s\S]*?)\n```/,
    );
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim());
      } catch (err) {
        console.warn(
          'Failed to parse JSON from code block, trying direct parse',
          err,
        );
      }
    }

    // Try to find JSON object boundaries
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.warn('Failed to parse extracted JSON object', err);
      }
    }

    // Try direct JSON parse as fallback
    try {
      return JSON.parse(responseText);
    } catch (err) {
      console.error(
        'Failed to extract valid JSON from LLM response:',
        responseText,
        err,
      );
      throw new Error('LLM response is not valid JSON format');
    }
  }

  private extractSection(text: string, section: string): string {
    const regex = new RegExp(`${section}[:s]*([^n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private formatDependencies(metadata: FunctionMetadata): string {
    const deps = metadata.dependsOn.map((dep) => `${dep.name} (${dep.path})`);
    const callers = metadata.usedBy.map(
      (caller) => `${caller.name} (${caller.path})`,
    );

    return `Dependencies: ${deps.join(', ') || 'None'} | Used by: ${
      callers.join(', ') || 'None'
    }`;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
    };

    return languageMap[ext] || 'code';
  }

  private estimateTokens(text: string): number {
    // Simple token estimation: roughly 4 characters per token
    return Math.ceil(text.length / 4);
  }
}
