import { baseApi } from "../../../../../../api/base.api";

// interfaces for api responses
// Interface for individual earning/deduction item
export interface SalaryComponent {
  id: string;
  monthlyAmount: number;
  payslipOrder: number;
}

// Interface for a single salary template
export interface SalaryTemplate {
  id: string;
  templateName: string;
  description: string;
  annualGross: number;
  monthlyGross: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
}

// Interface for the API response
export interface SalaryTemplatesResponse {
  data: SalaryTemplate[];
  message: string;
}

/** Nested earning/deduction as returned by get template by id */
export interface TemplateEarningRef {
  id: number;
  earningName: string;
  nameInPayslip?: string;
  calculationType: "amount" | "percentage";
  amount: string | null;
  percentage: string | null;
  percentageOf: string | { id: number; earningName?: string } | null;
}
export interface TemplateDeductionRef {
  id: number;
  deductionName: string;
  nameInPayslip?: string;
  calculationType: string;
  amount: string;
  percentage?: string | null;
  percentageOf?: string | { id: number; earningName?: string } | null;
}
export interface TemplateEarningItem {
  id: number;
  earning: TemplateEarningRef;
  monthlyAmount: string;
  payslipOrder: number;
}
export interface TemplateDeductionItem {
  id: number;
  deduction: TemplateDeductionRef;
  monthlyAmount: string;
  payslipOrder: number;
}

/** Salary template as returned by get template by id */
export interface SalaryTemplateDetail {
  id: number;
  templateName: string;
  description: string;
  annualGross: string;
  monthlyGross: string;
  earnings: TemplateEarningItem[];
  deductions: TemplateDeductionItem[];
}
export interface SalaryTemplatesByIdResponse {
  data: SalaryTemplateDetail;
  message: string;
}

// Info about the created salary template
export interface CreatedSalaryTemplateData {
  id: string;
  templateName: string;
}

// Info about the change log
export interface ChangeOfData {
  id: string;
  transactionTypeName: string;
  transactionTypeId: string;
  module: string;
  feature: string;
  status: string;
}

// API response for create salary template
export interface CreateSalaryTemplateResponse {
  data: CreatedSalaryTemplateData;
  message: string;
  change_of_data: ChangeOfData;
}

// request interfaces
export interface EarningComponentRequest {
  earningId: number;
  monthlyAmount: string;
  payslipOrder: number;
}
export interface DeductionComponentRequest {
  deductionId: number;
  monthlyAmount: string;
  payslipOrder: number;
}

export interface SalaryTemplateRequest {
  templateName: string;
  description: string;
  annualGross: string;
  monthlyGross: string;
  earnings: EarningComponentRequest[];
  deductions: DeductionComponentRequest[];
}

/** BULK DTO */
export interface BulkCreateSalaryTemplateDto {
  templates: SalaryTemplateRequest[];
}

export const salaryTemplateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all salary templates
    getAllSalaryTemplates: builder.query<SalaryTemplatesResponse, void>({
      query: () => ({
        url: `/salary-templates`,
        method: "GET",
      }),
      providesTags: ["Salary Template"],
    }),

    // get salary template by id
    getSalaryTemplateById: builder.query<SalaryTemplatesByIdResponse, string>({
      query: (id) => ({
        url: `/salary-templates/${id}`,
        method: "GET",
      }),
      providesTags: ["Salary Template"],
    }),

    // create salary template
    createSalaryTemplate: builder.mutation<
      CreateSalaryTemplateResponse,
      SalaryTemplateRequest
    >({
      query: (data) => ({
        url: `/salary-templates`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Salary Template"],
    }),

    // update salary template
    updateSalaryTemplate: builder.mutation<
      any,
      { id: string; data: SalaryTemplateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/salary-templates/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Salary Template"],
    }),

    // delete salary template
    deleteSalaryTemplate: builder.mutation<any, string>({
      query: (id) => ({
        url: `/salary-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Salary Template"],
    }),

    /** ---------------- NEW ENDPOINTS ---------------- */

    // download sample excel
    downloadSampleExcel: builder.mutation<Blob, void>({
      query: () => ({
        url: `/salary-templates/download_sample_excel`,
        method: "POST",
        responseHandler: (response) => response.blob(),
      }),
    }),

    // import salary templates (file upload)
    importSalaryTemplates: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: `/salary-templates/import`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Salary Template"],
    }),

    // validate salary templates
    validateSalaryTemplates: builder.mutation<
      any,
      BulkCreateSalaryTemplateDto
    >({
      query: (data) => ({
        url: `/salary-templates/validate`,
        method: "POST",
        body: data,
      }),
    }),

    // bulk create salary templates
    bulkCreateSalaryTemplates: builder.mutation<
      any,
      BulkCreateSalaryTemplateDto
    >({
      query: (data) => ({
        url: `/salary-templates/bulk_create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Salary Template"],
    }),
  }),
});

// Export Hooks
export const {
  useGetAllSalaryTemplatesQuery,
  useGetSalaryTemplateByIdQuery,
  useCreateSalaryTemplateMutation,
  useUpdateSalaryTemplateMutation,
  useDeleteSalaryTemplateMutation,
  useDownloadSampleExcelMutation,
  useImportSalaryTemplatesMutation,
  useValidateSalaryTemplatesMutation,
  useBulkCreateSalaryTemplatesMutation,
} = salaryTemplateApi;