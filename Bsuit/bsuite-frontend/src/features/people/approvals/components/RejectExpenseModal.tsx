import { useState, useEffect } from "react";
import { Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { TextFieldElement } from "../../../../components/atom/text-field/TextField";
import { PrimaryButton } from "../../../../components/atom/button";
import type { ExpenseClaimResponse } from "../api/approvals.api";

interface RejectExpenseModalProps {
  open: boolean;
  onClose: () => void;
  claim: ExpenseClaimResponse | null;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

export function RejectExpenseModal({
  open,
  onClose,
  claim,
  onSubmit,
  isLoading = false,
}: RejectExpenseModalProps) {
  const employeeName = claim?.employee?.contact?.name ?? "";
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleSubmit = (): void => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title="Reject expense claim"
      maxWidth="sm"
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {employeeName
            ? `Please provide a reason for rejecting ${employeeName}'s expense claim. This will be shared with the employee.`
            : "Please provide a reason for rejecting this expense claim. This will be shared with the employee."}
        </Typography>
        <TextFieldElement
          label="Rejection reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          placeholder="Enter reason for rejection..."
          fullWidth
          required
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
            loading={isLoading}
          >
            Submit
          </PrimaryButton>
        </Stack>
      </Stack>
    </ModalElement>
  );
}
