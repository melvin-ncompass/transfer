import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Map Download Button Styles
 */
export const mapDownloadButtonStyles = {
  /**
   * Download button - positioned via parent container
   */
  button: {
    backgroundColor: 'background.paper',
    boxShadow: 2,
    '&:hover': {
      backgroundColor: 'action.hover',
      boxShadow: 3,
    },
  } as SxProps<Theme>,

  /**
   * Menu paper styling
   */
  menuPaper: {
    minWidth: 200,
    mt: 1,
  } as SxProps<Theme>,
};

