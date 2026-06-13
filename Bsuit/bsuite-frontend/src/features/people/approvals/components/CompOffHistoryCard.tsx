import { Avatar, Box, IconButton, Paper, Typography } from "@mui/material";
import { useNotificationRowHighlight } from "../../utils/notificationRowHighlight";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import UndoIcon from "@mui/icons-material/Undo";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { Chip } from "../../../../components/atom/chips";
import { Tooltip as TooltipAtom, type TooltipProps } from "../../../../components/atom/tooltip";
import type { AttendanceApprovalRequest } from "../api/approvals.api";

function CompOffCardTooltip(props: TooltipProps) {
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

function isRegularizationRequestType(requestType: string): boolean {
  const t = String(requestType).toLowerCase();
  return t.includes("regularis") || t.includes("regulariz");
}

function getCompOffNoteTooltip(request: AttendanceApprovalRequest): string | null {
  const text = request.note?.trim();
  return text || null;
}

function getCompOffRejectionTooltip(request: AttendanceApprovalRequest): string | null {
  if (request.status !== "Rejected" && request.status !== "Cancelled") return null;
  const text = request.cancellationMsg?.trim();
  return text || null;
}

export function CompOffHistoryCard({
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

  const noteTooltip = getCompOffNoteTooltip(request);
  const rejectionTooltip = getCompOffRejectionTooltip(request);
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
    2 +
    (showStatusColumn ? 1 : 0) +
    (showUpdatedByColumn ? 1 : 0) +
    (isHistoryLayout ? 1 : 0);
  const columns = showActions
    ? "repeat(3, minmax(0, 1fr)) 120px"
    : isHistoryLayout
      ? "repeat(5, minmax(0, 1fr)) 120px"
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

        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={500} variant="body2">
            {request.date}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography fontWeight={500} variant="body2">
              {request.requestedOn}
            </Typography>
            {noteTooltip ? (
              <CompOffCardTooltip title={noteTooltip}>
                <InfoOutlined
                  sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }}
                  aria-label="View note"
                />
              </CompOffCardTooltip>
            ) : null}
          </Box>
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
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap={0.25}>
              <CompOffCardTooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => onApprove?.(request)}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </CompOffCardTooltip>
              <CompOffCardTooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => onReject?.(request)}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </CompOffCardTooltip>
            </Box>
          </Box>
        ) : (
          <>
            {showStatusColumn ? (
              <Box sx={{ minWidth: 0, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <Chip label={request.status} size="small" color={attendanceStatusChipColor[request.status]} />
                {rejectionTooltip ? (
                  <CompOffCardTooltip title={rejectionTooltip}>
                    <InfoOutlined
                      sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }}
                      aria-label="View rejection reason"
                    />
                  </CompOffCardTooltip>
                ) : null}
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
                  <CompOffCardTooltip title="Cancel approval">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => onCancelApproved?.(request)}
                      aria-label="Cancel approval"
                    >
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </CompOffCardTooltip>
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
