import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useReopenTicketMutation } from "../../api/ticket.api";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";


interface ReopenTicketModalProps {
  open: boolean;
  ticketId: number | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function ReopenTicketModal({
  open,
  ticketId,
  onClose,
  onSuccess,
  onError,
}: ReopenTicketModalProps) {
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const [reopenTicket, { isLoading }] = useReopenTicketMutation();

  const handleClose = () => {
    setMessage("");
    setValidationError("");
    onClose();
  };

  const handleSave = async () => {
    if (!ticketId) return;
    if (!message.trim()) {
      setValidationError("Message is required");
      return;
    }

    try {
      const response = await reopenTicket({
        id: ticketId,
        body: { message: message.trim() },
      }).unwrap();
      onSuccess?.(response.message ?? "Ticket reopened successfully");
      handleClose();
    } catch (error) {
      onError?.(getBackendMessage(error, "Failed to reopen ticket"));
    }
  };

  return (
    <ModalElement open={open} onClose={handleClose} title="Reopen Ticket" maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextFieldElement
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
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
          <PrimaryButton onClick={handleSave} disabled={isLoading}>
            Save
          </PrimaryButton>
        </Box>
      </Stack>
    </ModalElement>
  );
}
