import { formatWithK } from '../../../../utils/format-number';
import { TEMPERATURE_COLOR, PRECIPITATION_COLOR } from '../../../../utils/color';

export function buildTooltipContent(
    dataPointIndex: number,
    temperatureChartData: Array<{ x: number; y: number | null }>,
    precipitationChartData: Array<{ x: number; y: number | null }>,
    highlightMode: 'hover' | 'click' | 'none',
    setHoveredDate: (date: number | null) => void
): string {
    const maxLength = Math.max(temperatureChartData.length, precipitationChartData.length);

    if (highlightMode === 'hover') {
        if (dataPointIndex >= 0 && dataPointIndex < maxLength) {
            const timestamp = temperatureChartData[dataPointIndex]?.x || precipitationChartData[dataPointIndex]?.x;
            const hasTemperatureData = temperatureChartData[dataPointIndex]?.y != null && !isNaN(temperatureChartData[dataPointIndex]?.y);
            const hasPrecipitationData = precipitationChartData[dataPointIndex]?.y != null && !isNaN(precipitationChartData[dataPointIndex]?.y);

            if (timestamp && (hasTemperatureData || hasPrecipitationData)) {
                setHoveredDate(timestamp);
            } else {
                setHoveredDate(null);
            }
        } else {
            setHoveredDate(null);
        }
    }

    if (dataPointIndex >= 0 && dataPointIndex < maxLength) {
        const timestamp = temperatureChartData[dataPointIndex]?.x || precipitationChartData[dataPointIndex]?.x;
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const monthName = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        const year = date.getUTCFullYear();
        const dateStr = `${monthName} ${year}`;

        const tempValue = temperatureChartData[dataPointIndex]?.y;
        const precipValue = precipitationChartData[dataPointIndex]?.y;

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
    }

    return '';
}

