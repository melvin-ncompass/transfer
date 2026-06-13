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
  // detectedLanguages: string[];
  totalFiles: number;
  directoryStructure: string;
  fileList: Swark55FileInfo[];
  // dependencyGraph: {
  //   [filePath: string]: string[];
  // };
  worstCaseTokens: number;
}
const model = ModelInteractor.getModel();

export class Swark55MetadataExtractor {
  /**
   * Extract comprehensive metadata from repository at specific commit
   */
  public static async extractMetadata(
    repositoryPath: string,
    selectedCommit: GitCommit
  ): Promise<Swark55Metadata> {
    // Scan directory structure
    console.log(
      `Scanning repository at ${repositoryPath} for commit ${selectedCommit.hash}`
    );
    const directoryStructure = await this.buildDirectoryStructure(
      repositoryPath
    );

    // Get all files with basic info
    const allFiles = await this.getAllFiles(repositoryPath);
    console.log(`Found ${allFiles.length} files in repository`);
    // Detect languages dynamically using LLM
    // const detectedLanguages = await LLMLanguageDetector.detectLanguages(
    //   allFiles
    // );

    // Analyze each file and classify importance
    const fileList: Swark55FileInfo[] = [];
    let totalTokens = 0;

    for (const filePath of allFiles) {
      const fileInfo = await this.analyzeFile(
        repositoryPath,
        filePath
        // detectedLanguages
      );
      if (fileInfo) {
        fileList.push(fileInfo);
        totalTokens += fileInfo.estimatedTokens;
      }
    }

    // Build dependency graph
    // const dependencyGraph = await DependencyAnalyzer.buildDependencyGraph(
    //   repositoryPath,
    //   fileList
    // );

    // Use LLM to classify file importance dynamically
    // await this.classifyFileImportanceWithLLM(
    //   fileList,
    //   dependencyGraph,
    //   detectedLanguages,
    //   directoryStructure
    // );

    // Ensure we have some important files for diagram generation
    // this.ensureImportantFiles(fileList, detectedLanguages, repositoryPath);

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

  /**
   * Ensure we have important files identified for diagram generation
   */
  // private static ensureImportantFiles(
  //   fileList: Swark55FileInfo[],
  //   detectedLanguages: string[],
  //   repositoryPath: string
  // ): void {
  //   // If no critical entry points found, promote some files
  //   const entryPoints = fileList.filter(
  //     (f) => f.importance === "critical-entry-point"
  //   );

  //   if (entryPoints.length === 0) {
  //     // Look for main entry files by language
  //     for (const language of detectedLanguages) {
  //       const mainFile = this.findMainFileForLanguage(fileList, language);
  //       if (mainFile) {
  //         mainFile.importance = "critical-entry-point";
  //         break;
  //       }
  //     }
  //   }

  //   // Ensure we have core modules
  //   const coreModules = fileList.filter((f) => f.importance === "core-module");
  //   if (coreModules.length < 3) {
  //     // Promote largest/most connected files to core modules
  //     const candidates = fileList
  //       .filter((f) => f.importance === "supporting-utility")
  //       .sort((a, b) => b.size - a.size)
  //       .slice(0, 5);

  //     candidates.forEach((file) => {
  //       if (coreModules.length < 5) {
  //         file.importance = "core-module";
  //         coreModules.push(file);
  //       }
  //     });
  //   }
  // }

  /**
   * Find main file for a specific language using intelligent patterns
   */
  // private static findMainFileForLanguage(
  //   fileList: Swark55FileInfo[],
  //   language: string
  // ): Swark55FileInfo | null {
  //   // Generic main file patterns that work across languages
  //   const genericMainPatterns = [
  //     /^main\./i,
  //     /^index\./i,
  //     /^app\./i,
  //     /^server\./i,
  //     /^run\./i,
  //     /^start\./i,
  //   ];

  //   // Language-specific entry points
  //   const languageSpecificPatterns: { [key: string]: RegExp[] } = {
  //     vue: [/App\.vue$/i, /main\.(ts|js)$/i],
  //     react: [/App\.(jsx|tsx)$/i, /index\.(jsx|tsx)$/i],
  //     angular: [/main\.ts$/i, /app\.module\.ts$/i, /app\.component\.ts$/i],
  //     python: [/__main__\.py$/i, /main\.py$/i, /app\.py$/i],
  //     java: [/Main\.java$/i, /Application\.java$/i, /App\.java$/i],
  //     go: [/main\.go$/i],
  //     rust: [/main\.rs$/i, /lib\.rs$/i],
  //     html: [/index\.html$/i],
  //   };

  //   // Try language-specific patterns first
  //   const specificPatterns = languageSpecificPatterns[language] || [];
  //   for (const pattern of specificPatterns) {
  //     const found = fileList.find((f) => pattern.test(f.relativePath));
  //     if (found) return found;
  //   }

  //   // Fall back to generic patterns
  //   for (const pattern of genericMainPatterns) {
  //     const found = fileList.find(
  //       (f) =>
  //         pattern.test(path.basename(f.relativePath)) && f.language === language
  //     );
  //     if (found) return found;
  //   }

  //   // Last resort: find any file with the target language in src/
  //   const srcFile = fileList.find(
  //     (f) => f.language === language && /^src\//i.test(f.relativePath)
  //   );

  //   return srcFile || null;
  // }

  /**
   * Build a textual representation of directory structure
   */
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
          if (item.startsWith(".") && item !== ".gitignore") continue; // Skip hidden files except .gitignore

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
        // Skip directories we can't read
      }
    };

    structure.push(path.basename(repositoryPath) + "/");
    await buildTree(repositoryPath, "", 0);

    return structure.join("\n");
  }

  /**
   * Get all files in the repository
   */
  private static async getAllFiles(repositoryPath: string): Promise<string[]> {
    const files: string[] = [];

    // Directories to skip entirely during scanning
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
          // Skip excluded directories and hidden files (except .gitignore)
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
        // Skip directories we can't read
      }
    };

    await scanDirectory(repositoryPath);
    return files;
  }

  /**
   * Analyze individual file
   */
  private static async analyzeFile(
    repositoryPath: string,
    filePath: string
    // detectedLanguages: string[]
  ): Promise<Swark55FileInfo | null> {
    try {
      const stats = await stat(filePath);

      const tokenCounter = (await model).countTokens;
      const relativePath = path.relative(repositoryPath, filePath);
      // Read file content
      const content = await readFile(filePath, "utf8");

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
      const estimatedTokens = await tokenCounter(content);

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

  /**
   * Classify file importance using LLM analysis for dynamic language support
   */
  // private static async classifyFileImportanceWithLLM(
  //   fileList: Swark55FileInfo[],
  //   dependencyGraph: { [filePath: string]: string[] },
  //   detectedLanguages: string[],
  //   directoryStructure: string
  // ): Promise<void> {
  //   try {
  //     // Prepare request for LLM classification
  //     const classificationRequest: FileClassificationRequest = {
  //       files: fileList.map((f) => ({
  //         path: f.path,
  //         relativePath: f.relativePath,
  //         size: f.size,
  //         language: f.language,
  //       })),
  //       detectedLanguages,
  //       dependencyGraph,
  //       repositoryContext: directoryStructure,
  //     };

  //     // Get LLM classifications
  //     const response = await LLMFileClassifier.classifyFiles(
  //       classificationRequest
  //     );

  //     // Apply classifications to file list
  //     const classificationMap = new Map(
  //       response.classifications.map((c) => [c.relativePath, c.importance])
  //     );

  //     for (const file of fileList) {
  //       const classification = classificationMap.get(file.relativePath);
  //       file.importance = classification || "low-priority";
  //     }

  //     console.log(
  //       `LLM classified ${
  //         response.classifications.length
  //       } files across ${detectedLanguages.join(", ")} languages`
  //     );
  //   } catch (error) {
  //     console.warn(
  //       "LLM file classification failed, falling back to heuristic classification:",
  //       error
  //     );

  //     // Fallback to basic heuristic classification
  //     // await this.fallbackClassifyFileImportance(
  //     //   fileList,
  //     //   dependencyGraph,
  //     //   detectedLanguages
  //     // );
  //   }
  // }

  /**
   * Fallback heuristic classification when LLM fails
   */
  //   private static async fallbackClassifyFileImportance(
  //     fileList: Swark55FileInfo[],
  //     dependencyGraph: { [filePath: string]: string[] },
  //     detectedLanguages: string[]
  //   ): Promise<void> {
  //     // Simple heuristic patterns for fallback
  //     const entryPointPatterns = [
  //       /main\.(js|ts|py|java|go|rs|php|rb)$/i,
  //       /index\.(js|ts|html|php)$/i,
  //       /app\.(js|ts|py|vue|jsx|tsx)$/i,
  //       /server\.(js|ts|py)$/i,
  //       /App\.(vue|jsx|tsx)$/i,
  //     ];

  //     const corePatterns = [
  //       /src\/(?:core|lib|engine|service|api|controller|model)/i,
  //       /lib\/(?:core|main)/i,
  //       /app\/(?:models|controllers|services|api)/i,
  //       /(?:service|controller|model|api|engine)\./i,
  //     ];

  //     const utilityPatterns = [
  //       /(?:util|helper|tool|common|config|middleware)/i,
  //       /(?:test|spec)\./i,
  //     ];

  //     for (const file of fileList) {
  //       const fileName = path.basename(file.relativePath);

  //       // Check for entry points
  //       const isEntryPoint = entryPointPatterns.some((pattern) =>
  //         pattern.test(fileName)
  //       );
  //       if (isEntryPoint) {
  //         file.importance = "critical-entry-point";
  //         continue;
  //       }

  //       // Check for core modules
  //       const isCoreModule = corePatterns.some((pattern) =>
  //         pattern.test(file.relativePath)
  //       );
  //       if (isCoreModule) {
  //         file.importance = "core-module";
  //         continue;
  //       }

  //       // Check dependency count
  //       const dependentCount = Object.values(dependencyGraph).filter((deps) =>
  //         deps.includes(file.relativePath)
  //       ).length;

  //       if (dependentCount >= 3) {
  //         file.importance = "core-module";
  //         continue;
  //       }

  //       // Check for utility files
  //       const isUtility = utilityPatterns.some((pattern) =>
  //         pattern.test(file.relativePath)
  //       );
  //       if (isUtility) {
  //         file.importance = "supporting-utility";
  //         continue;
  //       }

  //       // Default classification
  //       if (/(?:src|lib|app)\//i.test(file.relativePath)) {
  //         file.importance = "supporting-utility";
  //       } else {
  //         file.importance = "low-priority";
  //       }
  //     }
  //   }
}
