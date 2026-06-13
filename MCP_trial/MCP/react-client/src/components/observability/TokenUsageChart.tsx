"use client";

import { useAgentStore } from "@/store/agentStore";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Cpu } from "lucide-react";

export function TokenUsageChart() {
    const { agents } = useAgentStore();

    const data = agents.map(a => ({
        name: a.name,
        tokens: a.tokensUsed,
    }));

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/30 p-8 text-center glass-panel rounded-xl">
                <Cpu className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Awaiting token ingestion...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-4 glass-panel">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Token Utilization
            </h3>

            <div className="w-full h-[calc(100%-2rem)] min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#ffffff40"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#ffffff60' }}
                        />
                        <YAxis
                            stroke="#ffffff40"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#ffffff60' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#ffffff0a' }}
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(8px)'
                            }}
                            itemStyle={{ color: '#c084fc', fontSize: '12px', fontWeight: 600 }}
                            labelStyle={{ color: '#ffffff80', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={`url(#tokenGradient)`}
                                />
                            ))}
                        </Bar>
                        <defs>
                            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#c084fc" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
