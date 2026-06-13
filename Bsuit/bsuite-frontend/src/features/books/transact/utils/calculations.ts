import type { InvoiceFormState, InvoiceOrBillRow } from "./types";

export function computeRowTotal(
  row: InvoiceOrBillRow,
  discountFactor = 1
) {
  const base = round2(row.quantity * row.price);

  let discountedBase = base;
  if (row.discountValue && row.discountValue > 0) {
    if (row.discountUnit === "percent") {
      discountedBase = round2(base * (1 - row.discountValue / 100));
    } else {
      discountedBase = round2(Math.max(0, base - row.discountValue));
    }
  }

  const total = round2(discountedBase * discountFactor);

  return {
    base,
    discountedBase,
    total,
  };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function getTotalLevelTds(
  tds?: InvoiceFormState["transactionTds"]
): { value: number; unit: "percent" | "value" } | undefined {
  if (!tds) return undefined;
  if (tds.level !== "total") return undefined;
  if (tds.value == null || tds.unit == null) return undefined;

  return {
    value: tds.value,
    unit: tds.unit,
  };
}

export function getTotalLevelDiscount(
  discount?: InvoiceFormState["transactionDiscount"]
): {
  value: number;
  unit: "percent" | "value";
  applied: "before" | "after";
} | undefined {
  if (!discount) return undefined;
  if (discount.level !== "total") return undefined;
  if (discount.value == null || discount.unit == null) return undefined;

  return {
    value: discount.value,
    unit: discount.unit,
    applied: discount.applied ?? "after", // default safety
  };
}

export function applyFxAndRoundOff(
  baseTotal: number,
  fxRate: number | null | undefined,
  roundOffMode: "none" | "positive" | "negative" | "nearest"
) {
  // Step 1: Apply round-off logic in original currency
  let roundOff = 0;
  let finalTotal = baseTotal;

  if (roundOffMode === "positive") {
    roundOff = Math.ceil(baseTotal) - baseTotal;
    finalTotal = Math.ceil(baseTotal);
  } else if (roundOffMode === "negative") {
    roundOff = Math.floor(baseTotal) - baseTotal;
    finalTotal = Math.floor(baseTotal);
  } else if (roundOffMode === "nearest") {
    roundOff = Math.round(baseTotal) - baseTotal;
    finalTotal = Math.round(baseTotal);
  }

  // Step 2: Only after round-off, apply FX conversion (if needed)
  const convertedTotal = fxRate ? baseTotal * fxRate : baseTotal;
  const convertedFinalTotal = fxRate ? finalTotal * fxRate : finalTotal;

  return {
    // For display in selectedCurrency
    roundOff: round2(roundOff),
    finalTotal: round2(finalTotal),

    // For reference in company currency (if needed)
    convertedTotal: round2(convertedTotal),
    convertedFinalTotal: round2(convertedFinalTotal),
  };
}

export function computeInvoiceSummary(
  rows: InvoiceOrBillRow[],
  transactionTds?: { value: number; unit: "percent" | "value" },
  transactionDiscount?: { value: number; unit: "percent" | "value"; applied: "before" | "after" },
  roundOffMode: "none" | "positive" | "negative" | "nearest" = "none",
  tdsLevel?: "item" | "total" | "none",
  transactionTax?: {
    level: "total";
    taxes: Array<{
      taxId: string;
      taxName: string;
      taxPercent: number;
      taxUnit: "percent" | "value";
      taxAbbreviation?: string;
      isTaxOverridden?: boolean;
    }>;
    applied: "before" | "after";
  },
  taxLevel?: "item" | "total" | "none",
  discLevel?: "item" | "total" | "none"
) {
  let subtotal = 0;
  let grossSubtotal = 0;
  let effectiveTax = 0;
  let totalDiscount = 0;
  let totalTds = 0;

  const taxBreakupMap = new Map<string, any>();
  const tdsBreakup: any[] = [];

  /* ---------- ROW LOOP: SUBTOTAL + ITEM-LEVEL TAX + ITEM-LEVEL TDS ---------- */
  rows.forEach((row, index) => {
    const base = round2(row.quantity * row.price);
    grossSubtotal += base;

    // For item-level discount: use discountedBase for subtotal and tax calculation
    let rowBase = base;
    if (discLevel === "item" && row.discountValue && row.discountValue > 0) {
      if (row.discountUnit === "percent") {
        rowBase = round2(base * (1 - row.discountValue / 100));
      } else {
        rowBase = round2(Math.max(0, base - row.discountValue));
      }
      totalDiscount = round2(totalDiscount + (base - rowBase));
    }

    subtotal += rowBase;

    row.taxes?.forEach((tax) => {
      const taxAmount = round2(
        tax.taxUnit === "value"
          ? tax.taxPercent
          : (rowBase * tax.taxPercent) / 100
      );
      effectiveTax += taxAmount;

      const key = `${tax.taxId}|${tax.taxUnit}|${tax.taxPercent}|${tax.taxName}`;
      if (!taxBreakupMap.has(key)) {
        taxBreakupMap.set(key, {
          taxId: tax.taxId,
          name: tax.taxName,
          unit: tax.taxUnit,
          rate: tax.taxPercent,
          abbreviation: tax.taxAbbreviation,
          value: 0,
        });
      }
      taxBreakupMap.get(key).value += taxAmount;
    });

    if (tdsLevel === "item" && row.tdsValue) {
      const tdsAmount = round2(
        row.tdsUnit === "percent"
          ? (rowBase * row.tdsValue) / 100
          : row.tdsValue
      );
      totalTds += tdsAmount;
      tdsBreakup.push({
        source: "row",
        rowIndex: index,
        name: "TDS",
        tdsUnit: row.tdsUnit,
        rateOrValue: `${row.tdsValue}`,
        value: tdsAmount,
      });
    }
  });

  const originalSubtotal = round2(discLevel === "item" ? grossSubtotal : subtotal);
  const originalTax = round2(effectiveTax);
  const originalTds = round2(totalTds);

  const originalTaxBreakup = Array.from(taxBreakupMap.values()).map((t) => ({
    ...t,
    value: round2(t.value),
  }));

  subtotal = round2(subtotal);
  effectiveTax = round2(effectiveTax);

  let effectiveSubtotal = subtotal;

  /* ---------- DISCOUNT ---------- */
  if (discLevel !== "item" && transactionDiscount && transactionDiscount.value > 0) {
    if (transactionDiscount.applied === "before") {
      totalDiscount = round2(
        transactionDiscount.unit === "percent"
          ? (subtotal * transactionDiscount.value) / 100
          : transactionDiscount.value
      );

      effectiveSubtotal = round2(subtotal - totalDiscount);

      // Recompute item-level taxes on discounted base
      effectiveTax = 0;
      taxBreakupMap.clear();

      rows.forEach((row) => {
        const rowBase = round2(row.quantity * row.price);
        if (rowBase <= 0) return;

        const proportion = rowBase / originalSubtotal;
        const discountedBase = round2(proportion * effectiveSubtotal);

        row.taxes?.forEach((tax) => {
          const taxAmount = round2(
            tax.taxUnit === "value"
              ? tax.taxPercent
              : (discountedBase * tax.taxPercent) / 100
          );

          effectiveTax += taxAmount;

          const key = `${tax.taxId}|${tax.taxUnit}|${tax.taxPercent}|${tax.taxName}`;
          if (!taxBreakupMap.has(key)) {
            taxBreakupMap.set(key, {
              taxId: tax.taxId,
              name: tax.taxName,
              unit: tax.taxUnit,
              rate: tax.taxPercent,
              abbreviation: tax.taxAbbreviation,
              value: 0,
            });
          }
          taxBreakupMap.get(key)!.value += taxAmount;
        });
      });

      effectiveTax = round2(effectiveTax);
    } else {
      // "after": discount applied on subtotal + tax
      const discountBase = round2(subtotal + effectiveTax);
      totalDiscount = round2(
        transactionDiscount.unit === "percent"
          ? (discountBase * transactionDiscount.value) / 100
          : transactionDiscount.value
      );
    }
  }

  /* ---------- TRANSACTION-LEVEL TAX (after discount so base is correct) ---------- */
  if (taxLevel === "total" && transactionTax?.taxes?.length) {
    const taxBase =
      transactionDiscount?.applied === "before"
        ? effectiveSubtotal
        : subtotal;

    transactionTax.taxes.forEach((tax) => {
      const txAmount =
        tax.taxUnit === "percent"
          ? round2((taxBase * tax.taxPercent) / 100)
          : tax.taxPercent;

      effectiveTax = round2(effectiveTax + txAmount);

      const key = `${tax.taxId}|${tax.taxUnit}|${tax.taxPercent}|${tax.taxName}`;
      taxBreakupMap.set(key, {
        taxId: tax.taxId,
        name: tax.taxName,
        unit: tax.taxUnit,
        rate: tax.taxPercent,
        abbreviation: tax.taxAbbreviation ?? tax.taxName,
        value: txAmount,
        isTaxOverridden: tax.isTaxOverridden,
      });
    });
  }

  /* ---------- TRANSACTION-LEVEL TDS ---------- */
  if (tdsLevel === "total" && transactionTds?.value) {
    const tdsBase = round2(
      discLevel === "item"
        ? subtotal
        : transactionDiscount?.applied === "before"
          ? effectiveSubtotal
          : originalSubtotal
    );

    const tdsAmount = round2(
      transactionTds.unit === "percent"
        ? (tdsBase * transactionTds.value) / 100
        : transactionTds.value
    );

    totalTds += tdsAmount;

    tdsBreakup.push({
      source: "transaction",
      name: "TDS",
      tdsUnit: transactionTds.unit,
      rateOrValue: `${transactionTds.value}`,
      value: tdsAmount,
    });
  }

  /* ---------- FINAL TOTAL ---------- */
  const roundedSubtotal =
  discLevel === "item"
    ? round2(subtotal)
    : transactionDiscount?.applied === "before"
      ? round2(effectiveSubtotal)
      : round2(subtotal);

  const roundedTax = round2(effectiveTax);
  const roundedDiscount = round2(totalDiscount);
  const roundedTds = round2(totalTds);

  const total =
    discLevel === "item"
      ? subtotal + roundedTax - roundedTds
      : transactionDiscount?.applied === "before"
        ? roundedSubtotal + roundedTax - roundedTds
        : roundedSubtotal + roundedTax - roundedDiscount - roundedTds;

  return {
    subtotal: roundedSubtotal,

    originalSubtotal:
      discLevel === "item"
        ? undefined
        : transactionDiscount?.applied === "before" ? originalSubtotal : undefined,
    originalTax:
      transactionDiscount?.applied === "before" ? originalTax : undefined,
    originalTds:
      transactionDiscount?.applied === "before" ? originalTds : undefined,

    totalTax: roundedTax,
    totalDiscount: roundedDiscount,
    totalTds: roundedTds,
    total: round2(total),
    roundOff: round2(total),

    taxBreakup: Array.from(taxBreakupMap.values()).map((t) => ({
      ...t,
      value: round2(t.value),
    })),

    originalTaxBreakup:
      transactionDiscount?.applied === "before" ? originalTaxBreakup : undefined,

    tdsBreakup,
  };
}