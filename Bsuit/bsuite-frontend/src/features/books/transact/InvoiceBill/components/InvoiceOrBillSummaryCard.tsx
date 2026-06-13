import {
  Box,
  Button,
  IconButton,
  Skeleton,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { useGetAccountsQuery } from "../../../coa/account/api/accounts.api";
import { useEffect, useMemo, useState } from "react";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import type { InvoiceSummaryCardProps } from "../../utils/types";
import { useAppDispatch, useAppSelector } from "../../../../../store/store";

import {
  formatCurrencyByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
  roundToTwoDecimals,
  validatePercentNumber,
} from "../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import {
  overrideTransactionTax,
  recalculateSummary,
  setRoundOffMode,
  setTransactionDiscount,
  setTransactionTax,
  setTransactionTds,
} from "../../slice/InvoiceOrBillSlice";
import { applyFxAndRoundOff } from "../../utils/calculations";
import { DiffAmount } from "./DiffComponent";
import AddTaxDialog from "../../../coa/tax/components/AddTaxDialog";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import { useAllAccountOptions } from "../../transactHome/hooks/useAllAccountOptions";
import { useAddTaxMutation } from "../../../coa/tax/tax.api";
import { Add, Edit } from "@mui/icons-material";

export default function InvoiceSummaryCard({
  selectedCurrency,
  summary,
  isTdsEnabled,
  isDiscEnabled,
  formType,
  fxRate,
  companyCurrencyCode,
  selectedCurrencyCode,
  companyCurrencySymbol,
  showTotal,
  fxLoading,
  isTaxEnabled,
}: InvoiceSummaryCardProps & {
  fxRate?: number | null;
  companyCurrencyCode?: string;
  selectedCurrencyCode?: string;
  companyCurrencySymbol?: string;
  showTotal: boolean;
  fxLoading: boolean;
  isTaxEnabled?: string;
}) {
  const dispatch = useAppDispatch();

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const { transactionTds, transactionDiscount, transactionTax, roundOffMode } =
    useAppSelector((s) => s.invoiceForm);

  const { data: iData } = useGetAccountsQuery({ type: "Income" });
  const { data: eData } = useGetAccountsQuery({ type: "Expense" });

  const { taxesData: tData, refetchTaxes } = useAllAccountOptions(
    undefined,
    true,
    "full"
  );
  const [addTaxApi] = useAddTaxMutation();

  const [openAddTax, setOpenAddTax] = useState(false);
  const [openTaxOverride, setOpenTaxOverride] = useState(false);
  const [draftOverrides, setDraftOverrides] = useState<Record<string, { value: string | number; unit: "percent" | "value" }>>({});
  const [discountInput, setDiscountInput] = useState<string>("");
  const [tdsInput, setTdsInput] = useState<string>("");

  useEffect(() => {
    const v = transactionDiscount?.value;
    if (v != null && v > 0) {
      setDiscountInput(String(v));
    } else {
      setDiscountInput("");
    }
  }, [transactionDiscount?.value]);

  useEffect(() => {
    const v = transactionTds?.value;
    if (v != null && v > 0) {
      setTdsInput(String(v));
    } else {
      setTdsInput("");
    }
  }, [transactionTds?.value]);

  const taxMap = useMemo(() => {
    const map = new Map<string, { taxRate: number; taxName: string; taxAbbreviation?: string }>();
    tData?.data?.forEach((tax: any) => {
      map.set(String(tax.id), {
        taxRate: tax.taxRate,
        taxName: tax.taxName,
        taxAbbreviation: tax.abbreviation,
      });
    });
    return map;
  }, [tData]);

  const taxGroup = useMemo(() => {
    const taxes = tData?.data || [];
    return [
      {
        label: "TAXES",
        options: taxes.length
          ? taxes.map((t: any) => ({
            label: t.abbreviation,
            value: `tax_${t.id}`,
          }))
          : [{ label: "No taxes found", value: "__no_tax__", disabled: true }],
      },
    ];
  }, [tData]);

  const incomeAccountGroup = useMemo(() => {
    const accounts = iData?.data || [];
    if (!accounts.length) return [];
    return [
      {
        label: "INCOME",
        options: accounts.map((acc: any) => {
          const currencySymbol =
            acc.accountCurrency?.split("-")[0]?.trim() || "";
          return {
            label: currencySymbol
              ? `${acc.accountName} (${currencySymbol})`
              : acc.accountName,
            value: `account_${acc.id}`,
          };
        }),
      },
    ];
  }, [iData]);

  const expenseAccountGroup = useMemo(() => {
    const accounts = eData?.data || [];
    if (!accounts.length) return [];

    return [
      {
        label: "EXPENSE",
        options: accounts.map((acc: any) => {
          const currencySymbol =
            acc.accountCurrency?.split("-")[0]?.trim() || "";

          return {
            label: currencySymbol
              ? `${acc.accountName} (${currencySymbol})`
              : acc.accountName,
            value: `account_${acc.id}`,
          };
        }),
      },
    ];
  }, [eData]);

  // Group TDS by same percentage/rate and sum amounts (one row per rate)
  const tdsBreakupGrouped = useMemo(() => {
    const list = summary.tdsBreakup ?? [];
    const byKey = new Map<
      string,
      { name: string; tdsUnit: string; rateOrValue: number; value: number }
    >();
    for (const tds of list) {
      const key = `${tds.tdsUnit ?? "percent"}_${tds.rateOrValue ?? 0}`;
      const existing = byKey.get(key);
      const val = Number(tds.value ?? 0);
      if (existing) {
        existing.value = roundToTwoDecimals(existing.value + val);
      } else {
        byKey.set(key, {
          name: tds.name ?? "TDS",
          tdsUnit: tds.tdsUnit ?? "percent",
          rateOrValue: Number(tds.rateOrValue ?? 0),
          value: roundToTwoDecimals(val),
        });
      }
    }
    return Array.from(byKey.values());
  }, [summary.tdsBreakup]);

  const accountId = useAppSelector(
    (state) => state.invoiceForm.transactionDiscount?.accountId,
  );

  const { convertedTotal, convertedFinalTotal, roundOff, finalTotal } =
    applyFxAndRoundOff(
      summary.total,
      selectedCurrencyCode !== companyCurrencyCode ? fxRate : null,
      roundOffMode,
    );

  useEffect(() => {
    dispatch(recalculateSummary());
  }, [fxRate, dispatch]);


  const roundUp = applyFxAndRoundOff(
    summary.total,
    selectedCurrencyCode !== companyCurrencyCode ? fxRate : null,
    "positive",
  );

  const roundDown = applyFxAndRoundOff(
    summary.total,
    selectedCurrencyCode !== companyCurrencyCode ? fxRate : null,
    "negative",
  );

  const DiscountBlock = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        mt: "12px",
        mb: 1,
      }}
    >
      {/* TOP: Discount Controls Row */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* LEFT */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Discount</Typography>

          {(summary.taxBreakup?.length > 0 || summary.tdsBreakup?.length > 0) && (
            <Typography
              variant="caption"
              sx={{
                cursor: "pointer",
                color: "primary.main",
                mt: 0.3,
                display: "inline-block",
                transition: "color 0.15s ease",
                "&:hover": { color: "primary.dark", opacity: 0.85 },
                "&:active": { opacity: 0.7 },
              }}
              onClick={() => {
                if (!transactionDiscount) return;
                dispatch(
                  setTransactionDiscount({
                    unit: transactionDiscount.unit ?? "percent",
                    value: transactionDiscount.value ?? 0,
                    applied:
                      transactionDiscount.applied === "before" ? "after" : "before",
                    accountId: transactionDiscount.accountId,
                  }),
                );
                dispatch(recalculateSummary());
              }}
            >
              {transactionDiscount?.applied === "before"
                ? "Apply after tax"
                : "Apply before tax"}
            </Typography>
          )}
        </Box>

        {/* MIDDLE */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 2 }}>
          <SingleSelectElement
            required
            label="Account"
            value={accountId ? `account_${accountId}` : ""}
            onChange={(val) => {
              if (!transactionDiscount) return;
              dispatch(
                setTransactionDiscount({
                  unit: transactionDiscount.unit ?? "percent",
                  value: transactionDiscount.value ?? 0,
                  applied: transactionDiscount.applied ?? "after",
                  accountId: Number(val.replace("account_", "")),
                }),
              );
              dispatch(recalculateSummary());
            }}
            options={
              formType === "Invoice" ? incomeAccountGroup : expenseAccountGroup
            }
            sx={{ width: "40%" }}
          />

          <TextFieldElement
            type="text"
            sx={{ "& input": { textAlign: "right" }, flex: 1 }}
            label="Discount"
            value={formatNumberForTyping(String(discountInput ?? ""), commaSeparation)}
            onChange={(e) => {
              const raw = parseNumberForTyping(e.target.value);
              setDiscountInput(raw);
              const unit = transactionDiscount?.unit ?? "percent";
              const value =
                unit === "percent"
                  ? validatePercentNumber(raw, unit)
                  : !raw
                    ? 0
                    : roundToTwoDecimals(parseFloat(raw) || 0);
              dispatch(
                setTransactionDiscount({
                  value,
                  unit,
                }),
              );
              dispatch(recalculateSummary());
            }}
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                },
              },
              input: {
                endAdornment: (
                  <Box
                    component="select"
                    value={transactionDiscount?.unit ?? "percent"}
                    onChange={(e) => {
                      const newUnit = e.target.value as "percent" | "value";
                      setDiscountInput("");
                      dispatch(
                        setTransactionDiscount({
                          unit: newUnit,
                          value: 0,
                        }),
                      );
                      dispatch(recalculateSummary());
                    }}
                    sx={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <option value="percent">%</option>
                    <option value="value">{selectedCurrency}</option>
                  </Box>
                ),
              },
            }}
          />
        </Box>

        {/* RIGHT — same design for both before and after tax */}
        <Typography sx={{ flex: 1, textAlign: "end" }}>
          {summary.totalDiscountValue > 0
            ? `-${formatCurrencyByCommaSeparation(
              summary.totalDiscountValue.toFixed(2),
              commaSeparation,
              selectedCurrency,
            )}`
            : ""}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {fxLoading ? (
        <Box
          sx={{
            backgroundColor: "#f3f2f2ff",
            borderRadius: "5px",
            padding: "13px",
            mt: 1,
            mb: 2,
            width: "50%",
            alignSelf: "flex-end",
          }}
        >
          {/* Subtotal skeleton */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: "15px",
            }}
          >
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="text" width={80} height={20} />
          </Box>

          {/* Example of discount/TDS placeholders */}
          <Skeleton
            variant="rectangular"
            height={24}
            sx={{ mb: 1, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={24}
            sx={{ mb: 1, borderRadius: 1 }}
          />

          {/* Total row skeleton */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mt: "10px",
              mb: "15px",
            }}
          >
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>

          {/* Round-off section placeholder */}
          <Skeleton
            variant="rectangular"
            height={40}
            sx={{ borderRadius: 1 }}
          />

          {/* Converted total skeleton */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mt: "10px",
            }}
          >
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            backgroundColor: "#f3f2f2ff",
            borderRadius: "5px",
            padding: "13px",
            mt: 1,
            mb: 2,
            width: "50%",
            alignSelf: "flex-end",
          }}
        >
          {/* Subtotal */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              ...(transactionDiscount?.applied === "before"
                ? { mb: "0px" }
                : { mb: "15px" }),
            }}
          >
            <Typography variant="subtitle2">Subtotal</Typography>
            <DiffAmount
              original={summary.originalSubtotal}
              value={summary.subtotal}
              formatter={(v) =>
                formatCurrencyByCommaSeparation(
                  v.toFixed(2),
                  commaSeparation,
                  selectedCurrency,
                )
              }
            />
          </Box>

          {isDiscEnabled === "transaction" &&
            transactionDiscount?.applied === "before" &&
            DiscountBlock}

          {isTaxEnabled === "transaction" && (
            // Tax selector row 
            <Box sx={{ display: "flex", justifyContent: 'space-between', alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>Tax</Typography>
              <Box sx={{ flex: 2, display: "flex", alignItems: "center", gap: 0.5 }}>
                <MultiSelectElement
                  value={(transactionTax?.taxes ?? []).map((t) => `tax_${t.taxId}`)}
                  highlightedValues={(transactionTax?.taxes ?? []).filter((t) => t.isTaxOverridden)}
                  onChange={(taxIds: string[]) => {
                    const currentTaxes = transactionTax?.taxes ?? [];
                    const taxes = taxIds
                      .map((id) => {
                        const taxId = id.replace("tax_", "");
                        const existing = currentTaxes.find((t) => String(t.taxId) === taxId);
                        const tax = taxMap.get(taxId);
                        if (!tax) return null;
                        if (existing) return existing;
                        return {
                          taxId,
                          taxName: tax.taxName,
                          taxAbbreviation: tax.taxAbbreviation,
                          taxPercent: tax.taxRate,
                          taxUnit: "percent" as const,
                          originalTaxPercent: tax.taxRate,
                          originalTaxUnit: "percent" as const,
                          isTaxOverridden: false,
                        };
                      })
                      .filter((t): t is NonNullable<typeof t> => !!t);

                    dispatch(setTransactionTax({ taxes, applied: transactionTax?.applied ?? "after" }));
                    dispatch(recalculateSummary());
                  }}
                  options={taxGroup}
                  width='100%'
                  label="Tax"
                />
                <IconButton size="small" onClick={() => setOpenAddTax(true)} title="Add new tax">
                  <Add fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    const initialDraft: any = {};
                    (transactionTax?.taxes ?? []).forEach((t) => {
                      initialDraft[t.taxId] = { value: String(t.taxPercent), unit: t.taxUnit ?? "percent" };
                    });
                    setDraftOverrides(initialDraft);
                    setOpenTaxOverride(true);
                  }}
                  disabled={!(transactionTax?.taxes?.length)}
                  title="Override tax"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
              {/* RIGHT: Empty space to match layout */}
              <Box sx={{ flex: 1 }} />
            </Box>
          )}

          {isDiscEnabled === "transaction" &&
            transactionDiscount?.applied === "after" &&
            DiscountBlock}

          {/* TDS */}
          {isTdsEnabled === "transaction" && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: "15px",
              }}
            >
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                TDS
              </Typography>

              <Box sx={{ flex: 2 }}>
                <TextFieldElement
                  type="text"
                  sx={{ "& input": { textAlign: "right" } }}
                  label="TDS"
                  value={formatNumberForTyping(String(tdsInput ?? ""), commaSeparation)}
                  onChange={(e) => {
                    const raw = parseNumberForTyping(e.target.value);
                    setTdsInput(raw);
                    const unit = transactionTds?.unit ?? "percent";
                    const value =
                      unit === "percent"
                        ? validatePercentNumber(raw, unit)
                        : !raw
                          ? 0
                          : roundToTwoDecimals(parseFloat(raw) || 0);
                    dispatch(
                      setTransactionTds({
                        value,
                        unit,
                      }),
                    );
                    dispatch(recalculateSummary());
                  }}
                  width="100%"
                  slotProps={{
                    htmlInput: {
                      inputMode: "decimal",
                      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                      },
                    },
                    input: {
                      endAdornment: (
                        <Box
                          component="select"
                          value={transactionTds?.unit ?? "percent"}
                          onChange={(e) => {
                            const newUnit = e.target.value as
                              | "percent"
                              | "value";
                            setTdsInput("");
                            dispatch(
                              setTransactionTds({
                                unit: newUnit,
                                value: 0,
                              }),
                            );
                            dispatch(recalculateSummary());
                          }}
                          sx={{
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <option value="percent">%</option>
                          <option value="value">{selectedCurrency}</option>
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>

              <Box
                sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
              >
                <DiffAmount
                  original={null}
                  value={summary.totalTdsValue}
                  formatter={(v) =>
                    `-${formatCurrencyByCommaSeparation(
                      v.toFixed(2),
                      commaSeparation,
                      selectedCurrency,
                    )}`
                  }
                />
              </Box>
            </Box>
          )}

          {isTdsEnabled === "item" && tdsBreakupGrouped.length > 0 && (
            <Box
              sx={{ mb: "15px", pt: "8px", borderTop: "1px dashed #d0d0d0" }}
            >
              {tdsBreakupGrouped.map((tds, idx) => (
                <Box
                  key={`${tds.name}-${tds.tdsUnit}-${tds.rateOrValue}-${idx}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle2">
                    {tds.name} (
                    {tds.tdsUnit === "percent"
                      ? `${tds.rateOrValue}%`
                      : `${selectedCurrency}${tds.rateOrValue}`}
                    )
                  </Typography>
                  <Typography>
                    -
                    {formatCurrencyByCommaSeparation(
                      tds.value.toFixed(2),
                      commaSeparation,
                      selectedCurrency,
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}


          {/* Tax Override Modal */}
          <ModalElement
            open={openTaxOverride}
            title="Tax Override"
            maxWidth="xs"
            onClose={() => setOpenTaxOverride(false)}
          >
            <Box display="flex" flexDirection="column" gap={3}>
              {(transactionTax?.taxes ?? []).map((tax) => {
                const draft = draftOverrides[tax.taxId] || { value: "", unit: "percent" };
                return (
                  <TextFieldElement
                    key={tax.taxId}
                    fullWidth
                    label={`${tax.taxName} Override`}
                    value={draft.value?.toString() ?? ""}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const validatedValue =
                        draft.unit === "percent"
                          ? validatePercentNumber(rawValue, "percent")
                          : rawValue === "" ? 0 : Number(rawValue) || 0;
                      setDraftOverrides((prev) => ({
                        ...prev,
                        [tax.taxId]: { ...prev[tax.taxId], value: validatedValue, unit: draft.unit },
                      }));
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <Box sx={{ display: "flex", alignItems: "center", borderLeft: "1px solid #e0e0e0", pl: 1 }}>
                            <Box
                              component="select"
                              value={draft.unit}
                              onChange={(e) => {
                                setDraftOverrides((prev) => ({
                                  ...prev,
                                  [tax.taxId]: { ...prev[tax.taxId], unit: e.target.value as "percent" | "value", value: "" },
                                }));
                              }}
                              sx={{ border: "none", outline: "none", background: "transparent", fontWeight: 600, cursor: "pointer" }}
                            >
                              <option value="percent">%</option>
                              <option value="value">{selectedCurrency}</option>
                            </Box>
                          </Box>
                        ),
                      },
                    }}
                  />
                );
              })}
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={() => {
                    Object.entries(draftOverrides).forEach(([taxId, d]) => {
                      dispatch(overrideTransactionTax({
                        taxId,
                        taxPercent: Number(d.value),
                        taxUnit: d.unit,
                      }));
                    });
                    dispatch(recalculateSummary());
                    setOpenTaxOverride(false);
                  }}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </ModalElement>

          {/* Add Tax Dialog */}
          <AddTaxDialog
            open={openAddTax}
            onClose={() => setOpenAddTax(false)}
            onSubmit={async (taxData) => {
              try {
                const response = await addTaxApi({
                  taxName: String(taxData.taxName),
                  abbreviation: String(taxData.abbreviation),
                  taxNumber: Number(taxData.taxNumber),
                  taxRate: Number(taxData.taxRate),
                }).unwrap();

                const newTaxId = response?.data?.id;
                if (!newTaxId) return;

                const result = await refetchTaxes();
                const refreshedTaxes = result?.data?.data || [];
                const newTax = refreshedTaxes.find((t: any) => String(t.id) === String(newTaxId));

                if (newTax) {
                  const currentTaxes = transactionTax?.taxes ?? [];
                  dispatch(setTransactionTax({
                    taxes: [
                      ...currentTaxes,
                      {
                        taxId: String(newTaxId),
                        taxName: newTax.taxName,
                        taxAbbreviation: newTax.abbreviation,
                        taxPercent: newTax.taxRate,
                        taxUnit: "percent" as const,
                        originalTaxPercent: newTax.taxRate,
                        originalTaxUnit: "percent" as const,
                        isTaxOverridden: false,
                      },
                    ],
                    applied: transactionTax?.applied ?? "after",
                  }));
                  dispatch(recalculateSummary());
                }
                setOpenAddTax(false);
              } catch (error) {
                console.error("Failed to add tax", error);
              }
            }}
          />

          {summary.taxBreakup.map((tax) => {
            const original = summary.originalTaxBreakup?.find(
              (t) => t.taxId === tax.taxId && t.rate === tax.rate,
            );

            return (
              <Box
                key={`${tax.taxId}-${tax.unit}-${tax.rate}`}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="subtitle2">
                  {tax.abbreviation || tax.name}
                  {tax.unit === "percent" ? ` (${tax.rate}%)` : ""}
                </Typography>

                <DiffAmount
                  original={
                    transactionDiscount?.applied === "before"
                      ? original?.value
                      : null
                  }
                  value={tax.value}
                  formatter={(v) =>
                    formatCurrencyByCommaSeparation(
                      v.toFixed(2),
                      commaSeparation,
                      selectedCurrency,
                    )
                  }
                />
              </Box>
            );
          })}


          {/* Total */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: "15px",
              mt: "10px",
            }}
          >
            <Typography variant="subtitle2">Total</Typography>

            {/* RIGHT SIDE */}
            <Box sx={{ textAlign: "right" }}>
              {/* Converted total (before round off) */}
              <Typography>
                {formatCurrencyByCommaSeparation(
                  summary.total.toFixed(2),
                  commaSeparation,
                  selectedCurrency,
                )}
              </Typography>

              {/* Round-off delta */}
              {roundOff !== 0 && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    color:
                      roundOff > 0
                        ? "success.main"
                        : roundOff < 0
                          ? "error.main"
                          : "text.secondary",
                  }}
                >
                  {roundOff > 0 ? "+" : ""}
                  {formatCurrencyByCommaSeparation(
                    roundOff.toFixed(2),
                    commaSeparation,
                  )}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Round off */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
            {/* ROW 1: Label + Switch + Toggle buttons */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {/* LEFT: Label + Switch */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="subtitle2">Round off</Typography>
                <Switch
                  size="small"
                  checked={roundOffMode !== "none"}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      dispatch(setRoundOffMode("none"));
                    } else {
                      dispatch(setRoundOffMode("nearest"));
                    }
                    dispatch(recalculateSummary());
                  }}
                />
              </Box>

              {/* RIGHT: Toggle buttons */}
              <Box
                sx={{
                  visibility: roundOffMode !== "none" ? "visible" : "hidden",
                }}
              >
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={roundOffMode}
                  onChange={(_, value) => {
                    if (!value) return;
                    dispatch(setRoundOffMode(value));
                    dispatch(recalculateSummary());
                  }}
                  sx={{ minHeight: 20 }}
                >
                  <ToggleButton
                    value="negative"
                    sx={{
                      textTransform: "none",
                      backgroundColor: "rgba(244, 67, 54, 0.08)",
                      "&.Mui-selected": {
                        backgroundColor: "rgba(244, 67, 54, 0.18)",
                        color: "error.main",
                        fontWeight: 600,
                      },
                      "&.Mui-selected:hover": { backgroundColor: "rgba(244, 67, 54, 0.22)" },
                    }}
                  >
                    −{formatCurrencyByCommaSeparation(Math.abs(roundDown.roundOff).toFixed(2), commaSeparation)}
                  </ToggleButton>

                  <ToggleButton
                    value="positive"
                    sx={{
                      textTransform: "none",
                      backgroundColor: "rgba(76, 175, 80, 0.08)",
                      "&.Mui-selected": {
                        backgroundColor: "rgba(76, 175, 80, 0.18)",
                        color: "success.main",
                        fontWeight: 600,
                      },
                      "&.Mui-selected:hover": { backgroundColor: "rgba(76, 175, 80, 0.22)" },
                    }}
                  >
                    +{formatCurrencyByCommaSeparation(roundUp.roundOff.toFixed(2), commaSeparation)}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            {/* ROW 2: Final rounded total — always on its own line */}
            {roundOffMode !== "none" && (
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Typography fontWeight={600} variant="subtitle1">
                  {formatCurrencyByCommaSeparation(
                    finalTotal.toFixed(2),
                    commaSeparation,
                    selectedCurrency,
                  )}
                </Typography>
              </Box>
            )}
          </Box>

          {showTotal && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: "15px",
                mt: "10px",
              }}
            >
              <Typography variant="subtitle2">
                Total (In {companyCurrencyCode})
              </Typography>

              {/* RIGHT SIDE */}
              <Box sx={{ textAlign: "right" }}>
                {/* Converted total (before round off) */}
                <Typography>
                  {formatCurrencyByCommaSeparation(
                    (roundOffMode !== "none"
                      ? convertedFinalTotal
                      : convertedTotal
                    ).toFixed(2),
                    commaSeparation,
                    companyCurrencySymbol || selectedCurrency,
                  )}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </>
  );
}