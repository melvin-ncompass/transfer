// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - INTERNAL DATE TIME PICKER TABS  //

export default function InternalDateTimePickerTabs(theme: Theme) {
  return {
    MuiInternalDateTimePickerTabs: {
      styleOverrides: {
        tabs: {
          backgroundColor: theme.palette.primary.light,

          '& .MuiTabs-flexContainer': {
            borderColor: theme.palette.primary.light
          },

          '& .MuiTab-root': {
            color: theme.palette.grey[900]
          },

          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.dark
          },

          '& .Mui-selected': {
            color: theme.palette.primary.dark
          }
        }
      }
    }
  };
}
