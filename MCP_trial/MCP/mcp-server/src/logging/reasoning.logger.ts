import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { AgentAction, AgentFinish } from '@langchain/core/agents';
import { LLMResult } from '@langchain/core/outputs';
import { Serialized } from '@langchain/core/load/serializable';
import { Logger } from '@nestjs/common';
import { AgentTokensUsed } from '../interfaces/core.interface';

export class ReasoningLogger extends BaseCallbackHandler {
    name = 'ReasoningLogger';
    private readonly logger = new Logger(ReasoningLogger.name);
    private traceId: string;
    private logs: string[] = [];

    // Storage for intercepted tokens
    private tokens: AgentTokensUsed = { prompt: 0, completion: 0, total: 0, promptChars: 0 };
    private lastPromptChars = 0;

    // Track tokens per LLM attempt (useful when the provider retries)
    private tokenHistory: Array<AgentTokensUsed> = [];

    constructor(traceId: string) {
        super();
        this.traceId = traceId;
    }

    // Called when an LLM starts
    async handleLLMStart(
        llm: Serialized,
        prompts: string[],
        runId: string,
        parentRunId?: string,
        extraParams?: Record<string, unknown>,
        tags?: string[],
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        const log = `[Trace: ${this.traceId}] LLM Started: ${llm.id?.join('.')}`;
        this.logs.push(log);
        this.logger.debug(log);

        this.lastPromptChars = Array.isArray(prompts) ? prompts.join('').length : 0;
    }

    // Called when LLM ends
    async handleLLMEnd(
        output: LLMResult,
        runId: string,
        parentRunId?: string,
        tags?: string[],
    ): Promise<void> {
        const tokenInfo = output.llmOutput?.tokenUsage;

        if (tokenInfo) {
            const nextTokens: AgentTokensUsed = {
                prompt: tokenInfo.promptTokens || 0,
                completion: tokenInfo.completionTokens || 0,
                total: tokenInfo.totalTokens || 0,
                promptChars: this.lastPromptChars,
            };

            // Persist token usage for this attempt
            this.tokenHistory.push(nextTokens);
            // Preserve existing behavior: aggregated result should be "latest attempt"
            this.tokens = nextTokens;
        }

        const log = `[Trace: ${this.traceId}] LLM Ended. Tokens generated: ${this.tokens.total}`;
        this.logs.push(log);
        this.logger.debug(log);
    }

    // Called when an agent takes an action (e.g. tool call)
    async handleAgentAction(action: AgentAction, runId: string): Promise<void> {
        const log = `[Trace: ${this.traceId}] Agent Action: Tool = ${action.tool}`;
        this.logs.push(log);
    }

    // Get collected logs for the final Response object
    getLogs(): string[] {
        return this.logs;
    }

    // Get aggregated tokens for visibility response
    getTokenUsage(): AgentTokensUsed {
        return this.tokens;
    }

    getAllAttemptTokens(): Array<AgentTokensUsed> {
        return this.tokenHistory;
    }
}
