import { baseApi } from "../../../../api/base.api";
import type {
  BillCreatePayload,
  Contact,
  InvoiceCreatePayload,
  InvoiceEntity,
  InvoiceFormState,
  InvoicePreviewResponse,
  LineItem,
  Payment,
  Tax,
  TotalsResponse,
  ValueUnit,
} from "../utils/types";
import type {
  CreatePaymentPayload,
  EditPaymentPayload,
} from "../utils/paymentTypes";

interface ItemTaxPayload {
  taxId: number;
  isOverride: boolean;
  type: ValueUnit;
  value: number;
}

export type InvoicePreviewApiResponse = {
  invoice: InvoiceEntity & {
    contact?: Contact;
    items?: LineItem[];
    invoiceTotal?: number;
    finalTotal?: number;
  };
  payments: Payment[];
  fxRate: number;

  taxes?: Tax[];
  totals?: TotalsResponse;
};


function mapTax(state: InvoiceFormState) {
  const tax = state.transactionTax;
  const hasLineItemTax = state.rows.some(
    (row) => row.taxes != null && row.taxes.length > 0,
  );
  const hasTax = (tax?.taxes?.length ?? 0) > 0 || hasLineItemTax;

  if (!hasTax) {
    return {
      hasTax: false,
    };
  }

  // Transaction-level tax
  if (tax?.taxes?.length) {
    return {
      hasTax: true,
      taxLevel: tax.level,
      taxes: tax.taxes.map((t) => {
        const breakupEntry = state.summary.taxBreakup.find(
          (b) => String(b.taxId) === String(t.taxId),
        );
        return {
          taxId: Number(t.taxId),
          isOverride: !!t.isTaxOverridden,
          type: t.taxUnit,
          value: t.taxPercent,
          totalAmount: breakupEntry?.value ?? 0,
        };
      }),
      totalTaxValue: String(state.summary.totalTax ?? 0),
    };
  }

  // Only line-item tax
  return {
    hasTax: true,
    taxLevel: "item" as const,
    totalTaxValue: String(state.summary.totalTax ?? 0),
  };
}

function mapTds(state: InvoiceFormState) {
  const tds = state.transactionTds;
  const hasLineItemTds = state.rows.some(
    (row) => row.tdsValue != null && Number(row.tdsValue) > 0,
  );
  const hasTds = !!tds || hasLineItemTds;

  if (!hasTds)
    return {
      hasTds: false,
    };

  return {
    hasTds: true,
    tdsLevel: tds?.level ?? "item",
    tdsType: tds?.level === "total" ? tds.unit : undefined,
    tdsValue:
      tds?.level === "total" && tds.value != null
        ? String(tds.value)
        : undefined,

    // REQUIRED BY BACKEND
    totalTdsValue: String(state.summary.totalTdsValue ?? 0),
  };
}

function mapDiscount(state: InvoiceFormState) {
  const isItemLevel = state.flags.showInlineDisc;
  const discount = state.transactionDiscount;

  // Item-level discount
  if (isItemLevel) {
    return {
      hasDiscount: state.rows.some((r) => r.discountValue > 0),
      discountLevel: "item" as const,
      discountApplied: "after" as const,
      totalDiscountValue: String(state.summary.totalDiscountValue ?? 0),
    };
  }

  // No discount
  if (!discount) {
    return {
      hasDiscount: false,
      totalDiscountValue: "0",
    };
  }

  // Transaction-level discount
  return {
    hasDiscount: true,
    discountLevel: "total" as const,
    discountApplied: discount.applied,
    discountType: discount.unit,
    discountValue: discount.value != null ? String(discount.value) : undefined,
    totalDiscountValue: String(state.summary.totalDiscountValue ?? 0),
    discountAccountId: discount.accountId,
  };
}

function mapItems(state: InvoiceFormState) {
  const isItemLevelDiscount = state.flags.showInlineDisc;
  return state.rows.map((row) => ({
    itemName: row.itemName,
    itemAccountId: Number(row.accountId),
    hsnSac: row.hsnSac,
    quantity: String(row.quantity),
    unitPrice: String(row.price),
    itemTotal: String(row.rowTotal),

    // Inline TDS
    itemTdsValue:
      row.tdsValue && row.tdsValue > 0 ? String(row.tdsValue) : undefined,
    itemTdsType: row.tdsValue && row.tdsValue > 0 ? row.tdsUnit : undefined,

    // Inline Discount
    itemDiscountValue:
      isItemLevelDiscount && row.discountValue > 0
        ? String(row.discountValue)
        : undefined,
    itemDiscountType:
      isItemLevelDiscount && row.discountValue > 0
        ? row.discountUnit
        : undefined,
    itemDiscountAccountId:
      isItemLevelDiscount && row.discountAccountId
        ? row.discountAccountId
        : undefined,

    // Taxes
    itemTax: (row.taxes ?? []).map(
      (t): ItemTaxPayload => ({
        taxId: Number(t.taxId),
        isOverride: !!t.isTaxOverridden,
        type: t.taxUnit === "value" ? "value" : "percent",
        value: t.taxPercent,
      }),
    ),
  }));
}

