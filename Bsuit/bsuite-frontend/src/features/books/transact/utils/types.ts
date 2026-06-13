import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

export type FormType = "Invoice" | "Bill";

export type ModeType = "Edit" | "Add";

export type TransactionLevel = "" | "item" | "transaction";

export type ValueUnit = "percent" | "value";

export type DiscountApplyMode = "before" | "after";

export type RoundOffMode = "none" | "positive" | "negative" | "nearest";

export interface TdsPayload {
  hasTds: boolean;
  tdsLevel?: "total" | "item";
  tdsType?: ValueUnit;
  tdsValue?: string;
  totalTdsValue?: string;
}
export interface DiscountPayload {
  hasDiscount: boolean;
  discountLevel?: "total" | "item";
  discountApplied?: "before" | "after";
  discountType?: ValueUnit;
  discountValue?: string;
  totalDiscountValue?: string;
  discountAccountId?: number;
}

export interface TaxPayload {
  hasTax: boolean;
  taxLevel?: "total" | "item";
  taxes?: {
    taxId: number;
    isOverride: boolean;
    type: "percent" | "value";
    value: number;
    totalAmount: number;   // ← add
  }[];
  totalTaxValue?: string;
}
export interface InvoiceOrBillRow {
  id: string;
  itemName: string;
  accountId: number;
  hsnSac: string;
  quantity: number;
  price: number;
  taxes?: {
    taxId: string;
    taxUnit?: "percent" | "value";
    taxName: string;
    taxAbbreviation?: string;
    taxPercent: number;
    isTaxOverridden?: boolean;
    originalTaxPercent?: number;
    originalTaxUnit?: "percent" | "value";
  }[];
  tdsValue: number;
  tdsUnit: "percent" | "value";
  discountValue: number;
  discountUnit: "percent" | "value";
  discountAccountId?: number;
  rowTotal: number;
  notes?: string;
}
export interface InvoiceSummary {
  subtotal: number;
  originalSubtotal?: number;
  originalTds?: number;
  originalTax?: number;
  originalTaxBreakup?: {
    taxId?: string;
    name: string;
    unit: "percent" | "value";
    rate: number;
    value: number;
  }[];
  totalTax: number;
  total: number;

  totalTdsValue: number;
  totalDiscountValue: number;

  invoiceTotal: number;
  roundoffTotal: number;

  taxBreakup: {
    abbreviation?: string;
    taxId?: string;
    name: string;
    unit: "percent" | "value";
    rate: number;
    value: number;
  }[];

  tdsBreakup: {
    source: "row" | "transaction";
    rowIndex?: number;
    name: string;
    rateOrValue: string;
    tdsUnit?: "percent" | "value";
    value: number;
  }[];
}
export interface TransactionHeader {
  contactId: number | null;

  documentNo: string; // invoiceNo | billNo
  documentDate: string | null;
  dueDate: string | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;

  currency: string;

  fxRate?: number;
  originalFxRate?: number;

  notes?: string;
}
export interface InvoiceFormState {
  formType: FormType;

  header: TransactionHeader;

  flags: {
    showInlineTds: boolean;
    showInlineDisc: boolean;
    showInlineTax: boolean;
  };

  transactionTds?: {
    level: "total" | "item";
    unit?: ValueUnit; // percent | value (only for total)
    value?: number; // user-entered
    totalValue?: number; // computed final TDS
  };

  transactionDiscount?: {
    level: "total" | "item";
    unit?: ValueUnit; // percent | value (only for total)
    value?: number;
    applied: DiscountApplyMode;
    totalValue?: number; // computed final discount
    accountId?: number;
  };

  transactionTax?: {
    level: "total";
    taxes: Array<{
      taxId: string;
      taxName: string;
      taxPercent: number;
      taxUnit: "percent" | "value";
      taxAbbreviation?: string;
      originalTaxPercent?: number;
      originalTaxUnit?: "percent" | "value";
      isTaxOverridden?: boolean;
    }>;
    applied: "before" | "after";
  };

  roundOffMode: RoundOffMode;
  rowDiscountFactor?: number;

