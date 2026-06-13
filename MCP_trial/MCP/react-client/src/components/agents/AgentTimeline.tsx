"use client";

import { useAgentStore } from "@/store/agentStore";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Clock, Target, AlertCircle } from "lucide-react";

export function AgentTimeline() {
    const { agents } = useAgentStore();

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-white/30 text-center h-[120px] bg-black/20 rounded-xl border border-white/5 backdrop-blur-md">
                <Target className="w-8 h-8 mb-2 opacity-40 text-purple-400" />
                <p className="text-sm">Orchestration pipeline idle.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[140px] glass-panel rounded-xl p-4 overflow-hidden group">
            {/* Background radial glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 flex justify-between items-center">
                <span>Execution Graph</span>
                <span className="text-white/40 font-mono flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
                    <Clock className="w-3 h-3" />
                    {agents.length} nodes
                </span>
            </h3>

            <div className="w-full overflow-x-auto custom-scrollbar pb-1">
                <div className="flex items-center w-max gap-2 px-2 pb-2">
                    <AnimatePresence>
                        {agents.map((agent, index) => {
                            const isLast = index === agents.length - 1;
                            const isRunning = agent.status === 'running';
                            const isCompleted = agent.status === 'completed';

                            return (
                                <motion.div
                                    key={agent.id + '_timeline'}
                                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    className="flex items-center flex-shrink-0"
                                >
                                    {/* The Node Card */}
                                    <div className={`
                    relative flex flex-col items-center justify-center w-36 h-20 rounded-xl border 
                    shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-colors duration-500 backdrop-blur-md group/node
                    ${isRunning ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : ''}
                    ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : ''}
                    ${!isRunning && !isCompleted ? 'bg-white/5 border-white/10' : ''}
                  `}>

                                        {/* Pulsing indicator if running */}
                                        {isRunning && (
                                            <span className="absolute flex h-3 w-3 -top-1 -right-1">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                            </span>
                                        )}

                                        <span className="text-xs font-medium text-white/90 truncate w-full px-2 text-center">
                                            {agent.name}
                                        </span>

                                        <span className={`text-[10px] mt-1 flex items-center gap-1 font-mono
                      ${isRunning ? 'text-blue-300' : ''}
                      ${isCompleted ? 'text-emerald-300' : ''}
                      ${!isRunning && !isCompleted ? 'text-white/40' : ''}
                    `}>
                                            {isRunning && <Activity className="w-3 h-3 animate-spin" />}
                                            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                            {(!isRunning && !isCompleted) && <AlertCircle className="w-3 h-3" />}
                                            {agent.executionTimeMs}ms
                                        </span>
                                    </div>

                                    {/* Connector Line (except for last node) */}
                                    {!isLast && (
                                        <div className="w-8 h-[2px] bg-white/10 mx-1 relative overflow-hidden flex-shrink-0">
                                            {isRunning && (
                                                <motion.div
                                                    initial={{ x: "-100%" }}
                                                    animate={{ x: "100%" }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
                                                />
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
