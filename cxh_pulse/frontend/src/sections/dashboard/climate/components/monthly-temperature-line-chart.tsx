import { useMemo, useRef, useCallback, useState } from 'react';
import { Card, Typography, Box, Stack, CircularProgress } from '@mui/material';
import { Chart, useChart, ChartExportMenu } from '../../../../components/chart';
import { TEMPERATURE_COLOR } from '../../../../utils/color';
import { getYearMonthKey, createUTCTimestampForMonth } from '../../../../utils/date-parsing';
import { monthlyTemperatureLineChartStyles } from '../../../../styles/sections/monthly-temperature-line-chart.styles';
import type { MonthlyTemperatureLineChartProps } from '../../../../types/sections.types';
import { useBrandedChartExport } from '../../../../hooks';
import { ReportGuard } from '../../components/protected-components/permission-guard';
import { ViewState } from '@/types/sections.types';
// import { useGetConfigurationQuery } from 'src/api';

// ----------------------------------------------------------------------

const CHART_TITLE = 'Monthly Temperature Trend';

/**
 * MonthlyTemperatureLineChart - Line chart for monthly temperature trends
 * 
 * Displays temperature data as a line chart with yellow color scheme.
 */
export function MonthlyTemperatureLineChart({
    data,
    onTitleClick,
    isTitleClickable = false,
    filterInfo,
    dateRange,
    isLoading
}: MonthlyTemperatureLineChartProps & {
    filterInfo?: { location?: string; subcounty?: string; ward?: string };
    dateRange?: { from: Date; to: Date };
    isLoading?: boolean;
}) {
    const chartRef = useRef<HTMLDivElement>(null);


    const chartOptions = useChart({
        chart: {
            toolbar: {
                show: false, // Using custom branded export menu instead
            },
            zoom: { enabled: false },
            height: 300,
            events: {
            },
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        markers: {
            size: 4,
        },
        xaxis: {
            type: 'datetime',
        },
        yaxis: {
            labels: {
                formatter: (value: number) => String(value),
            },
        },
        tooltip: {
            shared: true,
            intersect: false,
            style: {
                fontSize: '12px',
            },
            theme: 'dark',
            y: {
                formatter: (value: number) => Math.round(value).toString(),
            },
        },
    });

    // Process data for the chart
    const chartData = useMemo(() => {
        const tempMap = new Map<string, number>();

        data.forEach((item) => {
            // Parse ISO date string in UTC to avoid timezone issues
            // Format: "2022-01-01T00:00:00.000Z"
            const key = getYearMonthKey(item.monthdate);

            // Aggregate if multiple entries exist for same month
            const existing = tempMap.get(key) || 0;
            tempMap.set(key, existing + (item.temperature || 0));
        });

        const monthlyArray = Array.from(tempMap.entries())
            .map(([key, temperature]) => {
                const [year, month] = key.split('-').map(Number);
                return {
                    year,
                    month,
                    temperature,
                };
            })
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        return monthlyArray.map((d) => ({
            x: createUTCTimestampForMonth(d.year, d.month),
            y: d.temperature,
        }));
    }, [data]);

    const hasValidData = data.length > 0 && chartData.length > 0;
    const state: ViewState = isLoading ? ViewState.LOADING : hasValidData ? ViewState.DATA : ViewState.EMPTY;


    // Callback to get series data for CSV export
    const getSeriesData = useCallback(() => ({
        type: 'line' as const,
        series: [{ name: 'Temperature (°C)', data: chartData }],
    }), [chartData]);

    // Branded export hook
    const { exportPNG, exportSVG, exportCSV, isReady } = useBrandedChartExport({
        chartTitle: CHART_TITLE,
        chartRef,
        getSeriesData,
        filterInfo,
        dateRange,
    });

    // Create data for the shaded area above threshold
    // const thresholdShadeData = useMemo(() => {
    //     if (temperatureThreshold === undefined || temperatureThreshold === null || !hasValidData) {
    //         return [];
    //     }

    //     // Get min and max x values
    //     const xValues = chartData.map((d) => d.x);
    //     const minX = Math.min(...xValues);
    //     const maxX = Math.max(...xValues);

    //     // Get max y value to determine top of chart
    //     const maxY = Math.max(...chartData.map((d) => d.y), temperatureThreshold * 1.5);

    //     // Create area data points that form a rectangle above the threshold
    //     return [
    //         { x: minX, y: temperatureThreshold },
    //         { x: maxX, y: temperatureThreshold },
    //         { x: maxX, y: maxY },
    //         { x: minX, y: maxY },
    //     ];
    // }, [chartData, temperatureThreshold, hasValidData]);

    // Prepare chart options with threshold annotations and red shading
    const finalChartOptions = useMemo(() => {
        const baseOptions = {
            ...chartOptions,
            yaxis: {
                title: { text: 'Temperature (°C)' },
                labels: {
                    formatter: (value: number) => String(value),
                },
                min: 0, // Always start Y-axis from 0
            },
            colors: [TEMPERATURE_COLOR],
        };

        // Add threshold line and red shading if threshold is configured and valid
        // Check for both undefined and null, and ensure it's a valid number
        // const hasValidThreshold = temperatureThreshold !== undefined && 
        //                            temperatureThreshold !== null && 
        //                            !isNaN(Number(temperatureThreshold)) &&
        //                            temperatureThreshold > 0;

        // if (hasValidThreshold && hasValidData && thresholdShadeData.length > 0) {
        //     return {
        //         ...baseOptions,
        //         annotations: {
        //             yaxis: [
        //                 {
        //                     y: temperatureThreshold,
        //                     borderColor: theme.palette.error.main, // Red color for threshold line
        //                     borderWidth: 2,
        //                     strokeDashArray: 5, // Dotted line
        //                     label: {
        //                         text: `${temperatureThreshold}`,
        //                         style: {
        //                             color: theme.palette.error.main,
        //                             background: 'rgba(255, 255, 255, 0.9)',
        //                             fontSize: '12px',
        //                             fontWeight: 600,
        //                         },
        //                         position: 'left',
        //                         offsetX: 0,
        //                         offsetY: 0,
        //                     },
        //                 },
        //             ],
        //             polygons: [
        //                 {
        //                     points: thresholdShadeData,
        //                     fillColor: theme.palette.error.main, // Red color for threshold area
        //                     strokeColor: theme.palette.error.main,
        //                     strokeWidth: 0,
        //                     opacity: 0.2, // Red shade above threshold
        //                 },
        //             ],
        //         },
        //     };
        // }

        return baseOptions;
    }, [chartOptions]);

    const contentByState = {
        loading: (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 350,
                    height: 350,
                }}
            >
                <CircularProgress size={32} />
            </Box>
        ),

        empty: (
            <Box sx={{
                ...monthlyTemperatureLineChartStyles.noDataContainer,
                minHeight: 350,
                height: 350,
            }}>
                <Typography variant="body2">No data found</Typography>
            </Box>
        ),

        data: (
            <Box ref={chartRef} sx={{ minHeight: 350, height: 350 }}>
                <Chart
                    type="line"
                    series={[
                        {
                            name: 'Temperature',
                            data: chartData,
                        },
                    ]}
                    options={finalChartOptions}
                />
            </Box>
        )
    }

    return (
        <Card sx={monthlyTemperatureLineChartStyles.card}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography
                    variant="h6"
                    sx={monthlyTemperatureLineChartStyles.title(isTitleClickable)}
                    onClick={isTitleClickable ? onTitleClick : undefined}
                >
                    {CHART_TITLE}
                </Typography>
                <ReportGuard>
                    <ChartExportMenu
                        onExportPNG={exportPNG}
                        onExportSVG={exportSVG}
                        onExportCSV={exportCSV}
                        visible={!isLoading && hasValidData}
                    />
                </ReportGuard>
            </Stack>
            {contentByState[state]}
        </Card>
    );
}

