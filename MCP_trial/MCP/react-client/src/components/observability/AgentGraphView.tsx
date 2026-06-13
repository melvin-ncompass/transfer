"use client";

import { useAgentStore } from "@/store/agentStore";
import { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    Position,   
    Handle,
    type Edge,
    type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { Activity, CheckCircle2, AlertCircle } from "lucide-react";

// Custom Node Component for Agents
const AgentNode = ({ data }: { data: { label: string; status: string } }) => {
    const isRunning = data.status === "running";
    const isCompleted = data.status === "completed";

    return (
        <div
            className={`relative px-4 py-2 rounded-xl border shadow-xl backdrop-blur-md min-w-[150px]
      ${isRunning
                    ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-black/40 border-white/10"
                }`}
        >
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-white/20" />

            <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-xs font-semibold text-white/90">{data.label}</span>
                <span
                    className={`text-[10px] uppercase tracking-wider font-mono flex items-center gap-1
          ${isRunning ? "text-blue-300" : isCompleted ? "text-emerald-300" : "text-white/40"}
        `}
                >
                    {isRunning && <Activity className="w-3 h-3 animate-spin" />}
                    {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                    {!isRunning && !isCompleted && <AlertCircle className="w-3 h-3" />}
                    {data.status}
                </span>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-white/20" />
        </div>
    );
};

const nodeTypes = {
    agent: AgentNode,
};

export function AgentGraphView() {
    const { agents } = useAgentStore();

    const nodes: Node[] = useMemo(() => {
        return agents.map((agent, index) => ({
            id: agent.id,
            type: "agent",
            position: { x: index * 200, y: index % 2 === 0 ? 50 : 150 }, // Simple staggered layout
            data: {
                label: agent.name,
                status: agent.status,
            },
        }));
    }, [agents]);

    const edges: Edge[] = useMemo(() => {
        const newEdges: Edge[] = [];
        for (let i = 0; i < agents.length - 1; i++) {
            newEdges.push({
                id: `e-${agents[i].id}-${agents[i + 1].id}`,
                source: agents[i].id,
                target: agents[i + 1].id,
                animated: agents[i].status === "running" || agents[i + 1].status === "running",
                style: { stroke: agents[i].status === "completed" ? "#34d399" : "#ffffff40", strokeWidth: 2 },
            });
        }
        return newEdges;
    }, [agents]);

    if (agents.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/40 glass-panel rounded-xl p-8">
                Start an execution to view the Agent Graph.
            </div>
        );
    }

    return (
        <div className="w-full h-full glass-panel overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                className="bg-transparent"
            >
                <Background color="#ffffff20" gap={16} />
                <Controls className="filter invert opacity-50 block md:hidden" />
            </ReactFlow>
        </div>
    );
}
