import * as fs from 'fs';
import * as path from 'path';
// import { ModelInteractor } from "src/llm/llm.service";
import { promisify } from 'util';
import { encoding_for_model } from '@dqbd/tiktoken';
import type { TiktokenModel } from '@dqbd/tiktoken';

// const model = ModelInteractor.getModel();
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  estimatedTokens: number;
}
export class ExtractMetadataService {
  tokenCounter(content: string, model: TiktokenModel = 'gpt-4') {
    const encoder = encoding_for_model(model);
    const tokens = encoder.encode(content);
    return tokens.length;
  }

  async analyzeFile(
    repositoryPath: string,
    filePath: string,
    // detectedLanguages: string[]
  ) {
    try {
      const stats = await stat(filePath);
      const relativePath = path.relative(repositoryPath, filePath);
      // Read file content
      const content = await readFile(filePath, 'utf8');

      // Determine file language
      // const language = LLMLanguageDetector.detectFileLanguage(
      //   relativePath,
      //   detectedLanguages
      // );

      // Skip binary files and very large files
      // if (stats.size > 1024 * 1024) {
      //   // Skip files > 1MB
      //   return null;
      // }

      // Estimate tokens (rough approximation)
      const estimatedTokens = this.tokenCounter(content);

      return {
        path: filePath,
        relativePath,
        size: stats.size,
        estimatedTokens,
        // language,
        // importance: "low-priority", // Will be classified later
      };
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return null;
    }
  }

  async getAllFiles(repositoryPath: string): Promise<string[]> {
    const files: string[] = [];

    // Directories to skip entirely during scanning
    const excludedDirectories = new Set([
      'node_modules',
      '.git',
      'dist',
      'build',
      'out',
      'target',
      '.next',
      '.nuxt',
      'coverage',
      '.nyc_output',
      'logs',
      'tmp',
      'temp',
    ]);

    const scanDirectory = async (currentPath: string): Promise<void> => {
      try {
        const items = await readdir(currentPath);

        for (const item of items) {
          // Skip excluded directories and hidden files (except .gitignore)
          if (
            excludedDirectories.has(item) ||
            (item.startsWith('.') && item !== '.gitignore')
          ) {
            continue;
          }

          const itemPath = path.join(currentPath, item);
          const stats = await stat(itemPath);

          if (stats.isDirectory()) {
            await scanDirectory(itemPath);
          } else if (stats.isFile()) {
            files.push(itemPath);
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${currentPath}:`, error);
        // Skip directories we can't read
      }
    };

    await scanDirectory(repositoryPath);
    return files;
  }

  async buildDirectoryStructure(
    repositoryPath: string,
    maxDepth: number = 1000,
  ): Promise<string> {
    console.log('Building directory structure...');

    const structure: string[] = [];

    const buildTree = async (
      currentPath: string,
      prefix: string = '',
      depth: number = 0,
    ): Promise<void> => {
      if (depth > maxDepth) return;

      try {
        const items = await readdir(currentPath);
        const sortedItems = items.sort();

        for (let i = 0; i < sortedItems.length; i++) {
          const item = sortedItems[i];
          if (item.startsWith('.') && item !== '.gitignore') continue; // Skip hidden files except .gitignore

          const itemPath = path.join(currentPath, item);
          const stats = await stat(itemPath);
          const isLast = i === sortedItems.length - 1;
          const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');

          if (stats.isDirectory()) {
            structure.push(`${currentPrefix}${item}/`);
            await buildTree(itemPath, nextPrefix, depth + 1);
          } else {
            structure.push(`${currentPrefix}${item}`);
          }
        }
      } catch (error) {
        console.error(`Error building directory structure:`, error);
        // Skip directories we can't read
      }
    };

    structure.push(path.basename(repositoryPath) + '/');
    await buildTree(repositoryPath, '', 0);

    return structure.join('\n');
  }

  async extractMetadata(repositoryPath: string, selectedCommit: string) {
    // Scan directory structure
    const directoryStructure =
      await this.buildDirectoryStructure(repositoryPath);

    // console.log(directoryStructure);

    // Get all files with basic info
    const allFiles = await this.getAllFiles(repositoryPath);
    console.log(`Found ${allFiles.length} files in repository`);

    const fileList: FileInfo[] = [];
    let totalTokens = 0;

    for (const filePath of allFiles) {
      const fileInfo = await this.analyzeFile(
        repositoryPath,
        filePath,
        // detectedLanguages
      );
      if (fileInfo) {
        fileList.push(fileInfo);
        totalTokens += fileInfo.estimatedTokens;
      }
    }

    return {
      repositoryPath,
      selectedCommit,
      // detectedLanguages,
      totalFiles: fileList.length,
      directoryStructure,
      fileList,
      // dependencyGraph,
      worstCaseTokens: totalTokens,
    };
  }
}
