import { baseApi } from "../../../../../api/base.api";
import type {
  JournalFormData,
  JournalResponse,
  DetailedJournalResponse,
  IExportPdfTransactRequest,
  RefetchMetaDataTransactTable,
} from "../types/transact.types";

interface IExportResponse {
  data: any;
  message: string;
}

export const transactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create Journal Entry
    createJournal: builder.mutation<JournalResponse, JournalFormData>({
      query: (data) => ({
        url: "/journal",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Journal", "Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // Get Single Journal Entry by ID (for edit/view)
    getJournalById: builder.query<DetailedJournalResponse,
      { id: string; transactionTypeName: string; paymentId?: string }
    >({
      query: ({ id, transactionTypeName, paymentId }) => ({
        url: `/journal/${id}/${transactionTypeName}`,
        method: "GET",
        params: {
          ...(paymentId && { paymentId }),
        },
      }),
      providesTags: (result, error, arg) => [
        { type: "Journal", id: arg.id },
      ],
    }),

    // Update Journal Entry
    updateJournal: builder.mutation<
      JournalResponse,
      { id: string; data: JournalFormData }
    >({
      query: ({ id, data }) => ({
        url: `/journal/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Journal", id: arg.id },
        "AttachmentsTransact",
        "AttachmentsTransactCount",
      ],
    }),

    // Delete Journal Entry
    deleteJournal: builder.mutation<
      { message: string; data?: { uncategorizedIds?: Array<{ id: number }> } },
      {
        transactionTypeId: string;
        transactionTypeName: string;
        paymentId?: string;
      }
    >({
      query: ({ transactionTypeId, transactionTypeName, paymentId }) => ({
        url: `/transact`,
        method: "POST",
        body: {
          transactionTypeId,
          transactionTypeName,
          paymentId,
        },
      }),
      invalidatesTags: ["Journal", "Invoice", "Bill", "Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // Upload Attachments
    uploadAttachments: builder.mutation<
      { data: any; message: string },
      {
        files: File[];
        transactionTypeId: string;
        transactionTypeName: string;
        paymentId?: string;
      }
    >({
      query: ({ files, transactionTypeId, transactionTypeName, paymentId }) => {
        const formData = new FormData();
        // Append all files
        files.forEach((file) => {
          formData.append("attachments", file);
        });
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append("transactionTypeId", transactionTypeId);
        queryParams.append("transactionTypeName", transactionTypeName);
        if (paymentId) {
          queryParams.append("paymentId", paymentId);
        }
        return {
          url: `/transact/attachments?${queryParams.toString()}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // Upload Bill/Invoice Files
    uploadBillInvoice: builder.mutation<
      {
        data: Array<{
          id: string;
          index: number;
          filename: string;
          modifiedFilename: string;
          processed: boolean;
          result: any;
        }>;
        message: string;
        statusCode: number;
      },
      {
        fileIds: string[];
        files: File[];
      }
    >({
      query: ({ fileIds, files }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("fileIds", JSON.stringify(fileIds));

        return {
          url: `/transact/upload_bill_invoice`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Bill", "Invoice", "Journal", "Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // Get Attachments
    getAttachments: builder.query<
      {
        data: Array<{
          id: number;
          transactionTypeName: string;
          transactionTypeId: string;
          paymentId: string | null;
          attachments: Array<{ filename: string; path: string }>;
          createdAt: string;
          updatedAt: string;
        }>;
        message: string;
      },
      {
        transactionTypeId: string;
        transactionTypeName: string;
        paymentId?: string;
      }
    >({
      query: ({ transactionTypeId, transactionTypeName, paymentId }) => {
        const queryParams = new URLSearchParams();
        queryParams.append("transactionTypeId", transactionTypeId);
        queryParams.append("transactionTypeName", transactionTypeName);
        if (paymentId) {
          queryParams.append("paymentId", paymentId);
        }

        return {
          url: `/transact/attachments?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["AttachmentsTransact"],
    }),

    // Delete Attachment
    deleteAttachment: builder.mutation<
      { data: any; message: string },
      {
        transactionTypeId: string;
        transactionTypeName: string;
        filename: string;
        paymentId?: string;
      }
    >({
      query: ({
        transactionTypeId,
        transactionTypeName,
        filename,
        paymentId,
      }) => {
        const queryParams = new URLSearchParams();
        queryParams.append("transactionTypeId", transactionTypeId);
        queryParams.append("transactionTypeName", transactionTypeName);
        queryParams.append("filename", filename);
        if (paymentId) {
          queryParams.append("paymentId", paymentId);
        }

        return {
          url: `/transact/attachments?${queryParams.toString()}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // AttachmentFile
    getAttachmentFile: builder.query<Blob, string>({
      query: (path) => ({
        url: `/transact/attachment_url?path=${encodeURIComponent(path)}`,
        method: "GET",
        // Return the response blob once (don't call response.blob() multiple times)
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    // AttachmentCount
    getAttachmentCount: builder.query<
      any,
      {
        transactionTypeId: string;
        transactionTypeName: string;
        paymentId?: string;
      }
    >({
      query: ({ transactionTypeId, transactionTypeName, paymentId }) => {
        const params = new URLSearchParams({
          transactionTypeId,
          transactionTypeName,
        });

        if (paymentId) {
          params.append("paymentId", paymentId);
        }

        return {
          url: `transact/attachments/count?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["AttachmentsTransactCount"],
    }),

    // Get Transaction Names/Types
    getTransactionNames: builder.query<
      {
        success: boolean;
        statusCode: number;
        timestamp: string;
        message: string;
        data: {
          names: string[];
        };
      },
      void
    >({
      query: () => ({
        url: "/transact/names",
        method: "GET",
      }),
      providesTags: ["TransactionNames", "Journal", "Invoice", "Bill"],
    }),

    // Get Transact Data with Filters and Pagination
    getTransactData: builder.query<
      { data: any; message: string; prevCursor: any; nextCursor: any },
      {
        selectedTransactionType?: string[];
        fromDate?: string;
        toDate?: string;
        limit?: number;
        nextCursor?: string;
        prevCursor?: string;
        accountType?: string;
        accountId?: number;
        taxIdFilter?: string[];
        contactIdFilter?: string[];
        meta?: RefetchMetaDataTransactTable;
      }
    >({
      query: (filters) => {
        const queryParams = new URLSearchParams();

        // ---------- META (refetch context) ----------
        if (filters.meta?.newTransactionName) {
          queryParams.append(
            "newTransactionName",
            filters.meta.newTransactionName,
          );
        }

        if (filters.meta?.newTransactionId) {
          queryParams.append("newTransactionId", filters.meta.newTransactionId);
        }

        if (filters.meta?.newPaymentId) {
          queryParams.append("newPaymentId", filters.meta.newPaymentId);
        }
        // Add date filters
        if (filters.fromDate) {
          queryParams.append("fromDate", filters.fromDate);
        }

        if (filters.toDate) {
          queryParams.append("toDate", filters.toDate);
        }

        // Add limit (default to 10 if not specified)
        queryParams.append("limit", String(filters.limit || 10));

        // cursor
        if (filters.nextCursor) {
          queryParams.append("nextCursor", filters.nextCursor);
        }

        if (filters.prevCursor) {
          queryParams.append("prevCursor", filters.prevCursor);
        }

        // Add transaction type filters (repeated param named 'filter')
        if (
          filters.selectedTransactionType &&
          filters.selectedTransactionType.length > 0
        ) {
          filters.selectedTransactionType.forEach((type) => {
            queryParams.append("filter", type);
          });
        }

        if (
          filters.accountType === "contact" &&
          filters.taxIdFilter &&
          filters.taxIdFilter.length > 0
        ) {
          filters.taxIdFilter.forEach((id) => {
            queryParams.append("taxIdFilter", id);
          });
        }

        if (
          filters.accountType === "account" &&
          filters.contactIdFilter &&
          filters.contactIdFilter.length > 0
        ) {
          filters.contactIdFilter.forEach((id) => {
            queryParams.append("contactIdFilter", id);
          });
        }

        // Add accountType (default to 'all')
        queryParams.append("accountType", filters.accountType || "all");

        // Add accountId if not 'all'
        if (
          filters.accountType &&
          filters.accountType !== "all" &&
          filters.accountId
        ) {
          queryParams.append("accountId", String(filters.accountId));
        }

        const queryString = queryParams.toString();

        return {
          url: `/transact?${queryString}`,
          method: "GET",
        };
      },
      providesTags: ["Bill", "Journal", "Invoice"],
    }),

    // GetAllInvoices
    getAllInvoices: builder.query<
      { data: any; message: string; prevCursor: any; nextCursor: any },
      {
        fromDate?: string;
        toDate?: string;
        limit?: number;
        nextCursor?: string | null;
        prevCursor?: string | null;
        meta?: RefetchMetaDataTransactTable;
      }
    >({
      query: (filters) => {
        const queryParams = new URLSearchParams();
        if (filters.fromDate) queryParams.append("fromDate", filters.fromDate);
        if (filters.toDate) queryParams.append("toDate", filters.toDate);
        queryParams.append("limit", String(filters.limit || 10));
        if (filters.nextCursor) {
          queryParams.append("nextCursor", filters.nextCursor);
        }

        if (filters.prevCursor) {
          queryParams.append("prevCursor", filters.prevCursor);
        }
        if (filters.meta?.newInvoiceNo) {
          queryParams.append("newInvoiceNo", filters.meta.newInvoiceNo);
        }

        return {
          url: `/invoice/all_invoices/?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Journal", "Invoice", "Bill"],
    }),

    // GetAllBills
    getAllBills: builder.query<
      { data: any; message: string; prevCursor: any; nextCursor: any },
      {
        fromDate?: string;
        toDate?: string;
        limit?: number;
        nextCursor?: string | null;
        prevCursor?: string | null;
        meta?: RefetchMetaDataTransactTable;
      }
    >({
      query: (filters) => {
        const queryParams = new URLSearchParams();
        if (filters.fromDate) queryParams.append("fromDate", filters.fromDate);
        if (filters.toDate) queryParams.append("toDate", filters.toDate);
        queryParams.append("limit", String(filters.limit || 10));
        if (filters.nextCursor) {
          queryParams.append("nextCursor", filters.nextCursor);
        }

        if (filters.prevCursor) {
          queryParams.append("prevCursor", filters.prevCursor);
        }

        if (filters.meta?.newBillNo) {
          queryParams.append("newBillNo", filters.meta.newBillNo);
        }

        return {
          url: `/bill/all_bills/?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Bill"],
    }),

    // DateRange
    getDateRange: builder.query<{ data: any }, void>({
      query: () => ({
        url: `/journal/date_range`,
        method: "GET",
      }),
      providesTags: ["Journal", "Invoice", "Bill"],
    }),

    getOpeningBalance: builder.query<{ data: any }, void>({
      query: () => ({
        url: `/journal/opening_balance`,
        method: "GET",
      }),
      providesTags: ["Journal"],
    }),

    // ExportPdf/Excel Transact (all accounts)
    exportPdfTransactAll: builder.query<
      IExportResponse,
      IExportPdfTransactRequest
    >({
      query: ({
        accountId,
        accountType,
        fromDate,
        toDate,
        selectedTransactionType,
        exportType,
        entityType,
      }) => {
        const queryParams = new URLSearchParams();

        if (accountId !== undefined) {
          queryParams.append("accountId", accountId.toString());
        }
        queryParams.append("accountType", accountType);
        queryParams.append("fromDate", fromDate);
        queryParams.append("toDate", toDate);
        queryParams.append("exportType", exportType);
        if (entityType) {
          queryParams.append("entityType", entityType);
        }
        // If multiple selectedTransactionType, append each
        selectedTransactionType.forEach((type) =>
          queryParams.append("selectedTransactionType", type),
        );

        return {
          url: `/transact/export?${queryParams.toString()}`,
          method: "GET",
        };
      },
    }),

    // ExportPdf/Excel Transact (invoice/bill)
    exportPdfTransactInvoiceBill: builder.query<
      IExportResponse,
      IExportPdfTransactRequest
    >({
      query: ({
        accountId,
        accountType,
        fromDate,
        toDate,
        selectedTransactionType,
        exportType,
        entityType,
      }) => {
        const queryParams = new URLSearchParams();

        if (accountId !== undefined) {
          queryParams.append("accountId", accountId.toString());
        }
        queryParams.append("accountType", accountType);
        queryParams.append("fromDate", fromDate);
        queryParams.append("toDate", toDate);
        queryParams.append("exportType", exportType);
        if (entityType) {
          queryParams.append("entityType", entityType);
        }

        selectedTransactionType.forEach((type) =>
          queryParams.append("selectedTransactionType", type),
        );

        return {
          url: `/invoice/export?${queryParams.toString()}`,
          method: "GET",
        };
      },
    }),

    // TrasactCount
    getTransactCount: builder.query<
      { data: { count: number } },
      {
        fromDate?: string;
        toDate?: string;
        filter?: string | string[];
      }
    >({
      query: ({ fromDate, toDate, filter }) => {
        const queryParams = new URLSearchParams();

        if (fromDate) queryParams.append("fromDate", fromDate);
        if (toDate) queryParams.append("toDate", toDate);

        if (filter) {
          if (Array.isArray(filter)) {
            // Multiple filter types
            filter.forEach((f) => queryParams.append("filter", f));
          } else {
            queryParams.append("filter", filter);
          }
        }

        return {
          url: `/transact/count?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Journal", "Invoice", "Bill"],
    }),

    // DownloadInvoice
    downloadInvoice: builder.mutation<Blob, { transactionId: string }>({
      query: ({ transactionId }) => ({
        url: `/invoice/${transactionId}/pdf`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

// Export Hooks
export const {
  useCreateJournalMutation,
  useGetJournalByIdQuery,
  useUpdateJournalMutation,
  useDeleteJournalMutation,
  useGetTransactionNamesQuery,
  useGetTransactDataQuery,
  useLazyGetTransactDataQuery,
  useUploadAttachmentsMutation,
  useGetAttachmentsQuery,
  useDeleteAttachmentMutation,
  useGetAllInvoicesQuery,
  useLazyGetAllInvoicesQuery,
  useGetAllBillsQuery,
  useExportPdfTransactAllQuery,
  useLazyExportPdfTransactAllQuery,
  useExportPdfTransactInvoiceBillQuery,
  useGetOpeningBalanceQuery,
  useLazyExportPdfTransactInvoiceBillQuery,
  useLazyGetAllBillsQuery,
  useDownloadInvoiceMutation,
  useGetDateRangeQuery,
  useGetAttachmentFileQuery,
  useLazyGetAttachmentFileQuery,
  useGetTransactCountQuery,
  useLazyGetTransactCountQuery,
  useGetAttachmentCountQuery,
  useLazyGetAttachmentCountQuery,
  useUploadBillInvoiceMutation,
} = transactApi;
