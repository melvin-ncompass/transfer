import { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Slide,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { formatDateTimeShort } from "../../../../utils/numberFormatter";
import type { NormalizedNotification } from "./notification.types";

const DEFAULT_AUTO_CLOSE_MS = 8000;
const MIN_AUTO_CLOSE_MS = 5000;
const MAX_AUTO_CLOSE_MS = 12000;

function getAutoCloseMs(message: string, override?: number): number {
  if (override != null) return override;
  const length = message.length;
  return Math.max(MIN_AUTO_CLOSE_MS, Math.min(MAX_AUTO_CLOSE_MS, length * 80 + 4000));
}

export type NotificationPopupCardProps = {
  notification: NormalizedNotification;
  open: boolean;
  onClose: () => void;
  /** When set, the card is clickable and shows a view affordance */
  onOpen?: (notification: NormalizedNotification) => void;
  autoCloseMs?: number;
};

export function NotificationPopupCard({
  notification,
  open,
  onClose,
  onOpen,
  autoCloseMs,
}: NotificationPopupCardProps) {
  const theme = useTheme();
  const canOpen = typeof onOpen === "function";
  const duration = getAutoCloseMs(notification.title, autoCloseMs);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const remainingTimeRef = useRef(duration);
  const [isHovered, setIsHovered] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (ms: number) => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, ms);
  };

  useEffect(() => {
    if (!open) {
      clearTimer();
      return;
    }

    remainingTimeRef.current = duration;
    startTimer(duration);

    return () => clearTimer();
  }, [open, notification.id, duration]);

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

  const handleCardClick = () => {
    if (!canOpen) return;
    onOpen(notification);
    onClose();
  };

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        role={canOpen ? "button" : "status"}
        aria-live="polite"
        onClick={canOpen ? handleCardClick : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 10001,
          width: { xs: "calc(100vw - 32px)", sm: 380 },
          maxWidth: 380,
          overflow: "hidden",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          borderLeftWidth: 4,
          borderLeftColor: "primary.main",
          cursor: canOpen ? "pointer" : "default",
          transition: theme.transitions.create(["box-shadow", "transform"]),
          "&:hover": canOpen
            ? {
                boxShadow: theme.shadows[12],
                transform: "translateY(-2px)",
              }
            : undefined,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            px: 2,
            py: 1.75,
            pr: 1,
          }}
        >
          <Box
            sx={{
              mt: 0.25,
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              bgcolor: "primary.light",
              color: "primary.dark",
            }}
          >
            <NotificationsActiveOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.25, fontWeight: 600 }}
            >
              New notification
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {notification.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {formatDateTimeShort(notification.timestamp)}
            </Typography>
            {canOpen ? (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 1,
                  color: "primary.main",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  View details
                </Typography>
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Box>
            ) : null}
          </Box>

          <IconButton
            size="small"
            aria-label="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            sx={{ flexShrink: 0, mt: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            height: 3,
            width: "100%",
            bgcolor: "primary.light",
            "&::after": {
              content: '""',
              display: "block",
              height: "100%",
              width: "100%",
              bgcolor: "primary.main",
              transformOrigin: "left",
              animation: `notificationPopupShrink ${duration}ms linear forwards`,
              animationPlayState: isHovered ? "paused" : "running",
            },
            "@keyframes notificationPopupShrink": {
              from: { transform: "scaleX(1)" },
              to: { transform: "scaleX(0)" },
            },
          }}
        />
      </Paper>
    </Slide>
  );
}
