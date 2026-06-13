import { Stack, TableCell, TableRow, Typography, type ChipProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { Box } from "@mui/system";
import dayjs from "dayjs";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { MonthYearPickerElement } from "../../../../../components/atom/date-picker";
import type { StandardTableColumn } from "../../../../../types/types";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { Dayjs } from "dayjs";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import {
    useCheckAttendanceQuery,
    useGetAllAttendanceQuery,
    type AttendanceDayEntry,
    type AttendanceLocationInfo,
} from "../api/attendance.api";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import EventBusyIcon from "@mui/icons-material/EventBusy";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SnoozeOutlinedIcon from "@mui/icons-material/SnoozeOutlined";
import WeekendOutlinedIcon from "@mui/icons-material/WeekendOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import { RegulariseModal, type RegulariseFormPayload } from "./RegulariseModal";
import { ApplyLeaveModal, type ApplyLeaveFormPayload } from "./ApplyLeaveModal";
import { RequestCompOffModal, type RequestCompOffFormPayload } from "./RequestCompOffModal";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { Tooltip } from "../../../../../components/atom/tooltip";

import type { ShowAttendanceModalSnackbar } from "./attendanceModalSnackbar.types";

import { getTableCellStyles } from "../../../../../themes/uiConstants";
import { formatTimeString12h } from "../../../../../utils/numberFormatter";
import { useGetAttendanceConfigQuery } from "../../../time/settings/api/settings.api";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useGetNextPayableQuery } from "../../../salary/payrun/runpayroll/api/payrun.api";
import LocationPinIcon from '@mui/icons-material/LocationPin';
import { LocationModal } from "./LocationModal";

dayjs.extend(utc);
dayjs.extend(timezone);


// ─── Timeline bar helpers ─────────────────────────────────────────────────────
const BAR_START_HOUR = 0;
const BAR_END_HOUR = 24;
const BAR_TOTAL_MINUTES = (BAR_END_HOUR - BAR_START_HOUR) * 60; // 1440 min

/**
 * Convert a time string to local minutes-since-midnight for bar positioning.
 *
 * BE sends UTC ISO strings (e.g. "2026-05-06T09:00:00.000Z").
 * We parse as UTC and convert to the browser's local time so the bar
 * reflects the correct local wall-clock position.
 *
 * Plain HH:mm / HH:mm:ss strings (no timezone info) are treated as
 * already-local and used directly.
 */
function isoToBarMinutes(raw: string | null | undefined): number | null {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;

    // UTC ISO datetime — convert to local time first, then extract HH:mm
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        const d = dayjs.utc(s).local();
        if (!d.isValid()) return null;
        return d.hour() * 60 + d.minute();
    }

    // Plain HH:mm or HH:mm:ss — already local, use directly
    const timeMatch = s.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
        return parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    }

    return null;
}

/** Clamp value between 0 and 1 */
function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

/** Fraction along the bar [0,1] for a given minute offset (midnight to midnight) */
function barFraction(mins: number): number {
    return clamp01(mins / BAR_TOTAL_MINUTES);
}

/** Current local wall-clock time as minutes-since-midnight */
function nowBarMinutes(): number {
    const n = dayjs();
    return n.hour() * 60 + n.minute();
}

/**
 * Bar fill between palette `main` and `light` (a stable “100”-style step: darker than light, lighter than main).
 * Stripes were removed; this is the single solid fill for semantic bar states.
 */
function paletteBarMid(
    theme: Theme,
    colorKey: "primary" | "success" | "warning" | "error" | "info",
): string {
    const c = theme.palette[colorKey];
    return `color-mix(in srgb, ${c.main} 42%, ${c.light} 58%)`;
}

/** Lighter ghost tail for ongoing punch (still between main and light, shifted toward light). */
function paletteBarGhost(theme: Theme, colorKey: "primary" | "success" | "warning" | "error" | "info"): string {
    const c = theme.palette[colorKey];
    return `color-mix(in srgb, ${c.main} 18%, ${c.light} 82%)`;
}

/** Week-off / neutral full-bar fill between action.disabled and disabledBackground */
function actionBarMid(theme: Theme): string {
    const a = theme.palette.action;
    return `color-mix(in srgb, ${a.disabled} 38%, ${a.disabledBackground} 62%)`;
}

// ─── Existing utility helpers (unchanged) ────────────────────────────────────
function leaveRequestWorkflowStatus(day: AttendanceDayEntry): "pending" | "approved" | "rejected" | null {
    if (!hasLeaveRecord(day.leave)) return null;
    const st = normalizedLeaveStatus(day);
    if (st === "pending") return "pending";
    if (st === "approved") return "approved";
    if (isRejectedLeaveStatus(st)) return "rejected";
    return null;
}

function hasLeaveRecord(leave: AttendanceDayEntry["leave"]): boolean {
    return leave != null && leave !== false;
}

function isoToLocal12h(raw: string): string {
    if (!raw) return "—";
    const d = dayjs.utc(raw).local();
    if (!d.isValid()) return raw;
    return d.format("h:mm A");
}

function formatClockDisplay(v: string | null | undefined): string {
    if (v == null || v === "—") return "—";

    // UTC ISO datetime → convert to local time, then format
    if (v.includes("T")) {
        const d = dayjs.utc(v).local();
        if (!d.isValid()) return "—";
        return formatTimeString12h(d.format("HH:mm"));
    }

    // Plain HH:mm or HH:mm:ss — already local
    return formatTimeString12h(v);
}

function parseClockToDayjs(v: string): dayjs.Dayjs | null {
    const t = v.trim();
    if (!t) return null;
    if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
        const d = dayjs(t);
        return d.isValid() ? d : null;
    }
    const d = dayjs(`2000-01-01 ${t}`);
    return d.isValid() ? d : null;
}

function clockRawToDayjsOnDate(raw: string | null | undefined, baseDate: dayjs.Dayjs): dayjs.Dayjs | null {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (s === "" || s === "—") return null;
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        const d = dayjs(s);
        if (!d.isValid()) return null;
        return baseDate.hour(d.hour()).minute(d.minute()).second(0).millisecond(0);
    }
    const t = parseClockToDayjs(s);
    if (t == null || !t.isValid()) return null;
    return baseDate.hour(t.hour()).minute(t.minute()).second(0).millisecond(0);
}

function hasClockInPunch(day: AttendanceDayEntry): boolean {
    const c = day.clockIn;
    if (c == null) return false;
    const s = String(c).trim();
    return s !== "" && s !== "—";
}

function hasClockOutPunch(day: AttendanceDayEntry): boolean {
    const c = day.clockOut;
    if (c == null) return false;
    const s = String(c).trim();
    return s !== "" && s !== "—";
}

function hasAnyClockPunch(day: AttendanceDayEntry): boolean {
    return hasClockInPunch(day) || hasClockOutPunch(day);
}

function hasRowLocationInfo(row: AttendanceLogTableRow): boolean {
    return row.clockInLocationInfo != null || row.clockOutLocationInfo != null;
}

type MergedStatusBadge = {
    label: string;
    color: NonNullable<ChipProps["color"]>;
    icon?: ReactElement;
};

function rejectedPartialChipIcon(): ReactElement {
    return <CancelOutlinedIcon sx={{ fontSize: "18px !important" }} aria-hidden />;
}

function leaveDisplayName(leave: AttendanceDayEntry["leave"]): string {
    if (typeof leave === "string" && String(leave).trim() !== "") return String(leave).trim();
    if (leave != null && typeof leave === "object") {
        const o = leave as {
            leaveName?: unknown; name?: unknown;
            leaveType?: unknown | { name?: unknown; leaveName?: unknown };
        };
        for (const key of ["leaveName", "name"] as const) {
            const v = o[key];
            if (v != null && typeof v === "string" && String(v).trim() !== "") return String(v).trim();
        }
        const lt = o.leaveType;
        if (lt != null && typeof lt === "object") {
            const lo = lt as { name?: unknown; leaveName?: unknown };
            if (lo.leaveName != null && String(lo.leaveName).trim() !== "") return String(lo.leaveName).trim();
            if (lo.name != null && String(lo.name).trim() !== "") return String(lo.name).trim();
        }
        if (typeof o.leaveType === "string" && String(o.leaveType).trim() !== "") return String(o.leaveType).trim();
    }
    return "Leave";
}

