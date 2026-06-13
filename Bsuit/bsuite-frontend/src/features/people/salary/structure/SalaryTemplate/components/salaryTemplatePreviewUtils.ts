import type {
  SalaryTemplateDetail,
  TemplateDeductionItem,
  TemplateEarningItem,
} from "../api/salaryTemplate.api";
import type {
  EmployeeSalaryTemplatePreviewDeduction,
  EmployeeSalaryTemplatePreviewEarning,
} from "../../../../org/people/directory/api/directory.api";

function monthlyAmountString(v: string | number | undefined): string {
  if (typeof v === "number") return String(v);
  return v != null && String(v) !== "" ? String(v) : "0";
}

function earningComponentIdsFromPreview(
  rows: EmployeeSalaryTemplatePreviewEarning[] | undefined,
): Set<number> {
  const ids = new Set<number>();
  for (const row of rows ?? []) {
    const id = row.earning?.id;
    if (id != null) ids.add(id);
  }
  return ids;
}

function earningComponentIdsFromCatalog(
  rows: TemplateEarningItem[] | undefined,
): Set<number> {
  const ids = new Set<number>();
  for (const row of rows ?? []) {
    const id = row.earning?.id;
    if (id != null) ids.add(id);
  }
  return ids;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

/** True when employee assignment has different earning components than the catalog template. */
export function hasEarningsStructureDrift(
  employeeEarnings: EmployeeSalaryTemplatePreviewEarning[] | undefined,
  catalogEarnings: TemplateEarningItem[] | undefined,
): boolean {
  const employeeIds = earningComponentIdsFromPreview(employeeEarnings);
  const catalogIds = earningComponentIdsFromCatalog(catalogEarnings);
  if (employeeIds.size === 0 && catalogIds.size === 0) return false;
  return !setsEqual(employeeIds, catalogIds);
}

type CatalogTemplateSource = {
  id: number | string;
  templateName?: string;
  description?: string;
  annualGross?: string | number;
  monthlyGross?: string | number;
  earnings?: Array<{
    id: number;
    earning?: TemplateEarningItem["earning"];
    monthlyAmount?: string | number;
    payslipOrder?: number;
  }>;
  deductions?: Array<{
    id: number;
    deduction?: TemplateDeductionItem["deduction"];
    monthlyAmount?: string | number;
    payslipOrder?: number;
  }>;
};

/** Map GET /salary-templates list item to SalaryTemplateDetail for preview / revert. */
export function catalogSalaryTemplateToDetail(
  item: unknown,
): SalaryTemplateDetail | null {
  const src = item as CatalogTemplateSource | null | undefined;
  const id = Number(src?.id);
  if (!src?.id || Number.isNaN(id)) return null;

  const earnings: TemplateEarningItem[] = (src.earnings ?? []).map((row) => ({
    id: row.id,
    earning: row.earning ?? {
      id: row.id,
      earningName: `Earning ${row.id}`,
      calculationType: "amount",
      amount: monthlyAmountString(row.monthlyAmount),
      percentage: null,
      percentageOf: null,
    },
    monthlyAmount: monthlyAmountString(row.monthlyAmount),
    payslipOrder: row.payslipOrder ?? 0,
  }));

  const deductions: TemplateDeductionItem[] = (src.deductions ?? []).map(
    (row) => ({
      id: row.id,
      deduction: row.deduction ?? {
        id: row.id,
        deductionName: `Deduction ${row.id}`,
        calculationType: "amount",
        amount: monthlyAmountString(row.monthlyAmount),
      },
      monthlyAmount: monthlyAmountString(row.monthlyAmount),
      payslipOrder: row.payslipOrder ?? 0,
    }),
  );

  return {
    id,
    templateName: src.templateName ?? "",
    description: src.description ?? "",
    annualGross:
      src.annualGross != null ? String(src.annualGross) : "0",
    monthlyGross:
      src.monthlyGross != null ? String(src.monthlyGross) : "0",
    earnings,
    deductions,
  };
}

export type PayrollDeductionLine = {
  deductionId: number;
  monthlyAmount: string;
  payslipOrder: number;
};

export type PayrollLinesPayload = {
  annualGross: string;
  earnings: {
    earningId: number;
    monthlyAmount: string;
    payslipOrder: number;
  }[];
  deductions?: PayrollDeductionLine[];
};

function mapTemplateDeductionLines(
  template: SalaryTemplateDetail,
): PayrollDeductionLine[] {
  return (template.deductions ?? []).map((row) => ({
    deductionId: row.deduction.id,
    monthlyAmount: monthlyAmountString(row.monthlyAmount),
    payslipOrder: row.payslipOrder,
  }));
}

/** Omit `deductions` when there are no lines (backend may not send the key). */
export function withPayrollDeductionsIfPresent<
  T extends { deductions?: PayrollDeductionLine[] },
>(payload: T): T {
  const { deductions, ...rest } = payload;
  if (deductions != null && deductions.length > 0) {
    return { ...rest, deductions } as T;
  }
  return rest as T;
}

/** Build full payroll lines from template row amounts (preview Save / submit without modal override). */
export function buildPayrollLinesFromTemplateDetail(
  template: SalaryTemplateDetail,
  annualGrossOverride?: number,
): PayrollLinesPayload {
  const parsedGross =
    annualGrossOverride ??
    parseFloat(String(template.annualGross ?? "").replace(/,/g, ""));
  const annualGross = String(
    Number.isFinite(parsedGross) && parsedGross > 0 ? parsedGross : 0,
  );

  return withPayrollDeductionsIfPresent({
    annualGross,
    earnings: (template.earnings ?? []).map((row) => ({
      earningId: row.earning.id,
      monthlyAmount: monthlyAmountString(row.monthlyAmount),
      payslipOrder: row.payslipOrder,
    })),
    deductions: mapTemplateDeductionLines(template),
  });
}
