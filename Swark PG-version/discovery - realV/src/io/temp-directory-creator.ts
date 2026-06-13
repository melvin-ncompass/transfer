import * as fs from "fs";
import * as path from "path";
import { CleanedModelOutput } from "./json-cleaner";
// import { CodeExtractor } from "./code-extractor"; // Disabled for now

export class TempDirectoryCreator {
  /**
   * Copies files from a source directory to a temp directory under the given output path, preserving folder structure.
   * Applies content filtering based on language-specific patterns from the model output.
   * Accepts CleanedModelOutput from JsonCleaner.
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
}
