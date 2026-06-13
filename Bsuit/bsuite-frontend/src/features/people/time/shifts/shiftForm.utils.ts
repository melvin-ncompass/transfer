import type { WeekDay } from "../../../../components/atom/date-picker";
import dayjs, { type Dayjs } from "dayjs";
import type { IShiftVersion } from "./api/shifts.api";

const API_DAY_TO_WEEKDAY: Record<string, WeekDay> = {
  monday: "Mon",
  mon: "Mon",
  tuesday: "Tue",
  tue: "Tue",
  wednesday: "Wed",
  wed: "Wed",
  thursday: "Thu",
  thu: "Thu",
  friday: "Fri",
  fri: "Fri",
  saturday: "Sat",
  sat: "Sat",
  sunday: "Sun",
  sun: "Sun",
};

/** Map API working day strings (full or short) to DayPicker WeekDay values. */
export function mapApiWorkingDaysToWeekDays(days: string[]): WeekDay[] {
  const out: WeekDay[] = [];
  for (const d of days) {
    const key = d.trim().toLowerCase();
    const wd = API_DAY_TO_WEEKDAY[key];
    if (wd) out.push(wd);
  }
  return out;
}

export function isFlexibleShiftType(shiftType: string | undefined): boolean {
  return shiftType?.toLowerCase() === "flexible";
}

/**
 * Active shift version for summary / track versions:
 * 1) Prefer `isActive === true` (newest by effectiveFromDate if several are flagged).
 * 2) Else the newest version already in effect (`effectiveFromDate` <= today).
 */
export function getActiveShiftVersion(
  versions: IShiftVersion[] | undefined,
): IShiftVersion | null {
  if (!versions?.length) return null;
  const sortedVersions = [...versions].sort(
    (a, b) =>
      new Date(b.effectiveFromDate).getTime() -
      new Date(a.effectiveFromDate).getTime(),
  );
  const flagged = sortedVersions.filter((v) => v.isActive === true);
  if (flagged.length > 0) return flagged[0];
  const today = new Date();
  return (
    sortedVersions.find((v) => new Date(v.effectiveFromDate) <= today) ?? null
  );
}

/** Parse HH:mm or HH:mm:ss from API into a Dayjs time (date portion ignored). */
export function parseTimeStringToDayjs(input?: string | null): Dayjs | null {
  if (!input) return null;
  const parts = input.trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const s = parseInt(parts[2] ?? "0", 10);
  if (isNaN(h) || isNaN(m)) return null;
  return dayjs()
    .hour(h)
    .minute(m)
    .second(Number.isNaN(s) ? 0 : s)
    .millisecond(0);
}
