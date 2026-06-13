import { useMemo, memo, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Chart, useChart } from '../../../../components/chart';
import { useChartHover } from '../../climate/contexts/chart-hover-context';
import { trendSparklineStyles } from '../../../../styles/sections/trend-sparkline.styles';
import type { TrendSparklineProps } from '../../../../types/sections.types';

interface ApexDataPointSelectionConfig {
  dataPointIndex: number;
}
/**
 * Simple Sparkline component for trend visualization
 * @param data - Array of numeric values
 * @param dates - Array of timestamps (milliseconds) corresponding to each data point
 */

// Custom comparison function to prevent re-renders when context changes but this sparkline doesn't need to update
// This is important because context updates trigger all consumers, but we only want to re-render if props change
function arePropsEqual(prevProps: TrendSparklineProps, nextProps: TrendSparklineProps): boolean {
    // Only re-render if data or dates actually change
    if (prevProps.data.length !== nextProps.data.length) return false;
    if (prevProps.dates?.length !== nextProps.dates?.length) return false;

    // Deep comparison of data arrays
    for (let i = 0; i < prevProps.data.length; i++) {
        if (prevProps.data[i] !== nextProps.data[i]) return false;
    }

    // Deep comparison of dates arrays
    if (prevProps.dates && nextProps.dates) {
        for (let i = 0; i < prevProps.dates.length; i++) {
            if (prevProps.dates[i] !== nextProps.dates[i]) return false;
        }
    }

    return true;
}

