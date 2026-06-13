/**
 * Format number with Indian numbering system (comma separation)
 * Examples:
 * - 1234 → 1,234.00
 * - 100000 → 1,00,000.00
 * - 1234567.89 → 12,34,567.89
 * - 789.9 → 789.90
 */
export const formatIndianNumber = (value: number | string): string => {
  if (!value && value !== 0) return "";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  // Round to 2 decimal places first
  const numValue2dp = Math.round(numValue * 100) / 100;
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = numValue2dp.toString().split(".");
  // Format integer part with Indian comma pattern
  const reversed = integerPart.split("").reverse().join("");
  let formattedInteger = "";

  for (let i = 0; i < reversed.length; i++) {
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
      formattedInteger += ",";
    }
    formattedInteger += reversed[i];
  }
  // Reverse back to original order
  formattedInteger = formattedInteger.split("").reverse().join("");
  // Always include 2 decimal places, pad with 0 if needed
  const paddedDecimal = decimalPart ? decimalPart.padEnd(2, "0") : "00";
  return `${formattedInteger}.${paddedDecimal}`;
};

/**
 * Parse Indian formatted number back to regular number
 * Examples:
 * - "1,234" → 1234
 * - "1,00,000" → 100000
 * - "12,34,567.89" → 1234567.89
 */
export const parseIndianNumber = (value: string): number => {
  if (!value) return 0;
  // Remove all commas and convert to number
  return parseFloat(value.replace(/,/g, ""));
};

/**
 * Round a number to two decimal places
 * Examples:
 * - 123.456 → 123.46
 * - 123.4 → 123.4
 * - 123 → 123
 */
export const roundToTwoDecimals = (value: number | string): number => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return 0;
  return Math.round(numValue * 100) / 100;
};

/**
 * Format date to "Mon DD,YYYY" format
 * Examples:
 * - "2026-01-07" → "Jan 07,2026"
 * - "2026-08-31" → "Aug 31,2026"
 * - new Date(2026, 7, 31) → "Aug 31,2026"
 */
