export interface CreatePaymentPayload {
  transactionTypeId: string;
  paymentAccountId: number;
  paymentDate: string; // YYYY-MM-DD
  fxRate: number;
  originalFxRate: number;
  paymentAmount: string;
  notes?: string;
}
export interface EditPaymentPayload extends CreatePaymentPayload {
  paymentId: string;
}
export interface BillPaymentPayload {
  transactionTypeId: string;
  paymentAccountId: number;
  paymentDate: string; // YYYY-MM-DD
  fxRate: number;
  originalFxRate: number;
  paymentAmount: string;
  notes?: string;
  paymentId?: string; // only for edit
}
export interface BillPaymentHistoryItem {
  date: string;
  account: {
    accountName: string;
    accountCurrency: string;
  };
  paymentId: string;
  creditAmount: string;
  counterCurrency: string;
  counterCurrencyAmount: string;
  counterExchangeRate: string;
}
export interface BillPaymentsResponse {
  paymentHistory: BillPaymentHistoryItem[];
  contact: {
    id: number;
    name: string;
    middleName: string | null;
    lastName: string;
    email: string;
    phoneNumber: string;
    dialCode: string;
    contactBalance: string;
  };
}
