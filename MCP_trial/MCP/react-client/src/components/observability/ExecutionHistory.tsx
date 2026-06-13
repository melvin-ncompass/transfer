"use client";

import { useAgentStore } from "@/store/agentStore";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { History, Play, CheckCircle2, Clock } from "lucide-react";

export function ExecutionHistory() {
    const { messages, agents } = useAgentStore();

    // Create a naive history derived from user prompts for this mock
    const userPrompts = messages.filter(m => m.role === 'user');

    if (userPrompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-white/30 text-center h-full glass-panel">
                <History className="w-8 h-8 mb-2 opacity-40 text-blue-400" />
                <p className="text-sm">No execution history.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 flex flex-col glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    Recent Executions
                </h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
                <div className="flex flex-col gap-2">
                    {userPrompts.slice().reverse().map((prompt, i) => (
                        <Card
                            key={prompt.id}
                            className="bg-white/5 border-white/10 p-3 hover:bg-white/10 transition-colors cursor-pointer group flex-shrink-0"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1 w-full group-hover:pr-8 transition-all relative">
                                    <span className="text-xs text-white/40 font-mono">
                                        {format(new Date(prompt.timestamp), 'HH:mm:ss')}
                                    </span>
                                    <p className="text-sm text-white/80 line-clamp-1">{prompt.content}</p>

                                    {/* Mock stats for the first item (current active) */}
                                    {i === 0 && agents.length > 0 && (
                                        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono font-semibold">
                                            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                <CheckCircle2 className="w-3 h-3" /> Completed
                                            </span>
                                            <span className="flex items-center gap-1 text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                                <Clock className="w-3 h-3" /> {agents.reduce((acc, curr) => acc + curr.executionTimeMs, 0)}ms
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
