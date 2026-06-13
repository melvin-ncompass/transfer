import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Monthly Temperature Precipitation Chart Styles
 * 
 * Extracted sx props for monthly-temperature-precipitation-chart component
 */

export const monthlyTemperaturePrecipitationChartStyles = {
  /**
   * Card container
   */
  card: (hideTitle: boolean): SxProps<Theme> => ({
    py: !hideTitle ? 2 : 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    pl: 2,
  }),

  /**
   * Header stack
   */
  headerStack: {
    width: '100%',
    px: 2,
    pt: 2,
    pb: 1,
  } as SxProps<Theme>,

  /**
   * Title
   */
  title: (isTitleClickable: boolean): SxProps<Theme> => ({
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
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Chart wrapper
   */
  chartWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    margin: 0,
    padding: 0,
  } as SxProps<Theme>,

  /**
   * Chart container
   */
  chartContainer: {
    flex: 1,
    minHeight: 0,
    height: '100%',
    position: 'relative',
    width: '100%',
  } as SxProps<Theme>,
};
