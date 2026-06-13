import { Badge } from "@mui/material";
import type { ReactElement } from "react";
import { PrimaryIconButton } from "../../../../../components/atom/button";

export const POI_ICON_BADGE_SX = {
  "& .MuiBadge-badge": {
    fontSize: "0.65rem",
    height: 16,
    minWidth: 16,
    fontWeight: 600,
  },
} as const;

export function renderPoiCountIconButton(
  count: number,
  titleBase: string,
  icon: ReactElement,
  onClick: () => void,
  disabled = false,
) {
  const button = (
    <PrimaryIconButton
      variant="outlined"
      icon={icon}
      title={count > 0 ? `${titleBase} (${count})` : titleBase}
      onClick={onClick}
      disabled={disabled}
    />
  );

  if (count <= 0) return button;

  return (
    <Badge badgeContent={count} color="primary" sx={POI_ICON_BADGE_SX}>
      {button}
    </Badge>
  );
}
