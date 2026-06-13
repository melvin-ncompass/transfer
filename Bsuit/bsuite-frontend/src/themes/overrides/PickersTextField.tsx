
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - PICKERS TEXT FIELD  //

export default function PickersTextField(theme: Theme, borderRadius: number, outlinedFilled: boolean) {
  return {
    MuiPickersTextField: {
      styleOverrides: {
        root: {
          borderRadius: `${borderRadius}px`,
          '& .MuiPickersOutlinedInput-root': {
            borderRadius: `${borderRadius}px`
          },
          background: outlinedFilled ? theme.palette.grey[50] : 'transparent',
          '& .MuiPickersInputBase-sectionsContainer': {
            fontWeight: 500
          },

          ...theme.applyStyles('dark', {
            background: outlinedFilled ? theme.palette.grey[800] : 'transparent'
          })
        }
      }
    }
  };
}
