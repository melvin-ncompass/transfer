import type { SxProps, Theme } from '@mui/material/styles';

/**
 * User Info Display Styles
 * 
 * Extracted sx props for user-info-display component
 */

export const userInfoDisplayStyles = {
  /**
   * Main container
   */
  container: {
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  /**
   * Name and role container
   */
  nameRoleContainer: {
    display: 'flex',
    alignItems: 'center',
    '@media (max-width: 440px)': {
      justifyContent: 'end',
    },
    gap: { xs: 0, md: 1, lg: 1 },
    flexWrap: 'wrap',
  } as SxProps<Theme>,

  /**
   * Name typography
   */
  name: (nameLength: number): SxProps<Theme> => ({
    fontSize: nameLength > 15 ? '12px' : '',
  }),

  /**
   * Role chip
   */
  roleChip: {
    height: 20,
    fontSize: '0.65rem',
    fontWeight: 500,
  } as SxProps<Theme>,

  /**
   * Email typography
   */
  email: (emailLength: number): SxProps<Theme> => ({
    color: 'text.secondary',
    fontSize: emailLength > 15 ? '11px' : '',
    '@media (max-width: 440px)': {
      textAlign: 'end',
    },
  }),
};
