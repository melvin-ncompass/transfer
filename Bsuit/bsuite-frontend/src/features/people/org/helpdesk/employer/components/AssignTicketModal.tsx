import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import { useAssignTicketMutation } from "../../api/ticket.api";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";

interface AssignTicketModalProps {
  open: boolean;
  ticketId: number | null;
  currentAssigneeId?: number | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function AssignTicketModal({
  open,
  ticketId,
  currentAssigneeId,
  onClose,
  onSuccess,
  onError,
}: AssignTicketModalProps) {
  const [assigneeId, setAssigneeId] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (open) {
      setAssigneeId(currentAssigneeId ? String(currentAssigneeId) : "");
    }
  }, [open, currentAssigneeId]);

  const { data: employeesData } = useGetEmployeesQuery();
  const [assignTicket, { isLoading }] = useAssignTicketMutation();

  const employeeOptions = useMemo(
    () =>
      employeesData?.data?.map((employee) => ({
        label:
          employee.name ||
          employee.contact?.name ||
          employee.nameAsPerPan ||
          "Unnamed Employee",
        value: String(employee.id),
      })) ?? [],
    [employeesData],
  );

  const handleClose = () => {
    setAssigneeId(currentAssigneeId ? String(currentAssigneeId) : "");
    setValidationError("");
    onClose();
  };

  const handleSave = async () => {
    if (!ticketId) return;
    if (!assigneeId) {
      setValidationError("Assignee is required");
      return;
    }

    try {
      const response = await assignTicket({
        id: ticketId,
        body: { assigneeId: Number(assigneeId) },
      }).unwrap();
      onSuccess?.(response.message ?? "Ticket assigned successfully");
      handleClose();
    } catch (error) {
      onError?.(getBackendMessage(error, "Failed to assign ticket"));
    }
  };

  return (
    <ModalElement open={open} onClose={handleClose} title="Assign Ticket" maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 1 }}>
        <SingleSelectElement
          label="Assignee"
          value={assigneeId}
          onChange={setAssigneeId}
          options={employeeOptions}
          required
          width="100%"
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
