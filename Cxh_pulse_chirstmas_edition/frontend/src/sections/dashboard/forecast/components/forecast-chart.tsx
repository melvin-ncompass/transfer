import { useMemo } from 'react';
import { Card, Typography, Box, Skeleton } from '@mui/material';
import { Chart, useChart } from '../../../../components/chart';
import { IndicatorName } from '../../../../types/indicators';
import { parseISODateToTimestamp } from '../../../../utils/date-parsing';
// ----------------------------------------------------------------------
type ForecastDataPoint = {
    rawDate: string;
    rawValue: number;
    rawCiLow: number | null;
    rawCiHigh: number | null;
    rawType: 'historical' | 'projected';
};
type ForecastChartProps = {
    title: string;
    data: ForecastDataPoint[];
    isLoading?: boolean;
    error?: any;
    indicator?: IndicatorName;
};
/**
 * Y-axis labels for each indicator
 */
const Y_AXIS_LABELS: Record<IndicatorName, string> = {
    [IndicatorName.MALARIA_CASE_RATE]: 'Confirmed Cases per 1000 Population',
    [IndicatorName.SEVERE_MUAC_PERCENTAGE]: 'Cases of Severe MUAC/ Total MUAC Cases',
    [IndicatorName.STILLBIRTH_RATE]: 'Number of Stillbirths/Live Births',
    [IndicatorName.LOW_BIRTH_WEIGHT_PCT]: 'Low Birth Weight (<2500gm) babies / Live Births',
    [IndicatorName.NEONATAL_MORTALITY_RATE]: 'Neonatal Deaths (0-28 days)/1000 Live Births',
};

/**
 * ForecastChart - Line chart with historical and projected data
 * 
 * Displays:
 * - Historical data as blue markers with grey line
 * - Projected data as orange markers with grey dotted line
 * - Confidence interval as shaded area for projected data
 */
