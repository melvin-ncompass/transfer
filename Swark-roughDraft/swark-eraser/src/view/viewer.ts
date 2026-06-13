import * as vscode from "vscode";
import { telemetry } from "../telemetry";

export async function showDiagram(uri: vscode.Uri): Promise<void> {
    try {
        // First, open the file in the editor
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        
        // Always show options for your Eraser workspace
        const action = await vscode.window.showInformationMessage(
            "Eraser diagram generated! Click to automatically create a new Cloud Architecture diagram in your workspace.",
            "Create New Diagram",
            "Open Workspace Only",
            "Dismiss"
        );
        
        if (action === "Create New Diagram") {
            // Get the document content to extract the Eraser code
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const eraserMatch = content.match(/```eraser\n([\s\S]*?)\n```/);
            const eraserCode = eraserMatch ? eraserMatch[1] : '';
            
            const newDiagramUrl = `https://app.eraser.io/workspace/qaNiop5qECxiRnMwgmYj/new?template=cloud-architecture&code=${encodeURIComponent(eraserCode)}`;
            await vscode.env.openExternal(vscode.Uri.parse(newDiagramUrl));
        } else if (action === "Open Workspace Only") {
            await vscode.env.openExternal(vscode.Uri.parse("https://app.eraser.io/workspace/qaNiop5qECxiRnMwgmYj"));
        }
        
        // Also try to show markdown preview
        try {
            await vscode.commands.executeCommand("markdown.showPreviewToSide", uri);
        } catch (previewError) {
            console.log("Markdown preview failed, trying regular preview:", previewError);
            try {
                await vscode.commands.executeCommand("markdown.showPreview", uri);
            } catch (regularPreviewError) {
                console.log("Regular preview failed:", regularPreviewError);
                // Show notification about Mermaid extension for better diagram rendering
                const mermaidAction = await vscode.window.showInformationMessage(
                    "For better diagram preview in VS Code, install the Mermaid Support extension.",
                    "Install Mermaid Extension",
                    "Skip"
                );
                
                if (mermaidAction === "Install Mermaid Extension") {
                    await vscode.commands.executeCommand("workbench.extensions.search", "@id:bierner.markdown-mermaid");
                }
            }
        }
        
        telemetry.sendTelemetryEvent("diagramShown");
    } catch (error) {
        console.error("Error showing diagram:", error);
        vscode.window.showErrorMessage(`Could not open diagram: ${error}`);
    }
}
