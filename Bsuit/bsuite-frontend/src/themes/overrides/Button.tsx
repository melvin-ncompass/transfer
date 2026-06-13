// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - SLIDER  //

export default function Slider(theme: Theme) {
  const palette = theme.palette;

  return {
    MuiSlider: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: palette.grey[500] // fallback for disabled color
          }
        },
        mark: {
          backgroundColor: palette.background.paper,
          width: '4px'
        },
        valueLabel: {
          color: palette.primary.light
        }
      }
    }
  };
}
