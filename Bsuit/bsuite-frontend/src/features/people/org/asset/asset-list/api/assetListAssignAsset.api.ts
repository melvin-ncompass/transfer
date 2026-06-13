import { baseApi } from "../../../../../../api/base.api";

type ApiResponse<T> = {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
};

export const assetListAssignAssetApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        assignAsset: builder.mutation<
            any,
            { typeId: number | string; listId: number | string; data: any }
        >({
            query: ({ typeId, listId, data }) => ({
                url: `/asset_list/assign/${typeId}/${listId}`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["AssetCategory", "AssetType"],
            transformResponse: (response: ApiResponse<any>) => response.data,
        }),
    }),
});

export const { useAssignAssetMutation } = assetListAssignAssetApi;
