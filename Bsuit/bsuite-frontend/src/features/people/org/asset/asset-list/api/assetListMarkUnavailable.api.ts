import { baseApi } from "../../../../../../api/base.api";
import type { MarkUnavailableForm } from "../components/MarkUnavailableModal";
import type { AssetData } from "./assetList.api";

type ApiResponse<T> = {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
};

export const assetListMarkUnavailableApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        markAssetUnavailable: builder.mutation<
            AssetData,
            { typeId: number | string; listId: number | string; data: MarkUnavailableForm }
        >({
            query: ({ typeId, listId, data }) => ({
                url: `/asset_list/unavailable/${typeId}/${listId}`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["AssetCategory", "AssetType"], // Invalidating tags related to assets
            transformResponse: (response: ApiResponse<AssetData>) => response.data,
        }),
    }),
});

export const { useMarkAssetUnavailableMutation } = assetListMarkUnavailableApi;
