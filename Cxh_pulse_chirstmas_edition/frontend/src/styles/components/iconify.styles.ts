import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Iconify Styles
 * 
 * Extracted sx props for iconify component
 */

export const iconifyStyles = {
  /**
   * Base icon styles
   */
  root: (width: number, height?: number): SxProps<Theme> => ({
    width,
    flexShrink: 0,
    height: height ?? width,
    display: 'inline-flex',
  }),
};
