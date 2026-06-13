import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// List of months
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
type Month = (typeof months)[number];

// Helper functions to calculate max days in month
function getMaxDaysForMonth(m: Month | string) {
  const mm = String(m).toLowerCase();
  if (["april", "june", "september", "november"].includes(mm)) return 30;
  if (mm === "february") return 29; // allow Feb 29 as safe default
  return 31;
}

/** compute fiscal end (month/day) from start (uses base leap-year so Feb29 ok) */
function computeFiscalEndFromStart(startMonth: Month | string, startDay: string | number) {
  const startMonthIndex = months.indexOf(String(startMonth) as Month);
  const day = Math.max(1, Math.min(31, Number(startDay) || 1));

  const startDate = new Date(2000, Math.max(0, startMonthIndex), day);
  const nextYearSame = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
  nextYearSame.setDate(nextYearSame.getDate() - 1);

  return {
    month: months[nextYearSame.getMonth()],
    day: String(nextYearSame.getDate()),
  };
}

/* ---------- state shape & initial ---------- */
interface ReportState {
  reportingCurrency: string;
  fiscalStartMonth: Month;
  fiscalStartDay: string;
  fiscalEndMonth: Month;
  fiscalEndDay: string;
  commaSep: "IN" | "US";
  enableFx: boolean;
  showCompanyName: boolean;
  showHeaderImage: boolean;
  showPageNumber: boolean;
  showGeneratedBy: boolean;
  showGeneratedDate: boolean;
  showGeneratedTime: boolean;
  footerContent: string;
  footerMax: number;
}

const initialState: ReportState = {
  reportingCurrency: "₹ - INR",
  fiscalStartMonth: "June",
  fiscalStartDay: "1",
  fiscalEndMonth: "May",
  fiscalEndDay: "31",
  commaSep: "US",
  enableFx: false,
  showCompanyName: true,
  showHeaderImage: true,
  showPageNumber: true,
  showGeneratedBy: true,
  showGeneratedDate: true,
  showGeneratedTime: true,
  footerContent: "",
  footerMax: 75,
};

/* ---------- slice ---------- */
const reportSlice = createSlice({
  name: "reportStructure",
  initialState,
  reducers: {
    setReportingCurrency(state, action: PayloadAction<string>) {
      state.reportingCurrency = action.payload;
    },
    setFiscalStartMonth(state, action: PayloadAction<Month>) {
      state.fiscalStartMonth = action.payload;
      const max = getMaxDaysForMonth(action.payload);
      if (Number(state.fiscalStartDay) > max) state.fiscalStartDay = String(max);
      const end = computeFiscalEndFromStart(state.fiscalStartMonth, state.fiscalStartDay);
      state.fiscalEndMonth = end.month;
      state.fiscalEndDay = end.day;
    },
    setFiscalStartDay(state, action: PayloadAction<string>) {
      const val = String(Math.max(1, Math.min(31, Number(action.payload) || 1)));
      state.fiscalStartDay = val;
      const end = computeFiscalEndFromStart(state.fiscalStartMonth, state.fiscalStartDay);
      state.fiscalEndMonth = end.month;
      state.fiscalEndDay = end.day;
    },
    setFiscalEndMonth(state, action: PayloadAction<Month>) {
      state.fiscalEndMonth = action.payload;
      const max = getMaxDaysForMonth(action.payload);
      if (Number(state.fiscalEndDay) > max) state.fiscalEndDay = String(max);
    },
    setFiscalEndDay(state, action: PayloadAction<string>) {
      const val = String(Math.max(1, Math.min(31, Number(action.payload) || 1)));
      state.fiscalEndDay = val;
      const max = getMaxDaysForMonth(state.fiscalEndMonth);
      if (Number(state.fiscalEndDay) > max) state.fiscalEndDay = String(max);
    },
    setCommaSep(state, action: PayloadAction<ReportState["commaSep"]>) {
      state.commaSep = action.payload;
    },
    setEnableFx(state, action: PayloadAction<boolean>) {
      state.enableFx = action.payload;
    },

    // ---------- toggles ----------
    toggleShowCompanyName(state) { state.showCompanyName = !state.showCompanyName; },
    toggleShowHeaderImage(state) { state.showHeaderImage = !state.showHeaderImage; },
    toggleShowPageNumber(state) { state.showPageNumber = !state.showPageNumber; },
    toggleShowGeneratedBy(state) { state.showGeneratedBy = !state.showGeneratedBy; },
    toggleShowGeneratedDate(state) { state.showGeneratedDate = !state.showGeneratedDate; },
    toggleShowGeneratedTime(state) { state.showGeneratedTime = !state.showGeneratedTime; },

    // ---------- set from API ----------
    setShowCompanyName(state, action: PayloadAction<boolean>) { state.showCompanyName = action.payload; },
    setShowHeaderImage(state, action: PayloadAction<boolean>) { state.showHeaderImage = action.payload; },
    setShowPageNumber(state, action: PayloadAction<boolean>) { state.showPageNumber = action.payload; },
    setShowGeneratedBy(state, action: PayloadAction<boolean>) { state.showGeneratedBy = action.payload; },
    setShowGeneratedDate(state, action: PayloadAction<boolean>) { state.showGeneratedDate = action.payload; },
    setShowGeneratedTime(state, action: PayloadAction<boolean>) { state.showGeneratedTime = action.payload; },

    setFooterContent(state, action: PayloadAction<string>) {
      const v = action.payload ?? "";
      state.footerContent = v.length > state.footerMax ? v.slice(0, state.footerMax) : v;
    },
    reset(state) {
      return initialState;
    },
  },
});

export const {
  setReportingCurrency,
  setFiscalStartMonth,
  setFiscalStartDay,
  setFiscalEndMonth,
  setFiscalEndDay,
  setCommaSep,
  setEnableFx,
  toggleShowCompanyName,
  toggleShowHeaderImage,
  toggleShowPageNumber,
  toggleShowGeneratedBy,  
  toggleShowGeneratedDate,
  toggleShowGeneratedTime,
  setShowCompanyName,
  setShowHeaderImage,
  setShowPageNumber,
  setShowGeneratedBy,
  setShowGeneratedDate,
  setShowGeneratedTime,
  setFooterContent,
  reset,
} = reportSlice.actions;

export default reportSlice.reducer;
