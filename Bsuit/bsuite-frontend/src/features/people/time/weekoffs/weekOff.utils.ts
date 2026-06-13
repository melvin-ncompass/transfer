import type { WeekOffVersion } from "./api/weekoffs.api";

/**
 * Active week-off version: prefer API `isActive` when present, else the newest
 * version whose effectiveFromDate is on or before today (same rule as Track Versions).
 */
export function getActiveWeekOffVersion(
  versions: WeekOffVersion[] | undefined | null,
): WeekOffVersion | null {
  if (!versions?.length) return null;
  const sorted = [...versions].sort(
    (a, b) =>
      new Date(b.effectiveFromDate).getTime() -
      new Date(a.effectiveFromDate).getTime(),
  );
  const flagged = sorted.filter((v) => v.isActive === true);
  if (flagged.length > 0) return flagged[0];
  const today = new Date();
  return sorted.find((v) => new Date(v.effectiveFromDate) <= today) ?? null;
}
