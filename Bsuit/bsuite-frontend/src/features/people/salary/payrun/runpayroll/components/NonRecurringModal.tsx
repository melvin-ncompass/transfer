import { useState, useMemo, type KeyboardEvent } from "react";
import { Box, TextField, CircularProgress, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { useGetEarningsQuery } from "../../../structure/Earnings/api/earnings.api";
import { useGetDeductionsQuery } from "../../../structure/Deductions/api/deductions.api";
import type { NonRecurringKind, NonRecurringDraftRow } from "../types";
import { sanitizeNumericInput, formatNumericInput } from "../utils";

export function NonRecurringModal({
  open,
  onClose,
  kind,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  kind: NonRecurringKind;
  onConfirm: (rows: { componentId: number; monthlyAmount: number }[]) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [rows, setRows] = useState<NonRecurringDraftRow[]>([
    { id: 1, componentId: "", monthlyAmount: "" },
  ]);
  const { data: earnings = [] } = useGetEarningsQuery(undefined, {
    skip: !open || kind !== "earning",
  });
  const { data: deductions = [] } = useGetDeductionsQuery(undefined, {
    skip: !open || kind !== "deduction",
  });

  const options = useMemo(() => {
    if (kind === "earning") {
      return earnings
        .filter((item) => item.isActive && item.earningFrequency === "non_recurring")
        .map((item) => ({ label: item.earningName, value: item.id ? String(item.id) : "" }))
        .filter((item) => item.value);
    }
    return deductions
      .filter((item) => item.isActive && item.deductionFrequency === "non_recurring")
      .map((item) => ({ label: item.deductionName, value: String(item.id) }))
      .filter((item) => item.value);
  }, [kind, earnings, deductions]);

  const updateRow = (id: number, patch: Partial<NonRecurringDraftRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const getPrefilledAmount = (componentId: string): string => {
    if (!componentId) return "";
    if (kind === "earning") {
      const selected = earnings.find((item) => String(item.id) === componentId);
      const amount = Number(selected?.amount ?? "");
      return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
    }
    const selected = deductions.find((item) => String(item.id) === componentId);
    const amount = Number(selected?.amount ?? "");
    return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
  };

  const blockInvalidNumberChars = (event: KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: (prev[prev.length - 1]?.id ?? 0) + 1, componentId: "", monthlyAmount: "" },
    ]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const resetAndClose = () => {
    setRows([{ id: 1, componentId: "", monthlyAmount: "" }]);
    onClose();
  };

  const handleConfirm = async () => {
    const payload = rows
      .filter((row) => row.componentId && row.monthlyAmount.trim() !== "")
      .map((row) => ({
        componentId: Number(row.componentId),
        monthlyAmount: Number(sanitizeNumericInput(row.monthlyAmount)),
      }))
      .filter((row) => row.componentId > 0 && row.monthlyAmount > 0);

    if (payload.length === 0) return;
    await onConfirm(payload);
    resetAndClose();
  };

  return (
    <ModalElement
      open={open}
      onClose={resetAndClose}
      title={`Add Non-Recurring ${kind === "earning" ? "Earning" : "Deduction"}`}
      maxWidth="md"
    >
      <Box
        pt={1}
        sx={{
          "& input[type=number]": { MozAppearance: "textfield" },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            { WebkitAppearance: "none", margin: 0 },
        }}
      >
        {rows.map((row) => (
          <Box key={row.id} display="flex" gap={1.5} mb={1.5} alignItems="center">
            <SingleSelectElement
              label={`Select Non-Recurring ${kind === "earning" ? "Earning" : "Deduction"}`}
              value={row.componentId}
              onChange={(value) =>
                updateRow(row.id, {
                  componentId: value,
                  monthlyAmount: getPrefilledAmount(value),
                })
              }
              options={options}
              required
              fullWidth
            />
            <TextField
              size="small"
              label={`Non-Recurring ${kind === "earning" ? "Earning" : "Deduction"} Amount`}
              value={formatNumericInput(row.monthlyAmount)}
              onChange={(e) =>
                updateRow(row.id, { monthlyAmount: sanitizeNumericInput(e.target.value) })
              }
              onKeyDown={blockInvalidNumberChars}
              type="text"
              inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
              sx={{ minWidth: 240 }}
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Box mb={2}>
          <PrimaryButton variant="outlined" size="small" onClick={addRow}>
            + Add
          </PrimaryButton>
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <PrimaryButton onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={16} color="inherit" /> : "Confirm"}
          </PrimaryButton>
        </Box>
      </Box>
    </ModalElement>
  );
}
