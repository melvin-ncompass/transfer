import { useState, useEffect, useMemo } from "react";
import { Stack, Box, Typography } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../components/atom/date-picker";
import { PrimaryButton } from "../../../../components/atom/button";
import type { ExpenseClaimResponse } from "../api/approvals.api";
import { useGetAccountsQuery } from "../../../books/coa/account/api/accounts.api";

interface MakePaymentExpenseModalProps {
  open: boolean;
  onClose: () => void;
  claim: ExpenseClaimResponse | null;
  onSubmit: (paymentAccountId: number, paymentDate: string) => void;
  isLoading?: boolean;
}

export function MakePaymentExpenseModal({
  open,
  onClose,
  claim,
  onSubmit,
  isLoading = false,
}: MakePaymentExpenseModalProps) {
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState<Dayjs | null>(dayjs());

  const { data: accountsData } = useGetAccountsQuery({ type: "" }, { skip: !open });
  const accounts = (accountsData as any)?.data ?? [];

  // Grouped payment account options (Asset / Liability / Income / Expense), same format as useAllAccountOptions
  const paymentAccountOptions = useMemo(() => {
    const grouped: Record<string, { label: string; value: string }[]> = {
      Asset: [],
      Liability: [],
      Income: [],
      Expense: [],
    };
    (accounts as any[]).forEach((acc: any) => {
      const accType = (acc.accountType || "").toLowerCase();
      if (!["asset", "liability", "income", "expense"].some((t) => accType.includes(t))) return;
      const name = (acc.accountName || acc.name || "").toLowerCase();
      if (
        name.includes("accounts receivable") ||
        name.includes("accounts payable") ||
        name.includes("in transit")
      )
        return;
      const displayName = acc.accountName || acc.name || "Unnamed Account";
      const currency = (acc.accountCurrency?.split("-")[0] || "").trim();
      const label = `${displayName}${currency ? ` (${currency})` : ""}`;
      const option = { label, value: String(acc.id) };
      if (accType.includes("asset")) grouped.Asset.push(option);
      else if (accType.includes("liability")) grouped.Liability.push(option);
      else if (accType.includes("income")) grouped.Income.push(option);
      else if (accType.includes("expense")) grouped.Expense.push(option);
    });
    return [
      ...(grouped.Asset.length ? [{ label: "Asset", options: grouped.Asset }] : []),
      ...(grouped.Liability.length ? [{ label: "Liability", options: grouped.Liability }] : []),
      ...(grouped.Income.length ? [{ label: "Income", options: grouped.Income }] : []),
      ...(grouped.Expense.length ? [{ label: "Expense", options: grouped.Expense }] : []),
    ];
  }, [accounts]);

  useEffect(() => {
    if (!open) {
      setPaymentAccountId("");
      setPaymentDate(dayjs());
    }
  }, [open]);

  const handleClose = (): void => {
    setPaymentAccountId("");
    setPaymentDate(dayjs());
    onClose();
  };

  const handleSubmit = (): void => {
    const accountId = Number(paymentAccountId);
    const dateStr = paymentDate?.format("YYYY-MM-DD");
    if (!accountId || !dateStr) return;
    onSubmit(accountId, dateStr);
  };

  const employeeName = claim?.employee?.contact?.name ?? (claim?.employee as any)?.nameAsPerPan ?? claim?.employee?.employeeId ?? "—";
  const amount =
    claim != null
      ? `₹${Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : "—";
  const isValid = Boolean(paymentAccountId && paymentDate);

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title="Make payment"
      maxWidth="sm"
    >
      <Stack spacing={2}>
        <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Employee
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {employeeName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Amount
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {amount}
          </Typography>
        </Box>
        <SingleSelectElement
          label="Payment account"
          value={paymentAccountId}
          onChange={setPaymentAccountId}
          options={paymentAccountOptions}
          fullWidth
          required
        />
        <DatePickerElement
          label="Payment date"
          value={paymentDate}
          onChange={setPaymentDate}
          required
          width="100%"
          max={dayjs()}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            loading={isLoading}
          >
            Make payment
          </PrimaryButton>
        </Stack>
      </Stack>
    </ModalElement>
  );
}
