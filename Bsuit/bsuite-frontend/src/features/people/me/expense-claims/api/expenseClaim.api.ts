import { baseApi } from "../../../../../api/base.api";

export type ExpenseClaimStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export interface ExpenseClaimCategory {
  id: number;
  categoryName: string;
  expenseCode: string;
  maxLimit: number;
  description: string;
  expensePolicy?: { id: number; policyName: string; description: string };
}

export interface ExpenseClaimEmployee {
  id: number;
  employeeId?: string;
  contact?: { id: number; name: string };
  expensePolicy?: { id: number; policyName: string; description: string };
}

export interface ExpenseClaimAttachment {
  filename: string;
  path: string;
}

export interface ExpenseClaimResponse {
  id: number;
  employee: ExpenseClaimEmployee;
  category: ExpenseClaimCategory;
  expenseTitle: string;
  expenseDate: string;
  amount: string | number;
  comment: string;
  status: ExpenseClaimStatus;
  attachments: ExpenseClaimAttachment[];
  requestedOn: string | null;
  approvedOrRejectedBy?: ExpenseClaimEmployee | null;
  paymentBy?: ExpenseClaimEmployee | null;
  transactionTypeId?: string | null;
  rejectionReason?: string | null;
}

export interface CreateExpenseClaimParams {
  categoryId: number;
  expenseTitle: string;
  expenseDate: string;
  amount: number;
  comment: string;
  isSubmit: boolean;
}

export interface UpdateExpenseClaimParams {
  categoryId: number;
  expenseTitle: string;
  expenseDate: string;
  amount: number;
  comment: string;
  isSubmit: boolean;
  updatedAttachments: ExpenseClaimAttachment[];
}

export type ExpenseClaimStatusFilter =
  | "history"
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export interface ExpenseClaimValidation {
  maxLimit: number;
  totalClaimedAmount: number;
  isAmountExceeded: boolean;
}

export interface GetEmployeeExpenseClaimsArgs {
  employeeEmail: string;
  status?: ExpenseClaimStatusFilter;
}
// To provide list of expense claims for tagging
const providesList = (resultsWithIds: any[] | undefined, tagType: string) => {
  return resultsWithIds
    ? [
      { type: tagType, id: 'LIST' },
      ...resultsWithIds.map(({ id }) => ({ type: tagType, id })),
    ]
    : [{ type: tagType, id: 'LIST' }];
};

export const expenseClaimApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyExpenseClaims: builder.query<
      ExpenseClaimResponse[],
      ExpenseClaimStatusFilter | void
    >({
      query: (status) => ({
        url: "/expense-claim/my_expense_claims/",
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result) => providesList(result, 'ExpenseClaim'),
    }),
    getEmployeeExpenseClaims: builder.query<
      ExpenseClaimResponse[],
      GetEmployeeExpenseClaimsArgs
    >({
      query: ({ employeeEmail, status }) => ({
        url: "/expense-claim/employee_expense_claims/",
        params: {
          employeeEmail,
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: (response: any) => response.data ?? [],
      providesTags: (_result, _error, { employeeEmail }) => [
        { type: "ExpenseClaim", id: `employee:${employeeEmail}` },
      ],
    }),

    getExpenseClaim: builder.query<ExpenseClaimResponse, number>({
      query: (id) => `/expense-claim/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: "ExpenseClaim", id }],
    }),

    getExpenseClaimOrganization: builder.query<ExpenseClaimResponse[], string>({
      query: (employeeEmail: string) => `expense-claim/employee_expense_claims/?employeeEmail=${employeeEmail}`,
      transformResponse: (response: any) => response.data,
      providesTags: (result) => providesList(result, 'ExpenseClaim'),
    }),

    createExpenseClaim: builder.mutation<ExpenseClaimResponse, FormData>({
      query: (body) => ({
        url: "/expense-claim/",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["ExpenseClaim"],
    }),

    updateExpenseClaim: builder.mutation<
      ExpenseClaimResponse,
      { id: number; body: FormData }
    >({
      query: ({ id, body }) => ({
        url: `/expense-claim/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ExpenseClaim", id },
        "ExpenseClaim",
      ],
    }),

    submitExpenseClaim: builder.mutation<ExpenseClaimResponse, number>({
      query: (id) => ({
        url: `/expense-claim/${id}/submit`,
        method: "PATCH",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: "ExpenseClaim", id },
        "ExpenseClaim",
      ],
    }),

    deleteExpenseClaim: builder.mutation<void, number>({
      query: (id) => ({
        url: `/expense-claim/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExpenseClaim"],
    }),

    validateExpenseClaim: builder.query<ExpenseClaimValidation, number>({
      query: (id) => `/expense-claim/${id}/validate`,
      transformResponse: (response: any) => response.data,
    }),

  }),
});

export const {
  useGetMyExpenseClaimsQuery,
  useGetEmployeeExpenseClaimsQuery,
  useGetExpenseClaimQuery,
  useCreateExpenseClaimMutation,
  useUpdateExpenseClaimMutation,
  useSubmitExpenseClaimMutation,
  useDeleteExpenseClaimMutation,
  useGetExpenseClaimOrganizationQuery,
  useValidateExpenseClaimQuery,
} = expenseClaimApi;