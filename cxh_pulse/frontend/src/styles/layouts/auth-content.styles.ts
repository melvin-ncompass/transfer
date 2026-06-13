import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Auth Content Styles
 * 
 * Extracted sx props for auth-content component
 */

export const authContentStyles = {
  /**
   * Main content container
   */
  container: (theme: Theme): SxProps<Theme> => ({
    py: 5,
    px: 3,
    width: 1,
    zIndex: 2,
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'var(--layout-auth-content-width)',
    bgcolor: theme.vars.palette.background.default,
  }),
};
