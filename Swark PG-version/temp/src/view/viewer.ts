import * as vscode from "vscode";
import { telemetry } from "../telemetry";

export async function showDiagram(uri: vscode.Uri): Promise<void> {
  try {
    
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

    try {
      await vscode.commands.executeCommand("markdown.showPreviewToSide", uri);
    } catch (previewError) {

      try {
        await vscode.commands.executeCommand("markdown.showPreview", uri);
      } catch (regularPreviewError) {

        const action = await vscode.window.showInformationMessage(
          "Diagram generated! For better D2 rendering, install 'D2' extension.",
          "Install Extension",
          "Dismiss"
        );

        if (action === "Install Extension") {
          await vscode.commands.executeCommand(
            "workbench.extensions.search",
            "@id:terrastruct.d2"
          );
        }
      }
    }

  } catch (error) {
    
    vscode.window.showErrorMessage(`Could not open diagram: ${error}`);
  }
}
