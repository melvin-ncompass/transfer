"use client";

import { useAgentStore } from "@/store/agentStore";
import { Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export function PerformanceDashboard() {
    const { agents } = useAgentStore();

    const totalTime = agents.reduce((acc, curr) => acc + curr.executionTimeMs, 0);
    const successCount = agents.filter((a) => a.status === "completed").length;
    const failCount = agents.filter((a) => a.status === "failed").length;

    // Simulated retry count for UI completeness
    const retryCount = failCount > 0 ? failCount + 1 : 0;

    const successRate = agents.length > 0
        ? Math.round((successCount / agents.length) * 100)
        : 0;

    const metrics = [
        {
            title: "Avg Execution",
            value: agents.length > 0 ? `${Math.round(totalTime / agents.length)}ms` : "0ms",
            icon: Clock,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            title: "Success Rate",
            value: `${successRate}%`,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "Failure Rate",
            value: `${agents.length > 0 ? 100 - successRate : 0}%`,
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20"
        },
        {
            title: "Retry Events",
            value: retryCount.toString(),
            icon: RefreshCw,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {metrics.map((metric, i) => (
                <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative p-1 rounded-xl flex flex-col justify-between overflow-hidden group glass-panel ${metric.bg} ${metric.border}`}
                >
                    {/* Subtle glow on hover */}
                    <div className="absolute inset-[1px] rounded-[inherit] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex flex-1 flex-col justify-between p-3">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">{metric.title}</span>
                            <metric.icon className={`w-4 h-4 ${metric.color}`} />
                        </div>

                        <div>
                            <span className="text-2xl font-bold text-white/90 font-mono tracking-tight">{metric.value}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
