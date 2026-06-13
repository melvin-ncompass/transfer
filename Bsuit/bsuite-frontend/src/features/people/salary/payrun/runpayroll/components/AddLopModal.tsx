import { useState, type KeyboardEvent } from "react";
import { Box, TextField, CircularProgress } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { sanitizeNumericInput, formatNumericInput } from "../utils";

export function AddLopModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (lopDays: number) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [lopDays, setLopDays] = useState<string>("");

  const blockInvalidNumberChars = (event: KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
  };

  const resetAndClose = () => {
    setLopDays("");
    onClose();
  };

  const handleConfirm = async () => {
    const parsed = Number(sanitizeNumericInput(lopDays));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    await onConfirm(parsed);
    resetAndClose();
  };

  return (
    <ModalElement open={open} onClose={resetAndClose} title="Add LOP" maxWidth="sm">
      <Box
        pt={1}
        sx={{
          "& input[type=number]": { MozAppearance: "textfield" },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            { WebkitAppearance: "none", margin: 0 },
        }}
      >
        <TextField
          size="small"
          label="Number of LOP (days)"
          value={formatNumericInput(lopDays)}
          onChange={(e) => setLopDays(sanitizeNumericInput(e.target.value))}
          onKeyDown={blockInvalidNumberChars}
          type="text"
          inputProps={{ min: 0.01, step: 0.01, inputMode: "decimal" }}
          fullWidth
          required
        />
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <PrimaryButton
            onClick={handleConfirm}
            disabled={
              isSubmitting ||
              !Number.isFinite(Number(sanitizeNumericInput(lopDays))) ||
              Number(sanitizeNumericInput(lopDays)) <= 0
            }
          >
            {isSubmitting ? <CircularProgress size={16} color="inherit" /> : "Confirm"}
          </PrimaryButton>
        </Box>
      </Box>
    </ModalElement>
  );
}
