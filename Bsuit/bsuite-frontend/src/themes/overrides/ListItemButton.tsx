// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - LIST ITEM BUTTON  //

export default function ListItemButton(theme: Theme) {
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          paddingTop: '10px',
          paddingBottom: '10px',

          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.action.selected,
            '&:hover': {
              backgroundColor: theme.palette.action.selected
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          },

          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.primary.main,
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          }
        }
      }
    }
  };
}
