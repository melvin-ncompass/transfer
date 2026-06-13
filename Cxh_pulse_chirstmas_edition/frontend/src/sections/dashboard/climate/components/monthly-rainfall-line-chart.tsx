import { useMemo } from 'react';
import { Card, Typography, Box } from '@mui/material';
import { Chart, useChart } from '../../../../components/chart';
import { formatWithK } from '../../../../utils/format-number';
import { PRECIPITATION_COLOR } from '../../../../utils/color';
import { getYearMonthKey, createUTCTimestampForMonth } from '../../../../utils/date-parsing';
import { monthlyRainfallLineChartStyles } from '../../../../styles/sections/monthly-rainfall-line-chart.styles';
import type { MonthlyRainfallLineChartProps } from '../../../../types/sections.types';

// ----------------------------------------------------------------------

/**
 * MonthlyRainfallLineChart - Line chart for monthly rainfall trends
 * 
 * Displays precipitation data as a line chart with light blue color scheme.
 */
export function MonthlyRainfallLineChart({ data, onTitleClick, isTitleClickable = false }: MonthlyRainfallLineChartProps) {
    const chartOptions = useChart({
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            height: 300,
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

    return (
        <Card sx={monthlyRainfallLineChartStyles.card}>
            <Typography
                variant="h6"
                sx={monthlyRainfallLineChartStyles.title(isTitleClickable)}
                onClick={isTitleClickable ? onTitleClick : undefined}
            >
                Monthly Precipitation Trend
            </Typography>
            {!hasValidData ? (
                <Box sx={monthlyRainfallLineChartStyles.noDataContainer}>
                    <Typography variant="body2">No data found</Typography>
                </Box>
            ) : (
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
            )}
        </Card>
    );
}

