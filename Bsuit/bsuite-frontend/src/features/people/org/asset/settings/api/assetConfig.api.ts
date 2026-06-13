import { baseApi } from "../../../../../../api/base.api";

export interface AssetConfigParams {
    seriesTitle: string;
    description?: string;
    numberOfDigits: string;
    isAssestSeriesEnabled: boolean;
    nextNumber: string;
    prefix?: string;
    suffix?: string;
}

export interface AssetConfigResponse {
    id: number;
    seriesTitle: string;
    description: string;
    prefix: string | null;
    suffix: string | null;
    numberOfDigits: string;
    nextNumber: string;
    isAssestSeriesEnabled: boolean;
}

export const assetConfigApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAssetConfigs: builder.query<AssetConfigResponse[], void>({
            query: () => "/assets_config",
            transformResponse: (response: any) => response.data,
            providesTags: ["AssetConfig"],
        }),
        getAssetConfig: builder.query<AssetConfigResponse, string | number>({
            query: (id) => `/assets_config/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, id) => [{ type: "AssetConfig", id }],
        }),
        createAssetConfig: builder.mutation<AssetConfigResponse, AssetConfigParams>({
            query: (body) => ({
                url: "/assets_config",
                method: "POST",
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ["AssetConfig", "AssetId"],
        }),
        updateAssetConfig: builder.mutation<
            AssetConfigResponse,
            { id: string | number; body: Partial<AssetConfigParams> }
        >({
            query: ({ id, body }) => ({
                url: `/assets_config/${id}`,
                method: "PATCH",
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: (_result, _error, { id }) => [
                { type: "AssetConfig", id },
                "AssetConfig",
                "AssetId",
            ],
        }),
        deleteAssetConfig: builder.mutation<void, string | number>({
            query: (id) => ({
                url: `/assets_config/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AssetConfig"],
        }),

        getAssetConfigAssetId: builder.query<AssetConfigResponse, void>({
            query: () => `/assets_config/assetId`,
            transformResponse: (response: any) => response.data,
            providesTags: ["AssetId"],
        }),
    }),
});

export const {
    useGetAssetConfigsQuery,
    useGetAssetConfigQuery,
    useCreateAssetConfigMutation,
    useUpdateAssetConfigMutation,
    useDeleteAssetConfigMutation,
    useGetAssetConfigAssetIdQuery,
} = assetConfigApi;
