import { Injectable } from '@nestjs/common';
import { Metadata } from 'src/utils/types';

@Injectable()
export class PromptBuilderService {
  estimatePathTokens(filePath: string) {
    // Simple token estimation: ~4 characters per token
    // Path separators and common programming terms are often single tokens
    const pathLength = filePath.length;
    const separatorCount = (filePath.match(/[\/\\]/g) || []).length; // eslint-disable-line
    const dotCount = (filePath.match(/\./g) || []).length;

    // Rough estimation accounting for path structure
    const estimatedTokens =
      Math.ceil(pathLength / 4) + separatorCount + dotCount;
    return Math.max(1, estimatedTokens); // Minimum 1 token
  }

  buildPrompt(metadata: Metadata): any {
    const currentFiles: { path: string; estimatedTokens: number }[] = [];

    for (const f of metadata.fileList) {
      const estimatedTokens = this.estimatePathTokens(f.relativePath);
      currentFiles.push({
        path: f.relativePath,
        estimatedTokens,
      });
    }

    const promptJson = {
      instructions: [
        'You are an expert code analysis assistant.',
        'You will be given a complete list of all file paths in a repository, including files in all folders and subfolders.',
        'Your job is to:',
        '1. Analyze the entire file list and repository structure, considering all folders and nested files.',
        '2. Identify the programming languages used across all files.',
        '3. For each detected programming language, map the relevant file paths into that language.',
        '4. Ignore files that are clearly unnecessary (e.g., build artifacts, dependencies, coverage reports, documentation, style files, type definitions). If unsure about a file, include it.',
      ],
      repositoryAnalysis: {
        totalFiles: metadata.totalFiles,
        currentFiles,
      },
      responseFormat: {
        detectedLanguages: ['typescript', 'javascript', 'python', 'java'],
        fileIncluded: {
          typescript: [
            'src/user/extension.ts',
            'src/utils/helper.ts',
            'src/components/Button/index.tsx',
          ],
          python: ['scripts/analysis.py'],
          java: ['backend/src/Main.java'],
        },
        fileIgnored: [
          'node_modules/some-lib/index.js',
          'dist/bundle.js',
          'docs/README.md',
          'build/assets/logo.png',
          'coverage/report.html',
        ],
      },
      finalInstructions: [
        'IMPORTANT: Maintain the exact file paths as listed in the Current Files section.',
        'Based on the fileIncluded, the selected files will be used to generate a mind map.',
        'Focus on identifying the most relevant source code files for architectural analysis.',
        'Group files by programming language in the fileIncluded structure.',
      ],
      outputRequirement:
        'Respond ONLY with a valid JSON object in the structure described above. Do not include any explanation or commentary outside the JSON block.',
    };

    return promptJson;
  }
}
