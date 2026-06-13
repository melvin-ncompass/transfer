import { formatWithK } from '../../../../utils/format-number';

// ----------------------------------------------------------------------

type DataPoint = {
    x: number;
    y: number;
};

type ClimateTooltipData = {
    timestamp: number;
    historicalTempData: DataPoint[];
    projectedTempData: DataPoint[];
    historicalPrecipData: DataPoint[];
    projectedPrecipData: DataPoint[];
    temperatureColor: string;
    projectedTempColor: string;
    precipitationColor: string;
    projectedPrecipColor: string;
};

/**
 * Generate custom tooltip HTML for climate chart
 * Shows temperature and precipitation data (historical and projected) for a given timestamp
 */
export function generateClimateTooltip(data: ClimateTooltipData): string {
    const {
        timestamp,
        historicalTempData,
        projectedTempData,
        historicalPrecipData,
        projectedPrecipData,
        temperatureColor,
        projectedTempColor,
        precipitationColor,
        projectedPrecipColor,
    } = data;

    if (!timestamp) return '';

    // Use UTC to avoid timezone issues
    const date = new Date(timestamp);
    const monthName = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    const dateStr = `${monthName} ${year}`;

    // Find matching data for the same timestamp across all series
    const histTempMatch = historicalTempData.find(d => d.x === timestamp);
    const projTempMatch = projectedTempData.find(d => d.x === timestamp);
    const histPrecipMatch = historicalPrecipData.find(d => d.x === timestamp);
    const projPrecipMatch = projectedPrecipData.find(d => d.x === timestamp);

    let tooltipContent = `
        <div style="padding: 10px; background: rgba(0, 0, 0, 0.8); border-radius: 4px; color: white; font-size: 12px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${dateStr}</div>
    `;

    // Show temperature data (historical or projected)
    if (histTempMatch && histTempMatch.y != null && !isNaN(histTempMatch.y)) {
        tooltipContent += `
            <div style="margin-bottom: 4px;">
                <span style="color: ${temperatureColor};">●</span> Temperature: <strong>${Math.round(histTempMatch.y)}(°C)</strong>
            </div>
        `;
    } else if (projTempMatch && projTempMatch.y != null && !isNaN(projTempMatch.y)) {
        tooltipContent += `
            <div style="margin-bottom: 4px;">
                <span style="color: ${projectedTempColor};">●</span> Temperature (Projected): <strong>${Math.round(projTempMatch.y)}(°C)</strong>
            </div>
        `;
    }

    // Show precipitation data (historical or projected)
    if (histPrecipMatch && histPrecipMatch.y != null && !isNaN(histPrecipMatch.y)) {
        tooltipContent += `
            <div>
                <span style="color: ${precipitationColor};">●</span> Precipitation: <strong>${formatWithK(Math.round(histPrecipMatch.y))}(mm)</strong>
            </div>
        `;
    } else if (projPrecipMatch && projPrecipMatch.y != null && !isNaN(projPrecipMatch.y)) {
        tooltipContent += `
            <div>
                <span style="color: ${projectedPrecipColor};">●</span> Precipitation (Projected): <strong>${formatWithK(Math.round(projPrecipMatch.y))}(mm)</strong>
            </div>
        `;
    }

    tooltipContent += '</div>';
    return tooltipContent;
}

/**
 * Get timestamp from tooltip options based on series index and data point index
 */
export function getTimestampFromTooltip(
    seriesIndex: number,
    dataPointIndex: number,
    historicalTempData: DataPoint[],
    projectedTempData: DataPoint[],
    historicalPrecipData: DataPoint[],
    projectedPrecipData: DataPoint[]
): number | null {
    if (dataPointIndex < 0) return null;

    // Get timestamp from the hovered series
    if (seriesIndex === 0 && historicalTempData[dataPointIndex]) {
        return historicalTempData[dataPointIndex].x;
    } 
    if (seriesIndex === 1 && projectedTempData[dataPointIndex]) {
        return projectedTempData[dataPointIndex].x;
    } 
    if (seriesIndex === 2 && historicalPrecipData[dataPointIndex]) {
        return historicalPrecipData[dataPointIndex].x;
    } 
    if (seriesIndex === 3 && projectedPrecipData[dataPointIndex]) {
        return projectedPrecipData[dataPointIndex].x;
    }

    return null;
}

