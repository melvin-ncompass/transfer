import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Dashboard Layout Styles
 * 
 * Extracted sx props for dashboard-layout component
 */

export const dashboardLayoutStyles = {
  /**
   * Alert component (hidden by default)
   */
  alert: {
    display: 'none',
    borderRadius: 0,
  } as SxProps<Theme>,

  /**
   * Left area container
   */
  leftAreaContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0, sm: 0.75, md: 2, lg: 4 },
  } as SxProps<Theme>,

  /**
   * Menu button
   */
  menuButton: {
    minWidth: 0,
    ml: 0,
    mr: 1,
  } as SxProps<Theme>,

  /**
   * Navigation container
   */
  navContainer: {
    display: 'flex',
    pl: {sm: 1, md: 0},
    gap: { xs: 2, sm: 3, md: 4 },
  } as SxProps<Theme>,

  /**
   * Right area container
   */
  rightAreaContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 1, sm: 1.5 },
  } as SxProps<Theme>,

  /**
   * Layout section container
   */
  layoutSection: (theme: Theme): SxProps<Theme> => ({
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  }),
};
