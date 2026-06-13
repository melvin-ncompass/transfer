import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';
import { formatChatHistory } from '../../core/chat-history.util';
import { RepoService } from '../../repo/repo.service';
import { REPO_PROMPT } from '../../prompts/repo.prompt';

@Injectable()
export class RepoAgent implements BaseAgent {
    name = 'REPO_AGENT';
    private readonly logger = new Logger(RepoAgent.name);

    private readonly repoSchema = z.object({
        response: z.string().describe('Your concise markdown response explaining the codebase or answering the technical question.'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider,
        private readonly repoService: RepoService
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-repo-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting Repo Agent via AIProvider...');

            const historySection = formatChatHistory(state.chatHistory, 'REPO_AGENT');
            const repoContext = state.computedContext?.repoCtx ?? this.repoService.getRepoContext();
            const chatHistory = state.chatHistory;
            
            let fileContext = '';
            if (state.targetFile) {
                const fileContent = this.repoService.getFile(state.targetFile);
                if (fileContent) {
                    fileContext = `\nFull Source for ${state.targetFile}:\n\`\`\`\n${fileContent}\n\`\`\`\n`;
                }
            }

            const hydratedPrompt = `
${REPO_PROMPT}

Repository Context (exports/imports index):
${repoContext}
${fileContext}
${historySection ? historySection + '\n' : ''}
Current User Query:
${state.query}
            `.trim();

            console.log(`[${this.name}] prompt chars: ${hydratedPrompt.length}, history turns: ${chatHistory?.length ?? 0}`);
            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.repoSchema,
                'repo_response',
                [reasoningLogger],
                0.3, // Lower temperature for factual analysis
                state.provider
            );

            const attemptTokens = reasoningLogger.getAllAttemptTokens();
            if (attemptTokens.length > 1) {
                console.log(`[${this.name}] LLM retried ${attemptTokens.length} times, tokens per attempt:`, attemptTokens);
            }

            return {
                agentName: this.name,
                reasoning: `Repository analysis generated.`,
                input: state.query,
                output: { text: response.response },
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Repo Agent Error: ${error.message}`);
            return {
                agentName: this.name,
                reasoning: 'Fallback invoked due to generic error',
                input: state.query,
                output: { text: "I'm sorry, I encountered an error while processing your repository request." },
                executionTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
