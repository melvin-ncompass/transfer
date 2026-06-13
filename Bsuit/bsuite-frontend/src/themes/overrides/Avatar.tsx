// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - AVATAR  //

export default function Avatar(theme: Theme) {
  const palette = theme.palette;

  return {
    MuiAvatar: {
      styleOverrides: {
        root: {
          // Use standard palette colors
          color: palette.primary.dark,
          backgroundColor: palette.primary.light
        }
      }
    }
  };
}
