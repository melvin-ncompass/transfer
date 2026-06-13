import { baseApi } from "../../../../api/base.api";

export interface IConfigCountResponse {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: {
        completedSteps: number;
        progressPercentage: number;
        steps: {
            paySchedule: {
                completed: boolean;
                count: number;
            };
            salaryStructure: {
                completed: boolean;
                earningCount: number;
                deductionCount: number;
            };
            salaryTemplate: {
                completed: boolean;
                count: number;
            };
            departmentAndDesignation: {
                completed: boolean;
                departmentCount: number;
                designationCount: number;
            };
            incomeTaxConfiguration: {
                completed: boolean;
                count: number;
            };
            leaveAndShift: {
                completed: boolean;
                leaveTypeCount: number;
                leavePlanCount: number;
                shiftCount: number;
            };
            holidayPlan: {
                completed: boolean;
                count: number;
            };
            employee: {
                completed: boolean;
                count: number;
            };
        };
    };
}

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getConfigCount: builder.query<IConfigCountResponse, void>({
            query: () => ({
                url: "/payroll_config/config_count",
                method: "GET",
            }),
            providesTags: ["Dashboard"],
        }),
    }),
});

export const { useGetConfigCountQuery } = dashboardApi;
