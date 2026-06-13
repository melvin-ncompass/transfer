import { useEffect, useMemo, useState } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";

/**
 * Brief pause after navigation so tabs/cards mount before scroll + highlight.
 * (Previously 1000ms + 400ms — felt sluggish.)
 */
export const NOTIFICATION_DEEP_LINK_DOM_READY_MS = 150;

/** Solid highlight before blinking (ms). */
export const NOTIFICATION_ROW_HIGHLIGHT_HOLD_MS = 2000;

/** One blink cycle: highlight → normal → normal (ms). */
export const NOTIFICATION_ROW_HIGHLIGHT_BLINK_CYCLE_MS = 1200;

export const NOTIFICATION_ROW_HIGHLIGHT_BLINK_ITERATIONS = 3;

const ROW_HIGHLIGHT_KEYFRAME_NAME = "notificationRowHighlightBlink";

export function getNotificationRowHighlightTotalMs(): number {
  return (
    NOTIFICATION_ROW_HIGHLIGHT_HOLD_MS +
    NOTIFICATION_ROW_HIGHLIGHT_BLINK_ITERATIONS *
      NOTIFICATION_ROW_HIGHLIGHT_BLINK_CYCLE_MS
  );
}

/** Parent should clear highlight target id shortly after the full sequence ends. */
export const NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS =
  getNotificationRowHighlightTotalMs() + 200;

export function getRowHighlightColor(theme: Theme): string {
  return (theme.palette as { rowHighlight?: string }).rowHighlight ?? "#b7f5cc";
}

export function getNotificationRowHighlightBaseBg(
  theme: Theme,
  defaultBackground?: string,
): string {
  return defaultBackground ?? theme.palette.secondary.light;
}

/** Keyframes for the blink phase only (after hold). */
export function buildNotificationRowHighlightBlinkKeyframes(
  theme: Theme,
  options?: { defaultBackground?: string },
): Record<string, object> {
  const rowHighlight = getRowHighlightColor(theme);
  const defaultBg = getNotificationRowHighlightBaseBg(theme, options?.defaultBackground);

  return {
    [`@keyframes ${ROW_HIGHLIGHT_KEYFRAME_NAME}`]: {
      "0%": { backgroundColor: rowHighlight },
      "50%": { backgroundColor: defaultBg },
      "100%": { backgroundColor: defaultBg },
    },
  };
}

export function buildNotificationRowHighlightBlinkAnimationSx(
  theme: Theme,
  options?: { defaultBackground?: string },
): SxProps<Theme> {
  return {
    ...buildNotificationRowHighlightBlinkKeyframes(theme, options),
    animation: `${ROW_HIGHLIGHT_KEYFRAME_NAME} ${NOTIFICATION_ROW_HIGHLIGHT_BLINK_CYCLE_MS}ms ease-in-out ${NOTIFICATION_ROW_HIGHLIGHT_BLINK_ITERATIONS}`,
    animationFillMode: "forwards",
  };
}

type NotificationRowHighlightPhase = "idle" | "hold" | "blink";

/**
 * Notification deep-link row highlight: hold `rowHighlight` for 2s, blink 3×, then idle.
 * Apply `surfaceSx` + `surfaceKey` to the card surface (e.g. MUI Paper).
 */
export function useNotificationRowHighlight(
  highlightPulse: number,
  options?: { defaultBackground?: string },
) {
  const theme = useTheme();
  const [phase, setPhase] = useState<NotificationRowHighlightPhase>("idle");

  const rowHighlight = getRowHighlightColor(theme);
  const defaultBg = getNotificationRowHighlightBaseBg(theme, options?.defaultBackground);

  useEffect(() => {
    if (highlightPulse <= 0) {
      setPhase("idle");
      return;
    }

    setPhase("hold");

    const blinkTimer = window.setTimeout(() => {
      setPhase("blink");
    }, NOTIFICATION_ROW_HIGHLIGHT_HOLD_MS);

    const endTimer = window.setTimeout(() => {
      setPhase("idle");
    }, getNotificationRowHighlightTotalMs());

    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(endTimer);
    };
  }, [highlightPulse]);

  const highlightActive = phase === "hold" || phase === "blink";

  const surfaceSx: SxProps<Theme> = useMemo(() => {
    if (phase === "hold") {
      return {
        backgroundColor: rowHighlight,
        overflow: "visible",
      };
    }

    if (phase === "blink") {
      return {
        overflow: "visible",
        ...buildNotificationRowHighlightBlinkAnimationSx(theme, options),
      };
    }

    return {
      backgroundColor: defaultBg,
      overflow: "hidden",
    };
  }, [phase, theme, rowHighlight, defaultBg, options]);

  const surfaceKey =
    highlightPulse > 0 && highlightActive
      ? `notification-highlight-${highlightPulse}-${phase}`
      : "default";

  return {
    highlightActive,
    surfaceSx,
    surfaceKey,
    phase,
  };
}
