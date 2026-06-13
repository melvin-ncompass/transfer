import { Avatar, Box, IconButton, Paper, Typography } from "@mui/material";
import { useNotificationRowHighlight } from "../../utils/notificationRowHighlight";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import UndoIcon from "@mui/icons-material/Undo";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { Chip } from "../../../../components/atom/chips";
import { Tooltip as TooltipAtom, type TooltipProps } from "../../../../components/atom/tooltip";
import { getPartialLeaveHalfDisplay, type LeaveApprovalRequest } from "../api/approvals.api";
import { formatDateShort } from "../../../../utils/numberFormatter";
import dayjs from "dayjs";

const normalizeDatesDisplay = (input: string): string => {
  if (!input) return input;

  const matches =
    input.match(/[A-Za-z]{3,9} \d{1,2},? \d{4}/g) ?? [];

  if (matches.length === 0) {
    return input;
  }

  const parsedDates = matches
    .map((d) => dayjs(d.replace(",", "")))
    .filter((d) => d.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf());

  if (parsedDates.length === 0) {
    return input;
  }

  const first = parsedDates[0];
  const last = parsedDates[parsedDates.length - 1];

  if (first.isSame(last, "day")) {
    return first.format("MMM DD, YYYY");
  }

  return `${first.format("MMM DD, YYYY")} - ${last.format("MMM DD, YYYY")} (${parsedDates.length})`;
};

function getLeaveNoteTooltip(request: LeaveApprovalRequest): string | null {
  const text = request.note?.trim();
  return text || null;
}

function getLeaveRejectionTooltip(request: LeaveApprovalRequest): string | null {
  if (request.status !== "Rejected" && request.status !== "Cancelled") return null;
  const text =
    request.cancellationMsg?.trim() || request.rejectionReason?.trim();
  return text || null;
}

/** Scroll/tab layouts: fixed Popper strategy for tooltips on action icons */
function LeaveRequestCardTooltip(props: TooltipProps) {
  return (
    <TooltipAtom
      {...props}
      slotProps={{
        ...props.slotProps,
        popper: {
          strategy: "fixed",
          ...props.slotProps?.popper,
        } as Record<string, unknown>,
      }}
    />
  );
}

const leaveStatusChipColor: Record<
  LeaveApprovalRequest["status"],
  "success" | "warning" | "error"
> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
  Cancelled: "warning",
};

export function LeaveRequestCard({
  request,
  showActions = false,
  onApprove,
  onReject,
  onCancelApproved,
  hideEmployeeName = false,
  hideStatus = false,
  hideUpdatedBy = false,
  highlightPulse = 0,
}: {
  request: LeaveApprovalRequest;
  showActions?: boolean;
  onApprove?: (request: LeaveApprovalRequest) => void;
  onReject?: (request: LeaveApprovalRequest) => void;
  /** Shown on history for Approved rows — revokes approval (manager) */
  onCancelApproved?: (request: LeaveApprovalRequest) => void;
  /** Me → My requests: omit redundant columns */
  hideEmployeeName?: boolean;
  hideStatus?: boolean;
  hideUpdatedBy?: boolean;
  highlightPulse?: number;
}) {
  const { surfaceSx: highlightSurfaceSx, surfaceKey: highlightSurfaceKey } =
    useNotificationRowHighlight(highlightPulse);

  const partialHalf = getPartialLeaveHalfDisplay(request.partial, request.partialLeaveIndication ?? null);
  const noteTooltip = getLeaveNoteTooltip(request);
  const rejectionTooltip = getLeaveRejectionTooltip(request);
  const showCancelApproval =
    typeof onCancelApproved === "function" && request.status === "Approved";
  /** History tab: same column count for Approved vs Rejected so cards align */
  const isHistoryLayout = !showActions && typeof onCancelApproved === "function";
  const showEmployeeColumn = !hideEmployeeName;
  const showStatusColumn = !hideStatus;
  const showUpdatedByColumn = !hideUpdatedBy;
  const nonActionColumnCount =
    (showEmployeeColumn ? 1 : 0) +
    2 +
    (showStatusColumn ? 1 : 0) +
    (showUpdatedByColumn ? 1 : 0) +
    (isHistoryLayout ? 1 : 0);
  const columns = showActions
    ? "repeat(4, minmax(0, 1fr)) 120px"
    : isHistoryLayout
      ? "repeat(6, minmax(0, 1fr)) 120px"
      : `repeat(${nonActionColumnCount}, minmax(0, 1fr))`;

  return (
    <Paper
      key={highlightSurfaceKey}
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        ...highlightSurfaceSx,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: columns,
          gap: 1,
          alignItems: "center",
          textAlign: "left",
          width: "100%",
        }}
      >
        {showEmployeeColumn ? (
          <Box
            sx={{
              minWidth: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Avatar
                alt={request.employee}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "1rem",
                }}
              >
                {request.employee
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </Avatar>

              <Typography fontWeight={500} variant="body2">
                {request.employee}
              </Typography>
            </Box>
          </Box>
        ) : null}
        <Box sx={{ display: "inline-flex" }}>
          <Chip
            label={request.leaveType}
            size="small"
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={500}
              variant="body2"
              sx={{
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                maxWidth: "clamp(120px, 12vw, 120px)",
                minWidth: 0,
                flex: 1,
              }}
            >
              {normalizeDatesDisplay(request.datesAppliedDisplay)}
            </Typography>
            {partialHalf ? (
              <LeaveRequestCardTooltip title={partialHalf.tooltipTitle}>
                <Chip
                  label={partialHalf.shortLabel}
                  size="xs"
                  color={request.status === "Rejected" ? "error" : "info"}
                />
              </LeaveRequestCardTooltip>
            ) : null}
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2">
              {formatDateShort(request.requestedOn)}
            </Typography>
            {noteTooltip ? (
              <LeaveRequestCardTooltip title={noteTooltip}>
                <InfoOutlined
                  sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }}
                  aria-label="View note"
                />
              </LeaveRequestCardTooltip>
            ) : null}
          </Box>
        </Box>

        {showActions ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={0.5}
            sx={{ minWidth: 0 }}
          >
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap={0.25}>
              <LeaveRequestCardTooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => onApprove?.(request)}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </LeaveRequestCardTooltip>
              <LeaveRequestCardTooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => onReject?.(request)}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </LeaveRequestCardTooltip>
            </Box>
          </Box>
        ) : (
          <>
            {showStatusColumn ? (
              <Box
                display="flex"
                alignItems="center"
                flexDirection="row"
                gap={1}
                justifyContent="flex-start"
                sx={{ minWidth: 0 }}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Chip label={request.status} size="small" color={leaveStatusChipColor[request.status]} />
                  {rejectionTooltip ? (
                    <LeaveRequestCardTooltip title={rejectionTooltip}>
                      <InfoOutlined
                        sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }}
                        aria-label="View rejection reason"
                      />
                    </LeaveRequestCardTooltip>
                  ) : null}
                </Box>
              </Box>
            ) : null}
            {showUpdatedByColumn ? (
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={500} variant="subtitle2">
                  {request.updatedBy}
                </Typography>
              </Box>
            ) : null}
            {isHistoryLayout ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={0.5}
                sx={{ minWidth: 0 }}
              >
                {showCancelApproval ? (
                  <LeaveRequestCardTooltip title="Cancel approval">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => onCancelApproved?.(request)}
                      aria-label="Cancel approval"
                    >
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </LeaveRequestCardTooltip>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ py: 0.5 }}>
                    —
                  </Typography>
                )}
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </Paper>
  );
}
