import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState, useEffect, useCallback } from "react";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { Add, Delete, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useGetAccountsQuery } from "../../../coa/account/api/accounts.api";
import type { InvoiceRepeaterProps } from "../../utils/types";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import Edit from "@mui/icons-material/Edit";
import { AccountForm } from "../../../coa/account/components/AccountForm";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { skipToken } from "@reduxjs/toolkit/query";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import { useAppDispatch, useAppSelector } from "../../../../../store/store";
import {
  overrideTaxes,
  recalculateRow,
  recalculateSummary,
  updateRow,
} from "../../slice/InvoiceOrBillSlice";
import {
  formatNumberByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
  roundToTwoDecimals,
  validatePercentNumber,
} from "../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { DiffAmount } from "./DiffComponent";
import { useAllAccountOptions } from "../../transactHome/hooks/useAllAccountOptions";
import AddTaxDialog from "../../../coa/tax/components/AddTaxDialog";
import { useAddTaxMutation } from "../../../coa/tax/tax.api";

export default function InvoiceRepeater({
  selectedCurrency,
  row,
  index,
  showHeader,
  showDelete,
  showInlineTds,
  showInlineDisc,
  onDelete,
  formType,
  showInlineTax,
  taxLevel,
}: InvoiceRepeaterProps) {
  const [openAddAccount, setOpenAddAccount] = useState(false);
  const [openAddTax, setOpenAddTax] = useState(false);
  const [openTaxOverride, setOpenTaxOverride] = useState(false);
  const [draftOverrides, setDraftOverrides] = useState<
    Record<
      string,
      {
        value: string | number;
        unit: "percent" | "value";
      }
    >
  >({});

  const [priceInput, setPriceInput] = useState<string>("");
  const [tdsInput, setTdsInput] = useState<string>("");
  const [discountInput, setDiscountInput] = useState<string>("");
  const [discountAccountOpen, setDiscountAccountOpen] = useState(false);

  // Fetch header data to get commaSeparation setting
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const [addTaxApi] = useAddTaxMutation();

  useEffect(() => {
    if (row.price > 0) {
      setPriceInput(row.price.toString());
    }
  }, [row.id]);

  useEffect(() => {
    if (row.tdsValue > 0) {
      setTdsInput(row.tdsValue.toString());
    } else {
      setTdsInput("");
    }
  }, [row.id, row.tdsValue]);

  useEffect(() => {
    if (row.discountValue > 0) {
      setDiscountInput(row.discountValue.toString());
    } else {
      setDiscountInput("");
    }
  }, [row.id, row.discountValue]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const { data: aData, refetch: refetchIncomeAccounts } = useGetAccountsQuery(
    formType === "Invoice" ? { type: "Income" } : skipToken,
  );

  const { data: fullaccData, refetch: refetchAllAccounts } = useGetAccountsQuery(
    formType === "Bill" || formType === "Invoice" ? { type: "" } : skipToken,
  );

  // Get both taxesData and refetch function
  const { taxesData: tData, refetchTaxes } = useAllAccountOptions(
    undefined,
    true,
    "full"
  );

  const EXCLUDED_NAMES = useMemo(
    () => [
      "miscellaneous income",
      "miscellaneous expense",
      "accounts receivable",
      "accounts payable",
      "in transit",
      "fx gain/ loss",
      "tds",
    ],
    [],
  );

  const isExcludedAccount = useCallback(
    (name?: string) =>
      !!name &&
      EXCLUDED_NAMES.some((excluded) =>
        name.toLowerCase().includes(excluded),
      ),
    [EXCLUDED_NAMES],
  );

  const accountGroups = useMemo(() => {
    const accounts = fullaccData?.data || [];
    if (!accounts.length) return [];

    const grouped: Record<string, any[]> = {};

    accounts
      .filter((acc: any) => !isExcludedAccount(acc.accountName))
      .forEach((acc: any) => {
        const type = acc.accountType;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(acc);
      });

    const ORDER = ["Expense", "Income", "Asset", "Liability"];

    return ORDER.filter((type) => grouped[type]?.length).map((type) => ({
      label: type.toUpperCase(),
      options: grouped[type].map((acc: any) => {
        const currency = acc.accountCurrency?.split("-")[0]?.trim() || "";

        return {
          label: currency
            ? `${acc.accountName} (${currency})`
            : acc.accountName,
          value: String(acc.id),
        };
      }),
    }));
  }, [fullaccData, isExcludedAccount]);

  const incomeAccountGroup = useMemo(() => {
    const accounts = aData?.data || [];
    if (!accounts.length) return [];

    return [
      {
        label: "INCOME",
        options: accounts
          .filter(
            (acc: any) => !isExcludedAccount(acc.accountName),
          )
          .map((acc: any) => {
            const currency = acc.accountCurrency?.split("-")[0]?.trim() || "";

            return {
              label: `${acc.accountName}  (${currency})`,
              value: String(acc.id),
            };
          }),
      },
    ];
  }, [aData, isExcludedAccount]);

  const taxGroup = useMemo(() => {
    const taxes = tData?.data || [];

    const filteredTaxes = taxes.filter(
      (t: any) => !isExcludedAccount(t.taxName),
    );

    return [
      {
        label: "TAXES",
        options: filteredTaxes.length
          ? filteredTaxes.map((t: any) => ({
            label: `${t.abbreviation}`,
            value: `tax_${t.id}`,
          }))
          : [
            {
              label: "No taxes found",
              value: "__no_tax__",
              disabled: true,
            },
          ],
      },
    ];
  }, [tData, isExcludedAccount]);

  const taxMap = new Map<
    string,
    {
      taxId?: any;
      taxRate: number;
      taxName: string;
      taxAbbreviation?: string;
    }
  >();

  tData?.data?.forEach((tax: any) => {
    taxMap.set(String(tax.id), {
      taxRate: tax.taxRate,
      taxName: tax.taxName,
      taxAbbreviation: tax.abbreviation,
    });
  });

  const gridTemplate = useMemo(() => {
    return [
      "minmax(0, 1.8fr)", // Item Name
      "minmax(0, 1.8fr)", // Account
      "minmax(0, 1fr)",   // HSN/SAC
      "60px",             // Qty
      "minmax(0, 1.2fr)", // Price
      showInlineDisc ? "minmax(0, 1.5fr)" : "", // Discount
      showInlineTax ? "minmax(0, 2fr)" : "",  // Tax
      showInlineTds ? "minmax(0, 1fr)" : "",    // TDS
      "minmax(0, 0.7fr)", // Total
      "40px",             // Delete
    ]
      .filter(Boolean)
      .join(" ");
  }, [showInlineTds, showInlineDisc, showInlineTax]);

  const gridStyles = {
    display: "grid",
    gridTemplateColumns: gridTemplate,
    gap: 2,
    alignItems: "start",
    width: "100%",
  };

  const dispatch = useAppDispatch();
  const rowDiscountFactor = useAppSelector(
    (state) => state.invoiceForm.rowDiscountFactor,
  );

  useEffect(() => {
    if (openTaxOverride) {
      const initialDraft: any = {};
      row.taxes?.forEach((t) => {
        initialDraft[t.taxId] = {
          value: String(t.taxPercent),
          unit: t.taxUnit ?? "percent",
        };
      });
      setDraftOverrides(initialDraft);
    }
  }, [openTaxOverride]);

  // Handler for adding new tax
  const handleAddTax = async (taxData: any) => {
    try {
      //  Create the new tax
      const response = await addTaxApi({
        taxName: String(taxData.taxName),
        abbreviation: String(taxData.abbreviation),
        taxNumber: Number(taxData.taxNumber),
        taxRate: Number(taxData.taxRate),
      }).unwrap();

      const newTaxCreated = response?.data;
      const newTaxId = newTaxCreated?.id;

      if (!newTaxId) {
        console.warn("No tax ID found in addTaxApi response");
      }

      //  Immediately get updated taxes from refetch
      let refreshedTaxes = null;

      if (refetchTaxes) {
        const result = await refetchTaxes();
        refreshedTaxes = result?.data?.data || []; // adjust depending on API shape
      }

      //  Find the newly created tax in the fresh data
      const newTax = refreshedTaxes?.find(
        (t: any) => String(t.id) === String(newTaxId),
      );

      if (newTax) {
        const currentTaxes = row.taxes ?? [];

        dispatch(
          updateRow({
            index,
            patch: {
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
            },
          }),
        );

        dispatch(recalculateRow(index));
        dispatch(recalculateSummary());
      } else {
        console.warn("New tax not found even after refetch");
      }

      //  Notify user & close modal
      showSnack("Tax added successfully!", "success");
      setOpenAddTax(false);
    } catch (error) {
      console.error("Error adding tax:", error);
      showSnack("Failed to add tax", "error");
    }
  };

  return (
    <>
      {/* HEADER */}
      {showHeader && (
        <Box sx={{ ...gridStyles, mb: 0.5, px: 1 }}>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Item Name</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Account</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>HSN/SAC</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Qty</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, textAlign: "right" }}>Price</Typography>
          {showInlineDisc && <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Discount</Typography>}
          {showInlineTax && <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, pl: 0.5 }}>Tax</Typography>}
          {showInlineTds && <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, pl: 0.5 }}>TDS</Typography>}
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, textAlign: "right" }}>Total</Typography>
          <Box />
        </Box>
      )}
      {/* ROW */}
      <Box sx={{ ...gridStyles, mb: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <TextFieldElement
            fullWidth
            required
            value={row.itemName}
            onChange={(e) =>
              dispatch(updateRow({ index, patch: { itemName: e.target.value } }))
            }
            label={"Item Name"}
            slotProps={{
              htmlInput: { minLength: 2, maxLength: 300 },
            }}
          />

          {showInlineDisc && (
            <Box sx={{ mt: 0.5, width: "100%" }}>
              {!discountAccountOpen ? (
                /* ── Collapsed pill ── */
                <Box
                  onClick={() => setDiscountAccountOpen(true)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.4,
                    cursor: "pointer",
                    px: 1,
                    py: 0.25,
                    borderRadius: "4px",
                    border: "1px solid",
                    borderColor:
                      row.discountAccountId
                        ? "primary.main"
                        : row.discountValue > 0
                          ? "error.main"
                          : "divider",
                    backgroundColor: "background.paper",
                    maxWidth: "100%",
                    overflow: "hidden",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      color:
                        row.discountAccountId
                          ? "primary.main"
                          : row.discountValue > 0
                            ? "error.main"
                            : "text.secondary",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.discountAccountId
                      ? (formType === "Bill" ? accountGroups : incomeAccountGroup)
                        .flatMap((g: any) => g.options)
                        .find((o: any) => o.value === String(row.discountAccountId))
                        ?.label ?? "Discount Account"
                      : "Discount Account"}
                  </Typography>
                  <KeyboardArrowDown sx={{ fontSize: 12, flexShrink: 0, color: "text.secondary" }} />
                </Box>
              ) : (
                /* ── Select Expanded on click ── */
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    width: "100%",
                  }}
                >
                  <SingleSelectElement
                    label="Discount Account"
                    value={row.discountAccountId ? String(row.discountAccountId) : ""}
                    onChange={(val) => {
                      dispatch(updateRow({ index, patch: { discountAccountId: Number(val) } }));
                      setDiscountAccountOpen(false);
                    }}
                    options={formType === "Bill" ? accountGroups : incomeAccountGroup}
                    error={!row.discountAccountId && row.discountValue > 0}
                    helperText={
                      !row.discountAccountId && row.discountValue > 0 ? "Required" : ""
                    }
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      "& .MuiInputBase-root": {
                        fontSize: "0.75rem",
                        height: "32px",
                        minHeight: "32px",
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: "0.75rem",
                        transform: "translate(14px, 7px) scale(1)",
                        "&.MuiInputLabel-shrink": {
                          transform: "translate(14px, -9px) scale(0.75)",
                        },
                      },
                      "& .MuiSelect-select": {
                        py: "6px",
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setDiscountAccountOpen(false)}
                    sx={{ flexShrink: 0, p: 0.25 }}
                  >
                    <KeyboardArrowUp sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </Box>
        <Stack direction={"row"}>
          <SingleSelectElement
            required
            key={formType}
            value={row.accountId ? String(row.accountId) : ""}
            onChange={(val) =>
              dispatch(updateRow({ index, patch: { accountId: Number(val) } }))
            }
            options={accountGroups}
            width="100%"
            label={"Account Name"}
            clearable={false}
          />
          <IconButton
            onClick={() => {
              setOpenAddAccount(true);
            }}
          >
            <Add />
          </IconButton>
        </Stack>
        <TextFieldElement
          type="number"
          value={row.hsnSac}
          slotProps={{
            htmlInput: {
              style: { textAlign: "right" },
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              },
            },
          }}
          onChange={(e) =>
            dispatch(updateRow({ index, patch: { hsnSac: e.target.value } }))
          }
          fullWidth
          label={"HSN/SAC"}
        />
        <TextFieldElement
          type="number"
          required
          fullWidth
          slotProps={{
            htmlInput: {
              style: { textAlign: "right" },
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              },
            },
          }}
          value={row.quantity === 0 ? "" : row.quantity}
          onChange={(e) =>
            dispatch(
              updateRow({
                index,
                patch: {
                  quantity:
                    e.target.value === "" ? 0 : Number(e.target.value) || 0,
                },
              }),
            )
          }
          onBlur={() => {
            dispatch(recalculateRow(index));
            dispatch(recalculateSummary());
          }}
          label="Qty"
        />

        <TextFieldElement
          type="text"
          fullWidth
          required
          value={formatNumberForTyping(
            String(priceInput ?? ""),
            commaSeparation,
          )}
          slotProps={{
            htmlInput: {
              style: { textAlign: "right" },
              inputMode: "decimal",
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              },
            },
          }}
          sx={{ "& input": { textAlign: "right" } }}
          onChange={(e) => {
            const raw = parseNumberForTyping(e.target.value);
            setPriceInput(raw);
            if (!raw)
              return dispatch(updateRow({ index, patch: { price: 0 } }));
            const num = parseFloat(raw);
            if (!isNaN(num))
              dispatch(
                updateRow({
                  index,
                  patch: { price: roundToTwoDecimals(num) },
                }),
              );
          }}
          onBlur={() => {
            dispatch(recalculateRow(index));
            dispatch(recalculateSummary());
          }}
          label="Price"
        />

        {showInlineDisc && (
          <TextFieldElement
            type="text"
            fullWidth
            error={!row.discountAccountId && row.discountValue > 0}
            helperText={
              !row.discountAccountId && row.discountValue > 0
                ? "Select an account"
                : ""
            }
            value={formatNumberForTyping(String(discountInput ?? ""), commaSeparation)}
            onChange={(e) => {
              const raw = parseNumberForTyping(e.target.value);
              setDiscountInput(raw);
              const value =
                row.discountUnit === "percent"
                  ? validatePercentNumber(raw, "percent")
                  : !raw ? 0 : roundToTwoDecimals(parseFloat(raw) || 0);
              dispatch(updateRow({ index, patch: { discountValue: value } }));
            }}
            onBlur={() => {
              dispatch(recalculateRow(index));
              dispatch(recalculateSummary());
            }}
            slotProps={{
              htmlInput: {
                style: { textAlign: "right" },
                inputMode: "decimal",
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                },
              },
              input: {
                endAdornment: (
                  <Box sx={{ display: "flex", pl: 1, borderLeft: "1px solid #e0e0e0" }}>
                    <Box
                      component="select"
                      value={row.discountUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as "percent" | "value";
                        setDiscountInput("");
                        dispatch(updateRow({ index, patch: { discountUnit: newUnit, discountValue: 0 } }));
                        dispatch(recalculateRow(index));
                        dispatch(recalculateSummary());
                      }}
                      onBlur={() => dispatch(recalculateSummary())}
                      sx={{ border: "none", outline: "none", background: "transparent", fontWeight: 600, cursor: "pointer" }}
                    >
                      <option value="percent">%</option>
                      <option value="value">{selectedCurrency}</option>
                    </Box>
                  </Box>
                ),
              },
            }}
            label="Discount"
            sx={{ "& input": { textAlign: "right" } }}
          />
        )}

        {showInlineTax && (<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <MultiSelectElement
            menuWidth={100}
            value={(row.taxes ?? []).map((t) => `tax_${t.taxId}`)}
            highlightedValues={(row.taxes ?? []).filter(
              (t) => t.isTaxOverridden,
            )}
            onChange={(taxIds) => {
              const currentTaxes = row.taxes ?? [];

              // Build the new taxes array while preserving existing override & original values
              const taxes = taxIds
                .map((id: string) => {
                  const taxId = id.replace("tax_", "");
                  const existing = currentTaxes.find(
                    (t) => String(t.taxId) === taxId,
                  );
                  const tax = taxMap.get(taxId);
                  if (!tax) return null;

                  // If already existed → preserve everything (including override flags)
                  if (existing) {
                    return {
                      ...existing,
                      // fallback if older taxes didn't have originals set
                      originalTaxPercent:
                        existing.originalTaxPercent ?? existing.taxPercent,
                      originalTaxUnit:
                        existing.originalTaxUnit ?? existing.taxUnit,
                    };
                  }

                  // If newly added → initialize with original values
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

              dispatch(updateRow({ index, patch: { taxes } }));
              dispatch(recalculateRow(index));
              dispatch(recalculateSummary());
            }}
            options={taxGroup}
            width="100%"
            label="Tax"
          />
          <IconButton
            size="small"
            onClick={() => setOpenAddTax(true)}
            title="Add new tax"
          >
            <Add fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setOpenTaxOverride(true)}
            disabled={!(row.taxes && row.taxes.length)}
            title="Override tax"
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>)}

        {showInlineTds && (
          <TextFieldElement
            type="text"
            fullWidth
            value={formatNumberForTyping(
              String(tdsInput ?? ""),
              commaSeparation,
            )}
            onChange={(e) => {
              const raw = parseNumberForTyping(e.target.value);
              setTdsInput(raw);
              const value =
                row.tdsUnit === "percent"
                  ? validatePercentNumber(raw, "percent")
                  : !raw
                    ? 0
                    : roundToTwoDecimals(parseFloat(raw) || 0);
              dispatch(
                updateRow({
                  index,
                  patch: { tdsValue: value },
                }),
              );
            }}
            onBlur={() => {
              dispatch(recalculateRow(index));
              dispatch(recalculateSummary());
            }}
            slotProps={{
              htmlInput: {
                style: { textAlign: "right" },
                inputMode: "decimal",
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault();
                  }
                },
              },
              input: {
                endAdornment: (
                  <Box
                    sx={{
                      display: "flex",
                      pl: 1,
                      borderLeft: "1px solid #e0e0e0",
                    }}
                  >
                    <Box
                      component="select"
                      value={row.tdsUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as "percent" | "value";
                        setTdsInput("");
                        dispatch(
                          updateRow({
                            index,
                            patch: {
                              tdsUnit: newUnit,
                              tdsValue: 0,
                            },
                          }),
                        );
                      }}
                      onBlur={() => dispatch(recalculateSummary())}
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
                  </Box>
                ),
              },
            }}
            label="TDS"
          />
        )}

        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              padding: "10px 12px",
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              backgroundColor: "background.paper",
            }}
          >
            <DiffAmount
              original={
                rowDiscountFactor !== 1
                  ? row.quantity * row.price
                  : row.discountValue > 0
                    ? row.quantity * row.price
                    : null
              }
              value={row.rowTotal}
              formatter={(v) =>
                formatNumberByCommaSeparation(v.toFixed(2), commaSeparation)
              }
            />
          </Box>
        </Box>

        <Box display="flex" justifyContent="center">
          {showDelete && (
            <IconButton onClick={onDelete} size="small">
              <Delete sx={{ color: "red" }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <ModalElement
        open={openTaxOverride}
        title="Tax Override"
        maxWidth="xs"
        onClose={() => setOpenTaxOverride(false)}
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" flexDirection="column" gap={3}>
            {row.taxes?.map((tax) => {
              const draft = draftOverrides[tax.taxId] || {
                value: "",
                unit: "percent",
              };
              const currentUnit = draft.unit;

              return showInlineTax ? (
                <TextFieldElement
                  key={tax.taxId}
                  fullWidth
                  label={`${tax.taxName} Override`}
                  value={draft.value?.toString() ?? ""}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    // Keep string while typing so decimals work ("12." and "12.5"); allow only digits and one dot
                    if (rawValue === "") {
                      setDraftOverrides((prev) => ({
                        ...prev,
                        [tax.taxId]: { ...prev[tax.taxId], value: "", unit: currentUnit },
                      }));
                      return;
                    }
                    const digitsAndDot = rawValue.replace(/[^\d.]/g, "");
                    const parts = digitsAndDot.split(".");
                    const displayValue =
                      parts.length <= 1
                        ? digitsAndDot
                        : parts[0] + "." + parts.slice(1).join("");

                    setDraftOverrides((prev) => ({
                      ...prev,
                      [tax.taxId]: {
                        ...prev[tax.taxId],
                        value: displayValue,
                        unit: currentUnit,
                      },
                    }));
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            borderLeft: "1px solid #e0e0e0",
                            pl: 1,
                          }}
                        >
                          <Box
                            component="select"
                            value={currentUnit}
                            onChange={(e) => {
                              const newUnit = e.target.value as "percent" | "value";
                              setDraftOverrides((prev) => ({
                                ...prev,
                                [tax.taxId]: {
                                  ...prev[tax.taxId],
                                  unit: newUnit,
                                  value: "",
                                },
                              }));
                            }}
                            sx={{
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              fontSize: "0.9rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              pr: 1,
                            }}
                          >
                            <option value="percent">%</option>
                            <option value="value">{selectedCurrency}</option>
                          </Box>
                        </Box>
                      ),
                    },
                  }}
                />
              ) : null; // render nothing if showInlineTax is false
            })}
          </Box>

          {/* Apply button */}
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              onClick={() => {
                const changedOverrides = Object.fromEntries(
                  Object.entries(draftOverrides)
                    .filter(([taxId, d]) => {
                      const original = row.taxes?.find(
                        (t) => String(t.taxId) === taxId,
                      );
                      if (!original) return false;

                      const valueChanged =
                        Number(d.value) !== Number(original.taxPercent ?? 0);
                      const unitChanged =
                        d.unit !== (original.taxUnit ?? "percent");

                      return valueChanged || unitChanged;
                    })
                    .map(([taxId, d]) => {
                      const num = Number(d.value) || 0;
                      const clamped =
                        d.unit === "percent"
                          ? Math.min(100, Math.max(0, num))
                          : num;
                      return [
                        taxId,
                        {
                          taxPercent: clamped,
                          taxUnit: d.unit,
                          isTaxOverridden: true,
                        },
                      ];
                    }),
                );

                if (
                  !row.taxes?.length ||
                  Object.keys(changedOverrides).length === 0
                ) {
                  setOpenTaxOverride(false);
                  return;
                }

                dispatch(
                  overrideTaxes({
                    index,
                    overrides: changedOverrides,
                  }),
                );

                setOpenTaxOverride(false);
                dispatch(recalculateRow(index));
                dispatch(recalculateSummary());
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
        onSubmit={handleAddTax}
      />

      <ModalElement
        open={openAddAccount}
        onClose={() => setOpenAddAccount(false)}
        title="Add Account"
        maxWidth="md"
      >
        <AccountForm
          mode="edit"
          editData={{
            accountType: formType === "Invoice" ? "Income" : "Expense",
          }}
          onSuccess={async (id: any) => {
            const accountId = Number(typeof id === "object" ? id?.id : id);
            await refetchAllAccounts();
            if (formType === "Invoice") {
              await refetchIncomeAccounts();
            }
            dispatch(updateRow({ index, patch: { accountId } }));
            showSnack("Account added successfully!", "success");
            setOpenAddAccount(false);
          }}
          // forcedAccountType={formType === "Invoice" ? "Income" : "Expense"}
          nonSubAccountAndGroupCreation={true}
        />
      </ModalElement>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
}
