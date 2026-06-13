import { useAgentStore } from '@/store/agentStore';
import type { AIProviderName } from '@/store/agentStore';
import { v4 as uuidv4 } from 'uuid';
import { withApiKeyHeaders } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Service that connects the React UI to the live NestJS backend API.
 */
class WebSocketService {
    private isExecuting = false;

    connect() {
        useAgentStore.getState().addLog({
            level: 'info',
            message: 'Connected to API Backend',
            source: 'System'
        });
    }

    disconnect() {
        this.isExecuting = false;
    }

    // Execute the real query against NestJS
    async startMockExecution(prompt: string, provider: AIProviderName = 'gemini') {
        if (this.isExecuting) return;
        this.isExecuting = true;

        const store = useAgentStore.getState();
        store.addMessage({ role: 'user', content: prompt });
        store.startExecution();

        // Register this session on the server (idempotent upsert)
        const sessionTitle = prompt.slice(0, 60) + (prompt.length > 60 ? '…' : '');
        store.registerSessionOnServer(store.sessionId, sessionTitle);

        try {
            store.addLog({ level: 'info', message: `Sending query to backend: ${prompt}`, source: 'System' });

            // Call our live NestJS API on port 3001
            const response = await fetch(`${API_BASE}/api/query`, {
                method: 'POST',
                headers: withApiKeyHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({ query: prompt, sessionId: store.sessionId, config: { provider } })
            });

            if (response.status === 429) {
                store.setProviderLimitReached(provider, true);
                throw new Error(`Rate limit reached for ${provider}. Please switch providers.`);
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // Result is expected to have:
            // { query, traces: [{ agentName, reasoning, input, output, tokensUsed, executionTime, error }], errors, data }

            store.addLog({ level: 'info', message: `Received response from backend.`, source: 'System' });

            const traces = result.traces || [];

            // To keep the UI dynamic and engaging, we will animate the agents in sequentially, 
            // even though the backend already finished executing them.
            let delayIndex = 0;

            for (const trace of traces) {
                const agentId = uuidv4();

                // 1. Show agent starting
                setTimeout(() => {
                    store.updateAgent(agentId, {
                        name: trace.agentName,
                        status: 'running',
                        reasoning: "Thinking and processing...",
                        executionTimeMs: 0,
                        tokensUsed: 0
                    });

                    store.addLog({
                        level: 'info',
                        message: `Agent ${trace.agentName} activated`,
                        source: 'Orchestrator'
                    });
                }, delayIndex * 1500);

                // 2. Show agent finished with real metrics
                setTimeout(() => {
                    store.updateAgent(agentId, {
                        name: trace.agentName,
                        status: trace.error ? 'failed' : 'completed',
                        reasoning: trace.reasoning || trace.error || "Completed task.",
                        sqlGenerated: trace.output?.sql || undefined,
                        executionTimeMs: trace.executionTime || 100,
                        tokensUsed: trace.tokensUsed?.total || 0,
                        endTime: Date.now()
                    });

                    store.addLog({
                        level: trace.error ? 'error' : 'info',
                        message: `Agent ${trace.agentName} ${trace.error ? 'failed' : 'finished'}`,
                        source: 'Orchestrator'
                    });
                }, delayIndex * 1500 + 1000);

                delayIndex++;
            }

            // Finally, stream the final response payload text into the chat window
            setTimeout(() => {
                let finalResponseText = '';

                if (result.errors && result.errors.length > 0) {
                    finalResponseText = "⚠️ Errors occurred:\n" + result.errors.join('\n');
                } else if (result.data) {
                    const data = result.data;
                    if (typeof data === 'string') {
                        finalResponseText = data;
                    } else if (data.escalationNeeded) {
                        finalResponseText = `🤔 ${data.message}`;
                    } else if (data.summary) {
                        // We have a rich formatted response
                        finalResponseText = data.summary;
                        if (data.tabularData && data.tabularData.length > 0) {
                            finalResponseText += `\n\nRetrieved ${data.tabularData.length} record(s).`;
                        }
                        if (data.generatedSql) {
                            finalResponseText += `\n\n💡 Generated SQL:\n${data.generatedSql}`;
                        }
                    } else {
                        finalResponseText = JSON.stringify(data, null, 2);
                    }
                } else if (traces && traces.length > 0) {
                    // Fallback: surface the last agent's reasoning from traces
                    const lastTrace = traces[traces.length - 1];
                    finalResponseText = lastTrace.reasoning || "Agents completed execution.";
                } else {
                    finalResponseText = "No data was returned from the backend.";
                }

                // Make sure we have text
                if (!finalResponseText) finalResponseText = "Execution finished.";

                // Stream the text to the UI like a real LLM
                const chunks = finalResponseText.split(' ');
                let i = 0;
                const streamInterval = setInterval(() => {
                    if (i < chunks.length) {
                        store.updateStreamingMessage(chunks[i] + (i < chunks.length - 1 ? ' ' : ''));
                        i++;
                    } else {
                        clearInterval(streamInterval);
                        store.stopExecution();
                        this.isExecuting = false;

                        store.addLog({
                            level: 'info',
                            message: 'Execution cycle completed',
                            source: 'System'
                        });
                    }
                }, 50); // Faster streaming

            }, delayIndex * 1500 + 500);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            store.addLog({
                level: 'error',
                message: `Failed to connect to backend: ${error.message}`,
                source: 'System'
            });
            store.updateStreamingMessage(`Oops! Could not connect to the NestJS backend. Error: ${error.message}`);
            store.stopExecution();
            this.isExecuting = false;
        }
    }

    stopSimulation() {
        this.isExecuting = false;
    }
}

export const wsService = new WebSocketService();
