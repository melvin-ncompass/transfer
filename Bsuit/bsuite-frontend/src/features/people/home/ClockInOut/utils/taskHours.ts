/** Aligns with RegulariseModal / ClockInOut — clamp, snap to 30 minutes on blur */

export function normalizeHoursWorked(raw: string): string {
  const t = raw.trim();
  if (t === "") return "";
  const n = parseFloat(t.replace(",", "."));
  if (Number.isNaN(n)) return "";
  const clamped = Math.min(24, Math.max(0, n));
  const halfHours = Math.round(clamped * 2) / 2;
  return String(halfHours);
}

export function hoursStringToNumber(raw: string): number {
  const normalized = normalizeHoursWorked(raw.trim());
  if (normalized === "") return 0;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** Single-select options: 0.5, 1, 1.5, … 24 h (30-minute steps, 48 options). */
export const HALF_HOUR_SELECT_OPTIONS: { label: string; value: string }[] = (() => {
  const out: { label: string; value: string }[] = [];
  for (let k = 1; k <= 48; k++) {
    const hours = k / 2;
    const value = String(hours);
    out.push({ label: `${value} h`, value });
  }
  return out;
})();

/** Prefill dropdown from elapsed minutes — snaps to nearest 0.5 h in [0.5, 24]. */
export function elapsedMinutesToHalfHourSelectValue(totalMins: number | null): string {
  if (totalMins === null) return "8";
  if (totalMins <= 0) return "0.5";
  const h = totalMins / 60;
  const halfSteps = Math.min(48, Math.max(1, Math.round(h * 2)));
  return String(halfSteps / 2);
}
