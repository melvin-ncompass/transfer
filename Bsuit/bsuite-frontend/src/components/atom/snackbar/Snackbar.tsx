import { Alert, type AlertColor, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import type { SnackbarProps } from "../../../types/types";
import { useEffect, useRef, useState } from "react";

export function Snackbar({
  message,
  color = "info",
  autoClose,
  sx,
  onClose,
  positionFixed = true,
}: SnackbarProps) {
  const messageText = Array.isArray(message) ? message.join(" ") : message;
  const length = messageText?.length || 0;

  const calculatedDuration = Math.max(3000, Math.min(10000, length * 100));
  const finalAutoClose = autoClose !== undefined ? autoClose : calculatedDuration;

  const messageKey = Array.isArray(message) ? message.join("") : message;

  const theme = useTheme();
  const paletteColor = theme.palette[color];

  // Timer state
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(typeof finalAutoClose === "number" ? finalAutoClose : 3000);

  // Stable ref for onClose — consumers don't need to memoize their callback
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const [isHovered, setIsHovered] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (duration: number) => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onCloseRef.current?.();
    }, duration);
  };

  useEffect(() => {
    if (!finalAutoClose) return;

    startTimer(remainingTimeRef.current);

    return () => clearTimer();
  // onClose intentionally excluded — onCloseRef always has the latest value
  // without causing the timer to restart on every render
  }, [finalAutoClose, messageKey]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timerRef.current) {
      clearTimer();
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (remainingTimeRef.current > 0) {
      startTimer(remainingTimeRef.current);
    }
  };

  return (
    <Alert
      severity={color as AlertColor}
      sx={{
        backgroundColor: paletteColor.light,
        color: paletteColor.dark,
        borderRadius: 2,
        fontWeight: 500,
        position: positionFixed ? "fixed" : "relative",
        overflow: "hidden",
        ...(positionFixed && {
          top: 20,
          right: 20,
          zIndex: 10000,
        }),
        "& .MuiAlert-icon": {
          color: paletteColor.dark,
        },
        ...sx,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      action={
        <IconButton aria-label="close" color="inherit" size="small" onClick={onClose}>
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
    >
      {Array.isArray(message) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {message.map((msg, idx) => (
            <span key={idx}>{msg}</span>
          ))}
        </div>
      ) : (
        message
      )}

      <style>
        {`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>

      {!!finalAutoClose && (
        <Box
          key={messageKey + "_" + finalAutoClose}
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "4px",
            backgroundColor: paletteColor.dark,
            opacity: 0.4,
            width: "100%",
            animation: `shrink ${typeof finalAutoClose === "number" ? finalAutoClose : 3000}ms linear forwards`,
            animationPlayState: isHovered ? "paused" : "running",
          }}
        />
      )}
    </Alert>
  );
}