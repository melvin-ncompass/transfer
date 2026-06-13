import { baseApi } from "../../../../../../api/base.api";

export type DepartmentSelection = "all" | string;

export type CreateOrganizationDocumentFolderRequest = {
    folderName: string;
    description: string;
    departments: DepartmentSelection[];
    employeeType: EmployeeType;
};

export type EmployeeType = "all" | "permanent" | "intern";
export type ApiResponse<T> = {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: T;
};

export type DocumentAttachment = {
    filename: string;
    path: string;
};

export type OrganizationDocumentType = {
    id: number;
    name: string;
    description: string;
    attachments: DocumentAttachment[];
    downloadAccess: boolean;
    acknowledgementRequired: boolean;
    blockPortal: boolean;
    updatedAt: string;
    createdAt: string;
    acknowledgementStatus: 'acknowledged' | 'viewed_not_acknowledged' | 'not_acknowledged';
    totalAttachmentSize: number;
};

export type CreateOrganizationDocumentRequest = {
    name: string;
    description: string;
    attachments?: DocumentAttachment[];
    downloadAccess: boolean;
    files?: File[];
    acknowledgementRequired: boolean;
    blockPortal: boolean;
};

export type OrganizationDocumentFolder = {
    id: number;
    folderName: string;
    description: string;
    departments: string[];
    employeeType: string;
    documentTypes: OrganizationDocumentType[];
};

export type GetOrganizationDocumentFoldersResponse =
    ApiResponse<OrganizationDocumentFolder[]>;

export type EmployeeAcknowledgement = {
    id: number;
    employee: {
        id: number;
        employeeId: string;
        contact: {
            id: number;
            name: string;
            email: string | null;
            phoneNumber: string | null;
        };
        designation: {
            id: number;
            designationName: string;
        } | null;
        status: string;
    };
    status: "acknowledged" | "viewed_not_acknowledged" | "not_acknowledged";
    viewedAttachments: any;
    acknowledgedAt: string | null;
    fileAccessedAt: string | null;
};

export type GetOrganizationDocumentAcknowledgementResponse = ApiResponse<{
    acknowledgements: EmployeeAcknowledgement[];
    total: number;
}>;

