import dayjs, { type Dayjs } from "dayjs";

/** URL param carrying the notification `timestamp` for deep-link date-range adjustment. */
export const NOTIF_DATE_URL_PARAM = "notifDate";

function normalizeRangeBounds(
  appliedStart: Dayjs | null,
  appliedEnd: Dayjs | null,
): { lo: Dayjs; hi: Dayjs } | null {
  if (
    appliedStart == null ||
    appliedEnd == null ||
    !appliedStart.isValid() ||
    !appliedEnd.isValid()
  ) {
    return null;
  }

  let lo = appliedStart.startOf("day");
  let hi = appliedEnd.startOf("day");
  if (lo.isAfter(hi)) {
    [lo, hi] = [hi, lo];
  }
  return { lo, hi };
}

/**
 * Expands the applied request date range so `notifDate` falls inside it.
 * Preserves the existing span (min/max with notification day) so the picker
 * does not collapse to a single day like "Apr 01 - Apr 01".
 * Returns null when the date is already inside the range (no UI update needed).
 */
export function expandRangeToIncludeNotificationDate(
  notifDateIso: string,
  appliedStart: Dayjs | null,
  appliedEnd: Dayjs | null,
): { start: Dayjs; end: Dayjs } | null {
  const notif = dayjs(notifDateIso);
  if (!notif.isValid()) return null;

  const bounds = normalizeRangeBounds(appliedStart, appliedEnd);
  if (!bounds) return null;

  const { lo, hi } = bounds;
  const notifDay = notif.startOf("day");

  const alreadyInside = !notifDay.isBefore(lo) && !notifDay.isAfter(hi);
  if (alreadyInside) return null;

  const start = [lo, hi, notifDay].reduce((min, d) => (d.isBefore(min) ? d : min));
  const end = [lo, hi, notifDay].reduce((max, d) => (d.isAfter(max) ? d : max));

  if (start.isSame(lo, "day") && end.isSame(hi, "day")) return null;

  return { start, end };
}

/** Fallback when no notification date is available on the deep link. */
export function defaultWideRangeForDeepLink(): { start: Dayjs; end: Dayjs } {
  return {
    start: dayjs().subtract(3, "month").startOf("month"),
    end: dayjs().endOf("day").startOf("day"),
  };
}
