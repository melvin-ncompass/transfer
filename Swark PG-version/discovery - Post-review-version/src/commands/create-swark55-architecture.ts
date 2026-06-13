import * as vscode from "vscode";
import * as path from "path";
import { GitUtils, GitCommit } from "../io/git-utils";
import { Swark55MetadataExtractor } from "../io/swark55-metadata-extractor";
import * as fs from "fs";
import { PromptBuilder } from "../io/prompt-builder";
import { ModelInteractor } from "../llm/model-interactor";
import { FileAnalyzer } from "../io/file-analyuzer";
import { TempDirectoryCreator } from "../io/temp-directory-creator";
import { JsonCleaner } from "../io/json-cleaner";
import { FilteredFileSystemGenerator } from "../io/filtered-filesystem-generator";
import { BatchSummaryProcessor } from "../io/batch-summary-processor";
import { DiagramGenerator } from "../io/diagram-generator";

/**
 * Swark 5.7: Intelligent High-Level Architecture Analysis
 * 
 * PROCESS FLOW:
 * Step 0: Initialization (workspace setup, git validation, folder selection, commit selection)
 * Step 1: Extract Repository Metadata (traverse all files and folders, build JSON object)
 * Step 2: Build Prompt (create LLM prompt with system architect instructions)
 * Step 3: Identify Token Size (calculate prompt tokens vs model limits)
 * Step 4: Submit to LLM (validate tokens, get LLM analysis, create temp files) - 1 LLM call
 * Step 5: Generate Filtered File System (from temp files, without LLM, actual files and folders)
 * Step 6: Process Batches (build prompt for each batch, get HIGH-LEVEL business summaries for mindmap) - N LLM calls
 * Step 7: Build HIGH-LEVEL Diagrams (2 LLM calls: D2 & Eraser, create 4 files from responses) - 2 LLM calls
 */
