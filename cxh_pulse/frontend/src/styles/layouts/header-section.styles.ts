import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Header Section Styles
 * 
 * Extracted sx props for header-section component
 */

export const headerSectionStyles = {
  /**
   * Header root with offset styles
   */
  headerRoot: (theme: Theme, isOffset: boolean): SxProps<Theme> => ({
    ...(isOffset && {
      '--color': `var(--offset-color, ${theme.vars.palette.text.primary})`,
    }),
  }),
};
