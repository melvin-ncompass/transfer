export interface ContactData {
    id: number;
    name: string;
    balanceAmount: number;
}

export interface ContactBalanceSummarySimpleData {
    contactData: ContactData[];
    totalContactBalance: number;
    zeroBalance: boolean;
    decimalPlace: boolean;
}

export interface ContactBalanceSummarySimpleResponse {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: ContactBalanceSummarySimpleData;
}

// Contact Journal (detailed view)
export interface ContactJournalData {
    id: number;
    name: string;
    totalDebit: number;
    totalCredit: number;
}

export interface ContactInvData {
    id: number;
    name: string;
    invoicedAmount: number;
    amountReceived: number;
}

export interface ContactBillData {
    id: number;
    name: string;
    billedAmount: number;
    amountPaid: number;
}

export interface ContactBalanceSummaryData {
    contactJournalData: ContactJournalData[];
    contactInvData: ContactInvData[];
    contactBillData: ContactBillData[];
    dateFrom: string;
    dateTo: string;
    totalJournalDebit: number;
    totalJournalCredit: number;
    totalInvoicedAmount: number;
    totalAmountReceived: number;
    totalBilledAmount: number;
    totalAmountPaid: number;
    zeroBalance: boolean;
    decimalPlace: boolean;
}

export interface ContactBalanceSummaryDetailedResponse {
    success: boolean;
    statusCode: number;
    timestamp: string;
    message: string;
    data: ContactBalanceSummaryData;
}