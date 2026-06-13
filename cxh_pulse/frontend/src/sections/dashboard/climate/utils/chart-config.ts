import { TEMPERATURE_COLOR, PRECIPITATION_COLOR } from '../../../../utils/color';
import { formatWithK } from '../../../../utils/format-number';

/**
 * Chart Configuration Utilities
 * 
 * Reusable chart configurations for climate-related charts
 */

/**
 * Common chart options for temperature and precipitation charts
 */
export const getBaseChartOptions = () => ({
    chart: {
        toolbar: {
            show: false,
        },
    },
    stroke: {
        curve: 'smooth' as const,
        width: 2,
    },
    legend: {
        show: false,
    },
    xaxis: {
        type: 'datetime' as const,
        crosshairs: {
            show: false,
        },
        tooltip: {
            enabled: false,
        },
    },
});

/**
 * Get marker configuration for highlighted data points
 */
export const getMarkerConfig = (
    clickedPointIndex: number,
    showTemperature: boolean,
    showPrecipitation: boolean,
    hasTemperatureData: boolean,
    hasPrecipitationData: boolean
) => ({
    size: 4,
    ...(clickedPointIndex >= 0 && {
        discrete: [
            ...(showTemperature && hasTemperatureData ? [{
                seriesIndex: 0,
                dataPointIndex: clickedPointIndex,
                fillColor: '#fff',
                strokeColor: TEMPERATURE_COLOR,
                size: 8,
            }] : []),
            ...(showPrecipitation && hasPrecipitationData ? [{
                seriesIndex: 1,
                dataPointIndex: clickedPointIndex,
                fillColor: '#fff',
                strokeColor: PRECIPITATION_COLOR,
                size: 8,
            }] : []),
        ],
    }),
});

/**
 * Get annotation configuration for clicked point
 */
export const getAnnotationConfig = (
    clickedPointIndex: number,
    timestamp: number | undefined
) => ({
    ...(clickedPointIndex >= 0 && timestamp && {
        xaxis: [{
            x: timestamp,
            strokeDashArray: 4,
            borderColor: '#999',
            borderWidth: 1,
            opacity: 0.6,
        }],
    }),
});

/**
 * Get dual y-axis configuration for temperature and precipitation
 */
export const getDualYAxisConfig = (
    showTemperature: boolean,
    showPrecipitation: boolean,
    minTemp: number,
    maxTemp: number,
    minPrecip: number,
    maxPrecip: number
) => [
        {
            title: {
                text: 'Temperature (°C)',
                style: {
                    color: showTemperature ? TEMPERATURE_COLOR : 'transparent',
                },
            },
            labels: {
                formatter: (value: number) => String(Math.round(value)),
                style: {
                    colors: showTemperature ? TEMPERATURE_COLOR : 'transparent',
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
            opposite: true,
            title: {
                text: 'Precipitation (mm)',
                style: {
                    color: showPrecipitation ? PRECIPITATION_COLOR : 'transparent',
                },
            },
            labels: {
                formatter: (value: number) => String(Math.round(value)),
                style: {
                    colors: showPrecipitation ? PRECIPITATION_COLOR : 'transparent',
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
    ];

/**
 * Get tooltip configuration
 */
export const getTooltipConfig = () => ({
    shared: true,
    intersect: false,
    style: {
        fontSize: '12px',
    },
    theme: 'dark' as const,
    y: {
        formatter: (value: number, { seriesIndex }: any) => {
            const rounded = Math.round(value);
            // If it's the precipitation series (index 1), use k formatting
            if (seriesIndex === 1) {
                return formatWithK(rounded);
            }
            // Temperature series (index 0) - just round
            return String(rounded);
        },
    },
    onDatasetHover: {
        highlightDataSeries: false,
    },
});

/**
 * Build custom tooltip HTML
 */
export const buildTooltipHTML = (
    dateStr: string,
    tempValue: number | undefined,
    precipValue: number | undefined
): string => {
    let tooltipContent = `
        <div style="padding: 10px; background: rgba(0, 0, 0, 0.8); border-radius: 4px; color: white; font-size: 12px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${dateStr}</div>
    `;

    if (tempValue != null && !isNaN(tempValue)) {
        tooltipContent += `
            <div style="margin-bottom: 4px;">
                <span style="color: ${TEMPERATURE_COLOR};">●</span> Temperature: <strong>${Math.round(tempValue)}(°C)</strong>
            </div>
        `;
    }

    if (precipValue != null && !isNaN(precipValue)) {
        tooltipContent += `
            <div>
                <span style="color: ${PRECIPITATION_COLOR};">●</span> Precipitation: <strong>${formatWithK(Math.round(precipValue))}(mm)</strong>
            </div>
        `;
    }

    tooltipContent += '</div>';
    return tooltipContent;
};

/**
 * Chart color scheme
 */
export const CHART_COLORS = [TEMPERATURE_COLOR, PRECIPITATION_COLOR];
