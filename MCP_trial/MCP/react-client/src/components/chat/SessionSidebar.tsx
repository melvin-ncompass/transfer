import { useAgentStore } from "@/store/agentStore";
import type { ChatSession } from "@/types/agent";
import { MessageSquare, Trash2, Plus, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

function SessionItem({
    session,
    isActive,
    onSelect,
    onDelete,
}: {
    session: ChatSession;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isActive
                    ? "bg-purple-500/15 border border-purple-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
            onClick={onSelect}
        >
            <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${isActive ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/30"}`}>
                <MessageSquare className="w-3 h-3" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
                <p className={`text-xs font-medium truncate leading-snug ${isActive ? "text-purple-200" : "text-white/70"}`}>
                    {session.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-white/25" />
                    <span className="text-[10px] text-white/30">
                        {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                    </span>
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-transparent group-hover:text-white/40 hover:!text-red-400 hover:bg-red-400/10 transition-all duration-200"
                title="Delete chat"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </motion.div>
    );
}

export function SessionSidebar() {
    const {
        sessions,
        sessionId,
        isThinking,
        resetSession,
        loadSession,
        deleteSession,
        fetchSessions,
    } = useAgentStore();

    const handleNewChat = () => {
        if (isThinking) return;
        resetSession();
    };

    const handleSelectSession = async (id: string) => {
        if (isThinking || id === sessionId) return;
        await loadSession(id);
    };

    const handleDeleteSession = async (id: string) => {
        if (isThinking) return;
        await deleteSession(id);
        fetchSessions();
    };

    return (
        <div className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-r border-white/10">
            {/* Header */}
            <div className="p-3 border-b border-white/10 shrink-0">
                <button
                    onClick={handleNewChat}
                    disabled={isThinking}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-500/15 border border-purple-500/25 text-purple-300 hover:bg-purple-500/25 hover:border-purple-500/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Chat
                </button>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 mt-8 px-4 text-center">
                        <MessageSquare className="w-6 h-6 text-white/15" />
                        <p className="text-[11px] text-white/25 leading-relaxed">
                            Your conversations will appear here
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 px-3 py-1">
                            Recent Chats
                        </p>
                        <AnimatePresence mode="popLayout">
                            {sessions.map((session) => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                    isActive={session.id === sessionId}
                                    onSelect={() => handleSelectSession(session.id)}
                                    onDelete={() => handleDeleteSession(session.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
