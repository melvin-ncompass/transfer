import { Box, Tooltip as MUITooltip, type TooltipProps as MUITooltipProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";

export interface TooltipProps extends Omit<MUITooltipProps, "children"> {
  children: ReactNode;
  title: string | ReactNode;
  placement?:
    | "bottom-end"
    | "bottom-start"
    | "bottom"
    | "left-end"
    | "left-start"
    | "left"
    | "right-end"
    | "right-start"
    | "right"
    | "top-end"
    | "top-start"
    | "top";
  variant?: "dark" | "light" | "primary" | "info" | "success" | "warning" | "error";
  arrow?: boolean;
  enterDelay?: number;
  leaveDelay?: number;
  maxWidth?: string | number;
  sx?: SxProps<Theme>;
  tooltipSx?: SxProps<Theme>;
}

export function Tooltip({
  children,
  title,
  placement = "top",
  variant = "dark",
  arrow = true,
  enterDelay = 200,
  leaveDelay = 0,
  maxWidth = 220,
  sx,
  tooltipSx,
  slotProps: userSlotProps,
  ...props
}: TooltipProps) {
  const theme = useTheme();

  const getTooltipStyles = () => {
    let bgColor = theme.palette.common.black;
    let textColor = theme.palette.common.white;

    switch (variant) {
      case "light":
        bgColor = theme.palette.grey[100];
        textColor = theme.palette.text.primary;
        break;
      case "primary":
        bgColor = theme.palette.primary.light;
        textColor = theme.palette.primary.dark;
        break;
      case "info":
        bgColor = theme.palette.info.light;
        textColor = theme.palette.info.dark;
        break;
      case "success":
        bgColor = theme.palette.success.light;
        textColor = theme.palette.success.dark;
        break;
      case "warning":
        bgColor = theme.palette.warning.light;
        textColor = theme.palette.warning.dark;
        break;
      case "error":
        bgColor = theme.palette.error.light;
        textColor = theme.palette.error.dark;
        break;
      case "dark":
      default:
        bgColor = theme.palette.common.black;
        textColor = theme.palette.common.white;
    }

    return {
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: "6px",
      padding: theme.spacing(0.75, 1.25),
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.5,
      boxShadow: theme.shadows[8],
      ...tooltipSx,
    };
  };

  const popperSx = {
    "& .MuiTooltip-tooltip": getTooltipStyles() as any,
    "& .MuiTooltip-arrow": {
      color:
        variant === "light"
          ? theme.palette.grey[100]
          : variant === "info"
            ? theme.palette.info.main
            : variant === "success"
              ? theme.palette.success.main
              : variant === "warning"
                ? theme.palette.warning.main
                : variant === "error"
                  ? theme.palette.error.main
                  : theme.palette.common.black,
    } as any,
    ...(typeof userSlotProps?.popper === "object" &&
    userSlotProps.popper !== null &&
    "sx" in userSlotProps.popper &&
    userSlotProps.popper.sx
      ? userSlotProps.popper.sx
      : {}),
  };

  return (
    <MUITooltip
      title={title}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      slotProps={{
        ...userSlotProps,
        popper: {
          ...userSlotProps?.popper,
          sx: popperSx,
        },
        tooltip: {
          ...userSlotProps?.tooltip,
          sx: {
            maxWidth,
            wordWrap: "break-word",
            ...(typeof userSlotProps?.tooltip === "object" &&
            userSlotProps.tooltip !== null &&
            "sx" in userSlotProps.tooltip &&
            userSlotProps.tooltip.sx
              ? userSlotProps.tooltip.sx
              : {}),
          },
        },
      }}
      {...props}
      sx={sx}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          lineHeight: "normal",
          maxWidth: "100%",
        }}
      >
        {children}
      </Box>
    </MUITooltip>
  );
}
