import { baseApi } from "../../../../../../../api/base.api";
import type { PayslipTemplate, CreateUpdatePayslipTemplatePayload } from "../types/payslipTypes";

export const payslipTemplateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all salary templates
    createPayslipTemplate: builder.mutation<PayslipTemplate, CreateUpdatePayslipTemplatePayload>({
      query: (body) => ({
        url: "payslip_template",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PayslipTemplate"],
    }),

    // Get all payslip templates
    getPayslipTemplates: builder.query<PayslipTemplate[], void>({
      query: () => "payslip_template",
      transformResponse: (response: any) => response.data,
      providesTags: ["PayslipTemplate"],
    }),

    // Get a single payslip template by id
    getPayslipTemplateById: builder.query<PayslipTemplate, number>({
      query: (id) => `payslip_template/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags:["PayslipTemplate"],
    }),

    // Update payslip template
    updatePayslipTemplate: builder.mutation<PayslipTemplate, { id: number; data: CreateUpdatePayslipTemplatePayload }>({
      query: ({ id, data }) => ({
        url: `payslip_template/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["PayslipTemplate"],
    }),

    // Set default payslip template
    setDefaultPayslipTemplate: builder.mutation<PayslipTemplate, number>({
      query: (id) => ({
        url: `payslip_template/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["PayslipTemplate"],
    }),

    // Delete payslip template
    deletePayslipTemplate: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `payslip_template/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PayslipTemplate"],
    }),
  }),
});

// Export hooks
export const {
  useCreatePayslipTemplateMutation,
  useGetPayslipTemplatesQuery,
  useGetPayslipTemplateByIdQuery,
  useUpdatePayslipTemplateMutation,
  useSetDefaultPayslipTemplateMutation,
  useDeletePayslipTemplateMutation,
} = payslipTemplateApi;