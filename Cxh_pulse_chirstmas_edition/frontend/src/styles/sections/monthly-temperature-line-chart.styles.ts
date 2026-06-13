import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Monthly Temperature Line Chart Styles
 * 
 * Extracted sx props for monthly-temperature-line-chart component
 */

export const monthlyTemperatureLineChartStyles = {
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
