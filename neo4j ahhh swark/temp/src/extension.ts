import * as vscode from "vscode";
import { telemetry, initializeTelemetry } from "./telemetry";
import { createSwark55Architecture } from "./commands/create-swark55-architecture";

export function activate(context: vscode.ExtensionContext): void {
  
  try {

    registerCommand(context);

  } catch (error) {
    
    vscode.window.showErrorMessage(`Swark 6.0 activation failed: ${error}`);
  }
}

function registerCommand(context: vscode.ExtensionContext): void {

  const swark60Disposable = vscode.commands.registerCommand(
    "swark6.0.commitAwareAnalysis",
    async () => {
      
      try {
        await createSwark55Architecture();
      } catch (error) {
        
        vscode.window.showErrorMessage(`Swark 6.0 failed: ${error}`);
      }
    }
  );

  const debugDisposable = vscode.commands.registerCommand(
    "swark6.0.debugFunctionTest",
    async () => {
      
      try {
        await testFunctionExtraction();
      } catch (error) {
        
        vscode.window.showErrorMessage(`Swark 6.0 DEBUG failed: ${error}`);
      }
    }
  );

  context.subscriptions.push(swark60Disposable);
  context.subscriptions.push(debugDisposable);
  
}

export async function deactivate(): Promise<void> {

}
