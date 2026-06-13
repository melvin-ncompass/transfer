import type { BoxProps } from '@mui/material/Box';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import { chartClasses } from '../classes';
import { chartLoadingStyles } from '../../../styles/components/chart-loading.styles';

import type { ChartProps } from '../types';

// ----------------------------------------------------------------------

export type ChartLoadingProps = BoxProps & Pick<ChartProps, 'type'>;

export function ChartLoading({ sx, className, type, ...other }: ChartLoadingProps) {
  return (
    <Box
      className={mergeClasses([chartClasses.loading, className])}
      sx={[
        chartLoadingStyles.container,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Skeleton
        variant="circular"
        sx={chartLoadingStyles.skeleton(type)}
      />
    </Box>
  );
}
