import * as vscode from "vscode";
import { telemetry, initializeTelemetry } from "./telemetry";
import { createSwark55Architecture } from "./commands/create-swark55-architecture";

export function activate(context: vscode.ExtensionContext): void {
    initializeTelemetry();
    registerCommand(context);
    telemetry.sendTelemetryEvent("extensionActivated");
}

function registerCommand(context: vscode.ExtensionContext): void {
    // Swark 6.0 - LLM-Powered Universal Architecture Analysis
    const swark60Disposable = vscode.commands.registerCommand("swark6.0.commitAwareAnalysis", async () => {
        await createSwark55Architecture();
    });

    context.subscriptions.push(swark60Disposable);
}

export async function deactivate(): Promise<void> {
    telemetry.sendTelemetryEvent("extensionDeactivated");
    await telemetry.dispose();
}
