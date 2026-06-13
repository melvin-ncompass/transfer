import { baseApi } from "../../../../../../api/base.api";

// --------------------------------------------
// Interfaces for API requests/responses
// --------------------------------------------

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

export interface RevisedSalaryTemplateRequest {
  revisionType: "amount" | "percentage";
  revisedAnnualGross: string;
  revisedMonthlyGross: string;
  reviseGrossPercent?: string;
  effectiveDate: string;
  payoutDate: string;
  earnings?: EarningComponentRequest[];
  deductions?: DeductionComponentRequest[];
}

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

// --------------------------------------------
// Shape when a revision EXISTS
// /revised/latest/:id  →  has revisedAnnualGross
// --------------------------------------------
export interface RevisedSalaryTemplateDetail {
  id: number;

  // present only when a revision exists
  template?: {
    id: number;
    annualGross: string;
    monthlyGross: string;
    createdAt?: string;
    updatedAt?: string;
  };

  revisionType?: "amount" | "percentage";
  reviseGrossPercent?: string | null;

  // actual field names from API (not Ctc)
  revisedAnnualGross?: string;
  revisedMonthlyGross?: string;

  effectiveDate?: string;
  payoutDate?: string;

  // present only when a revision exists
  components?: {
    id: number;
    compType?: "earning" | "deduction";
    earning: TemplateEarningRef | null;
    deduction: TemplateDeductionRef | null;
    monthlyAmount: string;
    payslipOrder: number;
  }[];

  // --------------------------------------------
  // Shape when NO revision exists
  // /revised/latest/:id  →  base template shape
  // --------------------------------------------

  // present only when no revision exists
  employee?: {
    id: number;
    employeeId: string;
    [key: string]: any;
  };

  annualGross?: string;
  monthlyGross?: string;

  initialTemplate?: {
    id: number;
    templateName: string;
    description?: string;
    annualGross: string;
    monthlyGross: string;
    createdAt?: string;
    updatedAt?: string;
  };

  employeeEarnings?: TemplateEarningItem[];
  employeeDeductions?: TemplateDeductionItem[];

  createdAt?: string;
  updatedAt?: string;
}

// --------------------------------------------
// Shape for history list items
// /revised/:id  →  mix of revised + base entries
// --------------------------------------------
export interface RevisedSalaryHistoryItem {
  id: number;

  // present on revised entries
  revisionType?: "amount" | "percentage";
  reviseGrossPercent?: string | null;
  revisedAnnualGross?: string;
  revisedMonthlyGross?: string;
  effectiveDate?: string;
  payoutDate?: string;
  previousAnnualGross?: string;  // ✅ actual field from API

  // present on base template entries (last item in list)
  employee?: { id: number; employeeId: string;[key: string]: any };
  annualGross?: string;
  monthlyGross?: string;
  initialTemplate?: {
    id: number;
    templateName: string;
    annualGross: string;
    monthlyGross: string;
  };
  employeeEarnings?: TemplateEarningItem[];
  employeeDeductions?: TemplateDeductionItem[];

  createdAt?: string;
  updatedAt?: string;
}

// --------------------------------------------
// API response wrappers
// --------------------------------------------
export interface RevisedSalaryTemplateByIdResponse {
  success?: boolean;
  statusCode?: number;
  message: string;
  data: RevisedSalaryTemplateDetail;
}

export interface RevisedSalaryTemplatesResponse {
  success?: boolean;
  statusCode?: number;
  message: string;
  data: RevisedSalaryHistoryItem[];
}

// --------------------------------------------
// Revised Salary Template API
// --------------------------------------------
export const revisedSalaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRevisedSalaryTemplate: builder.mutation({
      query: ({ employeeId, data }: { employeeId: string; data: RevisedSalaryTemplateRequest }) => ({
        url: `/revised/${employeeId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RevisedSalary"],
    }),

    getRevisedSalaryTemplates: builder.query({
      query: (employeeId: string) => ({
        url: `/revised/${employeeId}`,
        method: "GET",
      }),
      providesTags: ["RevisedSalary"],
    }),

    getRevisedSalaryTemplateById: builder.query({
      query: ({ employeeId, templateId }: { employeeId: string; templateId: string }) => ({
        url: `/revised/${employeeId}/${templateId}`,
        method: "GET",
      }),
      providesTags: ["RevisedSalary"],
    }),

    updateRevisedSalaryTemplate: builder.mutation({
      query: ({ employeeId, templateId, data }: { employeeId: string; templateId: string; data: RevisedSalaryTemplateRequest }) => ({
        url: `/revised/${employeeId}/${templateId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["RevisedSalary"],
    }),

    deleteRevisedSalaryTemplate: builder.mutation({
      query: ({ employeeId, templateId }: { employeeId: string; templateId: string }) => ({
        url: `/revised/${employeeId}/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RevisedSalary"],
    }),

    getLatestRevisedSalaryTemplate: builder.query({
      query: (employeeId: string) => ({
        url: `/revised/latest/${employeeId}`,
        method: "GET",
      }),
      providesTags: ["RevisedSalary"],
    }),
  }),
});

// --------------------------------------------
// Export hooks
// --------------------------------------------
export const {
  useCreateRevisedSalaryTemplateMutation,
  useGetRevisedSalaryTemplatesQuery,
  useGetRevisedSalaryTemplateByIdQuery,
  useUpdateRevisedSalaryTemplateMutation,
  useDeleteRevisedSalaryTemplateMutation,
  useGetLatestRevisedSalaryTemplateQuery,
} = revisedSalaryApi;