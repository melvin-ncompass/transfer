import type { Dayjs } from 'dayjs';

/**
 * Utility Types
 * 
 * This file contains all type definitions for utility functions
 */

// ==================== Date/Time Formatting ====================

/**
 * Accepted date input types for date formatting functions
 * 
 * Supports multiple input formats:
 * - Dayjs objects
 * - Native Date objects
 * - ISO string dates
 * - Unix timestamps (numbers)
 * - null/undefined for invalid dates
 */
export type DatePickerFormat = Dayjs | Date | string | number | null | undefined;

/**
 * Predefined date/time format patterns
 * 
 * Available patterns:
 * - dateTime: "DD MMM YYYY h:mm a" (17 Apr 2022 12:00 am)
 * - date: "DD MMM YYYY" (17 Apr 2022)
 * - time: "h:mm a" (12:00 am)
 * - split.dateTime: "DD/MM/YYYY h:mm a" (17/04/2022 12:00 am)
 * - split.date: "DD/MM/YYYY" (17/04/2022)
 * - paramCase.dateTime: "DD-MM-YYYY h:mm a" (17-04-2022 12:00 am)
 * - paramCase.date: "DD-MM-YYYY" (17-04-2022)
 */
export interface FormatPatterns {
  dateTime: string;
  date: string;
  time: string;
  split: {
    dateTime: string;
    date: string;
  };
  paramCase: {
    dateTime: string;
    date: string;
  };
}

// ==================== Number Formatting ====================

/**
 * Accepted input types for number formatting functions
 * 
 * Supports:
 * - String numbers ("123.45")
 * - Number primitives (123.45)
 * - null/undefined for empty values
 */
export type InputNumberValue = string | number | null | undefined;

/**
 * Intl.NumberFormat options type alias
 * 
 * Used for customizing number formatting behavior
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
 */
export type NumberFormatOptions = Intl.NumberFormatOptions;

/**
 * Locale configuration for number and currency formatting
 * 
 * Defines:
 * - code: Locale code (e.g., 'en-US', 'es-ES')
 * - currency: Currency code (e.g., 'USD', 'EUR')
 */
export interface LocaleConfig {
  code: string;
  currency: string;
}
