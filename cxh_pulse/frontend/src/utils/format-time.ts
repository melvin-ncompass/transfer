import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { DatePickerFormat } from '../types';

// ----------------------------------------------------------------------

/**
 * Date and Time Formatting Utilities
 *
 * This module provides convenient functions for formatting dates and times
 * using Day.js library. Supports multiple format patterns and relative time.
 *
 * Documentation:
 * - Formats: https://day.js.org/docs/en/display/format
 * - Timezones: https://day.js.org/docs/en/timezone/set-default-timezone
 *
 * To use UTC:
 * ```ts
 * import utc from 'dayjs/plugin/utc';
 * dayjs.extend(utc);
 * dayjs().utc().format()
 * ```
 */

// Extend dayjs with plugins
dayjs.extend(duration); // For duration calculations
dayjs.extend(relativeTime); // For "2 hours ago" style formatting

// ----------------------------------------------------------------------

/**
 * Predefined date/time format patterns
 *
 * Use these constants for consistent formatting across the app
 */
export const formatPatterns = {
  dateTime: 'DD MMM YYYY h:mm a', // 17 Apr 2022 12:00 am
  date: 'DD MMM YYYY', // 17 Apr 2022
  time: 'h:mm a', // 12:00 am
  split: {
    dateTime: 'DD/MM/YYYY h:mm a', // 17/04/2022 12:00 am
    date: 'DD/MM/YYYY', // 17/04/2022
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a', // 17-04-2022 12:00 am
    date: 'DD-MM-YYYY', // 17-04-2022
  },
};

/**
 * Validates if a date value is valid
 *
 * @param date - Date value to validate
 * @returns true if date is valid, false otherwise
 */
const isValidDate = (date: DatePickerFormat) =>
  date !== null && date !== undefined && dayjs(date).isValid();

// ----------------------------------------------------------------------

/**
 * Formats a date with time
 *
 * @example
 * fDateTime(new Date()) // "17 Apr 2022 12:00 am"
 * fDateTime(new Date(), 'YYYY-MM-DD HH:mm') // "2022-04-17 12:00"
 *
 * @param date - Date to format
 * @param template - Optional custom format pattern (defaults to formatPatterns.dateTime)
 * @returns Formatted date string or "Invalid date"
 */
export function fDateTime(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.dateTime);
}

// ----------------------------------------------------------------------

/**
 * Formats a date without time
 *
 * @example
 * fDate(new Date()) // "17 Apr 2022"
 * fDate(new Date(), 'DD/MM/YYYY') // "17/04/2022"
 *
 * @param date - Date to format
 * @param template - Optional custom format pattern (defaults to formatPatterns.date)
 * @returns Formatted date string or "Invalid date"
 */
export function fDate(date: DatePickerFormat, template?: string): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).format(template ?? formatPatterns.date);
}

// ----------------------------------------------------------------------

/**
 * Formats a date as relative time from now
 *
 * Perfect for displaying "time ago" style timestamps
 *
 * @example
 * fToNow(Date.now() - 5000) // "a few seconds"
 * fToNow(Date.now() - 3600000) // "an hour"
 * fToNow(Date.now() - 86400000 * 30) // "a month"
 *
 * @param date - Date to format
 * @returns Relative time string or "Invalid date"
 */
export function fToNow(date: DatePickerFormat): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  return dayjs(date).toNow(true); // true removes the "ago" suffix
}

// ----------------------------------------------------------------------

/**
 * Month names array (1-indexed: January = 1, December = 12)
 */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Gets the month name from a month number
 *
 * @example
 * getMonthName(1) // "January"
 * getMonthName(12) // "December"
 * getMonthName('3') // "March"
 *
 * @param month - Month number (1-12) or string representation
 * @returns Month name string or empty string if invalid
 */
export function getMonthName(month: number | string): string {
  const monthNum = typeof month === 'string' ? parseInt(month, 10) : month;

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return '';
  }

  return MONTH_NAMES[monthNum - 1];
}

// ----------------------------------------------------------------------

/**
 * Month abbreviations array (1-indexed: January = 1, December = 12)
 */
const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Gets the month abbreviation from a month number
 *
 * @example
 * getMonthAbbreviation(1) // "Jan"
 * getMonthAbbreviation(12) // "Dec"
 * getMonthAbbreviation('3') // "Mar"
 *
 * @param month - Month number (1-12) or string representation
 * @returns Month abbreviation string or empty string if invalid
 */
export function getMonthAbbreviation(month: number | string): string {
  const monthNum = typeof month === 'string' ? parseInt(month, 10) : month;

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return '';
  }

  return MONTH_ABBREVIATIONS[monthNum - 1];
}

// ----------------------------------------------------------------------

/**
 * Flexible date formatter that supports different input and output formats
 *
 * @example
 * formatDate(new Date(2024, 0, 15), 'MMM YYYY') // "Jan 2024"
 * formatDate('2024-01-15', 'MMMM YYYY') // "January 2024"
 * formatDate('2024-01-15', 'MMM YYYY', 'YYYY-MM-DD') // "Jan 2024" (input format specified)
 * formatDate(1705276800000, 'DD MMM YYYY') // "15 Jan 2024"
 *
 * @param date - Date value (Date, string, number, or DatePickerFormat)
 * @param outputFormat - Output format pattern (defaults to 'DD MMM YYYY')
 *   Common formats:
 *   - 'MMM YYYY': "Jan 2024"
 *   - 'MMMM YYYY': "January 2024"
 *   - 'DD MMM YYYY': "15 Jan 2024"
 *   - 'YYYY-MM': "2024-01"
 *   - 'MM/YYYY': "01/2024"
 * @param inputFormat - Optional input format pattern if date is a string
 *   Examples: 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss.SSSZ', etc.
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  date: DatePickerFormat,
  outputFormat: string = 'DD MMM YYYY',
  inputFormat?: string
): string {
  if (date === null || date === undefined) {
    return '';
  }

  const dayjsDate = inputFormat ? dayjs(date, inputFormat) : dayjs(date);

  if (!dayjsDate.isValid()) {
    return '';
  }

  return dayjsDate.format(outputFormat);
}
