import * as fs from 'fs';
import * as path from 'path';
// import { CodeExtractor } from "./code-extractor"; // Disabled for now

export class FilterRepoService {
  async copyFilesToTempBatch(
    modelData: { fileIncluded: Record<string, string[]> },
    sourcePath: string,
    outputPath: string,
  ): Promise<boolean> {
    let allSuccess = true;

    const fileIncluded = modelData.fileIncluded ?? {};

    await fs.promises.mkdir(outputPath, { recursive: true });

    // Create a single batch directory since we're not using batching anymore
    const batchDir = path.join(outputPath, 'temp');
    await fs.promises.mkdir(batchDir, { recursive: true });

    // Process all files from fileIncluded
    for (const [, filePaths] of Object.entries(fileIncluded)) {
      if (!Array.isArray(filePaths)) continue;

      for (const filePath of filePaths) {
        const srcFile = path.join(sourcePath, filePath);
        const destFile = path.join(batchDir, filePath);

        try {
          await fs.promises.mkdir(path.dirname(destFile), { recursive: true });

          const content = await fs.promises.readFile(srcFile, 'utf8');
          // No content filtering since we removed ignoring patterns
          await fs.promises.writeFile(destFile, content, 'utf8');
        } catch (err) {
          allSuccess = false;
          console.error(`Error copying file: ${srcFile} -> ${destFile}`, err);
        }
      }
    }

    return allSuccess;
  }

  applyContentFiltering(content: string, language: string, patterns: string[]) {
    // If no patterns for this language, return original content
    if (!patterns || patterns.length === 0) {
      return content;
    }

    let filteredContent = content;

    try {
      // Apply each regex pattern to filter content
      for (const pattern of patterns) {
        if (pattern && pattern.trim()) {
          const regex = new RegExp(pattern, 'gm'); // Global and multiline flags
          filteredContent = filteredContent.replace(regex, '');
        }
      }

      // Clean up multiple consecutive empty lines (optional)
      filteredContent = filteredContent.replace(/\n\s*\n\s*\n/g, '\n\n');

      return filteredContent;
    } catch (error) {
      console.warn(`Error applying content filtering for ${language}:`, error);
      // Return original content if filtering fails
      return content;
    }
  }
}
