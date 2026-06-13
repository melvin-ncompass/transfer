// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - LIST ITEM ICON  //

export default function ListItemIcon(theme: Theme) {
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          minWidth: '36px'
        }
      }
    }
  };
}
