import * as fs from "fs";
import * as path from "path";
import { CleanedModelOutput } from "./json-cleaner";
// import { CodeExtractor } from "./code-extractor"; // Disabled for now

export class TempDirectoryCreator {
  /**
   * Copies files from a source directory to a temp directory under the given output path, preserving folder structure.
   * Applies content filtering based on language-specific patterns from the model output.
   * Supports both regular copying and batch-based organization.
   * @param modelOutput CleanedModelOutput from JsonCleaner
   * @param sourcePath Source directory containing the files
   * @param outputPath Output directory (will append '/temp')
   * @returns Promise<boolean> true if all files copied successfully, false otherwise
   */
  public static async copyFilesToTemp(
    modelOutput: CleanedModelOutput,
    sourcePath: string,
    outputPath: string
  ): Promise<boolean> {
    // Check if batching is required
    if (modelOutput.batchingRequired && modelOutput.batches) {
      return await this.copyFilesToTempWithBatches(
        modelOutput,
        sourcePath,
        outputPath
      );
    } else {
      return await this.copyFilesToTempRegular(
        modelOutput,
        sourcePath,
        outputPath
      );
    }
  }

  /**
   * Creates batch-based temp directory structure
   * temp/
   *   batch1/
   *   batch2/
   *   etc.
   */
  private static async copyFilesToTempWithBatches(
    modelOutput: CleanedModelOutput,
    sourcePath: string,
    outputPath: string
  ): Promise<boolean> {
    const tempOutputPath = path.join(outputPath, "temp");
    let allSuccess = true;

    try {
      // Create main temp directory
      await fs.promises.mkdir(tempOutputPath, { recursive: true });

      // Process each batch
      for (let i = 0; i < modelOutput.batches!.length; i++) {
        const batch = modelOutput.batches![i];
        console.log(`Debug batch ${i}:`, typeof batch, batch);
        console.log(`Batch properties:`, Object.keys(batch));
        
        // Skip if batch is not a proper object (safety check)
        if (typeof batch !== 'object' || batch === null) {
          console.warn(`Skipping batch ${i}: not a valid object (type: ${typeof batch})`);
          continue;
        }
        
        if (typeof batch === 'object' && batch !== null) {
          console.log(`  batchNumber: ${batch.batchNumber}`);
          console.log(`  description: ${batch.description}`);
          console.log(`  estimatedTokens: ${batch.estimatedTokens}`);
        }
        
        // Use index if batchNumber is missing
        const batchNum = batch.batchNumber ?? (i + 1);
        const batchDir = path.join(tempOutputPath, `batch${batchNum}`);
        await fs.promises.mkdir(batchDir, { recursive: true });

        // Extract all files from the batch (handle both legacy files array and new fileInclusion structure)
        let allBatchFiles: string[] = [];

        if (batch.files && Array.isArray(batch.files)) {
          // Legacy structure
          allBatchFiles = batch.files;
        } else if (batch.fileInclusion) {
          // New structure - flatten all files from all languages
          for (const lang in batch.fileInclusion) {
            allBatchFiles = allBatchFiles.concat(batch.fileInclusion[lang]);
          }
        }

        console.log(
          `Processing ${batch.description || `batch ${batchNum}`} (${allBatchFiles.length} files)`
        );

        for (const filePath of allBatchFiles) {
          const srcFile = path.join(sourcePath, filePath);
          const destFile = path.join(batchDir, filePath);

          try {
            // Create directory structure for this file
            await fs.promises.mkdir(path.dirname(destFile), {
              recursive: true,
            });

            const content = await fs.promises.readFile(srcFile, "utf8");

            // Determine language for this file and apply filtering
            const language = this.detectFileLanguage(
              filePath,
              modelOutput.detectedLanguages
            );
            const patternsForLanguage =
              modelOutput.ignoringPattern[language] || [];

            const filteredContent = this.applyContentFiltering(
              content,
              language,
              patternsForLanguage
            );

            await fs.promises.writeFile(destFile, filteredContent, "utf8");
          } catch (err) {
            allSuccess = false;
            console.error(`Error copying file: ${srcFile} -> ${destFile}`, err);
          }
        }

        // Create batch info file
        const batchInfoPath = path.join(
          batchDir,
          `batch-${batch.batchNumber}-info.md`
        );
        const batchInfo = `# Batch ${batch.batchNumber}

## Description
${batch.description}

## Files (${allBatchFiles.length})
${allBatchFiles.map((f) => `- ${f}`).join("\n")}

## Estimated Tokens
${batch.estimatedTokens?.toLocaleString()}

## Generated on
${new Date().toISOString()}
`;
        await fs.promises.writeFile(batchInfoPath, batchInfo, "utf8");
      }

      return allSuccess;
    } catch (error) {
      console.error("Error preparing temp directory with batches:", error);
      return false;
    }
  }

