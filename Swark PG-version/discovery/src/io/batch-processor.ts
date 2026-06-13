import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { PromptBuilder } from "./prompt-builder";
import { FileAnalyzer } from "./file-analyuzer";
import { JsonCleaner } from "./json-cleaner";

export interface BatchResult {
  success: boolean;
  responseFromModel: string | null;
  batchSummaryPath?: string;
  error?: string;
}

export interface BatchInfo {
  batchNumber: number;
  description: string;
  filePatterns: string[];
  maxFiles: number;
  estimatedTokens: number;
}

export interface BatchingStrategy {
  batches: BatchInfo[];
  totalBatches: number;
  reasoning: string;
}

export class BatchProcessor {
  /**
   * Process repository metadata using intelligent batching when tokens exceed threshold
   */
  public static async processBatches(
    metadata: any,
    estimatedTotalTokens: number,
    tokenThreshold: number,
    tokenCounter: any,
    repositoryPath: string,
    selectedCommit: any,
    batchSummaryPath: string,
    progress: vscode.Progress<{ message?: string }>,
    fileAnalyzerPath?: string  // Optional path to fileanalyzer data
  ): Promise<BatchResult> {
    try {
      // Use fileanalyzer data if available, otherwise use metadata
      let workingMetadata = metadata;
      
      if (fileAnalyzerPath && fs.existsSync(fileAnalyzerPath)) {
        console.log("Reading fileanalyzer data for batching...");
        const fileAnalyzerContent = fs.readFileSync(fileAnalyzerPath, 'utf8');
        const analyzedData = JsonCleaner.clean(fileAnalyzerContent);
        
        if (analyzedData && analyzedData.fileInclusion) {
          // Convert fileanalyzer data to metadata format for batching
          const fileAnalyzerMetadata = {
            ...metadata,
            fileList: [] as any[]
          };

          // Extract file list from analyzedData.fileInclusion
          Object.keys(analyzedData.fileInclusion).forEach(language => {
            const files = analyzedData.fileInclusion[language];
            if (Array.isArray(files)) {
              files.forEach((filePath: string) => {
                // Estimate tokens for each file
                const estimatedTokens = Math.ceil(filePath.length * 0.25) + 100;
                fileAnalyzerMetadata.fileList.push({
                  path: filePath,
                  relativePath: filePath,
                  size: 0,
                  estimatedTokens: estimatedTokens
                });
              });
            }
          });

          workingMetadata = fileAnalyzerMetadata;
          console.log(`Using fileanalyzer data with ${workingMetadata.fileList.length} files for batching`);
        }
      }

      // Get batching strategy from LLM
      const batchingStrategy = await this.getBatchingStrategy(
        workingMetadata,
        estimatedTotalTokens,
        tokenThreshold,
        tokenCounter
      );

      if (!batchingStrategy) {
        return {
          success: false,
          responseFromModel: null,
          error: "Failed to get batching strategy from LLM"
        };
      }

      // Initialize batch summary file
      await this.initializeBatchSummary(
        batchSummaryPath,
        repositoryPath,
        selectedCommit,
        estimatedTotalTokens,
        tokenThreshold,
        batchingStrategy.reasoning
      );

      // Process each batch
      const batchResponses: string[] = [];
      const batches = batchingStrategy.batches;

      vscode.window.showInformationMessage(
        `🔄 Using ${batches.length} batches for processing...`
      );

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        progress.report({
          message: `Processing batch ${i + 1}/${batches.length}: ${batch.description}`,
        });

        const batchResult = await this.processSingleBatch(
          batch,
          i,
          workingMetadata,  // Use workingMetadata instead of metadata
          tokenCounter,
          batchSummaryPath
        );

        if (batchResult) {
          batchResponses.push(`=== BATCH ${i + 1}: ${batch.description} ===\n${batchResult}`);
        }
      }

      // Combine all batch responses
      const combinedResponse = await this.combineBatchResponses(batchResponses, batches);

      vscode.window.showInformationMessage(
        `✅ Processed ${batches.length} batches using LLM strategy! Batch summary saved to: ${path.basename(batchSummaryPath)}`
      );

      return {
        success: true,
        responseFromModel: combinedResponse,
        batchSummaryPath: batchSummaryPath
      };

    } catch (error) {
      console.error("Error in batch processing:", error);
      return {
        success: false,
        responseFromModel: null,
        error: error instanceof Error ? error.message : "Unknown batch processing error"
      };
    }
  }

  /**
   * Get batching strategy from LLM
   */
  private static async getBatchingStrategy(
    metadata: any,
    estimatedTotalTokens: number,
    tokenThreshold: number,
    tokenCounter: any
  ): Promise<BatchingStrategy | null> {
    const batchingPrompt = `Create a batching strategy. Do NOT analyze code content.

Task: Split ${metadata.fileList.length} files into ${Math.ceil(
      estimatedTotalTokens / tokenThreshold
    )} batches, each under ${Math.floor(tokenThreshold)} tokens.

Sample files:
${metadata.fileList
      .slice(0, 20)
      .map((f: any) => `${f.relativePath}: ${f.estimatedTokens || 0} tokens`)
      .join("\n")}

RESPOND WITH THIS EXACT JSON FORMAT:
{
  "batches": [
    {
      "batchNumber": 1,
      "description": "TypeScript and configuration files",
      "filePatterns": ["*.ts", "*.json"],
      "maxFiles": 50,
      "estimatedTokens": 8000
    }
  ],
  "totalBatches": 2,
  "reasoning": "Grouped by file type"
}`;

    const batchingResponse = await FileAnalyzer.analyzeFileUsingOpenAI(
      batchingPrompt,
      await tokenCounter(batchingPrompt)
    );

    if (!batchingResponse) {
      return null;
    }

    console.log("Raw batching response:", batchingResponse);

    // Try to parse the JSON directly first, before using JsonCleaner
    let batchingResult;
    try {
      batchingResult = JSON.parse(batchingResponse);
      console.log("Direct JSON parse successful:", batchingResult);
    } catch (directParseError) {
      console.log("Direct JSON parse failed, trying JsonCleaner:", directParseError);
      batchingResult = JsonCleaner.clean(batchingResponse);
      console.log("JsonCleaner result:", batchingResult);
    }

    if (batchingResult && (batchingResult.batches || batchingResult.detectedLanguages)) {
      // Check if we got the wrong response format (analysis instead of batching)
      if (batchingResult.detectedLanguages && !batchingResult.batches) {
        console.log("LLM returned analysis format instead of batching format, creating simple batches");

        // Create simple batches based on detected languages
        const languages = batchingResult.detectedLanguages || [];
        const batches = languages.map((lang: string, index: number) => ({
          batchNumber: index + 1,
          description: `${lang.charAt(0).toUpperCase() + lang.slice(1)} files`,
          filePatterns: [
            `**/*.${lang === "typescript" ? "ts" : lang === "javascript" ? "js" : lang}`,
          ],
          maxFiles: Math.ceil(metadata.fileList.length / languages.length),
          estimatedTokens: Math.floor(tokenThreshold * 0.8),
        }));

        return {
          batches: batches,
          totalBatches: batches.length,
          reasoning: "Auto-generated batches based on detected languages since LLM returned wrong format",
        };
      }

      return batchingResult as BatchingStrategy;
    }

    return null;
  }

  /**
   * Initialize batch summary file with header
   */
  private static async initializeBatchSummary(
    batchSummaryPath: string,
    repositoryPath: string,
    selectedCommit: any,
    estimatedTotalTokens: number,
    tokenThreshold: number,
    reasoning: string
  ): Promise<void> {
    const batchSummaryHeader = `Batch Summary Report
Generated: ${new Date().toISOString()}
Repository: ${repositoryPath}
Commit: ${selectedCommit.shortHash} - ${selectedCommit.message}
Total Estimated Tokens: ${estimatedTotalTokens}
Token Threshold (70%): ${tokenThreshold}
LLM Batching Strategy: ${reasoning || "Not provided"}

=== BATCH PROCESSING DETAILS ===

`;
    fs.writeFileSync(batchSummaryPath, batchSummaryHeader);
  }

  /**
   * Process a single batch
   */
  private static async processSingleBatch(
    batch: BatchInfo,
    batchIndex: number,
    metadata: any,
    tokenCounter: any,
    batchSummaryPath: string
  ): Promise<string | null> {
    // Create batch metadata using file patterns
    let batchFileList: any[] = [];

    if (batch.filePatterns && Array.isArray(batch.filePatterns)) {
      // Filter files based on patterns
      for (const pattern of batch.filePatterns) {
        const matchingFiles = metadata.fileList.filter((file: any) => {
          const relativePath = file.relativePath.toLowerCase();
          const patternLower = pattern.toLowerCase();

          // Handle specific file names
          if (!patternLower.includes("*") && !patternLower.includes("/")) {
            return (
              relativePath === patternLower ||
              relativePath.endsWith("/" + patternLower)
            );
          }

          // Handle directory patterns with /*
          if (patternLower.endsWith("/*")) {
            const dir = patternLower.slice(0, -2);
            return (
              relativePath.startsWith(dir + "/") &&
              !relativePath.substring(dir.length + 1).includes("/")
            );
          }

          // Handle recursive patterns with /**/*
          if (patternLower.includes("/**/*")) {
            const dir = patternLower.replace("/**/*", "");
            return relativePath.startsWith(dir + "/");
          }

          // Handle glob patterns with **
          if (patternLower.includes("**")) {
            const parts = patternLower.split("**");
            if (parts.length === 2) {
              const [prefix, suffix] = parts;
              return (
                relativePath.startsWith(prefix) &&
                relativePath.endsWith(suffix.replace("/", ""))
              );
            }
          }

          // Handle extension patterns
          if (patternLower.startsWith("*.")) {
            const ext = patternLower.substring(1);
            return relativePath.endsWith(ext);
          }

          // Handle directory patterns
          if (patternLower.endsWith("*")) {
            const prefix = patternLower.slice(0, -1);
            return relativePath.startsWith(prefix);
          }

          // Exact match or contains
          return (
            relativePath === patternLower ||
            relativePath.includes(patternLower) ||
            relativePath.startsWith(patternLower)
          );
        });

        console.log(
          `Pattern "${pattern}" matched ${matchingFiles.length} files:`,
          matchingFiles.map((f: any) => f.relativePath)
        );
        batchFileList.push(...matchingFiles);
      }

      // Remove duplicates and limit to maxFiles
      batchFileList = [
        ...new Map(batchFileList.map((file) => [file.relativePath, file])).values(),
      ].slice(0, batch.maxFiles || 50);
    } else {
      // Fallback: use simple chunking
      const startIndex = batchIndex * 50;
      batchFileList = metadata.fileList.slice(startIndex, startIndex + 50);
    }

    // If no files matched patterns, try fallback chunking
    if (batchFileList.length === 0 && metadata.fileList.length > 0) {
      console.log(
        `No files matched patterns for batch ${batchIndex + 1}, using fallback chunking`
      );
      const filesPerBatch = Math.ceil(metadata.fileList.length / batch.batchNumber);
      const startIndex = batchIndex * filesPerBatch;
      batchFileList = metadata.fileList.slice(startIndex, startIndex + filesPerBatch);
    }

    const batchMetadata = {
      ...metadata,
      fileList: batchFileList,
      totalFiles: batchFileList.length,
      worstCaseTokens: batchFileList.reduce(
        (sum: number, file: any) => sum + (file.estimatedTokens || 0),
        0
      ),
    };

    let batchResponse = null;

    if (batchFileList.length > 0) {
      const batchPrompt = PromptBuilder.buildPrompt(batchMetadata);
      batchResponse = await FileAnalyzer.analyzeFileUsingOpenAI(
        batchPrompt,
        await tokenCounter(batchPrompt)
      );
    } else {
      batchResponse = JSON.stringify({
        detectedLanguages: [],
        fileInclusion: {},
        fileIgnored: [],
        ignoringPattern: {},
        note: `No files matched the patterns for batch ${batchIndex + 1}`,
      });
    }

    // Append batch information to summary file
    const batchSummaryEntry = `
batch information
number ${batchIndex + 1}
description: ${batch.description}
file patterns: ${batch.filePatterns ? batch.filePatterns.join(", ") : "not specified"}
estimated tokens: ${batch.estimatedTokens || "not specified"}
actual files processed: ${batchFileList.length}
files involved:
${batchFileList.map((file: any) => `  ${file.relativePath}`).join("\n")}

batch summary
${batchResponse || "No response received"}
---------------------

`;
    fs.appendFileSync(batchSummaryPath, batchSummaryEntry);

    return batchResponse;
  }

  /**
   * Combine all batch responses into a single valid JSON structure
   */
  private static async combineBatchResponses(
    batchResponses: string[],
    batches: BatchInfo[]
  ): Promise<string> {
    const combinedAnalysis = {
      detectedLanguages: [] as string[],
      fileInclusion: {} as any,
      fileIgnored: [] as string[],
      ignoringPattern: {} as any,
      batchInfo: {
        totalBatches: batches.length,
        batchDetails: batchResponses.map((response, index) => ({
          batchNumber: index + 1,
          description: batches[index]?.description || `Batch ${index + 1}`,
          response: response,
        })),
      },
    };

    // Try to parse and merge each batch response
    for (let i = 0; i < batchResponses.length; i++) {
      try {
        const batchContent = batchResponses[i].replace(/^=== BATCH \d+:.*?===\n/, "");
        const batchData = JsonCleaner.clean(batchContent);

        if (batchData) {
          // Merge detected languages
          if (batchData.detectedLanguages) {
            combinedAnalysis.detectedLanguages.push(
              ...batchData.detectedLanguages.filter(
                (lang: string) => !combinedAnalysis.detectedLanguages.includes(lang)
              )
            );
          }

          // Merge file inclusion
          if (batchData.fileInclusion) {
            Object.keys(batchData.fileInclusion).forEach((lang) => {
              if (!combinedAnalysis.fileInclusion[lang]) {
                combinedAnalysis.fileInclusion[lang] = [];
              }
              combinedAnalysis.fileInclusion[lang].push(...batchData.fileInclusion[lang]);
            });
          }

          // Merge ignored files
          if (batchData.fileIgnored) {
            combinedAnalysis.fileIgnored.push(
              ...batchData.fileIgnored.filter(
                (file: string) => !combinedAnalysis.fileIgnored.includes(file)
              )
            );
          }

          // Merge ignoring patterns
          if (batchData.ignoringPattern) {
            Object.keys(batchData.ignoringPattern).forEach((lang) => {
              if (!combinedAnalysis.ignoringPattern[lang]) {
                combinedAnalysis.ignoringPattern[lang] = [];
              }
              combinedAnalysis.ignoringPattern[lang].push(...batchData.ignoringPattern[lang]);
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to parse batch ${i + 1} response:`, error);
      }
    }

    return JSON.stringify(combinedAnalysis, null, 2);
  }
}
