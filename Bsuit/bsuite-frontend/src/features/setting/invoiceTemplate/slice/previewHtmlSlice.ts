import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PreviewHtmlState {
  html: string;
  placeholders: string[];
  previewHtml: string;
  placeholderPositions: Record<string, string[]>;
}

const initialState: PreviewHtmlState = {
  html: "<p></p>",
  placeholders: [],
  previewHtml: "",
  placeholderPositions: {}, 
};

const previewHtmlSlice = createSlice({
  name: "previewHtml",
  initialState,
  reducers: {
    saveHeader: (
      state,
      action: PayloadAction<{ html: string; placeholders: string[] }>
    ) => {
      state.html = action.payload.html;
      state.placeholders = action.payload.placeholders;
    },

    setPreviewHtml: (state, action: PayloadAction<string>) => {
      state.previewHtml = action.payload;
    },

    setPlaceholderPositions: (
      state,
      action: PayloadAction<Record<string, string[]>>
    ) => {
      state.placeholderPositions = action.payload;
    },

    clearHeader: (state) => {
      state.html = "<p></p>";
      state.placeholders = [];
      state.previewHtml = "";
      state.placeholderPositions = {};
    },
    prefillHeader(
  state,
  action: PayloadAction<Record<string, string[]>>
) {
  state.placeholderPositions = action.payload ?? {};
}
,
 resetHeader: () => initialState,
  },
});

export const { saveHeader, setPreviewHtml, clearHeader, setPlaceholderPositions ,   prefillHeader,resetHeader  } =
  previewHtmlSlice.actions

export default previewHtmlSlice.reducer;
