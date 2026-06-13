import { useMemo, useRef, useCallback, useState } from 'react';
import { Card, Typography, Box, Stack, CircularProgress } from '@mui/material';
import { Chart, useChart, ChartExportMenu } from '../../../../components/chart';
import { formatWithK } from '../../../../utils/format-number';
import { PRECIPITATION_COLOR } from '../../../../utils/color';
import { getYearMonthKey, createUTCTimestampForMonth } from '../../../../utils/date-parsing';
import { monthlyRainfallLineChartStyles } from '../../../../styles/sections/monthly-rainfall-line-chart.styles';
import type { MonthlyRainfallLineChartProps } from '../../../../types/sections.types';
import { useBrandedChartExport } from '../../../../hooks';
import { ReportGuard } from '../../components/protected-components/permission-guard';
import { ViewState } from '@/types/sections.types'

// ----------------------------------------------------------------------

const CHART_TITLE = 'Monthly Precipitation Trend';

/**
 * MonthlyRainfallLineChart - Line chart for monthly rainfall trends
 * 
 * Displays precipitation data as a line chart with light blue color scheme.
 */
export function MonthlyRainfallLineChart({
    data,
    onTitleClick,
    isTitleClickable = false,
    filterInfo,
    dateRange,
    isLoading,
}: MonthlyRainfallLineChartProps & {
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
                formatter: (value: number) => formatWithK(Math.round(value)),
            },
        },
    });

    // Process data for the chart
    const chartData = useMemo(() => {
        const precipMap = new Map<string, number>();

        data.forEach((item) => {
            // Parse ISO date string in UTC to avoid timezone issues
            // Format: "2022-01-01T00:00:00.000Z"
            const key = getYearMonthKey(item.monthdate);

            // Aggregate if multiple entries exist for same month
            const existing = precipMap.get(key) || 0;
            precipMap.set(key, existing + (item.precipitation || 0));
        });

        const monthlyArray = Array.from(precipMap.entries())
            .map(([key, precipitation]) => {
                const [year, month] = key.split('-').map(Number);
                return {
                    year,
                    month,
                    precipitation,
                };
            })
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        return monthlyArray.map((d) => ({
            x: createUTCTimestampForMonth(d.year, d.month),
            y: d.precipitation,
        }));
    }, [data]);

    const hasValidData = data.length > 0 && chartData.length > 0;
    const state: ViewState = isLoading ? ViewState.LOADING : hasValidData ? ViewState.DATA : ViewState.EMPTY;

    // Callback to get series data for CSV export
    const getSeriesData = useCallback(() => ({
        type: 'line' as const,
        series: [{ name: 'Precipitation (mm)', data: chartData }],
    }), [chartData]);

    // Branded export hook
    const { exportPNG, exportSVG, exportCSV, isReady } = useBrandedChartExport({
        chartTitle: CHART_TITLE,
        chartRef,
        getSeriesData,
        filterInfo,
        dateRange,
    });

    const contentByState = {
        loading: (<Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 350,
                height: 350,
            }}
        >
            <CircularProgress size={32} />
        </Box>),
        empty: (
            <Box sx={{
                ...monthlyRainfallLineChartStyles.noDataContainer,
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
                            name: 'Precipitation',
                            data: chartData,
                        },
                    ]}
                    options={{
                        ...chartOptions,
                        yaxis: {
                            title: { text: 'Precipitation (mm)' },
                            labels: {
                                formatter: (value: number) => String(value),
                            },
                        },
                        colors: [PRECIPITATION_COLOR],
                    }}
                />
            </Box>
        )
    }

    return (
        <Card sx={monthlyRainfallLineChartStyles.card}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography
                    variant="h6"
                    sx={monthlyRainfallLineChartStyles.title(isTitleClickable)}
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

