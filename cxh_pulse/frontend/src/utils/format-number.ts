import type { InputNumberValue } from '../types';

/**
 * Number Formatting Utilities
 *
 * This module provides functions for formatting numbers in various ways:
 * - Standard numbers with locale formatting
 * - Currency values
 * - Percentages
 * - Shortened numbers (1.2k, 1.5M, etc.)
 *
 * All functions use Intl.NumberFormat for proper internationalization
 *
 * Locale codes reference:
 * https://gist.github.com/raushankrjha/d1c7e35cf87e69aa8b4208a8171a8416
 */

/**
 * Intl.NumberFormat options type
 */
type Options = Intl.NumberFormatOptions;

/**
 * Default locale settings
 * Change these for your region/currency
 */
const DEFAULT_LOCALE = { code: 'en-US', currency: 'USD' };

/**
 * Processes and validates input number
 *
 * @param inputValue - Value to process
 * @returns Validated number or null if invalid
 */
function processInput(inputValue: InputNumberValue): number | null {
  if (inputValue == null || Number.isNaN(inputValue)) return null;
  return Number(inputValue);
}

// ----------------------------------------------------------------------

/**
 * Formats a number with locale-specific formatting
 *
 * @example
 * fNumber(1234567.89) // "1,234,567.89"
 * fNumber(1234567.89, { maximumFractionDigits: 0 }) // "1,234,568"
 *
 * @param inputValue - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string or empty string if invalid
 */
export function fNumber(inputValue: InputNumberValue, options?: Options) {
  const locale = DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  return fm;
}

// ----------------------------------------------------------------------

/**
 * Formats a number as currency
 *
 * @example
 * fCurrency(1234.56) // "$1,234.56"
 * fCurrency(1234.56, { currency: 'EUR' }) // "€1,234.56"
 *
 * @param inputValue - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string or empty string if invalid
 */
export function fCurrency(inputValue: InputNumberValue, options?: Options) {
  const locale = DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    style: 'currency',
    currency: locale.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  return fm;
}

// ----------------------------------------------------------------------

/**
 * Formats a number as a percentage
 *
 * Note: Input should be the actual number (e.g., 45 for 45%, not 0.45)
 *
 * @example
 * fPercent(45) // "45%"
 * fPercent(12.5) // "12.5%"
 * fPercent(100) // "100%"
 *
 * @param inputValue - Number to format (will be divided by 100)
 * @param options - Intl.NumberFormat options
 * @returns Formatted percentage string or empty string if invalid
 */
export function fPercent(inputValue: InputNumberValue, options?: Options) {
  const locale = DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options,
  }).format(number / 100); // Divide by 100 for percentage

  return fm;
}

// ----------------------------------------------------------------------

/**
 * Formats a number in shortened/compact notation
 *
 * Perfect for displaying large numbers in limited space
 *
 * @example
 * fShortenNumber(1234) // "1.2k"
 * fShortenNumber(1234567) // "1.2m"
 * fShortenNumber(1234567890) // "1.2b"
 *
 * @param inputValue - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Shortened number string (lowercase k, m, b) or empty string if invalid
 */
export function fShortenNumber(inputValue: InputNumberValue, options?: Options) {
  const locale = DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    notation: 'compact', // Use compact notation (K, M, B)
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  // Convert uppercase suffixes to lowercase (K -> k, M -> m)
  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

// ----------------------------------------------------------------------

/**
 * Formats a number with 'k' suffix for thousands
 *
 * @example
 * formatWithK(1500) // "1.50k"
 * formatWithK(500) // "500"
 * formatWithK(1234.56) // "1.23k"
 *
 * @param inputValue - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with 'k' suffix if >= 1000, otherwise the number as string
 */
export function formatWithK(inputValue: InputNumberValue, decimals: number = 2): string {
  const number = processInput(inputValue);
  if (number === null) return '';

  if (number >= 1000) {
    return `${(number / 1000).toFixed(decimals)}k`;
  }
  return String(number);
}

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

export function meterToMillimeter(meter: number): number {
  return meter * 1000;
}

export function meterToCentimeter(meter: number): number {
  return meter * 100;
}
