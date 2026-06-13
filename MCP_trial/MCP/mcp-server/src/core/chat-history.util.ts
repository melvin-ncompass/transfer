/**
 * Formats the chat history array from State into a readable string for LLM prompt injection.
 * Keeps only the last N turns to avoid excessive token usage.
 *
 * @param history  The chatHistory array from State (each item: { role: string; content: string })
 * @param agentName Optional agent name for agent-aware history budgeting.
 * @returns A formatted string section ready to be inserted into a prompt, or an empty string if no history.
 */
export function formatChatHistory(history: any[], agentName?: string): string {
    if (!history || history.length === 0) {
        return '';
    }

    const TURN_BUDGET: Record<string, number> = {
        SUPERVISOR_AGENT: 6,
        TASK_AGENT: 8,
        SQL_AGENT: 3,
        REPO_AGENT: 4,
        DIAGRAM_AGENT: 3,
        CSV_AGENT: 2,
        FORMATTER_AGENT: 0,
    };

    const maxTurns = agentName && TURN_BUDGET[agentName] !== undefined ? TURN_BUDGET[agentName] : 10;

    // Exclude the current user message (it was pushed before agents run, so it's the last entry)
    const previousHistory = history.slice(0, -1);

    if (previousHistory.length === 0) {
        return '';
    }

    // Take only the last N turns to keep token count manageable
    const recentHistory = previousHistory.slice(-maxTurns);

    const formatted = recentHistory.map((entry: any) => {
        const roleLabel = entry.role === 'user' ? 'User' : 'Assistant';
        // Truncate very long assistant responses (e.g. large JSON dumps) to save tokens
        const content = typeof entry.content === 'string' && entry.content.length > 500
            ? entry.content.slice(0, 500) + '... [truncated]'
            : String(entry.content ?? '');
        return `[${roleLabel}]: ${content}`;
    });

    return `Conversation History (most recent last):\n${formatted.join('\n')}`;
}
