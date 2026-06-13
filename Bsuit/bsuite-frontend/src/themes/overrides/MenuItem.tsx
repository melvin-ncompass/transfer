// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - MENU ITEM  //

export default function MenuItem(theme: Theme) {
  return {
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          '& .MuiListItemIcon-root': {
            color: theme.palette.text.secondary,
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.primary.main,
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main,
            },
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
            color: theme.palette.primary.main,
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main,
            },
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            },
          },
        },
      },
    },
  };
}
