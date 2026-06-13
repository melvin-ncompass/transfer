import { baseApi } from "../../../../../../api/base.api";

export interface AssetConditionParams {
    conditionName: string;
    description?: string;
}

export interface AssetConditionResponse {
    id: number;
    conditionName: string;
    description: string;
}

export const assetConditionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAssetConditions: builder.query<AssetConditionResponse[], void>({
            query: () => "/assets_condition",
            transformResponse: (response: any) => response.data,
            providesTags: ["AssetCondition"],
        }),
        getAssetCondition: builder.query<AssetConditionResponse, string | number>({
            query: (id) => `/assets_condition/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, id) => [{ type: "AssetCondition", id }],
        }),
        createAssetCondition: builder.mutation<AssetConditionResponse, AssetConditionParams>({
            query: (body) => ({
                url: "/assets_condition",
                method: "POST",
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ["AssetCondition"],
        }),
        updateAssetCondition: builder.mutation<
            AssetConditionResponse,
            { id: string | number; body: Partial<AssetConditionParams> }
        >({
            query: ({ id, body }) => ({
                url: `/assets_condition/${id}`,
                method: "PATCH",
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: (_result, _error, { id }) => [
                { type: "AssetCondition", id },
                "AssetCondition",
            ],
        }),
        deleteAssetCondition: builder.mutation<void, string | number>({
            query: (id) => ({
                url: `/assets_condition/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AssetCondition"],
        }),
    }),
});

export const {
    useGetAssetConditionsQuery,
    useGetAssetConditionQuery,
    useCreateAssetConditionMutation,
    useUpdateAssetConditionMutation,
    useDeleteAssetConditionMutation,
} = assetConditionApi;
