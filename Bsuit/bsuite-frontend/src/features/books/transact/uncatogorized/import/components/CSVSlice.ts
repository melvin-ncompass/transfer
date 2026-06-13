import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CSV } from "./types/CSV";
import type { ValidationResult } from "./types/ValidationTypes";

const initialState: CSV = {
  index: 0,
  rawData: [],
  data: [],
  dateFormat:"",
  columnMapping: undefined,
  uploadedFile: null,
  // extracted candidates from server for each logical field
  dateCandidates: [],
  descriptionCandidates: [],
  debitCandidates: [],
  creditCandidates: [],
  validationResults: undefined,
  serverDuplicates: undefined,
  hasEdits:false,
  duplicatesToCreate: undefined,
  processed:[],
  accountId:undefined
};
const BankAccStatementImportSlice = createSlice({
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
    setSelectedDateFormat(state, action: PayloadAction<string>) {
      state.dateFormat = action.payload;
    },
    setMappedData(state, action: PayloadAction<Record<string, string>[]>) {
      state.data = action.payload;
    },
    setExtractedCandidates(state, action: PayloadAction<{
      dateCandidates?: string[];
      descriptionCandidates?: string[];
      debitCandidates?: string[];
      creditCandidates?: string[];
    }>) {
      const { dateCandidates, descriptionCandidates, debitCandidates, creditCandidates } = action.payload;
      if (dateCandidates) state.dateCandidates = dateCandidates;
      if (descriptionCandidates) state.descriptionCandidates = descriptionCandidates;
      if (debitCandidates) state.debitCandidates = debitCandidates;
      if (creditCandidates) state.creditCandidates = creditCandidates;
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
    resetAccImpState(state) {
      state = initialState;
    },
    setHasEdits(state, action: PayloadAction<boolean>) {
      state.hasEdits = action.payload;
    },
    setProcessed(state, action: PayloadAction<any[]>) {
      state.processed = action.payload;
  },
  setAccountId(state, action: PayloadAction<number | undefined>) {
    state.accountId = action.payload;
  },}
});

export const {
  setIndex,
  setRawFile,
  setUploadedFile,
  setColumnMapping,
  setMappedData,
  setExtractedCandidates,
  setValidationResults,
  setHasEdits,
  setServerDuplicates,
  setDuplicatesToCreate,
  resetAccImpState,
  setSelectedDateFormat,
  setProcessed,
  setAccountId
} = BankAccStatementImportSlice.actions;
export default BankAccStatementImportSlice.reducer;