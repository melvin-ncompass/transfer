import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { FileAnalyzer } from "./file-analyuzer";

/**
 * BatchSummaryProcessor
 * Handles processing of batches through LLM to generate summaries
 */
export class BatchSummaryProcessor {
  /**
   * Step 6: Process each batch through LLM to generate summaries
   */
  static async processBatches(
    cleanedResponse: any,
    filteredSystemPath: string,
    summaryFilePath: string,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<void> {
    // Clear/create the summary file
    fs.writeFileSync(summaryFilePath, "# Batch Analysis Summary\n\n");

    if (!cleanedResponse.batchingRequired || !cleanedResponse.batches) {
      console.log("No batches to process for summaries");
      return;
    }

    for (const batch of cleanedResponse.batches) {
      progress.report({
        message: `Analyzing batch ${batch.batchNumber} from filtered file system...`,
      });

      try {
        // Build prompt for this batch using filtered file system
        const batchPrompt = this.buildBatchAnalysisPrompt(
          batch,
          filteredSystemPath
        );

        // Send to LLM for analysis
        const batchSummary = await FileAnalyzer.analyzeFileUsingOpenAI(
          batchPrompt,
          0 // We'll let the analyzer calculate tokens
        );

        if (batchSummary) {
          // Append to summary file in the requested format
          const estimatedTokens = batch.estimatedTokens || 0;
          const batchInfo = `Batch Information
Number: ${batch.batchNumber}
<<<<<<< HEAD
Description: ${batch.description || 'No description available'}
Estimated Tokens: ${estimatedTokens.toLocaleString()}
=======
Description: ${batch.description}
Estimated Tokens: ${batch.estimatedTokens?.toLocaleString()}
>>>>>>> 65f1baf400e172dbc8cd32c360c287dd9acb7d11

Files Involved:
${this.getBatchFilesList(batch)}

Batch Summary:
${batchSummary}

---------------------

`;

          fs.appendFileSync(summaryFilePath, batchInfo);
          console.log(
            `Batch ${batch.batchNumber} summary generated from filtered file system`
          );
        } else {
          console.warn(
            `Failed to generate summary for batch ${batch.batchNumber}`
          );
        }
      } catch (error) {
        console.error(`Error processing batch ${batch.batchNumber}:`, error);
      }
    }
  }

  /**
   * Build analysis prompt for a specific batch from filtered file system
   */
  private static buildBatchAnalysisPrompt(
    batch: any,
    filteredSystemPath: string
  ): string {
    const batchDir = path.join(filteredSystemPath, `batch${batch.batchNumber}`);

    return `You are a system architect analyzing a filtered codebase batch. I want you to study the provided FILTERED code files and generate a comprehensive summary.

BATCH CONTEXT:
- Batch Number: ${batch.batchNumber}
<<<<<<< HEAD
- Description: ${batch.description || 'No description available'}
- Estimated Tokens: ${(batch.estimatedTokens || 0).toLocaleString()}
=======
- Description: ${batch.description}
- Estimated Tokens: ${batch.estimatedTokens?.toLocaleString()}
>>>>>>> 65f1baf400e172dbc8cd32c360c287dd9acb7d11
- Files Count: ${this.getBatchFilesCount(batch)}
- Source: Filtered file system (content has been preprocessed and filtered)

ANALYSIS REQUIREMENTS:
1. Study the filtered code to understand the high-level business domains
2. Identify major system boundaries and service areas
3. Focus on business capabilities rather than technical implementation details
4. Note high-level architectural layers and their purposes
5. Provide insights for building a high-level mindmap focused on business architecture
6. Consider that this is filtered content - focus on the business and system-level architectural elements

EXPECTED OUTPUT FORMAT:
Please provide a high-level summary that includes:
- **Business Domain**: What business capability or domain this batch represents
- **Major Services**: High-level services and their business purposes (not technical classes)
- **System Boundaries**: Major system components and their business roles
- **Business Data Flow**: How business data and processes flow through major components
- **Integration Points**: How this business domain connects with other business areas
- **High-Level Architecture**: Business-focused architectural layers and responsibilities
- **Mindmap Insights**: Business-level points for creating a high-level architectural mindmap

Focus on business architecture and high-level system understanding. This summary will be used to construct high-level architecture diagrams that show business domains, major services, and system interactions rather than technical implementation details.

FILES TO ANALYZE:
The batch contains filtered files in the directory: ${batchDir}
${this.getBatchFilesList(batch)}

Please analyze these filtered files and provide the comprehensive architectural summary as requested.`;
  }

  /**
   * Get formatted list of files in a batch
   */
  private static getBatchFilesList(batch: any): string {
    const files: string[] = [];

    if (batch.files && Array.isArray(batch.files)) {
      // Legacy structure
      files.push(...batch.files);
    } else if (batch.fileInclusion) {
      // New structure - flatten all files from all languages
      for (const lang in batch.fileInclusion) {
        files.push(...batch.fileInclusion[lang]);
      }
    }

    return files.map((file) => `// ${file}`).join("\n");
  }

  /**
   * Get total count of files in a batch
   */
  private static getBatchFilesCount(batch: any): number {
    let count = 0;

    if (batch.files && Array.isArray(batch.files)) {
      count = batch.files.length;
    } else if (batch.fileInclusion) {
      for (const lang in batch.fileInclusion) {
        count += batch.fileInclusion[lang].length;
      }
    }

    return count;
  }
}
