import { useAgentStore } from "@/store/agentStore";
import { wsService } from "@/services/api";
import { SessionSidebar } from "@/components/chat/SessionSidebar";
import { Input } from "@/components/ui/input";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { Send, User, Bot, Loader2, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { MermaidBlock } from "@/components/MermaidBlock";
import { CsvViewer } from "@/components/CsvViewer";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ChatPanel() {
    const [input, setInput] = useState("");
    const { messages, isThinking, provider, isSidebarOpen, toggleSidebar } = useAgentStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = () => {
        if (!input.trim() || isThinking) return;
        wsService.startMockExecution(input, provider);
        setInput("");
    };

    return (
        <div className="flex h-full overflow-hidden">

            {/* Session Sidebar — slides in/out */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && (
                    <motion.div
                        key="sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 210, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="shrink-0 overflow-hidden h-full"
                    >
                        <div className="w-[210px] h-full">
                            <SessionSidebar />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0 glass-panel border-r-0 relative overflow-hidden">
                {/* Subtle ambient background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="p-3 border-b border-white/10 flex items-center gap-2 z-10 shrink-0">
                    <button
                        onClick={toggleSidebar}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-200 shrink-0"
                        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {isSidebarOpen
                            ? <PanelLeftClose className="w-4 h-4" />
                            : <PanelLeftOpen className="w-4 h-4" />
                        }
                    </button>
                    <h2 className="text-sm font-semibold text-white/80 flex-1 truncate">Agent Chat</h2>
                    {isThinking && <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />}
                </div>

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 z-10" ref={scrollRef}>
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-4">
                        <AnimatePresence initial={false}>
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center gap-3 mt-16 text-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <p className="text-white/40 text-sm">Ask me anything — I remember this conversation.</p>
                                </motion.div>
                            )}
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    <div className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-purple-500/10 border border-purple-500/20 text-white/90 rounded-tr-sm'
                                        : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                                        }`}>
                                        {msg.role !== 'user' ? (
                                            (() => {
                                                const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                                                if (text.trim().startsWith('```mermaid')) {
                                                    return <MermaidBlock content={text} />;
                                                }
                                                // CSV detection: first line has no spaces and has commas, not JSON or mermaid
                                                const firstLine = text.split('\n')[0];
                                                if (text.includes(',') && !firstLine.includes(' ') && !text.startsWith('{') && !text.startsWith('```')) {
                                                    return <CsvViewer data={text} />;
                                                }

                                                return <>{msg.content}</>;
                                            })()
                                        ) : (
                                            msg.content
                                        )}
                                        {msg.isStreaming && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ repeat: Infinity, duration: 0.8 }}
                                                className="inline-block ml-1 w-1.5 h-3 bg-purple-400/80 rounded-sm translate-y-0.5"
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isThinking && !messages[messages.length - 1]?.isStreaming && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/10 flex items-center gap-2 text-white/50 italic">
                                        Agents are analyzing Intent...
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md z-10 shrink-0">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2 max-w-2xl mx-auto relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl blur-lg transition-opacity opacity-0 group-focus-within:opacity-100" />

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isThinking ? "Agents are working..." : "Ask the multi-agent system..."}
                            disabled={isThinking}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-purple-500/50 backdrop-blur-sm relative z-10"
                        />
                        <ProviderSelector />
                        <LiquidButton
                            variant="default"
                            size="icon"
                            type="submit"
                            disabled={!input.trim() || isThinking}
                            className="h-12 w-12 shrink-0 rounded-xl z-10 text-white [&>svg]:text-white"
                        >
                            <Send className="w-5 h-5" />
                        </LiquidButton>
                    </form>
                </div>
            </div>
        </div>
    );
}
