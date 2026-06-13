
import type { Theme } from '@mui/material';

//  OVERRIDES - TOOLTIP //

export default function Tooltip(theme: Theme) {
  return {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          margin: 0,
          lineHeight: 1.4,
          color: theme.palette.background.paper,
          background: theme.palette.text.primary
        }
      }
    }
  };
}
