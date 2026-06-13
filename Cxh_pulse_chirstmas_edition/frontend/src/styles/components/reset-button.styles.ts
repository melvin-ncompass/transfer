import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Reset Button Styles
 * 
 * Extracted sx props for reset-button component
 */

export const resetButtonStyles = {
  /**
   * Reset button container
   */
  button: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 999, // Lower than sticky filter (1000)
    backgroundColor: 'background.paper',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  } as SxProps<Theme>,
};