function statusWithLeaveType(leave: AttendanceDayEntry["leave"], statusText: string): string {
    const name = leaveDisplayName(leave);
    if (name === "Leave") return statusText;
    return `${statusText} · ${name}`;
}

/** Pending shows `(Pending)`; approved/rejected show leave type only. */
function leaveRequestStatusLabel(
    leave: AttendanceDayEntry["leave"],
    statusWord: "Pending" | "Approved" | "Rejected",
    extra?: string,
): string {
    const name = leaveDisplayName(leave);
    const base = statusWord === "Pending" ? `${name} (Pending)` : name;
    return extra ? `${base} · ${extra}` : base;
}

function formatPartialLeaveHalf(indication: unknown): string {
    const normalized = indication != null ? String(indication).trim().toLowerCase().replace(/\s+/g, "_") : "";
    if (normalized === "first_half" || normalized === "firsthalf") return "First half";
    if (normalized === "second_half" || normalized === "secondhalf") return "Second half";
    if (normalized === "") return "";
    return String(indication).trim().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function partialLeaveStatusWithHalf(base: string, partialIndication: unknown): string {
    const half = formatPartialLeaveHalf(partialIndication);
    return half ? `${base} · ${half}` : base;
}

function parseLogTableDateCell(value: string): dayjs.Dayjs {
    const cur = dayjs(value, "MMM DD YYYY", true);
    if (cur.isValid()) return cur;
    return dayjs(value, "DD MMM YYYY", true);
}

function normalizedLeaveStatus(day: AttendanceDayEntry): string {
    const raw = day.leaveStatus;
    return raw != null ? String(raw).trim().toLowerCase() : "";
}

function isRejectedLeaveStatus(status: string): boolean {
    return status === "rejected" || status === "denied";
}

function leaveAlreadyAppliedForDay(day: AttendanceDayEntry): boolean {
    const st = normalizedLeaveStatus(day);
    if (isRejectedLeaveStatus(st)) return false;
    if (day.partialLeave) return false;
    return hasLeaveRecord(day.leave);
}

function holidayDisplayLabel(day: AttendanceDayEntry): string {
    if (day.holidayName != null && String(day.holidayName).trim() !== "") return String(day.holidayName).trim();
    const h = day.holiday;
    if (h != null && typeof h === "object" && !Array.isArray(h)) {
        const d = (h as { description?: string | null }).description;
        if (d != null && String(d).trim() !== "") return String(d).trim();
    }
    if (typeof h === "string" && h.trim() !== "") return h.trim();
    return "Holiday";
}

function weekOffDisplayLabel(day: AttendanceDayEntry): string {
    if (day.weekOff && typeof day.weekOff === "string" && String(day.weekOff).trim() !== "") {
        return String(day.weekOff).trim();
    }
    return "Week off";
}

type RegularizedDayOffInfo = {
    kind: "holiday" | "weekOff";
    label: string;
};

/** Regularisation submitted/approved on a calendar week off or holiday. */
function regularizedDayOffInfo(day: AttendanceDayEntry): RegularizedDayOffInfo | null {
    if (!day.pendingReg && !day.approvedReg) return null;
    if (day.holiday) {
        return { kind: "holiday", label: holidayDisplayLabel(day) };
    }
    if (day.weekOff) {
        return { kind: "weekOff", label: weekOffDisplayLabel(day) };
    }
    return null;
}

function effectiveHoursLabel(clockIn: string | null, clockOut: string | null): string {
    if (!clockIn || !clockOut) return "—";
    const start = dayjs.utc(clockIn);
    const end = dayjs.utc(clockOut);
    if (!start.isValid() || !end.isValid()) return "—";
    const mins = end.diff(start, "minute");
    if (mins <= 0) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
}

// ─── attendanceDayDisplay (unchanged) ────────────────────────────────────────
function attendanceDayDisplay(day: AttendanceDayEntry): {
    clockIn: string;
    clockOut: string;
    effectiveHours: string;
    mergedBadge?: MergedStatusBadge;
} {
    const effFromClocks = effectiveHoursLabel(day.clockIn, day.clockOut);

    if (day.pendingReg) {
        const label = "Pending regularization";
        return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "warning" } };
    }
    if (day.approvedReg) {
        return {
            clockIn: day.clockIn != null ? formatClockDisplay(day.clockIn) : "—",
            clockOut: day.clockOut != null ? formatClockDisplay(day.clockOut) : "—",
            effectiveHours: effFromClocks,
        };
    }
    if (day.holiday && !hasAnyClockPunch(day)) {
        const label = holidayDisplayLabel(day);
        return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "info" } };
    }
    if (day.weekOff && !hasAnyClockPunch(day)) {
        const label = typeof day.weekOff === "string" ? day.weekOff : "Week off";
        return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "secondary" } };
    }
    if (hasLeaveRecord(day.leave)) {
        const leaveName = leaveDisplayName(day.leave);
        const st = normalizedLeaveStatus(day);
        if (day.partialLeave) {
            const cout = day.clockOut != null ? formatClockDisplay(day.clockOut) : "—";
            const ind = day.partialIndication;
            if (isRejectedLeaveStatus(st)) {
                const label = leaveRequestStatusLabel(day.leave, "Rejected", formatPartialLeaveHalf(ind) || undefined);
                return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "error", icon: rejectedPartialChipIcon() } };
            }
            if (st === "pending") {
                const label = leaveRequestStatusLabel(day.leave, "Pending", formatPartialLeaveHalf(ind) || undefined);
                return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "warning" } };
            }
            if (st === "approved") {
                const label = leaveRequestStatusLabel(day.leave, "Approved", formatPartialLeaveHalf(ind) || undefined);
                return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "success" } };
            }
            const label = statusWithLeaveType(day.leave, partialLeaveStatusWithHalf("Partial leave", ind));
            return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "primary" } };
        }
        if (isRejectedLeaveStatus(st)) {
            const label = leaveRequestStatusLabel(day.leave, "Rejected");
            if (hasAnyClockPunch(day)) {
                return {
                    clockIn: day.clockIn != null ? formatClockDisplay(day.clockIn) : "—",
                    clockOut: day.clockOut != null ? formatClockDisplay(day.clockOut) : "—",
                    effectiveHours: effFromClocks,
                    mergedBadge: { label, color: "error" },
                };
            }
            return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "error" } };
        }
        if (st === "pending") {
            const label = leaveRequestStatusLabel(day.leave, "Pending");
            if (hasAnyClockPunch(day)) {
                return {
                    clockIn: day.clockIn != null ? formatClockDisplay(day.clockIn) : "—",
                    clockOut: day.clockOut != null ? formatClockDisplay(day.clockOut) : "—",
                    effectiveHours: effFromClocks,
                    mergedBadge: { label, color: "warning" },
                };
            }
            return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "warning" } };
        }
        if (st === "approved") {
            const label = leaveRequestStatusLabel(day.leave, "Approved");
            return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "success" } };
        }
        return { clockIn: leaveName, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label: leaveName, color: "primary" } };
    }
    if (day.partialLeave) {
        const cout = day.clockOut != null ? formatClockDisplay(day.clockOut) : "—";
        const st = normalizedLeaveStatus(day);
        const ind = day.partialIndication;
        const times = day.clockIn != null && day.clockOut != null ? `${isoToLocal12h(day.clockIn)} – ${isoToLocal12h(day.clockOut)}` : null;
        if (isRejectedLeaveStatus(st)) {
            const label = leaveRequestStatusLabel(day.leave, "Rejected", formatPartialLeaveHalf(ind) || undefined);
            return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "error", icon: rejectedPartialChipIcon() } };
        }
        if (st === "pending") {
            const label = leaveRequestStatusLabel(day.leave, "Pending", formatPartialLeaveHalf(ind) || undefined);
            return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "warning" } };
        }
        if (st === "approved") {
            const label = leaveRequestStatusLabel(day.leave, "Approved", formatPartialLeaveHalf(ind) || undefined);
            return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "success" } };
        }
        const timesSuffix = times ? ` · ${times}` : "";
        const label = statusWithLeaveType(day.leave, `${partialLeaveStatusWithHalf("Partial leave", ind)}${timesSuffix}`);
        return { clockIn: label, clockOut: cout, effectiveHours: effFromClocks, mergedBadge: { label, color: "primary" } };
    }
    if (day.partialLop) {
        const label = "Partial LOP";
        return { clockIn: label, clockOut: "—", effectiveHours: effFromClocks, mergedBadge: { label, color: "warning" } };
    }
    return {
        clockIn: day.clockIn != null ? formatClockDisplay(day.clockIn) : "—",
        clockOut: day.clockOut != null ? formatClockDisplay(day.clockOut) : "—",
        effectiveHours: effFromClocks,
    };
}

