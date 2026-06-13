import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * FilteredFileSystemGenerator
 * Handles the generation of filtered file systems from temp files
 */
export class FilteredFileSystemGenerator {
  /**
   * Step 5B: Generate filtered file system FROM temp files
   * Creates the final filtered file system by processing temp files
   */
  static async generateFromTemp(
    cleanedResponse: any,
    tempPath: string,
    outputPath: string,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<string | null> {
    try {
      const filteredSystemPath = path.join(outputPath, "filtered-filesystem");
      
      // Create the main filtered directory
      await fs.promises.mkdir(filteredSystemPath, { recursive: true });
      
      if (cleanedResponse.batchingRequired && cleanedResponse.batches) {
        // Process batches
        progress.report({
          message: `Creating ${cleanedResponse.batches.length} batch directories with filtered content...`,
        });
        
        for (const batch of cleanedResponse.batches) {
          const batchDir = path.join(filteredSystemPath, `batch${batch.batchNumber}`);
          await fs.promises.mkdir(batchDir, { recursive: true });
          
          // Extract all files from the batch
          let allBatchFiles: string[] = [];
          
          if (batch.files && Array.isArray(batch.files)) {
            allBatchFiles = batch.files;
          } else if (batch.fileInclusion) {
            for (const lang in batch.fileInclusion) {
              allBatchFiles = allBatchFiles.concat(batch.fileInclusion[lang]);
            }
          }
          
          console.log(`Generating filtered files for ${batch.description} (${allBatchFiles.length} files)`);
          
          for (const filePath of allBatchFiles) {
            // Source from temp directory (already filtered)
            const srcFile = path.join(tempPath, `batch${batch.batchNumber}`, filePath);
            const destFile = path.join(batchDir, filePath);
            
            try {
              // Create directory structure
              await fs.promises.mkdir(path.dirname(destFile), { recursive: true });
              
              // Copy filtered content from temp to filtered-filesystem
              const filteredContent = await fs.promises.readFile(srcFile, "utf8");
              
              // Write to filtered file system (content is already filtered from temp)
              await fs.promises.writeFile(destFile, filteredContent, "utf8");
            } catch (err) {
              console.error(`Error copying from temp: ${srcFile} -> ${destFile}`, err);
            }
          }
          
          // Create batch manifest
          const manifestPath = path.join(batchDir, `batch-${batch.batchNumber}-manifest.md`);
          const manifest = `# Batch ${batch.batchNumber} - Filtered File System
          
## Description
${batch.description}

## Files Processed (${allBatchFiles.length})
${allBatchFiles.map(f => `- ${f}`).join('\n')}

## Estimated Tokens
${batch.estimatedTokens.toLocaleString()}

## Filtering Applied
- Language patterns applied for: ${cleanedResponse.detectedLanguages.join(', ')}
- Content filtered based on LLM recommendations

## Generated on
${new Date().toISOString()}
`;
          await fs.promises.writeFile(manifestPath, manifest, "utf8");
        }
      } else {
        // Process without batching
        progress.report({
          message: "Creating filtered file system without batching...",
        });
        
        for (const [language, files] of Object.entries(cleanedResponse.fileInclusion)) {
          if (!Array.isArray(files)) continue;
          
          const patternsForLanguage = cleanedResponse.ignoringPattern[language] || [];
          
          for (const filePath of files) {
            // Source from temp directory (already filtered)
            const srcFile = path.join(tempPath, filePath);
            const destFile = path.join(filteredSystemPath, filePath);
            
            try {
              await fs.promises.mkdir(path.dirname(destFile), { recursive: true });
              
              // Copy already filtered content from temp
              const filteredContent = await fs.promises.readFile(srcFile, "utf8");
              
              await fs.promises.writeFile(destFile, filteredContent, "utf8");
            } catch (err) {
              console.error(`Error copying from temp: ${srcFile} -> ${destFile}`, err);
            }
          }
        }
      }
      
      // Create main manifest for the filtered system
      await this.createMainManifest(filteredSystemPath, cleanedResponse, tempPath);
      
      console.log("Filtered file system generated successfully:", filteredSystemPath);
      return filteredSystemPath;
      
    } catch (error) {
      console.error("Error generating filtered file system:", error);
      return null;
    }
  }

  /**
   * Create the main manifest file for the filtered system
   */
  private static async createMainManifest(
    filteredSystemPath: string, 
    cleanedResponse: any, 
    tempPath: string
  ): Promise<void> {
    const mainManifestPath = path.join(filteredSystemPath, "filtered-system-manifest.md");
    const mainManifest = `# Filtered File System Manifest

## Overview
This directory contains a filtered file system generated from temp files based on LLM analysis and recommendations.

## Processing Flow
1. **Step 2**: Original repository analyzed by LLM → Temp files created with initial filtering
2. **Step 5**: Temp files processed → This filtered file system created
3. **Step 6**: This filtered file system used for batch analysis and mindmap generation

## Difference Between Temp Files vs Filtered File System

### Temp Files (../temp/)
- **Purpose**: Intermediate processing files created immediately after Step 2 LLM analysis
- **Content**: Raw files with basic LLM-recommended filtering applied
- **Structure**: Organized by batches as recommended by LLM
- **Usage**: For inspection and as source for filtered file system generation
- **Lifecycle**: Created in Step 2, used as input for Step 5

### Filtered File System (this directory)
- **Purpose**: Final curated file system optimized for architectural analysis
- **Content**: Refined and processed files derived from temp files
- **Structure**: Clean, organized structure ready for mindmap and diagram generation
- **Usage**: Primary source for Step 6 batch analysis and Step 7 diagram generation
- **Lifecycle**: Created in Step 5 from temp files, used for final analysis

## Key Differences
1. **Temp files** = Raw intermediate output from LLM filtering
2. **Filtered file system** = Refined, analysis-ready structure for mindmap generation
3. **Temp files** are for inspection and debugging
4. **Filtered file system** is the final processed output used for architectural analysis

## Processing Details
- Source: Temp files (${path.basename(tempPath)})
- Languages Detected: ${cleanedResponse.detectedLanguages.join(', ')}
- Batching Required: ${cleanedResponse.batchingRequired ? 'Yes' : 'No'}
- Total Batches: ${cleanedResponse.batches?.length || 0}

## File Inclusion Summary
${Object.entries(cleanedResponse.fileInclusion)
  .map(([lang, files]) => `- ${lang}: ${Array.isArray(files) ? files.length : 0} files`)
  .join('\n')}

## Content Filtering Applied
${Object.entries(cleanedResponse.ignoringPattern)
  .map(([lang, patterns]) => `- ${lang}: ${Array.isArray(patterns) ? patterns.length : 0} patterns`)
  .join('\n')}

## Generated on
${new Date().toISOString()}
`;
    await fs.promises.writeFile(mainManifestPath, mainManifest, "utf8");
  }

  /**
   * Detect file language based on extension and detected languages
   */
  static detectFileLanguage(filePath: string, detectedLanguages: string[]): string {
    const extension = path.extname(filePath).toLowerCase();
    
    const extensionMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.txt': 'text'
    };
    
    const mappedLanguage = extensionMap[extension];
    
    // Return the mapped language if it's in detected languages, otherwise return the first detected language
    if (mappedLanguage && detectedLanguages.includes(mappedLanguage)) {
      return mappedLanguage;
    }
    
    return detectedLanguages[0] || 'unknown';
  }

  /**
   * Apply content filtering based on language patterns
   */
  static applyContentFiltering(content: string, language: string, patterns: string[]): string {
    if (!patterns || patterns.length === 0) {
      return content;
    }
    
    let filteredContent = content;
    
    for (const pattern of patterns) {
      try {
        // Apply regex pattern to filter content
        const regex = new RegExp(pattern, 'gim');
        filteredContent = filteredContent.replace(regex, '');
      } catch (error) {
        console.warn(`Invalid regex pattern for ${language}: ${pattern}`, error);
      }
    }
    
    return filteredContent;
  }
}
