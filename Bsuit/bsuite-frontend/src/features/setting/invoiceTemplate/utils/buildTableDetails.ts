import type { ITable } from "../types/table";

interface FinalTableColumn {
  label: string;
  width: number;
}

export const buildTableDetails = (
  table: ITable,
): Record<string, FinalTableColumn> => {
  const result: Record<string, FinalTableColumn> = {};

  if (table.lineItemNo.checked) {
    result.lineItemNo = {
      label: table.lineItemNo.label,
      width: table.lineItemNo.width,
    };
  }

  if (table.item.checked) {
    result.item = {
      label: table.item.label,
      width: table.item.width,
    };
  }

  if (table.quantity.checked) {
    result.quantity = {
      label: table.quantity.label,
      width: table.quantity.width,
    };
  }

  if (table.rate.checked) {
    result.rate = {
      label: table.rate.label,
      width: table.rate.width,
    };
  }

  if (table.taxAmount.checked) {
    result.taxAmount = {
      label: table.taxAmount.label,
      width: table.taxAmount.width,
    };
  }

  if (table.amount.checked) {
    result.amount = {
      label: table.amount.label,
      width: table.amount.width,
    };
  }

  return result;
};