  /**
   * Regular temp directory creation (no batches)
   */
  private static async copyFilesToTempRegular(
    modelOutput: CleanedModelOutput,
    sourcePath: string,
    outputPath: string
  ): Promise<boolean> {
    const tempOutputPath = path.join(outputPath, "temp");
    let allSuccess = true;
    try {
      await fs.promises.mkdir(tempOutputPath, { recursive: true });

      // Process files by language to apply appropriate filtering patterns
      for (const [language, files] of Object.entries(
        modelOutput.fileInclusion
      )) {
        if (!Array.isArray(files)) continue;

        const patternsForLanguage = modelOutput.ignoringPattern[language] || [];

        for (const filePath of files) {
          const srcFile = path.join(sourcePath, filePath);
          const destFile = path.join(tempOutputPath, filePath);

          try {
            await fs.promises.mkdir(path.dirname(destFile), {
              recursive: true,
            });
            const content = await fs.promises.readFile(srcFile, "utf8");

            // Apply language-specific content filtering
            const filteredContent = this.applyContentFiltering(
              content,
              language,
              patternsForLanguage
            );

            // const extractedContent = CodeExtractor.extractCodeStructures(
            //   content,
            //   filePath
            // );

            await fs.promises.writeFile(destFile, filteredContent, "utf8");
          } catch (err) {
            allSuccess = false;
            console.error(`Error copying file: ${srcFile} -> ${destFile}`, err);
          }
        }
      }

      return allSuccess;
    } catch (error) {
      console.error("Error preparing temp directory:", error);
      return false;
    }
  }

  /**
   * Applies content filtering to remove unwanted patterns based on language-specific rules
   * @param content The original file content
   * @param language The programming language for this file
   * @param patterns The regex patterns to filter out for this language
   * @returns Filtered content or original content if no patterns found
   */
  private static applyContentFiltering(
    content: string,
    language: string,
    patterns: string[]
  ): string {
    // If no patterns for this language, return original content
    if (!patterns || patterns.length === 0) {
      return content;
    }

    let filteredContent = content;

    try {
      // Apply each regex pattern to filter content
      for (const pattern of patterns) {
        if (pattern && pattern.trim()) {
          const regex = new RegExp(pattern, "gm"); // Global and multiline flags
          filteredContent = filteredContent.replace(regex, "");
        }
      }

      // Clean up multiple consecutive empty lines (optional)
      filteredContent = filteredContent.replace(/\n\s*\n\s*\n/g, "\n\n");

      return filteredContent;
    } catch (error) {
      console.warn(`Error applying content filtering for ${language}:`, error);
      // Return original content if filtering fails
      return content;
    }
  }

  /**
   * Detect the programming language of a file based on its extension
   * @param filePath The file path
   * @param detectedLanguages Available languages from model output
   * @returns The detected language or the first available language as fallback
   */
  private static detectFileLanguage(
    filePath: string,
    detectedLanguages: string[]
  ): string {
    const extension = path.extname(filePath).toLowerCase();

    const extensionMap: { [key: string]: string } = {
      ".js": "javascript",
      ".jsx": "javascript",
      ".ts": "typescript",
      ".tsx": "typescript",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".cs": "csharp",
      ".go": "go",
      ".rs": "rust",
      ".php": "php",
      ".rb": "ruby",
      ".vue": "vue",
    };

    const detectedLang = extensionMap[extension];

    // Return detected language if it's in the list, otherwise return first available
    if (detectedLang && detectedLanguages.includes(detectedLang)) {
      return detectedLang;
    }

    // Fallback to first detected language
    return detectedLanguages[0] || "unknown";
  }
}
