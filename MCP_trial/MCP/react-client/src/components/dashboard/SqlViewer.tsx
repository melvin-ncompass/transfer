"use client";

import { useAgentStore } from "@/store/agentStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Terminal, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function SqlViewer() {
    const { agents } = useAgentStore();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter out agents that actually generated SQL
    const sqlAgents = agents.filter(a => a.sqlGenerated);

    const copyToClipboard = async (id: string, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (sqlAgents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-white/30 p-8 text-center glass-panel">
                <Terminal className="w-12 h-12 mb-4 opacity-50" />
                <p>No SQL generated yet.</p>
                <p className="text-sm mt-1">Queries will appear here when emitted by the DB Agent.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full glass-panel p-4">
            <div className="flex flex-col gap-4 pb-4 h-full">
                <AnimatePresence>
                    {sqlAgents.map((agent) => (
                        <motion.div
                            key={agent.id + '_sql'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative group"
                        >
                            <Card className="glass-panel overflow-hidden shadow-2xl">
                                <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm font-medium text-white/80">{agent.name} Query</span>
                                    </div>

                                    <button
                                        onClick={() => copyToClipboard(agent.id, agent.sqlGenerated || '')}
                                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/50 hover:text-white/90"
                                    >
                                        {copiedId === agent.id ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                <div className="p-0 text-sm overflow-w-auto">
                                    <SyntaxHighlighter
                                        language="sql"
                                        style={vscDarkPlus}
                                        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                    >
                                        {agent.sqlGenerated || ''}
                                    </SyntaxHighlighter>
                                </div>

                                <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex justify-end">
                                    <span className="text-xs text-white/40 font-mono">
                                        {agent.executionTimeMs}ms execution time
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ScrollArea>
    );
}
