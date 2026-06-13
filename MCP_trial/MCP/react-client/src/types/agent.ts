export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentExecution {
    id: string;
    name: string;
    status: AgentStatus;
    reasoning: string;
    sqlGenerated?: string;
    executionTimeMs: number;
    tokensUsed: number;
    startTime: number;
    endTime?: number;
}

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    source: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
}

export interface DashboardState {
    currentExecutionId: string | null;
    messages: ChatMessage[];
    agents: AgentExecution[];
    logs: SystemLog[];
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}