// ─── Partial leave half normalisation ────────────────────────────────────────
/**
 * Returns "first" | "second" | null from the raw partialIndication value.
 */
function normalizePartialHalf(indication: unknown): "first" | "second" | null {
    if (indication == null) return null;
    const s = String(indication).trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (s === "firsthalf" || s === "first") return "first";
    if (s === "secondhalf" || s === "second") return "second";
    return null;
}

// ─── Row type ─────────────────────────────────────────────────────────────────
export type AttendanceLogTableRow = {
    id: string;
    attendanceId?: number;
    isoDate: string;
    date: string;
    clockIn: string;
    clockOut: string;
    effectiveHours: string;
    mergedStatusBadge?: MergedStatusBadge;
    isWeekOff: boolean;
    pendingReg: boolean;
    approvedReg: boolean;
    pendingLeaveReq: boolean;
    /** Set when day has a leave request in pending / approved / rejected workflow */
    leaveRequestStatus: "pending" | "approved" | "rejected" | null;
    approvedRegOnWeekOff: boolean;
    isHoliday: boolean;
    showWarning: boolean;
    showClockOutMissingInfo: boolean;
    leaveAlreadyApplied: boolean;
    lateLogin: boolean;
    /** Set when attendance was regularised on a week off or holiday */
    regularizedDayOff: RegularizedDayOffInfo | null;
    /** Fraction [0,1] of bar start within the full day */
    barStart: number | null;
    /** Fraction [0,1] of bar end within the full day */
    barEnd: number | null;
    /** True when this is today's ongoing punch (no clock-out yet) */
    isOngoing: boolean;
    /** Raw clock-in string as sent by BE */
    rawClockIn: string | null;
    /** Raw clock-out string as sent by BE */
    rawClockOut: string | null;
    // ── Partial leave split-bar data ──────────────────────────────────────────
    /** True when this day has a partial leave with clock punches */
    isPartialLeave: boolean;
    /** Which half is on leave: "first" | "second" | null */
    partialLeaveHalf: "first" | "second" | null;
    /** Leave status for coloring the leave segment */
    partialLeaveStatus: "approved" | "pending" | "rejected" | "default";
    clockInLocationInfo?: AttendanceLocationInfo | null;
    clockOutLocationInfo?: AttendanceLocationInfo | null;
};

// ─── Helpers: row actions ─────────────────────────────────────────────────────
function isAttendanceRowFutureDate(isoDate: string): boolean {
    return dayjs(isoDate).startOf("day").isAfter(dayjs().startOf("day"));
}

function canShowRegulariseMenuItem(row: AttendanceLogTableRow, allowRegularisation: boolean): boolean {
    return allowRegularisation && !row.pendingReg && !row.pendingLeaveReq;
}

function canShowApplyLeaveMenuItem(row: AttendanceLogTableRow): boolean {
    return (
        !row.isHoliday &&
        !row.isWeekOff &&
        !row.leaveAlreadyApplied &&
        !row.pendingReg &&
        !row.pendingLeaveReq
    );
}

function canShowCompOffMenuItem(row: AttendanceLogTableRow): boolean {
    return (
        !row.pendingReg &&
        !row.pendingLeaveReq &&
        (row.isHoliday || row.isWeekOff || row.approvedRegOnWeekOff)
    );
}

function attendanceRowHasMenuActions(row: AttendanceLogTableRow, allowRegularisation: boolean): boolean {
    if (row.pendingReg || row.pendingLeaveReq) return false;
    const isFuture = isAttendanceRowFutureDate(row.isoDate);
    if (!isFuture && canShowRegulariseMenuItem(row, allowRegularisation)) return true;
    if (canShowApplyLeaveMenuItem(row)) return true;
    if (canShowCompOffMenuItem(row) && !isFuture) return true;
    return false;
}

// ─── Split-bar geometry helper ────────────────────────────────────────────────
/**
 * For a partial-leave day, returns the two bar segments:
 *   leaveSegment  — the half that is on leave (0.0–0.5 or 0.5–1.0)
 *   punchSegment  — the half that has actual clock punches
 *
 * The bar is split at exactly the midpoint (0.5) of the track.
 * Within punchSegment we further clamp the actual clock-in/out fractions
 * so the filled part accurately reflects the recorded punch times while
 * staying inside the work-half.
 */
function partialLeaveSegments(row: AttendanceLogTableRow): {
    leaveSegment: { start: number; end: number };
    punchSegment: { start: number; end: number; filled: boolean };
    punchFilledStart: number;
    punchFilledEnd: number;
} {
    const isFirst = row.partialLeaveHalf === "first";
    // Leave half occupies either [0, 0.5] or [0.5, 1]
    const leaveSegment = isFirst ? { start: 0, end: 0.5 } : { start: 0.5, end: 1 };
    const punchSegment = isFirst ? { start: 0.5, end: 1 } : { start: 0, end: 0.5 };

    // Actual punch fractions clamped into the punch half
    const rawStart = row.barStart ?? punchSegment.start;
    const rawEnd = row.barEnd ?? (row.isOngoing ? barFraction(nowBarMinutes()) : punchSegment.end);

    const punchFilledStart = clamp01(Math.max(rawStart, punchSegment.start));
    const punchFilledEnd = clamp01(Math.min(rawEnd, punchSegment.end));
    const filled = punchFilledEnd > punchFilledStart;

    return { leaveSegment, punchSegment: { ...punchSegment, filled }, punchFilledStart, punchFilledEnd };
}

function LateClockInIcon() {
    return (
        <Tooltip title="Late login" placement="top">
            <SnoozeOutlinedIcon
                sx={{ fontSize: 14, color: "warning.dark", display: "block" }}
                aria-label="Late login"
            />
        </Tooltip>
    );
}

function RegularizedDayOffBadge({ kind, label }: RegularizedDayOffInfo) {
    const Icon = kind === "holiday" ? CelebrationOutlinedIcon : WeekendOutlinedIcon;
    const color = kind === "holiday" ? "info.dark" : "text.secondary";

    return (
        <Stack direction="row" alignItems="center" spacing={0.35}>
            <Icon sx={{ fontSize: 14, color }} aria-hidden />
            <Typography variant="caption" fontWeight={500} sx={{ color }}>
                {label}
            </Typography>
        </Stack>
    );
}

