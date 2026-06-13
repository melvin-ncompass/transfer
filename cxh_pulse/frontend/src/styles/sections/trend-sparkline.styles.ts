import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Trend Sparkline Styles
 * 
 * Extracted sx props for trend-sparkline component
 */

export const trendSparklineStyles = {
  /**
   * Main container
   */
  container: {
    width: '100%',
    height: 60, // Increased from 40 to match chart height
    minHeight: 60, // Fixed minimum height
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0.5,
    minWidth: 0, // Allow flexbox to shrink
    flexWrap: 'nowrap',
  } as SxProps<Theme>,

  /**
   * Value label (first/last)
   */
  valueLabel: {
    minWidth: 'fit-content',
    flexShrink: 0,
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  } as SxProps<Theme>,

  /**
   * Chart container
   */
  chartContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    height: '100%',
    flexShrink: 0,
  } as SxProps<Theme>,
};
