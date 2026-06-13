// =====================
// leave.api.ts
// =====================

import { baseApi } from "../../../../../api/base.api";

// =====================
// Interfaces
// =====================

export interface LeaveYearRange {
  start: string;
  end: string;
}

export type LeaveAvailability = number | "Unlimited";

export interface LeaveStat {
  leaveTypeId: number;
  leaveTypeName: string;
  consumed: number;
  available: LeaveAvailability;
  /** Present when API returns allocation breakdown */
  allocated?: number | string;
  carryOver?: number;
  leaveTypeColorCode?: string | null;
  colorCode?: string | null;
}

export interface LeaveData {
  employeeId: number;
  yearRanges: LeaveYearRange[];
  cycleStart: string;
  cycleEnd: string;
  leaveStats: LeaveStat[];
}

export interface LeaveApiResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: LeaveData;
}

// =====================
// Leave Calendar
// =====================

export interface LeaveCalendarYearRange {
  start: string;
  end: string;
}

export interface LeaveCalendarData {
  startDate: string;
  endDate: string;
  yearRanges: LeaveCalendarYearRange[];
}

export interface LeaveCalendarResponse {
  data: LeaveCalendarData;
  message: string;
}

// =====================
// API
// =====================

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---------------------
    // Leave Stats (UPDATED)
    // ---------------------
    getLeave: builder.query<
      LeaveApiResponse,
      {
        id: number;
        leaveTypeId?: number;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: ({ id, leaveTypeId, startDate, endDate }) => {
        const params = new URLSearchParams();

        if (leaveTypeId !== undefined) {
          params.append("leaveTypeId", String(leaveTypeId));
        }
        if (startDate) {
          params.append("startDate", startDate);
        }
        if (endDate) {
          params.append("endDate", endDate);
        }

        return {
          url: `/leave/leaveStats/${id}?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Leave"],
    }),

    // ---------------------
    // Leave Calendar
    // ---------------------
    getLeaveCalendar: builder.query<LeaveCalendarResponse, { id: number }>({
      query: ({ id }) => ({
        url: `/leave/leaveCalendar/${id}`,
        method: "GET",
      }),
      providesTags: ["Leave"],
    }),
  }),
});

// =====================
// Hooks
// =====================

export const {
  useGetLeaveQuery,
  useGetLeaveCalendarQuery,
} = leaveApi;