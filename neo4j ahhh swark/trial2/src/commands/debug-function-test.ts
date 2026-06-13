import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { GraphGenerator } from "../io/graph-generator";
import { Neo4jService } from "../io/neo4j.service";

/**
 * DEBUG VERSION: Test function extraction pipeline without user input
 */
export async function testFunctionExtraction(): Promise<void> {
  console.log('🧪 Starting DEBUG function extraction test...');
  
  try {
    // Use current workspace as both source and output
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("❌ No workspace folder found.");
      return;
    }
    
    const repositoryPath = workspaceFolders[0].uri.fsPath;
    const outputPath = path.join(repositoryPath, 'debug-output');
    
    console.log(`📁 Repository: ${repositoryPath}`);
    console.log(`📁 Output: ${outputPath}`);
    
    // Create output directory
    await fs.promises.mkdir(outputPath, { recursive: true });
    
    // Create a fake filtered-filesystem directory with our source files
    const filteredSystemPath = path.join(outputPath, 'filtered-filesystem');
    await fs.promises.mkdir(filteredSystemPath, { recursive: true });
    
    // Copy some source files to the filtered-filesystem directory for testing
    const srcPath = path.join(repositoryPath, 'src');
    await copyDirectory(srcPath, path.join(filteredSystemPath, 'src'));
    
    console.log(`📁 Created filtered filesystem at: ${filteredSystemPath}`);
    
    // Initialize Neo4j service
    console.log('🗄️ Initializing Neo4j service...');
    const neo4jService = new Neo4jService();
    
    // Initialize GraphGenerator
    const graphGenerator = new GraphGenerator(neo4jService);
    
    // Create a minimal mock LLM response
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
    
    console.log('🔍 Starting function analysis...');
    
    // Generate the function dependency graph
    const graphResult = await graphGenerator.generateGraph({
      filteredRepoPath: outputPath,
      extractedRepoPath: filteredSystemPath,
      llmResponse: mockLLMResponse,
      repo: 'debug-test',
      username: 'debug-user',
    });
    
    console.log("✅ Function graph generation complete!");
    console.log(`📊 Found ${graphResult.functionsFound} functions`);
    console.log(`📄 Created ${graphResult.jsonFilesCreated} JSON files`);
    
    if (graphResult.neo4jGraph) {
      console.log(`🗄️ Neo4j Graph: ${graphResult.neo4jGraph.nodesCreated} nodes, ${graphResult.neo4jGraph.relationshipsCreated} relationships`);
    }
    
    // Close Neo4j connection
    await neo4jService.close();
    
    vscode.window.showInformationMessage(`✅ DEBUG: Found ${graphResult.functionsFound} functions! Check console for details.`);
    
  } catch (error) {
    console.error("❌ DEBUG test error:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    vscode.window.showErrorMessage(`❌ DEBUG test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Helper function to copy directory recursively
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
