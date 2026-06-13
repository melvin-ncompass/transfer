import { Avatar, Box, IconButton, Paper, Typography } from "@mui/material";
import { useNotificationRowHighlight } from "../../../utils/notificationRowHighlight";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import UndoIcon from "@mui/icons-material/Undo";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Chip } from "../../../../../components/atom/chips";
import { Tooltip as TooltipAtom, type TooltipProps } from "../../../../../components/atom/tooltip";
import { getPartialLeaveHalfDisplay, type LeaveApprovalRequest } from "../../../approvals/api/approvals.api";
import { formatDateShort } from "../../../../../utils/numberFormatter";
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
  const text =
    request.rejectionReason?.trim() ||
    request.note?.trim() ||
    request.durationLabel?.trim();
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

export function MeLeaveRequestCard({
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
    4 +
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
        <Box
          display="flex"
          alignItems="flex-start"
          flexDirection="column"
          justifyContent="flex-start"
          gap={0.3}
          sx={{ minWidth: 0 }}
        >
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Request Type
          </Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Chip label={request.requestType} size="xs" />
            {noteTooltip ? (
              <LeaveRequestCardTooltip title={noteTooltip}>
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 14,
                    color: "text.secondary",
                    cursor: "pointer",
                    display: "block",
                  }}
                  aria-label="View note"
                />
              </LeaveRequestCardTooltip>
            ) : null}
          </Box>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          flexDirection="column"
          sx={{ minWidth: 0 }}
          gap={0.3}
        >
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Leave Type
          </Typography>
          <Box sx={{ display: "inline-flex" }}>
            <Chip label={request.leaveType} size="xs" />
          </Box>
        </Box>

        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Dates Applied
          </Typography>
          <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={500}
              variant="caption"
              sx={{
                whiteSpace: "normal",
                overflowWrap: "anywhere",
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
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Requested On
          </Typography>
          <Typography variant="caption">
            {formatDateShort(request.requestedOn)}
          </Typography>
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
                flexDirection="column"
                justifyContent="flex-start"
                sx={{ minWidth: 0 }}
                gap={0.3}
              >
                <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  <Chip label={request.status} size="xs" color={leaveStatusChipColor[request.status]} />
                  {rejectionTooltip ? (
                    <LeaveRequestCardTooltip title={rejectionTooltip}>
                      <InfoOutlinedIcon
                        sx={{
                          fontSize: 14,
                          color: "text.secondary",
                          cursor: "pointer",
                          display: "block",
                        }}
                        aria-label="View rejection reason"
                      />
                    </LeaveRequestCardTooltip>
                  ) : null}
                </Box>
              </Box>
            ) : null}
            {showUpdatedByColumn ? (
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
                  Updated By
                </Typography>
                <Typography variant="caption">
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
