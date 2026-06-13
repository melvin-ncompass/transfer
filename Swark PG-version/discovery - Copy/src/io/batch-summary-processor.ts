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
        const batchPrompt = this.buildBatchAnalysisPrompt(batch, filteredSystemPath);
        
        // Send to LLM for analysis
        const batchSummary = await FileAnalyzer.analyzeFileUsingOpenAI(
          batchPrompt,
          0 // We'll let the analyzer calculate tokens
        );

        if (batchSummary) {
          // Append to summary file in the requested format
          const batchInfo = `Batch Information
Number: ${batch.batchNumber}
Description: ${batch.description}
Estimated Tokens: ${batch.estimatedTokens.toLocaleString()}

Files Involved:
${this.getBatchFilesList(batch)}

Batch Summary:
${batchSummary}

---------------------

`;
          
          fs.appendFileSync(summaryFilePath, batchInfo);
          console.log(`Batch ${batch.batchNumber} summary generated from filtered file system`);
        } else {
          console.warn(`Failed to generate summary for batch ${batch.batchNumber}`);
        }
      } catch (error) {
        console.error(`Error processing batch ${batch.batchNumber}:`, error);
      }
    }
  }

  /**
   * Build analysis prompt for a specific batch from filtered file system
   */
  private static buildBatchAnalysisPrompt(batch: any, filteredSystemPath: string): string {
    const batchDir = path.join(filteredSystemPath, `batch${batch.batchNumber}`);
    
    return `You are a system architect analyzing a filtered codebase batch. I want you to study the provided FILTERED code files and generate a comprehensive summary.

BATCH CONTEXT:
- Batch Number: ${batch.batchNumber}
- Description: ${batch.description}
- Estimated Tokens: ${batch.estimatedTokens.toLocaleString()}
- Files Count: ${this.getBatchFilesCount(batch)}
- Source: Filtered file system (content has been preprocessed and filtered)

ANALYSIS REQUIREMENTS:
1. Study the filtered code architecture and patterns in this batch
2. Identify key components, modules, and their relationships
3. Analyze the technical stack and frameworks used
4. Note important design patterns and architectural decisions
5. Provide insights for building a low-level mindmap
6. Consider that this is filtered content - focus on the essential architectural elements

EXPECTED OUTPUT FORMAT:
Please provide a detailed summary that includes:
- **Architecture Overview**: High-level description of this batch's role in the system
- **Key Components**: Main classes, functions, modules identified from filtered content
- **Technical Stack**: Technologies, frameworks, libraries used
- **Design Patterns**: Architectural patterns observed in the filtered code
- **Dependencies**: Internal and external dependencies visible in filtered content
- **Data Flow**: How data moves through this batch's components
- **Integration Points**: How this batch connects with other parts of the system
- **Mindmap Insights**: Specific technical points for creating a detailed architectural mindmap

Focus on technical depth and architectural understanding. This summary will be used to construct detailed architecture diagrams including D2 and Eraser diagrams.

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
    
    return files.map(file => `// ${file}`).join('\n');
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
