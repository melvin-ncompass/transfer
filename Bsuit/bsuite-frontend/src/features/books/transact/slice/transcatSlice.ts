import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import dayjs, { Dayjs } from "dayjs";
import type { IPayloadExport } from "../transactHome/types/transact.types";

export type ModalType = "journal" | "bill" | "invoice" | "transfer";

/*  Types */
interface AppliedFilters {
  fromDate?: string;
  toDate?: string;
  selectedTransactionType: string[];
  taxIdFilter?: string[];
  contactIdFilter?: string[];
  accountType?: string;
  selectedTax: string;
  accountId?: number;
  selectedAccount: string;
}

interface TransactState {
  selectedAccount: string;
  selectedTransactionType: string[];
  selectedTax: string;
  taxIdFilter: string[];
  contactIdFilter: string[];
  fromDate: string | null;
  toDate: string | null;
  minDate?: string;
  maxDate?: string;
  appliedFilters: AppliedFilters;
  submittedFilters: boolean;

  activeFilters: number;
  showMoreFilters: boolean;
  isInitialized: boolean;
  transactCount: number;
  // Modal states
  filterDialogOpen: boolean;
  journalModalOpen: boolean;
  transferModalOpen: boolean;
  invoiceModalOpen: boolean;
  billModalOpen: boolean;

  // Export payload
  payloadExport: IPayloadExport | null;
}

/* Helpers */

const normalizeDate = (d?: Dayjs | null) =>
  d ? d.format("YYYY-MM-DD") : undefined;

const parseSelectedAccount = (
  value: string,
): {
  accountType: string;
  accountId?: number;
} => {
  if (!value || value === "all_accounts") {
    return { accountType: "all", accountId: undefined };
  }

  const parts = value.split("_");
  const accountType = parts[0];
  const idPart = parts.slice(1).join("_");

  const accountId = Number(idPart);
  return {
    accountType,
    accountId: Number.isNaN(accountId) ? undefined : accountId,
  };
};

/* Initial State */
const initialState: TransactState = {
  selectedAccount: "all_accounts",
  selectedTransactionType: [],
  selectedTax: "",
  taxIdFilter: [],
  contactIdFilter: [],
  fromDate: null,
  toDate: null,

  minDate: undefined,
  maxDate: undefined,

  appliedFilters: {
    selectedTransactionType: [],
    accountType: "all",
    selectedTax: "",
    taxIdFilter: [],
    contactIdFilter: [],
    selectedAccount: "all_accounts",
  },
  transactCount: 0,

  submittedFilters: false,
  filterDialogOpen: false,
  activeFilters: 0,
  showMoreFilters: true,
  isInitialized: false,

  journalModalOpen: false,
  transferModalOpen: false,
  invoiceModalOpen: false,
  billModalOpen: false,

  payloadExport: null,
};

