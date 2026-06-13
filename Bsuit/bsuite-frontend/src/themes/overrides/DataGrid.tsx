// material-ui
import type { Theme } from '@mui/material/styles';

// OVERRIDES - DATA GRID //

export default function DataGrid(theme: Theme) {
  const palette = theme.palette;

  return {
    MuiDataGrid: {
      defaultProps: {
        rowHeight: 54
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          '& .MuiDataGrid-columnHeader--filledGroup': {
            borderBottomWidth: 0
          },

          '& .MuiDataGrid-columnHeader--emptyGroup': {
            borderBottomWidth: 0
          },

          '& .MuiFormControl-root > .MuiInputBase-root': {
            backgroundColor: `${palette.background.default} !important`,
            borderColor: `${palette.divider} !important`
          }
        },
        withBorderColor: {
          borderColor: palette.divider
        },
        toolbarContainer: {
          '& .MuiButton-root': {
            paddingLeft: '16px !important',
            paddingRight: '16px !important'
          }
        },
        columnHeader: {
          color: palette.text.secondary,
          paddingLeft: 24,
          paddingRight: 24
        },
        footerContainer: {
          '&.MuiDataGrid-withBorderColor': {
            borderBottom: 'none'
          }
        },
        columnHeaderCheckbox: {
          paddingLeft: 0,
          paddingRight: 0
        },
        cellCheckbox: {
          paddingLeft: 0,
          paddingRight: 0
        },
        cell: {
          borderWidth: 1,
          paddingLeft: 24,
          paddingRight: 24,
          borderColor: palette.divider,

          '&.MuiDataGrid-cell--withRenderer > div': {
            ' > .high': {
              background: palette.success.light
            },
            '& > .medium': {
              background: palette.warning.light
            },
            '& > .low': {
              background: palette.error.light
            }
          }
        }
      }
    }
  };
}
