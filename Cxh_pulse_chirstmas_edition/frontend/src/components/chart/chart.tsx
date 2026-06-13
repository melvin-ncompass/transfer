import { lazy, Suspense } from 'react';
import { useIsClient } from 'minimal-shared/hooks';
import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { chartClasses } from './classes';
import { ChartLoading } from './components';

import type { ChartProps } from './types';

// ----------------------------------------------------------------------

const LazyChart = lazy(() =>
  import('react-apexcharts').then((module) => ({ default: module.default }))
);

export function Chart({ type, series, options, slotProps, className, sx, ...other }: ChartProps) {
  const isClient = useIsClient();

  const renderFallback = () => <ChartLoading type={type} sx={slotProps?.loading} />;

  return (
    <ChartRoot
      dir="ltr"
      className={mergeClasses([chartClasses.root, className])}
      sx={sx}
      {...other}
    >
      {isClient ? (
        <Suspense fallback={renderFallback()}>
          <LazyChart type={type} series={series} options={options} width={options?.chart?.width || "100%"} height={options?.chart?.height || "100%"} />
        </Suspense>
      ) : (
        renderFallback()
      )}
    </ChartRoot>
  );
}

// ----------------------------------------------------------------------

const ChartRoot = styled('div')(({ theme }) => ({
  width: '100%',
  flexShrink: 0,
  position: 'relative',
  borderRadius: (() => {
    const br = theme.shape.borderRadius ?? 0;
    if (typeof br === 'number') return br * 1.5;
    const brStr = String(br);
    if (brStr.endsWith('px')) return `${parseFloat(brStr) * 1.5}px`;
    return br;
  })(),
}));
