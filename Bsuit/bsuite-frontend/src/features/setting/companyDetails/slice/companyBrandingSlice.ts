import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ErrorState {
  active: boolean;
  message: string;
}

interface CompanyBrandingState {
  companyName: string;
  shortName: string;
  // preview URL (server URL, data URL, or blob URL) used by the UI
  createdOn: string;
  logoPreview: string;
  // raw payload to send to backend: FormData or File, null when none
  logoFile: FormData | File | null;
  headerPreview: string;
  headerFile: FormData | File | null;
  logoModal: boolean;
  headerModal: boolean;
  error: ErrorState;
}

const initialState: CompanyBrandingState = {
  companyName: "",
  shortName: "",
  logoPreview: "",
  logoFile: null,
  createdOn: "",
  headerPreview: "",
  headerFile: null,
  logoModal: false,
  headerModal: false,
  error: {
    active: false,
    message: "",
  },
};

const companyBrandingSlice = createSlice({
  name: "companyBranding",
  initialState,
  reducers: {
    setCompanyName: (state, action: PayloadAction<string>) => {
      state.companyName = action.payload;
    },
    setCreatedOn: (state, action: PayloadAction<string>) => {
      state.createdOn = action.payload;
    },
    setShortName: (state, action: PayloadAction<string>) => {
      state.shortName = action.payload;
    },
    setLogo: (state, action: PayloadAction<FormData | File | string | null>) => {
      const payload = action.payload;

      // Revoke previous blob URL to avoid memory leaks
      try {
        if (typeof state.logoPreview === "string" && state.logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(state.logoPreview);
        }
      } catch (e) {
        // noop
      }

      // Clear when null or empty string
      if (payload === null || payload === "") {
        state.logoPreview = "";
        state.logoFile = null;
        return;
      }

      if (typeof payload === "string") {
        state.logoPreview = payload;
        state.logoFile = null;
      } else if (payload instanceof FormData) {
        // Keep the FormData for upload and create a preview from any File/Blob inside
        state.logoFile = payload;
        const isFileOrBlob = (val: any): val is File | Blob =>
          val && typeof (val as any).size === "number" && typeof (val as any).type === "string";
        const file = Array.from(payload.values()).find(isFileOrBlob) as File | Blob | undefined;
        if (file) {
          try {
            state.logoPreview = URL.createObjectURL(file);
          } catch (e) {
            state.logoPreview = "";
          }
        } else {
          state.logoPreview = "";
        }
      } else {
        // File instance
        state.logoFile = payload as File;
        try {
          state.logoPreview = URL.createObjectURL(payload as File);
        } catch (e) {
          state.logoPreview = "";
        }
      }
    },
    setHeader: (state, action: PayloadAction<FormData | File | string | null>) => {
      const payload = action.payload;

      // Revoke previous blob URL to avoid memory leaks
      try {
        if (typeof state.headerPreview === "string" && state.headerPreview.startsWith("blob:")) {
          URL.revokeObjectURL(state.headerPreview);
        }
      } catch (e) {
        // noop
      }

      if (payload === null || payload === "") {
        state.headerPreview = "";
        state.headerFile = null;
        return;
      }

      if (typeof payload === "string") {
        state.headerPreview = payload;
        state.headerFile = null;
      } else if (payload instanceof FormData) {
        state.headerFile = payload;
        const isFileOrBlob = (val: any): val is File | Blob =>
          val && typeof (val as any).size === "number" && typeof (val as any).type === "string";
        const file = Array.from(payload.values()).find(isFileOrBlob) as File | Blob | undefined;
        if (file) {
          try {
            state.headerPreview = URL.createObjectURL(file);
          } catch (e) {
            state.headerPreview = "";
          }
        } else {
          state.headerPreview = "";
        }
      } else {
        state.headerFile = payload as File;
        try {
          state.headerPreview = URL.createObjectURL(payload as File);
        } catch (e) {
          state.headerPreview = "";
        }
      }
    },
    setLogoModalState: (state, action: PayloadAction<boolean>) => {
      state.logoModal = action.payload;
    },
    setHeaderModalState: (state, action: PayloadAction<boolean>) => {
      state.headerModal = action.payload;
    },
    setErrorState: (state, action: PayloadAction<ErrorState>) => {
      state.error = action.payload;
    },
    clearImages: (state) => {
      try {
        if (typeof state.logoPreview === "string" && state.logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(state.logoPreview);
        }
      } catch (e) { 
        // noop
      }

      try {
        if (typeof state.headerPreview === "string" && state.headerPreview.startsWith("blob:")) {
          URL.revokeObjectURL(state.headerPreview);
        }
      } catch (e) {
        // noop
      }

      state.logoPreview = "";
      state.logoFile = null;
      state.headerPreview = "";
      state.headerFile = null;
    },
  },
});

export const {
  setCreatedOn,
  setShortName,     
  setLogo,
  setHeader,
  setLogoModalState,
  setHeaderModalState,
  setErrorState,
  clearImages,
  setCompanyName,
} = companyBrandingSlice.actions;

export default companyBrandingSlice.reducer;