export const TrendSparkline = memo(function TrendSparkline({
    data,
    dates
}: TrendSparklineProps) {
    const {
        hoveredDate,
        clickedDate,
        highlightMode,
        setClickedDate,
        setHighlightMode,
    } = useChartHover();

    // Use hoveredDate for hover mode, clickedDate for click mode
    const activeDate = highlightMode === 'hover' ? hoveredDate : clickedDate;
    // Find the index of the active date (hover or click)
    const highlightedIndex = useMemo(() => {
        // If no active date, clear highlight
        if (!activeDate) return -1;
        // If dates or data arrays are invalid, clear highlight
        if (!dates || dates.length === 0 || dates.length !== data.length) return -1;
        // Find the exact matching date (within same month)
        // Use UTC methods to ensure timezone-independent comparison
        const activeDateObj = new Date(activeDate);
        const activeYear = activeDateObj.getUTCFullYear();
        const activeMonthNum = activeDateObj.getUTCMonth() + 1; // getUTCMonth() returns 0-11, so add 1 to get 1-12
        const index = dates.findIndex((date) => {
            const d = new Date(date);
            return d.getUTCFullYear() === activeYear && d.getUTCMonth() + 1 === activeMonthNum;
        });
        // If date not found in dates array, return -1 to clear highlight
        if (index < 0) {
            return -1;
        }
        // If index is out of bounds, return -1
        if (index >= data.length) {
            return -1;
        }
        // Also check if the data point at this index has a valid value
        // If the value is null, undefined, or NaN, don't highlight
        const value = data[index];
        if (value == null || (typeof value === 'number' && isNaN(value))) {
            return -1;
        }
        return index;
    }, [activeDate, dates, data]);

    // Calculate dynamic label offset and fixed padding to prevent line movement
    const { gridPadding, labelOffsetX } = useMemo(() => {
        // Always use fixed padding to prevent line movement
        const basePadding = 8;
        const extraPadding = 12; // Extra padding to accommodate longer values
        // Fixed padding that works for both first and last points
        const fixedLeftPadding = basePadding + extraPadding;
        const fixedRightPadding = basePadding + extraPadding;
        const topPadding = 20; // Reserve space for data label above
        // Calculate label offset based on position and value length
        let offsetX = 0;
        if (highlightedIndex >= 0 && highlightedIndex < data.length) {
            const highlightedValue = data[highlightedIndex];
            const valueLength = highlightedValue != null ? String(Math.round(highlightedValue)).length : 0;
            if (highlightedIndex === 0) {
                // First point: shift label to the right to prevent cutoff
                offsetX = valueLength > 2 ? 8 : 4;
            } else if (highlightedIndex === data.length - 1) {
                // Last point: shift label to the left to prevent cutoff
                offsetX = valueLength > 2 ? -8 : -4;
            }
        }
        return {
            gridPadding: {
                top: topPadding,
                right: fixedRightPadding,
                bottom: 10,
                left: fixedLeftPadding,
            },
            labelOffsetX: offsetX,
        };
    }, [highlightedIndex, data]);

    // Check if we should show highlight
    const shouldShowHighlight = highlightedIndex >= 0 &&
        highlightedIndex < data.length &&
        data[highlightedIndex] != null &&
        !isNaN(data[highlightedIndex]);

    // Memoize chart options and only recalculate when highlightedIndex, data, or dates change
    const chartOptionsConfig = useMemo(() => ({
        states: {
            active: {
                allowMultipleDataPointsSelection: false,
                filter: {
                type: 'none', // prevents color change on click
                },
            },
            hover: {
                filter: {
                type: 'none', // prevents hover highlight (if needed)
                },
            },
            },
        chart: {
            type: 'line' as const,
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: true },
            height: 60, // Increased from 40 to give more vertical space for annotations
            group: 'sparkline',
            events: {
                click: (_event : MouseEvent, _chart: any , config: ApexDataPointSelectionConfig) => {
                    // undefined check for dates
                    if (!dates || dates.length === 0) return;

                    const index = config.dataPointIndex;

                    // Case 1: Clicked on a datapoint
                    if (index !== -1) {
                        const clickedTimestamp = dates[index];

                        // Same point -> remove selection
                        if (
                        highlightMode === 'click' &&
                        clickedDate === clickedTimestamp
                        ) {
                        setClickedDate(null);
                        return;
                        }

                        // Different point -> switch selection
                        setHighlightMode('click');
                        setClickedDate(clickedTimestamp);
                        return;
                    }

                    // Case 2: Clicked on label or empty area -> remove selection
                    if (highlightMode === 'click' && clickedDate) {
                        setClickedDate(null);
                    }
                },
                dataPointMouseEnter(event: MouseEvent) {    
                    const target = event.target as HTMLElement | null;
                    if (target) {
                        target.style.cursor = 'pointer';
                    }
                },
            },
        },

        stroke: {
            curve: 'smooth' as const,
            width: 2,
        },
        markers: {
            size: 3,
            hover: {
                size: 6,
            },
            // Use explicit empty array to ensure highlights are properly cleared
            discrete: shouldShowHighlight ? [{
                seriesIndex: 0,
                dataPointIndex: highlightedIndex,
                fillColor: '#ffffff',
                shape: 'circle' as const,
                strokeColor: 'var(--brand-accent, #fe7f2d)', // Use brand color with fallback
                size: 0,
            }] : [],
        },
        dataLabels: shouldShowHighlight ? {
            enabled: true,
            enabledOnSeries: [0],
            formatter: (val: number, opts: any) => {
                // Only show label for the highlighted point
                if (opts.dataPointIndex === highlightedIndex) {
                    return String(val);
                }
                return '';
            },
            style: {
                fontSize: '12px',
                fontWeight: 600,
                colors: ['var(--brand-accent, #fe7f2d)'], // Use brand color with fallback
            },
            offsetY: 0, // Position label above the point, within reserved padding
            offsetX: labelOffsetX, // Dynamic offset based on position
        } : {
            enabled: false,
        },
        colors: ['var(--brand-accent)'],
        tooltip: {
            enabled: true,
            shared: false,
            intersect: true,
            style: {
                fontSize: '12px',
            },
            y: {
                formatter: (value: number) => Math.round(value).toLocaleString(),
            },
            x: {
                show: false,
            },
            marker: {
                show: false,
            },
        },
        grid: {
            show: false,
            padding: gridPadding, // Dynamic padding to prevent label cutoff
        },
        xaxis: {
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { show: false },
        },
        annotations: {
            // Use explicit empty array to ensure dotted line is properly cleared
            xaxis: (shouldShowHighlight && dates && dates.length > highlightedIndex) ? [{
                x: highlightedIndex + 1,
                strokeDashArray: 4,
                borderColor: '#999',
                borderWidth: 1,
                opacity: 0.6,
            }] : [],
        },
    }), [highlightedIndex, data, dates, gridPadding, labelOffsetX, shouldShowHighlight, setClickedDate]);

    const chartOptions = useChart(chartOptionsConfig);

    const series = useMemo(() => [
        {
            name: 'Count',
            data,
        },
    ], [data]);

    // Get first and last values safely
    const firstValue = data.length > 0 ? data[0] : null;
    const lastValue = data.length > 0 ? data[data.length - 1] : null;

    // Trigger resizing of rows and label re-render when data changes
    useEffect(() => {
    const id = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
    });
    return () => cancelAnimationFrame(id);
    }, [data, dates]);

    return (
        <Box sx={trendSparklineStyles.container}>
            {firstValue != null && (
                <Typography
                    variant="caption"
                    sx={trendSparklineStyles.valueLabel}
                >
                    {typeof firstValue === 'number' ? Math.round(firstValue).toLocaleString() : firstValue}
                </Typography>
            )}
            <Box sx={trendSparklineStyles.chartContainer}>
                <Chart type="line" series={series} options={chartOptions} />
            </Box>
            {lastValue != null && (
                <Typography
                    variant="caption"
                    sx={trendSparklineStyles.valueLabel}
                >
                    {typeof lastValue === 'number' ? Math.round(lastValue).toLocaleString() : lastValue}
                </Typography>
            )}
        </Box>
    );
}, arePropsEqual);