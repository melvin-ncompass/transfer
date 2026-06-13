import * as vscode from "vscode";
import { telemetry, initializeTelemetry } from "./telemetry";
import { createSwark55Architecture } from "./commands/create-swark55-architecture";

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
  console.log("Registering Swark 6.0 command...");
  // Swark 6.0 - LLM-Powered Universal Architecture Analysis
  const swark60Disposable = vscode.commands.registerCommand(
    "swark6.0.commitAwareAnalysis",
    async () => {
      console.log("Swark 6.0 command executed!");
      try {
        await createSwark55Architecture();
      } catch (error) {
        console.error("Swark 6.0 command execution failed:", error);
        vscode.window.showErrorMessage(`Swark 6.0 failed: ${error}`);
      }
    }
  );

  context.subscriptions.push(swark60Disposable);
  console.log("Swark 6.0 command registered successfully!");
}

export async function deactivate(): Promise<void> {
  // telemetry.sendTelemetryEvent("extensionDeactivated");
  // await telemetry.dispose();
}
