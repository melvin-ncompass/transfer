import type { SxProps, Theme } from '@mui/material/styles';

/**
 * CXH Nav Mobile Drawer Styles
 * 
 * Extracted sx props for cxh-nav-mobile-drawer component
 */

export const cxhNavMobileDrawerStyles = {
  /**
   * Drawer container
   */
  drawerContainer: {
    width: 200,
    display: 'flex',
    flexDirection: 'column',
    p: 2,
  } as SxProps<Theme>,

  /**
   * Header container
   */
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as SxProps<Theme>,

  /**
   * Close button
   */
  closeButton: {
    p: 0,
    minWidth: '32px',
  } as SxProps<Theme>,

  /**
   * Navigation links container
   */
  navLinksContainer: {
    mt: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  } as SxProps<Theme>,

  /**
   * Nav link box
   */
  navLinkBox: (theme: Theme, isActive: boolean): SxProps<Theme> => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    '& .MuiTypography-root': {
      marginBottom: 0,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:active': {
      backgroundColor: theme.palette.action.selected,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.action.focus,
    },
  }),
};
