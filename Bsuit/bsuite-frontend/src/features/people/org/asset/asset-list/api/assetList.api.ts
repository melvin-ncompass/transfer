import { baseApi } from "../../../../../../api/base.api";
import type { Employee } from "../../../people/directory/types/employee.types";

type AssetCondition = {
    id: number;
    conditionName: string;
    description: string | null;
};

export type AssignmentsType = {
    assignedOn: string;
    assignedTo: Employee;
    createdAt: string;
    id: string;
    isAcknowledgementRequested: string;
    note: string;
    recoveredBy: Employee
    recoveredOn: string;
}

type AssetDetails = {
    id: number;
    assetId: string;
    assetName: string;
    assetStatus: string;
    location: string;
    description: string | null;
    purchasedOn: string;
    warrantyExpiresOn: string;

    assetCondition: AssetCondition;

    assetSeries?: {
        id: number;
        seriesName: string;
    };

    attributes?: Record<string, string>;

    assignments?: AssignmentsType[];
    attachments?: AssetAttachment[];
};

export type AssignAsset = {
    id: string;
    assetName: string;
    assetStatus: string;
    assignedTo: string;
    isAcknowledgementRequested: string;
    location: string;
    warrantyExpiryDate: string;
    warrantyExpiryStatus: string;
    conditionName: string;
    asset: AssetDetails;
};

export type AssetAttachment = {
    filename: string;
    path: string;
};

export type AssetAttributeValue = {
    id: number;
    label: string;
    value: string | string[];
};

export type AssetData = {
    id: number;
    assetType: {
        id: number;
    };
    assetIdSeries: string;
    assetId: string;
    assetName: string;
    description: string | null;
    location: string;
    purchasedOn: string;
    warrantyExpiresOn: string;
    assetCondition: AssetCondition
    attributes?: Record<string, string>;
    assignments?: AssignmentsType[];
    assetStatus: string;
    attachments: AssetAttachment[];
    attributeValues: AssetAttributeValue[];
};

type ApiResponse<T> = {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
};

export const assetListApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createAsset: builder.mutation<
            AssetData,
            { categoryId: number | string; typeId: number | string; data: FormData }
        >({
            query: ({ categoryId, typeId, data }) => ({
                url: `/asset_list/${categoryId}/${typeId}`,
                method: "POST",
                body: data,
            }),
            
            invalidatesTags: (result, error) =>
                error
                    ? []
                    : ["AssetCategory", "AssetType", "AssetId"], // Invalidating tags related to assets, might need adjustment
            transformResponse: (response: ApiResponse<AssetData>) => response.data,
        }),
        updateAsset: builder.mutation<
            AssetData,
            { categoryId: number | string; typeId: number | string; listId: number | string; data: FormData }
        >({
            query: ({ categoryId, typeId, listId, data }) => ({
                url: `/asset_list/${categoryId}/${typeId}/${listId}`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (result, error) =>
                error
                    ? []
                    : ["AssetCategory", "AssetType"],
            transformResponse: (response: ApiResponse<AssetData>) => response.data,
        }),
        deleteAsset: builder.mutation<
            any,
            { typeId: number | string; listId: number | string }
        >({
            query: ({ typeId, listId }) => ({
                url: `/asset_list/${typeId}/${listId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error) =>
                error
                    ? []
                    : ["AssetCategory", "AssetType"],
            transformResponse: (response: ApiResponse<any>) => response.data,
        }),
        getAssetAuditHistory: builder.query<
            AssetData,
            { typeId: number | string; listId: number | string; from?: string; to?: string }
        >({
            query: ({ typeId, listId, from, to }) => ({
                url: `/asset_list/${typeId}/${listId}`,
                params: { from, to }
            }),
            providesTags: ["AssetCategory", "AssetType"],
            transformResponse: (response: ApiResponse<AssetData>) => response.data,
        }),

        viewAssetAttachments: builder.query<
            Blob,
            { 
                typeId: number | string; 
                listId: number | string; 
                path: string;
            }
        >({
            query: ({ typeId, listId, path }) => ({
                url: `asset_list/attachment/${typeId}/${listId}?path=${encodeURIComponent(path)}`,
                responseHandler: async (response) => await response.blob(),
            }),
            providesTags: (res, err, args) => {
                return [{ type: "AssetAttachment", id: args.path }];
            },
        })
    }),
});

export const { 
    useCreateAssetMutation, 
    useUpdateAssetMutation, 
    useDeleteAssetMutation, 
    useGetAssetAuditHistoryQuery,
    useLazyViewAssetAttachmentsQuery,
} = assetListApi;
