import { IconButton, useTheme } from "@mui/material";
import { Replay } from "@mui/icons-material";
import type { IconButtonProps } from "@mui/material/IconButton";
import { cloneElement, type ReactElement } from "react";
import { Tooltip } from "../tooltip";

export type PrimaryIconButtonColor =
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

export interface PrimaryIconButtonProps extends Omit<IconButtonProps, "color"> {
  /** Icon to show. Defaults to Replay (reset). */
  icon?: ReactElement;
  /** Tooltip title (e.g. "Reset filters"). Uses atom Tooltip when set. */
  title?: string;
  /** Button color variant. Defaults to "primary". */
  color?: PrimaryIconButtonColor;
  /** Visual variant: contained or outlined. */
  variant?: "contained" | "outlined";
}

export function PrimaryIconButton({
  icon,
  title,
  color = "primary",
  variant = "contained",
  disabled,
  sx,
  ...props
}: PrimaryIconButtonProps) {
  const theme = useTheme();

  const palette = theme.palette[color];
  const isOutlined = variant === "outlined";

  const bgMain = !isOutlined ? palette.main : "transparent";
  const bgHover = !isOutlined
    ? palette.dark
    : theme.palette.secondary.light;
  const iconColor = isOutlined ? palette.main : palette.contrastText;

  const defaultSx = {
    width: { xs: 40, md: 35 },
    height: { xs: 40, md: 35 },
    backgroundColor: bgMain,
    color: iconColor,
    border: "none",
    "&:hover": {
      backgroundColor: bgHover,
    },
    ...sx,
  };

  const iconElement = icon ? (
    cloneElement(icon, {
      sx: { color: "inherit", ...(icon.props as { sx?: object })?.sx },
    } as Record<string, unknown>)
  ) : (
    <Replay sx={{ width: 20, color: "inherit" }} />
  );

  const button = (
    <IconButton disabled={disabled} sx={defaultSx} {...props}>
      {iconElement}
    </IconButton>
  );

  if (title) {
    return (
      <Tooltip title={title}>
        <span style={{ display: "inline-flex" }}>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
