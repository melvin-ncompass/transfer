import type {
  ICheckedTransactionDetails,
  ITransactionDetailsValue,
} from "../types/transactionDetails";

export const buildTransactionDetails = (
  checked: ICheckedTransactionDetails,
  values: ITransactionDetailsValue
) => {
  const result: Record<string, string | boolean> = {};

  // Boolean-only fields
  if (checked.billTo) result.billTo = true;
  if (checked.balanceDue) result.balanceDue = true;

  // Boolean + value fields
  if (checked.numberField) result.numberField = values.numberField;
  if (checked.title) result.title = values.title;
  if (checked.dateField) result.dateField = values.dateField;
  if (checked.serviceStart) result.serviceStart = values.serviceStart;
  if (checked.dueDate) result.dueDate = values.dueDate;
  if (checked.serviceEnd)
    result.serviceEnd = values.serviceEnd;

  return result;
};
