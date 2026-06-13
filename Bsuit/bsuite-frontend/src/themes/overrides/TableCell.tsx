// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - TABLE CELL  //

export default function TableCell(theme: Theme) {
  return {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider,
          borderWidth: 1,
          borderStyle: 'solid',

          '&.MuiTableCell-head': {
            fontSize: '0.875rem',
            color: theme.palette.text.primary,
            fontWeight: 600,
            backgroundColor: theme.palette.grey[100],
            borderColor: theme.palette.divider,
            borderWidth: 1,
            borderStyle: 'solid'
          }
        }
      }
    }
  };
}
