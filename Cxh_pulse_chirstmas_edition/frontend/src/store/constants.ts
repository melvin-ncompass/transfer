export const COUNTY_NAME = 'KAJIADO';

// Date Range Constants
// These define the valid date range for date pickers across the application
export const DATE_RANGE_MIN_YEAR = 2022;
export const DATE_RANGE_MAX_YEAR = 2025;
export const DATE_RANGE_MIN_MONTH = 0; // January (0-indexed)
export const DATE_RANGE_MAX_MONTH = 9; // October (0-indexed)

// Helper functions to get Date objects
export const getDateLastYearDate = (): Date =>
  new Date(DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH - 11, 1);

export const getDateRangeMinDate = (): Date =>
  new Date(DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH, 1);

export const getDateRangeMaxDate = (): Date =>
  new Date(DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH, 1);
