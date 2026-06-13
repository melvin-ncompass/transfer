import type { SxProps, Theme } from '@mui/material/styles';

/**
 * User Role Display Styles
 * 
 * Extracted sx props for user-role-display component
 */

export const userRoleDisplayStyles = {
  /**
   * Role typography
   */
  role: (roleLength: number): SxProps<Theme> => ({
    color: 'text.secondary',
    fontSize: roleLength > 15 ? '10px' : '',
  }),
};
