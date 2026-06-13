import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Error Section Styles
 * 
 * Extracted sx props for error section components
 */

export const errorSectionStyles = {
  /**
   * Logo fixed position
   */
  logoFixed: {
    position: 'fixed',
    top: 20,
    left: 20,
  } as SxProps<Theme>,

  /**
   * Error container
   */
  errorContainer: {
    py: 10,
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  } as SxProps<Theme>,

  /**
   * Error title
   */
  errorTitle: {
    mb: 2,
  } as SxProps<Theme>,

  /**
   * Error description
   */
  errorDescription: {
    color: 'text.secondary',
    maxWidth: 480,
    textAlign: 'center',
  } as SxProps<Theme>,

  /**
   * Error illustration
   */
  errorIllustration: {
    width: 320,
    height: 'auto',
    my: { xs: 5, sm: 10 },
  } as SxProps<Theme>,

  /**
   * Error actions container
   */
  errorActions: {
    display: 'flex',
    gap: 2,
  } as SxProps<Theme>,
};

