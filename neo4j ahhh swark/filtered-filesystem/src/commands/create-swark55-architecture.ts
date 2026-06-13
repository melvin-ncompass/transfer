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
import { GraphGenerator } from "../io/graph-generator";
import { Neo4jService } from "../io/neo4j.service";

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

      progress.report({ message: "Detecting repository..." });
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          "❌ No workspace folder found. Please open a repository."
        );
        return;
      }
      const repositoryPath = workspaceFolders[0].uri.fsPath;

      progress.report({ message: "Verifying git repository..." });
      if (!(await GitUtils.isGitRepository(repositoryPath))) {
        vscode.window.showErrorMessage(
          "❌ Selected folder is not a git repository."
        );
        return;
      }

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

      progress.report({ message: "Analyzing repository structure..." });
      const metadata = await Swark55MetadataExtractor.extractMetadata(
        repositoryPath,
        selectedCommit
      );
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      progress.report({ message: "Building prompt for LLM analysis..." });
      const model = await ModelInteractor.getModel();
      const baseMaxTokens = model.maxInputTokens;
      const prompt = PromptBuilder.buildPrompt(metadata);
      const tokenCounter = model.countTokens;
      const promptTokens = await tokenCounter(prompt);
      fs.writeFileSync(metaPromptPath, prompt);

      const MAX_MODEL_TOKENS = baseMaxTokens - promptTokens - 1000;

      if (promptTokens > MAX_MODEL_TOKENS) {
        vscode.window.showErrorMessage(
          `❌ Prompt too large (${promptTokens} tokens, max is ${MAX_MODEL_TOKENS}).`
        );
        return;
      }

      progress.report({ message: "Submitting to LLM for analysis..." });
      const responseFromModel = await FileAnalyzer.analyzeFileUsingOpenAI(
        prompt,
        promptTokens
      );
      if (!responseFromModel) {
        vscode.window.showErrorMessage(
          "❌ No response from model. Please try again."
        );
        return;
      }
      fs.writeFileSync(fileAnalyzerPath, responseFromModel);

      const cleanedResponse = JsonCleaner.clean(responseFromModel);
      if (!cleanedResponse) {
         returned null");
        
        );
        vscode.window.showErrorMessage("❌ Failed to parse model response.");
        return;
      }

      progress.report({
        message: "Creating temporary files based on LLM analysis...",
      });
      const tempCreated = await TempDirectoryCreator.copyFilesToTemp(
        cleanedResponse,
        repositoryPath,
        outputPath
      );
      if (!tempCreated) {
        vscode.window.showErrorMessage(
          "Failed to create temp files after LLM analysis"
        );
        return;
      }
      );

      progress.report({
        message: "Generating filtered file system from temp files...",
      });
      const tempPath = path.join(outputPath, "temp");
      const filteredSystemPath =
        await FilteredFileSystemGenerator.generateFromTemp(
          cleanedResponse,
          tempPath,
          outputPath,
          progress
        );
      if (!filteredSystemPath) {
        vscode.window.showErrorMessage(
          "Failed to generate filtered file system from temp files"
        );
        return;
      }

      progress.report({
        message: "Extracting functions and building dependency graph...",
      });
      
      try {
        
        const neo4jService = new Neo4jService();

        const graphGenerator = new GraphGenerator(neo4jService);

        const repoName = path.basename(repositoryPath);
        const username = "user"; 

        const graphResult = await graphGenerator.generateGraph({
          filteredRepoPath: outputPath,
          extractedRepoPath: filteredSystemPath,
          llmResponse: cleanedResponse,
          repo: repoName,
          username: username,
        });

        if (graphResult.neo4jGraph) {
          
        }

        await neo4jService.close();
        
      } catch (error) {
        
        progress.report({
          message: "Graph generation failed!",
        });
      }

      const message = `✅ Swark 5.7 Architecture Analysis Complete!

📊 Analysis Summary:
• Languages detected: ${cleanedResponse.detectedLanguages.join(", ")}
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
• architecture-mermaid-diagram.md - Mermaid diagram with markdown (Step 7 output)
• architecture-eraser-diagram.md - Eraser diagram with markdown (Step 7 output)
• architecture.mmd - Standalone Mermaid diagram (Step 7 output)
• architecture.eraserdiagram - Standalone Eraser diagram (Step 7 output)

📂 Output location: ${path.basename(outputPath)}`;

      const action = await vscode.window.showInformationMessage(
        message,
        "Open Output Folder",
        "View Temp Files",
        "View Filtered File System",
        "View Batch Summaries",
        "Open Mermaid Diagram"
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
          const filteredSystemPath = path.join(
            outputPath,
            "filtered-filesystem"
          );
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
        case "Open Mermaid Diagram":
          const mermaidPath = path.join(outputPath, "architecture.mmd");
          if (fs.existsSync(mermaidPath)) {
            const mermaidDoc = await vscode.workspace.openTextDocument(
              mermaidPath
            );
            await vscode.window.showTextDocument(mermaidDoc);
          }
          break;
      }
    } catch (error) {

      vscode.window.showErrorMessage(
        `❌ Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
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

