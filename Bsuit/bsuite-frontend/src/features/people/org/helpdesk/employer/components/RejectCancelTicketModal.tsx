import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useRejectAndCancelTicketMutation } from "../../api/ticket.api";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";

interface RejectCancelTicketModalProps {
  open: boolean;
  ticketId: number | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function RejectCancelTicketModal({
  open,
  ticketId,
  onClose,
  onSuccess,
  onError,
}: RejectCancelTicketModalProps) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");

  const [rejectAndCancelTicket, { isLoading }] = useRejectAndCancelTicketMutation();

  const handleClose = () => {
    setReason("");
    setValidationError("");
    onClose();
  };

  const handleSave = async () => {
    if (!ticketId) return;
    if (!reason.trim()) {
      setValidationError("Cancellation reason is required");
      return;
    }

    try {
      const response = await rejectAndCancelTicket({
        id: ticketId,
        body: { reason: reason.trim() },
      }).unwrap();
      onSuccess?.(response.message ?? "Ticket rejected and cancelled successfully");
      handleClose();
    } catch (error) {
      onError?.(getBackendMessage(error, "Failed to reject and cancel ticket"));
    }
  };

  return (
    <ModalElement open={open} onClose={handleClose} title="Reject & Cancel Ticket" maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Please provide the reason why this ticket is being rejected and cancelled. This note will be recorded publicly in the customer chat.
        </Typography>
        <TextFieldElement
          label="Rejection & Cancellation Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          required
        />
        {validationError && (
          <Typography color="error" variant="body2">
            {validationError}
          </Typography>
        )}
        <Box display="flex" justifyContent="flex-end" gap={1}>
          <PrimaryButton variant="outlined" onClick={handleClose} disabled={isLoading}>
            Cancel
          </PrimaryButton>
          <PrimaryButton onClick={handleSave} disabled={isLoading} color="error">
            Reject & Cancel
          </PrimaryButton>
        </Box>
      </Stack>
    </ModalElement>
  );
}
