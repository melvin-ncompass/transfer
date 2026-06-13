import * as vscode from "vscode";
import { telemetry, initializeTelemetry } from "./telemetry";
import { CreateArchitectureCommand } from "./commands/create-architecture";
import { CreateChunkedArchitectureCommand } from "./commands/create-chunked-architecture";

export function activate(context: vscode.ExtensionContext): void {
    initializeTelemetry();
    registerCommand(context);
    telemetry.sendTelemetryEvent("extensionActivated");
}

function registerCommand(context: vscode.ExtensionContext): void {
    // Original architecture command
    const disposable = vscode.commands.registerCommand("swark2.architecture", async () => {
        await CreateArchitectureCommand.run();
    });

    // New chunked architecture command
    const chunkedDisposable = vscode.commands.registerCommand("swark2.chunkedArchitecture", async () => {
        await CreateChunkedArchitectureCommand.run();
    });

    context.subscriptions.push(disposable, chunkedDisposable);
}

export async function deactivate(): Promise<void> {
    telemetry.sendTelemetryEvent("extensionDeactivated");
    await telemetry.dispose();
}
