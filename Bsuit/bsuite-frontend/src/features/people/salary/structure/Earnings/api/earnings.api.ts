import { baseApi } from "../../../../../../api/base.api";

export enum EarningCalculationEnum {
    AMOUNT = "amount",
    PERCENTAGE = "percentage",
}

export enum EarningFrequencyEnum {
    RECURRING = "recurring",
    NON_RECURRING = "non_recurring",
}
export type CalculationType = "amount" | "percentage";
export type EarningFrequencyType = "recurring" | "non_recurring";

export type EarningType = {
    id: string | undefined;
    earningName: string;
    nameInPayslip: string;
    isActive: boolean;
    isDefault?: boolean;
    amount?: string;
    percentage?: string;
    taxExempt?: boolean;
    isProRataBasis?: boolean;
    percentageOf?: string | number;
    calculationType: "amount" | "percentage";
    earningFrequency: "recurring" | "non_recurring";
};

export type EarningRequestType = {
    id: string | undefined;
    earningName: string;
    nameInPayslip: string;
    isActive: boolean;
    isEditable?: boolean;
    amount?: number | string; 
    percentage?: number | string;
    taxExempt?: boolean;
    isProRataBasis?: boolean;
    percentageOf?: string | null; 
    calculationType: "amount" | "percentage";
    earningFrequency: "recurring" | "non_recurring";
};

type ApiResponse<T> = {
    data: T;
    message?: string;
};

export const EarningsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createEarning: builder.mutation<EarningType, Partial<EarningRequestType>>({
            query: (body) => ({
                url: "/earnings",
                method: "POST",
                body,
            }),
            transformResponse: 
                (response: ApiResponse<EarningType>) => response.data,
            invalidatesTags: (_result, error) => (error ? [] : []),
        }),

        getEarnings: builder.query<EarningType[], void>({
            query: () => "/earnings",
            transformResponse: 
                (response: ApiResponse<EarningType[]>) => response.data,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((earning) => ({
                            type: "Earnings" as const,
                            id: earning.id,
                        })),
                        { type: "Earnings" as const, id: "LIST" },
                    ]
                    : [{ type: "Earnings" as const, id: "LIST" }],
        }),

        getEarningById: builder.query<EarningType, string | undefined>({
            query: (id) => `/earnings/${id}`,
            transformResponse: 
                (response: ApiResponse<EarningType>) => response.data,

            providesTags: (result) => result ? [{ type: "Earnings", id: result.id }] : [],
        }),

        updateEarning: builder.mutation<
            EarningType,
            { id: string } & Partial<EarningRequestType>
        >({
            query: ({ id, ...payload }) => ({
                url: `/earnings/${id}`,
                method: "PATCH",
                body: payload,
            }),
            transformResponse: 
                (response: ApiResponse<EarningType>) => response.data,
            invalidatesTags: (_result, error) => (error ? [] : []),
        }),

        deleteEarning: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/earnings/${id}`,
                method: "DELETE",
            }),
            transformResponse: 
                (response: ApiResponse<{ success: boolean }>) => response.data,
            invalidatesTags: (_result, error) => (error ? [] : []),
        }),
    }),
});

export const {
    useCreateEarningMutation,
    useGetEarningsQuery,
    useGetEarningByIdQuery,
    useUpdateEarningMutation,
    useDeleteEarningMutation,
} = EarningsApi;
