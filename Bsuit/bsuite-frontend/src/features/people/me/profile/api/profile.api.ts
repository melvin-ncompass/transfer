import { baseApi } from "../../../../../api/base.api";
import type {
    IEmployeeProfileResponse,
    IUpdateEducationRequest,
    IUpdatePersonalInfoRequest,
    IUpdateExperienceRequest,
    IUpdateBasicInfoRequest,
    IUpdatePaymentRequest,
    IUpdatePayrollRequest,
    IUpdateAttendanceRequest,
} from "../types/profile.types";

export const profileApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ── GET ─────────────────────────────────────────────────────────────
        getEmployeeProfile: builder.query<IEmployeeProfileResponse, string>({
            query: (employeeId) => ({
                url: `/employee_portal/me/${employeeId}`,
                method: "GET",
            }),
            providesTags: ["Employee", "Designation", "Department", "SubDepartment"],
        }),

        // ── PUT /employee_portal/education/:id ───────────────────────────────
        updateEducation: builder.mutation<unknown, IUpdateEducationRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/education/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Employee"],
        }),

        // ── PATCH /employee_portal/personal_info/:id ─────────────────────────
        updatePersonalInfo: builder.mutation<unknown, IUpdatePersonalInfoRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/personal_info/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Employee"],
        }),

        // ── PATCH /employee_portal/experience/:id ────────────────────────────
        updateExperience: builder.mutation<unknown, IUpdateExperienceRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/experience/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Employee"],
        }),

        // ── PATCH /employee_portal/basic/:id ─────────────────────────────────
        updateBasicInfo: builder.mutation<unknown, IUpdateBasicInfoRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/basic/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                "Employee",
                { type: "EmployeeTimeline", id: String(id) },
                "EmployeeTimeline",
            ],
        }),

        // ── PATCH /employee_portal/payment/:id ───────────────────────────────
        updatePayment: builder.mutation<unknown, IUpdatePaymentRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/payment/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Employee"],
        }),

        // ── PATCH /employee_portal/payroll/:id ───────────────────────────────
        updatePayroll: builder.mutation<unknown, IUpdatePayrollRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/payroll/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Employee"],
        }),

        // ── PATCH /employee_portal/attendance/:id ────────────────────────────
        updateAttendance: builder.mutation<unknown, IUpdateAttendanceRequest>({
            query: ({ id, body }) => ({
                url: `/employee_portal/attendance/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Employee"],
        }),
    }),
});

export const {
    useGetEmployeeProfileQuery,
    useUpdateEducationMutation,
    useUpdatePersonalInfoMutation,
    useUpdateExperienceMutation,
    useUpdateBasicInfoMutation,
    useUpdatePaymentMutation,
    useUpdatePayrollMutation,
    useUpdateAttendanceMutation,
} = profileApi;
