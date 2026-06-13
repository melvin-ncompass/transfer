// src/components/atom/BadgeElement.tsx
import { Chip as MUIChip, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from '@mui/icons-material/Delete';
import type { ChipProps } from "../../../types/types";
import { Clear } from "@mui/icons-material";
export function Chip({
  label,
  color = "primary",
  icon,
  onClick,
  onDelete,
  size ='small',
  variant = 'default',
  sx,
}: ChipProps) {
  const theme = useTheme();
  const paletteColor = theme.palette[color] || theme.palette.primary;
  const bgColor = paletteColor.light;
  const textColor = paletteColor.dark
  const isCountVariant = variant === 'count';

  const getHeight = () => {
    if (size === 'xs') return 20;
    if (size === 'small') return 28;
    return 36;
  };
  const getWidth = () => {
    if (isCountVariant) {
      if (size === 'xs') return 20;
      if (size === 'small') return 28;
      return 36;
    }
    return 'auto';
  };
  const getFontSize = () => {
    if (size === 'xs') return '0.75rem';
    if (size === 'small') return '0.875rem';
    return '1rem';
  };
  return (
    <MUIChip
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {icon && <Box sx={{ display: "flex", color: textColor }}>{icon}</Box>}
          <span>{label}</span>
        </Box>
      }
      size={size === 'xs' ? 'small' : size} // MUI doesn't have xs, so use small and override
      onClick={onClick}
      onDelete={onDelete}
      deleteIcon={onDelete ? <Clear /> : undefined}
      sx={{
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: isCountVariant ? '50%' : 999, // circle for count, pill for default
        fontWeight: 500,
        fontSize: getFontSize(),
        height: getHeight(),
        width: getWidth(),
        px: isCountVariant ? 0 : (size === 'xs' ? 0.5 : size === 'small' ? 0.5 : 1), // tighter padding
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        "& .MuiChip-deleteIcon": {
          color: textColor, // delete icon color
        },
        ...sx,
      }}
    />
  );
}