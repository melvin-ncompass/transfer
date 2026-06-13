// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - AUTOCOMPLETE  //

export default function Autocomplete(theme: Theme, borderRadius: number) {
  const palette = theme.palette;

  return {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiAutocomplete-tag': {
            background: palette.secondary.light,
            borderRadius: 4,
            color: palette.text.primary,
            '.MuiChip-deleteIcon': {
              color: palette.secondary.main // fallback if 200 not defined
            }
          }
        },
        popper: {
          borderRadius: `${borderRadius}px`,
          boxShadow:
            '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)'
        }
      }
    }
  };
}
