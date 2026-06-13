import { baseApi } from "../../../../../../api/base.api";

export const assetRecoverApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        recoverAsset: builder.mutation<
            any,
            { typeId: number | string; 
                listId: number | string; 
                data: {
                    recoveredBy:number,
                    recoveredOn:string,
                    assetConditionId:number
                } 
            }
        >({
            query: ({ typeId, listId, data }) => ({
                url: `/asset_list/recover/${typeId}/${listId}`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["AssetCategory", "AssetType"],
            transformResponse: (response: any) => response.data,
        }),
    }),
});

export const { useRecoverAssetMutation } = assetRecoverApi;