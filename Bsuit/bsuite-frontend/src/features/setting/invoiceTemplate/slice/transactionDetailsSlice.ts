// src/context/sideBar/transactionDetailsSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ITransactionDetails,
  ICheckedTransactionDetails,
  ITransactionDetailsValue,
} from "../types/transactionDetails";

const initialState: ITransactionDetails = {
  CheckedTransaction: {
    billTo: true,
    title: true,
    balanceDue: true,
    numberField: true,
    dateField: true,
    serviceStart: true,
    dueDate: true,
    serviceEnd: true,
  },
  TransactionValue: {
    title: "Tax Invoice",
    balanceDue: "$562.7",
    numberField: "#",
    dateField: "Invoice Date:",
    serviceStart: "Service Start:",
    dueDate: "Due Date :",
    serviceEnd: "Service End:",
  },
};

export const transactionDetailsSlice = createSlice({
  name: "transactionDetails",
  initialState,
  reducers: {
    toggleChecked: (
      state,
      action: PayloadAction<keyof ICheckedTransactionDetails>,
    ) => {
      const key = action.payload;
      state.CheckedTransaction[key] = !state.CheckedTransaction[key];
    },

    updateTransactionValue: (
      state,
      action: PayloadAction<{
        field: keyof ITransactionDetailsValue;
        value: string;
      }>,
    ) => {
      const { field, value } = action.payload;
      state.TransactionValue[field] = value;
    },

    prefillTransactionDetails(
      state: ITransactionDetails,
      action: PayloadAction<Record<string, string | boolean | undefined>>,
    ) {
      const payload = action.payload;

      const valueKeys: (keyof ITransactionDetailsValue)[] = [
        "title",
        "balanceDue",
        "numberField",
        "dateField",
        "serviceStart",
        "dueDate",
        "serviceEnd",
      ];

      (
        Object.keys(
          state.CheckedTransaction,
        ) as (keyof ICheckedTransactionDetails)[]
      ).forEach((key) => {
        const val = payload[key];

        if (val !== undefined) {

          // Boolean → use backend value
          // String → mark checked true
          state.CheckedTransaction[key] = typeof val === "boolean" ? val : true;

          // Update value if string field
          if (
            valueKeys.includes(key as keyof ITransactionDetailsValue) &&
            typeof val === "string"
          ) {
            state.TransactionValue[key as keyof ITransactionDetailsValue] = val;
          }
        } else {
          state.CheckedTransaction[key] = false;

          if (valueKeys.includes(key as keyof ITransactionDetailsValue)) {
            state.TransactionValue[key as keyof ITransactionDetailsValue] =
              initialState.TransactionValue[
                key as keyof ITransactionDetailsValue
              ];
          }
        }
      });
    },
    resetTransactionDetails: () => initialState,
  },
});

export const {
  toggleChecked,
  updateTransactionValue,
  prefillTransactionDetails,
  resetTransactionDetails,
} = transactionDetailsSlice.actions;

export default transactionDetailsSlice.reducer;
