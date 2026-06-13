import { baseApi } from "../../../../../../api/base.api";

export type PermissionsType = {
  view: boolean;
  download: boolean;
  addUpdate: boolean;
};

export type DocumentCustomFormField = {
  fieldLabel: string;
  fieldType: string;
  values: string[];
  isMandatory: boolean;
};

export type FolderDocumentType = {
  id: number;
  documentTypeName: string;
  description: string;
  isMandatory: boolean;
  isNotApplicable: boolean;
  isVerificationRequired: boolean;
  isFileUploadOptional: boolean;
  attachmentType: string;
  customFormFields: DocumentCustomFormField[];
};

export type EmployeeFolderType = {
  id: number;
  documentFolderName: string;
  description: string;
  employeeSelfPermission: PermissionsType;
  reportingManagerPermission: PermissionsType;
  globalAdminPermission: PermissionsType;
  documentTypes?: FolderDocumentType[];
};

export type EmployeeFolderRequestType = {
  documentFolderName: string;
  description: string;
  employeeSelfPermission: PermissionsType;
  reportingManagerPermission: PermissionsType;
  globalAdminPermission: PermissionsType;
};

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: T;
};

/* ----------------------------------------Folder endpoint types-------------------------------------------------------- */

export enum AttachmentType {
  SINGLE = "single",
  MULTIPLE = "multiple",
}

export enum CustomFieldType {
  SINGLE_SELECT = "Single Select",
  MULTI_SELECT = "Multi Select",
  TEXT = "Text",
  NUMBER = "Number",
}

export type DocumentFolderRef = {
  id: number;
};

export type CustomFormField = {
  fieldLabel: string;
  fieldType: CustomFieldType | string;
  values: string[];
  isMandatory: boolean;
};

export type CreateEmployeeDocumentTypeRequest = {
  documentTypeName: string;
  description: string;
  // documentFolder: DocumentFolderRef;
  isMandatory: boolean;
  isNotApplicable: boolean;
  isVerificationRequired: boolean;
  isFileUploadOptional: boolean;
  attachmentType: AttachmentType | string;
  customFormFields: CustomFormField[];
};

export type EmployeeDocumentType = {
  id: number;
  documentTypeName: string;
  description: string;
  // documentFolder: DocumentFolderRef;
  isMandatory: boolean;
  isNotApplicable: boolean;
  isVerificationRequired: boolean;
  isFileUploadOptional: boolean;
  attachmentType: AttachmentType | string;
  customFormFields: CustomFormField[];
};

export type NotificationItem = {
  employeeId: number;
  detailsId?: number[];
  documentTypeId?: number[];
};

export type NotifyEmployeeDocumentsRequest = {
  toNotify: NotificationItem[];
};

export const EmployeeDocApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notifyEmployeeDocuments: builder.mutation<void, NotifyEmployeeDocumentsRequest>({
      query: (body) => ({
        url: "/employee_documents/notify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeDocs"],
    }),

    createEmployeeDocFolder: builder.mutation<
      EmployeeFolderType,
      EmployeeFolderRequestType
    >({
      query: (body) => ({
        url: "/employee_documents/folder",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeFolderType>) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    getEmployeeDocFolders: builder.query<EmployeeFolderType[], void>({
      query: () => "/employee_documents/folder",
      transformResponse: (response: ApiResponse<EmployeeFolderType[]>) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),
    getEmployeeDocFoldersForMe: builder.query<EmployeeFolderType[], number>({
      query: (id) => `/employee_documents/${id}`,
      transformResponse: (response: ApiResponse<EmployeeFolderType[]>) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    getEmployeeDocFolderById: builder.query<EmployeeFolderType, number>({
      query: (id) => `/employee_documents/folder/${id}`,
      transformResponse: (response: ApiResponse<EmployeeFolderType>) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    updateEmployeeDocFolder: builder.mutation<
      EmployeeFolderType,
      {
        id: number;
        body: EmployeeFolderRequestType;
      }
    >({
      query: ({ id, body }) => ({
        url: `/employee_documents/folder/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeFolderType>) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    deleteEmployeeDocFolder: builder.mutation<EmployeeFolderType, number>({
      query: (id) => ({
        url: `/employee_documents/folder/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<EmployeeFolderType>) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    /* -------------------------------------Employee Folder Type apis------------------------------------------- */

    createEmployeeDocFolderType: builder.mutation<
      EmployeeDocumentType,
      {
        folderId: number;
        body: CreateEmployeeDocumentTypeRequest;
      }
    >({
      query: ({ folderId, body }) => ({
        url: `/employee_documents/folder/${folderId}/type`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeDocumentType>) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    getEmployeeDocFolderTypes: builder.query<EmployeeDocumentType[], number>({
      query: (folderId) => `/employee_documents/folder/${folderId}/type`,
      transformResponse: (response: ApiResponse<EmployeeDocumentType[]>) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    getEmployeeDocFolderTypesWithoutPermissions: builder.query<
      any,
      { folderId: number; employeeId: number }
    >({
      query: ({ folderId, employeeId }) =>
      `/employee_documents/folder/${folderId}?employeeId=${employeeId}`,
      transformResponse: (response: any) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    getEmployeeDocFolderTypeById: builder.query<EmployeeDocumentType, number>({
      query: (id) => `/employee_documents/type/${id}`,
      transformResponse: (response: ApiResponse<EmployeeDocumentType>) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    updateEmployeeDocFolderType: builder.mutation<
      EmployeeDocumentType,
      {
        id: number;
        body: CreateEmployeeDocumentTypeRequest;
      }
    >({
      query: ({ id, body }) => ({
        url: `/employee_documents/type/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<EmployeeDocumentType>) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    deleteEmployeeDocFolderType: builder.mutation<EmployeeDocumentType, number>(
      {
        query: (id) => ({
          url: `/employee_documents/type/${id}`,
          method: "DELETE",
        }),
        transformResponse: (response: ApiResponse<EmployeeDocumentType>) =>
          response.data,
        invalidatesTags: ["EmployeeDocs"],
      },
    ),
  }),
});

export const {
  useNotifyEmployeeDocumentsMutation,
  useCreateEmployeeDocFolderMutation,
  useGetEmployeeDocFoldersQuery,
  useGetEmployeeDocFoldersForMeQuery,
  useGetEmployeeDocFolderByIdQuery,
  useUpdateEmployeeDocFolderMutation,
  useDeleteEmployeeDocFolderMutation,
  useCreateEmployeeDocFolderTypeMutation,
  useGetEmployeeDocFolderTypesQuery,
  useGetEmployeeDocFolderTypeByIdQuery,
  useUpdateEmployeeDocFolderTypeMutation,
  useDeleteEmployeeDocFolderTypeMutation,
  useGetEmployeeDocFolderTypesWithoutPermissionsQuery,
} = EmployeeDocApi;
