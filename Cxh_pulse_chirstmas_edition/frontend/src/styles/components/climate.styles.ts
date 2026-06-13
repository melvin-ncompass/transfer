import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Climate Component Styles
 * 
 * Extracted sx props for climate components
 */

export const climateStyles = {
  /**
   * Climate charts container
   */
  container: {
    p: 3,
  } as SxProps<Theme>,

  /**
   * Loading container
   */
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  } as SxProps<Theme>,

  /**
   * Charts row container
   */
  chartsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  } as SxProps<Theme>,

  /**
   * Heatmaps container
   */
  heatmapsContainer: {
    display: 'flex',
    gap: 3,
    flexWrap: 'wrap',
  } as SxProps<Theme>,

  /**
   * Line charts container
   */
  lineChartsContainer: {
    display: 'flex',
    gap: 3,
    flexWrap: 'wrap',
  } as SxProps<Theme>,
};

