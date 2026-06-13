import { Avatar, Box, IconButton, Paper, Typography } from "@mui/material";
import { useNotificationRowHighlight } from "../../../utils/notificationRowHighlight";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import UndoIcon from "@mui/icons-material/Undo";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Chip } from "../../../../../components/atom/chips";
import { Tooltip as TooltipAtom, type TooltipProps } from "../../../../../components/atom/tooltip";
import type { AttendanceApprovalRequest } from "../../../approvals/api/approvals.api";

function AttendanceRequestCardTooltip(props: TooltipProps) {
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

const attendanceStatusChipColor: Record<
  AttendanceApprovalRequest["status"],
  "success" | "warning" | "error"
> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
  Cancelled: "warning",
};

function getAttendanceRejectionTooltip(request: AttendanceApprovalRequest): string | null {
  if (request.status !== "Rejected" && request.status !== "Cancelled") return null;
  const text = request.cancellationMsg?.trim();
  return text || null;
}

/** Regularization rows cannot cancel approval (product rule). Matches API spellings. */
function isRegularizationRequestType(requestType: string): boolean {
  const t = String(requestType).toLowerCase();
  return t.includes("regularis") || t.includes("regulariz");
}

export function MeAttendanceCard({
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
  request: AttendanceApprovalRequest;
  showActions?: boolean;
  onApprove?: (request: AttendanceApprovalRequest) => void;
  onReject?: (request: AttendanceApprovalRequest) => void;
  onCancelApproved?: (request: AttendanceApprovalRequest) => void;
  hideEmployeeName?: boolean;
  hideStatus?: boolean;
  hideUpdatedBy?: boolean;
  highlightPulse?: number;
}) {
  const { surfaceSx: highlightSurfaceSx, surfaceKey: highlightSurfaceKey } =
    useNotificationRowHighlight(highlightPulse);

  const noteTooltip = request.note?.trim() || null;
  const rejectionTooltip = getAttendanceRejectionTooltip(request);
  const showCancelApproval =
    typeof onCancelApproved === "function" &&
    request.status === "Approved" &&
    !isRegularizationRequestType(request.requestType);
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
        }}
      >
        {showEmployeeColumn ? (
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
        ) : null}

        <Box
          display="flex"
          alignItems="stretch"
          flexDirection="column"
          sx={{ minWidth: 0 }}
          gap={0.3}
        >
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Request Type
          </Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Chip label={request.requestType} size="xs" />
            {noteTooltip ? (
              <AttendanceRequestCardTooltip title={noteTooltip}>
                <InfoOutlinedIcon
                  sx={{
                    fontSize: 14,
                    color: "text.secondary",
                    cursor: "pointer",
                    display: "block",
                  }}
                  aria-label="View note"
                />
              </AttendanceRequestCardTooltip>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Date Applied
          </Typography>
          <Typography fontWeight={500} variant="caption">
            {request.date}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Requested On
          </Typography>
          <Typography fontWeight={500} variant="caption">
            {request.requestedOn}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
            Clock Timings
          </Typography>
          <Typography fontWeight={500} variant="caption">
            {request.clockTimings || "—"}
          </Typography>
        </Box>
        {showActions ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={0.5}
            sx={{ minWidth: 0 }}
          >
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" gap={0.25}>
              <AttendanceRequestCardTooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => onApprove?.(request)}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </AttendanceRequestCardTooltip>
              <AttendanceRequestCardTooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => onReject?.(request)}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </AttendanceRequestCardTooltip>
            </Box>
          </Box>
        ) : (
          <>
            {showStatusColumn ? (
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.3 }}>
                <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Box sx={{ minWidth: 0, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  <Chip label={request.status} size="xs" color={attendanceStatusChipColor[request.status]} />
                  {rejectionTooltip ? (
                    <AttendanceRequestCardTooltip title={rejectionTooltip}>
                      <InfoOutlinedIcon
                        sx={{
                          fontSize: 14,
                          color: "text.secondary",
                          cursor: "pointer",
                          display: "block",
                        }}
                        aria-label="View rejection reason"
                      />
                    </AttendanceRequestCardTooltip>
                  ) : null}
                </Box>
              </Box>
            ) : null}
            {showUpdatedByColumn ? (
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.3 }}>
                <Typography fontWeight={"bold"} variant="caption" color="textSecondary">
                  Updated By
                </Typography>
                <Typography fontWeight={500} variant="body2">
                  {request.updatedBy}
                </Typography>
              </Box>
            ) : null}
            {isHistoryLayout ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={0.5}
                sx={{ minWidth: 0 }}
              >
                {showCancelApproval ? (
                  <AttendanceRequestCardTooltip title="Cancel approval">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => onCancelApproved?.(request)}
                      aria-label="Cancel approval"
                    >
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </AttendanceRequestCardTooltip>
                ) : null}
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </Paper>
  );
}
