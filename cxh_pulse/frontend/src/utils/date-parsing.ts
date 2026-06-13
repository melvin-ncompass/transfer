/**
 * Date Parsing Utilities
 * 
 * Common utilities for parsing dates in UTC to avoid timezone issues.
 * All date parsing should use these functions to ensure consistency across charts.
 */

/**
 * Parse an ISO date string (e.g., "2022-01-01T00:00:00.000Z") and return a UTC timestamp
 * This ensures consistent date parsing regardless of user's timezone
 * 
 * @param dateString - ISO date string from API
 * @returns Timestamp in milliseconds (UTC)
 */
export function parseISODateToTimestamp(dateString: string): number {
    const date = new Date(dateString);
    return date.getTime();
}

/**
 * Parse an ISO date string and extract year/month in UTC
 * 
 * @param dateString - ISO date string from API (e.g., "2022-01-01T00:00:00.000Z")
 * @returns Object with year and month (1-12) in UTC
 */
export function parseISODateToYearMonth(dateString: string): { year: number; month: number } {
    const date = new Date(dateString);
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1, // getUTCMonth() returns 0-11, so add 1
    };
}

/**
 * Create a UTC timestamp for the first day of a given year and month
 * This is useful for chart data points where we want to represent a month
 * 
 * @param year - Year (e.g., 2022)
 * @param month - Month (1-12, where 1 = January)
 * @returns Timestamp in milliseconds (UTC)
 */
export function createUTCTimestampForMonth(year: number, month: number): number {
    return Date.UTC(year, month - 1, 1);
}

/**
 * Parse an ISO date string and create a UTC timestamp for the first day of that month
 * This combines parsing and timestamp creation in one step
 * 
 * @param dateString - ISO date string from API (e.g., "2022-01-01T00:00:00.000Z")
 * @returns Timestamp in milliseconds (UTC) for the first day of the month
 */
export function parseISODateToMonthTimestamp(dateString: string): number {
    const { year, month } = parseISODateToYearMonth(dateString);
    return createUTCTimestampForMonth(year, month);
}

/**
 * Get a formatted key string for year-month (e.g., "2022-01")
 * Useful for grouping/aggregating data by month
 * 
 * @param dateString - ISO date string from API
 * @returns Formatted key string "YYYY-MM"
 */
export function getYearMonthKey(dateString: string): string {
    const { year, month } = parseISODateToYearMonth(dateString);
    return `${year}-${String(month).padStart(2, '0')}`;
}

