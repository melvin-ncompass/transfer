import { Injectable, Logger, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent, State, AgentResponse } from '../../interfaces/core.interface';
import { ReasoningLogger } from '../../logging/reasoning.logger';
import type { AIProvider } from '../../ai/ai.provider.interface';
import { SUPERVISOR_DECOMPOSITION_PROMPT_V1 } from '../../prompts/supervisor.prompt';
import { formatChatHistory } from '../../core/chat-history.util';

@Injectable()
export class SupervisorAgent implements BaseAgent {
    name = 'SUPERVISOR_AGENT';
    private readonly logger = new Logger(SupervisorAgent.name);

    private readonly routeSchema = z.object({
        reasoning: z.string().describe('Explain why this particular route structure was chosen.'),
        mode: z.enum(['SEQUENTIAL', 'PARALLEL']).describe('How to execute the downstream agents.'),
        nextAgents: z.array(z.string()).describe('The exact string names of the agents to invoke, e.g. SQL_AGENT or TASK_AGENT.'),
        confidenceScore: z.number().min(0).max(1).describe('Confidence in the ability of selected agents to fulfill the query (0 to 1).'),
        queryComplexity: z.enum(['overview', 'module', 'specific']).describe('Whether the query is broad overview, module-focused, or specific.'),
        targetModule: z.string().optional().describe('Module/subsystem name when queryComplexity is module.'),
    });

    constructor(
        @Inject('AIProvider') private readonly aiProvider: AIProvider
    ) { }

    async execute(state: State): Promise<AgentResponse> {
        const startTime = Date.now();
        const traceId = `trace-supervisor-${Date.now()}`;
        const reasoningLogger = new ReasoningLogger(traceId);

        try {
            this.logger.log('Starting Supervisor Agent via AIProvider...');

            const hydratedPrompt = SUPERVISOR_DECOMPOSITION_PROMPT_V1
                .replace('{{chatHistory}}', formatChatHistory(state.chatHistory, 'SUPERVISOR_AGENT'))
                .replace('{{query}}', state.query);

            const chatHistory = state.chatHistory;
            console.log(`[${this.name}] prompt chars: ${hydratedPrompt.length}, history turns: ${chatHistory?.length ?? 0}`);
            const response = await this.aiProvider.generateStructured(
                hydratedPrompt,
                this.routeSchema,
                'supervisor_routing',
                [reasoningLogger],
                0, // Deterministic logic routing
                state.provider
            );

            const attemptTokens = reasoningLogger.getAllAttemptTokens();
            if (attemptTokens.length > 1) {
                console.log(`[${this.name}] LLM retried ${attemptTokens.length} times, tokens per attempt:`, attemptTokens);
            }

            // Persist routing metadata into shared state for downstream context sizing.
            state.queryComplexity = response.queryComplexity ?? 'specific';
            state.targetModule = this.normalizeTargetModule(response.targetModule);
            state.nextAgents = response.nextAgents;

            return {
                agentName: this.name,
                reasoning: `Confidence [${response.confidenceScore}]: ${response.reasoning}`,
                input: state.query,
                output: response,
                tokensUsed: reasoningLogger.getTokenUsage(),
                executionTime: Date.now() - startTime,
            };

        } catch (error: any) {
            this.logger.error(`Supervisor Routing Error: ${error.message}`);
            // Fallback routing if LLM fails
            state.queryComplexity = 'specific';
            state.targetModule = undefined;
            state.nextAgents = ['TASK_AGENT'];
            return {
                agentName: this.name,
                reasoning: 'Fallback invoked due to generic error',
                input: state.query,
                output: {
                    nextAgents: ['TASK_AGENT'],
                    mode: 'SEQUENTIAL',
                    confidenceScore: 0.1,
                    queryComplexity: 'specific',
                },
                executionTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    private normalizeTargetModule(raw?: string): string | undefined {
        if (!raw) return undefined;
        const normalized = raw.toLowerCase().trim().replace(/[^a-z0-9\s_-]/g, '');
        if (!normalized) return undefined;

        const aliasMap: Record<string, string> = {
            'session management': 'sessions',
            'session': 'sessions',
            'sessions': 'sessions',
            'auth': 'auth',
            'authentication': 'auth',
            'database': 'database',
            'db': 'database',
            'orchestrator': 'orchestrator',
            'agents': 'agents',
            'repo': 'repo',
        };
        if (aliasMap[normalized]) {
            return aliasMap[normalized];
        }

        const words = normalized.split(/\s+/).filter(Boolean);
        for (const word of words) {
            if (aliasMap[word]) {
                return aliasMap[word];
            }
        }
        return words[0];
    }
}
