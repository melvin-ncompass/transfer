// src/components/atom/BadgeElement.tsx
import { Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { BadgeProps } from "../../../types/types";

export function Label({ label, color = "primary", icon, sx, size="small" }: BadgeProps) {
  const theme = useTheme();

  const paletteColor = theme.palette[color] || theme.palette.primary;

  const bgColor = paletteColor.light;
  const textColor = paletteColor.dark || "#000";

  return (
    <Chip
      label={label}
      size={size}
      icon={icon}
      sx={{
        backgroundColor: bgColor,
        color: textColor,
        "& .MuiChip-icon":{
            color: textColor
        },
        borderRadius: 2,
        fontWeight: 500,
        height: 24,
        px: 1.5,
        ...sx,
      }}
    />
  );
}
