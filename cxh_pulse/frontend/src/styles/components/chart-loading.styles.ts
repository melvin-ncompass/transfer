import type { SxProps, Theme } from '@mui/material/styles';
import type { ChartProps } from '../../components/chart/types';

/**
 * Chart Loading Styles
 * 
 * Extracted sx props for chart-loading component
 */

export const chartLoadingStyles = {
  /**
   * Loading container
   */
  container: {
    top: 0,
    left: 0,
    width: 1,
    zIndex: 9,
    height: 1,
    p: 'inherit',
    overflow: 'hidden',
    alignItems: 'center',
    position: 'absolute',
    borderRadius: 'inherit',
    justifyContent: 'center',
  } as SxProps<Theme>,

  /**
   * Skeleton variant
   */
  skeleton: (type: ChartProps['type']): SxProps<Theme> => {
    const circularTypes: ChartProps['type'][] = ['donut', 'radialBar', 'pie', 'polarArea'];
    return {
      width: 1,
      height: 1,
      borderRadius: 'inherit',
      ...(circularTypes.includes(type) && { borderRadius: '50%' }),
    };
  },
};
