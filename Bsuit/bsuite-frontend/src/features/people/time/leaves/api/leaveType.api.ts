import { baseApi } from "../../../../../api/base.api";

export type LeaveTypeCategory = "regular" | "unpaid" | "compoff" | "incident";
export type AllocationMethod = "periodically" | "immediate";
export type LeaveBalancePolicy = "carry_over" | "reset_to_zero";
export type GenderLimit = "male" | "female" | "others" | "common";

export enum LeaveTypeCategoryEnum {
    REGULAR = 'regular',
    UNPAID = 'unpaid',
    COMPOFF = 'compoff',
    INCIDENT = 'incident'
}

export enum AllocationMethodEnum {
    PERIODICALLY = "periodically",
    IMMEDIATE = "immediate",
}

export enum LeaveBalancePolicyEnum {
    CARRY_OVER = "carry_over",
    RESET_TO_ZERO = "reset_to_zero",
}

export enum GenderLimitEnum {
    MALE = "male",
    FEMALE = "female",
    OTHERS = "others",
    COMMON = "common",
}

export interface SpecialDays {
    work: boolean;
    marriage: boolean;
    birthday: boolean;
}

export interface LeaveType {
    id: number | undefined;
    leaveType: LeaveTypeCategory;
    leaveName: string;
    colorCode?: string;
    shortCode?: string | null;
    limitToGender?: GenderLimit;
    yearlyQuota: string;
    allocation: AllocationMethod;
    leaveBalances: LeaveBalancePolicy;
    specialDays: SpecialDays;
    isEncashable?: boolean;
    isDefault?: boolean;
    leaveProration?: string | null;
    maxInstances?: string | null;
    expiresAfter?: number | null;
}


// --------------------------------Leave Stats--------------------------------
export interface YearRange {
    start: string; // ISO date string
    end: string;   // ISO date string
}
export interface LeaveStat {
    leaveTypeId: number;
    leaveTypeName: string;
    consumed: number;
    available: number | "Unlimited";
}

export interface EmployeeLeaveData {
    employeeId: number;
    yearRanges: YearRange[];
    cycleStart: string; // ISO date string
    cycleEnd: string;   // ISO date string
    leaveStats: LeaveStat[];
}

type ApiResponse<T> = {
    data: T;
    message?: string;
};

/** Row from GET …/employee/:employeeId — `LeavePlanDetails` with nested `leaveType` */
export type EmployeeLeavePlanDetailRow = {
    id?: number;
    leaveType?: LeaveType | null;
};

export interface CheckApplyLeaveRequest {
    employeeId: number;
    leaveTypeId: number;
    dates: string[];
    partial: boolean;
    leaveIndication?: "first_half" | "second_half";
    reason?: string;
    notifyTo?: string[];
}

export interface SkippedDate {
    date: string;
    reason: string;
}

export interface CheckApplyLeaveResponse {
    message: string;
    appliedDates: string[];
    skippedDates: SkippedDate[];
    totalApplied: number;
    totalSkipped: number;
}

export type EmployeesOnLeaveParams = {
    from: string;
    to: string;
    status?: "other" | "all";
};

export interface EmployeeOnLeave {
    id: number;
    date: string;
    requestType: string;
    status: string;
    note: string;
    partial: boolean;
    partialLeaveIndication: string | null;
    groupReqId: number;

    employee: {
        id: number;
        employeeId: string;
        contact: {
            name: string;
            email: string;
        };
    };

    leaveType: {
        id: number;
        name: string;
    };

    approvedOrRejectedBy: {
        id: number;
        contact: {
            name: string;
            email: string;
        };
    };

    requestToEmp: {
        id: number;
        contact: {
            name: string;
            email: string;
        };
    };
}

function mapEmployeeLeavePlanRowsToLeaveTypes(rows: unknown): LeaveType[] {
    if (!Array.isArray(rows)) return [];
    const mapped: LeaveType[] = [];
    const seen = new Set<number>();
    for (const row of rows) {
        const r = row as EmployeeLeavePlanDetailRow;
        const lt = r?.leaveType;
        if (lt != null && lt.id != null && !seen.has(lt.id)) {
            seen.add(lt.id);
            mapped.push(lt);
        }
    }
    return mapped;
}

