import { useMemo, useRef, useCallback, useState } from 'react';
import { Card, Typography, Box, Stack, Skeleton, CircularProgress } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Chart, useChart, ChartExportMenu } from '../../../../components/chart';
import { TEMPERATURE_COLOR, PRECIPITATION_COLOR } from '../../../../utils/color';
import { formatWithK } from '../../../../utils/format-number';
import { useChartHover } from '../../climate';
import { useBrandedChartExport, LegendItem } from '../../../../hooks';
import { ReportGuard } from '../../components/protected-components/permission-guard';

// Series names for tracking visibility
const SERIES_NAMES = {
    TEMP_HIST: 'Temperature (Historical)',
    TEMP_PROJ: 'Temperature (Projected)',
    PRECIP_HIST: 'Precipitation (Historical)',
    PRECIP_PROJ: 'Precipitation (Projected)',
} as const;

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
    isFetching?: boolean;
};

export function ForecastClimateChart({ title, data, isLoading = false, error, isFetching, filterInfo, dateRange }: ForecastClimateChartProps & {
    filterInfo?: { location?: string; subcounty?: string; ward?: string };
    dateRange?: { from: Date; to: Date };
}) {
    const theme = useTheme();
    const chartRef = useRef<HTMLDivElement>(null);
    const { setHoveredDate, setClickedDate, highlightMode, clickedDate } = useChartHover();

    // Track which series are visible (toggled via legend clicks)
    // Default: all series visible
    const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({
        [SERIES_NAMES.TEMP_HIST]: true,
        [SERIES_NAMES.TEMP_PROJ]: true,
        [SERIES_NAMES.PRECIP_HIST]: true,
        [SERIES_NAMES.PRECIP_PROJ]: true,
    });

    const {
        chartData,
        minTemp,
        maxTemp,
        minPrecip,
        maxPrecip,
        projectionStartDate,
        projectionEndDate
    } = useMemo(() => {
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

        const timeline = Array.from(timelineMap.values()).sort((a, b) => a.timestamp - b.timestamp);

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

        if (histTempData.length > 0 && projTempData.length > 0) {
            const lastHistPoint = histTempData[histTempData.length - 1];
            // Ensure connection between historical and projected lines.
            // Using >= allows connecting even if timestamps align, ensuring a continuous visual line.
            if (projTempData[0].x >= lastHistPoint.x) {
                const firstProj = projTempData[0];
                // Only add the point if it's not already identical (same X and Y).
                // If X matches but Y differs, adding it draws a vertical connection.
                if (firstProj.x !== lastHistPoint.x || firstProj.y !== lastHistPoint.y) {
                    projTempData.unshift(lastHistPoint);
                }
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

    // Color definitions (must be before getLegendItems)
    const projectedTempColor = alpha(TEMPERATURE_COLOR, 0.6);
    const projectedPrecipColor = alpha(PRECIPITATION_COLOR, 0.5);

    // Callback to get series data for CSV export
    const getSeriesData = useCallback(() => ({
        type: 'line' as const,
        series: [
            { name: 'Historical Temperature (°C)', data: chartData.histTemp },
            { name: 'Projected Temperature (°C)', data: chartData.projTemp },
            { name: 'Historical Precipitation (mm)', data: chartData.histPrecip },
            { name: 'Projected Precipitation (mm)', data: chartData.projPrecip },
        ],
    }), [chartData]);

    // Callback to get legend items for native SVG/Canvas legend rendering
    // Legend visibility respects both: data exists AND series is toggled on (not hidden by user)
    // All markers use circles as per design requirement
    const getLegendItems = useCallback((): LegendItem[] => [
        {
            name: SERIES_NAMES.TEMP_HIST,
            color: TEMPERATURE_COLOR,
            visible: chartData.histTemp.length > 0 && seriesVisibility[SERIES_NAMES.TEMP_HIST],
            markerType: 'circle' as const,
        },
        {
            name: SERIES_NAMES.TEMP_PROJ,
            color: projectedTempColor,
            visible: chartData.projTemp.length > 0 && seriesVisibility[SERIES_NAMES.TEMP_PROJ],
            markerType: 'circle' as const,
        },
        {
            name: SERIES_NAMES.PRECIP_HIST,
            color: PRECIPITATION_COLOR,
            visible: chartData.histPrecip.length > 0 && seriesVisibility[SERIES_NAMES.PRECIP_HIST],
            markerType: 'circle' as const,
        },
        {
            name: SERIES_NAMES.PRECIP_PROJ,
            color: projectedPrecipColor,
            visible: chartData.projPrecip.length > 0 && seriesVisibility[SERIES_NAMES.PRECIP_PROJ],
            markerType: 'circle' as const,
        },
    ], [chartData, projectedTempColor, projectedPrecipColor, seriesVisibility]);

    // Branded export hook with native legend rendering
    const { exportPNG, exportSVG, exportCSV, isReady } = useBrandedChartExport({
        chartTitle: title,
        chartRef,
        getSeriesData,
        getLegendItems,
        filterInfo,
        dateRange,
    });

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
            toolbar: {
                show: false, // Using custom branded export menu instead
            },
            zoom: { enabled: false },
            animations: { enabled: true },
            height: 450,
            events: {
                legendClick: (_: any, seriesIndex: number, config: any) => {
                    // Track legend toggle state for export
                    const seriesName = config.config.series[seriesIndex]?.name;
                    if (seriesName) {
                        setSeriesVisibility(prev => ({
                            ...prev,
                            [seriesName]: !prev[seriesName],
                        }));
                    }
                },
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
            discrete: [
                ...(clickedPointIndex >= 0 ? [
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
                ] : []),
                // Hide the first projected point marker to avoid overlapping with historical and ensure smooth line
                ...(chartData.projTemp.length > 0 && chartData.histTemp.length > 0 ? [{
                    seriesIndex: 1,
                    dataPointIndex: 0,
                    size: 0,
                    fillColor: 'transparent',
                    strokeColor: 'transparent',
                }] : []),
            ]
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
        //center alignement of legend on smaller screens
        responsive: [
            {
                breakpoint: 900,
                options: {
                    legend: {
                        horizontalAlign: 'center',
                    },
                },
            },
        ],
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
                title: {
                    text: 'Temperature (°C)',
                    style: {
                        color: TEMPERATURE_COLOR,
                        fontSize: '12px'
                    },
                },
                labels: {
                    formatter: (value: number) => String(Math.round(value)),
                    style: {
                        colors: TEMPERATURE_COLOR,
                    },
                    minWidth: 80,
                    maxWidth: 80,
                },
                show: true,
                forceNiceScale: true,
                min: minTemp,
                max: maxTemp,
                tickAmount: 5,
            },
            {
                show: false,
                min: minTemp,
                max: maxTemp,
                tickAmount: 5,
            },
            {
                opposite: true,
                title: {
                    text: 'Precipitation (mm)',
                    style: {
                        color: PRECIPITATION_COLOR,
                        fontSize: '12px'
                    },
                },
                labels: {
                    formatter: (value: number) => String(Math.round(value)),
                    style: {
                        colors: PRECIPITATION_COLOR,
                    },
                    minWidth: 35,
                    maxWidth: 35,
                },
                show: true,
                forceNiceScale: true,
                min: minPrecip,
                max: maxPrecip,
                tickAmount: 5,
            },
            {
                opposite: true,
                show: false,
                min: minPrecip,
                max: maxPrecip,
                tickAmount: 5,
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

                // Check if historical data exists for this timestamp
                const hasHistoricalTemp = histTempValue != null && !isNaN(histTempValue);
                const hasHistoricalPrecip = histPrecipValue != null && !isNaN(histPrecipValue);

                if (hasHistoricalTemp) {
                    tooltipContent += `
                        <div style="margin-bottom: 4px;">
                            <span style="color: ${TEMPERATURE_COLOR};">●</span> Temperature (Historical): <strong>${Math.round(histTempValue)}°C</strong>
                        </div>
                    `;
                }

                // Only show projected temp if no historical temp exists for this point
                if (!hasHistoricalTemp && projTempValue != null && !isNaN(projTempValue)) {
                    tooltipContent += `
                        <div style="margin-bottom: 4px;">
                            <span style="color: ${projectedTempColor};">●</span> Temperature (Projected): <strong>${Math.round(projTempValue)}°C</strong>
                        </div>
                    `;
                }

                if (hasHistoricalPrecip) {
                    tooltipContent += `
                        <div style="margin-bottom: 4px;">
                            <span style="color: ${PRECIPITATION_COLOR};">●</span> Precipitation (Historical): <strong>${formatWithK(Math.round(histPrecipValue))} mm</strong>
                        </div>
                    `;
                }

                // Only show projected precip if no historical precip exists for this point
                if (!hasHistoricalPrecip && projPrecipValue != null && !isNaN(projPrecipValue)) {
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
        <Card sx={{ py: 2, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 4, pt: 1, pb: 2 }}
            >
                <Typography variant="h6">{title}</Typography>
                <ReportGuard>
                    <ChartExportMenu
                        onExportPNG={exportPNG}
                        onExportSVG={exportSVG}
                        onExportCSV={exportCSV}
                        visible={!isLoading && !isFetching}
                    />
                </ReportGuard>
            </Stack>

            <Box ref={chartRef} sx={{ flex: 1, minHeight: 0, position: 'relative', width: '100%', pl: 2 }}>
                <Chart
                    type="line"
                    series={[
                        chartData.histTemp.length > 0
                            ? { name: 'Temperature (Historical)', type: 'line', data: chartData.histTemp }
                            : { name: 'Temperature (Historical)', type: 'line', data: [] },
                        chartData.projTemp.length > 0
                            ? { name: 'Temperature (Projected)', type: 'line', data: chartData.projTemp }
                            : { name: 'Temperature (Projected)', type: 'line', data: [] },
                        chartData.histPrecip.length > 0
                            ? { name: 'Precipitation (Historical)', type: 'column', data: chartData.histPrecip }
                            : { name: 'Precipitation (Historical)', type: 'column', data: [] },
                        chartData.projPrecip.length > 0
                            ? { name: 'Precipitation (Projected)', type: 'column', data: chartData.projPrecip }
                            : { name: 'Precipitation (Projected)', type: 'column', data: [] },
                    ]}
                    options={{
                        ...chartOptions,
                        chart: {
                            ...(chartOptions?.chart || {}),
                            type: 'line',
                        },
                        plotOptions: {
                            bar: {
                                columnWidth: '60%',
                                borderRadius: 3,
                            },
                        },
                        colors: seriesColors,
                        yaxis: [
                            {
                                title: {
                                    text: 'Temperature (°C)',
                                    style: {
                                        color: TEMPERATURE_COLOR,
                                    },
                                },
                                labels: {
                                    formatter: (value: number) => String(Math.round(value)),
                                    style: {
                                        colors: TEMPERATURE_COLOR,
                                    },
                                },
                                show: true,
                                forceNiceScale: true,
                                min: minTemp,
                                max: maxTemp,
                                tickAmount: 5,
                            },
                            {
                                show: false,
                                min: minTemp,
                                max: maxTemp,
                                tickAmount: 5,
                            },
                            {
                                opposite: true,
                                title: {
                                    text: 'Precipitation (mm)',
                                    style: {
                                        color: PRECIPITATION_COLOR,
                                    },
                                },
                                labels: {
                                    formatter: (value: number) => String(Math.round(value)),
                                    style: {
                                        colors: PRECIPITATION_COLOR,
                                    },
                                    minWidth: 35,
                                    maxWidth: 35,
                                },
                                show: true,
                                forceNiceScale: true,
                                min: minPrecip,
                                max: maxPrecip,
                                tickAmount: 5,
                            },
                            {
                                opposite: true,
                                show: false,
                                min: minPrecip,
                                max: maxPrecip,
                                tickAmount: 5,
                            },
                        ],
                    }}
                />
                {isFetching && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(1px)',
                        }}
                    >
                        <CircularProgress size={34} />
                    </Box>
                )}
            </Box>
        </Card>
    );
}

