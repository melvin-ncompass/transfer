import { baseApi } from "../../../../../../api/base.api";

const PAYROLL_URL = "/payroll";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayrunStatus =
  | "draft"
  | "created"   // backend alias for draft
  | "approved"
  | "rejected"
  | "partially_paid"
  | "paid"
  | "skipped";

// GET /payroll/next_payable
export type NextPayablePayRun = {
  id: number;
  totalNetPay: number;
  totalCostToCompany: number;
};

export type NextPayableResponse = {
  payableDate: string;
  noOfEmployees: number;
  cycleStart: string;
  cycleEnd: string;
  /** Present when a payrun already exists for this cycle */
  payRun?: NextPayablePayRun | null;
};

// GET /payroll/payrun_history
export type PayrunHistoryItem = {
  payrunId: number;
  cycleStart: string;
  cycleEnd: string;
  payableDate: string;
  status: string;
  totalNetPay: number;
  totalCostToCompany: number;
  noOfEmployees: number;
};

// POST /payroll/create
export type CreatePayrollResponse = {
  payrunId: number;
  totalNetPay: number;
  totalCostToCompany: number;
  noOfEmployees: number;
};

// GET /payroll/{id} — summary sub-object
export type PayrunSummary = {
  payableDate: string;
  cycleStart: string;
  cycleEnd: string;
  financialYear: string;
  status: PayrunStatus;
  noOfEmployees: number;
  totalNetPay: number;
  totalCostToCompany: number;
  preTaxDeductionTotal: number;
  postTaxDeductionTotal: number;
  totalIncomeTax: number;
  preTaxSums: Record<string, number>;
  postTaxSums: Record<string, number>;
  /** True when the entire payrun has been skipped via skip_payrun. */
  isPayrunSkipped?: boolean;
};

// POST /payroll/skip_employees
export type SkipEmployeesPayload = {
  payrunId: number;
  employeeIds: number[];
  reason: string;
};

export type SkipEmployeesResponse = {
  payrunId: number;
  employeeIds: number[];
  reason?: string;
};

// POST /payroll/restore_employees
export type RestoreEmployeesPayload = {
  payrunId: number;
  employeeIds: number[];
};

export type RestoreEmployeesResponse = {
  payrunId: number;
  employeeIds: number[];
};

// POST /payroll/skip_payrun/:payrunId
export type SkipPayrunResponse = {
  payrunId: number;
  status: string;
  isPayrunSkipped: boolean;
};

// POST /payroll/unskip_payrun/:payrunId
export type UnskipPayrunResponse = {
  payrunId: number;
  status: string;
  isPayrunSkipped: boolean;
};

// GET /payroll/{id} — employee row
export type PayrunEmployee = {
  name: string;
  workingDays: string;
  lopDays: string;
  noOfPaidDays: string;
  monthlyGross: number;
  pfPaid: number;
  ptPaid: number;
  incomeTax: number;
  netPay: number;
  /**
   * Component ids for already-applied one-time / non-recurring earnings & deductions.
   * Used to conditionally show "Remove Non-Recurring ..." actions.
   */
  onetimeEarningIds?: number[];
  onetimeDeductionIds?: number[];
  /** Display code in UI (e.g. PN01). Prefer for ID column when present. */
  employeeCode?: string;
  employeeNumber?: string;
  /**
   * Numeric id for POST/DELETE payroll payloads, GET payslip path, record_payment, etc.
   * (Matches `employeeId` in those request/response bodies.)
   */
  id: number;
  /**
   * May be a legacy numeric HR id, or a display code string (e.g. "PN01") from newer APIs.
   * Prefer `id` for API calls when both exist.
   */
  employeeId?: number | string;
  /** True when this employee has been skipped from the current payrun. */
  isSkipped?: boolean;
  /** Reason provided when the employee was skipped. */
  skipReason?: string;
};

// GET /payroll/{id}
export type PayrunDetailsResponse = {
  summary: PayrunSummary;
  employees: PayrunEmployee[];
};

// GET /payroll/payslip/{payrunId}/{employeeId}
export type PayslipEarning = {
  earningId: number;
  earningName: string;
  earningComponentName: string;
  monthlyAmount: number;
  monthlyAmountWithoutLop: number;
};

