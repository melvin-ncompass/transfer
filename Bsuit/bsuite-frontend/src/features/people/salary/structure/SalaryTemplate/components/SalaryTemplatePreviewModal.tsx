import {
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from "@mui/material";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton, SecondaryButton } from "../../../../../../components/atom/button";
import { useGetSalaryTemplateByIdQuery } from "../api/salaryTemplate.api";
import type { SalaryTemplateDetail } from "../api/salaryTemplate.api";
import { withPayrollDeductionsIfPresent } from "./salaryTemplatePreviewUtils";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import {
  formatCurrencyByCommaSeparation,
  formatNumberByCommaSeparation,
  formatNumberForTyping,
  parseNumberByCommaSeparation,
  parseNumberForTyping,
} from "../../../../../../utils/numberFormatter";

export interface SalaryPreviewInitialOverrides {
  annualGross: number;
  recalculated: RecalculatedAmounts;
}

interface SalaryTemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
  templateDetail?: SalaryTemplateDetail | null;
  /** Catalog template from GET /salary-templates (same id as initialTemplate) for revert */
  catalogTemplateDetail?: SalaryTemplateDetail | null;
  /** Show revert when employee earnings differ from catalog template structure */
  showEarningsRevert?: boolean;
  /** Catalog applied without gross override — parent sends minimal payroll on employee save */
  onSaveCatalogTemplate?: () => void;
  /** Gross overridden via Update — parent sends full payroll with earnings/deductions */
  onUpdatePayload?: (payload: SalaryPreviewPayload) => void;
  initialOverrides?: SalaryPreviewInitialOverrides | null;
}

const TABLE_COLUMNS = {
  headerSx: { fontWeight: 600, bgcolor: "grey.100" },
  name: { width: "50%" },
  monthly: { width: "25%" },
  yearly: { width: "25%" },
} as const;

export interface RecalculatedAmounts {
  earnings: number[];
  deductions: number[];
}

export interface SalaryPreviewPayload {
  templateId: number;
  annualGross: string;
  monthlyGross: string;
  earnings: { earningId: number; monthlyAmount: string; payslipOrder: number }[];
  deductions?: { deductionId: number; monthlyAmount: string; payslipOrder: number }[];
}

/** Monthly gross from annual: nearest whole number (e.g. 100000 → 8333, 100001 → 8334). */
function annualToMonthlyGross(annualGross: number): number {
  if (!Number.isFinite(annualGross) || annualGross <= 0) return 0;
  return Math.round(annualGross / 12);
}

