import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  TextField,
  Checkbox,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useAllAccountOptions } from "../../../../../books/transact/transactHome/hooks/useAllAccountOptions";
import type { EmployeeBalanceRow, PayrunEmployee } from "../api/payrun.api";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { useGetEmployeeBalancesQuery } from "../api/payrun.api";
import type { StandardTableColumn } from "../../../../../../types/types";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentFormPayload) => void;
  isLoading?: boolean;
  employees: PayrunEmployee[];
  payrunId: number;
  defaultDate?: string;
  isPartiallyPaid?: boolean;
}

export type RecordPaymentFormPayload =
  | {
      sameDatePayment: true;
      paymentAccountId: number;
      paymentDate: string;
    }
  | {
      sameDatePayment: false;
      paymentAccountId: number;
      employees: { employeeId: number; paymentDate: string; paymentAmount: number }[];
    };

type BalanceAmounts = {
  netPay?: number;
  amountPaid?: number;
  balanceDue?: number;
};

function getNormalizedDue(row: BalanceAmounts): number {
  const netPay = Number(row.netPay ?? 0);
  const amountPaid = Number(row.amountPaid ?? 0);
  const balanceDue = Number(row.balanceDue ?? 0);
  if (amountPaid <= 0 && balanceDue <= 0 && netPay > 0) return netPay;
  return balanceDue > 0 ? balanceDue : Math.max(0, netPay - amountPaid);
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Box flex={1}>{children}</Box>
    </Box>
  );
}

function toPositiveNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function findBalanceRowForEmployee(
  emp: PayrunEmployee,
  balanceRows: EmployeeBalanceRow[] | undefined
): EmployeeBalanceRow | undefined {
  if (!balanceRows?.length) return undefined;
  const rawEmployeeId = (emp as unknown as { employeeId?: unknown }).employeeId;
  const numericEmployeeId = toPositiveNumber(rawEmployeeId);
  if (numericEmployeeId != null) {
    return balanceRows.find((row) => row.employeeId === numericEmployeeId);
  }
  const codeFromEmployeeId =
    typeof rawEmployeeId === "string" ? rawEmployeeId.trim() : undefined;
  const employeeCode = (emp as unknown as { employeeCode?: unknown }).employeeCode;
  const normalizedCode =
    typeof employeeCode === "string" && employeeCode.trim().length > 0
      ? employeeCode.trim()
      : codeFromEmployeeId;
  if (normalizedCode) {
    const byCode = balanceRows.find((row) => row.employeeCode?.trim() === normalizedCode);
    if (byCode) return byCode;
  }
  return balanceRows.find((row) => row.name === emp.name);
}

function resolveEmployeeId(
  emp: PayrunEmployee,
  balanceRows: EmployeeBalanceRow[] | undefined
): number | undefined {
  const fromRowId = Number(emp.id);
  if (Number.isFinite(fromRowId) && fromRowId > 0) return fromRowId;
  const rawEmployeeId = (emp as unknown as { employeeId?: unknown }).employeeId;
  const numericEmployeeId = toPositiveNumber(rawEmployeeId);
  if (numericEmployeeId != null) return numericEmployeeId;
  return findBalanceRowForEmployee(emp, balanceRows)?.employeeId;
}

type PaymentTargetRow = {
  key: number;
  employeeId: number;
  name: string;
  netPay: number;
  amountPaid: number;
  currentDue: number;
};

