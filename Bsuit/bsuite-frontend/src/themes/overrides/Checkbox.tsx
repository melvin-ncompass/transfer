import { type Theme } from '@mui/material/styles';

//  OVERRIDES - CHECKBOX  //

export default function Checkbox(theme: Theme) {
  return {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '& + .MuiFormControlLabel-label': {
            marginTop: 2
          },
          '&.Mui-disabled': {
            color: theme.palette.action.disabled,
            '&.Mui-checked': {
              color: theme.palette.primary.light,
            }
          }
        }
      }
    }
  };
}
