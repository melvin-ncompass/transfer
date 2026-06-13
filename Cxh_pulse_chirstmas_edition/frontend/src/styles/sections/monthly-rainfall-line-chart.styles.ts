import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Monthly Rainfall Line Chart Styles
 * 
 * Extracted sx props for monthly-rainfall-line-chart component
 */

export const monthlyRainfallLineChartStyles = {
  /**
   * Card container
   */
  card: {
    p: 3,
    flex: '1 1 30%',
    minWidth: 300,
  } as SxProps<Theme>,

  /**
   * Title
   */
  title: (isTitleClickable: boolean): SxProps<Theme> => ({
    mb: 2,
    ...(isTitleClickable && {
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'underline',
      },
    }),
  }),

  /**
   * No data container
   */
  noDataContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    color: 'text.secondary',
  } as SxProps<Theme>,
};