export function mapFormStateToPayload(
  state: InvoiceFormState,
): InvoiceCreatePayload | BillCreatePayload {
  if (state.formType === "Invoice") {
    return {
      contactId: state.header.contactId!,
      invoiceNo: state.header.documentNo,
      invoiceDate: state.header.documentDate,
      invoiceDueDate: state.header.dueDate,
      invoiceCurrency: state.header.currency,
      serviceStartDate: state.header.serviceStartDate,
      serviceEndDate: state.header.serviceEndDate,
      fxRate: state.header.fxRate ?? 1,
      originalFxRate: state.header.originalFxRate ?? 1,
      notes: state.header.notes,
      // hasTds: !!state.transactionTds,
      // hasDiscount: !!state.transactionDiscount,
      invoiceTotal: String(state.summary.invoiceTotal),
      isRoundOff: state.roundOffMode !== "none",
      roundoffTotal: String(state.summary.roundoffTotal),
      ...mapTds(state),
      ...mapTax(state),
      ...mapDiscount(state),
      items: mapItems(state),
    };
  }

  return {
    contactId: state.header.contactId!,
    billNo: state.header.documentNo,
    billDate: state.header.documentDate,
    billDueDate: state.header.dueDate,
    billCurrency: state.header.currency,
    serviceStartDate: state.header.serviceStartDate,
    serviceEndDate: state.header.serviceEndDate,
    fxRate: state.header.fxRate ?? 1,
    originalFxRate: state.header.originalFxRate ?? 1,
    notes: state.header.notes,
    // hasTds: !!state.transactionTds,
    // hasDiscount: !!state.transactionDiscount,
    billTotal: String(state.summary.invoiceTotal),
    isRoundOff: state.roundOffMode !== "none",
    roundoffTotal: String(state.summary.roundoffTotal),
    ...mapTds(state),
    ...mapTax(state),
    ...mapDiscount(state),
    items: mapItems(state),
  };
}

export const InvoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createInvoice: builder.mutation({
      query: (body: InvoiceCreatePayload) => ({
        url: "/invoice/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoice", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // PREFILL
    getInvoiceById: builder.query({
      query: (id: number) => `/invoice/${id}`,
      providesTags: ["Invoice"],
    }),

    //PATCH
    getInvoiceByIdPreview: builder.query<any, number>({
      query: (id: number) => `/invoice/${id}/preview`,
      providesTags: ["Invoice"],

      transformResponse: (response: any): any => {
        const data = response.data;

        return {
          invoice: {
            ...data.invoice,
            contact: data.contact,
            items: data.items ?? [],
            taxes: data.taxes ?? [],
            totals: data.totals ?? {},
            invoiceTotal: data.totals?.invoiceTotal,
            finalTotal: data.totals?.finalTotal,
          },
          payments: data.payments ?? [],
          fxRate: data.fxRate ?? 1,
        };
      },
    }),

    updateInvoice: builder.mutation({
      query: ({
        id,
        updatedData,
      }: {
        id: number | undefined;
        updatedData: InvoiceCreatePayload;
      }) => ({
        url: `/invoice/${id}`,
        method: "PATCH",
        body: updatedData,
      }),
      invalidatesTags: ["Invoice", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    //  (latest invoices for a contact)
    getLatestInvoices: builder.query<string[], number>({
      query: (contactId) => `/invoice/latest_invoices?contactId=${contactId}`,
      providesTags: ["Invoice"],
      transformResponse: (response: any) => response.data,
    }),

    checkInvoiceNumber: builder.query<
      { success?: boolean; data?: any },
      {
        invoiceNo: string;
        contactId: number;
        ignoreInvoiceId?: number;
      }
    >({
      query: ({ invoiceNo, contactId, ignoreInvoiceId }) => ({
        url: "/invoice/inv_num_exists",
        params: {
          invoiceNo,
          contactId,
          ...(ignoreInvoiceId ? { ignoreInvoiceId } : {}),
        },
      }),
    }),

    createPayment: builder.mutation<
      {
        success: boolean;
        data: { transactionTypeId: string; paymentId: string };
      },
      CreatePaymentPayload
    >({
      query: (body) => ({
        url: "/invoice/receive_payment",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) =>
        error ? [] : ["Bill", "Journal", "Invoice", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // Edit payment
    editPayment: builder.mutation<{ success: boolean }, EditPaymentPayload>({
      query: (body) => ({
        url: "/invoice/edit_payment",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Bill", "Journal", "Invoice", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // PAYMENTS HISTORY
    getAllPayments: builder.query<any, string>({
      query: (transactionTypeId) =>
        `/invoice/get_all_payments?transactionTypeId=${transactionTypeId}`,
      transformResponse: (response: any) => response.data,
      providesTags: ["Invoice"],
    }),

    // GET payment details
    getPaymentDetailsForInvoice: builder.query<
      any,
      { paymentId: string; transactionTypeId: string }
    >({
      query: ({ paymentId, transactionTypeId }) =>
        `/invoice/get_payment_details/${paymentId}?transactionTypeId=${transactionTypeId}`,
      providesTags: ["Invoice"],
    }),
  }),
});

export const {
  useCheckInvoiceNumberQuery,
  useLazyCheckInvoiceNumberQuery,
  useCreateInvoiceMutation,
  useGetAllPaymentsQuery,
  useGetInvoiceByIdQuery,
  useGetInvoiceByIdPreviewQuery,
  useUpdateInvoiceMutation,
  useCreatePaymentMutation,
  useEditPaymentMutation,
  useGetLatestInvoicesQuery,
  useGetPaymentDetailsForInvoiceQuery,
} = InvoiceApi;
