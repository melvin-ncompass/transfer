import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IIdentityField, IOtherDetailsState } from "../types/otherDetails";

const initialState: IOtherDetailsState = {
  showBankDetails: false,
  showIdentity: false,
  bankDetails: {
    bankName: { checked: true, label: "Bank Name", value: "" },
    accountName: { checked: true, label: "Account Name", value: "" },
    accountNumber: { checked: true, label: "Account Number", value: "" },
    ifscCode: { checked: true, label: "IFSC Code", value: "" },
    branch: { checked: true, label: "Branch", value: "" },
    swiftCode: { checked: true, label: "Swift Code", value: "" },
  },
  identityFields: [],
};

const otherDetailsSlice = createSlice({
  name: "otherDetails",
  initialState,
  reducers: {
    toggleShowBankDetails(state) {
      state.showBankDetails = !state.showBankDetails;
    },

    toggleBankField(
      state,
      action: PayloadAction<keyof IOtherDetailsState["bankDetails"]>,
    ) {
      const key = action.payload;
      state.bankDetails[key].checked = !state.bankDetails[key].checked;
    },

    updateBankField(
      state,
      action: PayloadAction<{
        field: keyof IOtherDetailsState["bankDetails"];
        prop: "label" | "value";
        value: string;
      }>,
    ) {
      const { field, prop, value } = action.payload;
      state.bankDetails[field][prop] = value;
    },

    toggleShowIdentity(state) {
      state.showIdentity = !state.showIdentity;
    },

    setShowBankDetails(state, action: PayloadAction<boolean>) {
      state.showBankDetails = action.payload;
    },
    setShowIdentity(state, action: PayloadAction<boolean>) {
      state.showIdentity = action.payload;
    },

    setIdentityFields(state, action: PayloadAction<IIdentityField[]>) {
      const incoming = action.payload;

      const existingMap = new Map(state.identityFields.map((f) => [f.id, f]));

      state.identityFields = incoming.map((item) => {
        const existing = existingMap.get(item.id);

        return {
          ...item,
          checked: existing ? existing.checked : true,
        };
      });
    },

    toggleIdentityField(state, action: PayloadAction<number>) {
      const id = action.payload;

      const field = state.identityFields.find((f) => f.id === id);

      if (field) {
        field.checked = !field.checked;
      }
    },

    prefillBankDetails(
      state,
      action: PayloadAction<IOtherDetailsState["bankDetails"]>,
    ) {
      state.bankDetails = {
        ...state.bankDetails,
        ...action.payload,
      };
    },

    prefillIdentityFields(state, action: PayloadAction<IIdentityField[]>) {
      const incoming = action.payload;

      // Replace the identityFields completely
      state.identityFields = incoming.map((item) => ({
        ...item,
        checked: item.checked ?? true, // default to true if not provided
      }));
    },
    resetOtherDetails: () => initialState,
  },
});

export const {
  toggleShowBankDetails,
  toggleBankField,
  updateBankField,
  toggleShowIdentity,
  setIdentityFields,
  toggleIdentityField,
  prefillBankDetails,
  prefillIdentityFields,
  resetOtherDetails,
  setShowIdentity,
  setShowBankDetails,  
} = otherDetailsSlice.actions;

export default otherDetailsSlice.reducer;
