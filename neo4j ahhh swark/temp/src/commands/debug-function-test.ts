import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GraphGenerator } from "../io/graph-generator";
import { Neo4jService } from "../io/neo4j.service";

export async function testFunctionExtraction(): Promise<void> {

  try {
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("❌ No workspace folder found.");
      return;
    }
    
    const repositoryPath = workspaceFolders[0].uri.fsPath;
    const outputPath = path.join(repositoryPath, 'debug-output');

    await fs.promises.mkdir(outputPath, { recursive: true });

    const filteredSystemPath = path.join(outputPath, 'filtered-filesystem');
    await fs.promises.mkdir(filteredSystemPath, { recursive: true });

    const srcPath = path.join(repositoryPath, 'src');
    await copyDirectory(srcPath, path.join(filteredSystemPath, 'src'));

    const neo4jService = new Neo4jService();

    const graphGenerator = new GraphGenerator(neo4jService);

    const mockLLMResponse = {
      detectedLanguages: ['typescript'],
      fileInclusion: {
        typescript: [
          'src/io/graph-generator.ts',
          'src/io/neo4j.service.ts',
          'src/extension.ts'
        ]
      },
      ignoringPattern: {
        typescript: []
      }
    };

    const graphResult = await graphGenerator.generateGraph({
      filteredRepoPath: outputPath,
      extractedRepoPath: filteredSystemPath,
      llmResponse: mockLLMResponse,
      repo: 'debug-test',
      username: 'debug-user',
    });

    if (graphResult.neo4jGraph) {
      
    }

    await neo4jService.close();
    
    vscode.window.showInformationMessage(`✅ DEBUG: Found ${graphResult.functionsFound} functions! Check console for details.`);
    
  } catch (error) {

    vscode.window.showErrorMessage(`❌ DEBUG test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true });
  
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
        await copyDirectory(srcPath, destPath);
      }
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
