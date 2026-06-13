import type { SxProps, Theme } from '@mui/material/styles';

/**
 * CXH Nav Header Styles
 * 
 * Extracted sx props for cxh-nav-header component
 */

export const cxhNavHeaderStyles = {
  /**
   * Nav link box
   */
  navLinkBox: (theme: Theme, isActive: boolean): SxProps<Theme> => ({
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    borderBottom: isActive
      ? `2px solid ${theme.palette.primary.main}`
      : '2px solid transparent',
    paddingBottom: '4px',
    marginBottom: '-2px',
    transition: 'all 0.2s ease',
    '& .MuiTypography-root': {
      marginBottom: 0,
    },
  }),
};
