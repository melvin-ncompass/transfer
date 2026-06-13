// src/types/transactionDetails.ts

export interface ICheckedTransactionDetails {
  billTo: boolean;
  title: boolean;
  balanceDue: boolean;
  numberField: boolean;
  dateField: boolean;
  serviceStart: boolean;
  dueDate: boolean;
  serviceEnd: boolean;
}

export interface ITransactionDetailsValue {
  title: string;
  balanceDue: string;
  numberField: string;
  dateField: string;
  serviceStart: string;
  dueDate: string;
  serviceEnd: string;
}

export interface IIdentityDetails {
  asasa: boolean;
  new: boolean;
  latest: boolean;
}

export interface ITransactionDetails {
  CheckedTransaction: ICheckedTransactionDetails;
  TransactionValue: ITransactionDetailsValue;
}
