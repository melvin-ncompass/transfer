import * as vscode from "vscode";
import { telemetry } from "../telemetry";

export async function showDiagram(uri: vscode.Uri): Promise<void> {
  try {
    // First, open the file in the editor
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

    // Then try to show the preview
    try {
      await vscode.commands.executeCommand("markdown.showPreviewToSide", uri);
    } catch (previewError) {
      console.log(
        "Preview to side failed, trying regular preview:",
        previewError
      );

      try {
        await vscode.commands.executeCommand("markdown.showPreview", uri);
      } catch (regularPreviewError) {
        console.log("Regular preview failed:", regularPreviewError);

        // Show notification about D2 extension
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

    // telemetry.sendTelemetryEvent("diagramShown");
  } catch (error) {
    console.error("Error showing diagram:", error);
    vscode.window.showErrorMessage(`Could not open diagram: ${error}`);
  }
}
