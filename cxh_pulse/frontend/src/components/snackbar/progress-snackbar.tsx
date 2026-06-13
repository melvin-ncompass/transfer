import { useEffect, useState, useMemo } from 'react';
import { Snackbar, Alert, Box, keyframes } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

// Animation for the growing progress bar
const growProgress = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

export interface ProgressSnackbarProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  /** Custom duration in ms. If not provided, calculated from message length */
  duration?: number;
  /** Anchor origin for the snackbar */
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

/**
 * Calculate auto-hide duration based on message word count
 * Base: 2000ms + 350ms per word
 * Min: 2500ms, Max: 8000ms
 */
function calculateDuration(message: string): number {
  const wordCount = message.trim().split(/\s+/).length;
  const calculated = 2000 + wordCount * 350;
  return Math.min(Math.max(calculated, 2500), 8000);
}

/**
 * Get color based on severity
 */
function getSeverityColor(severity: 'success' | 'error' | 'info' | 'warning', theme: any): string {
  const colorMap = {
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    warning: theme.palette.warning.main,
  };
  return colorMap[severity] || colorMap.success;
}

export function ProgressSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
  duration,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
}: ProgressSnackbarProps) {
  const theme = useTheme();
  const [animationKey, setAnimationKey] = useState(0);

  // Calculate duration based on message length or use provided duration
  const autoHideDuration = useMemo(
    () => duration ?? calculateDuration(message),
    [duration, message]
  );

  // Reset animation when snackbar opens with new message
  useEffect(() => {
    if (open) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [open, message]);

  const progressColor = getSeverityColor(severity, theme);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          pb: 1.5, // Extra padding at bottom for progress bar
        }}
      >
        {message}
        
        {/* Progress bar container */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: alpha(progressColor, 0.2),
          }}
        >
          {/* Growing progress bar */}
          <Box
            key={animationKey}
            sx={{
              height: '100%',
              backgroundColor: progressColor,
              animation: open
                ? `${growProgress} ${autoHideDuration}ms linear forwards`
                : 'none',
            }}
          />
        </Box>
      </Alert>
    </Snackbar>
  );
}

