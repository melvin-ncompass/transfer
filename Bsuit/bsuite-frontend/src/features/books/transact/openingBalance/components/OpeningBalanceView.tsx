import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Divider,
  InputAdornment,
  Stack,
  Typography,
  Collapse,
  Fade,
} from "@mui/material";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import dayjs, { Dayjs } from "dayjs";

import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { RepeaterElement } from "../../../../../components/atom/form-repeater/FormRepeater";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { Chip } from "../../../../../components/atom/chips";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { StandardTable } from "../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../types/types";
import { useAllAccountOptions } from "../../transactHome/hooks/useAllAccountOptions";
import {
  useCreateJournalMutation,
  useGetDateRangeQuery,
  useGetOpeningBalanceQuery,
  useUpdateJournalMutation,
} from "../../transactHome/api/transact.api";
import type { JournalFormData } from "../../transactHome/types/transact.types";
import { Check, Clear, Edit } from "@mui/icons-material";
import CircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import OpeningBalanceAdd from "./OpeningBalanceAdd";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

// Account type for debit and credit
type AccountNature =
  | "ASSET"
  | "EXPENSE"
  | "LIABILITY"
  | "INCOME"
  | "EQUITY";

// Utility for comma separation
const formatCurrencyByCommaSeparation = (
  value: number | string,
  commaSeparation: "US" | "IN",
  currency?: string
) => {
  if (value === "" || value == null) return "";
  const num = Number(value);
  const formatted =
    commaSeparation === "IN"
      ? num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return currency ? `${currency} ${formatted}` : formatted;
};

