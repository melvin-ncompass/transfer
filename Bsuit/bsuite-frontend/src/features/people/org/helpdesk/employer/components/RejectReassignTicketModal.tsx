import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useRejectAndReassignTicketMutation } from "../../api/ticket.api";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";

interface RejectReassignTicketModalProps {
  open: boolean;
  ticketId: number | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function RejectReassignTicketModal({
  open,
  ticketId,
  onClose,
  onSuccess,
  onError,
}: RejectReassignTicketModalProps) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");

  const [rejectAndReassignTicket, { isLoading }] = useRejectAndReassignTicketMutation();

  const handleClose = () => {
    setReason("");
    setValidationError("");
    onClose();
  };

  const handleSave = async () => {
    if (!ticketId) return;
    if (!reason.trim()) {
      setValidationError("Reassignment justification is required");
      return;
    }

    try {
      const response = await rejectAndReassignTicket({
        id: ticketId,
        body: { reason: reason.trim() },
      }).unwrap();
      onSuccess?.(response.message ?? "Ticket successfully returned to the queue");
      handleClose();
    } catch (error) {
      onError?.(getBackendMessage(error, "Failed to return ticket to queue"));
    }
  };

  return (
    <ModalElement open={open} onClose={handleClose} title="Reject & Reassign Ticket" maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Please explain why you are rejecting this ticket and returning it to the queue. This will be stored as an **internal note** for other agents and will not be visible to the customer.
        </Typography>
        <TextFieldElement
          label="Justification for Queue Return"
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
          <PrimaryButton onClick={handleSave} disabled={isLoading} color="warning">
            Reject & Reassign
          </PrimaryButton>
        </Box>
      </Stack>
    </ModalElement>
  );
}
