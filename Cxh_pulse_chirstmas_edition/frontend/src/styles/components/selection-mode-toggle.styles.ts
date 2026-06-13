import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Selection Mode Toggle Styles
 * 
 * Extracted sx props for selection-mode-toggle component
 */

export const selectionModeToggleStyles = {
  /**
   * Paper container
   */
  paper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 999, // Lower than sticky filter (1000)
    p: 1,
    backgroundColor: 'background.paper',
    boxShadow: 2,
  } as SxProps<Theme>,

  /**
   * Toggle button text
   */
  toggleText: {
    px: 1,
  } as SxProps<Theme>,
};
