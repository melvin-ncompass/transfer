import * as vscode from "vscode";
import * as path from "path";
import { GitUtils, GitCommit } from "../io/git-utils";
import { Swark55MetadataExtractor } from "../io/swark55-metadata-extractor";
import * as fs from "fs";
// import { Swark55RegexGenerator } from "../io/swark55-regex-generator";
// import {
//   Swark55ContentFilter,
//   Swark55ProcessedMetadata,
// } from "../io/swark55-content-filter";
// import { Swark55OutputGenerator } from "../io/swark55-output-generator";
import { PromptBuilder } from "../io/prompt-builder";
import { ModelInteractor } from "../llm/model-interactor";
import { FileAnalyzer } from "../io/file-analyuzer";
import { TempDirectoryCreator } from "../io/temp-directory-creator";
import { JsonCleaner } from "../io/json-cleaner";
import { BatchProcessor } from "../io/batch-processor";

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
      const batchSummaryPath = path.join(sourceDir, "batch-summary.txt");
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

      // Step 0.3: Select output folder FIRST
      progress.report({ message: "Preparing output location..." });
      const userSelectedFolder = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select output folder for Swark 5.5 analysis",
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
      const commits = await GitUtils.getRecentCommits(repositoryPath, 50);
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

      // Step 1: Extract repository metadata
      progress.report({ message: "Analyzing repository structure..." });
      const metadata = await Swark55MetadataExtractor.extractMetadata(
        repositoryPath,
        selectedCommit
      );
      console.log("Extracted metadata:", metadata);

      // Write metadata to text file for debugging in current directory only
      fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}`);

      progress.report({ message: "Prompt building..." });
      // Step 2: Build prompt for LLM
      const prompt = PromptBuilder.buildPrompt(metadata); // [DONE - Step 2 - [TODO] function and classes patterns]

      const model = await ModelInteractor.getModel();

      const tokenCounter = model.countTokens;

      const promptTokens = await tokenCounter(prompt);
      // Step 3. Identify token size of the prompt = Request

      const MAX_MODEL_TOKENS = 128000  - promptTokens- 1000;

      console.log(
        "Prompt tokens:",
        promptTokens,
        "\n",
        "Model max tokens:",
        MAX_MODEL_TOKENS
      );

      

      // Step 4.  Request < MAX_TOKEN_SIZE for the model ;
      if (promptTokens > MAX_MODEL_TOKENS) {
        vscode.window.showErrorMessage(
          `❌ Prompt is too large for the selected model (${promptTokens} tokens, max is ${MAX_MODEL_TOKENS}). Please select a smaller commit or reduce repository size.`
        );
        return;
      }

      if (!responseFromModel) {
        vscode.window.showErrorMessage(
          `❌ No response from model. Please try again.`
        );
        return;
      }
      fs.writeFileSync(fileAnalyzerPath, responseFromModel);

      console.log("Response from model:", responseFromModel);
      const cleanedResponse = JsonCleaner.clean(responseFromModel);

      if (!cleanedResponse) {
        vscode.window.showErrorMessage(
          `❌ Failed to parse model response. Please try again.`
        );
        return;
      }
      console.log("Cleaned model response:", cleanedResponse);

      // Step 5: Create temp directory with files matching model response
      progress.report({
        message: "Temporarily creating repository structure...",
      });
      const fileCreated = await TempDirectoryCreator.copyFilesToTemp(
        cleanedResponse,
        repositoryPath,
        outputPath
      );
      if (!fileCreated) {
        vscode.window.showErrorMessage("Failed to create temp directory");
        return;
      }

      
    } catch (error) {
      console.error("Swark 5.5 analysis error:", error);
      vscode.window.showErrorMessage(
        `❌ Analysis failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
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