export type PayslipDeduction = {
  deductionId: number;
  deductionName: string;
  deductionComponentName: string;
  monthlyAmount: number;
  monthlyAmountWithoutLop: number;
};

export type PayslipOtherComponent = {
  deductionId: number;
  deductionName: string;
  deductionComponentName: string;
  monthlyAmount: number;
  monthlyAmountWithoutLop: number;
};

export type PayslipResponse = {
  employeeName: string;
  employeeId: number;
  templateId: number;
  earningDetails: PayslipEarning[];
  deductionDetails: PayslipDeduction[];
  incomeTax: number;
  netPay: number;
  netpayWithoutLop: number;
  lopDays: number;
  noOfPaidDays: number;
  actualIncomeTax: number;
  totalEarnings: number;
  periodStart: string;
  periodEnd: string;
  payableDate: string;
  employeeNumber: string;
  otherComponents: PayslipOtherComponent;
  employeeWorkingDays: number;
};

// GET /payroll/payment_history/{id}
export type PaymentItem = {
  paymentId: string;
  amount: number;
  date: string;
};

export type PaymentBatch = {
  payrollPaymentId: string;
  recordedAt: string;
  items: PaymentItem[];
};

export type PaymentHistoryResponse = {
  payments: PaymentBatch[];
};

// GET /payroll/tds_sheet/{payrunId}/{employeeId}
export type TdsAggregatedEarningRow = {
  actual: number;
  projection: number;
  gross: number;
};

export type TdsSlabBreakdownRow = {
  from: number;
  to: number;
  tax: number;
  taxAmount: number;
};

export type TdsTaxAmountRangeRow = {
  from: number;
  to: number;
  tax: number;
};

export type TdsHraMonthlyRow = {
  rentPaid: number;
  percentOfBasic: number;
  hraReceived: number;
  rentOverBasic: number;
  monthExemption: number;
};

export type TdsPrevEmploymentData = {
  prevEarnings: number;
  previouslyPaid: number;
  pfPaid: number;
  ptPaid: number;
};

/** Chapter VI-A sections for TDS sheet display (shape may vary by backend). */
export type TdsChapterSixSubsection = {
  /** Display order when API sends keyed subsections (e.g. "1A"). */
  subsectionCode?: string;
  index?: number;
  label?: string;
  givenAmount?: number;
  consideredAmount?: number;
};

export type TdsChapterSixSection = {
  sectionName?: string;
  subsections?: TdsChapterSixSubsection[];
  sectionTotal?: number;
};

export type TdsPreTaxEarningLine = {
  earningName: string;
  amount: number;
};

export type TdsSheetResponse = {
  employeeId: number;
  employeeName: string;
  panNumber: string;
  taxConfigId: number;
  taxConfigName: string;
  configName: string;
  versionNo: number;
  taxableIncomeThreshold: number;
  rebateAmountConfig: number;
  aggregatedEarnings: Record<string, TdsAggregatedEarningRow>;
  totalEarnings: number;
  totalAfterExemptions: number;
  prevEmploymentData?: TdsPrevEmploymentData;
  taxableIncomeFromPrevEmp?: number;
  totalDeclaredExemptions: number;
  totalIncome: number;
  totalIncomeAfterHouseLoan: number;
  standardDeduction: number;
  section16Total: number;
  incomeUnderHeadSalaries: number;
  grossTotal: number;
  beforePrevTax: number;
  taxAmount: TdsTaxAmountRangeRow[];
  slabBreakdown: TdsSlabBreakdownRow[];
  taxAfterRebateRelief?: number;
  totalSurchargeAmount?: number;
  taxPayable: number;
  incomeTax: number;
  taxDeductedAtSource: number;
  upcomingTds: number;
  approvedAmt?: boolean;
  poiStatus?: string;
  hraAmount?: number;
  hraMonthlyData?: Record<string, TdsHraMonthlyRow>;
  /** Chapter VI-A sections; normalized from API (snake_case / keyed subsections) in `getTdsSheet`. */
  exemptionDetails?: TdsChapterSixSection[];
  preTaxEarningLines?: TdsPreTaxEarningLine[];
  totalPreTax?: number;
  loanOnSelfOccupiedProperty?: number;
  incomeLossForLetOut?: number;
  incomeLossForProperty?: number;
  isLetOutPropertyGain?: boolean;
  taxPaidForPrevMonths?: number;
  taxOnSlabIncome?: number;
  appliedRebateAmount?: number;
  reliefAmount?: number;
  cessAmount?: number;
  totalIncomeTaxForYear?: number;
  /** If omitted, UI may use `prevEmploymentData.previouslyPaid`. */
  prevEmploymentTaxPaid?: number;
  taxBeforeEducationCess?: number;
  isNewTaxRegime?: boolean;
};

