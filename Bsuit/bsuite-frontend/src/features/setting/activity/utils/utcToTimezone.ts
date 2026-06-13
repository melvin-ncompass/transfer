import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a UTC date to a specific timezone.
 * @param date - UTC date string or Date object
 * @param tz - IANA timezone string (e.g., "Asia/Kolkata", "America/New_York")
 * @param format - Optional output format
 */
export function convertUtcToTimezone(
  date: string | Date,
  tz: string,
  format = "MMM D, YYYY h:mm A",
): string {
  if (!date) return "";
  return dayjs.utc(date).tz(tz).format(format);
}