export const LeaveTypesApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createLeaveType: builder.mutation<LeaveType, Partial<LeaveType>>({
            query: (body) => {
                const cleanedBody = Object.fromEntries(
                    Object.entries(body).filter(
                        ([key, value]) => value !== undefined && key !== "id"
                    )
                );
                return {
                    url: "/leave_types",
                    method: "POST",
                    body: cleanedBody,
                }
            },
            transformResponse: (response: ApiResponse<LeaveType>) => response.data,
            invalidatesTags: ["LeaveTypes"],
        }),

        getLeaveTypes: builder.query<LeaveType[], void>({
            query: () => "/leave_types",
            transformResponse:
                (response: ApiResponse<LeaveType[]>) => response.data,
            providesTags: ["LeaveTypes"],
        }),

        /**
         * Leave types assigned to the employee via their leave plan (plan details + leaveType).
         * Backend: @Get('employee/:employeeId') on leave-types controller — path may need to match your Nest prefix.
         */
        getEmployeeLeaveTypes: builder.query<LeaveType[], number>({
            query: (employeeId) => ({
                url: `/leave_types/employee/${employeeId}`,
                method: "GET",
            }),
            transformResponse: (response: ApiResponse<EmployeeLeavePlanDetailRow[]>) =>
                mapEmployeeLeavePlanRowsToLeaveTypes(response?.data),
            providesTags: (_result, _error, employeeId) => [
                { type: "LeaveTypes", id: `employee-${employeeId}` },
                "LeaveTypes",
                "LeavePlans",
            ],
        }),

        getLeaveTypeById: builder.query<LeaveType, number | undefined>({
            query: (id) => `/leave_types/${id}`,
            transformResponse: (response: ApiResponse<LeaveType>) => response.data,
            providesTags: ["LeaveTypes"],
        }),

        updateLeaveType: builder.mutation<
            LeaveType,
            { id: number } & Partial<LeaveType>
        >({
            query: ({ id, ...payload }) => {
                const cleanedBody = Object.fromEntries(
                    Object.entries(payload).filter(
                        ([key, value]) => value !== undefined && key !== "id"
                    )
                );
                return {
                    url: `/leave_types/${id}`,
                    method: "PATCH",
                    body: cleanedBody,
                }
            },
            transformResponse: (response: ApiResponse<LeaveType>) => response.data,
            invalidatesTags: ["LeaveTypes"],
        }),

        deleteLeaveType: builder.mutation<void, number>({
            query: (id) => ({
                url: `/leave_types/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<void>) => response.data,
            invalidatesTags: ["LeaveTypes"],
        }),

        getEmployeeLeaveStats: builder.query<EmployeeLeaveData, number | undefined>({
            query: (empId) => `/leave/leaveStats/${empId}`,
            transformResponse: (response: ApiResponse<EmployeeLeaveData>) => response.data,
            providesTags: ["EmployeeLeaveStats"],
        }),
        checkApplyLeave: builder.mutation<
            CheckApplyLeaveResponse,
            CheckApplyLeaveRequest
        >({
            query: ({ employeeId, ...body }) => ({
                url: `/leave/checkApplyLeave/${employeeId}`,
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<CheckApplyLeaveResponse>) => response.data,
        }),
        getEmployeesOnLeave: builder.query<EmployeeOnLeave[], EmployeesOnLeaveParams>({
            query: ({ from, to, status }) => ({
                url: "/leave/employeesOnLeave",
                method: "GET",
                params: {
                    from,
                    to,
                    ...(status ? { status } : {}),
                },
            }),
            transformResponse: (response: ApiResponse<EmployeeOnLeave[]>) => response.data,
            providesTags: ["EmployeesOnLeave"],
        }),
    }),
});

export const {
    useCreateLeaveTypeMutation,
    useGetLeaveTypesQuery,
    useGetEmployeeLeaveTypesQuery,
    useGetLeaveTypeByIdQuery,
    useUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
    useGetEmployeeLeaveStatsQuery,
    useCheckApplyLeaveMutation,
    useGetEmployeesOnLeaveQuery,
} = LeaveTypesApi;
