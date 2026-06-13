import * as fs from "fs";
import * as path from "path";
import { CleanedModelOutput } from "./json-cleaner";

export class TempDirectoryCreator {
  
  public static async copyFilesToTemp(
    modelOutput: CleanedModelOutput,
    sourcePath: string,
    outputPath: string
  ): Promise<boolean> {
    
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

  private static async copyFilesToTempWithBatches(
    modelOutput: CleanedModelOutput,
    sourcePath: string,
    outputPath: string
  ): Promise<boolean> {
    const tempOutputPath = path.join(outputPath, "temp");
    let allSuccess = true;

    try {
      
      await fs.promises.mkdir(tempOutputPath, { recursive: true });

      for (const batch of modelOutput.batches!) {
        const batchDir = path.join(tempOutputPath, `batch${batch.batchNumber}`);
        await fs.promises.mkdir(batchDir, { recursive: true });

        let allBatchFiles: string[] = [];

        if (batch.files && Array.isArray(batch.files)) {
          
          allBatchFiles = batch.files;
        } else if (batch.fileInclusion) {
          
          for (const lang in batch.fileInclusion) {
            allBatchFiles = allBatchFiles.concat(batch.fileInclusion[lang]);
          }
        }

        `
        );

        for (const filePath of allBatchFiles) {
          const srcFile = path.join(sourcePath, filePath);
          const destFile = path.join(batchDir, filePath);

          try {
            
            await fs.promises.mkdir(path.dirname(destFile), {
              recursive: true,
            });

            const content = await fs.promises.readFile(srcFile, "utf8");

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
            
          }
        }

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
      
      return false;
    }
  }

  private static async copyFilesToTempRegular(
    modelOutput: CleanedModelOutput,
    sourcePath: string,
    outputPath: string
  ): Promise<boolean> {
    const tempOutputPath = path.join(outputPath, "temp");
    let allSuccess = true;
    try {
      await fs.promises.mkdir(tempOutputPath, { recursive: true });

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

            const filteredContent = this.applyContentFiltering(
              content,
              language,
              patternsForLanguage
            );

            await fs.promises.writeFile(destFile, filteredContent, "utf8");
          } catch (err) {
            allSuccess = false;
            
          }
        }
      }

      return allSuccess;
    } catch (error) {
      
      return false;
    }
  }

  private static applyContentFiltering(
    content: string,
    language: string,
    patterns: string[]
  ): string {
    
    if (!patterns || patterns.length === 0) {
      return content;
    }

    let filteredContent = content;

    try {
      
      for (const pattern of patterns) {
        if (pattern && pattern.trim()) {
          const regex = new RegExp(pattern, "gm"); 
          filteredContent = filteredContent.replace(regex, "");
        }
      }

      filteredContent = filteredContent.replace(/\n\s*\n\s*\n/g, "\n\n");

      return filteredContent;
    } catch (error) {

      return content;
    }
  }

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

    if (detectedLang && detectedLanguages.includes(detectedLang)) {
      return detectedLang;
    }

    return detectedLanguages[0] || "unknown";
  }
}
