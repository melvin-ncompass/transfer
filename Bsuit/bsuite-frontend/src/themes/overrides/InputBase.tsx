// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - INPUT BASE //

export default function InputBase(theme: Theme) {
  return {
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: theme.palette.text.primary, // text.dark → text.primary
          '&::placeholder': {
            color: theme.palette.text.secondary,
            fontSize: '0.875rem'
          }
        }
      }
    }
  };
}
