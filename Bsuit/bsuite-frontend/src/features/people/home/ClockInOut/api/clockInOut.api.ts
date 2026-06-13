import { baseApi } from "../../../../../api/base.api";

export interface ILocationPayload {
  lat: number | string;
  lng: number | string;
  address: string;
  device: string;
  ip: string;
}

/** Sent when geolocation is unavailable (e.g. permission denied). */
export const EMPTY_LOCATION_PAYLOAD: ILocationPayload = {
  lat: "",
  lng: "",
  address: "",
  device: "",
  ip: "",
};

export interface IClockInRequest {
  employeeId: string;
  locationPayload: ILocationPayload;
  clockInMessage?: string;
}

/** One project line on clock-out — matches Nest validation (`timeInHours` string) */
export interface IClockOutProjectTaskPayload {
  projectId: number;
  timeInHours: string;
  description: string;
}

export interface IClockOutRequest {
  employeeId: string;
  locationPayload: ILocationPayload;
  /** Total time for the shift — sum of company + project allocations */
  timeInHours: string;
  /** Rich-text HTML — backend expects a string, not an array */
  companyTasks: string;
  projectTasks: IClockOutProjectTaskPayload[];
}

function attendanceInvalidationTags(employeeId: string) {
  const now = new Date();
  const numericId = Number(employeeId);
  const tags: Array<
    "Attendance" | "AttendanceSettings" | "Dashboard" | { type: "Attendance"; id: string }
  > = ["Attendance", "AttendanceSettings", "Dashboard"];
  if (Number.isFinite(numericId) && numericId > 0) {
    tags.push({
      type: "Attendance",
      id: `calendar-${numericId}-${now.getFullYear()}-${now.getMonth() + 1}`,
    });
  }
  return tags;
}

export const clockInOutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    clockIn: builder.mutation<any, IClockInRequest>({
      query: ({ employeeId, ...body }) => ({
        url: `/attendance/clock_in/${employeeId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) =>
        attendanceInvalidationTags(employeeId),
    }),
    clockOut: builder.mutation<any, IClockOutRequest>({
      query: ({ employeeId, ...body }) => ({
        url: `/attendance/clock_out/${employeeId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { employeeId }) =>
        attendanceInvalidationTags(employeeId),
    }),
  }),
});

export const { useClockInMutation, useClockOutMutation } = clockInOutApi;
