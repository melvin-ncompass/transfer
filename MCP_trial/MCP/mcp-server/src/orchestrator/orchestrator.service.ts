import { Injectable, Logger } from '@nestjs/common';
import { AgentRegistry } from './agent.registry';
import { State, AgentResponse } from '../interfaces/core.interface';
import { MemoryService } from '../memory/memory.service';
import { MetricsService } from '../observability/metrics.service';
import { SessionsService } from '../sessions/sessions.service';
import { SchemaService } from '../database/schema.service';
import { RepoService } from '../repo/repo.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrchestratorService {
    private readonly logger = new Logger(OrchestratorService.name);

    constructor(
        private readonly agentRegistry: AgentRegistry,
        private readonly memoryService: MemoryService,
        private readonly metricsService: MetricsService,
        private readonly sessionsService: SessionsService,
        private readonly schemaService: SchemaService,
        private readonly repoService: RepoService,
    ) { }

    /**
     * Main entrypoint for processing a query.
     */
    async execute(initialQuery: string, sessionId?: string, userRole?: string, userId?: string, provider?: 'gemini' | 'groq'): Promise<State> {
        this.logger.log(`Starting orchestration for query: "${initialQuery}"`);
        const traceId = uuidv4();
        const startTime = Date.now();

        // Initialize State Graph payload, optionally hydrating from Memory
        let state: State = {
            query: initialQuery,
            userRole,
            chatHistory: [],
            agentResponses: [],
            errors: [],
            provider,
        };

        if (sessionId) {
            const previousState = await this.memoryService.loadSessionState(sessionId);
            if (previousState) {
                // Keep the new query but preserve chat history trajectory
                state.chatHistory = previousState.chatHistory || [];
                state.chatHistory.push({ role: 'user', content: initialQuery });
                // We do NOT overwrite the current agentResponses/errors to ensure a fresh run tracking
            } else {
                state.chatHistory.push({ role: 'user', content: initialQuery });
            }
        }

        try {
            // Step 1: Supervisor Agent Routing
            const supervisor = this.agentRegistry.getAgent('SUPERVISOR_AGENT');
            if (!supervisor) {
                throw new Error('SUPERVISOR_AGENT is not registered.');
            }

            this.logger.log('Invoking Supervisor Agent...');
            const supervisorResponse = await supervisor.execute(state);
            this.mergeResponseIntoState(state, supervisorResponse);

            // Extract the plan from Supervisor Output
            const plan = supervisorResponse.output;

            if (!plan || !plan.nextAgents || plan.nextAgents.length === 0) {
                this.logger.warn('Supervisor did not return any next agents. Ending orchestration.');
                return state;
            }
            state.nextAgents = plan.nextAgents;

            // Optional Confidence Escalation Logic
            const confidenceThreshold = 0.5; // Configurable threshold
            if (plan.confidenceScore !== undefined && plan.confidenceScore < confidenceThreshold) {
                this.logger.warn(`Confidence too low (${plan.confidenceScore}). Halting for user clarification.`);
                state.finalResponse = {
                    escalationNeeded: true,
                    message: "I'm not completely sure how to answer this. Could you clarify your request?",
                    partialReasoning: supervisorResponse.reasoning
                };
                return state;
            }

            await this.selectContext(state);

            // Step 2: Dynamic Execution (Parallel vs Sequential)
            this.logger.log(`Executing Plan: Mode=${plan.mode}, Agents=[${plan.nextAgents.join(', ')}]`);

            if (plan.mode === 'PARALLEL') {
                await this.executeParallel(state, plan.nextAgents);
            } else {
                await this.executeSequential(state, plan.nextAgents);
            }

            // Step 3: Format the Output
            const formatter = this.agentRegistry.getAgent('FORMATTER_AGENT');
            const hasCsvAgent = plan.nextAgents.includes('CSV_AGENT');
            
            // Only format if we have db results AND we aren't explicitly outputting a raw CSV buffer
            if (formatter && state.dbResults && !hasCsvAgent) {
                this.logger.log('Invoking Formatter Agent...');
                const formatterResponse = await formatter.execute(state);
                this.mergeResponseIntoState(state, formatterResponse);
                state.finalResponse = formatterResponse.output;
            }

            // Step 4: Fallback - Ensure finalResponse is always populated
            if (!state.finalResponse) {
                if (state.sqlQuery && state.dbResults) {
                    // We have raw DB data but no formatter ran
                    state.finalResponse = {
                        summary: `Query executed successfully. Returned ${Array.isArray(state.dbResults) ? state.dbResults.length : 0} records.`,
                        tabularData: state.dbResults,
                        rawData: state.dbResults,
                    };
                } else if (state.sqlQuery) {
                    // We have SQL but it wasn't executed (EXECUTION_AGENT not called)
                    state.finalResponse = {
                        summary: `Generated SQL query: ${state.sqlQuery}. The query was not yet executed against the database.`,
                        generatedSql: state.sqlQuery,
                    };
                } else if (state.errors.length > 0) {
                    state.finalResponse = {
                        summary: `Execution failed. Reason: ${state.errors.join('; ')}`,
                        errors: state.errors,
                    };
                } else {
                    // Generic catch-all: surface the last agent's plain output
                    const lastAgent = state.agentResponses[state.agentResponses.length - 1];
                    state.finalResponse = {
                        summary: lastAgent?.reasoning || 'The agents completed but produced no structured output.',
                    };
                }
            }

            return state;

        } catch (error: any) {
            this.logger.error(`Orchestration failed: ${error.message}`, error.stack);
            state.errors.push(error.message);
            return state;
        } finally {
            // Persist the long-term session memory for Contextual awareness next run
            if (sessionId) {
                // Save the final generated assistant output back to the chat history tail
                state.chatHistory.push({ role: 'assistant', content: JSON.stringify(state.finalResponse || state.errors) });
                await this.memoryService.saveSessionState(sessionId, state);
                // Bump updatedAt so sessions list stays ordered by most-recent activity
                await this.sessionsService.touchSession(sessionId);
            }

            // Persist the compliance trace with all LLM reasoning tokens and generated SQL
            const executionTimeMs = Date.now() - startTime;
            await this.memoryService.logAuditTrace(traceId, state, executionTimeMs, userId);
        }
    }

    private async executeParallel(state: State, agentNames: string[]): Promise<void> {
        // We map each string to the actual instance from the registry.
        // E.g., ['SQL_AGENT', 'SQL_AGENT'] spins up two independent execution promises of the same class.
        const promises = agentNames.map(async (name, index) => {
            const agent = this.agentRegistry.getAgent(name);
            if (!agent) {
                state.errors.push(`Agent ${name} not found for parallel execution at index ${index}.`);
                return null;
            }
            try {
                // In a truly deep decomposed graph, we'd pass an isolated SubState to prevent race conditions.
                // For MVP, we pass a shallow clone of the query text so they can operate neutrally.
                const clonedState = { ...state };
                return await agent.execute(clonedState);
            } catch (e: any) {
                return {
                    agentName: name,
                    reasoning: 'Failed during execution',
                    input: state.query,
                    output: null,
                    executionTime: 0,
                    error: e.message
                } as AgentResponse;
            }
        });

        const results = await Promise.all(promises);

        results.forEach(res => {
            if (res) this.mergeResponseIntoState(state, res);
        });
    }

    private async executeSequential(state: State, agentNames: string[]): Promise<void> {
        for (const name of agentNames) {
            const agent = this.agentRegistry.getAgent(name);
            if (!agent) {
                state.errors.push(`Agent ${name} not found.`);
                continue;
            }

            try {
                const response = await agent.execute(state);
                this.mergeResponseIntoState(state, response);

                if (response.error) {
                    this.logger.warn(`${name} returned an error, halting short.`);
                    break;
                }
            } catch (error: any) {
                this.logger.error(`Error executing ${name}: ${error.message}`);
                state.errors.push(`Execution failed in ${name}: ${error.message}`);
                break; // Stop sequential chain on hard failure
            }
        }
    }

    /**
     * Helper to merge an agent's response safely into the shared State context.
     */
    private mergeResponseIntoState(state: State, response: AgentResponse): void {
        if (response) {
            state.agentResponses.push(response);
            if (response.error) {
                state.errors.push(`[${response.agentName}] ${response.error}`);
            }

            // Sync with Global Health Metrics
            this.metricsService.recordAgentRun(
                response.agentName,
                !response.error,
                response.executionTime,
                response.tokensUsed
            );

            // Update specific State keys based on Agent semantics
            if (response.agentName === 'SQL_AGENT' && response.output?.sql) {
                state.sqlQuery = response.output.sql;
            }
            if (response.agentName === 'EXECUTION_AGENT' && response.output?.data) {
                state.dbResults = response.output.data;
            }
            if (response.agentName === 'FORMATTER_AGENT') {
                state.finalResponse = response.output;
            }
            if (response.agentName === 'TASK_AGENT' && response.output?.text) {
                state.finalResponse = { summary: response.output.text };
            }
            if (response.agentName === 'REPO_AGENT' && response.output?.text) {
                state.finalResponse = { summary: response.output.text };
            }
            if (response.agentName === 'DIAGRAM_AGENT' && response.output?.text) {
                state.finalResponse = response.output.text;
            }
            if (response.agentName === 'CSV_AGENT' && response.output) {
                state.finalResponse = response.output;
            }
        }
    }

    private async selectContext(state: State): Promise<void> {
        const needsRepo = ['REPO_AGENT', 'DIAGRAM_AGENT', 'CSV_AGENT'].some(
            a => state.nextAgents?.includes(a)
        );
        const needsSchema = ['SQL_AGENT', 'DIAGRAM_AGENT', 'CSV_AGENT'].some(
            a => state.nextAgents?.includes(a)
        );

        if (needsRepo) {
            if (state.queryComplexity === 'overview') {
                const overviewCtx = this.repoService.getRepoOverview();
                const compactOverviewCtx =
                    overviewCtx.length > 900 ? `${overviewCtx.slice(0, 897)}...` : overviewCtx;
                state.computedContext = {
                    ...state.computedContext,
                    repoCtx: compactOverviewCtx,
                };
                console.log('[Context] repo tier: OVERVIEW');
            } else if (state.queryComplexity === 'module' && state.targetModule) {
                const full = this.repoService.getRepoContext();
                const target = state.targetModule.toLowerCase();
                const tokens = target.split(/[\s_-]+/).filter(t => t.length >= 3);
                const lines = full.split('\n').filter(line => {
                    const lowered = line.toLowerCase();
                    if (lowered.includes(target)) return true;
                    return tokens.some(t => lowered.includes(t));
                });
                const filtered = lines.join('\n');
                const moduleRepoCtx = filtered || this.repoService.getRepoOverview();
                state.computedContext = {
                    ...state.computedContext,
                    repoCtx: moduleRepoCtx,
                };
                console.log('[Context] repo tier: MODULE —', state.targetModule,
                    `(${moduleRepoCtx.length} chars)`);
            } else {
                state.computedContext = {
                    ...state.computedContext,
                    repoCtx: this.repoService.getRepoContext(),
                };
                console.log('[Context] repo tier: SPECIFIC (full)');
            }
        }

        if (needsSchema) {
            if (state.queryComplexity === 'overview') {
                state.computedContext = {
                    ...state.computedContext,
                    schemaCtx: this.schemaService.getSchemaSummary(),
                };
            } else {
                state.computedContext = {
                    ...state.computedContext,
                    schemaCtx: this.schemaService.getSchema(),
                };
            }
        }
    }
}