export default function OpeningBalanceView() {

  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({
    open: false,
    message: "",
    color: "success",
  });

  const showSnackBar = (message: string, color: "success" | "error") => {
    setSnack({
      open: true,
      message,
      color,
    });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [draftLines, setDraftLines] = useState<any[]>([
    { accountId: "", debit: "", credit: "", fxRate: 1 },
    { accountId: "", debit: "", credit: "", fxRate: 1 },
  ]);

  const { allAccountOptions, accountsData, contactsData, taxesData } =
    useAllAccountOptions();
  const { data: dateRangeData } = useGetDateRangeQuery();

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency =
    headerData?.data?.reportingCurrency?.split(" - ")[0] || "₹";

  const [createJournal] = useCreateJournalMutation();
  const { data, refetch, isLoading, isFetching, isUninitialized } =
    useGetOpeningBalanceQuery(undefined, { refetchOnMountOrArgChange: true });
  const [updateJournal] = useUpdateJournalMutation();

  const openingBalance = data?.data;

  const hasOpeningBalance =
    !!openingBalance &&
    Array.isArray(openingBalance.journalAccounts) &&
    openingBalance.journalAccounts.length > 0;

  const isOpeningBalanceReady =
    !isLoading && !isFetching && !isUninitialized;

  useEffect(() => {
    if (hasOpeningBalance) setIsEditing(false);
  }, [hasOpeningBalance]);

  useEffect(() => {
    if (openingBalance?.date) setDate(dayjs(openingBalance.date));
  }, [openingBalance?.date]);

  useEffect(() => {
    if (!isOpeningBalanceReady) return;

    setIsEditing(false);

    if (hasOpeningBalance) {
      setDraftLines(mapOpeningBalanceToDraftLines(openingBalance.journalAccounts));
      setDate(dayjs(openingBalance.date));
    } else {
      setDraftLines([
        { accountId: "", debit: "", credit: "", fxRate: 1 },
        { accountId: "", debit: "", credit: "", fxRate: 1 },
      ]);
      setDate(dayjs());
    }
  }, [isOpeningBalanceReady, openingBalance]);

  const updateLine = (
    index: number,
    key: "debit" | "credit" | "accountId",
    value: any
  ) => {
    setDraftLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;

        // --- When debit changes ---
        if (key === "debit") {
          return {
            ...line,
            debit: value || "",
            credit:
              value && Number(value) > 0
                ? "0.00"
                : line.credit,
          };
        }

        // --- When credit changes ---
        if (key === "credit") {
          return {
            ...line,
            credit: value || "",
            debit:
              value && Number(value) > 0
                ? "0.00"
                : line.debit,
          };
        }

        // --- For other fields ---
        return { ...line, [key]: value };
      })
    );
  };

  const parseAccountId = (value: string) => {
    const [rawType, rawId] = value.split("_");
    const typeMap: Record<string, "Account" | "Contact" | "Tax"> = {
      account: "Account",
      contact: "Contact",
      tax: "Tax",
    };
    return { id: Number(rawId), type: typeMap[rawType] };
  };

  const buildJournalPayload = (): JournalFormData => ({
    date: date!.format("YYYY-MM-DD"),
    description: "Opening Balance",
    transactionTypeName: "opening_balance",
    journalCurrency: currency,
    journalAccounts: draftLines
      .filter(
        (l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0)
      )
      .map((l) => {
        const { id, type } = parseAccountId(l.accountId);
        const debit = Number(l.debit) || 0;
        const credit = Number(l.credit) || 0;
        const isDebit = debit > 0;
        const amountInAccountCurr = Number(l.fxRate ?? 1) * (debit || credit);
        return {
          id,
          type,
          ...(isDebit ? { debit } : { credit }),
          isFromAccount: !isDebit,
          amountInAccountCurr,
        };
      }),
  });

  const handleNumberInput = (value: string) =>
    value === "" ? "" : Number(value);

  const totalDebit = useMemo(
    () => draftLines.reduce((s, l) => s + (Number(l.debit) || 0), 0),
    [draftLines]
  );

  const totalCredit = useMemo(
    () => draftLines.reduce((s, l) => s + (Number(l.credit) || 0), 0),
    [draftLines]
  );

  const hasUnsavedChanges = useMemo(() => {
    return draftLines.some(
      (line) =>
        line.accountId ||
        (line.debit && Number(line.debit) !== 0) ||
        (line.credit && Number(line.credit) !== 0)
    );
  }, [draftLines]);

  const hasEmptyAccountSelect = useMemo(() => {
    return draftLines.some((line) => !line.accountId);
  }, [draftLines]);

  const tableColumns = useMemo<StandardTableColumn[]>(
    () => [
      { id: "name", label: "Account Name", align: "left", flex: 1 },
      { id: "accountType", label: "Account Type", align: "left", flex: 1 },
      {
        id: "debit",
        label: "Debit",
        align: "right",
        flex: 1,
        render: (row: any) => row.debit,
      },
      {
        id: "credit",
        label: "Credit",
        align: "right",
        flex: 1,
        render: (row: any) => row.credit,
      },
    ],
    []
  );

  const mapOpeningBalanceToDraftLines = (journalAccounts: any[]) =>
    journalAccounts.map((acc) => {
      let prefix = "account";
      if (
        ["Account", "Income", "Expense", "Liability", "Equity", "Asset"].includes(
          acc.type
        )
      ) {
        prefix = "account";
      } else if (acc.type === "Contact") {
        prefix = "contact";
      } else if (acc.type === "Tax") {
        prefix = "tax";
      }

      const debit = acc.debit ?? "";
      const credit = acc.credit ?? "";

      return {
        accountId: `${prefix}_${acc.id}`,
        debit: debit || (credit ? "0.00" : ""),
        credit: credit || (debit ? "0.00" : ""),
        fxRate: Number(acc.accountExchangeRate ?? 1),
      };
    });

  const handleEdit = () => {
    if (!openingBalance) return;
    setDraftLines(mapOpeningBalanceToDraftLines(openingBalance.journalAccounts));
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = buildJournalPayload();
      if (hasOpeningBalance && openingBalance?.transactionTypeId) {
        await updateJournal({
          id: openingBalance.transactionTypeId,
          data: payload,
        }).unwrap();
        showSnackBar("Opening balance updated successfully", "success");
      } else {
        await createJournal(payload).unwrap();
        showSnackBar("Opening balance created successfully", "success");
      }
      refetch();
      setIsEditing(false);
    } catch (err: any) {
      showSnackBar(
        err?.data?.message ||
        err?.error ||
        "Failed to save opening balance",
        "error"
      );

      if (openingBalance?.date) {
        setDate(dayjs(openingBalance.date));
      } else {
        setDate(dayjs());
      }
    }
  };

  const handleCancel = () => {
    if (hasOpeningBalance) {
      setDraftLines(
        mapOpeningBalanceToDraftLines(openingBalance.journalAccounts)
      );
      setDate(dayjs(openingBalance.date));
    } else {
      setDraftLines([
        { accountId: "", debit: "", credit: "", fxRate: 1 },
        { accountId: "", debit: "", credit: "", fxRate: 1 },
      ]);
      setDate(dayjs());
    }
    setIsEditing(false);
  };

  const openingBalanceRows = useMemo(() => {
    if (!openingBalance?.journalAccounts) return [];
    return openingBalance.journalAccounts.map((acc: any) => ({
      id: `${acc.type}_${acc.id}`,
      name: acc.name,
      accountType: acc.type,
      debit: formatCurrencyByCommaSeparation(Number(acc.debit ?? 0), commaSeparation, currency),
      credit: formatCurrencyByCommaSeparation(Number(acc.credit ?? 0), commaSeparation, currency),
    }));
  }, [openingBalance]);

  const normalizeAccountType = (type?: string): AccountNature | null => {
    if (!type) return null;

    const t = type.toLowerCase();

    if (t.includes("asset")) return "ASSET";
    if (t.includes("expense")) return "EXPENSE";
    if (t.includes("liabil")) return "LIABILITY";
    if (t.includes("income") || t.includes("revenue")) return "INCOME";
    if (t.includes("capital") || t.includes("equity")) return "EQUITY";

    return null;
  };

  const getArrowForDebit = (nature: AccountNature | null) => {
    if (!nature) return null;

    if (nature === "ASSET" || nature === "EXPENSE") {
      return { Icon: ArrowUpward, color: "success" as const };
    }

    return { Icon: ArrowDownward, color: "error" as const };
  };

  const getArrowForCredit = (nature: AccountNature | null) => {
    if (!nature) return null;

    if (nature === "ASSET" || nature === "EXPENSE") {
      return { Icon: ArrowDownward, color: "error" as const };
    }

    return { Icon: ArrowUpward, color: "success" as const };
  };


  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(80vh - 80px)",
        overflow: "hidden",
      }}
    >
      {!isOpeningBalanceReady ? (
        <Box display="flex" alignItems="center" justifyContent="center" height={300}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {(isEditing || !hasOpeningBalance) &&
           <PermissionGuard permission={"manage_opening_balance"}>
             <OpeningBalanceAdd
              initialItem={{
                accountId: "",
                debit: "",
                credit: "",
                fxRate: 1,
              }}
              date={date}
              setDate={setDate}
              dateRangeData={dateRangeData}
              items={draftLines}
              setItems={setDraftLines}
              onChange={setDraftLines}
            /></PermissionGuard>}

          {/* Editable Form */}
        <PermissionGuard permission={"manage_opening_balance"}>
            <Fade
            in={isEditing || !hasOpeningBalance}
            timeout={350}
            unmountOnExit
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: 'auto',
            }}
          >
            <Box
              sx={{
                pl: 1,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* Scrollable Area */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  pr: 1,
                  pt: 1,
                  minHeight: 0,
                }}
              >
                <RepeaterElement
                  items={draftLines}
                  setItems={setDraftLines}
                  initialItem={{
                    accountId: "",
                    debit: "",
                    credit: "",
                    fxRate: 1,
                  }}
                  renderItem={(item, index) => {
                    const [type, id] = item.accountId?.split("_") || [];
                    const selectedAccount =
                      type === "account"
                        ? accountsData?.data.find((a: any) => a.id === Number(id))
                        : type === "contact"
                          ? contactsData?.data.find((c: any) => c.id === Number(id))
                          : type === "tax"
                            ? taxesData?.data.find((t: any) => t.id === Number(id))
                            : null;

                    const accountNature = normalizeAccountType(
                      selectedAccount && "accountType" in selectedAccount
                        ? selectedAccount.accountType
                        : null
                    );
                    const debitArrow = getArrowForDebit(accountNature);
                    const creditArrow = getArrowForCredit(accountNature);

                    return (
                      <Stack
                        direction="row"
                        gap={2}
                        alignItems="center"
                        flexWrap="wrap"
                        py={1}
                        key={index}
                      >
                        <SingleSelectElement
                          required
                          label="Account"
                          value={item.accountId}
                          onChange={(val) => updateLine(index, "accountId", val)}
                          options={allAccountOptions}
                          sx={{ flex: 1, minWidth: 350 }}
                        />

                        {selectedAccount ? (
                          <Chip
                            label={
                              selectedAccount
                                ? "accountType" in selectedAccount
                                  ? selectedAccount.accountType
                                  : "name" in selectedAccount
                                    ? "Contact"
                                    : "Tax"
                                : "Tax"
                            }
                            color="info"
                            sx={{ width: 200 }}
                          />
                        ) : (
                          <Box sx={{ width: 200 }} />
                        )}

                        <TextFieldElement
                          label="Debit"
                          value={item.debit}
                          type="number"
                          sx={{ flex: 0.9, minWidth: 280 }}
                          onBlur={(e) =>
                            updateLine(
                              index,
                              "debit",
                              handleNumberInput(e.target.value)
                            )
                          }
                          onChange={(e) =>
                            updateLine(
                              index,
                              "debit",
                              handleNumberInput(e.target.value)
                            )
                          }
                          helperText={formatCurrencyByCommaSeparation(
                            item.debit || 0,
                            commaSeparation,
                            currency
                          )}
                          slotProps={{
                            htmlInput: { style: { textAlign: "right" } },
                            input: {
                              startAdornment: debitArrow && (
                                <InputAdornment position="start">
                                  <Stack direction="row" alignItems="center" gap={1}>
                                    <debitArrow.Icon
                                      sx={{ fontSize: 20 }}
                                      color={debitArrow.color}
                                    />
                                    <Typography variant="caption">
                                      {currency}
                                    </Typography>
                                  </Stack>
                                </InputAdornment>
                              ),
                            },
                          }}
                        />

                        <TextFieldElement
                          label="Credit"
                          value={item.credit}
                          type="number"
                          sx={{ flex: 0.9, minWidth: 280 }}
                          onBlur={(e) =>
                            updateLine(
                              index,
                              "credit",
                              handleNumberInput(e.target.value)
                            )
                          }
                          onChange={(e) =>
                            updateLine(
                              index,
                              "credit",
                              handleNumberInput(e.target.value)
                            )
                          }
                          helperText={formatCurrencyByCommaSeparation(
                            item.credit || 0,
                            commaSeparation,
                            currency
                          )}
                          slotProps={{
                            htmlInput: { style: { textAlign: "right" } },
                            input: {
                              startAdornment: creditArrow && (
                                <InputAdornment position="start">
                                  <Stack direction="row" alignItems="center" gap={1}>
                                    <creditArrow.Icon
                                      sx={{ fontSize: 20 }}
                                      color={creditArrow.color}
                                    />
                                    <Typography variant="caption">
                                      {currency}
                                    </Typography>
                                  </Stack>
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Stack>
                    );
                  }}
                />
              </Box>
            </Box>
          </Fade>
          </PermissionGuard>

          {/* Fixed bottom Totals */}
          {(isEditing || !hasOpeningBalance) && (
            <PermissionGuard permission={"manage_opening_balance"}>
              <Box
              sx={{
                mt: "auto",
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                flexShrink: 0,
                borderTop: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
                zIndex: 10,
              }}
            >
              <Box sx={{ width: 360 }} />
              <Box sx={{ width: 250 }} />
              <Box
                sx={{
                  p: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                  alignSelf: "flex-end",
                }}
              >
                <Stack direction="row" minWidth={280} justifyContent='center'>
                  <Typography variant="body2" sx={{ fontWeight: 600, pr: 0.5 }}>
                    Total Debit: {currency}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        totalDebit === totalCredit
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {totalDebit.toFixed(2)}
                  </Typography>
                </Stack>

                <Stack direction="row" minWidth={280} justifyContent='center'>
                  <Typography variant="body2" sx={{ fontWeight: 600, pr: 0.5 }}>
                    Total Credit: {currency}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        totalDebit === totalCredit
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {totalCredit.toFixed(2)}
                  </Typography>
                </Stack>
              </Box>

              <Box display='flex' gap={2} sx={{ marginLeft: "auto" }}>
                {hasUnsavedChanges ? (
                  <PrimaryIconButton title="Cancel" icon={<Clear />} onClick={handleCancel} color="error" />
                ) :
                  <PrimaryIconButton
                    title="Cancel"
                    icon={<Clear />}
                    onClick={handleCancel}
                    color="error"
                    sx={{ visibility: "hidden", pointerEvents: "none" }}
                  />
                }
                <PrimaryIconButton
                  title={
                    totalDebit !== totalCredit
                      ? "Total Debit and Total Credit must be equal"
                      : draftLines.length < 2
                        ? "Minimum two rows are required"
                        : hasEmptyAccountSelect
                          ? "All rows with values must have an account selected"
                          : "Submit"
                  }
                  icon={<Check />}
                  onClick={handleSubmit}
                  disabled={totalDebit !== totalCredit || draftLines.length < 2 || hasEmptyAccountSelect || totalCredit === 0}
                />
              </Box>
            </Box>
            </PermissionGuard>
            
          )}

          {/* Read-Only Table */}
          <Collapse
            in={!isEditing && hasOpeningBalance}
            timeout={350}
            unmountOnExit
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              m={1}
              pl={1}
            >
              <Typography variant="body2">{date?.toDate().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}</Typography>
  <PermissionGuard permission={"manage_opening_balance"}>
                <PrimaryIconButton title="Edit" icon={<Edit />} onClick={handleEdit} />
  </PermissionGuard>
  
            </Box>
            <Divider />
            <StandardTable minWidth={150} columns={tableColumns} rows={openingBalanceRows} sticky />
          </Collapse>

          {snack.open && (
            <Snackbar
              message={snack.message}
              color={snack.color}
              onClose={() =>
                setSnack((prev) => ({ ...prev, open: false }))
              }
            />
          )}
        </>
      )}
    </Box>
  );
}
