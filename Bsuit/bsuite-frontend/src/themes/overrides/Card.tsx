// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - CARD //

export default function Card(theme: Theme) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${theme.palette.divider}`,
          // backgroundColor: theme.palette.secondary.light,
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: 'none'
        }
      }
    }
  };
}