export const formatDateShort = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "";

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const month = monthNames[dateObj.getMonth()];
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${month} ${day}, ${year}`;
  } catch {
    return "";
  }
};

export const formatDateTimeShort = (
  date: string | Date | null | undefined
): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "";

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const month = monthNames[dateObj.getMonth()];
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return "";
  }
};

/**
 * Format number with US numbering system (comma separation every 3 digits)
 * Examples:
 * - 1234 → 1,234.00
 * - 100000 → 100,000.00
 * - 1234567.89 → 1,234,567.89
 * - 789.9 → 789.90
 */
export const formatUSNumber = (value: number | string): string => {
  if (!value && value !== 0) return "";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  // Round to 2 decimal places first
  const numValue2dp = Math.round(numValue * 100) / 100;
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = numValue2dp.toString().split(".");
  // Format integer part with US comma pattern (every 3 digits)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Always include 2 decimal places, pad with 0 if needed
  const paddedDecimal = decimalPart ? decimalPart.padEnd(2, "0") : "00";
  return `${formattedInteger}.${paddedDecimal}`;
};

/**
 * Parse US formatted number back to regular number
 * Examples:
 * - "1,234" → 1234
 * - "100,000" → 100000
 * - "1,234,567.89" → 1234567.89
 */
export const parseUSNumber = (value: string): number => {
  if (!value) return 0;
  // Remove all commas and convert to number
  return parseFloat(value.replace(/,/g, ""));
};

/**
 * Format number based on comma separation type
 * Used for company-level comma separation settings
 * @param value - Number or string to format
 * @param commaSeparation - "US" for US format (1,234.56) or "IN" for Indian format (1,23,456.78)
 * @example
 * formatNumberByCommaSeparation(1234567.89, "US") → "1,234,567.89"
 * formatNumberByCommaSeparation(1234567.89, "IN") → "12,34,567.89"
 */
export const formatNumberByCommaSeparation = (
  value: number | string,
  commaSeparation: "US" | "IN" = "IN",
): string => {
  if (commaSeparation === "US") {
    return formatUSNumber(value);
  }
  return formatIndianNumber(value);
};

/**
 * Parse number based on comma separation type
 * Used for company-level comma separation settings
 * @param value - Formatted string to parse
 * @param commaSeparation - "US" for US format or "IN" for Indian format
 * @example
 * parseNumberByCommaSeparation("1,234,567.89", "US") → 1234567.89
 * parseNumberByCommaSeparation("12,34,567.89", "IN") → 1234567.89
 */
export const parseNumberByCommaSeparation = (
  value: string,
  commaSeparation: "US" | "IN" = "IN",
): number => {
  if (commaSeparation === "US") {
    return parseUSNumber(value);
  }
  return parseIndianNumber(value);
};

/**
 * Format currency with symbol, sign, and comma separation type.
 * Combines sign, symbol, and formatted number into a single display string.
 *
 * @param value - Number or string to format
 * @param commaSeparation - "US" | "IN"
 * @param currencySymbol - Symbol like "₹", "$", "€"
 * @param showNegativeSign - Whether to display "-" for negatives (default true)
 * @example
 * formatCurrencyByCommaSeparation(-12345.6, "IN", "₹") → "- ₹12,345.60"
 * formatCurrencyByCommaSeparation(12345.6, "US", "$") → "$12,345.60"
 */
export const formatCurrencyByCommaSeparation = (
  value: number | string,
  commaSeparation: "US" | "IN" = "IN",
  currencySymbol: string = "",
  showNegativeSign: boolean = true,
): string => {
  if (!value && value !== 0) return "";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";

  const absValue = Math.abs(numValue);
  const formattedNumber = formatNumberByCommaSeparation(
    absValue,
    commaSeparation,
  );
  const sign = numValue < 0 && showNegativeSign ? "-" : "";
  const trimmedSymbol = currencySymbol?.trim() || "";

  return `${sign} ${trimmedSymbol}${formattedNumber}`.trim();
};


export const parseNumberForTyping = (value: string): string => {
  // remove commas and non-numeric characters (except dot)
  let cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  // block multiple dots
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts[1];
  }
  // limit to 2 decimal places
  if (parts.length === 2) {
    cleaned = parts[0] + "." + parts[1].slice(0, 2);
  }

  return cleaned;
};

// typing-safe format (IN / US)
export const formatNumberForTyping = (
  value: string,
  commaSeparation: "US" | "IN" = "IN",
): string => {
  if (!value) return "";

  const [intPart, decPart] = value.split(".");
  const digits = intPart.replace(/\D/g, "");

  let formatted = digits;

  if (commaSeparation === "US") {
    formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } else {
    if (digits.length > 3) {
      const last3 = digits.slice(-3);
      const rest = digits.slice(0, -3);
      formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
    }
  }
  // preserve decimal typing state
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};

export const validatePercentNumber = (
  rawValue: string,
  unit: "percent" | "value",
): number => {
  const num = Number(rawValue);

  if (isNaN(num)) return 0;

  if (unit === "percent") {
    if (num > 100) return 100;
    if (num < 0) return 0;
  }

  return num;
};

/**
 * Format a time string from API (HH:mm or HH:mm:ss) to 12-hour, e.g. "9:00 AM".
 */
export const formatTimeString12h = (
  timeStr: string | undefined | null,
): string => {
  if (!timeStr || typeof timeStr !== "string") return "";
  const trimmed = timeStr.trim();
  const parts = trimmed.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (isNaN(h) || isNaN(m)) return trimmed;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  const mm = String(m).padStart(2, "0");
  return `${hour12}:${mm} ${period}`;
};

/**
 * Display a fixed shift range as "9:00 AM – 5:00 PM" (no seconds).
 */
export const formatShiftTimeRange12h = (
  from?: string | null,
  to?: string | null,
): string => {
  if (!from && !to) return "";
  const a = formatTimeString12h(from || "");
  const b = formatTimeString12h(to || "");
  return `${a} – ${b}`;
};
