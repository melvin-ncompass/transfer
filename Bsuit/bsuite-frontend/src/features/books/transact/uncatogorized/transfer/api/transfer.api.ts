import { baseApi } from "../../../../../../api/base.api";

type ContactMappingMap = Record<number, string>;
interface TransferResponse {
  status: string;
  formIsValid: string;
  uncategorized_count: number;
  transaction_type_name: string;
  transaction_type_id: string;
  transactionTypeId?:string;
  transactionTypeName?:string;
  payment_id: string;
  change_of_data: {
    id: string;
    module: string;
    feature: string;
    status: string;
  };
}
interface CreateTransferDto {
  uncatId: number;
  toAccountId: number;
  contactId?: number;
  toAccountType: 'account' | 'contact' | 'tax';
  hasTdsMapping: boolean;
  description?: string;
  contactMappingData?: ContactMappingMap;
}
interface BulkTransferDto {
  transfers: CreateTransferDto[];
}

export const transferApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Save Transfer
    saveTransfer: builder.mutation<{ data: TransferResponse }, CreateTransferDto>({
      query: (body) => ({
        url: "/uncategorized/transfer",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),

    // BULK transfer
    saveBulkTransfer: builder.mutation<
      { data: TransferResponse },
      BulkTransferDto
    >({
      query: (body) => ({
        url: "/uncategorized/bulk_transfer/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Uncategorized", "AttachmentsTransact", "AttachmentsTransactCount"],
    }),
  }),
});

export const {
  useSaveTransferMutation,
  useSaveBulkTransferMutation,
} = transferApi;
