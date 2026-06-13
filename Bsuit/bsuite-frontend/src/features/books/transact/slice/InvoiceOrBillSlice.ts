import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type { InvoiceFormState, InvoiceOrBillRow } from "../utils/types";
import {
  applyFxAndRoundOff,
  computeInvoiceSummary,
  computeRowTotal,
  getTotalLevelDiscount,
  getTotalLevelTds,
  round2,
} from "../utils/calculations";
import dayjs from "dayjs";

const createEmptyRow = (): InvoiceOrBillRow => ({
  id: uuidv4(),
  itemName: "",
  hsnSac: "",
  accountId: 0,
  quantity: 1,
  price: 0,
  taxes: [],
  tdsValue: 0,
  tdsUnit: "percent",
  discountValue: 0,
  discountUnit: "percent",
  discountAccountId: undefined,
  rowTotal: 0,
});

const initialState: InvoiceFormState = {
  formType: "Invoice",

  header: {
    contactId: null,

    documentNo: "", // invoiceNo | billNo
    documentDate: dayjs().format("YYYY-MM-DD"),
    dueDate: dayjs().add(1, "month").subtract(1, "day").format("YYYY-MM-DD"),
    serviceStartDate: dayjs().format("YYYY-MM-DD"),
    serviceEndDate: dayjs().format("YYYY-MM-DD"),

    currency: "",

    fxRate: 1,
    originalFxRate: 1,

    notes: "",
  },

  flags: {
    showInlineDisc: false,
    showInlineTds: false,
    showInlineTax: false,
  },

  transactionTds: undefined,
  transactionDiscount: undefined,
  transactionTax: undefined,

  roundOffMode: "none",
  rowDiscountFactor: 1,

  summary: {
    subtotal: 0,
    totalTax: 0,
    total: 0,
    totalTdsValue: 0,
    totalDiscountValue: 0,
    invoiceTotal: 0,
    roundoffTotal: 0,
    taxBreakup: [],
    tdsBreakup: [],
  },
  rows: [createEmptyRow()],
};

