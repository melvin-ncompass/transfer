// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - CARD HEADER  //

export default function CardHeader(theme: Theme) {
  const palette = theme.palette;

  return {
    MuiCardHeader: {
      styleOverrides: {
        root: {
          color: palette.text.primary, // use primary text color
          padding: '24px'
        },
        title: {
          fontSize: '1.125rem'
        }
      }
    }
  };
}
