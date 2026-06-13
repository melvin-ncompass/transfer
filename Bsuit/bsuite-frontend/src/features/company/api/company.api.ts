import { baseApi } from "../../../api/base.api";
import type {
  IAllCompanyResponse,
  ICompanyDefault,
  ICompanyResponse,
  ICompanyToRegister,
} from "../types/company.types";

export type Attachment = {
  filename: string;
  path: string;
};

export type Document = {
  id: number;
  name: string;
  description: string;
  attachments: Attachment[];
  downloadAccess: boolean;
  acknowledgementRequired: boolean;
  acknowledgementStatus: 'acknowledged' | 'viewed_not_acknowledged' | 'not_acknowledged'
  blockPortal: boolean;
  updatedAt: string; // ISO date string
};


// API Endpoints
const AUTH = {
  COMPANY_ID: "/company/set_current_company",
  COMPANY_REGISTER: "/company",
  COMPANY: "/company/list_all_company",
  DEFAULT_COMPANY: "/company/set_default_company",
  COMPANY_EDIT: "/company",
  COMPANY_DELETE: "/company",
};

// ---------------- Company API ----------------
export const CompanyApi = baseApi.injectEndpoints({
  // Set Current Company ID inside Cookies
  endpoints: (builder) => ({
    setCompanyId: builder.mutation<any, { companyId: string }>({
      query: (body) => ({
        url: AUTH.COMPANY_ID,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company", "Header", "Branding"],
    }),
    //  Company Register
    companyRegistering: builder.mutation<ICompanyResponse, ICompanyToRegister>({
      query: (body) => ({
        url: AUTH.COMPANY_REGISTER,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),

    //  Get All Companies
    getAllCompany: builder.query<IAllCompanyResponse, void>({
      query: () => ({
        url: AUTH.COMPANY,
        method: "GET",
      }),
      providesTags: ["Company"],
    }),

    //  Set Default Company
    setDefaultCompany: builder.mutation<ICompanyResponse, ICompanyDefault>({
      query: (body) => ({
        url: AUTH.DEFAULT_COMPANY,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),

    //  Edit Company
    editCompany: builder.mutation<
      ICompanyResponse,
      { id: number; updateData: Partial<ICompanyToRegister> }
    >({
      query: ({ id, updateData }) => ({
        url: `${AUTH.COMPANY_EDIT}/${id}`,
        method: "PATCH",
        body: updateData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Company",
        { type: "Company" as const, id },
        "Branding",
        "Header",
      ],
    }),

    //  Delete Company
    deleteCompany: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `${AUTH.COMPANY_DELETE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Company"],
    }),

    //  Get Header Data (user + company info)
    getHeaderData: builder.query<
      {
        success: boolean;
        statusCode: number;
        message: string;
        data: {
          companyId?: string;
          companyName?: string;
          companyLogo?: string;
          reportingCurrency?: string;
          commaSeparation?: string;
          userDisplayName: string;
          userEmail: string;
          userProfilePic?: string;
          isDocumentPending?: boolean;
        };
      },
      void
    >({
      query: () => ({
        url: "/company/headers",
        method: "GET",
      }),
      providesTags: ["Header", "ReportStructure"],
    }),

    getPendingDocuments: builder.query<{
      success: boolean;
      statusCode: number;
      message: string;
      data: Document[];
    }, number>({
      query: (empID) => ({
        url: `/organization_documents/pending/${empID}`,
        method: "GET",
      }),
      providesTags: ["PendingDocs"],
    }),
  }),
  overrideExisting: false,
});

// ---------------- Export Hooks ----------------
export const {
  useCompanyRegisteringMutation,
  useGetAllCompanyQuery,
  useSetDefaultCompanyMutation,
  useEditCompanyMutation,
  useDeleteCompanyMutation,
  useSetCompanyIdMutation,
  useGetHeaderDataQuery,
  useGetPendingDocumentsQuery,
} = CompanyApi;