// ─── Timeline bar component ───────────────────────────────────────────────────
function AttendanceTimelineCell({
    row,
    nowMinute,
}: {
    row: AttendanceLogTableRow;
    theme: ReturnType<typeof useTheme>;
    nowMinute: dayjs.Dayjs;
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    // ── Color tokens (mid between main and light; no stripes) ───────────────
    const trackBg = isDark ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.07);
    const normalBar = paletteBarMid(theme, "primary");
    const missingOutBar = paletteBarMid(theme, "error");
    const ongoingTail = paletteBarGhost(theme, "primary");
    const noDataBar = paletteBarMid(theme, "error");

    const BAR_HEIGHT = 7;
    const BAR_RADIUS = 3.5;

    // ── Partial leave: leave-half fill + subtle edge (same family as bar mid) ─
    const leaveHalfFill = !row.isPartialLeave
        ? null
        : row.partialLeaveStatus === "approved"
            ? paletteBarMid(theme, "success")
            : row.partialLeaveStatus === "pending"
                ? paletteBarMid(theme, "warning")
                : row.partialLeaveStatus === "rejected"
                    ? paletteBarMid(theme, "error")
                    : paletteBarMid(theme, "primary");

    const leaveHalfBorderColor = !row.isPartialLeave
        ? null
        : row.partialLeaveStatus === "approved"
            ? alpha(theme.palette.success.main, 0.35)
            : row.partialLeaveStatus === "pending"
                ? alpha(theme.palette.warning.main, 0.35)
                : row.partialLeaveStatus === "rejected"
                    ? alpha(theme.palette.error.main, 0.35)
                    : alpha(theme.palette.primary.main, 0.35);

    // ── Non-partial-leave bar color ───────────────────────────────────────────
    const isLeaveRequestDay = row.leaveRequestStatus != null;
    const isLeaveApproved = Boolean(row.mergedStatusBadge?.color === "success" && isLeaveRequestDay);
    const isLeavePendingFullBar = Boolean(row.mergedStatusBadge?.color === "warning" && !row.barStart && isLeaveRequestDay);
    const isLeaveRejectedFullBar = Boolean(row.mergedStatusBadge?.color === "error" && !row.barStart && isLeaveRequestDay);
    const showLeaveApprovedMeta = isLeaveApproved;
    const showLeavePendingMeta = Boolean(row.mergedStatusBadge?.color === "warning" && isLeaveRequestDay);
    const showLeaveRejectedMeta = Boolean(row.mergedStatusBadge?.color === "error" && isLeaveRequestDay);
    const isPendingReg = Boolean(row.pendingReg);
    const isApprovedReg = Boolean(row.approvedReg);
    const isLeaveRow = isLeaveApproved || isLeavePendingFullBar || isLeaveRejectedFullBar;
    const showSegmentedWorkBar =
        !isLeavePendingFullBar &&
        !isLeaveRejectedFullBar &&
        !isLeaveApproved &&
        !isPendingReg &&
        (Boolean(isApprovedReg && row.barStart) || (!row.isHoliday && !row.isWeekOff));

    let barColor = normalBar;
    let tailColor: string | null = null;
    let useNoDataBar = false;

    if (!row.isPartialLeave) {
        if (isPendingReg) { barColor = paletteBarMid(theme, "warning"); }
        else if (isApprovedReg && row.barStart) { /* segmented primary bar */ }
        else if (isApprovedReg && !row.barStart) { barColor = paletteBarMid(theme, "primary"); }
        else if (row.isHoliday && !row.barStart) { barColor = paletteBarMid(theme, "info"); }
        else if (row.isWeekOff) { barColor = actionBarMid(theme); }
        else if (isLeaveApproved) { barColor = paletteBarMid(theme, "success"); }
        else if (isLeavePendingFullBar) { barColor = paletteBarMid(theme, "warning"); }
        else if (isLeaveRejectedFullBar) { barColor = paletteBarMid(theme, "error"); }
        else if (!row.barStart && !row.isHoliday && !row.isWeekOff) { useNoDataBar = true; barColor = noDataBar; }
        else if (row.showClockOutMissingInfo) { barColor = missingOutBar; }
        else if (row.isOngoing) { tailColor = ongoingTail; }
    }

    // ── Bar geometry (non-partial) ────────────────────────────────────────────
    const startFrac = row.barStart ?? 0;
    const endFrac = row.barEnd ?? (row.isOngoing ? barFraction(nowBarMinutes()) : startFrac + 0.5);

    // ── Meta text ─────────────────────────────────────────────────────────────
    const canShowClockMeta =
        !isLeaveApproved &&
        !isPendingReg &&
        (!row.mergedStatusBadge || Boolean(row.rawClockIn || row.rawClockOut));
    const clockInDisplay =
        canShowClockMeta
            ? row.clockIn !== "—"
                ? row.clockIn
                : row.rawClockIn
                    ? formatClockDisplay(row.rawClockIn)
                    : null
            : null;
    const clockOutDisplay =
        canShowClockMeta && !row.showClockOutMissingInfo
            ? row.clockOut !== "—"
                ? row.clockOut
                : row.rawClockOut
                    ? formatClockDisplay(row.rawClockOut)
                    : null
            : null;

    // ── Partial leave bar segments ────────────────────────────────────────────
    const splitBar = row.isPartialLeave && row.partialLeaveHalf != null
        ? partialLeaveSegments(row)
        : null;

    return (
        <Box sx={{ width: "100%", py: 0.25 }}>

            {/* ── Timeline bar ── */}
            <Box
                sx={{
                    width: "100%",
                    height: BAR_HEIGHT,
                    borderRadius: BAR_RADIUS,
                    bgcolor: trackBg,
                    position: "relative",
                    overflow: "hidden",
                    mb: 0.75,
                }}
            >
                {/* ════════════════════════════════════════════════════════════
                    CASE A: Partial leave — split bar
                ════════════════════════════════════════════════════════════ */}
                {splitBar != null ? (
                    <>
                        {/* Leave half — solid mid-tone fill */}
                        <Box
                            sx={{
                                position: "absolute",
                                left: `${splitBar.leaveSegment.start * 100}%`,
                                width: `${(splitBar.leaveSegment.end - splitBar.leaveSegment.start) * 100}%`,
                                height: "100%",
                                bgcolor: leaveHalfFill ?? paletteBarMid(theme, "primary"),
                                border: `1px solid ${leaveHalfBorderColor ?? alpha(theme.palette.primary.main, 0.35)}`,
                                boxSizing: "border-box",
                                // Round only the outer corners of the leave half
                                borderTopLeftRadius: splitBar.leaveSegment.start === 0 ? BAR_RADIUS : 0,
                                borderBottomLeftRadius: splitBar.leaveSegment.start === 0 ? BAR_RADIUS : 0,
                                borderTopRightRadius: splitBar.leaveSegment.end === 1 ? BAR_RADIUS : 0,
                                borderBottomRightRadius: splitBar.leaveSegment.end === 1 ? BAR_RADIUS : 0,
                            }}
                        />

                        {/* Punch half — actual clock-in/out segment */}
                        {splitBar.punchSegment.filled && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: `${splitBar.punchFilledStart * 100}%`,
                                    width: `${(splitBar.punchFilledEnd - splitBar.punchFilledStart) * 100}%`,
                                    height: "100%",
                                    bgcolor: row.showClockOutMissingInfo ? missingOutBar : normalBar,
                                    borderRadius: BAR_RADIUS,
                                }}
                            />
                        )}

                        {/* Ongoing ghost tail in punch half */}
                        {row.isOngoing && splitBar.punchSegment.filled && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: `${splitBar.punchFilledEnd * 100}%`,
                                    width: `${(splitBar.punchSegment.end - splitBar.punchFilledEnd) * 100}%`,
                                    height: "100%",
                                    bgcolor: ongoingTail,
                                    borderTopRightRadius: splitBar.punchSegment.end === 1 ? BAR_RADIUS : 0,
                                    borderBottomRightRadius: splitBar.punchSegment.end === 1 ? BAR_RADIUS : 0,
                                }}
                            />
                        )}
                    </>
                ) : (
                    /* ════════════════════════════════════════════════════════
                       CASE B: All other rows — original single-bar logic
                    ════════════════════════════════════════════════════════ */
                    <>
                        {/* Regular working day */}
                        {showSegmentedWorkBar && !useNoDataBar ? (
                            <>
                                <Box
                                    sx={{
                                        position: "absolute",
                                        left: `${startFrac * 100}%`,
                                        width: `${(endFrac - startFrac) * 100}%`,
                                        height: "100%",
                                        bgcolor: barColor,
                                        borderRadius: BAR_RADIUS,
                                    }}
                                />
                                {tailColor && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: `${endFrac * 100}%`,
                                            width: `${(1 - endFrac) * 100}%`,
                                            height: "100%",
                                            bgcolor: paletteBarGhost(theme, "primary"),
                                            borderTopRightRadius: BAR_RADIUS,
                                            borderBottomRightRadius: BAR_RADIUS,
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: BAR_RADIUS,
                                    boxSizing: "border-box",
                                    ...(isLeaveApproved && {
                                        bgcolor: paletteBarMid(theme, "success"),
                                    }),
                                    ...(isPendingReg && {
                                        bgcolor: paletteBarMid(theme, "warning"),
                                    }),
                                    ...(isApprovedReg && !row.barStart && {
                                        bgcolor: paletteBarMid(theme, "primary"),
                                    }),
                                    ...(isLeavePendingFullBar && {
                                        bgcolor: paletteBarMid(theme, "warning"),
                                    }),
                                    ...(!isLeavePendingFullBar && !isLeaveApproved && !isPendingReg && !isApprovedReg && !row.isWeekOff && {
                                        bgcolor: paletteBarMid(theme, "error"),
                                    }),
                                    ...(row.isWeekOff && !isPendingReg && !isApprovedReg && {
                                        bgcolor: actionBarMid(theme),
                                    }),
                                    ...(row.isHoliday && !row.barStart && !isPendingReg && !isApprovedReg && {
                                        bgcolor: paletteBarMid(theme, "info"),
                                    }),
                                }}
                            />
                        )}
                    </>
                )}
            </Box>

            {/* ── Meta row ── */}
            <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                {/* ── Partial leave meta ── */}
                {row.isPartialLeave && splitBar != null && (
                    <>
                        {/* Leave half label */}
                        <Typography
                            variant="caption"
                            fontWeight={500}
                            sx={{
                                color: row.partialLeaveStatus === "approved" ? "success.dark"
                                    : row.partialLeaveStatus === "pending" ? "warning.dark"
                                        : row.partialLeaveStatus === "rejected" ? "error.main"
                                            : "text.secondary",
                            }}
                        >
                            {row.partialLeaveHalf === "first" ? "1st half" : "2nd half"} leave
                            {row.partialLeaveStatus !== "default" && ` · ${row.partialLeaveStatus}`}
                        </Typography>

                        {/* Separator dot */}
                        {(row.rawClockIn || row.rawClockOut) && (
                            <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
                        )}

                        {/* Clock punches for the working half */}
                        {row.rawClockIn && (
                            <>
                                <Typography variant="caption" fontWeight={600} color="text.primary">
                                    {row.clockIn !== "—" ? row.clockIn : formatClockDisplay(row.rawClockIn)}
                                </Typography>
                                {row.lateLogin && <LateClockInIcon />}
                            </>
                        )}
                        {(row.rawClockIn || row.showClockOutMissingInfo) && (
                            <Typography variant="caption" color="text.disabled">→</Typography>
                        )}
                        {row.rawClockOut && !row.showClockOutMissingInfo && (
                            <Typography variant="caption" fontWeight={600} color="text.primary">
                                {row.clockOut !== "—" ? row.clockOut : formatClockDisplay(row.rawClockOut)}
                            </Typography>
                        )}
                        {row.showClockOutMissingInfo && (
                            <Typography variant="caption" sx={{ color: "error.main" }} fontWeight={600}>missing</Typography>
                        )}
                        {row.isOngoing && row.rawClockIn && (
                            <Typography variant="caption" color="text.disabled">ongoing</Typography>
                        )}
                        {row.regularizedDayOff && (row.rawClockIn || row.rawClockOut) && (
                            <RegularizedDayOffBadge {...row.regularizedDayOff} />
                        )}
                        {!row.rawClockIn && !row.rawClockOut && row.regularizedDayOff && (
                            <RegularizedDayOffBadge {...row.regularizedDayOff} />
                        )}

                        {row.showClockOutMissingInfo && (
                            <Box sx={{ fontSize: 10, px: 0.75, py: 0.25, borderRadius: 10, bgcolor: (t) => alpha(t.palette.error.main, 0.1), color: "error.dark", fontWeight: 600, lineHeight: 1.6 }}>
                                Missed Clock Out
                            </Box>
                        )}

                        {/* Duration */}
                        {(() => {
                            if (row.isOngoing && row.rawClockIn) {
                                const cinMins = isoToBarMinutes(row.rawClockIn);
                                if (cinMins == null) return null;
                                const nowMins = nowMinute.hour() * 60 + nowMinute.minute();
                                const mins = nowMins - cinMins;
                                if (mins <= 0) return null;
                                const h = Math.floor(mins / 60);
                                const m = mins % 60;
                                return (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                                        {h}h {String(m).padStart(2, "0")}m so far
                                    </Typography>
                                );
                            }
                            if (row.effectiveHours !== "—") {
                                return (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                                        {row.effectiveHours}
                                    </Typography>
                                );
                            }
                            return null;
                        })()}
                    </>
                )}

                {/* ── Non-partial rows — original meta logic ── */}
                {!row.isPartialLeave && (
                    <>
                        {row.isWeekOff && !row.barStart && (
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>Week Off</Typography>
                        )}
                        {row.isHoliday && !row.barStart && !row.pendingReg && !row.approvedReg && (
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {row.mergedStatusBadge?.label ?? "Holiday"}
                            </Typography>
                        )}
                        {showLeaveApprovedMeta && (
                            <Typography variant="caption" sx={{ color: "success.dark" }} fontWeight={500}>
                                {row.mergedStatusBadge?.label ?? "Leave"}
                            </Typography>
                        )}
                        {showLeavePendingMeta && (
                            <Typography variant="caption" sx={{ color: "warning.dark" }} fontWeight={500}>
                                {row.mergedStatusBadge?.label ?? "Leave"}
                            </Typography>
                        )}
                        {isPendingReg && (
                            <>
                                <Typography variant="caption" sx={{ color: "warning.dark" }} fontWeight={500}>
                                    {row.mergedStatusBadge?.label ?? "Pending regularization"}
                                </Typography>
                                {row.regularizedDayOff && (
                                    <RegularizedDayOffBadge {...row.regularizedDayOff} />
                                )}
                            </>
                        )}
                        {showLeaveRejectedMeta && (
                            <Typography variant="caption" sx={{ color: "error.main" }} fontWeight={500}>
                                {row.mergedStatusBadge?.label ?? "Leave"}
                            </Typography>
                        )}
                        {useNoDataBar && !isLeaveRow && (
                            <Typography variant="caption" sx={{ color: "error.main" }} fontWeight={500}>Missed Clock In</Typography>
                        )}
                        {clockInDisplay && (
                            <>
                                <Typography variant="caption" fontWeight={600} color="text.primary">
                                    {clockInDisplay}
                                </Typography>
                                {row.lateLogin && <LateClockInIcon />}
                            </>
                        )}
                        {(clockInDisplay || row.showClockOutMissingInfo) && (
                            <Typography variant="caption" color="text.disabled">→</Typography>
                        )}
                        {clockOutDisplay && (
                            <Typography variant="caption" fontWeight={600} color="text.primary">
                                {clockOutDisplay}
                            </Typography>
                        )}
                        {row.isOngoing && clockInDisplay && (
                            <Typography variant="caption" color="text.disabled">ongoing</Typography>
                        )}
                        {row.regularizedDayOff && isApprovedReg && (clockInDisplay || clockOutDisplay) && (
                            <RegularizedDayOffBadge {...row.regularizedDayOff} />
                        )}
                        {isApprovedReg && row.regularizedDayOff && !clockInDisplay && !clockOutDisplay && (
                            <RegularizedDayOffBadge {...row.regularizedDayOff} />
                        )}
                        {row.showClockOutMissingInfo && (
                            <Box sx={{ fontSize: 10, px: 0.75, py: 0.25, borderRadius: 10, bgcolor: (t) => alpha(t.palette.error.main, 0.1), color: "error.dark", fontWeight: 600, lineHeight: 1.6 }}>
                                Missed Clock Out
                            </Box>
                        )}
                        {(clockInDisplay || clockOutDisplay || (!isLeaveApproved && !isPendingReg && row.effectiveHours !== "—")) && (() => {
                            if (row.isOngoing && row.rawClockIn) {
                                const cinMins = isoToBarMinutes(row.rawClockIn);
                                if (cinMins == null) return null;
                                const nowMins = nowMinute.hour() * 60 + nowMinute.minute();
                                const mins = nowMins - cinMins;
                                if (mins <= 0) return null;
                                const h = Math.floor(mins / 60);
                                const m = mins % 60;
                                return (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                                        {h}h {String(m).padStart(2, "0")}m so far
                                    </Typography>
                                );
                            }
                            if (row.effectiveHours !== "—") {
                                return (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                                        {row.effectiveHours}
                                    </Typography>
                                );
                            }
                            return null;
                        })()}
                    </>
                )}
            </Stack>
        </Box>
    );
}

