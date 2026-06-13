import { baseApi } from "../../../../../api/base.api";

export const timeReportApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAttendaceReport: builder.query<
            any,
            { startDate: string; endDate: string }
        >({
            query: ({ startDate, endDate }) => ({
                url: `/reports/time/attendance`,
                method: "GET",
                params: {
                    startDate,
                    endDate,
                },
            }),
            providesTags: ["Employee"],
        }),
        getLeaveReport: builder.query<
            any,
            { startDate: string; endDate: string }
        >({
            query: ({ startDate, endDate }) => ({
                url: `/reports/time/leave`,
                method: "GET",
                params: {
                    startDate,
                    endDate,
                },
            }),
            providesTags: ["Employee"],
        }),
        exportLeaveReport: builder.mutation<
            { blob: Blob; fileName: string },
            { startDate: string; endDate: string }
        >({
            query: ({ startDate, endDate }) => ({
                url: `/reports/time/leave/export`,
                method: "GET",
                params: {
                    startDate,
                    endDate,
                },
                responseHandler: async (response) => {
                    const blob = await response.blob();
                    const contentDisposition = response.headers.get("content-disposition") || "";
                    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                    const fileName = fileNameMatch
                        ? fileNameMatch[1]
                        : `leave-report-${startDate}-to-${endDate}.xlsx`;
                    return { blob, fileName };
                },
            }),
        }),
        exportAttendanceReport: builder.mutation<
            any,
            { startDate: string; endDate: string }
        >({
            query: ({ startDate, endDate }) => ({
                url: `/reports/time/attendance/export`,
                method: "GET",
                params: {
                    startDate,
                    endDate,
                },
            }),
        }),
    }),
});

export const {
    useGetAttendaceReportQuery,
    useGetLeaveReportQuery,
    useExportLeaveReportMutation,
    useExportAttendanceReportMutation,
} = timeReportApi;