export function RecordPaymentModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  employees,
  payrunId,
  defaultDate,
  isPartiallyPaid = false,
}: RecordPaymentModalProps) {
  const defaultPaymentDayjs = useMemo(() => {
    if (defaultDate && dayjs(defaultDate).isValid()) return dayjs(defaultDate);
    return dayjs();
  }, [defaultDate]);

  const [sameDatePayment, setSameDatePayment] = useState(!isPartiallyPaid);
  const [paymentDate, setPaymentDate] = useState<Dayjs | null>(defaultPaymentDayjs);
  const [paymentAccountId, setPaymentAccountId] = useState<number | "">("");
  const [submitError, setSubmitError] = useState<string>("");
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set());

  const [perDates, setPerDates] = useState<Record<number, Dayjs | null>>({});
  const [perAmounts, setPerAmounts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!open) return;
    setPaymentDate(defaultPaymentDayjs);
    setPerDates({});
    setPerAmounts({});
    setSelectedKeys(new Set());
    if (isPartiallyPaid) setSameDatePayment(false);
  }, [open, defaultPaymentDayjs, isPartiallyPaid]);

  useEffect(() => {
    if (open) return;
    setSameDatePayment(!isPartiallyPaid);
    setPaymentAccountId("");
    setSubmitError("");
    setPaymentDate(defaultPaymentDayjs);
    setPerDates({});
    setPerAmounts({});
    setSelectedKeys(new Set());
  }, [open, defaultPaymentDayjs, isPartiallyPaid]);

  const {
    data: balancesData,
    isLoading: isBalancesLoading,
    isFetching: isBalancesFetching,
  } = useGetEmployeeBalancesQuery(payrunId, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });

  const isBalancesPending =
    !sameDatePayment && open && (isBalancesLoading || (isBalancesFetching && !balancesData));

  const { accountGroups } = useAllAccountOptions(
    undefined,
    true,
    "full",
    ["Asset", "Liability"],
    true,
    true,
    true
  );

  const accountOptions = accountGroups;

  const parseAccountValue = (v: string): number | "" => {
    if (!v || typeof v !== "string") return "";
    const match = v.match(/^account_(\d+)$/);
    return match ? parseInt(match[1], 10) : "";
  };

  const toAccountValue = (id: number | "") => (id === "" ? "" : `account_${id}`);

  const sanitizeAmountInput = (value: string): string =>
    value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const formatAmountDisplay = (value: string | number): string => {
    const raw = typeof value === "number" ? String(value) : value;
    const sanitized = sanitizeAmountInput(raw);
    if (!sanitized) return "";
    const [integerPart, decimalPart] = sanitized.split(".");
    const formattedInteger = Number(integerPart || 0).toLocaleString("en-IN");
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  const balanceRows = balancesData?.employees;

  const paymentTargets = useMemo<PaymentTargetRow[]>(() => {
    if (balanceRows && balanceRows.length > 0) {
      return balanceRows
        .map((row) => ({
          key: row.employeeId,
          employeeId: row.employeeId,
          name: row.name,
          netPay: Number(row.netPay ?? 0),
          amountPaid: Number(row.amountPaid ?? 0),
          currentDue: getNormalizedDue(row),
        }))
        .filter(
          (row) =>
            Number.isFinite(row.employeeId) && row.employeeId > 0 && row.currentDue > 0
        );
    }

    return employees
      .map((emp, idx) => {
        const employeeId = resolveEmployeeId(emp, balanceRows);
        if (!employeeId) return null;
        const balanceRow = findBalanceRowForEmployee(emp, balanceRows);
        const netPay = Number(balanceRow?.netPay ?? (emp as { netPay?: unknown }).netPay ?? 0);
        const amountPaid = Number(balanceRow?.amountPaid ?? 0);
        const currentDue = balanceRow
          ? getNormalizedDue(balanceRow)
          : getNormalizedDue({ netPay, amountPaid: 0, balanceDue: 0 });
        return {
          key: employeeId || idx,
          employeeId,
          name: emp.name,
          netPay,
          amountPaid,
          currentDue,
        };
      })
      .filter((row): row is PaymentTargetRow => row != null && row.currentDue > 0);
  }, [balanceRows, employees]);

  useEffect(() => {
    if (!open || paymentTargets.length === 0) return;
    setSelectedKeys((prev) => {
      const validKeys = new Set(paymentTargets.map((row) => row.key));
      const pruned = new Set([...prev].filter((key) => validKeys.has(key)));
      if (pruned.size > 0) return pruned;
      return validKeys;
    });
  }, [open, paymentTargets]);

  const selectedPaymentTargets = useMemo(
    () => paymentTargets.filter((row) => selectedKeys.has(row.key)),
    [paymentTargets, selectedKeys]
  );

  const allTargetKeys = useMemo(
    () => paymentTargets.map((row) => row.key),
    [paymentTargets]
  );

  const toggleSelect = (key: number) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === allTargetKeys.length) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(allTargetKeys));
  };

  const getAmount = (row: PaymentTargetRow): number => {
    const raw = perAmounts[row.key];
    const parsed = raw !== undefined ? parseFloat(sanitizeAmountInput(raw)) : NaN;
    if (!isNaN(parsed)) return parsed;
    return row.currentDue;
  };

  const isFormValid =
    paymentAccountId !== "" &&
    (sameDatePayment
      ? Boolean(paymentDate)
      : !isBalancesPending && selectedPaymentTargets.length > 0);

  const handleConfirm = () => {
    if (!isFormValid) return;
    setSubmitError("");
    if (sameDatePayment) {
      onSubmit({
        sameDatePayment: true,
        paymentAccountId: paymentAccountId as number,
        paymentDate: paymentDate!.format("YYYY-MM-DD"),
      });
    } else {
      if (isBalancesPending) {
        setSubmitError("Loading employee balances. Please wait.");
        return;
      }
      if (paymentTargets.length === 0) {
        setSubmitError("Unable to resolve employees with valid balance due.");
        return;
      }
      if (selectedPaymentTargets.length === 0) {
        setSubmitError("Select at least one employee to record payment for.");
        return;
      }

      const amountedRows = selectedPaymentTargets.map((row) => ({
        row,
        amount: getAmount(row),
      }));

      const zeroAmount = amountedRows.find(({ amount }) => Number.isFinite(amount) && amount <= 0);
      if (zeroAmount) {
        setSubmitError(`Amount for ${zeroAmount.row.name} must be greater than zero.`);
        return;
      }

      const overpay = amountedRows.find(
        ({ row, amount }) => Number.isFinite(amount) && amount > row.currentDue
      );
      if (overpay) {
        setSubmitError(
          `Amount to be paid cannot exceed balance due for ${overpay.row.name}. (Due: ${formatAmountDisplay(
            overpay.row.currentDue
          )})`
        );
        return;
      }

      onSubmit({
        sameDatePayment: false,
        paymentAccountId: paymentAccountId as number,
        employees: selectedPaymentTargets.map((row) => ({
          employeeId: row.employeeId,
          paymentDate: (perDates[row.key] ?? defaultPaymentDayjs).format("YYYY-MM-DD"),
          paymentAmount: getAmount(row),
        })),
      });
    }
  };

  const formatInr = (value: number) => value.toLocaleString("en-IN");

  const paymentTableColumns: StandardTableColumn[] = [
    {
      id: "_select",
      label: "",
      width: 44,
      minWidth: 44,
      headerAlign: "center",
      align: "center",
      headerRender: () => (
        <Checkbox
          size="small"
          indeterminate={
            selectedKeys.size > 0 && selectedKeys.size < allTargetKeys.length
          }
          checked={allTargetKeys.length > 0 && selectedKeys.size === allTargetKeys.length}
          onChange={toggleSelectAll}
          disabled={isBalancesPending || allTargetKeys.length === 0}
          sx={{ p: 0, m: 0 }}
        />
      ),
      render: (row: { key: number }) => (
        <Checkbox
          size="small"
          checked={selectedKeys.has(row.key)}
          onChange={() => toggleSelect(row.key)}
          disabled={isBalancesPending}
          sx={{ p: 0, m: 0 }}
        />
      ),
    },
    {
      id: "employeeName",
      label: "Employee Name",
      width: 160,
      render: (row: { name: string; isSelected: boolean }) => (
        <Typography
          variant="body2"
          sx={{ minWidth: 120, color: row.isSelected ? "text.primary" : "text.disabled" }}
        >
          {row.name}
        </Typography>
      ),
    },
    {
      id: "paymentDate",
      label: "Payment Date",
      width: 168,
      render: (row: { key: number; date: Dayjs; isSelected: boolean }) => (
        <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
          <DatePicker
            value={row.date}
            onChange={(val) => setPerDates((prev) => ({ ...prev, [row.key]: val }))}
            format="MMM DD, YYYY"
            disabled={!row.isSelected || isBalancesPending}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 140, m: 0 },
              },
            }}
          />
        </Box>
      ),
    },
    {
      id: "netPay",
      label: "Net Pay",
      align: "right",
      width: 110,
      render: (row: { netPay: number }) => (
        <Box component="span" sx={{ fontSize: 13 }}>
          {formatInr(row.netPay)}
        </Box>
      ),
    },
    {
      id: "amountPaid",
      label: "Amount Paid",
      align: "right",
      width: 110,
      render: (row: { amountPaid: number }) => (
        <Box component="span" sx={{ fontSize: 13, color: "text.secondary" }}>
          {formatInr(row.amountPaid)}
        </Box>
      ),
    },
    {
      id: "amountToBePaid",
      label: "Amount to be Paid",
      align: "right",
      width: 150,
      
      render: (row: {
        key: number;
        amountToBePaid: string | number;
        maxPayable: number;
        isSelected: boolean;
      }) => {
        const numericAmount = Number(
          typeof row.amountToBePaid === "number"
            ? row.amountToBePaid
            : parseFloat(sanitizeAmountInput(String(row.amountToBePaid)))
        );
        const hasError = row.isSelected && Number.isFinite(numericAmount) && numericAmount > row.maxPayable;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              minHeight: 40,
              position: "relative",
            }}
          >
            <TextField
              size="small"
              // padding="none"
              slotProps={{
                input: {
                  sx: {
                    padding: 0,
                    marginTop:1,
                    marginBottom:1,
                  },
                },
              }}
              
              type="text"
              value={row.isSelected ? formatAmountDisplay(row.amountToBePaid) : ""}
              placeholder={row.isSelected ? undefined : "—"}
              disabled={!row.isSelected || isBalancesPending}
              error={hasError}
              helperText={hasError ? "Cannot exceed due" : undefined}
              onChange={(e) =>
                setPerAmounts((prev) => ({
                  ...prev,
                  [row.key]: sanitizeAmountInput(e.target.value),
                }))
              }
              inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
              sx={{
                width: 120,
                m: 0,
                ...(hasError && {
                  "& .MuiFormHelperText-root": {
                    position: "absolute",
                    bottom: -8,
                    right: 0,
                    m: 0,
                    whiteSpace: "nowrap",
                  },
                }),
              }}
            />
          </Box>
        );
      },
    },
    {
      id: "balanceDue",
      label: "Balance Due",
      align: "right",
      width: 110,
      render: (row: { balanceDue: number; isSelected: boolean }) => (
        <Box
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: row.isSelected ? 600 : 400,
            color: row.isSelected ? "text.primary" : "text.disabled",
          }}
        >
          {formatInr(row.balanceDue)}
        </Box>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ModalElement
        open={open}
        onClose={onClose}
        title="Record Payment"
        maxWidth={sameDatePayment ? "sm" : "xl"}
      >
        <Box
          pt={1}
          sx={{
            "& input[type=number]": { MozAppearance: "textfield" },
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              { WebkitAppearance: "none", margin: 0 },
          }}
        >
          {submitError ? (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              {submitError}
            </Typography>
          ) : null}
          {!isPartiallyPaid ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2.5}
            >
              <Typography variant="body2" color="text.secondary">
                Do you want to pay all employees on the same date?
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={sameDatePayment}
                    onChange={(e) => setSameDatePayment(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    {sameDatePayment ? "Yes" : "No"}
                  </Typography>
                }
                labelPlacement="end"
                sx={{ mr: 0 }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Same-date payment is disabled for partially paid payrolls.
            </Typography>
          )}

          {sameDatePayment ? (
            <>
              <FieldRow label="Payment Account">
                <SingleSelectElement
                  label="Account"
                  value={toAccountValue(paymentAccountId)}
                  onChange={(v) => setPaymentAccountId(parseAccountValue(v as string))}
                  options={accountOptions}
                  fullWidth
                  sx={{ minWidth: 0 }}
                />
              </FieldRow>
              <FieldRow label="Employee(s) paid on">
                <DatePicker
                  value={paymentDate}
                  onChange={(val) => setPaymentDate(val)}
                  format="MMM DD, YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </FieldRow>

            </>
          ) : (
            <>
              <FieldRow label="Payment Account">
                <SingleSelectElement
                  label="Account"
                  value={toAccountValue(paymentAccountId)}
                  onChange={(v) => setPaymentAccountId(parseAccountValue(v as string))}
                  options={accountOptions}
                  fullWidth
                  sx={{ minWidth: 0 }}
                />
              </FieldRow>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Select employees to pay. Only selected rows are included when you confirm.
              </Typography>

              <Box sx={{ position: "relative", width: "100%", minWidth: 0, mb: 2 }}>
                <StandardTable
                  sticky
                  loading={isBalancesPending}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    maxHeight: "min(60vh, 520px)",
                    overflow: "auto",
                    minWidth: 1020,
                    width: "100%",
                  }}
                  columns={paymentTableColumns}
                  rows={paymentTargets.map((row) => {
                    const isSelected = selectedKeys.has(row.key);
                    const amountToPay = getAmount(row);
                    const balanceDue = isSelected
                      ? Math.max(0, row.currentDue - amountToPay)
                      : row.currentDue;
                    return {
                      id: row.key,
                      key: row.key,
                      name: row.name,
                      isSelected,
                      date: perDates[row.key] ?? defaultPaymentDayjs,
                      netPay: row.netPay,
                      amountPaid: row.amountPaid,
                      maxPayable: row.currentDue,
                      amountToBePaid:
                        perAmounts[row.key] !== undefined ? perAmounts[row.key] : row.currentDue,
                      balanceDue,
                    };
                  })}
                  emptyMessage={
                    isBalancesPending
                      ? "Loading employee balances…"
                      : "No employees with balance due."
                  }
                />
              </Box>
            </>
          )}

          <Box display="flex" justifyContent="flex-end" mt={1}>
            <PrimaryButton
              variant="contained"
              onClick={handleConfirm}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? <CircularProgress size={16} color="inherit" /> : "Confirm"}
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>
    </LocalizationProvider>
  );
}