function normalizeTdsChapterSixSubsection(
  raw: unknown,
  i: number,
  subsectionKey: string | undefined,
): TdsChapterSixSubsection | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const label =
    (typeof o.label === "string" && o.label) ||
    (typeof o.exemption_name === "string" && o.exemption_name) ||
    "—";

  const givenAmount =
    typeof o.givenAmount === "number"
      ? o.givenAmount
      : typeof o.given_amount === "number"
        ? o.given_amount
        : 0;

  const consideredAmount =
    typeof o.consideredAmount === "number"
      ? o.consideredAmount
      : typeof o.considered_amount === "number"
        ? o.considered_amount
        : 0;

  const index = typeof o.index === "number" ? o.index : undefined;

  return {
    subsectionCode: subsectionKey,
    index: index ?? i + 1,
    label,
    givenAmount,
    consideredAmount,
  };
}

function normalizeTdsChapterSixSection(
  raw: unknown,
  fallbackKey: string,
): TdsChapterSixSection | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const sectionName =
    (typeof r.sectionName === "string" && r.sectionName) ||
    (typeof r.section_name === "string" && r.section_name) ||
    fallbackKey ||
    "Section";

  const sectionTotal =
    typeof r.sectionTotal === "number"
      ? r.sectionTotal
      : typeof r.section_total === "number"
        ? r.section_total
        : undefined;

  const subsRaw = r.subsections;
  const subsections: TdsChapterSixSubsection[] = [];

  if (Array.isArray(subsRaw)) {
    subsRaw.forEach((sub, i) => {
      const n = normalizeTdsChapterSixSubsection(sub, i, undefined);
      if (n) subsections.push(n);
    });
  } else if (subsRaw && typeof subsRaw === "object") {
    const subEntries = Object.entries(subsRaw as Record<string, unknown>);
    subEntries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    subEntries.forEach(([code, sub], i) => {
      const n = normalizeTdsChapterSixSubsection(sub, i, code);
      if (n) subsections.push(n);
    });
  }

  return { sectionName, sectionTotal, subsections };
}

/** Maps backend shapes (snake_case, subsections as keyed objects) to UI rows. */
export function normalizeTdsExemptionDetails(
  exemptionDetails: TdsSheetResponse["exemptionDetails"],
): TdsChapterSixSection[] {
  if (!exemptionDetails) return [];
  if (Array.isArray(exemptionDetails)) {
    return exemptionDetails
      .map((raw) => normalizeTdsChapterSixSection(raw, ""))
      .filter((s): s is TdsChapterSixSection => s !== null);
  }
  if (typeof exemptionDetails === "object") {
    const entries = Object.entries(exemptionDetails as Record<string, unknown>);
    entries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    return entries
      .map(([key, val]) => normalizeTdsChapterSixSection(val, key))
      .filter((s): s is TdsChapterSixSection => s !== null);
  }
  return [];
}

// GET /payroll/employee_balances/{id}
export type EmployeeBalanceRow = {
  employeeId: number;
  employeeCode: string;
  name: string;
  netPay: number;
  amountPaid: number;
  balanceDue: number;
};

export type EmployeeBalancesResponse = {
  payrunId: number;
  employees: EmployeeBalanceRow[];
};

// POST /payroll/export/payout/{payrunId}
export type PayoutExportRow = {
  employeeId?: number;
  employeeCode?: string;
  employeeName: string;
  accountName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  netPay: number;
  currency: string;
  email: string | null;
  remarks: string | null;
};

