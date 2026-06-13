import { useEffect, useRef, useState, type ReactNode } from "react";
import {
    Box,
    Paper,
    Collapse,
    IconButton,
    useTheme,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";

const HIGHLIGHT_HOLD_MS = 3000;
const HIGHLIGHT_FADE_MS = 1200;

type HighlightPhase = "idle" | "hold" | "fade";

export interface CollapsibleCardV2Props {
    summary: ReactNode;
    details?: ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onToggle?: () => void;
    /** Increment to play notification highlight (hold then fade) on this card. */
    highlightPulse?: number;
}

export function CollapsibleCardV2({
    summary,
    details,
    defaultOpen = false,
    open: controlledOpen,
    onToggle,
    highlightPulse = 0,
}: CollapsibleCardV2Props) {
    const theme = useTheme();
    const rowHighlight =
        (theme.palette as { rowHighlight?: string }).rowHighlight ??
        theme.palette.success.light;
    const defaultBg = theme.palette.secondary.light;

    const [phase, setPhase] = useState<HighlightPhase>("idle");
    const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [internalOpen, setInternalOpen] = useState(defaultOpen);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

    useEffect(() => {
        if (!highlightPulse) return;

        setPhase("hold");

        const holdTimer = setTimeout(() => {
            setPhase("fade");
            fadeTimerRef.current = setTimeout(() => {
                setPhase("idle");
                fadeTimerRef.current = null;
            }, HIGHLIGHT_FADE_MS);
        }, HIGHLIGHT_HOLD_MS);

        return () => {
            clearTimeout(holdTimer);
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        };
    }, [highlightPulse]);

    const backgroundColor = phase === "hold" ? rowHighlight : defaultBg;

    return (
        <Paper
            elevation={0}
            onClick={toggle}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                backgroundColor,
                transition:
                    phase === "fade"
                        ? `background-color ${HIGHLIGHT_FADE_MS}ms ease-in-out`
                        : "none",
                overflow: "hidden",
                cursor: "pointer",
                mb: 1,
            }}
        >
            {/* Summary */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <IconButton
                    size="small"
                    sx={{ cursor: "pointer", mr: 1 }}
                    onClick={(e) => { toggle(); e.stopPropagation(); }}
                >
                    {open ? (
                        <KeyboardArrowUpRoundedIcon />
                    ) : (
                        <KeyboardArrowDownRoundedIcon />
                    )}
                </IconButton>

                <Box flex={1}>
                    {summary}

                    <Collapse in={open}>
                        <Box mt={2}>
                            {details}
                        </Box>
                    </Collapse>
                </Box>
            </Box>
        </Paper>
    );
}
