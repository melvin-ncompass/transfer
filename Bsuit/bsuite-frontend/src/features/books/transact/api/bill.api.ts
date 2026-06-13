import { baseApi } from "../../../../api/base.api";
import type { BillPaymentPayload } from "../utils/paymentTypes";
import type { BillCreatePayload, BillEntity, BillPaymentsData, BillPreviewResponse, Contact, LineItem, Payment, Tax, TotalsResponse } from "../utils/types";

export type BillPreviewApiResponse = {
  bill: BillEntity;
  contact: Contact;
  items: LineItem[];
  payments?: Payment[];
  taxes?: Tax[];
  // totals: Totals;
  fxRate?: number;
};

interface GetLatestBillsResponse {
  timestamp: string;
  message: string;
  data: string[];
}

interface GetBillPaymentResponse {
  data : BillPaymentsData;
}


export const BillApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ------------------ BILL ------------------

    createBill: builder.mutation({
      query: (body: BillCreatePayload) => ({
        url: "/bill/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bill", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

     getBillById: builder.query({
      query: (id: number) => `/bill/${id}`,
      providesTags: ["Bill"],
    }),

    getBillByIdPreview: builder.query<any, number>({
      query: (id: number) => `/bill/${id}/preview`,
      providesTags: ["Bill"],

      transformResponse: (response: any): any => {
        const data = response.data;

        return {
          bill: {
            ...data.bill,
            contact: data.contact,
            items: data.items ?? [],
            taxes: data.taxes ?? [],
            totals: data.totals ?? {},
            billTotal: data.totals?.billTotal,
            finalTotal: data.totals?.finalTotal,
          },
          payments: data.payments ?? [],
          fxRate: data.fxRate ?? 1,
        };
      },
    }),

    updateBill: builder.mutation({
      query: ({
        id,
        updatedData,
      }: {
        id: number | undefined;
        updatedData: BillCreatePayload;
      }) => ({
        url: `/bill/${id}`,
        method: "PATCH",
        body: updatedData,
      }),
      invalidatesTags: ["Bill", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    getLatestBills: builder.query<string[], number>({
      query: (contactId) => `/bill/latest_bills?contactId=${contactId}`,
      transformResponse: (response: GetLatestBillsResponse) => response.data,
      providesTags: ["Bill"],
    }),

    checkBillNumber: builder.query<
      { success: boolean; data: any },
      { billNo: string; ignoreBillId?: number }
    >({
      query: ({ billNo, ignoreBillId }) => ({
        url: `/bill/bill_num_exists`,
        params: {
          billNo,
          ...(ignoreBillId ? { ignoreBillId } : {}),
        },
      }),
    }),

    // ------------------ PAYMENTS ------------------

    // Make Payment
    makeBillPayment: builder.mutation<
      { success: boolean; data: { paymentId: string } },
      BillPaymentPayload
    >({
      query: (body) => ({
        url: "/bill/make_payment",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) =>
        error ? [] : ["Bill", "Journal", "Invoice", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    //Edit Payment
    editBillPayment: builder.mutation<
      { success: boolean; data: { paymentId: string } },
      BillPaymentPayload
    >({
      query: (body) => ({
        url: "/bill/edit_payment",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Bill", "Journal", "Invoice", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    //Get All Payments history for a Bill
    getBillPayments: builder.query<any, string>({
      query: (id) => `/bill/get_all_payments?transactionTypeId=${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ["Bill"],
    }),

    // GET payment details
    getPaymentDetailsForBill: builder.query<
      any,
      { paymentId: string; transactionTypeId: string }
    >({
      query: ({ paymentId, transactionTypeId }) =>
        `/bill/get_payment_details/${paymentId}?transactionTypeId=${transactionTypeId}`,
      providesTags: ["Bill"],
    }),
  }),
});

export const {
  useCheckBillNumberQuery,
  useLazyCheckBillNumberQuery,
  // Bill CRUD
  useCreateBillMutation,
  useGetBillByIdQuery,
  useGetBillByIdPreviewQuery,
  useUpdateBillMutation,
  useGetLatestBillsQuery,

  // Bill Payments
  useMakeBillPaymentMutation,
  useEditBillPaymentMutation,
  useGetBillPaymentsQuery,
  useGetPaymentDetailsForBillQuery,
} = BillApi;