export type PayoutReportPreviewResponse = {
  payableDate?: string;
  rows: PayoutExportRow[];
};

// POST /payroll/record_payment/{id}
export type SameDatePaymentPayload = {
  sameDatePayment: true;
  paymentAccountId: number;
  paymentDate: string;
};

export type DifferentDatePaymentPayload = {
  sameDatePayment: false;
  paymentAccountId: number;
  employees: {
    employeeId: number;
    paymentDate: string;
    paymentAmount: number;
  }[];
};

export type RecordPaymentPayload =
  | SameDatePaymentPayload
  | DifferentDatePaymentPayload;

// PATCH /payroll/income_tax_override
export type IncomeTaxOverridePayload = {
  payrunId: number;
  employeeId: number;
  incomeTax: number;
};

export type IncomeTaxOverrideResponse = {
  payrunId: number;
  employeeId: number;
  incomeTax: number;
  netPay: number;
  isTaxOverride: boolean;
  totalNetPay: number;
  totalIncomeTax: number;
};

/** One line in POST /payroll/non_recurring_earning/ and /payroll/non_recurring_deduction/ */
export type NonRecurringComponentLine = {
  componentId: number;
  monthlyAmount: number;
};

// POST /payroll/non_recurring_earning/
export type NonRecurringEarningAddPayload = {
  payrunId: number;
  employeeIds: number[];
  components: NonRecurringComponentLine[];
};

// DELETE /payroll/non_recurring_earning/
export type NonRecurringEarningRemovePayload = {
  payrunId: number;
  componentIds: number[];
  employeeIds: number[];
};

// POST /payroll/non_recurring_deduction/
export type NonRecurringDeductionAddPayload = {
  payrunId: number;
  employeeIds: number[];
  components: NonRecurringComponentLine[];
};

// DELETE /payroll/non_recurring_deduction/
export type NonRecurringDeductionRemovePayload = {
  payrunId: number;
  componentIds: number[];
  employeeIds: number[];
};

export type NonRecurringAddResponseData = {
  nonRecurringComponentIds: number[];
  payrunId: number;
  employeeIds: number[];
  count: number;
};

export type NonRecurringRemoveResponseData = {
  removed: boolean;
  payrunId: number;
  componentId?: number;
  employeeIds: number[];
  type?: string;
  count: number;
};

// POST /payroll/add_lop
export type LopAddPayload = {
  payrunId: number;
  employeeIds: number[];
  lopDays: number;
};

// DELETE /payroll/remove_lop/
export type LopRemovePayload = {
  payrunId: number;
  employeeIds: number[];
};