export async function createSwark55Architecture(): Promise<void> {
  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: "Swark 5.7: Intelligent Architecture Analysis",
    cancellable: true,
  };

  await vscode.window.withProgress(progressOptions, async (progress, token) => {
    try {
      const sourceDir = path.join(__dirname, "..", "..", "src", "commands");
      const metadataPath = path.join(sourceDir, "swark55-metadata.txt");
      const metaPromptPath = path.join(sourceDir, "swark55-metadataPrompt.txt");
      const fileAnalyzerPath = path.join(sourceDir, "swark55-fileanalyzer.txt");

      // ===== STEP 0: INITIALIZATION =====
      // Step 0.1: Get repository path from workspace
      progress.report({ message: "Detecting repository..." });
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          "❌ No workspace folder found. Please open a repository."
        );
        return;
      }
      const repositoryPath = workspaceFolders[0].uri.fsPath;

      // Step 0.2: Check if it's a git repository
      progress.report({ message: "Verifying git repository..." });
      if (!(await GitUtils.isGitRepository(repositoryPath))) {
        vscode.window.showErrorMessage(
          "❌ Selected folder is not a git repository."
        );
        return;
      }

      // Step 0.3: Select output folder
      progress.report({ message: "Preparing output location..." });
      const userSelectedFolder = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select output folder for Swark 5.7 analysis",
      });

      if (!userSelectedFolder || userSelectedFolder.length === 0) {
        vscode.window.showErrorMessage(
          "❌ No output folder selected. Analysis cancelled."
        );
        return;
      }
      const outputPath = userSelectedFolder[0].fsPath;

      // Step 0.4: Get commit history and let user select
      progress.report({ message: "Loading commit history..." });
      const commits = await GitUtils.getRecentCommits(repositoryPath, 1000);
      if (commits.length === 0) {
        vscode.window.showErrorMessage("❌ No commits found in repository.");
        return;
      }

      const selectedCommit = await selectCommit(commits);
      if (!selectedCommit) {
        vscode.window.showInformationMessage(
          "❌ No commit selected. Analysis cancelled."
        );
        return;
      }

      // ===== STEP 1: EXTRACT REPOSITORY METADATA =====
      // Traverse all files and folders to build JSON object
      progress.report({ message: "Analyzing repository structure..." });
      const metadata = await Swark55MetadataExtractor.extractMetadata(
        repositoryPath,
        selectedCommit
      );
      console.log("Extracted metadata:", metadata);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // ===== STEP 2: BUILD PROMPT =====
      // Build prompt for LLM analysis with max token info
      progress.report({ message: "Building prompt for LLM analysis..." });
      const model = await ModelInteractor.getModel();
      const baseMaxTokens = model.maxInputTokens;
      const prompt = PromptBuilder.buildPrompt(metadata);
      const tokenCounter = model.countTokens;
      const promptTokens = await tokenCounter(prompt);
      fs.writeFileSync(metaPromptPath, prompt);

      // ===== STEP 3: IDENTIFY TOKEN SIZE =====
      // Calculate max tokens for model
      const MAX_MODEL_TOKENS = baseMaxTokens - promptTokens - 1000;
      console.log(`Prompt tokens: ${promptTokens}, Model max tokens: ${MAX_MODEL_TOKENS}`);

      // ===== STEP 4: TOKEN VALIDATION =====
      // Check if request is within token limits
      if (promptTokens > MAX_MODEL_TOKENS) {
        vscode.window.showErrorMessage(
          `❌ Prompt too large (${promptTokens} tokens, max is ${MAX_MODEL_TOKENS}).`
        );
        return;
      }

      // Submit to LLM and get response
      progress.report({ message: "Submitting to LLM for analysis..." });
      const responseFromModel = await FileAnalyzer.analyzeFileUsingOpenAI(prompt, promptTokens);
      if (!responseFromModel) {
        vscode.window.showErrorMessage("❌ No response from model. Please try again.");
        return;
      }
      fs.writeFileSync(fileAnalyzerPath, responseFromModel);
      console.log(`Response from model: length=${responseFromModel.length}`);

      // Clean and parse LLM response
      const cleanedResponse = JsonCleaner.clean(responseFromModel);
      if (!cleanedResponse) {
        console.error("❌ JsonCleaner.clean() returned null");
        console.log("Raw response for debugging:", responseFromModel.substring(0, 500));
        vscode.window.showErrorMessage("❌ Failed to parse model response.");
        return;
      }
      console.log("Cleaned model response:", cleanedResponse);

      // Create temp files immediately after LLM analysis
      progress.report({ message: "Creating temporary files based on LLM analysis..." });
      const tempCreated = await TempDirectoryCreator.copyFilesToTemp(
        cleanedResponse,
        repositoryPath,
        outputPath
      );
      if (!tempCreated) {
        vscode.window.showErrorMessage("Failed to create temp files after LLM analysis");
        return;
      }
      console.log("Temp files created at:", path.join(outputPath, "temp"));


      // ===== STEP 5: GENERATE FILTERED FILE SYSTEM =====
      // Generate new file system from temp files (without LLM)
      progress.report({ message: "Generating filtered file system from temp files..." });
      const tempPath = path.join(outputPath, "temp");
      const filteredSystemPath = await FilteredFileSystemGenerator.generateFromTemp(
        cleanedResponse,
        tempPath,
        outputPath,
        progress
      );
      if (!filteredSystemPath) {
        vscode.window.showErrorMessage("Failed to generate filtered file system from temp files");
        return;
      }
      console.log("Filtered file system generated at:", filteredSystemPath);

      // ===== STEP 6: PROCESS BATCHES FOR SUMMARIES =====
      // Build prompt for each batch and get LLM summaries for mindmap
      progress.report({ message: "Processing batches for architectural summaries..." });
      const summaryFilePath = path.join(outputPath, "batch-summaries.txt");
      await BatchSummaryProcessor.processBatches(cleanedResponse, filteredSystemPath, summaryFilePath, progress);
      console.log("Batch summaries generated:", summaryFilePath);

      // ===== STEP 7: BUILD DIAGRAMS =====
      // Generate D2 and Eraser diagrams from summary file
      progress.report({ message: "Generating architecture diagrams..." });
      await DiagramGenerator.generateFromSummary(summaryFilePath, outputPath, progress);
      console.log("Architecture diagrams generated successfully!");

      // ===== COMPLETION: SHOW RESULTS =====
      const message = `✅ Swark 5.7 Architecture Analysis Complete!

📊 Analysis Summary:
• Languages detected: ${cleanedResponse.detectedLanguages.join(', ')}
• Batches processed: ${cleanedResponse.batches?.length || 0}
• Files analyzed: ${Object.values(cleanedResponse.fileInclusion).flat().length}

� Process Flow Completed:
• Step 0: Initialization ✓
• Step 1: Repository metadata extraction ✓ 
• Step 2: Prompt building ✓
• Step 3: Token size validation ✓
• Step 4: LLM analysis ✓
• Step 5: Filtered file system generation ✓
• Step 6: Batch summaries ✓
• Step 7: Architecture diagrams ✓

📁 Generated Outputs:
• temp/ - Temporary files (Step 4 output)
• filtered-filesystem/ - Filtered repository structure (Step 5 output)
• batch-summaries.txt - Batch analysis summaries (Step 6 output)
• architecture-d2-diagram.md - D2 diagram with markdown (Step 7 output)
• architecture-eraser-diagram.md - Eraser diagram with markdown (Step 7 output)
• architecture.d2 - Standalone D2 diagram (Step 7 output)
• architecture.eraserdiagram - Standalone Eraser diagram (Step 7 output)

📂 Output location: ${path.basename(outputPath)}`;

      const action = await vscode.window.showInformationMessage(
        message,
        "Open Output Folder",
        "View Temp Files",
        "View Filtered File System",
        "View Batch Summaries",
        "Open D2 Diagram"
      );

      switch (action) {
        case "Open Output Folder":
          await vscode.commands.executeCommand(
            "revealFileInOS",
            vscode.Uri.file(outputPath)
          );
          break;
        case "View Temp Files":
          const tempPath = path.join(outputPath, "temp");
          if (fs.existsSync(tempPath)) {
            await vscode.commands.executeCommand(
              "revealFileInOS",
              vscode.Uri.file(tempPath)
            );
          }
          break;
        case "View Filtered File System":
          const filteredSystemPath = path.join(outputPath, "filtered-filesystem");
          if (fs.existsSync(filteredSystemPath)) {
            await vscode.commands.executeCommand(
              "revealFileInOS",
              vscode.Uri.file(filteredSystemPath)
            );
          }
          break;
        case "View Batch Summaries":
          const summaryPath = path.join(outputPath, "batch-summaries.txt");
          if (fs.existsSync(summaryPath)) {
            const doc = await vscode.workspace.openTextDocument(summaryPath);
            await vscode.window.showTextDocument(doc);
          }
          break;
        case "Open D2 Diagram":
          const d2Path = path.join(outputPath, "architecture.d2");
          if (fs.existsSync(d2Path)) {
            const d2Doc = await vscode.workspace.openTextDocument(d2Path);
            await vscode.window.showTextDocument(d2Doc);
          }
          break;
      }

      
    } catch (error) {
      console.error("Swark 5.7 analysis error:", error);
      vscode.window.showErrorMessage(
        `❌ Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });
}

async function selectCommit(
  commits: GitCommit[]
): Promise<GitCommit | undefined> {
  const commitItems = commits.map((commit) => ({
    label: `${commit.shortHash} - ${commit.message}`,
    description: `${commit.author} • ${commit.date}`,
    detail: commit.hash,
    commit,
  }));

  const selected = await vscode.window.showQuickPick(commitItems, {
    placeHolder: "Select a commit to analyze",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  return selected?.commit;
}



// async function showResults(
//   metadata: Swark55ProcessedMetadata,
//   outputPath: string
// ): Promise<void> {
//   const totalTokens = metadata.filteredFiles.reduce(
//     (sum, f) => sum + f.finalTokens,
//     0
//   );

//   const message = `✅ Swark 5.5 Analysis Complete!

// 📊 Analysis Summary:
// • Language: ${metadata.detectedLanguages[0] || "Unknown"}
// • Files processed: ${metadata.filteredFiles.length}
// • Total tokens: ${totalTokens.toLocaleString()}
// • Commit: ${metadata.selectedCommit.shortHash}

// 📁 Output: ${path.basename(outputPath)}
// 🎯 Generated: High-level, Semi-detailed, and Detailed D2 diagrams`;

//   const action = await vscode.window.showInformationMessage(
//     message,
//     "Open Output Folder",
//     "View Summary Report",
//     "Open High-Level Diagram"
//   );

//   // Create output paths
//   const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
//   const commitHash = metadata.selectedCommit.shortHash;
//   const baseDir = path.join(outputPath, `swark55-${commitHash}-${timestamp}`);

//   switch (action) {
//     case "Open Output Folder":
//       await vscode.commands.executeCommand(
//         "revealFileInOS",
//         vscode.Uri.file(baseDir)
//       );
//       break;
//     case "View Summary Report":
//       const summaryPath = path.join(baseDir, "swark55-analysis-summary.md");
//       const doc = await vscode.workspace.openTextDocument(summaryPath);
//       await vscode.window.showTextDocument(doc);
//       break;
//     case "Open High-Level Diagram":
//       const d2Path = path.join(baseDir, "high-level-architecture.d2");
//       const d2Doc = await vscode.workspace.openTextDocument(d2Path);
//       await vscode.window.showTextDocument(d2Doc);
//       break;
//   }
// }
