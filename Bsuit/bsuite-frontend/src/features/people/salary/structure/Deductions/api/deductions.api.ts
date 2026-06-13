import { baseApi } from "../../../../../../api/base.api";

export type DeductionCalculationType = "percentage" | "amount";
export type DeductionFrequencyType = "recurring" | "non_recurring";
export type DeductionType = "Post-Tax Deduction" | "Pre-Tax Deduction";

export enum DeductionTypeEnum {
    POST_TAX = "Post-Tax Deduction",
    PRE_TAX = "Pre-Tax Deduction",
} 

export enum DeductionFrequencyEnum {
    RECURRING = "recurring",
    NON_RECURRING = "non_recurring",
};

export enum DeductionCalculationEnum {
    PERCENTAGE = "percentage",
    AMOUNT = "amount",
};
export interface Deduction {
    id: number | undefined;
    deductionType: DeductionType;
    deductionName: string;
    deductionFrequency: DeductionFrequencyType;
    nameInPayslip: string;
    calculationType: DeductionCalculationType;
    amount: string;
    isActive: boolean;
    isDefault?: boolean;
    percentageOf?: string | Deduction;
}

type ApiResponse<T> = {
    data: T;
    message?: string;
};

export const DeductionsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        createDeduction: builder.mutation<Deduction, Partial<Deduction>>({
            query: (body) => ({
                url: "/deductions",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<Deduction>) => response.data,
            invalidatesTags: (_result, error) => (error ? [] : []),
        }),

        getDeductions: builder.query<Deduction[], void>({
            query: () => "/deductions",
            transformResponse: 
                (response: ApiResponse<Deduction[]>) => response.data,
            providesTags: (result) => 
                result ? [
                    ...result.map((d) => ({
                        type: "Deductions" as const,
                        id: d.id
                    })),
                    { type: "Deductions" as const, id: "LIST" }
                ]
                : 
                [{ type: "Deductions" as const, id: "LIST" }]
            }
        ),

        getDeductionById: builder.query<Deduction, number | undefined>({
            query: (id) => `/deductions/${id}`,
            transformResponse: (response: ApiResponse<Deduction>) => response.data,
            providesTags: (res, err, id) => (err ? [] : [
                {
                    type: "Deductions" as const,
                    id: id
                }
            ]),
        }),

        updateDeduction: builder.mutation<
            Deduction,
            { id: number } & Partial<Deduction>
        >({
            query: ({ id, ...payload }) => ({
                url: `/deductions/${id}`,
                method: "PATCH",
                body: payload,
            }),
            transformResponse: (response: ApiResponse<Deduction>) => response.data,
            invalidatesTags: (_result, error) => (error ? [] : []),
        }),

        deleteDeduction: builder.mutation<void, number>({
            query: (id) => ({
                url: `/deductions/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<void>) => response.data,
            invalidatesTags: (_result, error) => (error ? [] : []),
        }),
    }),
});

export const {
    useCreateDeductionMutation,
    useGetDeductionsQuery,
    useGetDeductionByIdQuery,
    useUpdateDeductionMutation,
    useDeleteDeductionMutation
} = DeductionsApi;