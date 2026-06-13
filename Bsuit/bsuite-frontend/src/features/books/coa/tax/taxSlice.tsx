import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TaxItem {
  id: number;
  name: string;
  abbreviation: string;
  rate: string;
  balance: number;
  taxNo: string;
  transactions: number;
}

interface TaxState {
  taxList: TaxItem[];
  selectedTax: TaxItem | null;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
}

const initialState: TaxState = {
  taxList: [],
  selectedTax: null,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
};

const taxSlice = createSlice({
  name: "tax",
  initialState,
  reducers: {
    setTaxes: (state, action: PayloadAction<TaxItem[]>) => {
      state.taxList = action.payload;
    },
    openDeleteModal: (state, action: PayloadAction<TaxItem>) => {
      state.selectedTax = action.payload;
      state.isDeleteModalOpen = true;
    },
    deleteTaxLocal: (state, action: PayloadAction<number>) => {
      state.taxList = state.taxList.filter((tax) => tax.id !== action.payload);
    },

    openEditModal: (state, action: PayloadAction<TaxItem>) => {
      state.selectedTax = action.payload;
      state.isEditModalOpen = true;
    },

    closeEditModal: (state) => {
      state.selectedTax = null;
      state.isEditModalOpen = false;
    },
    closeDeleteModal: (state) => {
      state.selectedTax = null;
      state.isDeleteModalOpen = false;
    },
  },
});

export const { setTaxes, deleteTaxLocal, openEditModal, closeEditModal ,closeDeleteModal,openDeleteModal} =
  taxSlice.actions;

export default taxSlice.reducer;
