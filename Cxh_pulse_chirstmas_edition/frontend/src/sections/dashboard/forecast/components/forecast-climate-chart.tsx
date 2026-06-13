import { useMemo } from 'react';
import { Card, Typography, Box, Stack, Skeleton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Chart, useChart } from '../../../../components/chart';
import { TEMPERATURE_COLOR, PRECIPITATION_COLOR } from '../../../../utils/color';
import { formatWithK } from '../../../../utils/format-number';
import { createUTCTimestampForMonth } from '../../../../utils/date-parsing';
import { useChartHover } from '../../climate';

// ----------------------------------------------------------------------

type ClimateDataPoint = {
    temperature: number;
    precipitation: number;
    comYear: number;
    comMonth: number;
    rawType: 'historical' | 'projected';
};

type ForecastClimateChartProps = {
    title: string;
    data: ClimateDataPoint[];
    isLoading?: boolean;
    error?: any;
};

export function ForecastClimateChart({ title, data, isLoading = false, error }: ForecastClimateChartProps) {
    const theme = useTheme();
    const { setHoveredDate, setClickedDate, highlightMode, clickedDate } = useChartHover();

    // Process data 
    const {
        chartData,
        minTemp,
        maxTemp,
        minPrecip,
        maxPrecip,
        projectionStartDate,
        projectionEndDate
    } = useMemo(() => {
        // 1. Organize data by timestamp
        const timelineMap = new Map<number, {
            timestamp: number;
            histTemp: number | null;
            projTemp: number | null;
            histPrecip: number | null;
            projPrecip: number | null;
            isProjection: boolean;
        }>();

        data.forEach((point) => {
            const date = new Date(Date.UTC(point.comYear, point.comMonth - 1, 1));
            const timestamp = date.getTime();

            const existing = timelineMap.get(timestamp) || {
                timestamp,
                histTemp: null,
                projTemp: null,
                histPrecip: null,
                projPrecip: null,
                isProjection: false,
            };

            if (point.rawType === 'historical') {
                existing.histTemp = point.temperature;
                existing.histPrecip = +point.precipitation.toFixed(2);
            } else {
                existing.projTemp = point.temperature;
                existing.projPrecip = +point.precipitation.toFixed(2);
                existing.isProjection = true;
            }

            timelineMap.set(timestamp, existing);
        });

        // Sort timeline
        const timeline = Array.from(timelineMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        // Find projection bounds
        let projStart: number | null = null;
        let projEnd: number | null = null;
        for (const point of timeline) {
            if (point.isProjection && projStart === null) {
                projStart = point.timestamp;
            }
            if (point.isProjection) {
                projEnd = point.timestamp;
            }
        }

        // 2. Generate Sparse Arrays (Filter out nulls)
        const histTempData = timeline
            .filter(p => p.histTemp !== null)
            .map(p => ({ x: p.timestamp, y: p.histTemp }));

        const projTempData = timeline
            .filter(p => p.projTemp !== null)
            .map(p => ({ x: p.timestamp, y: p.projTemp }));

        const histPrecipData = timeline
            .filter(p => p.histPrecip !== null)
            .map(p => ({ x: p.timestamp, y: p.histPrecip }));

        const projPrecipData = timeline
            .filter(p => p.projPrecip !== null)
            .map(p => ({ x: p.timestamp, y: p.projPrecip }));

        // 3. BRIDGE THE GAP: Connect Historical to Projected Line
        if (histTempData.length > 0 && projTempData.length > 0) {
            const lastHistPoint = histTempData[histTempData.length - 1];
            if (projTempData[0].x > lastHistPoint.x) {
                projTempData.unshift(lastHistPoint);
            }
        }

        const allTemps = timeline.flatMap(p => [p.histTemp, p.projTemp]).filter(v => v != null) as number[];
        const allPrecips = timeline.flatMap(p => [p.histPrecip, p.projPrecip]).filter(v => v != null) as number[];

        return {
            chartData: {
                histTemp: histTempData,
                projTemp: projTempData,
                histPrecip: histPrecipData,
                projPrecip: projPrecipData,
            },
            minTemp: 0,
            maxTemp: allTemps.length ? Math.ceil(Math.max(...allTemps) * 1.1) : 40,
            minPrecip: 0,
            maxPrecip: allPrecips.length ? Math.ceil(Math.max(...allPrecips) * 1.1) : 100,
            projectionStartDate: projStart,
            projectionEndDate: projEnd,
        };
    }, [data]);

    const hasValidData = chartData.histTemp.length > 0 || chartData.projTemp.length > 0;

    const projectedTempColor = alpha(TEMPERATURE_COLOR, 0.6);
    const projectedPrecipColor = alpha(PRECIPITATION_COLOR, 0.5);

    const seriesColors = [
        TEMPERATURE_COLOR,
        projectedTempColor,
        PRECIPITATION_COLOR,
        projectedPrecipColor
    ];

    const clickedPointIndex = useMemo(() => {
        if (!clickedDate || highlightMode !== 'click') return -1;
        return chartData.histTemp.findIndex(point => point.x === clickedDate);
    }, [clickedDate, highlightMode, chartData.histTemp]);

    const chartOptions = useChart({
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: true },
            height: 450,
            events: {
                dataPointMouseEnter: (_: any, __: any, config: any) => {
                    if (highlightMode === 'hover') {
                        const { seriesIndex, dataPointIndex, w } = config;
                        const timestamp = w.globals.seriesX[seriesIndex]?.[dataPointIndex];
                        if (timestamp) {
                            setHoveredDate(timestamp);
                        }
                    }
                },
                dataPointMouseLeave: () => {
                    if (highlightMode === 'hover') {
                        setHoveredDate(null);
                    }
                },
                updated: () => {
                    if (highlightMode === 'hover') {
                        setHoveredDate(null);
                    }
                },
                dataPointSelection: (_: any, __: any, config: any) => {
                    if (highlightMode === 'click') {
                        const { seriesIndex, dataPointIndex, w } = config;
                        const timestamp = w.globals.seriesX[seriesIndex]?.[dataPointIndex];
                        setClickedDate(timestamp || null);
                    }
                },
                markerClick: (_: any, __: any, config: any) => {
                    if (highlightMode === 'click') {
                        const { seriesIndex, dataPointIndex, w } = config;
                        const timestamp = w.globals.seriesX[seriesIndex]?.[dataPointIndex];
                        setClickedDate(timestamp || null);
                    }
                },
            },
        },
        annotations: {
            xaxis: [
                ...(clickedPointIndex >= 0 && clickedDate ? [{
                    x: clickedDate,
                    strokeDashArray: 4,
                    borderColor: '#999',
                    borderWidth: 1,
                    opacity: 0.6,
                }] : []),
                ...(projectionStartDate ? [
                    {
                        x: projectionStartDate,
                        strokeDashArray: 4,
                        borderColor: theme.palette.text.disabled,
                    },
                    ...(projectionEndDate ? [{
                        x: projectionStartDate,
                        x2: projectionEndDate,
                        fillColor: theme.palette.text.disabled,
                        opacity: 0.08,
                        label: {
                            borderColor: 'transparent',
                            style: {
                                color: theme.palette.text.secondary,
                                fontSize: '12px',
                                background: 'transparent',
                            },
                            text: 'Projection',
                            position: 'top',
                            orientation: 'horizontal',
                            offsetY: -20,
                        }
                    }] : [])
                ] : [])
            ]
        },
        stroke: {
            curve: 'smooth',
            width: 2,
            dashArray: [0, 0, 0, 0],
        },
        markers: {
            size: 4,
            strokeWidth: 2,
            colors: seriesColors,
            strokeColors: [
                theme.palette.background.paper,
                theme.palette.background.paper,
                theme.palette.background.paper,
                theme.palette.background.paper
            ],
            hover: { size: 7 },
            // Use explicit empty array to ensure highlights are properly cleared on deselect
            discrete: clickedPointIndex >= 0 ? [
                ...(chartData.histTemp[clickedPointIndex]?.y != null && !isNaN(chartData.histTemp[clickedPointIndex]?.y) ? [{
                    seriesIndex: 0,
                    dataPointIndex: clickedPointIndex,
                    fillColor: '#fff',
                    strokeColor: TEMPERATURE_COLOR,
                    size: 8,
                }] : []),
                ...(chartData.projTemp[clickedPointIndex]?.y != null && !isNaN(chartData.projTemp[clickedPointIndex]?.y) ? [{
                    seriesIndex: 1,
                    dataPointIndex: clickedPointIndex,
                    fillColor: '#fff',
                    strokeColor: projectedTempColor,
                    size: 8,
                }] : []),
                ...(chartData.histPrecip[clickedPointIndex]?.y != null && !isNaN(chartData.histPrecip[clickedPointIndex]?.y) ? [{
                    seriesIndex: 2,
                    dataPointIndex: clickedPointIndex,
                    fillColor: '#fff',
                    strokeColor: PRECIPITATION_COLOR,
                    size: 8,
                }] : []),
                ...(chartData.projPrecip[clickedPointIndex]?.y != null && !isNaN(chartData.projPrecip[clickedPointIndex]?.y) ? [{
                    seriesIndex: 3,
                    dataPointIndex: clickedPointIndex,
                    fillColor: '#fff',
                    strokeColor: projectedPrecipColor,
                    size: 8,
                }] : []),
            ] : [],
        },
        xaxis: {
            type: 'datetime',
            crosshairs: { show: false },
            tooltip: { enabled: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        grid: {
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
        },
        plotOptions: {
            bar: {
                columnWidth: '60%',
                borderRadius: 3,
            },
        },
        states: {
            hover: {
                filter: { type: 'none' }
            },
            active: {
                filter: { type: 'none' }
            }
        },
        yaxis: [
            {
                seriesName: 'Temperature',
                title: {
                    text: 'Temperature (°C)',
                    style: {
                        color: TEMPERATURE_COLOR,
                        fontSize: '12px'
                    }
                },
                labels: {
                    style: { colors: TEMPERATURE_COLOR },
                    formatter: (value: number) => String(Math.round(value)),
                },
                show: true,
                min: minTemp,
                max: maxTemp,
                tickAmount: 5,
            },
            {
                seriesName: 'Temperature',
                show: false,
                min: minTemp,
                max: maxTemp,
            },
            {
                seriesName: 'Precipitation',
                opposite: true,
                title: {
                    text: 'Precipitation (mm)',
                    style: {
                        color: PRECIPITATION_COLOR,
                        fontSize: '12px'
                    }
                },
                labels: {
                    style: { colors: PRECIPITATION_COLOR },
                    formatter: (value: number) => String(Math.round(value)),
                },
                show: true,
                min: minPrecip,
                max: maxPrecip,
                tickAmount: 5,
            },
            {
                seriesName: 'Precipitation',
                opposite: true,
                show: false,
                min: minPrecip,
                max: maxPrecip,
            },
        ],
        tooltip: {
            shared: false,
            intersect: true,
            style: {
                fontSize: '12px',
            },
            theme: 'dark',
            y: {
                formatter: (value: number, { seriesIndex }: any) => {
                    const rounded = Math.round(value);
                    if (seriesIndex === 2 || seriesIndex === 3) {
                        return formatWithK(rounded);
                    }
                    return String(rounded);
                },
            },
            onDatasetHover: {
                highlightDataSeries: false,
            },
            custom: (options: any) => {
                const { dataPointIndex, seriesIndex, w } = options;

                const timestamp = w.globals.seriesX[seriesIndex]?.[dataPointIndex];
                if (!timestamp) return '';

                if (highlightMode === 'hover') {
                    setHoveredDate(timestamp);
                }

                const date = new Date(timestamp);
                const monthName = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
                const year = date.getUTCFullYear();
                const dateStr = `${monthName} ${year}`;

                // Look up values by timestamp match
                const histTempPoint = chartData.histTemp.find(p => p.x === timestamp);
                const projTempPoint = chartData.projTemp.find(p => p.x === timestamp);
                const histPrecipPoint = chartData.histPrecip.find(p => p.x === timestamp);
                const projPrecipPoint = chartData.projPrecip.find(p => p.x === timestamp);

                const histTempValue = histTempPoint?.y;
                const projTempValue = projTempPoint?.y;
                const histPrecipValue = histPrecipPoint?.y;
                const projPrecipValue = projPrecipPoint?.y;

                let tooltipContent = `
                    <div style="padding: 10px; background: rgba(0, 0, 0, 0.8); border-radius: 4px; color: white; font-size: 12px;">
                        <div style="font-weight: 600; margin-bottom: 8px;">${dateStr}</div>
                `;

                if (histTempValue != null && !isNaN(histTempValue)) {
                    tooltipContent += `
                        <div style="margin-bottom: 4px;">
                            <span style="color: ${TEMPERATURE_COLOR};">●</span> Temperature (Historical): <strong>${Math.round(histTempValue)}°C</strong>
                        </div>
                    `;
                }

                if (projTempValue != null && !isNaN(projTempValue)) {
                    tooltipContent += `
                        <div style="margin-bottom: 4px;">
                            <span style="color: ${projectedTempColor};">●</span> Temperature (Projected): <strong>${Math.round(projTempValue)}°C</strong>
                        </div>
                    `;
                }

                if (histPrecipValue != null && !isNaN(histPrecipValue)) {
                    tooltipContent += `
                        <div style="margin-bottom: 4px;">
                            <span style="color: ${PRECIPITATION_COLOR};">●</span> Precipitation (Historical): <strong>${formatWithK(Math.round(histPrecipValue))} mm</strong>
                        </div>
                    `;
                }

                if (projPrecipValue != null && !isNaN(projPrecipValue)) {
                    tooltipContent += `
                        <div>
                            <span style="color: ${projectedPrecipColor};">●</span> Precipitation (Projected): <strong>${formatWithK(Math.round(projPrecipValue))} mm</strong>
                        </div>
                    `;
                }

                tooltipContent += '</div>';
                return tooltipContent;
            },
        },
    });

    if (isLoading) return <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 2 }} />;
    if (error || !hasValidData) return <Typography color="error">No data available</Typography>;

    return (
        <Card sx={{ py: 2, width: '100%', display: 'flex', flexDirection: 'column', pl: 2 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, pt: 2, pb: 1 }}
            >
                <Typography variant="h6">{title}</Typography>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Chart
                    type="line"
                    series={[
                        ...(chartData.histTemp.length > 0
                            ? [{ name: 'Temperature (Historical)', type: 'line', data: chartData.histTemp }]
                            : []
                        ),
                        ...(chartData.projTemp.length > 0
                            ? [{ name: 'Temperature (Projected)', type: 'line', data: chartData.projTemp }]
                            : []
                        ),
                        ...(chartData.histPrecip.length > 0
                            ? [{ name: 'Precipitation (Historical)', type: 'column', data: chartData.histPrecip }]
                            : []
                        ),
                        ...(chartData.projPrecip.length > 0
                            ? [{ name: 'Precipitation (Projected)', type: 'column', data: chartData.projPrecip }]
                            : []
                        ),
                    ]}
                    options={{
                        ...chartOptions,
                        colors: seriesColors,
                    }}
                />
            </Box>
        </Card>
    );
}

