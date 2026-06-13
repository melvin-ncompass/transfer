import * as vscode from "vscode";
import { telemetry, initializeTelemetry } from "./telemetry";
import { CreateArchitectureCommand } from "./commands/create-architecture";
import { CreateChunkedArchitectureCommand } from "./commands/create-chunked-architecture";
import { createSwark3Architecture, analyzeSpecificCommit } from "./commands/create-swark3-architecture";
import { createSimpleSwark3Architecture } from "./commands/create-simple-swark3";
import { createSwark4Architecture } from "./commands/create-swark4-architecture";

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

    // Chunked architecture command
    const chunkedDisposable = vscode.commands.registerCommand("swark2.chunkedArchitecture", async () => {
        await CreateChunkedArchitectureCommand.run();
    });

    // Swark 3.0 Enhanced Analysis (Demo Version)
    const swark3DemoDisposable = vscode.commands.registerCommand("swark3.demo", async () => {
        await createSimpleSwark3Architecture();
    });

    // Swark 3.0 Enhanced Analysis (Full Version)
    const swark3Disposable = vscode.commands.registerCommand("swark3.analyzeRepository", async () => {
        await createSwark3Architecture();
    });

    // Swark 3.0 Commit-Specific Analysis
    const commitDisposable = vscode.commands.registerCommand("swark3.analyzeCommit", async () => {
        await analyzeSpecificCommit();
    });

    // Swark 4.0 - Next Generation Intelligent Analysis
    const swark4Disposable = vscode.commands.registerCommand("swark4.intelligentAnalysis", async () => {
        await createSwark4Architecture();
    });

    context.subscriptions.push(disposable, chunkedDisposable, swark3DemoDisposable, swark3Disposable, commitDisposable, swark4Disposable);
}

export async function deactivate(): Promise<void> {
    telemetry.sendTelemetryEvent("extensionDeactivated");
    await telemetry.dispose();
}
