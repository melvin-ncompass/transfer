import * as vscode from "vscode";
import { TokenCounter } from "../types";
import { PromptBuilder } from "./prompt-builder";

export async function countTotalTokens(
    prompt: vscode.LanguageModelChatMessage[],
    tokenCounter: TokenCounter
): Promise<number> {
    const tokenCounts = await Promise.all(prompt.map(tokenCounter));
    return tokenCounts.reduce((total, count) => total + count, 0);
}

export async function getMaxTokensForFiles(modelMaxInputTokens: number, tokenCounter: TokenCounter): Promise<number> {
    
    const BUFFER = 1000;
    const numTokensInSystemPrompt = await tokenCounter(PromptBuilder.getSystemPrompt());
    return modelMaxInputTokens - numTokensInSystemPrompt - BUFFER;
}
