"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Sparkles, AlertTriangle } from "lucide-react";
import { useAgentStore, type AIProviderName } from "@/store/agentStore";

const PROVIDERS: {
    id: AIProviderName;
    label: string;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
    dotColor: string;
}[] = [
        {
            id: "gemini",
            label: "Gemini",
            description: "Google Gemini 2.5 Flash",
            icon: <Sparkles className="w-3.5 h-3.5" />,
            accentColor: "text-purple-300",
            dotColor: "bg-purple-400",
        },
        {
            id: "groq",
            label: "Groq",
            description: "Llama 3.3 70B via Groq",
            icon: <Zap className="w-3.5 h-3.5" />,
            accentColor: "text-orange-300",
            dotColor: "bg-orange-400",
        },
    ];

export function ProviderSelector() {
    const { provider, providerLimitReached, setProvider } = useAgentStore();
    const [open, setOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const current = PROVIDERS.find((p) => p.id === provider)!;

    // Calculate position above the trigger button
    const updatePosition = () => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setDropdownPos({
            top: rect.top - 230, // 8px gap above the button
            left: rect.right - 145, // 208 = w-52 (13rem)
        });
    };

    const toggleOpen = () => {
        if (!open) updatePosition();
        setOpen((o) => !o);
    };

    // Close when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Reposition on scroll/resize
    useEffect(() => {
        if (!open) return;
        const reposition = () => updatePosition();
        window.addEventListener("scroll", reposition, true);
        window.addEventListener("resize", reposition);
        return () => {
            window.removeEventListener("scroll", reposition, true);
            window.removeEventListener("resize", reposition);
        };
    }, [open]);

    const dropdown = dropdownPos && (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        transform: "translateY(-100%)",
                        zIndex: 9999,
                    }}
                    className="
                        w-52 rounded-xl overflow-hidden 
                        bg-[#0d0d1a]/95 border border-white/10
                        backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.7)]
                    "
                >
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {PROVIDERS.map((p) => {
                            const isDisabled = providerLimitReached[p.id];
                            const isSelected = provider === p.id;

                            return (
                                <div key={p.id} className="relative group/item">
                                    <button
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                setProvider(p.id);
                                                setOpen(false);
                                            }
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                                            transition-all duration-150
                                            ${isSelected
                                                ? "bg-white/10 border border-white/10"
                                                : "border border-transparent hover:bg-white/5"
                                            }
                                            ${isDisabled
                                                ? "opacity-40 cursor-not-allowed"
                                                : "cursor-pointer"
                                            }
                                        `}
                                    >
                                        <span
                                            className={`
                                                w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                                ${isSelected ? "bg-white/10" : "bg-white/5"}
                                                ${p.accentColor}
                                            `}
                                        >
                                            {isDisabled
                                                ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                                                : p.icon
                                            }
                                        </span>

                                        <div className="flex flex-col">
                                            <span className={`text-xs font-semibold ${isDisabled ? "text-white/30" : "text-white/90"}`}>
                                                {p.label}
                                            </span>
                                            <span className="text-[10px] text-white/30 font-mono">
                                                {isDisabled ? "Rate limit reached" : p.description}
                                            </span>
                                        </div>

                                        {isSelected && (
                                            <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${p.accentColor} bg-white/5`}>
                                                active
                                            </span>
                                        )}
                                    </button>

                                    {/* Hover tooltip for disabled */}
                                    {isDisabled && (
                                        <div className="
                                            absolute left-full top-1/2 -translate-y-1/2 ml-2
                                            hidden group-hover/item:flex
                                            items-center gap-1.5 px-2.5 py-1.5
                                            bg-yellow-500/10 border border-yellow-500/20 rounded-lg
                                            text-[11px] text-yellow-300 whitespace-nowrap
                                            pointer-events-none
                                        " style={{ zIndex: 10000 }}>
                                            <AlertTriangle className="w-3 h-3" />
                                            Rate limit reached
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer hint */}
                    <div className="px-3 py-2 border-t border-white/5 text-[10px] text-white/20 font-mono">
                        Selection applies to next query
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggleOpen}
                className={`
                    flex items-center gap-1.5 h-12 px-3 rounded-xl text-xs font-semibold shrink-0
                    bg-white/5 border border-white/10 backdrop-blur-sm
                    hover:bg-white/10 hover:border-white/20
                    transition-all duration-200 relative z-10
                    ${current.accentColor}
                `}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor} shrink-0`} />
                <span className="hidden sm:inline">{current.label}</span>
                <ChevronDown
                    className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Portal: renders outside all clipping parents */}
            {typeof document !== "undefined" && createPortal(dropdown, document.body)}
        </>
    );
}
