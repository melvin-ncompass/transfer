import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useGetAllClosingReasonsQuery } from "../../api/closure.api";
import { useCloseTicketMutation } from "../../api/ticket.api";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";


interface CloseTicketModalProps {
  open: boolean;
  ticketId: number | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function CloseTicketModal({
  open,
  ticketId,
  onClose,
  onSuccess,
  onError,
}: CloseTicketModalProps) {
  const [reasonId, setReasonId] = useState("");
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const { data: closingReasonsData } = useGetAllClosingReasonsQuery();
  const [closeTicket, { isLoading }] = useCloseTicketMutation();

  const closingReasonOptions =
    closingReasonsData?.data
      ?.filter((reason) => reason.isActive !== false)
      .map((reason) => ({
        label: reason.reason,
        value: String(reason.id),
      })) ?? [];

  const reset = () => {
    setReasonId("");
    setMessage("");
    setValidationError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!ticketId) return;

    if (!reasonId) {
      setValidationError("Closing reason is required");
      return;
    }
    if (!message.trim()) {
      setValidationError("Resolution message is required");
      return;
    }

    try {
      const response = await closeTicket({
        id: ticketId,
        body: {
          reasonId: Number(reasonId),
          message: message.trim(),
        },
      }).unwrap();
      onSuccess?.(response.message ?? "Ticket closed successfully");
      handleClose();
    } catch (error) {
      onError?.(getBackendMessage(error, "Failed to close ticket"));
    }
  };

  return (
    <ModalElement open={open} onClose={handleClose} title="Close Ticket" maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 1 }}>
        <SingleSelectElement
          label="Closing Reason"
          value={reasonId}
          onChange={setReasonId}
          options={closingReasonOptions}
          required
          width="100%"
        />
        <TextFieldElement
          label="Resolution Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
          <PrimaryButton onClick={handleSave} disabled={isLoading}>
            Save
          </PrimaryButton>
        </Box>
      </Stack>
    </ModalElement>
  );
}