const transactSlice = createSlice({
  name: "transact",
  initialState,
  reducers: {
    /* Initialize Date Range */
    initializeDateRange(
      state,
      action: PayloadAction<{ minDate?: string; maxDate?: string }>,
    ) {
      const min = action.payload.minDate
        ? dayjs(action.payload.minDate)
        : dayjs().startOf("month");

      const max = action.payload.maxDate
        ? dayjs(action.payload.maxDate)
        : dayjs().endOf("month");

      state.minDate = action.payload.minDate;
      state.maxDate = action.payload.maxDate;

      state.fromDate = normalizeDate(min) ?? null;
      state.toDate = normalizeDate(max) ?? null;

      state.appliedFilters = {
        ...state.appliedFilters,
        fromDate: normalizeDate(min),
        toDate: normalizeDate(max),
      };

      state.payloadExport = state.appliedFilters;
      state.submittedFilters = true;
      state.isInitialized = true;
    },

    /* Account Change */
    setSelectedAccount(state, action: PayloadAction<string>) {
      const selectedAccount = action.payload;

      const { accountType, accountId } = parseSelectedAccount(selectedAccount);

      state.selectedAccount = selectedAccount;

      state.appliedFilters = {
        ...state.appliedFilters,
        selectedAccount,
        accountType,
        accountId,
      };

      state.submittedFilters = true;
      state.payloadExport = state.appliedFilters;
    },

    setFromDate(state, action: PayloadAction<Dayjs | string | null>) {
      const val = action.payload;
      state.fromDate = val
        ? typeof val === "string"
          ? val
          : val.format("YYYY-MM-DD")
        : null;
    },
    setToDate(state, action: PayloadAction<Dayjs | string | null>) {
      const val = action.payload;
      state.toDate = val
        ? typeof val === "string"
          ? val
          : val.format("YYYY-MM-DD")
        : null;
    },

    /* Transaction Type*/
    setSelectedTransactionType(state, action: PayloadAction<string[]>) {
      state.selectedTransactionType = action.payload;
      state.activeFilters = action.payload.length;
    },

    /* Set Selected Tax */
    setSelectedTax(state, action: PayloadAction<string>) {
      state.selectedTax = action.payload;

      state.appliedFilters = {
        ...state.appliedFilters,
        selectedTax: action.payload,
      };

      state.payloadExport = state.appliedFilters;
      state.submittedFilters = true;
    },

    /* Set TaxId Filter */
    setTaxIdFilter(state, action: PayloadAction<string[]>) {
      state.taxIdFilter = action.payload;
    },

    /* Set Contact Filter */
    setContactIdFilter(state, action: PayloadAction<string[]>) {
      state.contactIdFilter = action.payload;
    },

    setAppliedFilters(state, action: PayloadAction<Partial<AppliedFilters>>) {
      const mergedFilters = {
        ...state.appliedFilters,
        ...action.payload,
      };

      const { selectedAccount } = mergedFilters;
      const { accountType, accountId } = parseSelectedAccount(selectedAccount);

      state.appliedFilters = {
        ...mergedFilters,
        accountType,
        accountId,
      };

      state.selectedTransactionType =
        state.appliedFilters.selectedTransactionType || [];

      state.selectedTax = state.appliedFilters.selectedTax || "";

      state.taxIdFilter = state.appliedFilters.taxIdFilter || [];

      state.contactIdFilter = state.appliedFilters.contactIdFilter || [];

      if (state.appliedFilters.fromDate) {
        state.fromDate = state.appliedFilters.fromDate;
      }

      if (state.appliedFilters.toDate) {
        state.toDate = state.appliedFilters.toDate;
      }

      state.submittedFilters = true;
      state.payloadExport = state.appliedFilters;
    },

    setTransactCount(state, action: PayloadAction<number>) {
      state.transactCount = action.payload;
    },
    /* Clear Filters */
    clearAllFilters(state) {
      state.selectedAccount = "all_accounts";
      state.selectedTransactionType = [];
      state.selectedTax = "";
      state.activeFilters = 0;
      state.showMoreFilters = true;
      state.payloadExport = null;
    },

    /* Reset Filters*/
    resetAllFilters(
      state,
      action: PayloadAction<{ minDate?: string; maxDate?: string }>,
    ) {
      const { minDate, maxDate } = action.payload;

      const newFromDate = minDate ? dayjs(minDate) : dayjs().startOf("month");
      const newToDate = maxDate ? dayjs(maxDate) : dayjs().endOf("month");

      const newFromDateStr = normalizeDate(newFromDate) ?? null;
      const newToDateStr = normalizeDate(newToDate) ?? null;

      state.selectedAccount = "all_accounts";
      state.selectedTransactionType = [];
      state.selectedTax = "";
      state.taxIdFilter = [];
      state.contactIdFilter = [];

      state.fromDate = newFromDateStr;
      state.toDate = newToDateStr;

      state.minDate = minDate
        ? minDate
        : dayjs().startOf("month").toISOString();

      state.maxDate = maxDate ? maxDate : dayjs().endOf("month").toISOString();

      state.appliedFilters = {
        ...state.appliedFilters,
        selectedTransactionType: [],
        selectedTax: "",
        taxIdFilter: [],
        contactIdFilter: [],
        accountType: "all",
        accountId: undefined,
        selectedAccount: "all_accounts",
        fromDate: newFromDateStr ?? undefined,
        toDate: newToDateStr ?? undefined,
      };

      state.activeFilters = 0;
      state.showMoreFilters = true;
      state.submittedFilters = false;
    },
    /* Export Payload */
    setPayloadExport: (state, action: PayloadAction<IPayloadExport | null>) => {
      state.payloadExport = action.payload;
    },

    setInitialized(state, action: PayloadAction<boolean>) {
      state.isInitialized = action.payload;
    },

    // ---------------- Modal actions ----------------
    openFilterDialog(state) {
      state.filterDialogOpen = true;
    },
    closeFilterDialog(state) {
      state.filterDialogOpen = false;
    },
    openJournalModal(state) {
      state.journalModalOpen = true;
    },
    closeJournalModal(state) {
      state.journalModalOpen = false;
    },
    openTransferModal(state) {
      state.transferModalOpen = true;
    },
    closeTransferModal(state) {
      state.transferModalOpen = false;
    },
    openInvoiceModal(state) {
      state.invoiceModalOpen = true;
    },
    closeInvoiceModal(state) {
      state.invoiceModalOpen = false;
    },
    openBillModal(state) {
      state.billModalOpen = true;
    },
    closeBillModal(state) {
      state.billModalOpen = false;
    },
  },
});

export const {
  initializeDateRange,
  setSelectedAccount,
  setFromDate,
  setToDate,
  setSelectedTransactionType,
  openFilterDialog,
  closeFilterDialog,
  setAppliedFilters,
  clearAllFilters,
  setInitialized,
  resetAllFilters,
  setPayloadExport,
  setTaxIdFilter,
  setContactIdFilter,
  // Modal actions
  openJournalModal,
  closeJournalModal,
  openTransferModal,
  closeTransferModal,
  openInvoiceModal,
  closeInvoiceModal,
  openBillModal,
  closeBillModal,
  setTransactCount,
} = transactSlice.actions;

export default transactSlice.reducer;