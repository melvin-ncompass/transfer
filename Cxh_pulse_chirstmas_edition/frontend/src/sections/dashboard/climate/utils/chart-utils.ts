/**
 * Chart Data Processing Utilities
 * 
 * Utilities for processing and transforming climate data for charts
 */

export interface MonthlyDataPoint {
    year: number;
    month: number;
    value: number;
}

export interface ChartDataPoint {
    x: number; // timestamp
    y: number; // value
}

/**
 * Process monthly data into chart-ready format
 * Aggregates data by month and converts to timestamps
 */
export function processMonthlyData<T extends { monthdate: string }>(
    data: T[],
    valueExtractor: (item: T) => number
): ChartDataPoint[] {
    const dataMap = new Map<string, number>();

    data.forEach((item) => {
        // Parse date string in format "YYYY-MM" (e.g., "2024-11")
        const [yearStr, monthStr] = item.monthdate.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10); // Month is already 1-indexed (1-12)
        const key = `${year}-${String(month).padStart(2, '0')}`;

        // Aggregate if multiple entries exist for same month
        const existing = dataMap.get(key) || 0;
        const value = valueExtractor(item) || 0;
        dataMap.set(key, existing + value);
    });

    const monthlyArray = Array.from(dataMap.entries())
        .map(([key, value]) => {
            const [year, month] = key.split('-').map(Number);
            return {
                year,
                month,
                value,
            };
        })
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

    return monthlyArray.map((d) => {
        // Use UTC to avoid timezone issues - create date at midnight UTC
        const date = new Date(Date.UTC(d.year, d.month - 1, 1));
        return {
            x: date.getTime(),
            y: d.value,
        };
    });
}

/**
 * Calculate min/max values with padding for chart axes
 */
export function calculateAxisBounds(
    data: ChartDataPoint[],
    options: {
        minValue?: number;
        paddingPercent?: number;
        forceZeroMin?: boolean;
    } = {}
): { min: number; max: number } {
    const {
        minValue = 0,
        paddingPercent = 10,
        forceZeroMin = true,
    } = options;

    const values = data.map(d => d.y).filter(y => y !== null && !isNaN(y));

    if (values.length === 0) {
        return { min: minValue, max: 100 };
    }

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    const min = forceZeroMin ? 0 : dataMin;
    const max = Math.ceil(dataMax * (1 + paddingPercent / 100));

    return { min, max };
}

/**
 * Find the index of a data point by timestamp
 */
export function findDataPointIndex(
    temperatureData: ChartDataPoint[],
    precipitationData: ChartDataPoint[],
    timestamp: number | null
): number {
    if (!timestamp) return -1;

    const maxLength = Math.max(temperatureData.length, precipitationData.length);

    for (let i = 0; i < maxLength; i++) {
        const tempTimestamp = temperatureData[i]?.x;
        const precipTimestamp = precipitationData[i]?.x;

        if (tempTimestamp === timestamp || precipTimestamp === timestamp) {
            // Check if there's valid data at this point
            const hasTemperatureData = temperatureData[i]?.y != null && !isNaN(temperatureData[i]?.y);
            const hasPrecipitationData = precipitationData[i]?.y != null && !isNaN(precipitationData[i]?.y);

            if (hasTemperatureData || hasPrecipitationData) {
                return i;
            }
        }
    }

    return -1;
}

/**
 * Check if data point has valid data
 */
export function hasValidDataAtIndex(
    temperatureData: ChartDataPoint[],
    precipitationData: ChartDataPoint[],
    index: number
): { hasTemperature: boolean; hasPrecipitation: boolean } {
    return {
        hasTemperature: temperatureData[index]?.y != null && !isNaN(temperatureData[index]?.y),
        hasPrecipitation: precipitationData[index]?.y != null && !isNaN(precipitationData[index]?.y),
    };
}

/**
 * Format date for tooltip display
 */
export function formatTooltipDate(timestamp: number): string {
    const date = new Date(timestamp);
    const monthName = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    return `${monthName} ${year}`;
}
