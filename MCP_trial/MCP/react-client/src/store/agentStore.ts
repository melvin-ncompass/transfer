import { create } from 'zustand';
import type { AgentExecution, ChatMessage, SystemLog, AgentStatus, ChatSession } from '@/types/agent';
import { v4 as uuidv4 } from 'uuid';
import { withApiKeyHeaders } from '@/services/auth';

export type AIProviderName = 'gemini' | 'groq';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

interface AgentStoreState {
    currentExecutionId: string | null;
    sessionId: string;
    sessions: ChatSession[];
    messages: ChatMessage[];
    agents: AgentExecution[];
    logs: SystemLog[];
    isThinking: boolean;
    isSidebarOpen: boolean;
    provider: AIProviderName;
    providerLimitReached: Record<AIProviderName, boolean>;

    // Actions
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    updateStreamingMessage: (content: string) => void;
    updateAgent: (id: string, partial: Partial<AgentExecution>) => void;
    addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
    startExecution: () => void;
    stopExecution: () => void;
    reset: () => void;
    resetSession: () => void;
    setProvider: (provider: AIProviderName) => void;
    setProviderLimitReached: (provider: AIProviderName, reached: boolean) => void;
    toggleSidebar: () => void;

    // Session persistence
    fetchSessions: () => Promise<void>;
    registerSessionOnServer: (sessionId: string, title: string) => Promise<void>;
    loadSession: (sessionId: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
    currentExecutionId: null,
    sessionId: uuidv4(),
    sessions: [],
    messages: [],
    agents: [],
    logs: [],
    isThinking: false,
    isSidebarOpen: true,
    provider: 'gemini',
    providerLimitReached: { gemini: false, groq: false },

    setProvider: (provider) => set({ provider }),

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    setProviderLimitReached: (provider, reached) =>
        set((state) => ({
            providerLimitReached: { ...state.providerLimitReached, [provider]: reached },
        })),

    addMessage: (msg) => set((state) => ({
        messages: [...state.messages, { ...msg, id: uuidv4(), timestamp: new Date().toISOString() }],
    })),

    updateStreamingMessage: (content) => set((state) => {
        const messages = [...state.messages];
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            lastMessage.content += content;
            return { messages };
        }

        messages.push({
            id: uuidv4(),
            role: 'assistant',
            content,
            timestamp: new Date().toISOString(),
            isStreaming: true
        });
        return { messages };
    }),

    updateAgent: (id, partial) => set((state) => {
        const agentIndex = state.agents.findIndex(a => a.id === id);
        if (agentIndex > -1) {
            const newAgents = [...state.agents];
            newAgents[agentIndex] = { ...newAgents[agentIndex], ...partial };
            return { agents: newAgents };
        }

        if (partial.name && partial.status) {
            return {
                agents: [...state.agents, {
                    id,
                    name: partial.name,
                    status: partial.status as AgentStatus,
                    reasoning: partial.reasoning || '',
                    executionTimeMs: partial.executionTimeMs || 0,
                    tokensUsed: partial.tokensUsed || 0,
                    startTime: Date.now(),
                    ...partial
                }]
            };
        }
        return state;
    }),

    addLog: (log) => set((state) => ({
        logs: [...state.logs, { ...log, id: uuidv4(), timestamp: new Date().toISOString() }].slice(-100),
    })),

    startExecution: () => set({
        currentExecutionId: uuidv4(),
        isThinking: true,
        agents: [],
    }),

    stopExecution: () => set((state) => {
        const messages = [...state.messages];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
        }
        return { isThinking: false, messages };
    }),

    reset: () => set({ currentExecutionId: null, messages: [], agents: [], logs: [], isThinking: false }),

    resetSession: () => set({
        sessionId: uuidv4(),
        currentExecutionId: null,
        messages: [],
        agents: [],
        logs: [],
        isThinking: false,
    }),

    // ===== SESSION PERSISTENCE =====

    fetchSessions: async () => {
        try {
            const res = await fetch(`${API_BASE}/api/sessions`, {
                headers: withApiKeyHeaders(),
            });
            if (!res.ok) return;
            const sessions: ChatSession[] = await res.json();
            set({ sessions });
        } catch {
            // Server may not be available — silently fail
        }
    },

    registerSessionOnServer: async (sessionId: string, title: string) => {
        try {
            await fetch(`${API_BASE}/api/sessions`, {
                method: 'POST',
                headers: withApiKeyHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ sessionId, title }),
            });
            get().fetchSessions();
        } catch {
            // Silently fail
        }
    },

    loadSession: async (sessionId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
                headers: withApiKeyHeaders(),
            });
            if (!res.ok) return;

            const { messages: rawHistory } = await res.json();

            const messages: ChatMessage[] = rawHistory.map((entry: { role: string; content: string }) => ({
                id: uuidv4(),
                role: entry.role === 'user' ? 'user' : 'assistant',
                content: entry.content,
                timestamp: new Date().toISOString(),
            }));

            set({
                sessionId,
                messages,
                agents: [],
                logs: [],
                currentExecutionId: null,
                isThinking: false,
            });
        } catch {
            // Silently fail
        }
    },

    deleteSession: async (sessionId: string) => {
        try {
            await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: withApiKeyHeaders(),
            });

            set((state) => ({
                sessions: state.sessions.filter(s => s.id !== sessionId),
            }));

            if (get().sessionId === sessionId) {
                get().resetSession();
            }
        } catch {
            // Silently fail
        }
    },
}));
