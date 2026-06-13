"use client";

import { useAgentStore } from "@/store/agentStore";
import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, ShieldAlert, ListTree } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

const getIconForLevel = (level: string) => {
    switch (level) {
        case 'info': return <Info className="w-3 h-3 text-blue-400" />;
        case 'warn': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
        case 'error': return <ShieldAlert className="w-3 h-3 text-red-400" />;
        default: return <Info className="w-3 h-3 text-gray-400" />;
    }
};

const getColorForLevel = (level: string) => {
    switch (level) {
        case 'info': return 'text-blue-300';
        case 'warn': return 'text-yellow-300';
        case 'error': return 'text-red-300';
        default: return 'text-gray-300';
    }
};

export function SystemLogs() {
    const { logs } = useAgentStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-white/30 text-center h-[200px] glass-panel rounded-xl">
                <ListTree className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No system logs recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 glass-panel flex flex-col overflow-hidden relative group rounded-xl p-1">
            {/* Subtle border glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-transparent">
                <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-medium text-white/70">
                    <span>Live Telemetry</span>
                    <span className="text-white/40">{logs.length} events</span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2" ref={scrollRef}>
                    <div className="flex flex-col gap-1 pb-2">
                        <AnimatePresence>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-3 py-1.5 px-3 hover:bg-white/5 rounded-md transition-colors group/log text-xs font-mono shrink-0"
                                >
                                    <div className="shrink-0 mt-0.5 opacity-70 group-hover/log:opacity-100">
                                        {getIconForLevel(log.level)}
                                    </div>

                                    <div className="shrink-0 text-white/40">
                                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                                    </div>

                                    <div className="shrink-0 font-semibold text-white/60 min-w-[100px]">
                                        [{log.source}]
                                    </div>

                                    <div className={`break-words ${getColorForLevel(log.level)} opacity-80 group-hover/log:opacity-100`}>
                                        {log.message}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
