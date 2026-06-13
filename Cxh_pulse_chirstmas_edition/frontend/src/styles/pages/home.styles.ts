import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Home Page Styles
 * 
 * Extracted sx props for home page component
 */

export const homePageStyles = {
  /**
   * Loading container
   */
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 2,
  } as SxProps<Theme>,
};