function parseTemplateRowMonthly(rowMonthly: string | undefined): number {
  if (rowMonthly == null || String(rowMonthly).trim() === "") return 0;
  const n = parseFloat(String(rowMonthly).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getTemplateReferenceMonthlyGross(template: SalaryTemplateDetail): number {
  const m = parseFloat(String(template.monthlyGross ?? "").replace(/,/g, ""));
  if (Number.isFinite(m) && m > 0) return m;
  const a = parseFloat(String(template.annualGross ?? "").replace(/,/g, ""));
  if (Number.isFinite(a) && a > 0) return annualToMonthlyGross(a);
  return 0;
}

function percentageBaseFromOf(
  percentageOf: string | { id: number; earningName?: string } | null | undefined,
  monthlyGross: number,
  byEarningId: Record<number, number>,
): number {
  const po = percentageOf;
  if (po == null) return monthlyGross;
  if (typeof po === "string") {
    const lower = po.toLowerCase();
    if (lower === "gross") return monthlyGross;
    if (/^\d+$/.test(po.trim())) {
      const id = Number(po);
      return Object.prototype.hasOwnProperty.call(byEarningId, id)
        ? byEarningId[id]!
        : monthlyGross;
    }
    return monthlyGross;
  }
  if (po?.id != null) {
    return Object.prototype.hasOwnProperty.call(byEarningId, po.id)
      ? byEarningId[po.id]!
      : monthlyGross;
  }
  return monthlyGross;
}

function computeEarningRowMonthly(
  row: NonNullable<SalaryTemplateDetail["earnings"]>[number],
  monthlyGross: number,
  byEarningId: Record<number, number>,
): number {
  const e = row.earning;
  const ct = (e?.calculationType ?? "").toLowerCase();

  if (ct === "amount") {
    // ✅ Fix 1: Amount-type earnings are fixed — never scale them.
    // The balancing Fixed Allowance row is handled separately in applyBalancingFixedAllowance.
    const amt = e?.amount;
    const fromDef =
      typeof amt === "string"
        ? parseFloat(String(amt).replace(/,/g, ""))
        : Number(amt) || 0;
    const fromRow = parseTemplateRowMonthly(row.monthlyAmount);
    const base = fromDef !== 0 ? fromDef : fromRow;
    return Math.round(base);
  }

  if (ct === "percentage") {
    const pct = e?.percentage != null ? parseFloat(String(e.percentage)) : 0;
    const base = percentageBaseFromOf(e?.percentageOf, monthlyGross, byEarningId);
    return Math.round((pct / 100) * base );
  }

  return 0;
}

function recalculateEarningsMonthlyJacobi(
  rows: NonNullable<SalaryTemplateDetail["earnings"]>,
  monthlyGross: number,
): number[] {
  const n = rows.length;
  let E = new Array<number>(n).fill(0);

  for (let iter = 0; iter < 20; iter++) {
    const byEarningId: Record<number, number> = {};
    for (let idx = 0; idx < n; idx++) {
      const e = rows[idx]?.earning;
      if (e?.id != null) byEarningId[e.id] = E[idx]!;
    }

    const ENext: number[] = [];
    for (let idx = 0; idx < n; idx++) {
      // ✅ Fix 1: amountScale removed — no longer passed or used
      ENext.push(computeEarningRowMonthly(rows[idx]!, monthlyGross, byEarningId));
    }

    let stable = true;
    for (let i = 0; i < n; i++) {
      if (Math.abs(E[i]! - ENext[i]!) > 0.005) {
        stable = false;
        break;
      }
    }
    E = ENext;
    if (stable) break;
  }

  return E;
}

function isBalancingFixedAllowanceRow(
  row: NonNullable<SalaryTemplateDetail["earnings"]>[number],
): boolean {
  const ct = (row.earning?.calculationType ?? "").toLowerCase();
  if (ct !== "amount") return false;
  const name = `${row.earning?.earningName ?? ""} ${row.earning?.nameInPayslip ?? ""}`.toLowerCase();
  return name.includes("fixed allowance");
}

function applyBalancingFixedAllowance(
  rows: NonNullable<SalaryTemplateDetail["earnings"]>,
  monthly: number[],
  monthlyGross: number,
): number[] {
  const idx = rows.findIndex(isBalancingFixedAllowanceRow);
  if (idx < 0) return monthly;
  const out = [...monthly];
  const sumOthers = out.reduce((s, v, i) => (i === idx ? s : s + v), 0);
  const balanced = Math.round((monthlyGross - sumOthers) * 100) / 100;
  out[idx] = Math.max(0, balanced);
  return out;
}

function recalculateFromGross(
  template: SalaryTemplateDetail,
  monthlyGross: number,
): RecalculatedAmounts {
  const earningsRows = template.earnings ?? [];

  // Step 1: Start with API values for all rows
  const earningsMonthly = earningsRows.map(row =>
    parseTemplateRowMonthly(row.monthlyAmount)
  );
  console.log(earningsMonthly)
  // Step 2: Recompute only percentage-type earnings
  // Build earningId → monthly map as we go (basic pay comes before HRA in payslip order,
  // but array order might differ — so two passes)
  const byEarningId: Record<number, number> = {};

  // First pass: seed with current values so cross-references work
  for (let idx = 0; idx < earningsRows.length; idx++) {
    const e = earningsRows[idx]?.earning;
    if (e?.id != null) byEarningId[e.id] = earningsMonthly[idx]!;
  }
  console.log(byEarningId)
  // Second pass: recompute percentage rows
  for (let idx = 0; idx < earningsRows.length; idx++) {
    const row = earningsRows[idx]!;
    const e = row.earning;
    if ((e?.calculationType ?? "").toLowerCase() !== "percentage") continue;
    if (isBalancingFixedAllowanceRow(row)) continue;
    console.log("here")
    const pct = e?.percentage != null ? parseFloat(String(e.percentage)) : 0;
    const base = percentageBaseFromOf(e?.percentageOf, monthlyGross, byEarningId);
    console.log(pct, base)
    const monthly = Math.round((pct / 100) * base );
    console.log(pct, base, monthly)
    earningsMonthly[idx] = monthly;
    if (e?.id != null) byEarningId[e.id] = monthly; // update so dependents use fresh value
  }
  console.log(earningsMonthly)
  // Step 3: FA = monthly gross − sum of everything else
  const faIdx = earningsRows.findIndex(isBalancingFixedAllowanceRow);
  console.log(faIdx)
  if (faIdx >= 0) {
    const sumOthers = earningsMonthly.reduce((s, v, i) => (i === faIdx ? s : s + v), 0);
    console.log(monthlyGross - sumOthers)
    earningsMonthly[faIdx] = Math.round(monthlyGross - sumOthers);
  }

  // Step 4: Deductions — amount stays from API, percentage recomputed
  const deductionsMonthly = (template.deductions ?? []).map(row => {
    const d = row.deduction;
    const ct = (d?.calculationType ?? "").toLowerCase();
    if (ct === "percentage") {
      const pct = d?.percentage != null ? parseFloat(String(d.percentage)) : 0;
      const base = percentageBaseFromOf(d?.percentageOf, monthlyGross, byEarningId);
      return Math.round((pct / 100) * base * 100) / 100;
    }
    // amount — keep API value
    return parseTemplateRowMonthly(row.monthlyAmount);
  });

  return { earnings: earningsMonthly, deductions: deductionsMonthly };
}

function buildSalaryPreviewPayload(
  template: SalaryTemplateDetail,
  annualGross: number,
  recalc: RecalculatedAmounts,
): SalaryPreviewPayload {
  const monthlyGross = annualToMonthlyGross(annualGross);
  return withPayrollDeductionsIfPresent({
    templateId: template.id,
    annualGross: String(annualGross),
    monthlyGross: String(monthlyGross),
    earnings: (template.earnings ?? []).map((row, idx) => ({
      earningId: row.earning.id,
      monthlyAmount: String(recalc.earnings[idx] ?? 0),
      payslipOrder: row.payslipOrder,
    })),
    deductions: (template.deductions ?? []).map((row, idx) => ({
      deductionId: row.deduction.id,
      monthlyAmount: String(recalc.deductions[idx] ?? 0),
      payslipOrder: row.payslipOrder,
    })),
  });
}

export function SalaryTemplatePreviewModal({
  open,
  onClose: _onClose,
  templateId,
  templateDetail: templateDetailProp,
  catalogTemplateDetail,
  showEarningsRevert = false,
  onSaveCatalogTemplate,
  onUpdatePayload,
  initialOverrides,
}: SalaryTemplatePreviewModalProps) {
  const { data: templateResponse } = useGetSalaryTemplateByIdQuery(templateId, {
    skip: !open || !templateId || Boolean(templateDetailProp),
  });
  const { data: headerData } = useGetHeaderDataQuery(undefined, { skip: !open });
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0] ?? "";
  const commaSeparation =
    headerData?.data?.commaSeparation === "IN" ? "IN" : "US";

  const [usingCatalogTemplate, setUsingCatalogTemplate] = useState(false);

  const template = useMemo(() => {
    if (usingCatalogTemplate && catalogTemplateDetail) {
      return catalogTemplateDetail;
    }
    return templateDetailProp ?? templateResponse?.data;
  }, [
    usingCatalogTemplate,
    catalogTemplateDetail,
    templateDetailProp,
    templateResponse?.data,
  ]);
  const [annualGrossInput, setAnnualGrossInput] = useState("");
  const initialAnnualGrossRef = useRef<number | null>(null);
  const [recalculated, setRecalculated] = useState<RecalculatedAmounts | null>(null);
  const prefilledForSessionRef = useRef(false);

  // ✅ Fix 2: Track whether the user has manually edited the gross field
  const hasUserEditedGross = useRef(false);

  const displayAnnualGross = useMemo(() => {
    if (annualGrossInput.trim() === "") return 0;
    const parsed = parseNumberByCommaSeparation(annualGrossInput, commaSeparation);
    return isNaN(parsed) ? 0 : parsed;
  }, [annualGrossInput, commaSeparation]);

  const monthlyGross = useMemo(
    () => annualToMonthlyGross(displayAnnualGross),
    [displayAnnualGross],
  );

  const RECALC_DEBOUNCE_MS = 500;

  // ✅ Fix 2: Only recalculate when the user has actually edited the gross — not on prefill/open
  useEffect(() => {
    if (!open || !template || !hasUserEditedGross.current) return;
    const timer = window.setTimeout(() => {
      const next = recalculateFromGross(template, monthlyGross);
      setRecalculated(next);
    }, RECALC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, template, displayAnnualGross, monthlyGross]);

  // ✅ Fix 2: Reset the user-edit flag when modal closes or template changes
  useEffect(() => {
    if (!open) {
      hasUserEditedGross.current = false;
      setUsingCatalogTemplate(false);
    }
  }, [open, templateId]);

  const applyTemplateToForm = useCallback(
    (detail: SalaryTemplateDetail, markPrefilled = true) => {
      const value = Number(detail.annualGross) || 0;
      setAnnualGrossInput(
        formatNumberForTyping(String(value), commaSeparation),
      );
      setRecalculated(null);
      initialAnnualGrossRef.current = value;
      prefilledForSessionRef.current = markPrefilled;
      hasUserEditedGross.current = false;
    },
    [commaSeparation],
  );

  const handleRevertToCatalog = useCallback(() => {
    if (!catalogTemplateDetail) return;
    setUsingCatalogTemplate(true);
    applyTemplateToForm(catalogTemplateDetail, false);
  }, [catalogTemplateDetail, applyTemplateToForm]);

  const handleCancelCatalog = useCallback(() => {
    setUsingCatalogTemplate(false);
    if (templateDetailProp) {
      applyTemplateToForm(templateDetailProp, false);
    }
  }, [templateDetailProp, applyTemplateToForm]);

  const handleSaveCatalog = useCallback(() => {
    onSaveCatalogTemplate?.();
    _onClose();
  }, [onSaveCatalogTemplate, _onClose]);

  useEffect(() => {
    if (!open) return;

    if (initialOverrides?.annualGross != null && initialOverrides?.recalculated) {
      setAnnualGrossInput(
        formatNumberForTyping(String(initialOverrides.annualGross), commaSeparation),
      );
      setRecalculated(initialOverrides.recalculated);
      initialAnnualGrossRef.current = initialOverrides.annualGross;
      prefilledForSessionRef.current = true;
    } else {
      setAnnualGrossInput("");
      setRecalculated(null);
      initialAnnualGrossRef.current = null;
      prefilledForSessionRef.current = false;
    }
  }, [open, templateId, commaSeparation, initialOverrides]);

  useEffect(() => {
    if (!open || !template || initialOverrides != null || prefilledForSessionRef.current) return;
    applyTemplateToForm(template);
  }, [open, template, initialOverrides, applyTemplateToForm]);

  const isDirty = useMemo(() => {
    if (initialAnnualGrossRef.current == null) return false;
    return displayAnnualGross !== initialAnnualGrossRef.current;
  }, [displayAnnualGross]);

  const handleUpdate = useCallback(() => {
    if (!template) return;
    const monthly = annualToMonthlyGross(displayAnnualGross);
    const next = recalculateFromGross(template, monthly);
    setRecalculated(next);
    const payload = buildSalaryPreviewPayload(template, displayAnnualGross, next);
    onUpdatePayload?.(payload);
    _onClose();
  }, [template, displayAnnualGross, onUpdatePayload, _onClose]);

  const hasNegativeFixedAllowance = useMemo(() => {
    if (!template || !recalculated) return false;

    const faIdx = template.earnings?.findIndex(isBalancingFixedAllowanceRow) ?? -1;
    if (faIdx < 0) return false;

    return (recalculated.earnings[faIdx] ?? 0) < 0;
  }, [template, recalculated]);
  const canUpdate =
    displayAnnualGross >= 1 &&
    isDirty &&
    !hasNegativeFixedAllowance;
  if (!open) return null;

  return (
    <Box sx={{ px: 0.5, py: 1 }}>
      {!template ? (
        <Typography color="text.secondary">Loading template…</Typography>
      ) : (
        <>
          {showEarningsRevert && catalogTemplateDetail && !usingCatalogTemplate ? (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <PrimaryButton size="small" onClick={handleRevertToCatalog}>
                  Use
                </PrimaryButton>
              }
            >
              The original template has been changed. Click below to use the updated
              template. Your overridden gross value will be lost.
            </Alert>
          ) : null}
          <Divider sx={{ my: 2 }} />
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>
              Gross
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextFieldElement
                label="Annual gross"
                value={annualGrossInput}
                onChange={(e) => {
                  // ✅ Fix 2: Mark as user-driven before updating state
                  hasUserEditedGross.current = true;
                  setAnnualGrossInput(
                    formatNumberForTyping(
                      parseNumberForTyping(e.target.value),
                      commaSeparation,
                    ),
                  );
                }}
                placeholder={formatNumberForTyping(String(template.annualGross), commaSeparation)}
                fullWidth
              />
              <Typography variant="body2" color="text.secondary">
                Monthly gross:{" "}
                <Typography component="span" fontWeight={600} color="text.primary">
                  {formatCurrencyByCommaSeparation(monthlyGross, commaSeparation, currency)}
                </Typography>
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: 1,
                  mt: 1,
                }}
              >
                {usingCatalogTemplate ? (
                  <SecondaryButton onClick={handleCancelCatalog}>
                    Cancel
                  </SecondaryButton>
                ) : null}
                {usingCatalogTemplate && !isDirty ? (
                  <PrimaryButton onClick={handleSaveCatalog}>Save</PrimaryButton>
                ) : null}
                <PrimaryButton onClick={handleUpdate} disabled={!canUpdate}>
                  Update
                </PrimaryButton>
              </Box>
            </Box>
          </Paper>
          {template.earnings?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Earnings
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ overflow: "auto" }}>
                <Table size="small" stickyHeader sx={{ tableLayout: "fixed", minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...TABLE_COLUMNS.headerSx, ...TABLE_COLUMNS.name }}>Name</TableCell>
                      <TableCell align="right" sx={{ ...TABLE_COLUMNS.headerSx, ...TABLE_COLUMNS.monthly }}>Monthly</TableCell>
                      <TableCell align="right" sx={{ ...TABLE_COLUMNS.headerSx, ...TABLE_COLUMNS.yearly }}>Yearly</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {template.earnings.map((e, idx) => {
                      const earning = e.earning;
                      const monthly =
                        recalculated?.earnings[idx] ??
                        (typeof e.monthlyAmount === "string"
                          ? parseFloat(e.monthlyAmount)
                          : Number(e.monthlyAmount) || 0);
                      const yearly = Math.round(monthly * 12 * 100) / 100;
                      return (
                        <TableRow key={e.id} hover>
                          <TableCell sx={TABLE_COLUMNS.name}>{earning?.earningName ?? `ID ${e.id}`}</TableCell>
                          <TableCell align="right" sx={TABLE_COLUMNS.monthly}>
                            {currency}
                            {formatNumberByCommaSeparation(monthly, commaSeparation).split(".")[0]}
                          </TableCell>
                          <TableCell align="right" sx={TABLE_COLUMNS.yearly}>
                            {currency}
                            {formatNumberByCommaSeparation(yearly, commaSeparation).split(".")[0]}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {template.deductions?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Deductions
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ overflow: "auto" }}>
                <Table size="small" stickyHeader sx={{ tableLayout: "fixed", minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...TABLE_COLUMNS.headerSx, ...TABLE_COLUMNS.name }}>Name</TableCell>
                      <TableCell align="right" sx={{ ...TABLE_COLUMNS.headerSx, ...TABLE_COLUMNS.monthly }}>Monthly</TableCell>
                      <TableCell align="right" sx={{ ...TABLE_COLUMNS.headerSx, ...TABLE_COLUMNS.yearly }}>Yearly</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {template.deductions.map((d, idx) => {
                      const deduction = d.deduction;
                      const monthly =
                        recalculated?.deductions[idx] ??
                        (typeof d.monthlyAmount === "string"
                          ? parseFloat(d.monthlyAmount)
                          : Number(d.monthlyAmount) || 0);
                      const yearly = Math.round(monthly * 12 );
                      return (
                        <TableRow key={d.id} hover>
                          <TableCell sx={TABLE_COLUMNS.name}>{deduction?.deductionName ?? `ID ${d.id}`}</TableCell>
                          <TableCell align="right" sx={TABLE_COLUMNS.monthly}>
                            {currency}
                            {formatNumberByCommaSeparation(monthly, commaSeparation).split(".")[0]}
                          </TableCell>
                          <TableCell align="right" sx={TABLE_COLUMNS.yearly}>
                            {currency}
                            {formatNumberByCommaSeparation(yearly, commaSeparation).split(".")[0]}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}