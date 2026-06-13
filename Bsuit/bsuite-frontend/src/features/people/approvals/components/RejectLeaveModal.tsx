import { useState, useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { TextAreaField } from "../../../../components/atom/text-area-field";
import { PrimaryButton } from "../../../../components/atom/button";
import { getPartialLeaveHalfDisplay, type LeaveApprovalRequest } from "../api/approvals.api";

interface RejectLeaveModalProps {
  open: boolean;
  onClose: () => void;
  leave: LeaveApprovalRequest | null;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
  /** "cancelApproved" = revoke an already-approved request (history tab) */
  variant?: "reject" | "cancelApproved";
}

export function RejectLeaveModal({
  open,
  onClose,
  leave,
  onSubmit,
  isLoading = false,
  variant = "reject",
}: RejectLeaveModalProps) {
  const isCancelApproved = variant === "cancelApproved";
  const [reason, setReason] = useState("");
  const partialHalf = getPartialLeaveHalfDisplay(
    leave?.partial,
    leave?.partialLeaveIndication ?? null
  );
  const noteText = leave?.note?.trim() ?? "";
  const isAttendanceRequest =
    leave?.requestType != null &&
    !String(leave.requestType).toLowerCase().includes("leave");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title={isCancelApproved ? "Cancel approval" : "Reject leave"}
      maxWidth="sm"
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {isCancelApproved
            ? leave?.employee
              ? `This will revoke your approval for ${leave.employee}'s request. Provide a reason — it will be visible to the employee.`
              : "This will revoke your approval for this request. Provide a reason — it will be visible to the employee."
            : leave?.employee
              ? `Provide a rejection reason for ${leave.employee}'s leave request. This will be visible to the employee.`
              : "Provide a rejection reason. This will be visible to the employee."}
        </Typography>
        {leave ? (
          <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {leave.leaveType} · {leave.datesAppliedDisplay}
            </Typography>
            {partialHalf ? (
              <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                {partialHalf.tooltipTitle}
              </Typography>
            ) : null}
            {isAttendanceRequest && noteText ? (
              <Typography
                variant="body2"
                sx={{ mt: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                <Typography component="span" variant="caption" color="text.secondary">
                  Note:{" "}
                </Typography>
                {noteText}
              </Typography>
            ) : null}
          </Box>
        ) : null}
        <TextAreaField
          label={isCancelApproved ? "Reason for cancellation" : "Rejection reason"}
          value={reason}
          onChange={setReason}
          rows={4}
          width="100%"
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
            loading={isLoading}
          >
            {isCancelApproved ? "Cancel approval" : "Submit"}
          </PrimaryButton>
        </Stack>
      </Stack>
    </ModalElement>
  );
}
