import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { GitCommit } from "./git-utils";
import { DynamicLanguageAnalyzer } from "./dynamic-language-analyzer";
import { DependencyAnalyzer } from "./dependency-analyzer";
import { TokenCounter } from "../types";
import {
  LLMFileClassifier,
  FileClassificationRequest,
} from "../llm/file-classifier";
import { LLMLanguageDetector } from "../llm/language-detector";
import { ModelInteractor } from "../llm/model-interactor";

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface Swark55FileInfo {
  path: string;
  relativePath: string;
  size: number;
  estimatedTokens: any;
}

export interface Swark55Metadata {
  repositoryPath: string;
  selectedCommit: GitCommit;
  
  totalFiles: number;
  directoryStructure: string;
  fileList: Swark55FileInfo[];

  worstCaseTokens: number;
}
const model = ModelInteractor.getModel();

export class Swark55MetadataExtractor {
  
  public static async extractMetadata(
    repositoryPath: string,
    selectedCommit: GitCommit
  ): Promise<Swark55Metadata> {

    const directoryStructure = await this.buildDirectoryStructure(
      repositoryPath
    );

    const allFiles = await this.getAllFiles(repositoryPath);

    const fileList: Swark55FileInfo[] = [];
    let totalTokens = 0;

    for (const filePath of allFiles) {
      const fileInfo = await this.analyzeFile(
        repositoryPath,
        filePath
        
      );
      if (fileInfo) {
        fileList.push(fileInfo);
        totalTokens += fileInfo.estimatedTokens;
      }
    }

    return {
      repositoryPath,
      selectedCommit,
      
      totalFiles: fileList.length,
      directoryStructure,
      fileList,
      
      worstCaseTokens: totalTokens,
    };
  }

  private static async buildDirectoryStructure(
    repositoryPath: string,
    maxDepth: number = 1000
  ): Promise<string> {
    const structure: string[] = [];

    const buildTree = async (
      currentPath: string,
      prefix: string = "",
      depth: number = 0
    ): Promise<void> => {
      if (depth > maxDepth) return;

      try {
        const items = await readdir(currentPath);
        const sortedItems = items.sort();

        for (let i = 0; i < sortedItems.length; i++) {
          const item = sortedItems[i];
          if (item.startsWith(".") && item !== ".gitignore") continue; 

          const itemPath = path.join(currentPath, item);
          const stats = await stat(itemPath);
          const isLast = i === sortedItems.length - 1;
          const currentPrefix = prefix + (isLast ? "└── " : "├── ");
          const nextPrefix = prefix + (isLast ? "    " : "│   ");

          if (stats.isDirectory()) {
            structure.push(`${currentPrefix}${item}/`);
            await buildTree(itemPath, nextPrefix, depth + 1);
          } else {
            structure.push(`${currentPrefix}${item}`);
          }
        }
      } catch (error) {
        
      }
    };

    structure.push(path.basename(repositoryPath) + "/");
    await buildTree(repositoryPath, "", 0);

    return structure.join("\n");
  }

  private static async getAllFiles(repositoryPath: string): Promise<string[]> {
    const files: string[] = [];

    const excludedDirectories = new Set([
      "node_modules",
      ".git",
      "dist",
      "build",
      "out",
      "target",
      ".next",
      ".nuxt",
      "coverage",
      ".nyc_output",
      "logs",
      "tmp",
      "temp",
    ]);

    const scanDirectory = async (currentPath: string): Promise<void> => {
      try {
        const items = await readdir(currentPath);

        for (const item of items) {
          
          if (
            excludedDirectories.has(item) ||
            (item.startsWith(".") && item !== ".gitignore")
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
        
      }
    };

    await scanDirectory(repositoryPath);
    return files;
  }

  private static async analyzeFile(
    repositoryPath: string,
    filePath: string
    
  ): Promise<Swark55FileInfo | null> {
    try {
      const stats = await stat(filePath);

      const tokenCounter = (await model).countTokens;
      const relativePath = path.relative(repositoryPath, filePath);
      
      const content = await readFile(filePath, "utf8");

      const estimatedTokens = await tokenCounter(content);

      return {
        path: filePath,
        relativePath,
        size: stats.size,
        estimatedTokens,

      };
    } catch (error) {
      
      return null;
    }
  }

}
