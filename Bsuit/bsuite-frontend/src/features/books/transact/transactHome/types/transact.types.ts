// ========================
// Journal Form Data
// ========================
export interface JournalFormData {
  description?: string;
  date: string; // formatted as YYYY-MM-DD
  transactionTypeName: string;
  journalAccounts: Array<{
    id: number;
    type: "Account" | "Contact" | "Tax";
    credit?: number;
    debit?: number;
    isFromAccount: boolean;
    amountInAccountCurr: number;
  }>;
  journalCurrency? : string ;
  journalCurrencyFxMapping?: Record<string, number>
  /** Top-level: contact id (string) -> amount string. For TDS rows. */
  contactMappingData?: Record<string, string>;
  uncategorizedMappingData?: number[]; 
}

// ========================
// Journal Response (Create)
// ========================
export interface JournalResponseData {
  transactionTypeId: string;
  journalBalance: number;
  date: string;
}

export interface JournalResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: JournalResponseData;
}

// ========================
// Journal Account Detail
// ========================
export interface JournalAccountDetail {
  id: number;
  type: "Account" | "Contact" | "Tax";
  credit?: string | number;
  debit?: string | number;
  isFromAccount: boolean;
  accountExchangeRate?: string;
  accountCurrencyAmount?: string;
  accountOriginalExchangeRate?: string;
  counterCurrency?:string;
  counterCurrencyAmount?: string ;
}

// ========================
// Detailed Journal Response (Get/Edit)
// ========================
export interface DetailedJournalData {
  transactionTypeId: string;
  description: string;
  date: string;
  journalBalance: string | number;
  journalAccounts: JournalAccountDetail[];
  /** Contact id (string) -> amount string. Prefill for edit/duplicate. */
  tdsMapping?: Record<string, string>;
}

export interface DetailedJournalResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: DetailedJournalData;
}

// ========================
// Journal Entry (for display/queries)
// ========================
export interface JournalEntry {
  id: number;
  description: string;
  date: string;
  journalAccounts: Array<{
    id: number;
    type: "Account" | "Contact" | "Tax";
    credit?: number;
    debit?: number;
    isFromAccount: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// ========================
// Paginated Journal Response
// ========================
export interface PaginatedJournalsResponse {
  data: JournalEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// ========================
// TDS Contact Mapping (Journal / Transfer)
// ========================
export interface TdsContactMappingItem {
  contactId: string;
  amount: string;
}

// ========================
// Component Props & Local State
// ========================
export interface JournalRow {
  id: string;
  toAccount: string;

  debitAmount: number;
  debitAmountInput: string;

  convertedAmount: number;
  convertedAmountInput: string;

  fxRate: number | null;
  originalFxRate: number | null;
  isFxEdited: boolean;
  fxRateInput: string;

  /** TDS contact mapping when toAccount is a TDS tax */
  contactMapping?: TdsContactMappingItem[];
}
export interface ImageFile {
  id: string;
  file: File;
}

export interface AddJournalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: DetailedJournalData;
  mode?: "add" | "edit";
  duplicate?: boolean;
  onTransactionCreated?: (transactionTypeId: string) => void;
}

export interface TransactItem {
  transactionTypeId: string;
  transactionTypeName: string;
  paymentId?: string;
  description: string;
  date: string;
  journalBalance: number;
  fromAccount: {
    id: number;
    name: string;
    type: string;
    creditAmount?: string;
  }[];
  toAccount: { id: number; name: string; type: string; debitAmount?: string }[];
  noOfAttachments?: number;
}

export interface TransactResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: TransactItem[];
}

// --------Export----------

export interface IPayloadExport {
  fromDate?: string;
  toDate?: string;
  selectedTransactionType?: string[];
  limit?: number;
  offset?: number;
  accountType?: string;
  accountId?: number;
  selectedAccount?: string;
}

export interface IExportPdfTransactRequest {
  accountId: number;
  accountType: string;
  fromDate: string;
  toDate: string;
  selectedTransactionType: string[];
  exportType: "pdf" | "excel";
  entityType?: string;
}

export type ExportType = "pdf" | "excel";

export type RefetchMetaDataTransactTable = {
  newTransactionName?: string;
  newPaymentId?: string | null;
  newTransactionId?: string;
  newInvoiceNo?: string;
  newBillNo?: string;
};