// ─── Today's attendance flat info bar (unchanged) ─────────────────────────────
function TodayAttendanceBanner({
    clockedIn,
    clockedOut,
    clockInTime,
    clockOutTime,
    effectiveHours,
    loading,
}: {
    clockedIn: boolean;
    clockedOut: boolean;
    clockInTime: string | null;
    clockOutTime: string | null;
    effectiveHours: string;
    loading?: boolean;
}) {
    const statDividerSx = {
        borderLeft: "1px solid",
        borderColor: "divider",
        pl: { xs: 2, sm: 4 },
        ml: { xs: 2, sm: 4 },
    };

    return (
        <Box
            sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 },
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s ease",
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={{ xs: 2, sm: 0 }}
            >
                <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mb: 0.25 }}>
                        {dayjs().format("dddd, MMM DD, YYYY")}
                    </Typography>
                    {clockedOut ? (
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={500} color="error.dark">Clocked Out</Typography>
                        </Stack>
                    ) : clockedIn ? (
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={500} color="success.dark">Clocked In</Typography>
                        </Stack>
                    ) : (
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "text.disabled", flexShrink: 0 }} />
                            <Typography variant="body2" color="text.secondary">Not clocked in</Typography>
                        </Stack>
                    )}
                </Box>
                <Stack direction="row" alignItems="center" flexShrink={0}>
                    <Box sx={{ textAlign: "center", minWidth: 100 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: "0.06em", textTransform: "uppercase", display: "block", mb: 0.5 }}>Clock In</Typography>
                        <Typography variant="body1" fontWeight={500} color="text.primary">{clockInTime ?? "—"}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center", minWidth: 100, ...statDividerSx }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: "0.06em", textTransform: "uppercase", display: "block", mb: 0.5 }}>Clock Out</Typography>
                        <Typography variant="body1" fontWeight={500} color="text.primary">{clockOutTime ?? "—"}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "center", minWidth: 120, ...statDividerSx }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: "0.06em", textTransform: "uppercase", display: "block", mb: 0.5 }}>Effective Hours</Typography>
                        <Typography variant="body1" fontWeight={500} color="text.primary">{effectiveHours || "—"}</Typography>
                    </Box>
                </Stack>
            </Stack>
        </Box>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export const AttendancePage = ({
    id,
    parentPanelVisible,
}: {
    id?: number;
    parentPanelVisible?: boolean;
}) => {
    const theme = useTheme();
    const { data: employeeInfo, isLoading: employeeInfoLoading } = useGetEmployeeInfoQuery();
    const employeeId = id ?? employeeInfo?.data?.employeeId ?? null;

    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [selectedLocationRow, setSelectedLocationRow] = useState<AttendanceLogTableRow | null>(null);

    const {
        data: checkAttendanceRes,
        isLoading: checkAttendanceLoading,
        isFetching: checkAttendanceFetching,
        refetch: refetchCheckAttendance,
    } = useCheckAttendanceQuery(employeeId ?? 0, {
        skip: employeeId == null,
        refetchOnMountOrArgChange: true,
    });

    const { data: attendanceConfigRes } = useGetAttendanceConfigQuery();
    const { data: monthData, refetch: refetchNextPayable } = useGetNextPayableQuery(undefined, {
        refetchOnMountOrArgChange: parentPanelVisible === undefined,
    });
    const allowRegularisation = attendanceConfigRes?.data?.allowRegularisation ?? false;
    const todayStatus = checkAttendanceRes?.data;

    const [nowMinute, setNowMinute] = useState(() => dayjs());
    useEffect(() => {
        const id = setInterval(() => setNowMinute(dayjs()), 60_000);
        return () => clearInterval(id);
    }, []);

    const [monthYear, setMonthYear] = useState<Dayjs>(() => dayjs());

    const syncMonthYearToPayable = useCallback((payableDate: string | undefined) => {
        if (!payableDate) return;
        const payable = dayjs(payableDate);
        if (!payable.isValid()) return;
        setMonthYear(payable);
    }, []);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuRow, setMenuRow] = useState<AttendanceLogTableRow | null>(null);
    const [regulariseModalOpen, setRegulariseModalOpen] = useState(false);
    const [applyLeaveModalOpen, setApplyLeaveModalOpen] = useState(false);
    const [compOffModalOpen, setCompOffModalOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; color: "success" | "error" }>({
        open: false, message: "", color: "success",
    });

    const showSnackbar: ShowAttendanceModalSnackbar = useCallback((message, color) => {
        setSnackbar({ open: true, message, color });
    }, []);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: AttendanceLogTableRow) => {
        setAnchorEl(event.currentTarget);
        setMenuRow(row);
    };
    const handleMenuClose = () => setAnchorEl(null);

    const month = monthYear.month() + 1;
    const year = monthYear.year();

    const {
        data: attendanceCalendarRes,
        isLoading: attendanceCalendarLoading,
        isFetching: attendanceCalendarFetching,
        refetch: refetchAttendanceCalendar,
    } = useGetAllAttendanceQuery(
        { employeeId: employeeId!, month, year },
        { skip: employeeId == null, refetchOnMountOrArgChange: true }
    );

    useEffect(() => {
        if (parentPanelVisible === false) return;
        syncMonthYearToPayable(monthData?.payableDate);
    }, [monthData?.payableDate, parentPanelVisible, syncMonthYearToPayable]);

    const prevParentVisible = useRef<boolean | null>(null);
    useEffect(() => {
        if (parentPanelVisible === undefined || employeeId == null) return;

        const becameVisible = parentPanelVisible && prevParentVisible.current !== true;
        if (becameVisible) {
            void refetchNextPayable();
            void refetchCheckAttendance();
            void refetchAttendanceCalendar();
        }
        prevParentVisible.current = parentPanelVisible;
    }, [
        parentPanelVisible,
        employeeId,
        refetchNextPayable,
        refetchCheckAttendance,
        refetchAttendanceCalendar,
    ]);

    // ── Build rows ────────────────────────────────────────────────────────────
    const attendanceRows: AttendanceLogTableRow[] = useMemo(() => {
        const data = attendanceCalendarRes?.data;
        if (!data) return [];
        return Object.keys(data).map((isoDate) => {
            const day = data[isoDate];
            const display = attendanceDayDisplay(day);
            const isWeekOff = Boolean(day.weekOff) && !day.pendingReg && !day.approvedReg;
            const approvedRegOnWeekOff = Boolean(day.weekOff && day.approvedReg);
            const isHoliday = Boolean(day.holiday);
            const suppressReviewIcons =
                hasLeaveRecord(day.leave) || Boolean(day.partialLop) || Boolean(day.partialLeave) ||
                Boolean(day.pendingReg) || Boolean(day.approvedReg);
            const inPunch = hasClockInPunch(day);
            const outPunch = hasClockOutPunch(day);
            const eligibleForReview = !isWeekOff && !isHoliday && !suppressReviewIcons;
            const pendingLeaveReq =
                hasLeaveRecord(day.leave) &&
                normalizedLeaveStatus(day) === "pending" &&
                !day.partialLeave;

            const todayIso = dayjs().format("YYYY-MM-DD");
            const isToday = isoDate === todayIso;
            const isOngoing = isToday && inPunch && !outPunch;

            // Bar fractions — use raw time strings as-is (BE sends correct local times)
            const cinMins = isoToBarMinutes(day.clockIn);
            const coutMins = isOngoing
                ? nowBarMinutes()
                : isoToBarMinutes(day.clockOut);

            const barStart = cinMins != null ? barFraction(cinMins) : null;
            const barEnd = coutMins != null ? barFraction(coutMins) : null;

            // ── Partial leave fields ──────────────────────────────────────────
            const isPartialLeave = Boolean(day.partialLeave) && (inPunch || outPunch);
            const partialLeaveHalf = isPartialLeave ? normalizePartialHalf(day.partialIndication) : null;

            const rawLeaveStatus = normalizedLeaveStatus(day);
            const partialLeaveStatus: AttendanceLogTableRow["partialLeaveStatus"] =
                isPartialLeave
                    ? isRejectedLeaveStatus(rawLeaveStatus) ? "rejected"
                        : rawLeaveStatus === "pending" ? "pending"
                            : rawLeaveStatus === "approved" ? "approved"
                                : "default"
                    : "default";

            return {
                id: isoDate,
                attendanceId: typeof day.attendanceId === "number" ? day.attendanceId : undefined,
                isoDate,
                date: dayjs(isoDate).format("MMM DD, YYYY"),
                clockIn: display.clockIn,
                clockOut: display.clockOut,
                effectiveHours: display.effectiveHours,
                mergedStatusBadge: display.mergedBadge,
                isWeekOff,
                approvedRegOnWeekOff,
                isHoliday,
                showWarning: eligibleForReview && !inPunch,
                showClockOutMissingInfo: eligibleForReview && inPunch && !outPunch && !isOngoing,
                leaveAlreadyApplied: leaveAlreadyAppliedForDay(day),
                lateLogin: Boolean(day.lateLogin),
                regularizedDayOff: regularizedDayOffInfo(day),
                pendingReg: Boolean(day.pendingReg),
                approvedReg: Boolean(day.approvedReg),
                pendingLeaveReq,
                leaveRequestStatus: leaveRequestWorkflowStatus(day),
                barStart,
                barEnd,
                isOngoing,
                rawClockIn: day.clockIn ?? null,
                rawClockOut: day.clockOut ?? null,
                isPartialLeave,
                partialLeaveHalf,
                partialLeaveStatus,
                clockInLocationInfo: day.clockInLocationInfo ?? null,
                clockOutLocationInfo: day.clockOutLocationInfo ?? null,
            };
        });
    }, [attendanceCalendarRes]);

    // ── Regularise prefill ────────────────────────────────────────────────────
    const regulariseInitialDate =
        menuRow?.isoDate != null ? dayjs(menuRow.isoDate)
            : menuRow?.date != null ? parseLogTableDateCell(menuRow.date)
                : null;
    const regulariseDateForModal = regulariseInitialDate?.isValid() ? regulariseInitialDate : null;

    const { regularisePrefillClockIn, regularisePrefillClockOut } = useMemo(() => {
        const base = regulariseDateForModal;
        const iso = menuRow?.isoDate;
        if (!base?.isValid() || !iso) {
            return { regularisePrefillClockIn: undefined as dayjs.Dayjs | undefined, regularisePrefillClockOut: undefined as dayjs.Dayjs | undefined };
        }
        const day = attendanceCalendarRes?.data?.[iso];
        if (!day) return { regularisePrefillClockIn: undefined, regularisePrefillClockOut: undefined };
        let regularisePrefillClockIn: dayjs.Dayjs | undefined;
        if (hasClockInPunch(day)) {
            const cin = clockRawToDayjsOnDate(day.clockIn, base);
            if (cin?.isValid()) regularisePrefillClockIn = cin;
        }
        let regularisePrefillClockOut: dayjs.Dayjs | undefined;
        if (hasClockOutPunch(day)) {
            const cout = clockRawToDayjsOnDate(day.clockOut, base);
            if (cout?.isValid()) regularisePrefillClockOut = cout;
        }
        return { regularisePrefillClockIn, regularisePrefillClockOut };
    }, [attendanceCalendarRes?.data, menuRow?.isoDate, regulariseDateForModal]);

    const isMenuRowFutureDate = useMemo(() => {
        if (menuRow?.isoDate == null) return false;
        return isAttendanceRowFutureDate(menuRow.isoDate);
    }, [menuRow?.isoDate]);

    const handleRegularise = () => { handleMenuClose(); setRegulariseModalOpen(true); };
    const handleRegulariseSubmit = (_payload: RegulariseFormPayload) => { setRegulariseModalOpen(false); void refetchCheckAttendance(); };
    const handleApplyLeave = () => { handleMenuClose(); setApplyLeaveModalOpen(true); };
    const handleApplyLeaveSubmit = (_payload: ApplyLeaveFormPayload) => { setApplyLeaveModalOpen(false); void refetchCheckAttendance(); };
    const handleRequestCompOff = () => { handleMenuClose(); setCompOffModalOpen(true); };
    const handleRequestCompOffSubmit = (_payload: RequestCompOffFormPayload) => { setCompOffModalOpen(false); void refetchCheckAttendance(); };

    // ── Column definitions ────────────────────────────────────────────────────
    const actionsColumn: StandardTableColumn = {
        id: "actions",
        label: "Actions",
        align: "right",
        render: (row: any) => {
            const actionSlotPx = 40;
            const tableRow = row as AttendanceLogTableRow;
            const hasMenuActions = attendanceRowHasMenuActions(tableRow, allowRegularisation);
            return (
                <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", minHeight: actionSlotPx }}>
                    <Box sx={{ width: actionSlotPx, minWidth: actionSlotPx, height: actionSlotPx, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {hasMenuActions ? (
                            <PrimaryIconButton
                                size="small"
                                variant="outlined"
                                onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); handleMenuOpen(e, tableRow); }}
                                icon={<MoreVertIcon fontSize="small" titleAccess="Actions" />}
                            />
                        ) : null}
                    </Box>
                </Box>
            );
        },
    };

    const DATE_COLUMN_WIDTH = 172;
    const isOrgAttendanceView = Boolean(id);

    const columns: StandardTableColumn[] = [
        {
            id: "date",
            label: "Date",
            minWidth: isOrgAttendanceView ? undefined : DATE_COLUMN_WIDTH,
            width: isOrgAttendanceView ? "30%" : DATE_COLUMN_WIDTH,
        },
        {
            id: "attendance",
            label: "Attendance",
            width: isOrgAttendanceView ? "70%" : undefined,
        },
        ...(id ? [] : [actionsColumn]),
    ];

    const baseCellSx = {
        ...getTableCellStyles(),
        whiteSpace: "normal" as const,
        overflow: "visible" as const,
        textOverflow: "clip" as const,
        border: "none",
        color: theme.palette.mode === "light" ? theme.palette.grey[700] : theme.palette.grey[400],
    };

    const ROW_HEIGHT = 52;

    console.log(attendanceRows)

    return (
        <>
            <Stack spacing={1} sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {/* ── Today's attendance banner ── */}
                {employeeInfoLoading || (employeeId != null && checkAttendanceLoading) ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                        <CustomCircularProgress size={28} />
                    </Box>
                ) : employeeId == null ? (
                    <Box sx={{ py: 2, px: 2, borderRadius: 2, bgcolor: "action.hover", border: "1px dashed", borderColor: "divider" }}>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Employee information is unavailable. You may not be linked to an employee record.
                        </Typography>
                    </Box>
                ) : (
                    (() => {
                        const rawCin = todayStatus?.clockInTime ?? null;
                        const rawCout = todayStatus?.clockOutTime ?? null;
                        const clockedOut = Boolean(todayStatus?.clockedOut) || Boolean(rawCout);
                        const clockedIn = !clockedOut && (Boolean(todayStatus?.clockedIn) || Boolean(rawCin));
                        const clockInDisplay = rawCin ? formatClockDisplay(rawCin) : null;
                        const clockOutDisplay = rawCout ? formatClockDisplay(rawCout) : null;
                        let effectiveHours = "";
                        if (rawCin && rawCout) {
                            effectiveHours = effectiveHoursLabel(rawCin, rawCout);
                        } else if (rawCin) {
                            const cinMins = isoToBarMinutes(rawCin);
                            if (cinMins != null) {
                                const nowMins = nowMinute.hour() * 60 + nowMinute.minute();
                                const mins = nowMins - cinMins;
                                if (mins > 0) {
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    effectiveHours = `${h}h ${String(m).padStart(2, "0")}m so far`;
                                }
                            }
                        }
                        return (
                            <TodayAttendanceBanner
                                clockedIn={clockedIn}
                                clockedOut={clockedOut}
                                clockInTime={clockInDisplay}
                                clockOutTime={clockOutDisplay}
                                effectiveHours={effectiveHours}
                                loading={checkAttendanceFetching && !checkAttendanceLoading}
                            />
                        );
                    })()
                )}

                {/* ── Logs table ── */}
                <Stack spacing={1} sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-end" flexShrink={0}>
                        <Typography variant="h6" color="textPrimary" ml={1}>Logs</Typography>
                        <MonthYearPickerElement
                            label=""
                            value={monthYear}
                            onChange={(value) => setMonthYear(value ?? dayjs())}
                            width="12%"
                        />
                    </Box>

                    {employeeId == null ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            Select an employee context to load attendance logs.
                        </Typography>
                    ) : attendanceCalendarLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                            <CustomCircularProgress size={28} />
                        </Box>
                    ) : attendanceRows.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No attendance records for {monthYear.format("MMMM YYYY")}.
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
                                position: "relative",
                                opacity: attendanceCalendarFetching && !attendanceCalendarLoading ? 0.7 : 1,
                                border: "1px solid", borderColor: "divider", borderRadius: 1,
                                bgcolor: "background.paper", overflow: "hidden",
                            }}
                        >
                            <StandardTable
                                rows={attendanceRows}
                                columns={columns}
                                sticky
                                renderCustomRow={(row, _rowIndex, { rowRef, highlightBackground, columns: cols }) => {
                                    const actionsCol = cols.find((c) => c.id === "actions");

                                    return (
                                        <TableRow
                                            ref={rowRef}
                                            hover
                                            sx={{
                                                height: ROW_HEIGHT,
                                                "& .MuiTableCell-root": { height: ROW_HEIGHT, maxHeight: ROW_HEIGHT, paddingY: 0.75 },
                                                backgroundColor: highlightBackground,
                                                transition: "background-color 0.3s ease-in-out",
                                            }}
                                        >
                                            <TableCell
                                                align="left"
                                                sx={{
                                                    ...baseCellSx,
                                                    whiteSpace: "nowrap",
                                                    ...(isOrgAttendanceView
                                                        ? { width: "30%" }
                                                        : { width: DATE_COLUMN_WIDTH, minWidth: DATE_COLUMN_WIDTH }),
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        width: "100%",
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {row.date}
                                                    </Typography>
                                                    {hasRowLocationInfo(row) && (
                                                        <PrimaryIconButton
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ flexShrink: 0 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedLocationRow(row);
                                                                setLocationModalOpen(true);
                                                            }}
                                                            icon={<LocationPinIcon fontSize="small" />}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>

                                            <TableCell
                                                align="left"
                                                sx={{
                                                    ...baseCellSx,
                                                    px: 2,
                                                    py: 1,
                                                    ...(isOrgAttendanceView ? { width: "70%" } : {}),
                                                }}
                                            >
                                                <AttendanceTimelineCell row={row} theme={theme} nowMinute={nowMinute} />
                                            </TableCell>

                                            {actionsCol && (
                                                <TableCell align={actionsCol.align ?? "right"} sx={{ ...baseCellSx, width: 100 }}>
                                                    {actionsCol.render ? actionsCol.render(row) : null}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                }}
                                tableSx={isOrgAttendanceView ? { tableLayout: "fixed" } : undefined}
                                sx={{
                                    flex: 1, minHeight: 0, overflow: "auto", width: "100%",
                                    "& .MuiTableRow-root": { height: ROW_HEIGHT },
                                    "& .MuiTableCell-root": {
                                        height: ROW_HEIGHT,
                                        paddingTop: 0.75,
                                        paddingBottom: 0.75,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Stack>
            </Stack>

            {/* ── Menus & Modals ── */}
            <MenuAtom
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onCloseAll={handleMenuClose}
                items={[
                    ...(menuRow != null && !isMenuRowFutureDate && canShowRegulariseMenuItem(menuRow, allowRegularisation)
                        ? [{ label: "Regularise", icon: <EditIcon fontSize="small" />, onClick: handleRegularise }]
                        : []),
                    ...(menuRow != null && canShowApplyLeaveMenuItem(menuRow)
                        ? [{ label: "Apply leave", icon: <EventBusyIcon fontSize="small" />, onClick: handleApplyLeave }]
                        : []),
                    ...(menuRow != null && !isMenuRowFutureDate && canShowCompOffMenuItem(menuRow)
                        ? [{ label: "Request credit for compensatory off", icon: <FreeBreakfastIcon fontSize="small" />, onClick: handleRequestCompOff }]
                        : []),
                ]}
            />

            <RegulariseModal
                open={regulariseModalOpen}
                onClose={() => setRegulariseModalOpen(false)}
                onSubmit={handleRegulariseSubmit}
                initialAttendanceDate={regulariseDateForModal}
                initialClockIn={regularisePrefillClockIn}
                initialClockOut={regularisePrefillClockOut}
                showSnackbar={showSnackbar}
                employeeId={employeeId ?? undefined}
                attendanceId={menuRow?.attendanceId ?? null}
            />



            <ApplyLeaveModal
                open={applyLeaveModalOpen}
                onClose={() => setApplyLeaveModalOpen(false)}
                onSubmit={handleApplyLeaveSubmit}
                initialLeaveDateIso={menuRow?.isoDate ?? null}
                showSnackbar={showSnackbar}
                employeeId={id!}
            />

            <RequestCompOffModal
                open={compOffModalOpen}
                onClose={() => setCompOffModalOpen(false)}
                onSubmit={handleRequestCompOffSubmit}
                initialCompOffDateIso={menuRow?.isoDate ?? null}
                showSnackbar={showSnackbar}
            />

            <LocationModal
                open={locationModalOpen}
                onClose={() => setLocationModalOpen(false)}
                clockInLocationInfo={selectedLocationRow?.clockInLocationInfo}
                clockOutLocationInfo={selectedLocationRow?.clockOutLocationInfo}
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    autoClose={6000}
                />
            )}
        </>
    );
};