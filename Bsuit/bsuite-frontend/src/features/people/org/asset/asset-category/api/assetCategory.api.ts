import { baseApi } from "../../../../../../api/base.api";

export type AssetTypeAttribute = {
    label: string;
    type: string;
    values?: { value: string }[];
    mandatory: boolean;
};

export type Asset = {
    id: number;
    assetIdSeries: string;
    assetId: string;
    assetName: string;
    description: string | null;
    location: string;
    purchasedOn: string;
    warrantyExpiresOn: string;

    assetCondition: {
        id: number;
        conditionName: string;
        description: string | null;
    };

    assetStatus: string;

    attachments: {
        filename: string;
        path: string;
    }[];

    attributes: {
        [key: string]: string | string[];
    } | null;

    assignments: {
        id: number;

        assignedTo: {
            id: number;
            employeeId: string;

            contact: {
                id: number;
                name: string;
                middleName: string | null;
                lastName: string | null;
                email: string;
                phoneNumber: string;
                dialCode: string | null;
                addressLine1: string | null;
                addressLine2: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                country: string | null;
                contactBalance: string;
                isArchived: boolean;
                showInReports: boolean;
                gstin: string | null;
                isOrganization: boolean;
                economicTerritory: string | null;
                pan: string | null;
                tdsPrefillValue: string | null;
                position: string | null;
            };

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

        assignedOn: string;
        recoveredOn: string | null;
        recoveredBy: number | null;

        attachments: {
            filename: string;
            path: string;
        }[];

        note: string | null;
        isAcknowledgementRequested: boolean;
        updatedBy: number;
        createdAt: string;
    }[];
};

export type AssetType = {
    id?: number;
    typeName: string;
    description: string;
    assetCount?: string | number;
    assetTypeAttributes?: AssetTypeAttribute[];
    assetCategory?: string | AssetCategoryType;
    assets?: Asset[];
};


export type AssetCategoryType = {
    id: number;
    categoryName: string;
    description: string;
    assetTypes?: AssetType[];
};

type ApiResponse<T> = {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
};

export const assetCategoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAssetCategories: builder.query<AssetCategoryType[], void>({
            query: () => "/assets_category",
            providesTags: ["AssetCategory"],
            transformResponse: (response: ApiResponse<AssetCategoryType[]>) => response.data,
        }),

        getAssetCategoryById: builder.query<AssetCategoryType, number>({
            query: (id) => `/assets_category/${id}`,
            providesTags: ["AssetCategory"],
            transformResponse: (response: ApiResponse<AssetCategoryType>) => response.data,
        }),

        createAssetCategory: builder.mutation<
            ApiResponse<AssetCategoryType>,
            {
                categoryName: string;
                description: string;
            }
        >({
            query: (data) => ({
                url: "/assets_category",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["AssetCategory"],
        }),

        updateAssetCategory: builder.mutation<
            AssetCategoryType,
            {
                id: number;
                data: { categoryName: string; description: string }
            }
        >({
            query: ({ id, data }) => ({
                url: `/assets_category/${id}`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["AssetCategory"],
            transformResponse: (response: ApiResponse<AssetCategoryType>) => response.data,
        }),

        deleteAssetCategory: builder.mutation<any, number>({
            query: (id) => ({
                url: `/assets_category/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AssetCategory"],
            transformResponse: (response: ApiResponse<AssetCategoryType>) => response.data,
        }),

        /* --------------------------------Asset Type apis------------------------------------ */
        // id - asset category id
        // typeId - asset type id

        createAssetType: builder.mutation<any, { id: number; data: AssetType }>({
            query: ({ id, data }) => ({
                url: `/assets_type/${id}`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["AssetType", "AssetCategory"],
            transformResponse: (response: ApiResponse<AssetType>) => response.data,
        }),

        getAssetTypeById: builder.query<
            AssetType,
            { id: any; typeId: any; filters?: any }
        >({
            query: ({ id, typeId, filters }) => {
                let url = `/assets_type/${id}/${typeId}`;

                if (filters) {
                    const params = new URLSearchParams();

                    const appendParam = (key: string, value: any) => {
                        if (
                            value === undefined ||
                            value === null ||
                            value === ""
                        ) {
                            return;
                        }

                        if (Array.isArray(value)) {
                            value.forEach((item) => {
                                if (item !== undefined && item !== null && item !== "") {
                                    params.append(key, String(item));
                                }
                            });
                        } else {
                            params.append(key, String(value));
                        }
                    };

                    const keyOrder = [
                        "warrantyExpiresOn",
                        "assetStatus",
                        "assetConditionId",
                    ];

                    keyOrder.forEach((key) => {
                        appendParam(key, filters[key]);
                    });

                    Object.entries(filters).forEach(([key, value]) => {
                        if (!keyOrder.includes(key)) {
                            appendParam(key, value);
                        }
                    });

                    const queryString = params.toString();

                    if (queryString) {
                        url += `?${queryString}`;
                    }
                }

                return url;
            },
            providesTags: ["AssetType"],
            transformResponse: (response: ApiResponse<AssetType>) => response.data,
        }),

        updateAssetType: builder.mutation<AssetType, { id: any, typeId: any, data: AssetType }>({
            query: ({ id, typeId, data }) => ({
                url: `/assets_type/${id}/${typeId}`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["AssetType", "AssetCategory"],
            transformResponse: (response: ApiResponse<AssetType>) => response.data,
        }),

        deleteAssetType: builder.mutation<AssetType, { id: number, typeId: number }>({
            query: ({ id, typeId }) => ({
                url: `/assets_type/${id}/${typeId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AssetType", "AssetCategory"],
            transformResponse: (response: ApiResponse<AssetType>) => response.data,
        }),
    }),
});

export const {
    useGetAssetCategoriesQuery,
    useGetAssetCategoryByIdQuery,
    useCreateAssetCategoryMutation,
    useUpdateAssetCategoryMutation,
    useDeleteAssetCategoryMutation,

    useCreateAssetTypeMutation,
    useGetAssetTypeByIdQuery,
    useUpdateAssetTypeMutation,
    useDeleteAssetTypeMutation
} = assetCategoryApi;