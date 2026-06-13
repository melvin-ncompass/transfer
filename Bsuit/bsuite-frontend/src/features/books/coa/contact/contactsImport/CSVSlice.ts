import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CSV } from "./types/CSV";
import type { ValidationResult } from "./types/ValidationTypes";

const initialState: CSV = {
  index: 0,
  rawData: [],
  data: [],
  columnMapping: undefined,
  uploadedFile: null,
  validationResults: undefined,
  serverDuplicates: undefined,
  duplicatesToCreate: undefined,
  hasEdits: true,
};
const csvSlice = createSlice({
  name: "csv",
  initialState,
  reducers: {
    setIndex(state, action: PayloadAction<number>) {
      state.index = action.payload;
    },
    setRawFile(state, action: PayloadAction<Record<string, string>[]>) {
      state.rawData = action.payload;
    },
    setUploadedFile(state, action: PayloadAction<File | null>) {
      state.uploadedFile = action.payload;
    },
    setColumnMapping(state, action: PayloadAction<Record<string, string>>) {
      state.columnMapping = action.payload;
    },
    setMappedData(state, action: PayloadAction<Record<string, string>[]>) {
      state.data = action.payload;
    },
    setServerDuplicates(state, action: PayloadAction<any[] | undefined>) {
      state.serverDuplicates = action.payload;
    },
    setDuplicatesToCreate(state, action: PayloadAction<any[] | undefined>) {
      state.duplicatesToCreate = action.payload;
    },
    setValidationResults(state, action: PayloadAction<ValidationResult[]>) {
      state.validationResults = action.payload;
    },
    resetContactImpState(state) {
      state = initialState;
    },
    setHasContactEdits(state, action: PayloadAction<boolean>) {
      state.hasEdits = action.payload;
    },
  },
});

export const {
  setIndex,
  setRawFile,
  setUploadedFile,
  setColumnMapping,
  setMappedData,
  setValidationResults,
  setServerDuplicates,
  setDuplicatesToCreate,
  setHasContactEdits,
  resetContactImpState
} = csvSlice.actions;
export default csvSlice.reducer;
