import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import CustomCircularProgress from "../../../../../../../components/atom/circular-progress/CircularProgress";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import { MonthYearPickerElement } from "../../../../../../../components/atom/date-picker";
import { ToggleSwitch } from "../../../../../../../components/atom/toggle-switch";
import { Tooltip } from "../../../../../../../components/atom/tooltip";
import { RepeaterElement } from "../../../../../../../components/atom/form-repeater";
import { useGetHeaderDataQuery } from "../../../../../../company/api/company.api";
import { useGetPayScheduleQuery } from "../../PaySchedule/api/payschedule.api";
import {
  formatCurrencyByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../../../../utils/numberFormatter";
import {
  useCreateIncomeTaxMutation,
  useUpdateIncomeTaxMutation,
  useGetFinancialYearsByConfigQuery,
} from "../api/incometax.api";
import type { CreateIncomeTaxDto } from "../types/incometax.types";

interface TaxSlab {
  fromAmount: string;
  toAmount: string;
  taxPercentage: string;
  errors?: {
    fromAmount?: string;
    toAmount?: string;
    taxPercentage?: string;
  };
}

interface SurchargeSlab {
  fromAmount: string;
  toAmount: string;
  surchargePercentage: string;
  errors?: {
    fromAmount?: string;
    toAmount?: string;
    surchargePercentage?: string;
  };
}

const DEFAULT_TAX_SLAB: TaxSlab = { fromAmount: "", toAmount: "", taxPercentage: "" };
const DEFAULT_SURCHARGE_SLAB: SurchargeSlab = {
  fromAmount: "",
  toAmount: "",
  surchargePercentage: "",
};

const rightAlignedAmountInputSlotProps = {
  htmlInput: { style: { textAlign: "right" } },
} as const;

const TAX_SLAB_OVERLAP_MSG = "Range overlaps another tax slab";
const SURCHARGE_SLAB_OVERLAP_MSG = "Range overlaps another surcharge slab";
const TAX_FROM_NON_TAXABLE_MSG =
  "At least one tax slab must have From amount equal to the non-taxable threshold.";

function slabRowHasAnyValue(from: string, to: string, rate: string): boolean {
  return Boolean(from?.trim() || to?.trim() || rate?.trim());
}

/** Highest To amount among configured tax slab rows (used as minimum surcharge From). */
function getMaxTaxSlabToAmount(taxSlabs: readonly TaxSlab[]): number | null {
  let max: number | null = null;
  for (const slab of taxSlabs) {
    if (!slabRowHasAnyValue(slab.fromAmount, slab.toAmount, slab.taxPercentage)) {
      continue;
    }
    const to = parseIncomeTaxAmount(slab.toAmount);
    if (to == null) continue;
    if (max == null || to > max) max = to;
  }
  return max;
}

type SurchargeMinFromMessageFormatter = (minFrom: number) => string;

function parseIncomeTaxAmount(s: string): number | null {
  const n = Number(String(s || "").replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

/** Whole rupee amounts: comma rules from parseNumberForTyping, no fractional part. */
function parseIntegerAmountForTyping(raw: string): string {
  const cleaned = parseNumberForTyping(raw);
  const dot = cleaned.indexOf(".");
  return dot === -1 ? cleaned : cleaned.slice(0, dot);
}

function normalizeSlabAmountString(value: string | undefined): string {
  return parseIntegerAmountForTyping(String(value ?? ""));
}

function normalizeYyyyMm(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const normalized = String(value).slice(0, 7);
  return /^\d{4}-\d{2}$/.test(normalized) ? normalized : null;
}

function parseYyyyMmMonthIndex(value: string | null | undefined): number | null {
  const normalized = normalizeYyyyMm(value);
  if (!normalized) return null;
  const monthIdx = Number.parseInt(normalized.split("-")[1], 10) - 1;
  return Number.isFinite(monthIdx) && monthIdx >= 0 && monthIdx <= 11 ? monthIdx : null;
}

function parseYyyyMmDayjs(value: string | null | undefined): Dayjs | null {
  const normalized = normalizeYyyyMm(value);
  if (!normalized) return null;
  const [yearPart, monthPart] = normalized.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return dayjs().year(year).month(month - 1).startOf("month");
}

function getOverlappingRangeIndices(
  slabs: readonly { fromAmount: string; toAmount: string }[],
  parseBound: (s: string) => number | null,
): Set<number> {
  const ranges = slabs.map((s) => {
    const from = parseBound(s.fromAmount);
    const to = parseBound(s.toAmount);
    if (from == null || to == null || from >= to) return null;
    return { from, to };
  });
  const out = new Set<number>();
  for (let i = 0; i < ranges.length; i++) {
    const a = ranges[i];
    if (!a) continue;
    for (let j = i + 1; j < ranges.length; j++) {
      const b = ranges[j];
      if (!b) continue;
      if (Math.max(a.from, b.from) < Math.min(a.to, b.to)) {
        out.add(i);
        out.add(j);
      }
    }
  }
  return out;
}

type SlabWithRangeOverlapErrors = {
  errors?: {
    fromAmount?: string;
    toAmount?: string;
    [key: string]: string | undefined;
  };
};

function applySlabRangeOverlapErrors<T extends SlabWithRangeOverlapErrors>(
  slabs: T[],
  overlappingIdx: Set<number>,
  overlapMsg: string,
): void {
  for (const idx of overlappingIdx) {
    const s = slabs[idx];
    const next: Record<string, string | undefined> = { ...s.errors };
    if (!next.fromAmount) {
      next.fromAmount = overlapMsg;
    } else if (!next.toAmount) {
      next.toAmount = overlapMsg;
    } else {
      next.toAmount = `${next.toAmount}; ${overlapMsg}`;
    }
    s.errors = next as T["errors"];
  }
}

function annotateTaxSlabNonTaxableMismatch(
  slabs: TaxSlab[],
  nonTaxableThresholdStr: string,
  msg: string,
): void {
  const n = parseIncomeTaxAmount(nonTaxableThresholdStr);
  if (n == null) return;
  if (slabs.some((s) => parseIncomeTaxAmount(s.fromAmount) === n)) return;
  for (const s of slabs) {
    const from = parseIncomeTaxAmount(s.fromAmount);
    if (from === n) continue;
    const next: Record<string, string | undefined> = { ...s.errors };
    if (!next.fromAmount) next.fromAmount = msg;
    else if (!next.toAmount) next.toAmount = msg;
    else next.toAmount = `${next.toAmount}; ${msg}`;
    s.errors = next as TaxSlab["errors"];
  }
}

function computeTaxSlabFieldErrors(
  slab: Pick<TaxSlab, "fromAmount" | "toAmount" | "taxPercentage">,
): TaxSlab["errors"] | undefined {
  const errors: TaxSlab["errors"] = {};
  let isValid = true;

  const fromFilled = Boolean(slab.fromAmount?.trim());
  const toFilled = Boolean(slab.toAmount?.trim());
  const taxPercentageFilled = Boolean(slab.taxPercentage?.trim());

  if (!fromFilled && !toFilled && !taxPercentageFilled) return undefined;

  const allFilled = fromFilled && toFilled && taxPercentageFilled;
  if (!allFilled) {
    if (!fromFilled) errors.fromAmount = "Required";
    if (!toFilled) errors.toAmount = "Required";
    if (!taxPercentageFilled) errors.taxPercentage = "Required";
    return errors;
  }

  const from = parseIncomeTaxAmount(slab.fromAmount);
  const to = parseIncomeTaxAmount(slab.toAmount);
  const taxPercentage = parseIncomeTaxAmount(slab.taxPercentage);

  if (from == null || from < 0) {
    errors.fromAmount = "Invalid amount";
    isValid = false;
  }

  if (to == null || to < 0) {
    errors.toAmount = "Invalid amount";
    isValid = false;
  }

  if (from != null && to != null && from >= to) {
    errors.toAmount = "Must be greater than From Amount";
    isValid = false;
  }

  if (taxPercentage == null || taxPercentage < 0 || taxPercentage > 100) {
    errors.taxPercentage = "Tax % must be between 0 and 100";
    isValid = false;
  }

  return isValid ? undefined : errors;
}

function computeSurchargeSlabFieldErrors(
  slab: Pick<SurchargeSlab, "fromAmount" | "toAmount" | "surchargePercentage">,
  minFromAmount: number | null,
  formatMinFromMessage: SurchargeMinFromMessageFormatter,
): SurchargeSlab["errors"] | undefined {
  const errors: SurchargeSlab["errors"] = {};
  let isValid = true;

  const fromFilled = Boolean(slab.fromAmount?.trim());
  const toFilled = Boolean(slab.toAmount?.trim());
  const surchargePercentageFilled = Boolean(slab.surchargePercentage?.trim());

  if (!fromFilled && !toFilled && !surchargePercentageFilled) return undefined;

  const allFilled = fromFilled && toFilled && surchargePercentageFilled;
  if (!allFilled) {
    if (!fromFilled) errors.fromAmount = "Required";
    if (!toFilled) errors.toAmount = "Required";
    if (!surchargePercentageFilled) errors.surchargePercentage = "Required";
    return errors;
  }

  const from = parseIncomeTaxAmount(slab.fromAmount);
  const to = parseIncomeTaxAmount(slab.toAmount);
  const surchargePercentage = parseIncomeTaxAmount(slab.surchargePercentage);

  if (from == null || from < 0) {
    errors.fromAmount = "Invalid amount";
    isValid = false;
  }

  if (to == null || to < 0) {
    errors.toAmount = "Invalid amount";
    isValid = false;
  }

  if (from != null && to != null && from >= to) {
    errors.toAmount = "Must be greater than From Amount";
    isValid = false;
  }

  if (
    minFromAmount != null &&
    from != null &&
    from < minFromAmount
  ) {
    errors.fromAmount = formatMinFromMessage(minFromAmount);
    isValid = false;
  }

  if (
    surchargePercentage == null ||
    surchargePercentage < 0 ||
    surchargePercentage > 100
  ) {
    errors.surchargePercentage = "Surcharge % must be between 0 and 100";
    isValid = false;
  }

  return isValid ? undefined : errors;
}

function applyTaxSlabValidation(
  slabs: TaxSlab[],
  nonTaxableThresholdStr: string,
): TaxSlab[] {
  const next = slabs.map((slab) => {
    const fieldErrors = computeTaxSlabFieldErrors(slab);
    if (fieldErrors) return { ...slab, errors: fieldErrors };
    const { errors: _removed, ...rest } = slab;
    return rest as TaxSlab;
  });
  const overlapIdx = getOverlappingRangeIndices(next, parseIncomeTaxAmount);
  if (overlapIdx.size > 0) {
    applySlabRangeOverlapErrors(next, overlapIdx, TAX_SLAB_OVERLAP_MSG);
  }
  annotateTaxSlabNonTaxableMismatch(next, nonTaxableThresholdStr, TAX_FROM_NON_TAXABLE_MSG);
  return next;
}

function applySurchargeSlabValidation(
  slabs: SurchargeSlab[],
  taxSlabs: readonly TaxSlab[],
  formatMinFromMessage: SurchargeMinFromMessageFormatter,
): SurchargeSlab[] {
  const minFromAmount = getMaxTaxSlabToAmount(taxSlabs);
  const next = slabs.map((slab) => {
    const fieldErrors = computeSurchargeSlabFieldErrors(
      slab,
      minFromAmount,
      formatMinFromMessage,
    );
    if (fieldErrors) return { ...slab, errors: fieldErrors };
    const { errors: _removed, ...rest } = slab;
    return rest as SurchargeSlab;
  });
  const overlapIdx = getOverlappingRangeIndices(next, parseIncomeTaxAmount);
  if (overlapIdx.size > 0) {
    applySlabRangeOverlapErrors(next, overlapIdx, SURCHARGE_SLAB_OVERLAP_MSG);
  }
  return next;
}

function taxSlabsValidationStateEqual(prev: TaxSlab[], next: TaxSlab[]): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((p, i) => {
    const n = next[i];
    return (
      p.fromAmount === n.fromAmount &&
      p.toAmount === n.toAmount &&
      p.taxPercentage === n.taxPercentage &&
      (p.errors?.fromAmount ?? "") === (n.errors?.fromAmount ?? "") &&
      (p.errors?.toAmount ?? "") === (n.errors?.toAmount ?? "") &&
      (p.errors?.taxPercentage ?? "") === (n.errors?.taxPercentage ?? "")
    );
  });
}

function slabHasFieldErrors(
  slabErrors?: TaxSlab["errors"] | SurchargeSlab["errors"],
): boolean {
  return Object.values(slabErrors ?? {}).some((message) => Boolean(message));
}

function surchargeSlabsValidationStateEqual(
  prev: SurchargeSlab[],
  next: SurchargeSlab[],
): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((p, i) => {
    const n = next[i];
    return (
      p.fromAmount === n.fromAmount &&
      p.toAmount === n.toAmount &&
      p.surchargePercentage === n.surchargePercentage &&
      (p.errors?.fromAmount ?? "") === (n.errors?.fromAmount ?? "") &&
      (p.errors?.toAmount ?? "") === (n.errors?.toAmount ?? "") &&
      (p.errors?.surchargePercentage ?? "") === (n.errors?.surchargePercentage ?? "")
    );
  });
}

interface IncomeTaxConfig {
  configName: string;
  nonTaxableThreshold: string;
  enableStandardDeduction: boolean;
  standardDeductionAmount: string;
  enableVersions: boolean;
  versionStartDate: Dayjs | null;
  versionEndDate: Dayjs | null;
  enableCess: boolean;
  cessPercentage: string;
  enableHRA: boolean;
  rebateThresholdIncome: string;
  rebateMaxAmount: string;
  taxSlabs: TaxSlab[];
  surchargeSlabs: SurchargeSlab[];
}

export interface IncomeTaxModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: IncomeTaxConfig) => void;
  /** Called with the backend response message on success (e.g. for snackbar). */
  onSuccess?: (message: string, versionId?: number) => void;
  /** Called with the backend error message on failure */
  onError?: (message: string) => void;
  mode?: "add" | "edit" | "addVersion";
  initialData?: Partial<IncomeTaxConfig>;
  /** When adding a version to an existing config, pass the parent config id. */
  parentConfigId?: number | null;
  /** When in edit mode, the version id to PATCH. Required for update API. */
  editVersionId?: number | null;
  /** When in edit mode, the config id (used to fetch version count; disable "Enable Versions" if more than one version). */
  editConfigId?: number | null;
}

