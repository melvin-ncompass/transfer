import type { ReactNode } from "react";
import { Typography, Box } from "@mui/material";

interface InfoFieldProps {
    label: string;
    value: string;
    multiline?: boolean;
    /** Renders on the same row as the label (e.g. icon button). */
    labelAction?: ReactNode;
}

/** Single field: bold uppercase label stacked above its value. */
function InfoField({ label, value, multiline, labelAction }: InfoFieldProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: labelAction ? 0.5 : 0,
                    flexWrap: "wrap",
                    minWidth: 0,
                }}
            >
                <Typography
                    variant="caption"
                    component="span"
                    sx={{
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "text.primary",
                        lineHeight: 1.2,
                    }}
                >
                    {label}
                </Typography>
                {labelAction ? (
                    <Box sx={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
                        {labelAction}
                    </Box>
                ) : null}
            </Box>
            <Typography
                variant="body2"
                sx={{
                    color: "text.secondary",
                    fontSize: "0.875rem",
                    whiteSpace: multiline ? "pre-line" : undefined,
                }}
            >
                {value || "—"}
            </Typography>
        </Box>
    );
}

interface InfoRowProps {
    label: string;
    value: string;
    multiline?: boolean;
    labelAction?: ReactNode;
}

/**
 * Shared label-value field used across all profile section cards.
 * Renders as a stacked label-above-value block matching the card grid layout.
 */
export function InfoRow({ label, value, multiline, labelAction }: InfoRowProps) {
    return (
        <InfoField
            label={label}
            value={value}
            multiline={multiline}
            labelAction={labelAction}
        />
    );
}