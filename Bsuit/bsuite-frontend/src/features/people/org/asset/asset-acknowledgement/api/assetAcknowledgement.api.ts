import { baseApi } from "../../../../../../api/base.api";
import type { AssetCategoryType } from "../../asset-category/api/assetCategory.api";

type ApiResponse<T> = {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
};

export type AssetAcknowledgementQueryParams = {
    status: "pending" | "completed";
    assignedOnFrom?: string;
    assignedOnTo?: string;
    acknowledgedOnFrom?: string;
    acknowledgedOnTo?: string;
    assignedTo?: number[];
    assetConditionId?: string | number;
};

export type NotifyAssetAcknowledgementPayload = {
    toNotify: {
        employeeId: number;
        assetId: number;
    }[];
};

export type AssetAttributeValue = {
    value: string;
};

export type AssetTypeAttribute = {
    label: string;
    type: string;
    values: AssetAttributeValue[];
    mandatory: boolean;
};


export type AssetType = {
    id: number;
    typeName: string;
    description: string;
    assetTypeAttributes: AssetTypeAttribute[];
    assetCategory: AssetCategoryType;
};

export type AssetCondition = {
    id: number;
    conditionName: string;
    description: string | null;
};

export type Employee = {
    id: number;
    employeeId: string;
    gender: string;
    employeeType: string;
    dateOfJoining: string;
    pfNumber: string | null;
    uanNumber: string | null;
    dateOfBirth: string;
    personalEmail: string | null;
    emergencyContact: string | null;
    fatherName: string | null;
    bloodGroup: string | null;
    aadharNumber: string | null;
    status: string;
    bankAccountNo: string | null;
    bankAccountHolderName: string | null;
    bankIfscCode: string | null;
    bankName: string | null;
    bankBranchName: string | null;
    itDeclarationStatus: string;
    isPfEnabled: boolean;
    probationEndDate: string | null;
    inProbation: boolean;
    nameAsPerAadhar: string | null;
    nameAsPerPan: string | null;
    maritalStatus: string | null;
    isPayrollEnabled: boolean;
    isAttendanceEnabled: boolean;
    isEmployeePortalEnabled: boolean;
    createdAt: string;
    updatedAt: string;
};

export type AssetAssignment = {
    id: number;
    assignedTo: Employee;
    assignedOn: string;
    recoveredOn: string | null;
    note: string | null;
    isAcknowledgementRequested: boolean;
    hasAcknowledged: boolean;
    acknowledgedOn: string | null;
    createdAt: string;
};

export type AssetAcknowledgement = {
    id: number;
    assetType: AssetType;
    assetIdSeries: string;
    assetId: string;
    assetName: string;
    description: string | null;
    location: string;
    purchasedOn: string;
    warrantyExpiresOn: string;
    assetCondition: AssetCondition;
    assetStatus: string;
    attachments: unknown[];
    attributes: Record<string, string | string[]>;
    assignments: AssetAssignment[];
};

export type GetAssetAcknowledgementsResponse = ApiResponse<
    AssetAcknowledgement[]
>;

export const assetAcknowledgementApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAssetAcknowledgements: builder.query<AssetAcknowledgement[], AssetAcknowledgementQueryParams>({
            query: (params) => ({
                url: `/asset_list/acknowledgements`,
                params,
            }),
            providesTags: ["AssetAcknowledgement"],
            transformResponse: (response: ApiResponse<AssetAcknowledgement[]>) => response.data,
        }),
        notifyAssetAcknowledgement: builder.mutation<any, NotifyAssetAcknowledgementPayload>({
            query: (body) => ({
                url: `/asset_list/notify`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["AssetAcknowledgement"],
            transformResponse: (response: ApiResponse<any>) => response.data,
        }),
    }),
});

export const {
    useGetAssetAcknowledgementsQuery,
    useNotifyAssetAcknowledgementMutation,
} = assetAcknowledgementApi;
