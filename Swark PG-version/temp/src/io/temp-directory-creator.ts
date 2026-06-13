import * as fs from "fs";
import * as path from "path";
import { CleanedModelOutput } from "./json-cleaner";

export class TempDirectoryCreator {
  
  public static async copyFilesToTemp(
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
}
