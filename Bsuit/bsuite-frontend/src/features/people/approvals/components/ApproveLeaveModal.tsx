import { Box, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { PrimaryButton } from "../../../../components/atom/button";
import { getPartialLeaveHalfDisplay, type LeaveApprovalRequest } from "../api/approvals.api";

interface ApproveLeaveModalProps {
  open: boolean;
  onClose: () => void;
  leave: LeaveApprovalRequest | null;
  onConfirm: () => void;
  isLoading?: boolean;
  /** Leave vs attendance regularization / other employee requests (shared modal shape). */
  variant?: "leave" | "request";
}

export function ApproveLeaveModal({
  open,
  onClose,
  leave,
  onConfirm,
  isLoading = false,
  variant = "leave",
}: ApproveLeaveModalProps) {
  const isRequest = variant === "request";
  const title = isRequest ? "Approve request" : "Approve leave";
  const intro = isRequest
    ? "Review the request details below. Submit to approve."
    : "Review the leave details below. Submit to approve this request.";
  const typeLabel = isRequest ? "Request type" : "Leave type";
  const datesLabel = isRequest ? "Date" : "Dates applied";
  const durationLabel = isRequest ? "Clock timings" : "Duration";
  const partialHalf = getPartialLeaveHalfDisplay(
    leave?.partial,
    leave?.partialLeaveIndication ?? null
  );
  const noteText = leave?.note?.trim() ?? "";

  return (
    <ModalElement open={open} onClose={onClose} title={title} maxWidth="sm">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {intro}
        </Typography>
        <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 2 }}>
          <InfoRow label="Employee" value={leave?.employee ?? "—"} />
          <InfoRow label={typeLabel} value={leave?.leaveType ?? "—"} />
          <InfoRow label={datesLabel} value={leave?.datesAppliedDisplay ?? "—"} />
          {leave?.durationLabel &&
          !/^\d+\s*days?$/i.test(String(leave.durationLabel).trim()) ? (
            <InfoRow label={durationLabel} value={leave.durationLabel} />
          ) : null}
          <InfoRow label="Requested on" value={leave?.requestedOn ?? "—"} />
          {partialHalf ? (
            <InfoRow label="Half day" value={partialHalf.tooltipTitle} />
          ) : null}
          {isRequest ? (
            <InfoRow label="Note" value={noteText || "—"} multiline />
          ) : noteText ? (
            <InfoRow label="Employee note" value={noteText} multiline />
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <PrimaryButton onClick={onConfirm} disabled={!leave || isLoading} loading={isLoading}>
            {isRequest ? "Approve request" : "Approve leave"}
          </PrimaryButton>
        </Stack>
      </Stack>
    </ModalElement>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <Box sx={{ mb: 1.5, "&:last-child": { mb: 0 } }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={600}
        sx={multiline ? { whiteSpace: "pre-wrap", wordBreak: "break-word" } : undefined}
      >
        {value}
      </Typography>
    </Box>
  );
}
