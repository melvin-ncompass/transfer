import { baseApi } from "../../../../../../api/base.api";

export interface AssetUnavailableStatusParams {
    reasonName: string;
    description?: string;
}

export interface AssetUnavailableStatusResponse {
    id: number;
    reasonName: string;
    description: string;
}

export const assetUnavailableStatusApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAssetUnavailableStatuses: builder.query<AssetUnavailableStatusResponse[], void>({
            query: () => "/assets_unavailable_status",
            transformResponse: (response: any) => response.data,
            providesTags: ["AssetUnavailableStatus"],
        }),
        getAssetUnavailableStatus: builder.query<AssetUnavailableStatusResponse, string | number>({
            query: (id) => `/assets_unavailable_status/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, id) => [{ type: "AssetUnavailableStatus", id }],
        }),
        createAssetUnavailableStatus: builder.mutation<AssetUnavailableStatusResponse, AssetUnavailableStatusParams>({
            query: (body) => ({
                url: "/assets_unavailable_status",
                method: "POST",
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ["AssetUnavailableStatus"],
        }),
        updateAssetUnavailableStatus: builder.mutation<
            AssetUnavailableStatusResponse,
            { id: string | number; body: Partial<AssetUnavailableStatusParams> }
        >({
            query: ({ id, body }) => ({
                url: `/assets_unavailable_status/${id}`,
                method: "PATCH",
                body,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: (_result, _error, { id }) => [
                { type: "AssetUnavailableStatus", id },
                "AssetUnavailableStatus",
            ],
        }),
        deleteAssetUnavailableStatus: builder.mutation<void, string | number>({
            query: (id) => ({
                url: `/assets_unavailable_status/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AssetUnavailableStatus"],
        }),
    }),
});

export const {
    useGetAssetUnavailableStatusesQuery,
    useGetAssetUnavailableStatusQuery,
    useCreateAssetUnavailableStatusMutation,
    useUpdateAssetUnavailableStatusMutation,
    useDeleteAssetUnavailableStatusMutation,
} = assetUnavailableStatusApi;