export function ForecastChart({ title, data, isLoading = false, error, indicator }: ForecastChartProps) {
    // Get Y-axis label based on indicator
    const yAxisLabel = indicator ? Y_AXIS_LABELS[indicator] : undefined;
    // Separate and process historical and projected data
    const { historicalData, projectedData, confidenceIntervals } = useMemo(() => {
        const historical: Array<{ x: number; y: number }> = [];
        const projected: Array<{ x: number; y: number }> = [];
        const ci: Array<{ x: number; y: [number, number] }> = [];
        data.forEach((point) => {
            // Parse ISO date string in UTC to avoid timezone issues
            // Format: "2022-01-01T00:00:00.000Z"
            const timestamp = parseISODateToTimestamp(point.rawDate);
            const value = point.rawValue;
            if (point.rawType === 'historical') {
                historical.push({ x: timestamp, y: value });
            } else {
                projected.push({ x: timestamp, y: value });
                // Add confidence interval if available
                if (point.rawCiLow !== null && point.rawCiHigh !== null) {
                    ci.push({ x: timestamp, y: [point.rawCiLow, point.rawCiHigh] });
                }
            }
        });
        // Sort all arrays by date
        [historical, projected, ci].forEach(arr => arr.sort((a, b) => a.x - b.x));
        // Connect historical and projected lines seamlessly
        if (historical.length > 0 && projected.length > 0) {
            projected.unshift(historical[historical.length - 1]);
        }
        return { historicalData: historical, projectedData: projected, confidenceIntervals: ci };
    }, [data]);
    const chartOptions = useChart({
        chart: { toolbar: { show: false }, zoom: { enabled: false }, height: 300 },
        stroke: { curve: 'smooth', width: 1.5 },
        xaxis: { type: 'datetime', crosshairs: { show: false }, tooltip: { enabled: false } },
        yaxis: {
            title: {
                text: yAxisLabel,
                style: {
                    fontSize: '12px',
                    fontWeight: 500,
                },
            },
            labels: { formatter: (value: number) => value.toFixed(3) },
        },
        tooltip: {
            shared: true,
            intersect: false,
            style: { fontSize: '12px' },
            y: { formatter: (value: number) => value.toFixed(3) },
            x: { format: 'MMM yyyy' },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            markers: { size: 6, strokeWidth: 0 },
        },
    });
    // Prepare series data and all chart configurations in a single pass
    const { series, colors, strokeColors, markerColors, markerSizes, discreteMarkers, fillConfig } = useMemo(() => {
        const seriesData: any[] = [];
        const legendColors: string[] = []; // Colors for legend markers
        const lineColors: string[] = []; // Colors for lines (all grey)
        const pointColors: string[] = []; // Colors for data point markers
        const sizes: number[] = []; // Marker sizes
        const fillTypes: string[] = []; // Fill types for series
        // Confidence interval series (shaded area, no tooltip)
        if (confidenceIntervals.length > 0) {
            const upperBound = confidenceIntervals.map((p) => ({ x: p.x, y: p.y[1] }));
            const lowerBound = [...confidenceIntervals].reverse().map((p) => ({ x: p.x, y: p.y[0] }));
            seriesData.push({
                name: 'Confidence Interval',
                type: 'area',
                data: [...upperBound, ...lowerBound],
                enableMouseTracking: false,
            });
            legendColors.push('#9E9E9E'); // Grey for CI
            lineColors.push('#9E9E9E');
            pointColors.push('#9E9E9E');
            sizes.push(0); // No markers for CI
            fillTypes.push('gradient');
        }
        // Historical data series (blue markers, grey line)
        if (historicalData.length > 0) {
            seriesData.push({ name: 'Historical', type: 'line', data: historicalData });
            legendColors.push('#1565c0'); // Blue legend
            lineColors.push('#696060'); // Grey line
            pointColors.push('#1565c0'); // Blue markers
            sizes.push(4);
            fillTypes.push('solid');
        }
        // Projected data series (orange markers, grey dotted line)
        if (projectedData.length > 0) {
            seriesData.push({ name: 'Projected', type: 'line', data: projectedData, stroke: { dashArray: 5 } });
            legendColors.push('#ed6c02'); // Orange legend
            lineColors.push('#696060'); // Grey line
            pointColors.push('#ed6c02'); // Orange markers
            sizes.push(4);
            fillTypes.push('solid');
        }
        // Hide first marker of projected series to keep blue dot visible at connection point
        const discrete = projectedData.length > 0 ? [{
            seriesIndex: seriesData.length - 1,
            dataPointIndex: 0,
            size: 0,
        }] : [];
        return {
            series: seriesData,
            colors: legendColors,
            strokeColors: lineColors,
            markerColors: pointColors,
            markerSizes: sizes,
            discreteMarkers: discrete,
            fillConfig: {
                type: fillTypes,
                gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.1, stops: [0, 100] },
            },
        };
    }, [historicalData, projectedData, confidenceIntervals]);
    // Loading state
    if (isLoading) {
        return (
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Legend skeletons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 1 }}>
                        <Skeleton variant="rectangular" width={120} height={20} />
                        <Skeleton variant="rectangular" width={80} height={20} />
                        <Skeleton variant="rectangular" width={80} height={20} />
                    </Box>
                    {/* Chart skeleton */}
                    <Skeleton variant="rectangular" sx={{ flex: 1, minHeight: 300, borderRadius: 1 }} />
                </Box>
            </Card>
        );
    }
    // Error or empty state
    const hasData = historicalData.length > 0 || projectedData.length > 0;
    const message = error ? 'Error loading forecast data' : !hasData ? 'No forecast data available' : null;
    if (message) {
        return (
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <Typography variant="body2" color={error ? 'error' : 'text.secondary'}>
                        {message}
                    </Typography>
                </Box>
            </Card>
        );
    }
    // Render chart
    return (
        <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Chart
                    type="line"
                    series={series}
                    options={{
                        ...chartOptions,
                        colors, // Legend marker colors
                        chart: { ...chartOptions?.chart, stacked: false },
                        stroke: { ...chartOptions?.stroke, colors: strokeColors }, // Grey lines
                        markers: { size: markerSizes, colors: markerColors, discrete: discreteMarkers }, // Colored points
                        fill: fillConfig,
                        tooltip: {
                            ...chartOptions?.tooltip,
                            // custom: ({ series: tooltipSeries, seriesIndex, dataPointIndex, w }: any) => {
                            //     const seriesName = w.config.series[seriesIndex].name;
                            //     // Don't show tooltip for Confidence Interval
                            //     if (seriesName === 'Confidence Interval') return '';
                            //     const value = tooltipSeries[seriesIndex][dataPointIndex];
                            //     return `<div style="padding: 8px 12px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                            //         <div style="font-weight: 600; margin-bottom: 4px;">${seriesName}</div>
                            //         <div style="color: #666;">${value?.toFixed(3) || 'N/A'}</div>
                            //     </div>`;
                            // },
                        },
                        legend: {
                            ...chartOptions?.legend,
                            show: true,
                            markers: { size: 6, strokeWidth: 0, shape: 'circle' },
                            itemMargin: { horizontal: 12, vertical: 0 },
                        },
                    }}
                />
            </Box>
        </Card>
    );
}

