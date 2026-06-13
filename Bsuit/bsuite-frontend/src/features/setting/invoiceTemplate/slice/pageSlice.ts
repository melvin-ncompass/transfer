import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const pageNoX = 1;
const pageNoY = 1;

interface PageState {
  pageChecked: boolean;
  pageNoX: number;
  pageNoY: number;
  pageValue: string | null;
  pageCurrentFormat: string | null;
  pageType: "1" | "2" | "3" | "4"; // ✅ ADD THIS
}

const initialState: PageState = {
  pageChecked: false,
  pageNoX,
  pageNoY,
  pageValue: null,
  pageCurrentFormat: null,
  pageType: "1",
};

export const PageSlice = createSlice({
  name: "pageNumber",
  initialState,
  reducers: {
    setPageValue: (
      state,
      action: PayloadAction<{ type: "1" | "2" | "3" | "4"; format: string }>,
    ) => {
      state.pageType = action.payload.type;
      state.pageValue = action.payload.format;
      state.pageCurrentFormat = action.payload.format;
    },

    setPageChecked: (state, action: PayloadAction<boolean>) => {
      state.pageChecked = action.payload;

      if (!action.payload) {
        state.pageValue = null;
        state.pageCurrentFormat = null;
      } else {
        if (!state.pageCurrentFormat) {
          const defaultFormat = `Page ${state.pageNoX} of ${state.pageNoY}`;
          state.pageValue = defaultFormat;
          state.pageCurrentFormat = defaultFormat;
        }
      }
    },
    prefillFooter(
      state,
      action: PayloadAction<{ pageCurrentFormat: string | null }>,
    ) {
      const { pageCurrentFormat } = action.payload;

      if (pageCurrentFormat) {
        state.pageChecked = true;
        state.pageValue = pageCurrentFormat;
        state.pageCurrentFormat = pageCurrentFormat;

        //  Detect type PROPERLY
        if (pageCurrentFormat.includes("INV")) state.pageType = "4";
        else if (pageCurrentFormat.includes("/")) state.pageType = "3";
        else if (pageCurrentFormat.includes("of")) state.pageType = "1";
        else state.pageType = "2";
      } else {
        state.pageChecked = false;
        state.pageValue = null;
        state.pageCurrentFormat = null;
        state.pageType = "1";
      }
    },
    resetPage: () => initialState,
  },
});

export const { setPageValue, setPageChecked, prefillFooter, resetPage } =
  PageSlice.actions;
export default PageSlice.reducer;
