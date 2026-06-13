import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../interfaces/core.interface';
import { ReasoningLogger } from '../logging/reasoning.logger';
import type { AIProvider } from '../ai/ai.provider.interface';
import { formatChatHistory } from '../core/chat-history.util';
import { RepoService } from '../repo/repo.service';
import { SchemaService } from '../database/schema.service';
import { CSV_PROMPT } from '../prompts/csv.prompt';

@Injectable()
export class CsvAgent implements BaseAgent {
    name = 'CSV_AGENT';
    private readonly logger = new Logger(CsvAgent.name);

    private readonly csvSchema = z.object({
        csvText: z.string().describe('The raw CSV string, unfenced, with the header row on line 1.'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider,
        private readonly repoService: RepoService,
        private readonly schemaService: SchemaService
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-csv-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting CSV Agent...');

            // If we already have DB results, format them directly to CSV
            if (state.dbResults && Array.isArray(state.dbResults) && state.dbResults.length > 0) {
                const headers = Object.keys(state.dbResults[0]);
                const csvRows = [headers.join(',')];

                for (const row of state.dbResults) {
                    const values = headers.map(header => {
                        let val = row[header];
                        if (val === null || val === undefined) val = '';
                        val = String(val);
                        // Quote if contains comma, quote, or newline
                        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                            val = `"${val.replace(/"/g, '""')}"`;
                        }
                        return val;
                    });
                    csvRows.push(values.join(','));
                }

                const rawCsv = csvRows.join('\n');
                return {
                    agentName: this.name,
                    reasoning: 'Formatted existing database results successfully into CSV.',
                    input: state.query,
                    output: rawCsv,
                    executionTime: Date.now() - startTime,
                };
            }

            // Otherwise, we use LLM to generate the CSV based on repo/schema context
            const historySection = formatChatHistory(state.chatHistory, 'CSV_AGENT');
            const repoContext = state.computedContext?.repoCtx ?? this.repoService.getRepoContext();
            const schemaContext = state.computedContext?.schemaCtx ?? this.schemaService.getSchema();
            const chatHistory = state.chatHistory;

            const hydratedPrompt = `
${CSV_PROMPT}

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
                this.csvSchema,
                'csv_response',
                [reasoningLogger],
                0.1, // Low temp for precise data formatting
                state.provider
            );

            const attemptTokens = reasoningLogger.getAllAttemptTokens();
            if (attemptTokens.length > 1) {
                console.log(`[${this.name}] LLM retried ${attemptTokens.length} times, tokens per attempt:`, attemptTokens);
            }

            let rawCsv = response.csvText.trim();
            // Sanitize markdown fences if the LLM hallucinates them
            if (rawCsv.startsWith('\`\`\`csv')) {
                rawCsv = rawCsv.replace(/^\`\`\`csv\n?/, '').replace(/\n?\`\`\`$/, '');
            } else if (rawCsv.startsWith('\`\`\`')) {
                rawCsv = rawCsv.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
            }

            return {
                agentName: this.name,
                reasoning: 'Generated raw CSV data context from local environment structure.',
                input: state.query,
                output: rawCsv.trim(),
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`CSV Agent Error: ${error.message}`);
            return {
                agentName: this.name,
                reasoning: 'Fallback invoked due to generic error',
                input: state.query,
                output: "error,message\n1,Failed to generate CSV data",
                executionTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
}