// GET /payroll_config/config_count
export type PayrunConfigStep = {
  completed: boolean;
};
export type PayrunConfigSteps = {
  paySchedule: PayrunConfigStep & { count: number };
  salaryStructure: PayrunConfigStep & { earningCount: number; deductionCount: number };
  salaryTemplate: PayrunConfigStep & { count: number };
  departmentAndDesignation: PayrunConfigStep & { departmentCount: number; designationCount: number };
  incomeTaxConfiguration: PayrunConfigStep & { count: number };
  leaveAndShift: PayrunConfigStep & { leaveTypeCount: number; leavePlanCount: number; shiftCount: number };
  holidayPlan: PayrunConfigStep & { count: number };
  employee: PayrunConfigStep & { count: number };
};
export type PayrunConfigCountResponse = {
  completedSteps: number;
  progressPercentage: number;
  steps: PayrunConfigSteps;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const PayrunApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /payroll_config/config_count
    getPayrollConfigCount: builder.query<PayrunConfigCountResponse, void>({
      query: () => "/payroll_config/config_count",
      transformResponse: (response: ApiResponse<PayrunConfigCountResponse>) =>
        response.data,
    }),

    // GET /payroll/next_payable
    getNextPayable: builder.query<NextPayableResponse, void>({
      query: () => `${PAYROLL_URL}/next_payable`,
      transformResponse: (response: ApiResponse<NextPayableResponse>) =>
        response.data,
      providesTags: ["Payrun"],
    }),

    // GET /attendance/entries/{employeeId}
    getAttendanceEntries: builder.query<{ dates: string[] }, number>({
      query: (employeeId) => `/attendance/entries/${employeeId}`,
      transformResponse: (response: { dates: string[] } | ApiResponse<{ dates: string[] }>) =>
        "data" in response ? (response as ApiResponse<{ dates: string[] }>).data : response,
    }),

    // GET /payroll/payrun_history
    getPayrunHistory: builder.query<PayrunHistoryItem[], void>({
      query: () => `${PAYROLL_URL}/payrun_history`,
      transformResponse: (response: ApiResponse<PayrunHistoryItem[]>) =>
        response.data,
      providesTags: ["PayrunHistory"],
    }),

    // POST /payroll/create
    createPayroll: builder.mutation<CreatePayrollResponse, void>({
      query: () => ({
        url: `${PAYROLL_URL}/create`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<CreatePayrollResponse>) =>
        response.data,
      invalidatesTags: ["Payrun"],
    }),

    // GET /payroll/{id}
    getPayrunDetails: builder.query<PayrunDetailsResponse, number>({
      query: (payrunId) => `${PAYROLL_URL}/${payrunId}`,
      transformResponse: (response: ApiResponse<PayrunDetailsResponse>) =>
        response.data,
      providesTags: (_result, _error, payrunId) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // POST /payroll/approve/{id}
    approvePayrun: builder.mutation<
      { payrunId: number; payrunStatus: PayrunStatus },
      number
    >({
      query: (id) => ({
        url: `${PAYROLL_URL}/approve/${id}`,
        method: "POST",
      }),
      transformResponse: (
        response: ApiResponse<{ payrunId: number; payrunStatus: PayrunStatus }>
      ) => response.data,
      // No PayrunDetails invalidation — status is taken from the response directly
      invalidatesTags: ["Payrun", "PayrunHistory"],
    }),

    // POST /payroll/reject/{id}
    rejectPayrun: builder.mutation<
      { payrunId: number; payrunPeriod: string; payrunStatus: PayrunStatus },
      number
    >({
      query: (id) => ({
        url: `${PAYROLL_URL}/reject/${id}`,
        method: "POST",
      }),
      transformResponse: (
        response: ApiResponse<{
          payrunId: number;
          payrunPeriod: string;
          payrunStatus: PayrunStatus;
        }>
      ) => response.data,
      // No PayrunDetails invalidation — status is taken from the response directly
      invalidatesTags: ["Payrun", "PayrunHistory"],
    }),

    // POST /payroll/record_payment/{id}
    recordPayment: builder.mutation<
      { payrunId: number; payrunStatus: PayrunStatus },
      { id: number; payload: RecordPaymentPayload }
    >({
      query: ({ id, payload }) => ({
        url: `${PAYROLL_URL}/record_payment/${id}`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (
        response: ApiResponse<{ payrunId: number; payrunStatus: PayrunStatus }>
      ) => response.data,
      // No PayrunDetails invalidation — status is taken from the response directly
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PayrunHistory", id },
        { type: "PayrunEmployeeBalances", id },
        "PayrunHistory",
        "Payrun",
      ],
    }),

    // GET /payroll/payment_history/{id}
    getPaymentHistory: builder.query<PaymentHistoryResponse, number>({
      query: (id) => `${PAYROLL_URL}/payment_history/${id}`,
      transformResponse: (response: ApiResponse<PaymentHistoryResponse>) =>
        response.data,
      providesTags: (_result, _error, id) => [{ type: "PayrunHistory", id }],
    }),

    // GET /payroll/employee_balances/{id}
    getEmployeeBalances: builder.query<EmployeeBalancesResponse, number>({
      query: (payrunId) => `${PAYROLL_URL}/employee_balances/${payrunId}`,
      transformResponse: (response: ApiResponse<EmployeeBalancesResponse>) =>
        response.data,
      providesTags: (_result, _error, payrunId) => [
        { type: "PayrunEmployeeBalances", id: payrunId },
      ],
    }),

    // GET /payroll/payout_report/{payrunId}
    getPayoutReportPreview: builder.mutation<PayoutReportPreviewResponse, number>({
      query: (payrunId) => ({
        url: `${PAYROLL_URL}/payout_report/${payrunId}`,
        method: "GET",
      }),
      transformResponse: (
        response:
          | ApiResponse<PayoutExportRow[]>
          | ApiResponse<PayoutReportPreviewResponse>
          | { data?: PayoutReportPreviewResponse | PayoutExportRow[] }
          | PayoutReportPreviewResponse
          | PayoutExportRow[]
      ) => {
        if (Array.isArray(response)) return { rows: response };
        const maybeApiData = (response as { data?: unknown }).data;
        if (Array.isArray(maybeApiData)) return { rows: maybeApiData as PayoutExportRow[] };
        if (maybeApiData && typeof maybeApiData === "object") {
          const nestedData = maybeApiData as { payableDate?: unknown; rows?: unknown };
          if (Array.isArray(nestedData.rows)) {
            return {
              payableDate: typeof nestedData.payableDate === "string" ? nestedData.payableDate : undefined,
              rows: nestedData.rows as PayoutExportRow[],
            };
          }
        }
        const topLevel = response as { payableDate?: unknown; rows?: unknown };
        if (Array.isArray(topLevel.rows)) {
          return {
            payableDate: typeof topLevel.payableDate === "string" ? topLevel.payableDate : undefined,
            rows: topLevel.rows as PayoutExportRow[],
          };
        }
        return { rows: [] };
      },
    }),

    // POST /payroll/export/payout/{payrunId}
    downloadPayoutReport: builder.mutation<
      { blob: Blob; fileName: string },
      number | { payrunId: number; rows: PayoutExportRow[] }
    >({
      query: (arg) => {
        const payrunId = typeof arg === "number" ? arg : arg.payrunId;
        const rows = typeof arg === "number" ? [] : arg.rows;
        return ({
        url: `${PAYROLL_URL}/export/payout/${payrunId}`,
        method: "POST",
        body: rows,
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition = response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = fileNameMatch ? fileNameMatch[1] : `payout-report-${payrunId}.xlsx`;
          return { blob, fileName };
        },
      });
    },
    }),

    // GET /payroll/payslip/{payrunId}/{employeeId}
    getPayslip: builder.query<
      PayslipResponse,
      { payrunId: number; employeeId: number }
    >({
      query: ({ payrunId, employeeId }) =>
        `${PAYROLL_URL}/payslip/${payrunId}/${employeeId}`,
      transformResponse: (response: ApiResponse<PayslipResponse>) =>
        response.data,
      /** Drop payslip from RTK cache as soon as nothing subscribes (modal closed). */
      keepUnusedDataFor: 0,
      providesTags: (_result, _error, { payrunId, employeeId }) => [
        { type: "PayrunPayslip", id: `${payrunId}-${employeeId}` },
      ],
    }),

    // PATCH /payroll/income_tax_override
    updateIncomeTaxOverride: builder.mutation<
      IncomeTaxOverrideResponse,
      IncomeTaxOverridePayload
    >({
      query: (body) => ({
        url: `${PAYROLL_URL}/income_tax_override`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiResponse<IncomeTaxOverrideResponse>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId, employeeId }) => [
        { type: "PayrunDetails", id: payrunId },
        { type: "PayrunPayslip", id: `${payrunId}-${employeeId}` },
        "Payrun",
      ],
    }),

    // GET /payroll/ecr/{id}
    downloadEcr: builder.mutation<{ blob: Blob; fileName: string }, number>({
      query: (payrunId) => ({
        url: `${PAYROLL_URL}/ecr/${payrunId}`,
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition =
            response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = fileNameMatch ? fileNameMatch[1] : `ecr-${payrunId}.txt`;
          return { blob, fileName };
        },
      }),
    }),

    // GET /payroll/payslip/export/{payrunId}/{employeeId}?history=true|false
    downloadPayslipExport: builder.mutation<
      { blob: Blob; fileName: string },
      { payrunId: number; employeeId: number; history?: boolean }
    >({
      query: ({ payrunId, employeeId, history }) => ({
        url: `${PAYROLL_URL}/payslip/export/${payrunId}/${employeeId}`,
        method: "GET",
        params: { history: history === true ? "true" : "false" },
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition = response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = fileNameMatch
            ? fileNameMatch[1]
            : `payslip-${payrunId}-${employeeId}.pdf`;
          return { blob, fileName };
        },
      }),
    }),

    // GET /payroll/tds_sheet/{payrunId}/{employeeId}
    getTdsSheet: builder.query<
      TdsSheetResponse,
      { payrunId: number; employeeId: number }
    >({
      query: ({ payrunId, employeeId }) =>
        `${PAYROLL_URL}/tds_sheet/${payrunId}/${employeeId}`,
      transformResponse: (response: ApiResponse<TdsSheetResponse>) => {
        const data = response.data;
        if (!data) return data;
        return {
          ...data,
          exemptionDetails: normalizeTdsExemptionDetails(data.exemptionDetails),
        };
      },
      providesTags: (_result, _error, { payrunId, employeeId }) => [
        { type: "PayrunTdsSheet", id: `${payrunId}-${employeeId}` },
      ],
    }),

    // GET /payroll/download_tds_sheet/{payrunId}/{employeeId}
    downloadTdsSheet: builder.mutation<
      { blob: Blob; fileName: string },
      { payrunId: number; employeeId: number }
    >({
      query: ({ payrunId, employeeId }) => ({
        url: `${PAYROLL_URL}/download_tds_sheet/${payrunId}/${employeeId}`,
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition = response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const fileName = fileNameMatch
            ? fileNameMatch[1]
            : `tds-sheet-${payrunId}-${employeeId}.pdf`;
          return { blob, fileName };
        },
      }),
    }),

    // POST /payroll/non_recurring_earning/
    addNonRecurringEarning: builder.mutation<
      NonRecurringAddResponseData,
      NonRecurringEarningAddPayload
    >({
      query: (body) => ({
        url: `${PAYROLL_URL}/non_recurring_earning/`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<NonRecurringAddResponseData>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // DELETE /payroll/non_recurring_earning/
    deleteNonRecurringEarning: builder.mutation<
      NonRecurringRemoveResponseData,
      NonRecurringEarningRemovePayload
    >({
      query: (body) => ({
        url: `${PAYROLL_URL}/non_recurring_earning/`,
        method: "DELETE",
        body,
      }),
      transformResponse: (response: ApiResponse<NonRecurringRemoveResponseData>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // POST /payroll/non_recurring_deduction/
    addNonRecurringDeduction: builder.mutation<
      NonRecurringAddResponseData,
      NonRecurringDeductionAddPayload
    >({
      query: (body) => ({
        url: `${PAYROLL_URL}/non_recurring_deduction/`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<NonRecurringAddResponseData>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // DELETE /payroll/non_recurring_deduction/
    deleteNonRecurringDeduction: builder.mutation<
      NonRecurringRemoveResponseData,
      NonRecurringDeductionRemovePayload
    >({
      query: (body) => ({
        url: `${PAYROLL_URL}/non_recurring_deduction/`,
        method: "DELETE",
        body,
      }),
      transformResponse: (response: ApiResponse<NonRecurringRemoveResponseData>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // POST /payroll/add_lop
    addLop: builder.mutation<{ message: string }, LopAddPayload>({
      query: (body) => ({
        url: `${PAYROLL_URL}/add_lop`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // DELETE /payroll/remove_lop/
    removeLop: builder.mutation<{ message: string }, LopRemovePayload>({
      query: (body) => ({
        url: `${PAYROLL_URL}/remove_lop/`,
        method: "DELETE",
        body,
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // DELETE /payroll/{id}
    deletePayrun: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `${PAYROLL_URL}/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      // Do not invalidate PayrunDetails here: that would refetch the open details page (often 404)
      // and cause a visible flash/jump before navigation away. Lists still refresh via Payrun / history.
      // PaySchedule is invalidated so the Pay Schedule tab becomes editable again immediately after deletion.
      invalidatesTags: ["Payrun", "PayrunHistory", "PaySchedule"],
    }),

    // POST /payroll/skip_employees
    skipEmployees: builder.mutation<SkipEmployeesResponse, SkipEmployeesPayload>({
      query: (body) => ({
        url: `${PAYROLL_URL}/skip_employees`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<
          | SkipEmployeesResponse
          | {
              payrunId: number;
              dto?: {
                payrunId?: number;
                employeeIds?: number[];
                reason?: string;
              };
            }
        >
      ) => {
        const data = response.data as
          | SkipEmployeesResponse
          | {
              payrunId: number;
              dto?: {
                payrunId?: number;
                employeeIds?: number[];
                reason?: string;
              };
            };

        // Support both response shapes:
        // 1) { payrunId, employeeIds, reason }
        // 2) { payrunId, dto: { payrunId, employeeIds, reason } }
        if ("dto" in data && data.dto) {
          return {
            payrunId: Number(data.dto.payrunId ?? data.payrunId),
            employeeIds: Array.isArray(data.dto.employeeIds) ? data.dto.employeeIds : [],
            reason: data.dto.reason,
          };
        }
        const normalized = data as SkipEmployeesResponse;
        return {
          payrunId: Number(normalized.payrunId),
          employeeIds: Array.isArray(normalized.employeeIds) ? normalized.employeeIds : [],
          reason: normalized.reason,
        };
      },
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // POST /payroll/restore_employees
    restoreEmployees: builder.mutation<RestoreEmployeesResponse, RestoreEmployeesPayload>({
      query: (body) => ({
        url: `${PAYROLL_URL}/restore_employees`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<RestoreEmployeesResponse>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
      ],
    }),

    // POST /payroll/skip_payrun/:payrunId
    skipPayrun: builder.mutation<SkipPayrunResponse, number>({
      query: (payrunId) => ({
        url: `${PAYROLL_URL}/skip_payrun/${payrunId}`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<SkipPayrunResponse>) =>
        response.data,
      invalidatesTags: (_result, _error, payrunId) => [
        { type: "PayrunDetails", id: payrunId },
        "Payrun",
        "PayrunHistory",
      ],
    }),

    // POST /payroll/unskip_payrun/:payrunId
    unskipPayrun: builder.mutation<UnskipPayrunResponse, number>({
      query: (payrunId) => ({
        url: `${PAYROLL_URL}/unskip_payrun/${payrunId}`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<UnskipPayrunResponse>) =>
        response.data,
      invalidatesTags: (_result, _error, payrunId) => [
        { type: "PayrunDetails", id: payrunId },
        "Payrun",
        "PayrunHistory",
      ],
    }),

    // DELETE /payroll/payment/{payrunId}/{payrollPaymentId}
    deletePayment: builder.mutation<
      { message: string },
      { payrunId: number; payrollPaymentId: string }
    >({
      query: ({ payrunId, payrollPaymentId }) => ({
        url: `${PAYROLL_URL}/payment/${payrunId}/${payrollPaymentId}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: (_result, _error, { payrunId }) => [
        { type: "PayrunDetails", id: payrunId },
        { type: "PayrunEmployeeBalances", id: payrunId },
        { type: "PayrunHistory", id: payrunId },
        "PayrunHistory",
        "Payrun",
      ],
    }),
  }),
});

export const {
  useGetPayrollConfigCountQuery,
  useGetNextPayableQuery,
  useGetPayrunHistoryQuery,
  useGetAttendanceEntriesQuery,
  useCreatePayrollMutation,
  useGetPayrunDetailsQuery,
  useApprovePayrunMutation,
  useRejectPayrunMutation,
  useRecordPaymentMutation,
  useGetPaymentHistoryQuery,
  useGetEmployeeBalancesQuery,
  useGetPayoutReportPreviewMutation,
  useDownloadPayoutReportMutation,
  useGetPayslipQuery,
  useGetTdsSheetQuery,
  useUpdateIncomeTaxOverrideMutation,
  useDownloadEcrMutation,
  useDownloadPayslipExportMutation,
  useDownloadTdsSheetMutation,
  useAddNonRecurringEarningMutation,
  useDeleteNonRecurringEarningMutation,
  useAddNonRecurringDeductionMutation,
  useDeleteNonRecurringDeductionMutation,
  useAddLopMutation,
  useRemoveLopMutation,
  useDeletePayrunMutation,
  useDeletePaymentMutation,
  useSkipEmployeesMutation,
  useRestoreEmployeesMutation,
  useSkipPayrunMutation,
  useUnskipPayrunMutation,
} = PayrunApi;
