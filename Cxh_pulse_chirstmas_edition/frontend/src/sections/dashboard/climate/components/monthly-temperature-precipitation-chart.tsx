import { useMemo, useState, useRef } from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import { Chart } from '../../../../components/chart';
import { TEMPERATURE_COLOR, PRECIPITATION_COLOR } from '../../../../utils/color';
import { useChartHover } from '../contexts/chart-hover-context';
import { calculateAxisBounds, processMonthlyData } from '../utils/chart-utils';
import { buildTooltipContent } from '../utils/chart-tooltip-utils';
import { buildChartOptions } from '../utils/chart-options-utils';
import { ToggleSwitches } from './toggle-switches';
import { monthlyTemperaturePrecipitationChartStyles } from '../../../../styles/sections/monthly-temperature-precipitation-chart.styles';
import type { MonthlyTemperaturePrecipitationChartProps } from '../../../../types/sections.types';

export function MonthlyTemperaturePrecipitationChart({
    temperatureData,
    precipitationData,
    onTitleClick,
    isTitleClickable = false,
    hideTitle = false,
}: MonthlyTemperaturePrecipitationChartProps) {
    const [showTemperature, setShowTemperature] = useState(true);
    const [showPrecipitation, setShowPrecipitation] = useState(true);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartHeight = 330;
    const { setHoveredDate, setClickedDate, highlightMode, clickedDate } = useChartHover();

    const temperatureChartData = useMemo(
        () => processMonthlyData(temperatureData, (item) => item.temperature),
        [temperatureData]
    );

    const precipitationChartData = useMemo(
        () => processMonthlyData(precipitationData, (item) => item.precipitation),
        [precipitationData]
    );

    const { minTemp, maxTemp, minPrecip, maxPrecip } = useMemo(() => {
        const tempBounds = calculateAxisBounds(temperatureChartData, { forceZeroMin: true, paddingPercent: 10 });
        const precipBounds = calculateAxisBounds(precipitationChartData, { forceZeroMin: true, paddingPercent: 10 });

        return {
            minTemp: tempBounds.min,
            maxTemp: tempBounds.max,
            minPrecip: precipBounds.min,
            maxPrecip: precipBounds.max,
        };
    }, [temperatureChartData, precipitationChartData]);

    const hasValidData = (temperatureData.length > 0 && temperatureChartData.length > 0) ||
        (precipitationData.length > 0 && precipitationChartData.length > 0);

    const clickedPointIndex = useMemo(() => {
        if (!clickedDate || highlightMode !== 'click') return -1;

        const maxLength = Math.max(temperatureChartData.length, precipitationChartData.length);

        for (let i = 0; i < maxLength; i++) {
            const tempTimestamp = temperatureChartData[i]?.x;
            const precipTimestamp = precipitationChartData[i]?.x;

            if (tempTimestamp === clickedDate || precipTimestamp === clickedDate) {
                const hasTemperatureData = temperatureChartData[i]?.y != null && !isNaN(temperatureChartData[i]?.y);
                const hasPrecipitationData = precipitationChartData[i]?.y != null && !isNaN(precipitationChartData[i]?.y);

                if (hasTemperatureData || hasPrecipitationData) {
                    return i;
                }
            }
        }

        return -1;
    }, [clickedDate, highlightMode, temperatureChartData, precipitationChartData]);

    // NOTE: We intentionally do NOT clear clickedDate when the month goes out of range.
    // This allows the selection to persist, so when the month comes back into view,
    // the highlight automatically reappears. The clickedPointIndex will return -1
    // when the date is not in the current dataset, hiding the highlight temporarily.

    const tooltipBuilder = useMemo(
        () => (dataPointIndex: number) => buildTooltipContent(
            dataPointIndex,
            temperatureChartData,
            precipitationChartData,
            highlightMode,
            setHoveredDate
        ),
        [temperatureChartData, precipitationChartData, highlightMode, setHoveredDate]
    );

    const chartOptions = useMemo(
        () => buildChartOptions({
            temperatureChartData,
            precipitationChartData,
            showTemperature,
            showPrecipitation,
            minTemp,
            maxTemp,
            minPrecip,
            maxPrecip,
            clickedPointIndex,
            clickedDate,
            highlightMode,
            setHoveredDate,
            setClickedDate,
            buildTooltipContent: tooltipBuilder,
        }),
        [
            temperatureChartData,
            precipitationChartData,
            showTemperature,
            showPrecipitation,
            minTemp,
            maxTemp,
            minPrecip,
            maxPrecip,
            clickedPointIndex,
            clickedDate,
            highlightMode,
            setHoveredDate,
            setClickedDate,
            tooltipBuilder,
        ]
    );

    return (
        <Card sx={monthlyTemperaturePrecipitationChartStyles.card(hideTitle)}>
            {!hideTitle && (
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    justifyContent="space-between"
                    sx={monthlyTemperaturePrecipitationChartStyles.headerStack}
                >
                    <Typography
                        variant="h6"
                        sx={monthlyTemperaturePrecipitationChartStyles.title(isTitleClickable)}
                        onClick={isTitleClickable ? onTitleClick : undefined}
                    >
                        Monthly Temperature & Precipitation Trend
                    </Typography>
                    <ToggleSwitches
                        showTemperature={showTemperature}
                        showPrecipitation={showPrecipitation}
                        onTemperatureChange={setShowTemperature}
                        onPrecipitationChange={setShowPrecipitation}
                    />
                </Stack>
            )}

            {!hasValidData ? (
                <Box sx={monthlyTemperaturePrecipitationChartStyles.noDataContainer}>
                    <Typography variant="body2">No data found</Typography>
                </Box>
            ) : (
                <Box sx={monthlyTemperaturePrecipitationChartStyles.chartWrapper}>
                    <Box
                        ref={chartContainerRef}
                        sx={monthlyTemperaturePrecipitationChartStyles.chartContainer}
                    >
                        <Chart
                            type="line"
                            series={[
                                {
                                    name: 'Temperature',
                                    type: 'line',
                                    data: showTemperature ? temperatureChartData : [],
                                },
                                {
                                    name: 'Precipitation',
                                    type: 'column',
                                    data: showPrecipitation ? precipitationChartData : [],
                                },
                            ]}
                            options={{
                                ...chartOptions,
                                chart: {
                                    ...(chartOptions?.chart || {}),
                                    type: 'line',
                                    height: chartHeight,
                                },
                                plotOptions: {
                                    bar: {
                                        columnWidth: '60%',
                                        borderRadius: 2,
                                    },
                                },
                                yaxis: chartOptions?.yaxis,
                                colors: [TEMPERATURE_COLOR, PRECIPITATION_COLOR],
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Card>
    );
}
