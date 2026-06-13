import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Reset Button Styles
 * 
 * Extracted sx props for reset-button component
 */

export const resetButtonStyles = {
  /**
   * Reset button - positioned via parent container
   */
  button: {
    backgroundColor: 'background.paper',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  } as SxProps<Theme>,
};
