import { baseApi } from "../../../../../api/base.api";

interface AttachmentType {
  filename: string;
  path: string;
}

interface EmployeeDocumentType {
  id: number;
  name: string;
  description: string;
  attachments: AttachmentType[];
  downloadAccess: boolean;
  acknowledgementRequired: boolean;
  blockPortal: boolean;
  createdAt: string;
  updatedAt: string;
  totalAttachmentSize: number;
  acknowledgementStatus: "acknowledged" | "viewed_not_acknowledged" | "not_acknowledged";
}

export interface EmployeeFolder {
  id: number;
  folderName: string;
  description: string;
  departments: string[];
  employeeType: string;
  documentTypes: EmployeeDocumentType[];
  createdAt: string;
  updatedAt: string;
}

interface EmployeeFolderResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: EmployeeFolder[];
}

export const meOrgDocApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getMeOrganizationDocuments: builder.query<EmployeeFolder[], number | undefined>({
            query: (employeeId) => `/organization_documents_folder/permission/${employeeId}`,
            transformResponse: (response: EmployeeFolderResponse) => response.data,
            providesTags: ['MeOrganizationDocuments'],
        })
    })
});

export const { useGetMeOrganizationDocumentsQuery } = meOrgDocApi;
