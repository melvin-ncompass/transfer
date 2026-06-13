import { baseApi } from "../../../../../api/base.api";
import type { GenderLimit, LeaveType } from "./leaveType.api";

export enum LeaveCalenderEnum {
    PARTICULAR_MONTH = "particular_month",
    EMPLOYEE_JOINING_DATE = "employee_joining_date",
};

export type CreateUpdateLeavePlanRequest = {
    id?: number;
    name: string;
    leaveCalendarType?: LeaveCalenderEnum;
    calendarMonth?: string | null;
    leaveTypes: number[];
};

export interface LeavePlanDetail {
    id: number;
    leaveType: LeaveType;
    createdAt: string;
    updatedAt: string;
}

export interface LeavePlanType {
    id: number;
    isDefault: boolean;
    name: string;
    leaveCalendarType?: LeaveCalenderEnum;
    calendarMonth?: string | null;
    LeavePlanDetails: LeavePlanDetail[];
    createdAt: string;
    updatedAt: string;
}

export type EmployeeType = "permanent" | "all" | "intern" | string;


export type LeavePlanEmployee = {
    id: number;

    contact: {
        id: number;
        name: string;
        middleName: string | null;
        lastName: string | null;
        email: string;
        phoneNumber: string;
        dialCode: string;
        addressLine1: string;
        addressLine2: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        contactBalance: string;
        isArchived: boolean;
        showInReports: boolean;
        gstin: string;
        isOrganization: boolean;
        economicTerritory: string;
        pan: string;
        tdsPrefillValue: number;
        position: string | null;
    };

    employeeId: string;
    gender: GenderLimit;
    employeeType: "permanent" | "contract" | "intern" | string;

    dateOfJoining: string;
    pfNumber: string;
    uanNumber: string;
    dateOfBirth: string;

    personalEmail: string | null;
    emergencyContact: string | null;
    fatherName: string | null;
    bloodGroup: string | null;
    aadharNumber: string | null;

    status: "active" | "inactive";

    bankAccountNo: string | null;
    bankAccountHolderName: string | null;
    bankIfscCode: string | null;
    bankName: string | null;
    bankBranchName: string | null;

    isPfEnabled: boolean;
    probationEndDate: string;
    inProbation: boolean;

    nameAsPerAadhar: string | null;
    nameAsPerPan: string | null;
    maritalStatus: string | null;

    isPayrollEnabled: boolean;
    isAttendanceEnabled: boolean;
    isEmployeePortalEnabled: boolean;
};



type ApiResponse<T> = {
    data: T;
    message?: string;
};

export const LeavePlansApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createLeavePlan: builder.mutation<LeavePlanType, Partial<CreateUpdateLeavePlanRequest>>({
            query: (body) => {
                const cleanedBody = Object.fromEntries(
                    Object.entries(body).filter(
                        ([key, value]) => value !== undefined && key !== "id"
                    )
                );
                return {
                    url: "/leave-plans",
                    method: "POST",
                    body: cleanedBody,
                }
            },
            transformResponse: (response: ApiResponse<LeavePlanType>) => response.data,
            invalidatesTags: ["LeavePlans"],
        }),

        getLeavePlans: builder.query<LeavePlanType[], void>({
            query: () => "/leave-plans",
            transformResponse:
                (response: ApiResponse<LeavePlanType[]>) => response.data,
            providesTags: ["LeavePlans"],
        }),

        getLeavePlanById: builder.query<LeavePlanType, number | undefined>({
            query: (id) => `/leave-plans/${id}`,
            transformResponse: (response: ApiResponse<LeavePlanType>) => response.data,
            providesTags: ["LeavePlans"],
        }),

        updateLeavePlan: builder.mutation<LeavePlanType, Partial<CreateUpdateLeavePlanRequest>>({
            query: ({ id, ...payload }) => {
                const cleanedBody = Object.fromEntries(
                    Object.entries(payload).filter(
                        ([key, value]) => value !== undefined && key !== "id"
                    )
                );
                return {
                    url: `/leave-plans/${id}`,
                    method: "PATCH",
                    body: cleanedBody,
                }
            },
            transformResponse: (response: ApiResponse<LeavePlanType>) => response.data,
            invalidatesTags: ["LeavePlans"],
        }),

        deleteLeavePlan: builder.mutation<void, number>({
            query: (id) => ({
                url: `/leave-plans/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<void>) => response.data,
            invalidatesTags: ["LeavePlans"],
        }),

        getLeavePlanEmployeeById: builder.query<LeavePlanEmployee[], number>({
            query: (id) => ({
                url: `/leave-plans/${id}/employees`,
                method: "GET",
            }),
            transformResponse: (response: ApiResponse<LeavePlanEmployee[]>) => response.data,
            providesTags: ["LeavePlans"],
        }),
    }),
});

export const {
    useGetLeavePlansQuery,
    useCreateLeavePlanMutation,
    useUpdateLeavePlanMutation,
    useDeleteLeavePlanMutation,
    useGetLeavePlanByIdQuery,
    useGetLeavePlanEmployeeByIdQuery,
} = LeavePlansApi;