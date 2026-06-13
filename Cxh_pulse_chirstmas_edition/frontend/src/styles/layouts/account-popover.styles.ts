import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Account Popover Styles
 * 
 * Extracted sx props for account-popover component
 */

export const accountPopoverStyles = {
  /**
   * Icon button
   */
  iconButton: {
    p: '2px',
    width: 40,
    height: 40,
  } as SxProps<Theme>,

  /**
   * Popover paper
   */
  popoverPaper: {
    width: 200,
  } as SxProps<Theme>,

  /**
   * User info container
   */
  userInfoContainer: {
    p: 2,
    pb: 1.5,
  } as SxProps<Theme>,

  /**
   * Divider
   */
  divider: {
    borderStyle: 'none',
  } as SxProps<Theme>,

  /**
   * List subheader
   */
  listSubheader: {
    bgcolor: 'background.paper',
    color: 'text.secondary',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    lineHeight: 2.5,
    pl: 1,
    borderTop: '1px dashed rgba(0,0,0,0.06)',
  } as SxProps<Theme>,

  /**
   * Menu list
   */
  menuList: {
    p: 1,
    gap: 0.5,
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  /**
   * Menu item
   */
  menuItem: (paddingLeft?: string): SxProps<Theme> => ({
    paddingLeft: paddingLeft || 1,
  }),

  /**
   * Divider dashed
   */
  dividerDashed: {
    borderStyle: 'dashed',
  } as SxProps<Theme>,

  /**
   * Logout button container
   */
  logoutContainer: {
    p: 1,
  } as SxProps<Theme>,
};
