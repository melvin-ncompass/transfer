import { baseApi } from "../../../../api/base.api";

const INVOICE = {
  CREATE: "/setting/add_invoice_template",
  GET: "/setting/get_invoice_templates",
  SET_DEFAULT: "/setting/set_default_template",
  UPDATE: "/setting/update_invoice_template",
  DELETE: "/setting/delete_invoice_template",
  EDIT: "/setting/get_invoice_template",
};

export const InvoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---------- Get ----------
    getInvoiceTemplates: builder.query<any, void>({
      query: () => ({
        url: INVOICE.GET,
        method: "GET",
      }),
      providesTags: ["InvoiceTemp"],
    }),
    // ----------- Edit ----------
    editInvoiceTemplate: builder.query<any, number>({
      query: (id) => ({
        url: `${INVOICE.EDIT}/${id}`,
        method: "GET",
      }),
      providesTags: ["InvoiceTemp"],
    }),
    // ---------- Create ----------
    createInvoiceTemplate: builder.mutation<any, any>({
      query: (body) => ({
        url: INVOICE.CREATE,
        method: "POST",
        body,
      }),
      invalidatesTags: ["InvoiceTemp"],
    }),

    // ---------- Set Default ----------
    setDefaultInvoiceTemplate: builder.mutation<any, { id: number }>({
      query: (body) => ({
        url: `${INVOICE.SET_DEFAULT}/${body.id}`,
        method: "POST",
      }),
      invalidatesTags: ["InvoiceTemp"],
    }),
    // UPDATE
    updateInvoiceTemplate: builder.mutation<
      any,
      { id: number; updateData: any }
    >({
      query: (body) => ({
        url: `${INVOICE.UPDATE}/${body.id}`,
        method: "PATCH",
        body: body.updateData,
      }),
      invalidatesTags: ["InvoiceTemp"],
    }),

    // ---------- Delete ----------
    deleteInvoiceTemplate: builder.mutation<any, { id: number }>({
      query: ({ id }) => ({
        url: `${INVOICE.DELETE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InvoiceTemp"],
    }),
  }),
});

export const {
  useGetInvoiceTemplatesQuery,
  useCreateInvoiceTemplateMutation,
  useSetDefaultInvoiceTemplateMutation,
  useUpdateInvoiceTemplateMutation,
  useDeleteInvoiceTemplateMutation,
  useEditInvoiceTemplateQuery,
  useLazyEditInvoiceTemplateQuery,
} = InvoiceApi;
