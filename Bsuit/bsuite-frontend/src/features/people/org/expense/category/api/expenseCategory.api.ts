import { baseApi } from "../../../../../../api/base.api";

export interface ExpenseCategoryParams {
  categoryName: string;
  expenseCode: string;
  expensePolicyId: number;
  maxLimit: number;
  description: string;
}

export interface ExpenseCategoryResponse {
  id: number;
  categoryName: string;
  expenseCode: string;
  expensePolicy: any;
  maxLimit: number;
  description: string;
}

type ApiMutationResponse<T> = {
  data: T;
  message?: string;
};

export const expenseCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenseCategories: builder.query<ExpenseCategoryResponse[], void>({
      query: () => "/expense_category",
      transformResponse: (response: any) => response.data,
      providesTags: ["ExpenseCategory"],
    }),
    getExpenseCategory: builder.query<ExpenseCategoryResponse, string | number>({
      query: (id) => `/expense_category/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: "ExpenseCategory", id }],
    }),
    createExpenseCategory: builder.mutation<
      ApiMutationResponse<ExpenseCategoryResponse>,
      ExpenseCategoryParams
    >({
      query: (body) => ({
        url: "/expense_category",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiMutationResponse<ExpenseCategoryResponse>) =>
        response,
      invalidatesTags: (_result, error) => (error ? [] : ["ExpenseCategory"]),
    }),
    updateExpenseCategory: builder.mutation<
      ApiMutationResponse<ExpenseCategoryResponse>,
      { id: string | number; body: Partial<ExpenseCategoryParams> }
    >({
      query: ({ id, body }) => ({
        url: `/expense_category/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiMutationResponse<ExpenseCategoryResponse>) =>
        response,
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: "ExpenseCategory", id }, "ExpenseCategory"],
    }),
    deleteExpenseCategory: builder.mutation<ApiMutationResponse<null>, string | number>({
      query: (id) => ({
        url: `/expense_category/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiMutationResponse<null>) => response,
      invalidatesTags: (_result, error) => (error ? [] : ["ExpenseCategory"]),
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useGetExpenseCategoryQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
} = expenseCategoryApi;