  rows: InvoiceOrBillRow[];
  summary: InvoiceSummary;
}

const toDayjs = (value?: string | null): Dayjs | null =>
  value ? dayjs(value) : null;

const parseOptionalPositiveId = (val: unknown): number | undefined => {
  if (val == null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Resolves line account from API or OCR: prefers split invoice/bill ids when provided. */
const resolveItemAccountId = (item: any, formType?: "Invoice" | "Bill"): number => {
  if (formType === "Invoice") {
    const inv = parseOptionalPositiveId(item?.itemInvoiceAccountId);
    if (inv != null) return inv;
  } else if (formType === "Bill") {
    const billAcc = parseOptionalPositiveId(item?.itemBillAccountId);
    if (billAcc != null) return billAcc;
  }
  const direct = Number(item?.itemAccountId);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const nested = Number(item?.itemAccount?.id);
  if (Number.isFinite(nested) && nested > 0) return nested;
  return 0;
};

export function mapInvoiceApiToForm(
  api: any,
  taxMap: any,
  isDuplicate: boolean,
): InvoiceFormState {
  const invoice = api.data.invoiceData;

  /* ---------------- ROWS ---------------- */

  const rows: InvoiceOrBillRow[] = invoice.items.map(
    (item: any): InvoiceOrBillRow => ({
      id: crypto.randomUUID(), // frontend-only

      itemName: item.itemName,
      accountId: resolveItemAccountId(item, "Invoice"),
      hsnSac: item.hsnSac ?? "",

      quantity: Number(item.quantity),
      price: Number(item.unitPrice),

      taxes: (item.itemTax ?? []).map((tax: any) => {
        const taxMeta = taxMap.get(String(tax.taxId));
        const apiValue = Number(tax.value);
        const baseRate = taxMeta?.rate ?? apiValue;
        const baseUnit: "percent" | "value" = "percent";
        const isOverridden = Boolean(tax.isOverride);
        const overrideValue = Number(tax.value ?? baseRate);
        const apiUnit = (tax.type ?? "percent") as "percent" | "value";
        const overrideUnit = (tax.type ?? baseUnit) as "percent" | "value";

        return {
          taxId: String(tax.taxId),
          taxName: taxMeta?.name ?? String(tax.taxId),
          // use overridden value if applicable
          taxPercent: isOverridden ? overrideValue : baseRate,
          taxUnit: overrideUnit,
          taxAbbreviation: taxMeta?.abbreviation,
          // keep reference to original for future revert
          originalTaxPercent: taxMeta?.rate ?? apiValue,
          originalTaxUnit: apiUnit,
          isTaxOverridden: isOverridden,
        };
      }),

      tdsValue: Number(item.itemTdsValue ?? 0),
      tdsUnit: item.itemTdsType ?? "percent",

      discountValue: Number(item.itemDiscountValue ?? 0),
      discountUnit: item.itemDiscountType ?? "percent",
      discountAccountId: item.itemDiscountAccount?.id ?? undefined,

      rowTotal: Number(item.itemTotal),
      notes: undefined,
    }),
  );

  /* ---------------- FLAGS ---------------- */

  const showInlineTds = invoice.tdsLevel === "item" ||
    invoice.items?.some((item: any) => item.itemTdsValue && Number(item.itemTdsValue) > 0);
  const showInlineDisc = invoice.discountLevel === "item" ||
    invoice.items?.some((item: any) => item.itemDiscountValue && Number(item.itemDiscountValue) > 0);

  /* ---------------- TRANSACTION TDS ---------------- */

  const transactionTds = invoice.hasTds && invoice.tdsLevel === "total"
    ? {
      level: "total" as const,
      unit: invoice.tdsType,
      value: Number(invoice.tdsValue),
      totalValue: invoice.totalTdsValue != null ? Number(invoice.totalTdsValue) : undefined,
    }
    : undefined;

  /* ---------------- TRANSACTION DISCOUNT ---------------- */

  const transactionDiscount =
    invoice.discountLevel === "total" &&
      invoice.discountValue != null &&
      invoice.discountValue !== ""
      ? {
        level: "total" as const,
        unit: (invoice.discountType || "percent") as ValueUnit,
        value: Number(invoice.discountValue),
        applied: (invoice.discountApplied || "after") as DiscountApplyMode,
        totalValue: Number(invoice.discountValue),
        accountId: invoice.discountAccount?.id,
      }
      : undefined;

  /* ---------------- TRANSACTION TAX ---------------- */
  const transactionTax =
    invoice.hasTax && invoice.taxLevel === "total" && Array.isArray(invoice.taxes)
      ? {
        level: "total" as const,
        applied: "after" as const,
        taxes: invoice.taxes.map((t: any) => {
          const taxMeta = taxMap?.get(String(t.taxId));
          return {
            taxId: String(t.taxId),
            taxName: taxMeta?.name ?? "",
            taxAbbreviation: taxMeta?.abbreviation,
            taxPercent: Number(t.value),
            taxUnit: (t.type ?? "percent") as "percent" | "value",
            originalTaxPercent: taxMeta?.rate ?? Number(t.value),
            originalTaxUnit: "percent" as const,
            isTaxOverridden: Boolean(t.isOverride),
          };
        }),
      }
      : undefined;

  const showInlineTax =
    (invoice.hasTax || invoice.items?.some((item: any) => item.itemTax?.length > 0))
    && invoice.taxLevel === "item";
  /* ---------------- ROUND OFF MODE ---------------- */

  const invoiceTotal = Number(invoice.invoiceTotal);
  const roundoffTotal = Number(invoice.roundoffTotal);
  const isRoundOff = Boolean(invoice.isRoundOff);

  let roundOffMode: "none" | "nearest" | "positive" | "negative" = "none";

  if (isRoundOff && invoiceTotal !== roundoffTotal) {
    const diff = roundoffTotal - invoiceTotal;

    if (Math.abs(diff) < 0.01) {
      // Negligible difference - treat as nearest
      roundOffMode = "nearest";
    } else if (diff > 0) {
      // Rounded up: e.g., 4000.36 -> 4001.00
      roundOffMode = "positive";
    } else {
      // Rounded down: e.g., 4000.69 -> 4000.00
      roundOffMode = "negative";
    }
  }

  /* ---------------- SUMMARY ---------------- */

  const summary: InvoiceSummary = {
    subtotal: rows.reduce((sum, r) => sum + r.quantity * r.price, 0),

    totalTax: invoice.taxes?.reduce((sum: number, t: any) => sum + Number(t.totalAmount ?? 0), 0) ?? 0,
    total: invoiceTotal,

    totalTdsValue: transactionTds?.totalValue ?? 0,

    totalDiscountValue: invoice.discountLevel === "item"
      ? rows.reduce((sum, r) => {
        const base = r.quantity * r.price;
        return sum + (r.discountUnit === "percent"
          ? base * r.discountValue / 100
          : Math.min(r.discountValue, base));
      }, 0)
      : transactionDiscount?.totalValue ?? 0,

    invoiceTotal: invoiceTotal,
    roundoffTotal: roundoffTotal, // Preserve the backend rounded value

    taxBreakup: (invoice.taxes ?? []).map((t: any) => {
      const taxMeta = taxMap?.get(String(t.taxId));
      return {
        taxId: String(t.taxId),
        abbreviation: taxMeta?.abbreviation,
        name: taxMeta?.name ?? String(t.taxId),
        unit: (t.type ?? "percent") as "percent" | "value",
        rate: Number(t.value),
        value: Number(t.totalAmount ?? 0),
      };
    }),
    tdsBreakup: [],
  };

  /* ---------------- FINAL FORM STATE ---------------- */

  return {
    formType: "Invoice",

    header: {
      contactId: invoice.contact.id,
      documentNo: isDuplicate ? "" : invoice.invoiceNo,
      documentDate: toDayjs(invoice.invoiceDate)?.format("YYYY-MM-DD")!,
      dueDate: toDayjs(invoice.invoiceDueDate)?.format("YYYY-MM-DD")!,
      serviceStartDate: toDayjs(invoice.serviceStartDate)?.format(
        "YYYY-MM-DD",
      )!,
      serviceEndDate: toDayjs(invoice.serviceEndDate)?.format("YYYY-MM-DD")!,
      currency: invoice.invoiceCurrency,
      fxRate: Number(api.data.fxRate ?? 1),
      originalFxRate: Number(api.data.originalFxRate ?? 1),
      notes: invoice.notes,
    },

    flags: {
      showInlineTds,
      showInlineDisc,
      showInlineTax,
    },

    transactionTds,
    transactionDiscount,
    transactionTax,

    roundOffMode, // Properly detected from backend data
    rowDiscountFactor: 1,
    rows,
    summary,
  };
}

export function mapBillApiToForm(
  api: any,
  taxMap: any,
  isDuplicate: boolean,
): InvoiceFormState {
  const bill = api.data.billData;

  if (!bill || !Array.isArray(bill.items)) {
    throw new Error("Invalid bill payload");
  }

  /* ---------------- ROWS ---------------- */
  const rows: InvoiceOrBillRow[] = bill.items.map(
    (item: any): InvoiceOrBillRow => ({
      id: crypto.randomUUID(),

      itemName: item.itemName,
      accountId: resolveItemAccountId(item, "Bill"),
      hsnSac: item.hsnSac ?? "",

      quantity: Number(item.quantity),
      price: Number(item.unitPrice),

      taxes: (item.itemTax ?? []).map((tax: any) => {
        const taxMeta = taxMap.get(String(tax.taxId));
        const apiValue = Number(tax.value);           // value from API
        const apiUnit = (tax.type ?? "percent") as "percent" | "value";
        const baseRate = taxMeta?.rate ?? apiValue;
        const baseUnit: "percent" | "value" = "percent";
        const isOverridden = Boolean(tax.isOverride);

        return {
          taxId: String(tax.taxId),
          taxName: taxMeta?.name ?? String(tax.taxId),
          // use overridden value if applicable
          taxPercent: isOverridden ? apiValue : baseRate,
          taxAbbreviation: taxMeta?.abbreviation,
          taxUnit: apiUnit,
          // keep reference to original for future revert
          originalTaxPercent: taxMeta?.rate ?? apiValue,
          originalTaxUnit: apiUnit,
          isTaxOverridden: isOverridden,
        };
      }),

      // Inline TDS (bill has item-level TDS)
      tdsValue: Number(item.itemTdsValue ?? 0),
      tdsUnit: item.itemTdsType ?? "percent",

      discountValue: Number(item.itemDiscountValue ?? 0),
      discountUnit: item.itemDiscountType ?? "percent",
      discountAccountId: item.itemDiscountAccount?.id ?? undefined,

      rowTotal: Number(item.itemTotal),
      notes: undefined,
    }),
  );

  /* ---------------- FLAGS ---------------- */

  const showInlineTds = bill.tdsLevel === "item" ||
    bill.items?.some((item: any) => item.itemTdsValue && Number(item.itemTdsValue) > 0);
  const showInlineDisc = bill.discountLevel === "item" ||
    bill.items?.some((item: any) => item.itemDiscountValue && Number(item.itemDiscountValue) > 0);

  /* ---------------- TRANSACTION TDS ---------------- */

  const transactionTds = bill.hasTds && bill.tdsLevel === "total"
    ? {
      level: "total" as const,
      unit: bill.tdsType,
      value: Number(bill.tdsValue),
      totalValue: bill.totalTdsValue != null ? Number(bill.totalTdsValue) : undefined,
    }
    : undefined;

  /* ---------------- TRANSACTION DISCOUNT ---------------- */

  const transactionDiscount =
    bill.discountLevel === "total" &&
      bill.discountValue != null &&
      bill.discountValue !== ""
      ? {
        level: "total" as const,
        unit: (bill.discountType || "percent") as ValueUnit,
        value: Number(bill.discountValue),
        applied: (bill.discountApplied || "after") as DiscountApplyMode,
        totalValue: Number(bill.discountValue),
        accountId: bill.discountAccount?.id,
      }
      : undefined;

  /* ---------------- TRANSACTION TAX ---------------- */
  const transactionTax =
    bill.hasTax && bill.taxLevel === "total" && Array.isArray(bill.taxes)
      ? {
        level: "total" as const,
        applied: "after" as const,
        taxes: bill.taxes.map((t: any) => {
          const taxMeta = taxMap?.get(String(t.taxId));
          return {
            taxId: String(t.taxId),
            taxName: taxMeta?.name ?? "",
            taxAbbreviation: taxMeta?.abbreviation,
            taxPercent: Number(t.value),
            taxUnit: (t.type ?? "percent") as "percent" | "value",
            originalTaxPercent: taxMeta?.rate ?? Number(t.value),
            originalTaxUnit: "percent" as const,
            isTaxOverridden: Boolean(t.isOverride),
          };
        }),
      }
      : undefined;

  const showInlineTax =
    (bill.hasTax || bill.items?.some((item: any) => item.itemTax?.length > 0))
    && bill.taxLevel === "item";
  /* ---------------- ROUND OFF MODE ---------------- */

  const billTotal = Number(bill.billTotal);
  const roundoffTotal = Number(bill.roundoffTotal);
  const isRoundOff = Boolean(bill.isRoundOff);

  let roundOffMode: "none" | "nearest" | "positive" | "negative" = "none";

  if (isRoundOff && billTotal !== roundoffTotal) {
    const diff = roundoffTotal - billTotal;

    if (Math.abs(diff) < 0.01) {
      // Negligible difference - treat as nearest
      roundOffMode = "nearest";
    } else if (diff > 0) {
      // Rounded up: e.g., 4000.36 -> 4001.00
      roundOffMode = "positive";
    } else {
      // Rounded down: e.g., 4000.69 -> 4000.00
      roundOffMode = "negative";
    }
  }

  /* ---------------- SUMMARY ---------------- */

  const summary: InvoiceSummary = {
    subtotal: rows.reduce((sum, r) => sum + r.quantity * r.price, 0),

    totalTax: 0,
    total: billTotal,

    totalTdsValue: transactionTds?.totalValue ?? 0,
    totalDiscountValue: bill.discountLevel === "item"
      ? rows.reduce((sum, r) => {
        const base = r.quantity * r.price;
        return sum + (r.discountUnit === "percent"
          ? base * r.discountValue / 100
          : Math.min(r.discountValue, base));
      }, 0)
      : transactionDiscount?.totalValue ?? 0,

    invoiceTotal: billTotal,
    roundoffTotal: roundoffTotal, // Preserve the backend rounded value

    taxBreakup: [],
    tdsBreakup: [],
  };

  /* ---------------- FINAL FORM STATE ---------------- */

  return {
    formType: "Bill",

    header: {
      contactId: bill.contact.id,
      documentNo: isDuplicate ? "" : bill.billNo,
      documentDate: toDayjs(bill.billDate)?.format("YYYY-MM-DD")!,
      dueDate: toDayjs(bill.billDueDate)?.format("YYYY-MM-DD")!,
      serviceStartDate: toDayjs(bill.serviceStartDate)?.format("YYYY-MM-DD")!,
      serviceEndDate: toDayjs(bill.serviceEndDate)?.format("YYYY-MM-DD")!,
      currency: bill.billCurrency,
      fxRate: Number(api.data.fxRate ?? 1),
      originalFxRate: Number(api.data.originalFxRate ?? 1),
      notes: bill.notes,
    },

    flags: {
      showInlineTds,
      showInlineDisc,
      showInlineTax,
    },

    transactionTds,
    transactionDiscount,
    transactionTax,

    roundOffMode, // Properly detected from backend data
    rowDiscountFactor: 1,
    rows,
    summary,
  };
}

export function mapExtractedDataToForm(
  extractedResult: any,
  formType: "Invoice" | "Bill",
  taxMap: any,
): InvoiceFormState {
  if (!extractedResult) throw new Error("No extracted data provided");

  /* ---------------- ROWS ---------------- */
  const rows: InvoiceOrBillRow[] = (extractedResult.items || []).map(
    (item: any): InvoiceOrBillRow => ({
      id: crypto.randomUUID(),

      itemName: item.itemName ?? "",
      accountId: resolveItemAccountId(item, formType),
      hsnSac: item.hsnSac ?? "",

      quantity: Number(item.quantity ?? 1),
      price: Number(item.unitPrice ?? item.itemTotal ?? 0),

      taxes: (item.itemTax ?? []).map((tax: any) => {
        const taxMeta = taxMap?.get(String(tax.taxId));
        const apiValue = Number(tax.taxRate ?? tax.value ?? 0);
        const apiUnit = (tax.taxType ?? tax.type ?? "percent") as "percent" | "value";

        return {
          taxId: tax.taxId ? String(tax.taxId) : "",
          taxName: tax.taxName || taxMeta?.name || "",
          taxPercent: apiValue,
          taxAbbreviation: taxMeta?.abbreviation,
          taxUnit: apiUnit,
          originalTaxPercent: taxMeta?.rate ?? apiValue,
          originalTaxUnit: apiUnit,
          isTaxOverridden: false,
        };
      }),

      tdsValue: Number(item.itemTdsValue ?? 0),
      tdsUnit: item.itemTdsType ?? "percent",

      discountValue: Number(item.itemDiscountValue ?? 0),
      discountUnit: item.itemDiscountType ?? "percent",
      discountAccountId: undefined,

      rowTotal: Number(item.itemTotal ?? 0),
      notes: undefined,
    }),
  );

  /* ---------------- FLAGS ---------------- */

  const showInlineTds = extractedResult.tdsLevel === "item" ||
    (extractedResult.items || []).some((item: any) => item.itemTdsValue && Number(item.itemTdsValue) > 0);
  const showInlineDisc = extractedResult.discountLevel === "item" ||
    (extractedResult.items || []).some((item: any) => item.itemDiscountValue && Number(item.itemDiscountValue) > 0);

  /* ---------------- TRANSACTION TDS ---------------- */

  const transactionTds = extractedResult.hasTds && extractedResult.tdsLevel !== "item"
    ? {
      level: "total" as const,
      unit: (extractedResult.tdsType as ValueUnit) ?? "percent",
      value: Number(extractedResult.tdsValue ?? 0),
      totalValue: extractedResult.tdsValue != null ? Number(extractedResult.tdsValue) : undefined,
    }
    : undefined;

  /* ---------------- TRANSACTION DISCOUNT ---------------- */

  const transactionDiscount =
    extractedResult.hasDiscount && extractedResult.discountLevel !== "item"
      ? {
        level: "total" as const,
        unit: (extractedResult.discountType || "percent") as ValueUnit,
        value: Number(extractedResult.discountValue ?? 0),
        applied: (extractedResult.discountApplied || "after") as DiscountApplyMode,
        totalValue: Number(extractedResult.discountValue ?? 0),
        accountId:
          formType === "Invoice"
            ? parseOptionalPositiveId(extractedResult.discountInvoiceAccountId)
            : parseOptionalPositiveId(extractedResult.discountBillAccountId),
      }
      : undefined;

  /* ---------------- TRANSACTION TAX ---------------- */
  const transactionTax =
    extractedResult.hasTax && extractedResult.taxLevel === "total" && Array.isArray(extractedResult.taxes)
      ? {
        level: "total" as const,
        applied: "after" as const,
        taxes: extractedResult.taxes.map((t: any) => {
          const taxMeta = taxMap?.get(String(t.taxId));
          const taxRate = Number(t.taxRate ?? t.value ?? 0);
          return {
            taxId: t.taxId ? String(t.taxId) : "",
            taxName: t.taxName || taxMeta?.name || "",
            taxAbbreviation: taxMeta?.abbreviation,
            taxPercent: taxRate,
            taxUnit: (t.taxType ?? t.type ?? "percent") as "percent" | "value",
            originalTaxPercent: taxMeta?.rate ?? taxRate,
            originalTaxUnit: "percent" as const,
            isTaxOverridden: false,
          };
        }),
      }
      : undefined;

  const showInlineTax =
    (extractedResult.hasTax || (extractedResult.items || []).some((item: any) => item.itemTax?.length > 0))
    && extractedResult.taxLevel === "item";
  
  /* ---------------- ROUND OFF MODE ---------------- */

  const total = Number(extractedResult.total ?? 0);
  const roundoffTotal = Number(extractedResult.roundoffTotal ?? 0);
  const isRoundOff = Boolean(extractedResult.isRoundOff);

  let roundOffMode: "none" | "nearest" | "positive" | "negative" = "none";

  if (isRoundOff && total !== roundoffTotal) {
    const diff = roundoffTotal - total;

    if (Math.abs(diff) < 0.01) {
      roundOffMode = "nearest";
    } else if (diff > 0) {
      roundOffMode = "positive";
    } else {
      roundOffMode = "negative";
    }
  }

  /* ---------------- SUMMARY ---------------- */

  const summary: InvoiceSummary = {
    subtotal: rows.reduce((sum, r) => sum + r.quantity * r.price, 0),

    totalTax: extractedResult.taxes?.reduce((sum: number, t: any) => sum + Number(t.taxAmount ?? t.totalAmount ?? 0), 0) ?? 0,
    total: total,

    totalTdsValue: transactionTds?.totalValue ?? 0,
    totalDiscountValue: transactionDiscount?.totalValue ?? 0,

    invoiceTotal: total,
    roundoffTotal: roundoffTotal,

    taxBreakup: [],
    tdsBreakup: [],
  };

  /* ---------------- FINAL FORM STATE ---------------- */

  return {
    formType,

    header: {
      contactId: extractedResult.contactId ?? null,
      documentNo: extractedResult.documentNo ?? "",
      documentDate: toDayjs(extractedResult.documentDate)?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
      dueDate: toDayjs(extractedResult.dueDate)?.format("YYYY-MM-DD") || dayjs().add(1, "month").subtract(1, "day").format("YYYY-MM-DD"),
      serviceStartDate: toDayjs(extractedResult.serviceStartDate)?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
      serviceEndDate: toDayjs(extractedResult.serviceEndDate)?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
      currency: extractedResult.currency ?? "",
      fxRate: 1,
      originalFxRate: 1,
      notes: extractedResult.notes ?? "",
    },

    flags: {
      showInlineTds,
      showInlineDisc,
      showInlineTax,
    },

    transactionTds,
    transactionDiscount,
    transactionTax,

    roundOffMode,
    rowDiscountFactor: 1,
    rows: rows.length > 0 ? rows : [
      {
        id: crypto.randomUUID(),
        itemName: "",
        hsnSac: "",
        accountId: 0,
        quantity: 1,
        price: 0,
        taxes: [],
        tdsValue: 0,
        tdsUnit: "percent",
        discountValue: 0,
        discountUnit: "percent",
        rowTotal: 0,
      }
    ],
    summary,
  };
}

export type HeaderState = {
  serviceStartDate: string;
  serviceEndDate: string;
  contactId: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes?: string;
};
export interface InvoiceSummaryCardProps {
  selectedCurrency: string;
  formType: FormType;
  summary: InvoiceSummary;
  isTdsEnabled: string;
  isDiscEnabled: string;
}
export interface InvoiceSectionProps {
  selectedCurrency?: string;
  formType: FormType;
  showInlineTds: boolean;
  showInlineDisc: boolean;
  tdsLevel: TransactionLevel;
  discLevel: TransactionLevel;
  mode?: string;
}
export interface InvoiceRepeaterProps {
  selectedCurrency?: string;
  index: number;
  showHeader: boolean;
  row: InvoiceOrBillRow;
  showDelete: boolean;
  showInlineTds: boolean;
  showInlineDisc: boolean;
  onDelete: () => void;
  formType: FormType;
  showInlineTax?: boolean;
  taxLevel?: TransactionLevel,
}
export interface InvoiceCreatePayload extends TdsPayload, DiscountPayload, TaxPayload {
  contactId: number;

  invoiceNo: string;

  invoiceDate: string | null;
  invoiceDueDate: string | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;

  invoiceCurrency: string;
  fxRate: number;
  originalFxRate: number;

  notes?: string;

  hasTds: boolean;
  hasDiscount: boolean;

  invoiceTotal: string;

  isRoundOff: boolean;
  roundoffTotal: string;

  items: Array<{
    itemName: string;
    itemAccountId: number;
    hsnSac: string;
    quantity: string;
    unitPrice: string;
    itemTotal: string;
    itemTdsValue?: string;
    itemTdsType?: "percent" | "value";
    itemTax: {
      taxId: number;
      isOverride: boolean;
      type: "percent" | "value";
      value: number;
    }[];
  }>;
}
export interface BillCreatePayload extends TdsPayload, DiscountPayload, TaxPayload {
  contactId: number;

  billNo: string;
  billDate: string | null;
  billDueDate: string | null;

  serviceStartDate: string | null;
  serviceEndDate: string | null;
  billCurrency: string;

  fxRate: number;
  originalFxRate: number;

  notes?: string;

  hasTds: boolean;
  hasDiscount: boolean;

  billTotal: string;

  isRoundOff: boolean;
  roundoffTotal: string;

  items: Array<{
    itemName: string;
    itemAccountId: number;
    hsnSac: string;
    quantity: string;
    unitPrice: string;
    itemTotal: string;
    itemTdsValue?: string;
    itemTdsType?: "percent" | "value";
    itemDiscountAccountId?: number;
    itemTax: {
      taxId: number;
      isOverride: boolean;
      type: "percent" | "value";
      value: number;
    }[];
  }>;
}
// types for bill and invoice api
export type Contact = {
  name?: string;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
};

export type LineItem = {
  id?: number;
  name?: string; // invoice
  itemName?: string; // bill
  quantity?: number;
  unitPrice?: number;
  total?: number;
  itemTotal?: number;
  hsnSac?: string;
  account?: string;
  itemAccount?: {
    accountName?: string;
  };
};

export type Payment = {
  date?: string;
  debitAmount?: number;
  description?: string;
  account?: {
    accountName?: string;
  };
};

export type Tax = {
  taxId: number;
  taxName: string;
  abbreviation?: string;
  type: "percent" | "value";
  rateOrValue: number;
  totalAmount: number;
};

export type BillEntity = {
  id: number;
  billNo: string;
  billDate: string;
  billDueDate?: string;
  billCurrency?: string;
  notes?: string | null;
};

export type BillPreviewResponse = {
  bill: BillEntity & {
    contact?: Contact;
    items?: LineItem[];
    billTotal?: number;
    finalTotal?: number;
  };
  payments: Payment[];
  fxRate: number;
};

export type InvoiceEntity = {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  invoiceDueDate?: string;
  invoiceCurrency?: string;
  notes?: string | null;
};

export type InvoicePreviewResponse = {
  invoice: InvoiceEntity & {
    contact?: Contact;
    items?: LineItem[];
    invoiceTotal?: number;
    finalTotal?: number;
  };
  payments: Payment[];
  fxRate: number;
};

export type TotalsResponse = {
  subTotal?: number;
  discount?: number;

  // Bill-specific / Invoice-specific TDS
  billTds?: number;
  invoiceTds?: number;

  billTotal?: number;
  invoiceTotal?: number;
  finalTotal?: number;
  balanceDue?: number;
};
export interface PaymentAccount {
  id: number;
  accountName: string;
  accountCurrency: string;
}
export interface PaymentHistoryItem {
  date: string; // ISO date (YYYY-MM-DD)
  account: PaymentAccount;
  paymentId: string;
  creditAmount: string; // backend sends as string
  counterCurrency: string;
  counterCurrencyAmount: string;
  counterExchangeRate: string;
}
export interface PaymentContact {
  id: number;
  name: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phoneNumber: string;
  dialCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  contactBalance: string;
  isArchived: boolean;
  showInReports: boolean;
  gstin: string;
  isOrganization: boolean;
  economicTerritory: string;
  pan: string;
  tdsPrefillValue: number;
  reports: boolean;
  position: string | null;
}
export interface BillPaymentsData {
  paymentHistory: PaymentHistoryItem[];
  contact: Contact;
  balanceDue: number;
  billNo: string;
}
