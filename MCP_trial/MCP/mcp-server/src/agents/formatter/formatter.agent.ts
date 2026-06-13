import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';
import { FORMATTER_PROMPT_V1 } from '../../prompts/formatter.prompt';

@Injectable()
export class FormatterAgent implements BaseAgent {
    name = 'FORMATTER_AGENT';
    private readonly logger = new Logger(FormatterAgent.name);

    private readonly formatSchema = z.object({
        summary: z.string().describe('A human-readable summary of the SQL results based on the original user query.'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        if (!state.dbResults || !Array.isArray(state.dbResults)) {
            return this.createErrorResponse('No SQL execution results available to format.', startTime);
        }

        try {
            this.logger.log('Starting Formatter Agent via AIProvider...');

            const safeResultsString = JSON.stringify(state.dbResults).substring(0, 15000); // Safety truncation

            const hydratedPrompt = FORMATTER_PROMPT_V1
                .replace('{{query}}', state.query)
                .replace('{{dbResults}}', safeResultsString);

            const chatHistory = state.chatHistory;
            console.log(`[${this.name}] prompt chars: ${hydratedPrompt.length}, history turns: ${chatHistory?.length ?? 0}`);
            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.formatSchema,
                'response_formatter',
                [reasoningLogger],
                0.1, // Slight creativity for summary
                state.provider
            );

            const attemptTokens = reasoningLogger.getAllAttemptTokens();
            if (attemptTokens.length > 1) {
                console.log(`[${this.name}] LLM retried ${attemptTokens.length} times, tokens per attempt:`, attemptTokens);
            }

            return {
                agentName: this.name,
                reasoning: `Synthesized ${state.dbResults.length} rows. Logs: ${reasoningLogger.getLogs().join(' | ')}`,
                input: state.dbResults,
                output: {
                    summary: response.summary,
                    tabularData: state.dbResults,
                    rawData: state.dbResults, // Pass through original
                },
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Formatter Agent Error: ${error.message}`);
            return this.createErrorResponse(error.message, startTime);
        }
    }

    private createErrorResponse(errMsg: string, startTime: number): AgentResponse {
        return {
            agentName: this.name,
            reasoning: 'Formatting halted.',
            input: null,
            output: null,
            error: errMsg,
            executionTime: Date.now() - startTime,
        };
    }
}
