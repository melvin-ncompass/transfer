import { Injectable, Logger } from '@nestjs/common';

export interface AgentMetrics {
    agentName: string;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalExecutionTimeMs: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
}

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    // In-memory store for MVP. 
    // In Production this would push to Prometheus/Datadog or write to a TimescaleDB.
    private metricsStore = new Map<string, AgentMetrics>();

    recordAgentRun(agentName: string, success: boolean, executionTimeMs: number, tokens?: { prompt: number, completion: number }) {
        if (!this.metricsStore.has(agentName)) {
            this.metricsStore.set(agentName, {
                agentName,
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                totalExecutionTimeMs: 0,
                totalPromptTokens: 0,
                totalCompletionTokens: 0
            });
        }

        const metrics = this.metricsStore.get(agentName)!;
        metrics.totalRuns += 1;
        metrics.totalExecutionTimeMs += executionTimeMs;

        if (success) {
            metrics.successfulRuns += 1;
        } else {
            metrics.failedRuns += 1;
        }

        if (tokens) {
            metrics.totalPromptTokens += tokens.prompt;
            metrics.totalCompletionTokens += tokens.completion;
        }

        this.logger.debug(`[Metrics] Recorded run for ${agentName} | ${executionTimeMs}ms`);
    }

    getAllMetrics(): AgentMetrics[] {
        return Array.from(this.metricsStore.values());
    }

    getSystemHealthStatus() {
        const metrics = this.getAllMetrics();
        let overallSuccess = 0;
        let overallFailure = 0;

        for (const m of metrics) {
            overallSuccess += m.successfulRuns;
            overallFailure += m.failedRuns;
        }

        const failureRate = overallSuccess + overallFailure > 0
            ? (overallFailure / (overallSuccess + overallFailure)) * 100
            : 0;

        return {
            status: failureRate > 10 ? 'DEGRADED' : 'HEALTHY',
            totalAgentsActive: metrics.length,
            overallFailureRate: `${failureRate.toFixed(2)}%`,
            details: metrics
        };
    }
}
