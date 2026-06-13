import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import taxReducer from "../features/books/coa/tax/taxSlice";
import { baseApi } from "../api/base.api";
import companyBrandingSlice from "../features/setting/companyDetails/slice/companyBrandingSlice";
import profileSlice from "../features/auth/profilePage/profileSlice";
import csvSlice from "../features/books/coa/contact/contactsImport/CSVSlice";
import invoiceSlice from "../features/books/transact/slice/InvoiceOrBillSlice"

import reportSlice from "../features/setting/reportStructure/slice/reportStructureSlice";
import invoiceReducer from "../features/setting/invoiceTemplate/slice/invoiceReducer";
import AccCsvSlice from "../features/books/coa/account/accountsImport/CSVSlice";
import transactReducer from "../features/books/transact/slice/transcatSlice";
import bankAccImportSlice from "../features/books/transact/uncatogorized/import/components/CSVSlice";
import {
  useDispatch,
  type TypedUseSelectorHook,
  useSelector,
} from "react-redux";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileSlice,
    file: csvSlice,
    tax: taxReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    // reminders: remiderSlice,
    report: reportSlice,
    branding: companyBrandingSlice,
    accImport:AccCsvSlice,
    invoiceForm: invoiceSlice,
    invoice: invoiceReducer,
    bankAccStatementImport: bankAccImportSlice,
       transact: transactReducer,

  },
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredPaths: [
        "invoiceForm.header.documentDate",
        "invoiceForm.header.dueDate",
        "invoiceForm.header.serviceStartDate",
        "invoiceForm.header.serviceEndDate",
      ],
    },
  }).concat(baseApi.middleware),

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
