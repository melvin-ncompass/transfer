// src/components/atom/ChipDualIcon.tsx
import {
  Chip as MUIChip,
  Box,
  Tooltip,
  Avatar,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import type { ChipDualIconProps } from "../../../types/types";

export function ChipDualIcon({
  label,
  color = "secondary",
  size = "small",
  onClick,
  onDelete,
  sx,
}: ChipDualIconProps & { onDelete?: () => void }) {
  const theme = useTheme();
  const palette = theme.palette[color as keyof typeof theme.palette] as any;

  const labelText = typeof label === "string" ? label.trim() : "";
  const firstLetter = labelText.charAt(0).toUpperCase();

  /* === EXACT CHARACTER CONTROL === */
  const MAX_VISIBLE_LETTERS = 5;
  const displayLabel =
    labelText.length > MAX_VISIBLE_LETTERS
      ? `${labelText.slice(0, MAX_VISIBLE_LETTERS)}…`
      : labelText;

  return (
    <Tooltip title={labelText} arrow disableInteractive>
      <MUIChip
        clickable={!!onClick}
        onClick={onClick}
        size={size}
        label={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.4, // tighter spacing
            }}
          >
            {/* Avatar */}
            <Avatar
              sx={{
                width: 20,          // slightly smaller
                height: 20,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: palette.main,
                color: palette.contrastText,
                flexShrink: 0,
              }}
            >
              {firstLetter}
            </Avatar>

            {/* TEXT — EXACTLY 5 CHARACTERS */}
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 500,
                lineHeight: "16px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: "5ch",
                maxWidth: "5ch",
                flexShrink: 0,
              }}
            >
              {displayLabel}
            </Box>

            {/* Delete icon */}
            {onDelete && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                sx={{
                  p: 0.2,           // less padding
                  width: 18,        // smaller button
                  height: 18,
                  flexShrink: 0,
                  color: palette.dark,
                  "&:hover": {
                    color: "error.main",
                    backgroundColor: "rgba(0,0,0,0.06)",
                  },
                }}
              >
                <ClearIcon sx={{ fontSize: 14 }} /> {/* smaller icon */}
              </IconButton>
            )}
          </Box>
        }
        sx={{
          height: 36,              
          px: 0.5,                 
          borderRadius: 999,
          backgroundColor: palette.light,
          color: palette.dark,
          boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            border: `0.5px solid ${palette.main}`,
          },
          ...sx,
        }}
      />
    </Tooltip>
  );
}
