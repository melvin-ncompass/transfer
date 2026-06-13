import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Monthly Rainfall Heatmap Styles
 * 
 * Extracted sx props for monthly-rainfall-heatmap component
 */

export const monthlyRainfallHeatmapStyles = {
  /**
   * Card container
   */
  card: {
    p: 3,
    flex: '1 1 48%',
    minWidth: { xs: 350, md: 400 },
  } as SxProps<Theme>,

  /**
   * Title
   */
  title: {
    mb: 2,
  } as SxProps<Theme>,

  /**
   * No data container
   */
  noDataContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 350,
    color: 'text.secondary',
  } as SxProps<Theme>,

  /**
   * Color scale container
   */
  colorScaleContainer: {
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
  } as SxProps<Theme>,

  /**
   * Color scale label
   */
  colorScaleLabel: {
    fontSize: '11px',
  } as SxProps<Theme>,

  /**
   * Color scale bar
   */
  colorScaleBar: (gradientBackground: string): SxProps<Theme> => ({
    flex: 1,
    height: 10,
    borderRadius: 1,
    background: gradientBackground,
  }),
};
