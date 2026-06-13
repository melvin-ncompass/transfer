import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { SchemaService } from '../../database/schema.service';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';
import { SQL_GENERATION_PROMPT_V1 } from '../../prompts/sql.prompt';
import { formatChatHistory } from '../../core/chat-history.util';

@Injectable()
export class SqlAgent implements BaseAgent {
    name = 'SQL_AGENT';
    private readonly logger = new Logger(SqlAgent.name);

    // Define strict Zod schema for structured output
    private readonly sqlSchema = z.object({
        interpretation: z.string().describe('How you understand the user query in the context of the database.'),
        tables_used: z.array(z.string()).describe('The specific tables you have selected from the schema to fulfill the query.'),
        sql: z.string().describe('The generated PostgreSQL query. DO NOT include markdown formatting or backticks.'),
    });

    constructor(
        private readonly schemaService: SchemaService,
        @Inject('AIProvider') private readonly aiProvider: AIProvider
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting SQL Generation Agent via AIProvider...');
            const schemaCtx = state.computedContext?.schemaCtx ?? this.schemaService.getSchema();
            const chatHistoryStr = formatChatHistory(state.chatHistory, 'SQL_AGENT');
            const chatHistory = state.chatHistory;

            // Hydrate Prompt Template (including chat history for follow-up query awareness)
            let hydratedPrompt = SQL_GENERATION_PROMPT_V1
                .replace('{{schemaCtx}}', schemaCtx)
                .replace('{{chatHistory}}', chatHistoryStr)
                .replace('{{query}}', state.query);

            // Execute explicitly through the AI Provider abstraction
            console.log(`[${this.name}] prompt chars: ${hydratedPrompt.length}, history turns: ${chatHistory?.length ?? 0}`);
            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.sqlSchema,
                'sql_generation',
                [reasoningLogger],
                0, // Zero temperature for SQL determinism
                state.provider
            );

            const attemptTokens = reasoningLogger.getAllAttemptTokens();
            if (attemptTokens.length > 1) {
                console.log(`[${this.name}] LLM retried ${attemptTokens.length} times, tokens per attempt:`, attemptTokens);
            }

            return {
                agentName: this.name,
                reasoning: `Interpretation: ${response.interpretation}. Tables Selected: [${response.tables_used.join(', ')}].\nLogs: ${reasoningLogger.getLogs().join(' | ')}`,
                input: state.query,
                output: { sql: response.sql },
                tokensUsed: reasoningLogger.getTokenUsage(), // Now formally pulled from logger
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`SQL Agent Error: ${error.message}`);
            return {
                agentName: this.name,
                reasoning: 'Failed to generate SQL via AIProvider',
                input: state.query,
                output: null,
                error: error.message,
                executionTime: Date.now() - startTime,
            };
        }
    }
}
