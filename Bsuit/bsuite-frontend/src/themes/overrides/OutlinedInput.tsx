// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - OUTLINED INPUT //

export default function OutlinedInput(theme: Theme, borderRadius: number) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background:'transparent',
          borderRadius: `${borderRadius}px`,

          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.grey[400]
          },

          '&:hover $notchedOutline': {
            borderColor: theme.palette.primary.light
          },

          '&.MuiInputBase-multiline': {
            padding: 1
          }
        },
        input: {
          fontWeight: 500,
          background:'transparent',
          padding: '15.5px 14px',
          borderRadius: `${borderRadius}px`,

          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 14px',

            '&.MuiInputBase-inputAdornedStart': {
              paddingLeft: 0
            }
          }
        },
        inputAdornedStart: {
          paddingLeft: 4
        },
        notchedOutline: {
          borderRadius: `${borderRadius}px`
        }
      }
    }
  };
}
