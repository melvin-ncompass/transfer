"use client";

import { useAgentStore } from "@/store/agentStore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ReasoningTreeView() {
    const { agents } = useAgentStore();

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/30 p-8 text-center glass-panel">
                <BrainCircuit className="w-12 h-12 mb-4 opacity-50" />
                <p>No reasoning traces available.</p>
                <p className="text-sm mt-1">Execute a query to see the agent's thought process.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full glass-panel p-4">
            <Accordion type="multiple" className="w-full h-full space-y-4">
                <AnimatePresence>
                    {agents.map((agent) => (
                        <motion.div
                            key={agent.id + '_reasoning'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <AccordionItem
                                value={agent.id}
                                className="glass-panel px-4 overflow-hidden"
                            >
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3 w-full pr-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                            {agent.status === 'running' ? (
                                                <Activity className="w-4 h-4 text-blue-400 animate-spin" />
                                            ) : agent.status === 'completed' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-white/30" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold text-white/90">{agent.name}</span>
                                            <span className="text-xs text-white/40 font-mono flex items-center gap-2">
                                                <span>{agent.executionTimeMs}ms</span>
                                                <span>•</span>
                                                <span>{agent.tokensUsed} tokens</span>
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="pt-2 pb-4 border-t border-white/5">
                                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-indigo-200/80 leading-relaxed whitespace-pre-wrap border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {agent.reasoning || "Initiating cognitive engine..."}
                                    </div>

                                    {agent.sqlGenerated && (
                                        <div className="mt-4 p-4 rounded-lg bg-[#0e0e11] border border-white/10">
                                            <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2 block">
                                                Output payload
                                            </span>
                                            <pre className="text-xs font-mono text-white/70 overflow-x-auto whitespace-pre-wrap">
                                                {agent.sqlGenerated}
                                            </pre>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Accordion>
        </ScrollArea>
    );
}
