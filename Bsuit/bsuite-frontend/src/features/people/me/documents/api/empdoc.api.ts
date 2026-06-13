import { baseApi } from "../../../../../api/base.api";

/* =====================================================
   🔹 Common / Reusable Interfaces
===================================================== */

export interface Attachment {
  filename: string;
  path: string;
}

export interface CustomFormField {
  values: string[];
  fieldType: string;
  fieldLabel: string;
  isMandatory: boolean;
}

export interface DocumentType {
  id: number;
  documentTypeName: string;
  description: string;
  isMandatory: boolean;
  isNotApplicable: boolean;
  isVerificationRequired: boolean;
  isFileUploadOptional: boolean;
  attachmentType: "single" | "multiple";
  customFormFields: CustomFormField[];
  updatedAt: string;
}

export interface EmployeeBasic {
  id: number;
  employeeId: string;
  gender: string;
  employeeType: string;
  dateOfJoining: string;
  status: string;
}

export interface EmployeeDocumentDetails {
  id: number;
  documentType: DocumentType;
  attachments: Attachment[];
  customFields: Record<string, any> | null;
  submissionDate: string;
  rejectedReason: string | null;
  status: "rejected" | "not_verified" | "verified";
  isNotApplicable: boolean;
  employee: EmployeeInfo;
  uploadedBy: EmployeeInfo;
  employeeDesignation:string;
  employeeDepartment:string;
  recordIds: number[];
  updatedAt: string;
}

export interface PendingDocument {
  id: number;
  documentTypeName: string;
  description: string;
  isMandatory: boolean;
  isNotApplicable: boolean;
  isVerificationRequired: boolean;
  isFileUploadOptional: boolean;
  attachmentType: "single" | "multiple";
  customFormFields: CustomFormField[];
  updatedAt: string;
}
export interface EmployeeDetailed {
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
  isPfEnabled: boolean;
  probationEndDate: string | null;
  inProbation: boolean;
  nameAsPerAadhar: string | null;
  nameAsPerPan: string | null;
  maritalStatus: string | null;
  isPayrollEnabled: boolean;
  isAttendanceEnabled: boolean;
  isEmployeePortalEnabled: boolean;
}
export interface RejectedDocument{
    id:number;
    attachments:any[];
    customFields:CustomFormField[];
    documentType:PendingDocument;
    employee:EmployeeDetailed;
    isNotApplicable:boolean;
    rejectedReason:string;
    status:string;
    submissionDate:string;
    updatedAt:string;
    updatedBy:EmployeeDetailed
}
export interface GroupByDocuments{
    employeeDepartment:string;
    employeeDesignation:string;
    employeeName:string;
    pending:PendingDocument[];
    rejected:RejectedDocument[];

}
export interface EmployeeInfo {
  id: number;
  contact: {
    id: number;
    name: string;
    middleName?: string | null;
    lastName?: string | null;
    email: string | null;
    phoneNumber: string;
    dialCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string | null;
    gstin?: string | null;
    isArchived?: boolean;
    showInReports?: boolean;
    isOrganization?: boolean;
    economicTerritory?: string | null;
    pan?: string | null;
    tdsPrefillValue?: number;
    position?: string | null;
  };
  department: { id: number; departmentName: string };
  designation: { id: number; designationName: string };
  employeeId: string;
  gender: string;
  employeeType: string;
  dateOfJoining: string;
  pfNumber?: string | null;
  uanNumber?: string | null;
  dateOfBirth: string;
  personalEmail?: string | null;
  emergencyContact?: string | null;
  fatherName?: string | null;
  bloodGroup?: string | null;
  aadharNumber?: string | null;
  status: string;
  bankAccountNo?: string | null;
  bankAccountHolderName?: string | null;
  bankIfscCode?: string | null;
  bankName?: string | null;
  bankBranchName?: string | null;
  isPfEnabled: boolean;
  probationEndDate?: string | null;
  inProbation: boolean;
  nameAsPerAadhar?: string | null;
  nameAsPerPan?: string | null;
  maritalStatus?: string | null;
  isPayrollEnabled: boolean;
  isAttendanceEnabled: boolean;
  isEmployeePortalEnabled: boolean;
}
export interface Attachment {
  filename: string;
  path: string;
}
/* =====================================================
   🔹 Response Types
===================================================== */

