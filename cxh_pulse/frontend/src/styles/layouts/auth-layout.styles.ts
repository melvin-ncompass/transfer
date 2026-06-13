import type { SxProps, Theme, CSSObject, Breakpoint } from '@mui/material/styles';

/**
 * Auth Layout Styles
 * 
 * Extracted sx props for auth-layout component
 */

export const authLayoutStyles = {
  /**
   * Alert component (hidden by default)
   */
  alert: {
    display: 'none',
    borderRadius: 0,
  } as SxProps<Theme>,

  /**
   * Header section
   */
  headerSection: (layoutQuery: Breakpoint): SxProps<Theme> => ({
    position: { [layoutQuery]: 'fixed' },
  }),

  /**
   * Main section
   */
  mainSection: (theme: Theme, layoutQuery: Breakpoint): SxProps<Theme> => ({
    alignItems: 'center',
    justifyContent: { xs: 'center', md: 'flex-start' },
    minWidth: { xs: '100%', md: '350px' },
    p: theme.spacing(3, 2, 10, 2),
    [theme.breakpoints.up(layoutQuery)]: {
      justifyContent: 'center',
      p: theme.spacing(10, 0, 10, 0),
    },
  }),

  /**
   * Background styles
   */
  backgroundStyles: (): CSSObject => ({
    zIndex: 1,
    opacity: 0.24,
    width: '100%',
    height: '100vh',
    content: "''",
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundImage: 'url(/assets/background/overlay.jpg)',
  }),

  /**
   * Layout section container
   */
  layoutSection: (theme: Theme): SxProps<Theme> => ({
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    justifyContent: 'center',
    alignItems: 'center',
    '&::before': authLayoutStyles.backgroundStyles(),
  }),
};
