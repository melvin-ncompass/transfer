import * as vscode from "vscode";
import { telemetry, initializeTelemetry } from "./telemetry";
import { Version2Orchestrator } from "./commands/version2-orchestrator";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Swark 6.0 extension is activating...");
  try {
    // Skip telemetry for now to avoid dependency issues
    // initializeTelemetry();
    registerCommand(context);
    // telemetry.sendTelemetryEvent("extensionActivated");
    console.log("Swark 6.0 extension activated successfully!");
  } catch (error) {
    console.error("Swark 6.0 activation failed:", error);
    vscode.window.showErrorMessage(`Swark 6.0 activation failed: ${error}`);
  }
}

function registerCommand(context: vscode.ExtensionContext): void {
  console.log("Registering commands...");
  
  // Create orchestrator instance
  const version2Orchestrator = new Version2Orchestrator();
  
  // Swark 6.0 - Original LLM-Powered Architecture Analysis (removed - file deleted)

  // Version2 - Complete codebase analysis with function extraction
  const version2AnalyzeDisposable = vscode.commands.registerCommand(
    "version2.analyzeCodebase",
    async () => {
      console.log("Version2 analysis command executed!");
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      try {
        await version2Orchestrator.analyzeCodebase(workspaceFolder.uri.fsPath);
      } catch (error) {
        console.error("Version2 analysis failed:", error);
        vscode.window.showErrorMessage(`Version2 analysis failed: ${error}`);
      }
    }
  );

  // Version2 - Stop WebUI server
  const version2StopDisposable = vscode.commands.registerCommand(
    "version2.stopWebUI",
    async () => {
      try {
        await version2Orchestrator.stopWebUI();
      } catch (error) {
        console.error("Failed to stop WebUI:", error);
        vscode.window.showErrorMessage(`Failed to stop WebUI: ${error}`);
      }
    }
  );

  // Version2 - Get status
  const version2StatusDisposable = vscode.commands.registerCommand(
    "version2.getStatus",
    async () => {
      try {
        const status = await version2Orchestrator.getStatus();
        vscode.window.showInformationMessage(status);
      } catch (error) {
        console.error("Failed to get status:", error);
        vscode.window.showErrorMessage(`Failed to get status: ${error}`);
      }
    }
  );

  // Version2 - Test and Demo commands (removed - files deleted)

  context.subscriptions.push(
    version2AnalyzeDisposable, 
    version2StopDisposable, 
    version2StatusDisposable
  );
  
  // Cleanup on deactivation
  context.subscriptions.push({
    dispose: () => version2Orchestrator.dispose()
  });
  
  console.log("Commands registered successfully!");
}

export async function deactivate(): Promise<void> {
  // telemetry.sendTelemetryEvent("extensionDeactivated");
  // await telemetry.dispose();
}