export interface PendingDocumentsResponse {
  groupedByEmployee: Record<
    string,
    {
      rejected: EmployeeDocumentDetails[];
      pending: PendingDocument[]; // <-- changed from number[] to EmployeeDocumentDetails[]
      employeeName: string; // optional if you want to store it at this level
      employeeDesignation: string;
      employeeDepartment: string;
    }
  >;
  groupedByDocuments: GroupByDocuments;
}
export interface VerificationPendingResponse {
  groupedByEmployee: Record<
    string,
    {
      employeeName: string; // optional, can pull from employee.contact.name
      employeeDesignation: string;
      employeeDepartment: string;
      documents: EmployeeDocumentDetails[];
    }
  >;
  groupedByDocuments: Record<string, EmployeeDocumentDetails[]>; 
}

export interface VerifiedDocumentsResponse {
  groupedByEmployee: Record<
    string,
    {
      employeeName: string;
      employeeDesignation: string;
      employeeDepartment: string;
      documents: EmployeeDocumentDetails[];
    }
  >;
  groupedByDocuments: Record<string, EmployeeDocumentDetails[]>;
}
/* =====================================================
   🔹 Request Types
===================================================== */

export interface BulkRejectPayload {
  rejectedReason: string;
  detailsIds: number[];
}

export interface BulkVerifyPayload {
  detailsIds: number[];
}

/* =====================================================
   🔹 API Slice
===================================================== */

export const empdocsapi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ------------------ Pending ------------------ */
    getPendingDocumentsForEmployee: builder.query<PendingDocumentsResponse, void>({
      query: () => `/employee_documents/documents/pending`,
      transformResponse: (response: { data: PendingDocumentsResponse }) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Verification Pending ---------------- */
    getVerificationPendingDocuments: builder.query<
      VerificationPendingResponse,
      void
    >({
      query: () => `/employee_documents/documents/verification_pending`,
      transformResponse: (response: { data: VerificationPendingResponse }) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Verified ---------------- */
    getVerifiedDocuments: builder.query<VerifiedDocumentsResponse, void>({
      query: () => `/employee_documents/documents/verified`,
      transformResponse: (response: { data: VerifiedDocumentsResponse }) =>
        response.data,
      providesTags: ["EmployeeDocs"],
    }),

 verifyDoc: builder.mutation<void, {id:number}>({
      query: ({id}) => ({
        url: `/employee_documents/verify/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["EmployeeDocs"],
    }),
    /* ---------------- Upload ---------------- */
    uploadEmployeeDocument: builder.mutation<
      EmployeeDocumentDetails,
      { employeeId: string; typeId: number; body: FormData }
    >({
      query: ({ employeeId, typeId, body }) => ({
        url: `/employee_documents/upload_doc/${employeeId}/${typeId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: EmployeeDocumentDetails }) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Update ---------------- */
    updateEmployeeDocument: builder.mutation<
      EmployeeDocumentDetails,
      {
        employeeId: string;
        typeId: number;
        detailsId?: number|null;
        body: FormData;
      }
    >({
      query: ({ employeeId, typeId, body }) => ({
        url: `/employee_documents/update_doc/${employeeId}/${typeId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: { data: EmployeeDocumentDetails }) =>
        response.data,
      invalidatesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Single Reject ---------------- */
    rejectDocument: builder.mutation<void, {id:number,reason:string}>({
      query: ({id,reason}) => ({
        url: `/employee_documents/reject/${id}`,
        method: "PATCH",
        body:{rejectedReason:reason}
      }),
      invalidatesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Bulk Reject ---------------- */
    bulkRejectDocuments: builder.mutation<void, BulkRejectPayload>({
      query: (body) => ({
        url: `/employee_documents/bulk_reject`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Bulk Verify ---------------- */
    bulkVerifyDocuments: builder.mutation<void, BulkVerifyPayload>({
      query: (body) => ({
        url: `/employee_documents/bulk_verify`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["EmployeeDocs"],
    }),

    /* ---------------- Delete Document ---------------- */
    deleteEmployeeDocument: builder.mutation<void, number>({
      query: (id) => ({
        url: `/employee_documents/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmployeeDocs"],
    }),
  }),
});

/* =====================================================
   🔹 Hooks
===================================================== */

export const {
  useGetPendingDocumentsForEmployeeQuery,
  useGetVerificationPendingDocumentsQuery,
  useGetVerifiedDocumentsQuery,
  useVerifyDocMutation,
  useUploadEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
  useRejectDocumentMutation,
  useBulkRejectDocumentsMutation,
  useBulkVerifyDocumentsMutation,
  useDeleteEmployeeDocumentMutation,
} = empdocsapi;
