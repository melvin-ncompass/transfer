"use client";

import { useAgentStore } from "@/store/agentStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ServerCog, Activity, Clock, Cpu, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import type { AgentStatus } from "@/types/agent";

const statusConfig: Record<AgentStatus, { color: string, icon: LucideIcon, label: string }> = {
    idle: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: AlertCircle, label: "Idle" },
    running: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse", icon: Activity, label: "Running" },
    completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2, label: "Completed" },
    failed: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "Failed" }
};

export function AgentActivityViewer() {
    const { agents } = useAgentStore();

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/30 p-8 text-center glass-panel">
                <ServerCog className="w-12 h-12 mb-4 opacity-50" />
                <p>No agents currently active.</p>
                <p className="text-sm mt-1">Start a query to see multi-agent thinking.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full glass-panel p-4">
            <div className="flex flex-col gap-4 pb-4 h-full">
                <AnimatePresence>
                    {agents.map((agent) => {
                        const config = statusConfig[agent.status];
                        const StatusIcon = config.icon;

                        return (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <Card className="glass-panel overflow-hidden shadow-xl">
                                    {/* Top Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                                                <StatusIcon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                                            </div>
                                            <h3 className="font-medium text-white/90">{agent.name}</h3>
                                        </div>
                                        <Badge variant="outline" className={config.color}>
                                            {config.label}
                                        </Badge>
                                    </div>

                                    {/* Body Content */}
                                    <div className="p-4 space-y-4">
                                        {/* Metrics row */}
                                        <div className="flex gap-4 text-xs font-mono text-white/40">
                                            <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md border border-white/5">
                                                <Clock className="w-3 h-3" />
                                                {agent.executionTimeMs}ms
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md border border-white/5">
                                                <Cpu className="w-3 h-3" />
                                                {agent.tokensUsed} tokens
                                            </div>
                                        </div>

                                        {/* Reasoning Stream */}
                                        <div className="space-y-2">
                                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Reasoning Core</span>
                                            <div className="bg-black/40 border border-white/5 rounded-xl p-3 max-h-[150px] overflow-y-auto custom-scrollbar">
                                                <p className="text-sm text-indigo-300/80 font-mono leading-relaxed break-words whitespace-pre-wrap">
                                                    {agent.reasoning || "Waiting for initialization..."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ScrollArea>
    );
}
