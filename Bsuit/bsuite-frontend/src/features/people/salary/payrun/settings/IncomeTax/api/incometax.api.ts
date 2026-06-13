import { baseApi } from "../../../../../../../api/base.api";
import type {
  IncomeTaxVersion,
  IncomeTaxListResponse,
  IncomeTaxSingleResponse,
  IncomeTaxCreateUpdateResponse,
  IncomeTaxDeleteResponse,
  FinancialYearItem,
  FinancialYearsResponse,
  CreateIncomeTaxDto,
  UpdateIncomeTaxDto,
  ExemptionsSubmitPayload,
} from "../types/incometax.types";

const INCOME_TAX_URL = "/income_tax";

export const incomeTaxApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeTaxes: builder.query<IncomeTaxVersion[], void>({
      query: () => ({ url: INCOME_TAX_URL, method: "GET" }),
      transformResponse: (response: IncomeTaxListResponse) => response.data ?? [],
      providesTags: ["IncomeTax"],
    }),

    getIncomeTax: builder.query<IncomeTaxVersion, number>({
      query: (id) => ({ url: `${INCOME_TAX_URL}/${id}`, method: "GET" }),
      transformResponse: (response: IncomeTaxSingleResponse) => response.data!,
      providesTags: ["IncomeTax"],
    }),

    getFinancialYearsByConfig: builder.query<FinancialYearItem[], number>({
      query: (configId) => ({
        url: `${INCOME_TAX_URL}/financial_years/${configId}`,
        method: "GET",
      }),
      transformResponse: (response: FinancialYearsResponse) => response.data ?? [],
      providesTags: ["IncomeTax"],
    }),

    createIncomeTax: builder.mutation<IncomeTaxCreateUpdateResponse, CreateIncomeTaxDto>({
      query: (body) => ({
        url: INCOME_TAX_URL,
        method: "POST",
        body,
      }),
      invalidatesTags: ["IncomeTax"],
    }),

    updateIncomeTax: builder.mutation<
      IncomeTaxCreateUpdateResponse,
      { id: number; dto: UpdateIncomeTaxDto }
    >({
      query: ({ id, dto }) => ({
        url: `${INCOME_TAX_URL}/${id}`,
        method: "PATCH",
        body: dto,
      }),
      invalidatesTags: ["IncomeTax"],
    }),

    deleteIncomeTax: builder.mutation<IncomeTaxDeleteResponse["data"], number>({
      query: (id) => ({
        url: `${INCOME_TAX_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["IncomeTax"],
    }),

    // Backend: PATCH /income_tax/tax_exemption/:id with body { taxExemption }
    saveExemptions: builder.mutation<
      { data?: unknown; message?: string },
      ExemptionsSubmitPayload
    >({
      query: (payload) => ({
        url: `${INCOME_TAX_URL}/tax_exemption/${payload.versionId}`,
        method: "PATCH",
        body: { taxExemption: payload.sections },
      }),
      // RTK Query also runs invalidatesTags on `rejectedWithValue` (typical HTTP errors).
      // Skip invalidation on failure so GET /income_tax/:id and financial_years are not refetched.
      invalidatesTags: (_result, error) => (error ? [] : ["IncomeTax"]),
    }),
  }),
});

export const {
  useGetIncomeTaxesQuery,
  useGetIncomeTaxQuery,
  useGetFinancialYearsByConfigQuery,
  useCreateIncomeTaxMutation,
  useUpdateIncomeTaxMutation,
  useDeleteIncomeTaxMutation,
  useSaveExemptionsMutation,
} = incomeTaxApi;
