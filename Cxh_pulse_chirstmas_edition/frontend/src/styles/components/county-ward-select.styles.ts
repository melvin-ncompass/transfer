import type { SxProps, Theme } from '@mui/material/styles';

/**
 * County and Ward Select Styles
 * 
 * Extracted sx props for county-ward-select component
 */

export const countyWardSelectStyles = {
  /**
   * Loading stack container
   */
  loadingStack: (spacing: number): SxProps<Theme> => ({
    flexWrap: 'wrap',
    gap: spacing,
  }),

  /**
   * Loading box container
   */
  loadingBox: (maxWidth: number): SxProps<Theme> => ({
    maxWidth,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  }),

  /**
   * Loading text field
   */
  loadingTextField: {
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Main stack container
   */
  stack: (spacing: number): SxProps<Theme> => ({
    gap: spacing,
  }),

  /**
   * Autocomplete container
   */
  autocomplete: (maxWidth: number): SxProps<Theme> => ({
    minWidth: 200,
    maxWidth,
    width: '100%',
  }),
};
