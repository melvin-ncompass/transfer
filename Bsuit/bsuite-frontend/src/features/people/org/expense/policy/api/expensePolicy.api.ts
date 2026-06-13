import { baseApi } from "../../../../../../api/base.api";

export interface ExpensePolicyParams {
  policyName: string;
  description: string;
  approver: string;
}

export interface ExpensePolicyResponse {
  id: number;
  policyName: string;
  description: string;
  approver: any;
}

type ApiMutationResponse<T> = {
  data: T;
  message?: string;
};

export const expensePolicyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpensePolicies: builder.query<ExpensePolicyResponse[], void>({
      query: () => "/expense_policy",
      transformResponse: (response: any) => response.data,
      providesTags: ["ExpensePolicy"],
    }),
    getExpensePolicy: builder.query<ExpensePolicyResponse, string | number>({
      query: (id) => `/expense_policy/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: "ExpensePolicy", id }],
    }),
    createExpensePolicy: builder.mutation<
      ApiMutationResponse<ExpensePolicyResponse>,
      ExpensePolicyParams
    >({
      query: (body) => ({
        url: "/expense_policy",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiMutationResponse<ExpensePolicyResponse>) =>
        response,
      invalidatesTags: (_result, error) => (error ? [] : ["ExpensePolicy"]),
    }),
    updateExpensePolicy: builder.mutation<
      ApiMutationResponse<ExpensePolicyResponse>,
      { id: string | number; body: Partial<ExpensePolicyParams> }
    >({
      query: ({ id, body }) => ({
        url: `/expense_policy/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiMutationResponse<ExpensePolicyResponse>) =>
        response,
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: "ExpensePolicy", id }, "ExpensePolicy"],
    }),
    deleteExpensePolicy: builder.mutation<ApiMutationResponse<null>, string | number>({
      query: (id) => ({
        url: `/expense_policy/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiMutationResponse<null>) => response,
      invalidatesTags: (_result, error) => (error ? [] : ["ExpensePolicy"]),
    }),
  }),
});

export const {
  useGetExpensePoliciesQuery,
  useGetExpensePolicyQuery,
  useCreateExpensePolicyMutation,
  useUpdateExpensePolicyMutation,
  useDeleteExpensePolicyMutation,
} = expensePolicyApi;