export const OrganizationDocApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createOrganizationDocumentFolder: builder.mutation<
            OrganizationDocumentFolder,
            CreateOrganizationDocumentFolderRequest
        >({
            query: (body) => ({
                url: "/organization_documents_folder",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<OrganizationDocumentFolder>) => response.data,
            invalidatesTags: ["OrganizationDocs"],
        }),

        getOrganizationDocumentFolders: builder.query<OrganizationDocumentFolder[], void>({
            query: () => "/organization_documents_folder",
            transformResponse: (response: ApiResponse<OrganizationDocumentFolder[]>) => response.data,
            providesTags: ["OrganizationDocs"],
        }),

        getOrganizationDocumentFolderById: builder.query<OrganizationDocumentFolder, number>({
            query: (id) => `/organization_documents_folder/${id}`,
            transformResponse: (response: ApiResponse<OrganizationDocumentFolder>) => response.data,
            providesTags: ["OrganizationDocs"],
        }),

        updateOrganizationDocumentFolder: builder.mutation<
            OrganizationDocumentFolder,
            { id: number; body: CreateOrganizationDocumentFolderRequest }
        >({
            query: ({ id, body }) => ({
                url: `/organization_documents_folder/${id}`,
                method: "PATCH",
                body,
            }),
            transformResponse: (response: ApiResponse<OrganizationDocumentFolder>) => response.data,
            invalidatesTags: ["OrganizationDocs", "PendingDocs"],
        }),

        deleteOrganizationDocumentFolder: builder.mutation<OrganizationDocumentFolder, number>({
            query: (id) => ({
                url: `/organization_documents_folder/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<OrganizationDocumentFolder>) => response.data,
            invalidatesTags: ["OrganizationDocs"],
        }),

        /* -------------------------------------Document endpoints------------------------------------------- */

        createOrganizationDocument: builder.mutation<
            OrganizationDocumentType,
            { folderId: number; body: FormData }
        >({
            query: ({ folderId, body }) => ({
                url: `/organization_documents/${folderId}`,
                method: "POST",
                body,
                formData: true,
            }),
            transformResponse: (response: ApiResponse<OrganizationDocumentType>) => response.data,
            invalidatesTags: ["OrganizationDocs", "PendingDocs"],
        }),

        updateOrganizationDocument: builder.mutation<
            OrganizationDocumentType,
            { folderId: number; documentId: number; body: FormData }
        >({
            query: ({ folderId, documentId, body }) => ({
                url: `/organization_documents/${folderId}/${documentId}`,
                method: "PATCH",
                body,
                formData: true,
            }),
            transformResponse: (response: ApiResponse<OrganizationDocumentType>) => response.data,
            invalidatesTags: ["OrganizationDocs", "PendingDocs"],
        }),

        getOrganizationDocumentById: builder.query<OrganizationDocumentType, number>({
            query: (id) => `/organization_documents/${id}`,
            transformResponse: (response: ApiResponse<OrganizationDocumentType>) => response.data,
            providesTags: ["OrganizationDocs"],
        }),

        deleteOrganizationDocument: builder.mutation<OrganizationDocumentType, number>({
            query: (id) => ({
                url: `/organization_documents/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<OrganizationDocumentType>) => response.data,
            invalidatesTags: ["OrganizationDocs"],
        }),

        /* Send Acknowledgement */
        updateOrganizationDocumentAcknowledgement: builder.mutation<
            any,
            { id: number; empID: number }
        >({
            query: ({ id, empID }) => ({
                url: `organization_documents/acknowledge/${id}/${empID}`,
                method: "PATCH",
            }),
            invalidatesTags: ["PendingDocs", "MeOrganizationDocuments"],
        }),

        /* View Document */
        getOrganizationDocumentView: builder.query<Blob, { id: number; empID?: number; path: string }>({
            query: ({ id, empID, path }) => ({
                url: `/organization_documents/view/${id}?${new URLSearchParams({
                    path,
                    ...(empID ? { employeeId: String(empID) } : {}),
                }).toString()}`,

                method: "GET",
                responseHandler: async (response) => await response.blob(),
            }),
        }),

        getOrganizationDocumentDownload: builder.query<Blob, { id: number; path: string }>({
            query: ({ id, path }) => ({
                url: `/organization_documents/download/${id}/?path=${encodeURIComponent(path)}`,
                method: "GET",
                responseHandler: async (response) => await response.blob(),
            }),
        }),

        /* Employee Acknowledgement List */
        getOrganizationDocumentAcknowledgement: builder.query<
            GetOrganizationDocumentAcknowledgementResponse,
            { id: number; status?: string }
        >({
            query: ({ id, status }) => {
                let url = `/organization_documents/acknowledgement/${id}`;
                if (status) {
                    url += `?status=${status}`;
                }
                return { url, method: "GET" };
            },
            providesTags: ["OrganizationDocs"],
        }),

        /* Acknowledgement Export */
        getOrganizationAcknowledgementExport: builder.query<
            Blob,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `/organization_documents/acknowledgement/export/${id}`,
                method: "GET",
                responseHandler: async (response) => await response.blob(),
            }),
            providesTags: ["OrganizationDocs"],
        }),

        /* Notify Employees */
        notifyOrganizationDocument: builder.mutation<
            void,
            { documentId: number; body: { employeeId: number[] } }
        >({
            query: ({ documentId, body }) => ({
                url: `/organization_documents/notify/${documentId}`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["OrganizationDocs"],
        }),
    }),
});

export const {
    useCreateOrganizationDocumentFolderMutation,
    useGetOrganizationDocumentFoldersQuery,
    useGetOrganizationDocumentFolderByIdQuery,
    useUpdateOrganizationDocumentFolderMutation,
    useDeleteOrganizationDocumentFolderMutation,
    useCreateOrganizationDocumentMutation,
    useUpdateOrganizationDocumentMutation,
    useGetOrganizationDocumentByIdQuery,
    useDeleteOrganizationDocumentMutation,
    useUpdateOrganizationDocumentAcknowledgementMutation,
    useLazyGetOrganizationDocumentViewQuery,
    useLazyGetOrganizationDocumentDownloadQuery,
    useGetOrganizationDocumentAcknowledgementQuery,
    useLazyGetOrganizationAcknowledgementExportQuery,
    useNotifyOrganizationDocumentMutation,
} = OrganizationDocApi;