export function IncomeTaxModal({
  open,
  onClose,
  onSave,
  onSuccess,
  onError,
  mode = "add",
  initialData,
  parentConfigId,
  editVersionId,
  editConfigId,
}: IncomeTaxModalProps) {
  // ---------- Header Data for Currency ----------
  const { data: headerData } = useGetHeaderDataQuery();
  const { data: payScheduleResponse } = useGetPayScheduleQuery(undefined, { skip: !open });
  const { data: financialYearsByConfig = [] } = useGetFinancialYearsByConfigQuery(editConfigId!, {
    skip: !open || mode !== "edit" || editConfigId == null,
  });
  const versionCount = financialYearsByConfig.length;
  const hasMultipleVersions = versionCount > 1;
  /** GET /payschedule may return `data` as a single object or an array (legacy). */
  const rawPaySchedule = payScheduleResponse?.data;
  const payScheduleItem =
    rawPaySchedule == null
      ? null
      : Array.isArray(rawPaySchedule)
        ? rawPaySchedule[0] ?? null
        : typeof rawPaySchedule === "object"
          ? rawPaySchedule
          : null;
  const hasPayScheduleData = Boolean(
    payScheduleItem?.financialYearStart != null && payScheduleItem?.financialYearEnd != null,
  );
  const payScheduleStartMonth = parseYyyyMmMonthIndex(payScheduleItem?.financialYearStart);
  const payScheduleEndMonth = parseYyyyMmMonthIndex(payScheduleItem?.financialYearEnd);
  const payScheduleStartReference = parseYyyyMmDayjs(payScheduleItem?.financialYearStart);
  const payScheduleEndReference = parseYyyyMmDayjs(payScheduleItem?.financialYearEnd);
  /** Start/end pickers only allow the pay schedule FY boundary months when schedule data exists. */
  const shouldDisableMonthStart =
    hasPayScheduleData && payScheduleStartMonth != null
      ? (date: Dayjs) => date.month() !== payScheduleStartMonth
      : undefined;
  const shouldDisableMonthEnd =
    hasPayScheduleData && payScheduleEndMonth != null
      ? (date: Dayjs) => date.month() !== payScheduleEndMonth
      : undefined;
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currencySymbol = headerData?.data?.reportingCurrency?.split(" - ")[0] || "₹";

  const formatSurchargeMinFromMessage = useCallback<SurchargeMinFromMessageFormatter>(
    (minFrom) => {
      const formatted = formatCurrencyByCommaSeparation(String(minFrom), commaSeparation);
      return `Surcharge applies on income above regular tax slabs. Your highest tax slab ends at To amount ${currencySymbol}${formatted} — enter From amount of at least ${currencySymbol}${formatted}.`;
    },
    [commaSeparation, currencySymbol],
  );

  const [createIncomeTax, { isLoading: isCreating }] = useCreateIncomeTaxMutation();
  const [updateIncomeTax, { isLoading: isUpdating }] = useUpdateIncomeTaxMutation();

  // ---------- State ----------
  const [configName, setConfigName] = useState("");
  const [nonTaxableThreshold, setNonTaxableThreshold] = useState("");
  const [enableStandardDeduction, setEnableStandardDeduction] = useState(false);
  const [standardDeductionAmount, setStandardDeductionAmount] = useState("");
  const [enableVersions, setEnableVersions] = useState(false);
  const [versionStartDate, setVersionStartDate] = useState<Dayjs | null>(null);
  const [versionEndDate, setVersionEndDate] = useState<Dayjs | null>(null);
  const [enableCess, setEnableCess] = useState(false);
  const [cessPercentage, setCessPercentage] = useState("");
  const [enableHRA, setEnableHRA] = useState(false);
  const [rebateThresholdIncome, setRebateThresholdIncome] = useState("700000");
  const [rebateMaxAmount, setRebateMaxAmount] = useState("25000");
  const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>([{ ...DEFAULT_TAX_SLAB }]);
  const [surchargeSlabs, setSurchargeSlabs] = useState<SurchargeSlab[]>([{ ...DEFAULT_SURCHARGE_SLAB }]);

  // ---------- Display States for Formatting ----------
  // ---------- Validation Errors ----------
  const [errors, setErrors] = useState<{
    cessPercentage?: string;
    financialYear?: string;
  }>({});
  const hasPrefilledVersionFromPayScheduleRef = useRef(false);
  const hasPrefilledEditRef = useRef(false);
  const hasResetAddRef = useRef(false);

  const enableVersionsSwitchDisabled =
    mode === "addVersion" ||
    (mode === "edit" && enableVersions && hasMultipleVersions) ||
    (mode === "add" && !hasPayScheduleData);

  // ---------- Prefill when modal opens (only on open; don't reset on initialData change so failed submit keeps user's edits) ----------
  useEffect(() => {
    if (!open) {
      hasPrefilledEditRef.current = false;
      hasResetAddRef.current = false;
      return;
    }
    if (mode === "edit" && initialData && !hasPrefilledEditRef.current) {
      hasPrefilledEditRef.current = true;
      setConfigName(initialData.configName || "");
      setNonTaxableThreshold(
        parseNumberForTyping(String(initialData.nonTaxableThreshold || ""))
      );
      setEnableStandardDeduction(initialData.enableStandardDeduction || false);
      setStandardDeductionAmount(
        parseIntegerAmountForTyping(String(initialData.standardDeductionAmount || ""))
      );
      setEnableVersions(initialData.enableVersions || false);
      setVersionStartDate(initialData.versionStartDate || null);
      setVersionEndDate(initialData.versionEndDate || null);
      setEnableCess(initialData.enableCess || false);
      setCessPercentage(initialData.cessPercentage || "");
      setEnableHRA(initialData.enableHRA || false);
      setRebateThresholdIncome(
        parseNumberForTyping(String(initialData.rebateThresholdIncome || "700000"))
      );
      setRebateMaxAmount(
        parseIntegerAmountForTyping(String(initialData.rebateMaxAmount || "25000"))
      );
      setTaxSlabs(
        initialData.taxSlabs?.length
          ? initialData.taxSlabs.map((s) => ({
              ...s,
              fromAmount: normalizeSlabAmountString(s.fromAmount),
              toAmount: normalizeSlabAmountString(s.toAmount),
            }))
          : [{ ...DEFAULT_TAX_SLAB }]
      );
      setSurchargeSlabs(
        initialData.surchargeSlabs?.length
          ? initialData.surchargeSlabs.map((s) => ({
              ...s,
              fromAmount: normalizeSlabAmountString(s.fromAmount),
              toAmount: normalizeSlabAmountString(s.toAmount),
            }))
          : [{ ...DEFAULT_SURCHARGE_SLAB }]
      );
    } else if (mode === "addVersion" && initialData) {
        setConfigName(initialData.configName ?? "");
        setNonTaxableThreshold(
          parseNumberForTyping(String(initialData.nonTaxableThreshold || ""))
        );
        setEnableStandardDeduction(initialData.enableStandardDeduction || false);
        setStandardDeductionAmount(
          parseIntegerAmountForTyping(String(initialData.standardDeductionAmount || ""))
        );
        setEnableVersions(true);
        const start = initialData.versionStartDate || null;
        setVersionStartDate(start);
        setVersionEndDate(start ? start.add(11, "month") : null);
        setEnableCess(initialData.enableCess || false);
        setCessPercentage(initialData.cessPercentage || "");
        setEnableHRA(initialData.enableHRA ?? false);
        setRebateThresholdIncome(
          parseNumberForTyping(String(initialData.rebateThresholdIncome || "700000"))
        );
        setRebateMaxAmount(
          parseIntegerAmountForTyping(String(initialData.rebateMaxAmount || "25000"))
        );
        setTaxSlabs(
          initialData.taxSlabs?.length
            ? initialData.taxSlabs.map((s) => ({
                ...s,
                fromAmount: normalizeSlabAmountString(s.fromAmount),
                toAmount: normalizeSlabAmountString(s.toAmount),
              }))
            : [{ ...DEFAULT_TAX_SLAB }]
        );
        setSurchargeSlabs(
          initialData.surchargeSlabs?.length
            ? initialData.surchargeSlabs.map((s) => ({
                ...s,
                fromAmount: normalizeSlabAmountString(s.fromAmount),
                toAmount: normalizeSlabAmountString(s.toAmount),
              }))
            : [{ ...DEFAULT_SURCHARGE_SLAB }]
        );
    } else if (mode === "add" && !hasResetAddRef.current) {
      hasResetAddRef.current = true;
      setConfigName("");
      setNonTaxableThreshold("");
      setEnableStandardDeduction(false);
      setStandardDeductionAmount("");
      setEnableVersions(false);
      setVersionStartDate(null);
      setVersionEndDate(null);
      setEnableCess(false);
      setCessPercentage("");
      setEnableHRA(false);
      setRebateThresholdIncome("700000");
      setRebateMaxAmount("25000");
      setTaxSlabs([{ ...DEFAULT_TAX_SLAB }]);
      setSurchargeSlabs([{ ...DEFAULT_SURCHARGE_SLAB }]);
    }
    if (open) setErrors({});
  }, [mode, initialData, open, commaSeparation]);

  // addVersion: whenever start financial year changes, prefill end to start + 11 months (12-month span)
  useEffect(() => {
    if (mode === "addVersion" && versionStartDate) {
      setVersionEndDate(versionStartDate.add(11, "month"));
    }
  }, [mode, versionStartDate]);

  // Show financial year error when start/end don't span exactly 12 months (addVersion or enableVersions)
  const mustValidateFinancialYear =
    mode === "addVersion" || (enableVersions && (mode === "add" || mode === "edit"));
  useEffect(() => {
    if (!mustValidateFinancialYear) {
      setErrors((prev) => ({ ...prev, financialYear: undefined }));
      return;
    }
    if (!versionStartDate || !versionEndDate) {
      setErrors((prev) => ({ ...prev, financialYear: undefined }));
      return;
    }
    const expectedEnd = versionStartDate.add(11, "month");
    const isTwelveMonths = versionEndDate.isSame(expectedEnd, "month");
    if (!isTwelveMonths) {
      setErrors((prev) => ({
        ...prev,
        financialYear: "Financial year must span exactly 12 months (e.g. Apr 2024 – Mar 2025).",
      }));
    } else {
      setErrors((prev) => ({ ...prev, financialYear: undefined }));
    }
  }, [mustValidateFinancialYear, versionStartDate, versionEndDate]);

  // When versions are enabled, prefill missing start/end from pay schedule FY boundaries.
  useEffect(() => {
    if (!open) {
      hasPrefilledVersionFromPayScheduleRef.current = false;
      return;
    }
    if (
      (mode === "add" || mode === "edit") &&
      enableVersions &&
      !hasPrefilledVersionFromPayScheduleRef.current &&
      payScheduleItem?.financialYearStart != null &&
      payScheduleItem?.financialYearEnd != null
    ) {
      const start = parseYyyyMmDayjs(payScheduleItem.financialYearStart);
      const end = parseYyyyMmDayjs(payScheduleItem.financialYearEnd);
      if (start && end) {
        setVersionStartDate((current) => current ?? start);
        setVersionEndDate((current) => current ?? end);
        hasPrefilledVersionFromPayScheduleRef.current = true;
      }
    }
    if (!enableVersions) hasPrefilledVersionFromPayScheduleRef.current = false;
  }, [open, mode, enableVersions, payScheduleItem]);

  // Ensure at least one row in Tax Slabs and Surcharge Slabs when modal is open (safety for first paint)
  useEffect(() => {
    if (!open) return;
    setTaxSlabs((prev) => (prev.length === 0 ? [{ ...DEFAULT_TAX_SLAB }] : prev));
    setSurchargeSlabs((prev) => (prev.length === 0 ? [{ ...DEFAULT_SURCHARGE_SLAB }] : prev));
  }, [open]);

  // ---------- Edit mode: detect if form has changed (for disabling Save until dirty) ----------
  const formSnapshot = useMemo(() => {
    const slab = (s: TaxSlab) => ({ fromAmount: s.fromAmount, toAmount: s.toAmount, taxPercentage: s.taxPercentage });
    const surcharge = (s: SurchargeSlab) => ({ fromAmount: s.fromAmount, toAmount: s.toAmount, surchargePercentage: s.surchargePercentage });
    return JSON.stringify({
      configName,
      nonTaxableThreshold,
      enableStandardDeduction,
      standardDeductionAmount,
      enableVersions,
      versionStartDate: versionStartDate?.format("YYYY-MM") ?? null,
      versionEndDate: versionEndDate?.format("YYYY-MM") ?? null,
      enableCess,
      cessPercentage,
      enableHRA,
      rebateThresholdIncome,
      rebateMaxAmount,
      taxSlabs: taxSlabs.map(slab),
      surchargeSlabs: surchargeSlabs.map(surcharge),
    });
  }, [
    configName,
    nonTaxableThreshold,
    enableStandardDeduction,
    standardDeductionAmount,
    enableVersions,
    versionStartDate,
    versionEndDate,
    enableCess,
    cessPercentage,
    enableHRA,
    rebateThresholdIncome,
    rebateMaxAmount,
    taxSlabs,
    surchargeSlabs,
  ]);

  const initialSnapshot = useMemo(() => {
    if (!initialData) return null;
    const slab = (s: TaxSlab) => ({ fromAmount: s.fromAmount, toAmount: s.toAmount, taxPercentage: s.taxPercentage });
    const surcharge = (s: SurchargeSlab) => ({ fromAmount: s.fromAmount, toAmount: s.toAmount, surchargePercentage: s.surchargePercentage });
    return JSON.stringify({
      configName: initialData.configName ?? "",
      nonTaxableThreshold: String(initialData.nonTaxableThreshold ?? ""),
      enableStandardDeduction: initialData.enableStandardDeduction ?? false,
      standardDeductionAmount: String(initialData.standardDeductionAmount ?? ""),
      enableVersions: initialData.enableVersions ?? false,
      versionStartDate: initialData.versionStartDate?.format("YYYY-MM") ?? null,
      versionEndDate: initialData.versionEndDate?.format("YYYY-MM") ?? null,
      enableCess: initialData.enableCess ?? false,
      cessPercentage: String(initialData.cessPercentage ?? ""),
      enableHRA: initialData.enableHRA ?? false,
      rebateThresholdIncome: String(initialData.rebateThresholdIncome ?? "700000"),
      rebateMaxAmount: String(initialData.rebateMaxAmount ?? "25000"),
      taxSlabs: (initialData.taxSlabs ?? []).map(slab),
      surchargeSlabs: (initialData.surchargeSlabs ?? []).map(surcharge),
    });
  }, [initialData]);

  const isDirty = useMemo(
    () => mode === "edit" && initialSnapshot != null && formSnapshot !== initialSnapshot,
    [mode, formSnapshot, initialSnapshot],
  );

  const taxSlabValuesKey = useMemo(
    () =>
      taxSlabs
        .map((s) => [s.fromAmount, s.toAmount, s.taxPercentage].join("\u001f"))
        .join("\u001e"),
    [taxSlabs],
  );

  const surchargeSlabValuesKey = useMemo(
    () =>
      surchargeSlabs
        .map((s) => [s.fromAmount, s.toAmount, s.surchargePercentage].join("\u001f"))
        .join("\u001e"),
    [surchargeSlabs],
  );

  /** Re-run slab validation when values change (not only on from/to blur). */
  useEffect(() => {
    setTaxSlabs((prev) => {
      const next = applyTaxSlabValidation(prev, nonTaxableThreshold);
      if (taxSlabsValidationStateEqual(prev, next)) return prev;
      return next;
    });
  }, [taxSlabValuesKey, nonTaxableThreshold]);

  useEffect(() => {
    setSurchargeSlabs((prev) => {
      const next = applySurchargeSlabValidation(
        prev,
        taxSlabs,
        formatSurchargeMinFromMessage,
      );
      if (surchargeSlabsValidationStateEqual(prev, next)) return prev;
      return next;
    });
  }, [surchargeSlabValuesKey, taxSlabValuesKey, formatSurchargeMinFromMessage]);

  const syncTaxSlabRangeBlur = () => {
    setTaxSlabs((prev) => applyTaxSlabValidation(prev, nonTaxableThreshold));
  };

  const syncSurchargeSlabRangeBlur = () => {
    setSurchargeSlabs((prev) =>
      applySurchargeSlabValidation(prev, taxSlabs, formatSurchargeMinFromMessage),
    );
  };

  // ---------- Handle Cess Change with Validation ----------
  const handleCessChange = (value: string) => {
    setCessPercentage(value);
    setErrors((prev) => ({ ...prev, cessPercentage: undefined }));
  };

  // ---------- Build Create DTO for API ----------
  const buildCreateDto = (): CreateIncomeTaxDto => {
    const isAddVersion = mode === "addVersion";
    const dto: CreateIncomeTaxDto = {
      configName: configName.trim(),
      isVersionEnabled: isAddVersion ? true : enableVersions,
      financialYearStart:
        (isAddVersion || enableVersions) && versionStartDate ? versionStartDate.format("YYYY-MM") : null,
      financialYearEnd:
        (isAddVersion || enableVersions) && versionEndDate ? versionEndDate.format("YYYY-MM") : null,
      nonTaxableAmount: parseIncomeTaxAmount(nonTaxableThreshold) ?? null,
      rangeData: taxSlabs
        .filter((s) => s.fromAmount || s.toAmount || s.taxPercentage)
        .map((s) => ({
          from: Math.trunc(parseIncomeTaxAmount(s.fromAmount) ?? 0),
          to: Math.trunc(parseIncomeTaxAmount(s.toAmount) ?? 0),
          tax: parseIncomeTaxAmount(s.taxPercentage) ?? 0,
        })),
      surchargeSlab: surchargeSlabs
        .filter((s) => s.fromAmount || s.toAmount || s.surchargePercentage)
        .map((s) => ({
          from: Math.trunc(parseIncomeTaxAmount(s.fromAmount) ?? 0),
          to: Math.trunc(parseIncomeTaxAmount(s.toAmount) ?? 0),
          tax: parseIncomeTaxAmount(s.surchargePercentage) ?? 0,
        })),
      isStandardDeductionEnabled: enableStandardDeduction,
      isCessEnabled: enableCess,
      standardDeduction: enableStandardDeduction
        ? Math.trunc(parseIncomeTaxAmount(standardDeductionAmount) ?? 0)
        : 0,
      cess: enableCess ? parseIncomeTaxAmount(cessPercentage) ?? 0 : 0,
      isHraEnabled: enableHRA,
      taxableIncomeThreshold: parseIncomeTaxAmount(rebateThresholdIncome) ?? 0,
      rebateAmount: Math.trunc(parseIncomeTaxAmount(rebateMaxAmount) ?? 0),
    };
    if (parentConfigId != null) dto.parentConfigId = parentConfigId;
    return dto;
  };

  // ---------- Validate All Before Save ----------
  const validateAll = (): boolean => {
    let isValid = true;

    const updatedTaxSlabs = applyTaxSlabValidation(taxSlabs, nonTaxableThreshold);
    if (updatedTaxSlabs.some((slab) => slabHasFieldErrors(slab.errors))) {
      isValid = false;
    }
    setTaxSlabs(updatedTaxSlabs);

    const updatedSurchargeSlabs = applySurchargeSlabValidation(
      surchargeSlabs,
      updatedTaxSlabs,
      formatSurchargeMinFromMessage,
    );
    if (updatedSurchargeSlabs.some((slab) => slabHasFieldErrors(slab.errors))) {
      isValid = false;
    }
    setSurchargeSlabs(updatedSurchargeSlabs);

    // When versions are enabled (add, edit, or addVersion): start and end must span exactly 12 months
    const mustValidateFinancialYear =
      mode === "addVersion" || (enableVersions && (mode === "add" || mode === "edit"));
    if (mustValidateFinancialYear) {
      if (!versionStartDate || !versionEndDate) {
        const msg = "Start and end financial year are required";
        setErrors((prev) => ({ ...prev, financialYear: msg }));
        onError?.(msg);
        isValid = false;
      } else {
        const expectedEnd = versionStartDate.add(11, "month");
        const isTwelveMonths = versionEndDate.isSame(expectedEnd, "month");
        if (!isTwelveMonths) {
          const msg = "Start and end must span exactly 12 months (e.g. Apr 2024 – Mar 2025 or Jan 2024 – Dec 2024)";
          setErrors((prev) => ({ ...prev, financialYear: msg }));
          onError?.(msg);
          isValid = false;
        } else {
          setErrors((prev) => ({ ...prev, financialYear: undefined }));
        }
      }
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateAll()) return;

    if (mode === "add" || mode === "addVersion") {
      try {
        const result = await createIncomeTax(buildCreateDto()).unwrap();
        const message =
          result?.message ??
          (mode === "addVersion" ? "Version added successfully." : "Income Tax created successfully.");
        onSuccess?.(message, result?.data?.id);
        onClose();
      } catch (err: any) {
        const raw =
          err?.data?.message ?? err?.message ?? (mode === "addVersion" ? "Failed to add version." : "Failed to create Income Tax configuration.");
        const message = Array.isArray(raw) ? raw.join(" ") : String(raw);
        onError?.(message);
      }
      return;
    }

    if (mode === "edit" && editVersionId != null) {
      try {
        const result = await updateIncomeTax({
          id: editVersionId,
          dto: buildCreateDto(),
        }).unwrap();
        const message = result?.message ?? "Income Tax updated successfully.";
        onSuccess?.(message);
        onClose();
      } catch (err: any) {
        const raw =
          err?.data?.message ?? err?.message ?? "Failed to update Income Tax configuration.";
        const message = Array.isArray(raw) ? raw.join(" ") : String(raw);
        onError?.(message);
      }
      return;
    }

    onSave?.({
      configName,
      nonTaxableThreshold,
      enableStandardDeduction,
      standardDeductionAmount,
      enableVersions,
      versionStartDate,
      versionEndDate,
      enableCess,
      cessPercentage,
      enableHRA,
      rebateThresholdIncome,
      rebateMaxAmount,
      taxSlabs: taxSlabs.map(({ errors, ...slab }) => slab),
      surchargeSlabs: surchargeSlabs.map(({ errors, ...slab }) => slab),
    });
    onClose();
  };

  const isValid = configName.trim().length > 0 && nonTaxableThreshold.trim().length > 0;
  const addVersionValid = isValid && (mode !== "addVersion" || (!!versionStartDate && !!versionEndDate));
  const slabRowHasIncompleteRequiredGroup = (from: string, to: string, rate: string) => {
    const fromFilled = Boolean(from?.trim());
    const toFilled = Boolean(to?.trim());
    const rateFilled = Boolean(rate?.trim());
    const anyFilled = fromFilled || toFilled || rateFilled;
    const allFilled = fromFilled && toFilled && rateFilled;
    return anyFilled && !allFilled;
  };
  const hasTaxSlabRows = taxSlabs.length > 0;
  const hasSurchargeSlabRows = surchargeSlabs.length > 0;
  const hasConfiguredTaxSlab = taxSlabs.some((s) =>
    slabRowHasAnyValue(s.fromAmount, s.toAmount, s.taxPercentage),
  );
  const hasConfiguredSurchargeSlab = surchargeSlabs.some((s) =>
    slabRowHasAnyValue(s.fromAmount, s.toAmount, s.surchargePercentage),
  );
  const hasIncompleteTaxSlabRow = taxSlabs.some((s) =>
    slabRowHasIncompleteRequiredGroup(s.fromAmount, s.toAmount, s.taxPercentage),
  );
  const hasIncompleteSurchargeSlabRow = surchargeSlabs.some((s) =>
    slabRowHasIncompleteRequiredGroup(s.fromAmount, s.toAmount, s.surchargePercentage),
  );
  const slabsRequirementMet =
    hasTaxSlabRows &&
    hasSurchargeSlabRows &&
    hasConfiguredTaxSlab &&
    hasConfiguredSurchargeSlab;
  const nonTaxableNumForFromRule = parseIncomeTaxAmount(nonTaxableThreshold);
  const taxSlabFromMatchesNonTaxable =
    nonTaxableNumForFromRule == null ||
    taxSlabs.some((s) => parseIncomeTaxAmount(s.fromAmount) === nonTaxableNumForFromRule);
  const validatedTaxSlabs = useMemo(
    () => applyTaxSlabValidation(taxSlabs, nonTaxableThreshold),
    [taxSlabValuesKey, nonTaxableThreshold],
  );
  const validatedSurchargeSlabs = useMemo(
    () =>
      applySurchargeSlabValidation(
        surchargeSlabs,
        taxSlabs,
        formatSurchargeMinFromMessage,
      ),
    [surchargeSlabValuesKey, taxSlabValuesKey, formatSurchargeMinFromMessage],
  );
  const collectUniqueSlabFieldErrorMessages = (
    slabs: readonly (TaxSlab | SurchargeSlab)[],
  ): string[] => {
    const seen = new Set<string>();
    const messages: string[] = [];
    slabs.forEach((slab) => {
      Object.values(slab.errors ?? {}).forEach((message) => {
        if (!message || seen.has(message)) return;
        seen.add(message);
        messages.push(message);
      });
    });
    return messages;
  };
  const hasTaxSlabValidationErrors = validatedTaxSlabs.some((slab) =>
    slabHasFieldErrors(slab.errors),
  );
  const hasSurchargeSlabValidationErrors = validatedSurchargeSlabs.some((slab) =>
    slabHasFieldErrors(slab.errors),
  );
  const isSaveDisabled =
    !isValid ||
    (mode === "addVersion" && !addVersionValid) ||
    (mode === "add" && isCreating) ||
    (mode === "addVersion" && isCreating) ||
    (mode === "edit" && (isUpdating || !isDirty)) ||
    (mustValidateFinancialYear && !!errors.financialYear) ||
    !slabsRequirementMet ||
    hasIncompleteTaxSlabRow ||
    hasIncompleteSurchargeSlabRow ||
    !taxSlabFromMatchesNonTaxable ||
    hasTaxSlabValidationErrors ||
    hasSurchargeSlabValidationErrors;

  const saveDisabledActionTooltip = useMemo(() => {
    if (!isSaveDisabled) return undefined;
    const reasons: string[] = [];
    if (!configName.trim()) reasons.push("Configuration name is required.");
    if (!nonTaxableThreshold.trim()) reasons.push("Non-taxable threshold is required.");
    if (mode === "addVersion" && configName.trim() && nonTaxableThreshold.trim()) {
      if (!versionStartDate || !versionEndDate) {
        reasons.push("Start and end financial year are required.");
      }
    }
    if (mode === "add" && isCreating) reasons.push("Save is in progress.");
    if (mode === "addVersion" && isCreating) reasons.push("Save is in progress.");
    if (mode === "edit" && isUpdating) reasons.push("Save is in progress.");
    if (mode === "edit" && !isDirty) reasons.push("Make a change before saving.");
    if (mustValidateFinancialYear && errors.financialYear) {
      reasons.push(errors.financialYear);
    }
    if (!hasTaxSlabRows) {
      reasons.push("At least one tax slab row is needed.");
    } else if (!hasConfiguredTaxSlab) {
      reasons.push("At least one tax slab row is needed.");
    }
    if (!hasSurchargeSlabRows) {
      reasons.push("At least one surcharge slab row is needed.");
    } else if (!hasConfiguredSurchargeSlab) {
      reasons.push("At least one surcharge slab row is needed.");
    }
    if (hasIncompleteTaxSlabRow) {
      reasons.push(
        "For each tax slab row, fill From Amount, To Amount and Tax Percentage.",
      );
    }
    if (hasIncompleteSurchargeSlabRow) {
      reasons.push(
        "For each surcharge slab row, fill From Amount, To Amount and Surcharge Percentage.",
      );
    }
    if (nonTaxableNumForFromRule != null && !taxSlabFromMatchesNonTaxable) {
      reasons.push(TAX_FROM_NON_TAXABLE_MSG);
    }
    collectUniqueSlabFieldErrorMessages(validatedTaxSlabs).forEach((message) =>
      reasons.push(message),
    );
    collectUniqueSlabFieldErrorMessages(validatedSurchargeSlabs).forEach((message) =>
      reasons.push(message),
    );
    if (reasons.length === 0) {
      return "Save is disabled.";
    }
    return (
      <Stack component="ul" sx={{ m: 0, pl: 2, py: 0 }} spacing={0.5}>
        {reasons.map((text, i) => (
          <Typography key={i} component="li" variant="body2" sx={{ display: "list-item" }}>
            {text}
          </Typography>
        ))}
      </Stack>
    );
  }, [
    isSaveDisabled,
    configName,
    nonTaxableThreshold,
    mode,
    versionStartDate,
    versionEndDate,
    isCreating,
    isUpdating,
    isDirty,
    mustValidateFinancialYear,
    errors.financialYear,
    hasTaxSlabRows,
    hasSurchargeSlabRows,
    hasConfiguredTaxSlab,
    hasConfiguredSurchargeSlab,
    hasIncompleteTaxSlabRow,
    hasIncompleteSurchargeSlabRow,
    nonTaxableNumForFromRule,
    taxSlabFromMatchesNonTaxable,
    validatedTaxSlabs,
    validatedSurchargeSlabs,
  ]);

  const isEditWaitingForData = open && mode === "edit" && !initialData;
  const isAddVersionWaitingForData = open && mode === "addVersion" && !initialData?.configName;

  return (
    <ModalElement
      open={open}
      title={
        mode === "edit"
          ? "Edit Income Tax Configuration"
          : mode === "addVersion"
            ? "Add Version"
            : "Add Income Tax Configuration"
      }
      onClose={onClose}
      onClick={handleSave}
      maxWidth="lg"
      height="auto"
      disabled={isSaveDisabled}
      disabledActionTooltip={saveDisabledActionTooltip}
    >
      {(isEditWaitingForData || isAddVersionWaitingForData) ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 280,
            py: 4,
          }}
        >
          <CustomCircularProgress size={32} />
        </Box>
      ) : (
      <Stack
        spacing={3.5}
        sx={{
          py: 1,
          "& input[type=number]": { MozAppearance: "textfield" },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            { WebkitAppearance: "none", margin: 0 },
        }}
      >
        {/* ---------- Basic Configuration Section ---------- */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
            sx={{ mb: 1.5 }}
          >
            Basic Configuration
          </Typography>

          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Box sx={{ flex: "1 1 45%", minWidth: "250px" }}>
                <TextFieldElement
                  label="Configuration Name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., FY 2024-25 Old Regime"
                  required
                  fullWidth
                  disabled={mode === "addVersion"}
                  helperText={mode === "addVersion" ? "Inherited from parent configuration" : "Unique name to identify this tax configuration"}
                />
              </Box>
              <Box sx={{ flex: "1 1 45%", minWidth: "250px" }}>
                <TextFieldElement
                  label="Non-Taxable Threshold"
                  value={formatNumberForTyping(nonTaxableThreshold, commaSeparation)}
                  onChange={(e) =>
                    setNonTaxableThreshold(parseNumberForTyping(e.target.value))
                  }
                  onBlur={syncTaxSlabRangeBlur}
                  placeholder="e.g., 250000"
                  required
                  fullWidth
                  helperText="Income below this amount is not taxed"
                  slotProps={{
                    ...rightAlignedAmountInputSlotProps,
                    input: {
                      startAdornment: (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          {currencySymbol}
                        </Typography>
                      ),
                    },
                  }}
                />
              </Box>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* ---------- Optional Features: switch – corresponding control per row ---------- */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
            sx={{ mb: 1.5 }}
          >
            Optional Features
          </Typography>

          <Stack spacing={2}>
            {/* Left column fixed width so right-side controls align in a straight line */}
            {/* Row 1: Switch – Standard Deduction Amount (text field) */}
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box sx={{ width: 240, flexShrink: 0 }}>
                <ToggleSwitch
                  label="Enable Standard Deduction"
                  size="small"
                  checked={enableStandardDeduction}
                  onChange={(e) => setEnableStandardDeduction(e.target.checked)}
                />
              </Box>
              {enableStandardDeduction && (
                <Box sx={{ width: 200 }}>
                  <TextFieldElement
                    label="Standard Deduction Amount"
                    value={formatNumberForTyping(standardDeductionAmount, commaSeparation)}
                    onChange={(e) =>
                      setStandardDeductionAmount(parseIntegerAmountForTyping(e.target.value))
                    }
                    placeholder="e.g., 50000"
                    width="200px"
                    helperText="Fixed deduction from gross salary"
                    slotProps={{
                      ...rightAlignedAmountInputSlotProps,
                      input: {
                        startAdornment: (
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                            {currencySymbol}
                          </Typography>
                        ),
                      },
                    }}
                  />
                </Box>
              )}
            </Stack>

            {/* Row 2: Switch – Cess Percentage (text field) */}
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box sx={{ width: 240, flexShrink: 0 }}>
                <ToggleSwitch
                  label="Enable Cess"
                  size="small"
                  checked={enableCess}
                  onChange={(e) => setEnableCess(e.target.checked)}
                />
              </Box>
              {enableCess && (
                <Box sx={{ width: 200 }}>
                  <TextFieldElement
                    label="Cess Percentage"
                    value={formatNumberForTyping(cessPercentage, commaSeparation)}
                    onChange={(e) => {
                      const val = parseNumberForTyping(e.target.value);
                      if (Number(val) > 100) return;
                      handleCessChange(val);
                    }}
                    type="text"
                    placeholder="e.g., 4"
                    width="200px"
                    error={!!errors.cessPercentage}
                    helperText={errors.cessPercentage || "Additional cess (0-100)"}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <Typography variant="body2" color="text.secondary">
                            %
                          </Typography>
                        ),
                      },
                    }}
                  />
                </Box>
              )}
            </Stack>

            {/* Row 3: Switch – Financial Year (date pickers) */}
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box sx={{ width: 240, flexShrink: 0 }}>
                <Tooltip
                  title={
                    mode === "add" && !hasPayScheduleData
                      ? "Add a pay schedule first to enable versions."
                      : ""
                  }
                >
                  <span style={{ display: "inline-flex" }}>
                    <ToggleSwitch
                      label="Enable Versions"
                      size="small"
                      checked={enableVersions}
                      onChange={(e) => setEnableVersions(e.target.checked)}
                      disabled={enableVersionsSwitchDisabled}
                    />
                  </span>
                </Tooltip>
              </Box>
              {(enableVersions || mode === "addVersion") && (
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <MonthYearPickerElement
                    label="Start Financial Year"
                    value={versionStartDate}
                    onChange={setVersionStartDate}
                    width="200px"
                    shouldDisableMonth={shouldDisableMonthStart}
                    referenceDate={versionStartDate ?? payScheduleStartReference ?? undefined}
                  />
                  <MonthYearPickerElement
                    label="End Financial Year"
                    value={versionEndDate}
                    onChange={setVersionEndDate}
                    width="200px"
                    shouldDisableMonth={shouldDisableMonthEnd}
                    referenceDate={versionEndDate ?? payScheduleEndReference ?? undefined}
                    error={!!errors.financialYear}
                    helperText={errors.financialYear}
                  />
                </Stack>
              )}
            </Stack>

            {/* Row 4: Switch only (HRA – no right-side control, so switch can use more space) */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ minWidth: 240, flex: 1, maxWidth: 480 }}>
                <ToggleSwitch
                  label="Enable HRA (House Rent Allowance)"
                  size="small"
                  checked={enableHRA}
                  onChange={(e) => setEnableHRA(e.target.checked)}
                />
              </Box>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* ---------- Rebate Configuration (independent of HRA) ---------- */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
            sx={{ mb: 0.5 }}
          >
            Rebate Configuration
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            If taxable income is less than {currencySymbol}{" "}
            <Box component="span" sx={{ fontWeight: 600, color: "primary.main" }}>
              {rebateThresholdIncome
                ? formatCurrencyByCommaSeparation(rebateThresholdIncome, commaSeparation)
                : "______"}
            </Box>
            , tax rebate of a maximum of {currencySymbol}{" "}
            <Box component="span" sx={{ fontWeight: 600, color: "primary.main" }}>
              {rebateMaxAmount
                ? formatCurrencyByCommaSeparation(rebateMaxAmount, commaSeparation)
                : "______"}
            </Box>{" "}
            is provided under Section 87A.
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Box sx={{ flex: "1 1 45%", minWidth: "250px" }}>
              <TextFieldElement
                label="Rebate Threshold Income"
                value={formatNumberForTyping(rebateThresholdIncome, commaSeparation)}
                onChange={(e) =>
                  setRebateThresholdIncome(parseNumberForTyping(e.target.value))
                }
                fullWidth
                slotProps={{
                  ...rightAlignedAmountInputSlotProps,
                  input: {
                    startAdornment: (
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                        {currencySymbol}
                      </Typography>
                    ),
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: "1 1 45%", minWidth: "250px" }}>
              <TextFieldElement
                label="Maximum Rebate Amount"
                value={formatNumberForTyping(rebateMaxAmount, commaSeparation)}
                onChange={(e) =>
                  setRebateMaxAmount(parseIntegerAmountForTyping(e.target.value))
                }
                fullWidth
                slotProps={{
                  ...rightAlignedAmountInputSlotProps,
                  input: {
                    startAdornment: (
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                        {currencySymbol}
                      </Typography>
                    ),
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Divider />

        {/* ---------- Tax Slabs Section ---------- */}
        <Box>
          <RepeaterElement<TaxSlab>
            label="Tax Slabs"
            minItems={1}
            items={taxSlabs}
            setItems={setTaxSlabs}
            initialItem={{ fromAmount: "", toAmount: "", taxPercentage: "" }}
            renderItem={(item, _index, handleChange) => (
              <>
                <TextFieldElement
                  label="From Amount"
                  value={formatNumberForTyping(item.fromAmount, commaSeparation)}
                  onChange={(e) =>
                    handleChange("fromAmount", parseIntegerAmountForTyping(e.target.value))
                  }
                  onBlur={syncTaxSlabRangeBlur}
                  placeholder="0"
                  width="30%"
                  error={!!item.errors?.fromAmount}
                  helperText={item.errors?.fromAmount}
                  slotProps={{
                    ...rightAlignedAmountInputSlotProps,
                    input: {
                      startAdornment: (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          {currencySymbol}
                        </Typography>
                      ),
                    },
                  }}
                />
                <TextFieldElement
                  label="To Amount"
                  value={formatNumberForTyping(item.toAmount, commaSeparation)}
                  onChange={(e) =>
                    handleChange("toAmount", parseIntegerAmountForTyping(e.target.value))
                  }
                  onBlur={syncTaxSlabRangeBlur}
                  placeholder="250000"
                  width="30%"
                  error={!!item.errors?.toAmount}
                  helperText={item.errors?.toAmount}
                  slotProps={{
                    ...rightAlignedAmountInputSlotProps,
                    input: {
                      startAdornment: (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          {currencySymbol}
                        </Typography>
                      ),
                    },
                  }}
                />
                <TextFieldElement
                  label="Tax Percentage"
                  value={formatNumberForTyping(item.taxPercentage, commaSeparation)}
                  onChange={(e) => {
                    const val = parseNumberForTyping(e.target.value);
                    // prevent values > 100
                    if (Number(val) > 100) return;
                    handleChange("taxPercentage", val);
                  }}
                  onBlur={syncTaxSlabRangeBlur}
                  type="text"
                  placeholder="0"
                  required={true}
                  width="30%"
                  error={!!item.errors?.taxPercentage}
                  helperText={item.errors?.taxPercentage}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Typography variant="body2" color="text.secondary">
                          %
                        </Typography>
                      ),
                    },
                  }}
                />
              </>
            )}
            gap={2}
            boxed={false}
          />
        </Box>

        <Divider />

        {/* ---------- Surcharge Slabs Section ---------- */}
        <Box>
          <RepeaterElement<SurchargeSlab>
            label="Surcharge Slabs"
            items={surchargeSlabs}
            setItems={setSurchargeSlabs}
            minItems={1}
            initialItem={{ fromAmount: "", toAmount: "", surchargePercentage: "" }}
            renderItem={(item, _index, handleChange) => (
              <>
                <TextFieldElement
                  label="From Amount"
                  value={formatNumberForTyping(item.fromAmount, commaSeparation)}
                  onChange={(e) =>
                    handleChange("fromAmount", parseIntegerAmountForTyping(e.target.value))
                  }
                  onBlur={syncSurchargeSlabRangeBlur}
                  placeholder="5000000"
                  width="30%"
                  error={!!item.errors?.fromAmount}
                  helperText={item.errors?.fromAmount}
                  slotProps={{
                    ...rightAlignedAmountInputSlotProps,
                    input: {
                      startAdornment: (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          {currencySymbol}
                        </Typography>
                      ),
                    },
                  }}
                />
                <TextFieldElement
                  label="To Amount"
                  value={formatNumberForTyping(item.toAmount, commaSeparation)}
                  onChange={(e) =>
                    handleChange("toAmount", parseIntegerAmountForTyping(e.target.value))
                  }
                  onBlur={syncSurchargeSlabRangeBlur}
                  placeholder="10000000"
                  width="30%"
                  error={!!item.errors?.toAmount}
                  helperText={item.errors?.toAmount}
                  slotProps={{
                    ...rightAlignedAmountInputSlotProps,
                    input: {
                      startAdornment: (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          {currencySymbol}
                        </Typography>
                      ),
                    },
                  }}
                />
                <TextFieldElement
                  label="Surcharge Percentage"
                  value={formatNumberForTyping(item.surchargePercentage, commaSeparation)}
                  onChange={(e) => {
                    const val = parseNumberForTyping(e.target.value);
                    // prevent values > 100
                    if (Number(val) > 100) return;
                    handleChange("surchargePercentage", val);
                  }}
                  onBlur={syncSurchargeSlabRangeBlur}
                  type="text"
                  placeholder="10"
                  width="30%"
                  required={true}
                  error={!!item.errors?.surchargePercentage}
                  helperText={item.errors?.surchargePercentage}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Typography variant="body2" color="text.secondary">
                          %
                        </Typography>
                      ),
                    },
                  }}
                />
              </>
            )}
            gap={2}
            boxed={false}
          />
        </Box>

      </Stack>
      )}
    </ModalElement>
  );
}