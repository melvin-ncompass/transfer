import { useState, useRef, useEffect } from "react";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import { ThumbUp } from "@mui/icons-material";
import type { AnnouncementType } from "../api/announcements.api";
import { useLikeAnnouncementMutation } from "../api/announcements.api";

const REACTIONS = [
    { emoji: "👍", label: "Like" },
    { emoji: "😊", label: "Smile" },
    { emoji: "❤️", label: "Love" },
    { emoji: "👏", label: "Clap" },
    { emoji: "💡", label: "Insightful" },
    { emoji: "🎉", label: "Celebrate" },
];

interface ReactionsButtonProps {
    initialCount: number;
    announcementId: number;
    announcementType: AnnouncementType;
}

export function ReactionsButton({ initialCount, announcementId, announcementType }: ReactionsButtonProps) {
    const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
    const [count, setCount] = useState(initialCount);
    const [showPicker, setShowPicker] = useState(false);
    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [likeAnnouncement] = useLikeAnnouncementMutation();

    const handleMouseEnter = () => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        setShowPicker(true);
    };

    const handleMouseLeave = () => {
        hideTimeout.current = setTimeout(() => setShowPicker(false), 200);
    };

    const handleReactionClick = async (emoji: string) => {
        const isUnliking = selectedReaction === emoji;

        if (isUnliking) {
            setSelectedReaction(null);
            setCount((prev) => prev - 1);
        } else {
            if (!selectedReaction) setCount((prev) => prev + 1);
            setSelectedReaction(emoji);
        }
        setShowPicker(false);

        try {
            await likeAnnouncement({
                type: announcementType,
                id: announcementId,
            }).unwrap();
        } catch {
            if (isUnliking) {
                setSelectedReaction(emoji);
                setCount((prev) => prev + 1);
            } else {
                setSelectedReaction(null);
                if (!selectedReaction) setCount((prev) => prev - 1);
            }
        }
    };

    const handleMainButtonClick = async () => {
        if (selectedReaction) {
            const prev = selectedReaction;
            setSelectedReaction(null);
            setCount((c) => c - 1);

            try {
                await likeAnnouncement({ type: announcementType, id: announcementId }).unwrap();
            } catch {
                setSelectedReaction(prev);
                setCount((c) => c + 1);
            }
        } else {
            setShowPicker((v) => !v);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <Box
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                position: "relative",
                display: "inline-flex",

                "@keyframes reactionLand": {
                    "0%": { opacity: 0, transform: "scale(0.2) translateY(8px) rotate(-20deg)" },
                    "55%": { opacity: 1, transform: "scale(1.4) translateY(-5px) rotate(8deg)" },
                    "75%": { transform: "scale(0.88) translateY(2px) rotate(-3deg)" },
                    "100%": { opacity: 1, transform: "scale(1) translateY(0) rotate(0deg)" },
                },
                "& .reaction-land": {
                    display: "inline-block",
                    animation: "reactionLand 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                },
            }}
        >
            {/* Reaction Picker */}
            {showPicker && (
                <Box
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        left: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "999px",
                        px: 1.25,
                        py: 0.75,
                        boxShadow: 3,
                        zIndex: 10,
                        animation: "pickerSlideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                        "@keyframes pickerSlideUp": {
                            from: { opacity: 0, transform: "translateY(10px) scale(0.85)" },
                            to: { opacity: 1, transform: "translateY(0) scale(1)" },
                        },
                    }}
                >
                    {REACTIONS.map((r, index) => (
                        <Tooltip key={r.emoji} title={r.label} placement="top" arrow>
                            <Box
                                onClick={() => handleReactionClick(r.emoji)}
                                sx={{
                                    fontSize: "1.4rem",
                                    lineHeight: 1,
                                    cursor: "pointer",
                                    p: 0.5,
                                    borderRadius: "50%",
                                    bgcolor: selectedReaction === r.emoji ? "action.selected" : "transparent",

                                    opacity: 0,
                                    animation: "emojiPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                                    animationDelay: `${index * 35}ms`,
                                    "@keyframes emojiPopIn": {
                                        "0%": { opacity: 0, transform: "scale(0.4) translateY(8px)" },
                                        "70%": { opacity: 1, transform: "scale(1.15) translateY(-2px)" },
                                        "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
                                    },

                                    transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s",
                                    "&:hover": {
                                        transform: "scale(1.45) translateY(-5px)",
                                        bgcolor: "action.hover",
                                    },
                                }}
                            >
                                {r.emoji}
                            </Box>
                        </Tooltip>
                    ))}
                </Box>
            )}

            <Button
                startIcon={selectedReaction ? null : <ThumbUp sx={{ fontSize: "18px !important" }} />}
                size="small"
                onClick={handleMainButtonClick}
                sx={{
                    color: selectedReaction ? "primary.main" : "text.secondary",
                    textTransform: "none",
                    px: 1.5,
                    py: 0.75,
                    minWidth: "auto",
                    fontWeight: selectedReaction ? 600 : 400,
                    fontSize: selectedReaction ? "1.1rem" : "inherit",
                    "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                }}
            >
                {selectedReaction ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <span key={selectedReaction} className="reaction-land"
                            style={{ fontSize: "1.1rem", lineHeight: 1 }}>
                            {selectedReaction}
                        </span>
                        <Typography variant="body2">{count}</Typography>
                    </Box>
                ) : (
                    <Typography variant="body2" sx={{ ml: 0.5 }}>{count}</Typography>
                )}
            </Button>
        </Box>
    );
}