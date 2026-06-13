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

export async function createSwark55Architecture(): Promise<void> {
  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: "Swark 5.7: Intelligent Architecture Analysis",
    cancellable: true,
  };

  await vscode.window.withProgress(progressOptions, async (progress, token) => {
    try {
      const metadataPath = path.join(
        __dirname,
        "swark55-metadata.txt"
        
      );
      const metaPromptPath = path.join(
        __dirname,
        "swark55-metadataPrompt.txt"
      );
      const fileAnalyzerPath = path.join(
        __dirname,
        "swark55-fileanalyzer.txt"
      );
      
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
        title: "Select output folder for Swark 5.5 analysis",
      });

      if (!userSelectedFolder || userSelectedFolder.length === 0) {
        vscode.window.showErrorMessage(
          "❌ No output folder selected. Analysis cancelled."
        );
        return;
      }

      const outputPath = userSelectedFolder[0].fsPath;

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

      progress.report({ message: "Analyzing repository structure..." });
      const metadata = await Swark55MetadataExtractor.extractMetadata(
        repositoryPath,
        selectedCommit
      );

      fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}`);

      progress.report({ message: "Prompt building..." });
      
      const prompt = PromptBuilder.buildPrompt(metadata); 

      const model = await ModelInteractor.getModel();

      const tokenCounter = model.countTokens;

      const promptTokens = await tokenCounter(prompt);

      const MAX_MODEL_TOKENS = model.maxInputTokens;

      fs.writeFileSync(metaPromptPath, prompt);

      if (promptTokens > MAX_MODEL_TOKENS) {
        vscode.window.showErrorMessage(
          `❌ Prompt is too large for the selected model (${promptTokens} tokens, max is ${MAX_MODEL_TOKENS}). Please select a smaller commit or reduce repository size.`
        );
        return;
      }

      const responseFromModel = await FileAnalyzer.analyzeFileUsingOpenAI(
        prompt,
        promptTokens
      );

      if (!responseFromModel) {
        vscode.window.showErrorMessage(
          `❌ No response from model. Please try again.`
        );
        return;
      }
      fs.writeFileSync(fileAnalyzerPath, responseFromModel);

      const cleanedResponse = JsonCleaner.clean(responseFromModel);

      if (!cleanedResponse) {
        vscode.window.showErrorMessage(
          `❌ Failed to parse model response. Please try again.`
        );
        return;
      }

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

