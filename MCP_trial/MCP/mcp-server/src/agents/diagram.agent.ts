import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../interfaces/core.interface';
import { ReasoningLogger } from '../logging/reasoning.logger';
import type { AIProvider } from '../ai/ai.provider.interface';
import { formatChatHistory } from '../core/chat-history.util';
import { RepoService } from '../repo/repo.service';
import { SchemaService } from '../database/schema.service';
import { DIAGRAM_PROMPT } from '../prompts/diagram.prompt';

@Injectable()
export class DiagramAgent implements BaseAgent {
    name = 'DIAGRAM_AGENT';
    private readonly logger = new Logger(DiagramAgent.name);

    private readonly diagramSchema = z.object({
        mermaid: z.string().describe('The raw mermaid code block, e.g. ```mermaid\n...\n```'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider,
        private readonly repoService: RepoService,
        private readonly schemaService: SchemaService
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-diagram-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting Diagram Agent via AIProvider...');

            const historySection = formatChatHistory(state.chatHistory, 'DIAGRAM_AGENT');
            const repoContext = state.computedContext?.repoCtx ?? this.repoService.getRepoContext();
            const schemaContext = state.computedContext?.schemaCtx ?? this.schemaService.getSchema();
            const chatHistory = state.chatHistory;

            const hydratedPrompt = `
${DIAGRAM_PROMPT}

DATABASE SCHEMA CONTEXT:
${schemaContext}

REPOSITORY CONTEXT:
${repoContext}

${historySection ? historySection + '\n' : ''}
Current User Query:
${state.query}
            `.trim();

            console.log(`[${this.name}] prompt chars: ${hydratedPrompt.length}, history turns: ${chatHistory?.length ?? 0}`);
            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.diagramSchema,
                'diagram_response',
                [reasoningLogger],
                0.1, // Low temperature for code generation
                state.provider
            );

            const attemptTokens = reasoningLogger.getAllAttemptTokens();
            if (attemptTokens.length > 1) {
                console.log(`[${this.name}] LLM retried ${attemptTokens.length} times, tokens per attempt:`, attemptTokens);
            }

            return {
                agentName: this.name,
                reasoning: `Generated mermaid diagram based on query intent.`,
                input: state.query,
                output: { text: response.mermaid }, // Return raw mermaid block as text
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Diagram Agent Error: ${error.message}`);
            return {
                agentName: this.name,
                reasoning: 'Fallback invoked due to generic error',
                input: state.query,
                output: { text: "```mermaid\nflowchart TD\n  Err[Error generating diagram]\n```" },
                executionTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
