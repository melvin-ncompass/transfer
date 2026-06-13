import { baseApi } from "../../../../../api/base.api";

export interface IMissingDateDetail {
    noAttendance: boolean;
    missingSwipes: boolean;
    lateLogin: boolean;
    workHoursShortage: boolean;
    workedHours: number | null;
    requiredHours: number | null;
    shortageHours: number | null;
}

export interface IAttendanceMissingItem {
    employeeId: number;
    employee: string;
    department: string | null;
    designation: string | null;
    missingDates: Record<string, IMissingDateDetail>;
}

export interface IAttendanceMissingResponse {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: IAttendanceMissingItem[];
}

export interface IAttendanceMissingRequest {
    startDate: string;
    endDate: string;
}

export interface IRegularizeItem {
    employeeId: number;
    dates: string[];
}

export interface IRegularizeWithoutRequestPayload {
    regularizeItems: IRegularizeItem[];
}

export interface IClockInOut {
    type: "IN" | "OUT";
    time: string;
}

export interface IProcessedAttendance {
    id: number;
    date: string;
    clockInOut: IClockInOut[];
}

export interface IRegularizeEmployeeResult {
    employeeId: number;
    processed: IProcessedAttendance[];
    skipped: string[];
}

export interface IChangeOfData {
    module: string;
    feature: string;
    status: string;
}

export interface IRegularizeWithoutRequestResponse {
    data: {
        data: IRegularizeEmployeeResult[];
        change_of_data: IChangeOfData;
    };
    message: string;
}

export const attendanceTrackingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMissingAttendance: builder.query<
            IAttendanceMissingResponse,
            IAttendanceMissingRequest
        >({
            query: ({ startDate, endDate }) => ({
                url: "/attendance/missing",
                method: "GET",
                params: {
                    startDate,
                    endDate,
                },
            }),
            providesTags: ["AttendanceTracking"],
        }),
        regularizeWithoutRequest: builder.mutation<
            IRegularizeWithoutRequestResponse,
            IRegularizeWithoutRequestPayload
        >({
            query: (body) => ({
                url: "/attendance/regularizeWithoutRequest",
                method: "POST",
                body,
            }),
            invalidatesTags: ["AttendanceTracking"],
        }),

    }),
});

export const {
    useGetMissingAttendanceQuery,
    useRegularizeWithoutRequestMutation,
} = attendanceTrackingApi;