const invoiceFormSlice = createSlice({
  name: "invoiceForm",
  initialState,
  reducers: {
    resetInvoiceForm() {
      return initialState;
    },

    setFormType(state, action: PayloadAction<"Invoice" | "Bill">) {
      state.formType = action.payload;
    },

    updateHeader(
      state,
      action: PayloadAction<Partial<InvoiceFormState["header"]>>,
    ) {
      Object.assign(state.header, action.payload);
      if (action.payload.serviceEndDate != null) {
        state.header.documentDate = action.payload.serviceEndDate;
        state.header.dueDate = dayjs(action.payload.serviceEndDate)
          .add(1, "month")
          .format("YYYY-MM-DD");
      }
    },

    enableInlineTds(state) {
      state.flags.showInlineTds = true;
      state.summary.totalTdsValue = 0;
      state.transactionTds = undefined;
    },

    disableInlineTds(state) {
      state.flags.showInlineTds = false;
    },

    enableInlineDisc(state) {
      state.flags.showInlineDisc = true;
      state.summary.totalDiscountValue = 0;
      state.transactionDiscount = undefined;
    },

    disableInlineDisc(state) {
      state.flags.showInlineDisc = false;
    },

    enableInlineTax(state) {
      state.flags.showInlineTax = true;
      state.summary.totalTax = 0;
      state.transactionTax = undefined;
    },

    disableInlineTax(state) {
      state.flags.showInlineTax = false;
    },

    setTransactionTax(
      state,
      action: PayloadAction<{
        taxes: Array<{
          taxId: string;
          taxName: string;
          taxPercent: number;
          taxUnit: "percent" | "value";
          taxAbbreviation?: string;
          originalTaxPercent?: number;
          originalTaxUnit?: "percent" | "value";
          isTaxOverridden?: boolean;
        }>;
        applied?: "before" | "after";
      }>
    ) {
      state.transactionTax = {
        level: "total",
        taxes: action.payload.taxes,
        applied: action.payload.applied ?? "after",
      };
      state.flags.showInlineTax = false;
    },
    clearTransactionTax(state) {
      state.transactionTax = undefined;
    },
    clearInlineTax(state) {
      state.rows.forEach((row) => {
        row.taxes = [];
      });
      state.summary.taxBreakup = [];
    },
    overrideTransactionTax(
      state,
      action: PayloadAction<{
        taxId: string;
        taxPercent: number;
        taxUnit: "percent" | "value";
      }>
    ) {
      if (!state.transactionTax) return;
      state.transactionTax.taxes = state.transactionTax.taxes.map((t) => {
        if (t.taxId !== action.payload.taxId) return t;
        const isReverted =
          Number(action.payload.taxPercent) === Number(t.originalTaxPercent ?? t.taxPercent) &&
          action.payload.taxUnit === (t.originalTaxUnit ?? t.taxUnit);
        if (isReverted) {
          return {
            ...t,
            taxPercent: t.originalTaxPercent ?? t.taxPercent,
            taxUnit: t.originalTaxUnit ?? t.taxUnit,
            isTaxOverridden: false,
          };
        }
        return {
          ...t,
          taxPercent: action.payload.taxPercent,
          taxUnit: action.payload.taxUnit,
          isTaxOverridden: true,
        };
      });
    },

    addRow(state) {
      state.rows.push({
        id: uuidv4(),
        itemName: "",
        hsnSac: "",
        accountId: 0,
        quantity: 1,
        price: 0,
        taxes: [],
        tdsValue: 0,
        tdsUnit: "percent",
        discountValue: 0,
        discountUnit: "percent",
        discountAccountId: undefined,
        rowTotal: 0,
      });
    },

    setNotes(state, action: PayloadAction<string>) {
      state.header.notes = action.payload;
    },

    updateRow(
      state,
      action: PayloadAction<{
        index: number;
        patch: Partial<InvoiceOrBillRow>;
      }>,
    ) {
      const row = state.rows[action.payload.index];
      if (!row) return;

      Object.assign(row, action.payload.patch);
    },

    recalculateRow(state, action: PayloadAction<number>) {
      const row = state.rows[action.payload];
      if (!row) return;

      const { total } = computeRowTotal(row, state.rowDiscountFactor);

      row.rowTotal = Math.round(total * 100) / 100;
    },

    recalculateSummary(state) {
      const tdsLevel = state.transactionTds?.level ?? (state.flags.showInlineTds ? "item" : "none");
      const taxLevel = state.transactionTax?.level ?? (state.flags.showInlineTax ? "item" : "none");
      const discLevel = state.flags.showInlineDisc ? "item"
        : state.transactionDiscount?.level === "total" ? "total"
          : "none";

      const summary = computeInvoiceSummary(
        state.rows,
        getTotalLevelTds(state.transactionTds),
        discLevel === "item" ? undefined : getTotalLevelDiscount(state.transactionDiscount), // ← don't pass when item-level
        state.roundOffMode,
        tdsLevel,
        state.transactionTax,
        taxLevel,
        discLevel
      );
      state.summary = {
        subtotal: summary.subtotal,
        originalSubtotal: summary.originalSubtotal,
        originalTax: summary.originalTax,
        originalTds: summary.originalTds,
        totalTax: summary.totalTax,
        total: round2(summary.total),
        totalTdsValue: summary.totalTds,
        totalDiscountValue: summary.totalDiscount,
        invoiceTotal: round2(summary.total),
        roundoffTotal: state.roundOffMode !== "none"
          ? round2(applyFxAndRoundOff(summary.total, null, state.roundOffMode).finalTotal)
          : round2(summary.total), tdsBreakup: summary.tdsBreakup,
        taxBreakup: summary.taxBreakup,
      };

      state.rows.forEach((row) => {
        const { total } = computeRowTotal(row, state.rowDiscountFactor);
        row.rowTotal = total;
      });
    },

    deleteRow(state, action: PayloadAction<number>) {
      state.rows.splice(action.payload, 1);
    },

    setTransactionTds(
      state,
      action: PayloadAction<{
        unit: "percent" | "value";
        value: number;
      }>,
    ) {
      state.transactionTds = {
        level: "total",
        value: action.payload.value,
        unit: action.payload.unit,
      };
      // state.summary.totalTdsValue = 0;
      state.flags.showInlineTds = false;
    },

    clearInlineTds(state) {
      state.rows.forEach((row) => {
        row.tdsValue = 0;
      });
      state.summary.tdsBreakup = [];
    },

    clearInlineDisc(state) {
      state.rows.forEach((row) => {
        row.discountValue = 0;
      });
    },

    clearTransactionTds(state) {
      state.transactionTds = undefined;
    },

    clearTransactionDiscount(state) {
      state.transactionDiscount = undefined;
    },

    setTransactionDiscount(
      state,
      action: PayloadAction<{
        unit: "percent" | "value";
        value: number;
        applied?: "before" | "after";
        accountId?: number;
      }>,
    ) {
      state.transactionDiscount = {
        level: "total",
        unit: action.payload.unit,
        value: action.payload.value,
        applied: action.payload.applied ?? "after",
        accountId:
          action.payload.accountId ?? state.transactionDiscount?.accountId,
      };
      state.summary.totalDiscountValue = 0;
      state.flags.showInlineDisc = false;
    },

    prefillInvoiceForm(_state, action: PayloadAction<InvoiceFormState>) {
      return action.payload;
    },

    setRoundOffMode(
      state,
      action: PayloadAction<InvoiceFormState["roundOffMode"]>,
    ) {
      state.roundOffMode = action.payload;
    },

    overrideTaxes(
      state,
      action: PayloadAction<{
        index: number;
        overrides: Record<
          string,
          {
            taxPercent: number;
            taxUnit: "percent" | "value";
            isTaxOverridden?: boolean;
          }
        >;
      }>,
    ) {
      const row = state.rows[action.payload.index];
      if (!row?.taxes) return;

      row.taxes = row.taxes.map((t) => {
        const override = action.payload.overrides[t.taxId];

        if (!override) {
          // keep as is if not changed
          return t;
        }

        const isReverted =
          Number(override.taxPercent) === Number(t.originalTaxPercent ?? t.taxPercent) &&
          override.taxUnit === (t.originalTaxUnit ?? t.taxUnit);

        if (isReverted) {
          // revert to original
          return {
            ...t,
            taxPercent: t.originalTaxPercent ?? t.taxPercent,
            taxUnit: t.originalTaxUnit ?? t.taxUnit,
            isTaxOverridden: false,
          };
        }

        // mark as overridden
        return {
          ...t,
          taxPercent: override.taxPercent,
          taxUnit: override.taxUnit,
          isTaxOverridden: true,
        };
      });
    },
  },
});

export const {
  resetInvoiceForm,
  setTransactionDiscount,
  clearInlineTds,
  clearInlineDisc,
  setTransactionTds,
  clearTransactionDiscount,
  clearTransactionTds,
  setRoundOffMode,
  prefillInvoiceForm,
  setFormType,
  enableInlineDisc,
  enableInlineTds,
  disableInlineDisc,
  disableInlineTds,
  enableInlineTax,
  disableInlineTax,
  setTransactionTax,
  clearInlineTax,
  clearTransactionTax,
  addRow,
  setNotes,
  updateHeader,
  recalculateRow,
  recalculateSummary,
  updateRow,
  deleteRow,
  overrideTaxes,
  overrideTransactionTax,
  // setAttachments,
  // resetAttachments,
} = invoiceFormSlice.actions;

export default invoiceFormSlice.reducer;
