import { Stack } from "@mui/system";
import { Avatar, Box, Card, CircularProgress, IconButton, Paper, Typography, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { Chip } from "../../../../components/atom/chips";
import { PrimaryButton } from "../../../../components/atom/button";
import { Tooltip as TooltipAtom, type TooltipProps } from "../../../../components/atom/tooltip";
import dayjs, { type Dayjs } from "dayjs";

import { useImperativeHandle, useState, forwardRef, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DateRangePicker } from "../../../../components/atom/custom-date-range-picker";
import { FilterModal } from "./FilterModal";
import { LeaveRequestCard } from "./LeaveRequestCard";
import { AttendanceRequestCard } from "./AttendanceRequestCard";
import { TabsAtom, type TabItem } from "../../../../components/tabs";
import { useGetEmployeeInfoQuery } from "../../api/people.api";
import {
  useGetExpenseClaimsByApproverQuery,
  useGetApproverEmployeesRequestsQuery,
  useGetAdminEmployeeRequestsQueueQuery,
  filterApproverEmployeeRequestsPayload,
  filterCompOffAttendanceRequests,
  filterRegularizeAttendanceRequests,
  useApproveExpenseClaimMutation,
  useRejectExpenseClaimMutation,
  usePayExpenseClaimMutation,
  useApproveEmployeeRequestMutation,
  useRejectOrCancelEmployeeRequestMutation,
  splitGroupedEmployeeRequestsToLeaveAndAttendance,
  attendanceRequestToLeaveModalShim,
  type ExpenseClaimResponse,
  type LeaveApprovalRequest,
} from "../api/approvals.api";
import { Snackbar } from "../../../../components/atom/snackbar";
import { ApproveExpenseModal } from "./ApproveExpenseModal";
import { RejectExpenseModal } from "./RejectExpenseModal";
import { ApproveLeaveModal } from "./ApproveLeaveModal";
import { RejectLeaveModal } from "./RejectLeaveModal";
import { MakePaymentExpenseModal } from "./MakePaymentExpenseModal";
import AttachmentPreviewModal from "../../../books/transact/transactHome/components/dialogs/AttachmentPreviewModal";
import { formatDateShort } from "../../../../utils/numberFormatter";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { useGetEmployeesQuery } from "../../org/people/directory/api/directory.api";
import { useGetNextPayableQuery } from "../../salary/payrun/runpayroll/api/payrun.api";
import { CompOffPending } from "./CompOffPending";
import { CompOffHistoryCard } from "./CompOffHistoryCard";
import {
  NOTIFICATION_DEEP_LINK_DOM_READY_MS,
  NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS,
} from "../../utils/notificationRowHighlight";
import {
  useGetPoiApprovalsQuery,
  formatFinancialYearLabel,
  getItDeclarationEmployeeDisplayName,
  getItDeclarationStatusChipColor,
  getPoiApprovalEmployeePk,
  type ApprovalPendingITDeclaration,
} from "../../me/investments/api/itDeclaration.api";
import { useNotificationDeepLinkRefresh } from "../../utils/useNotificationDeepLinkRefresh";
import {
  defaultWideRangeForDeepLink,
  expandRangeToIncludeNotificationDate,
  NOTIF_DATE_URL_PARAM,
} from "../../utils/notificationDateRange";

function requestMatchesRedirectId(
  request: { groupReqId?: string | number | null; id: number | string },
  redirectId: string,
): boolean {
  return (
    String(request.groupReqId) === redirectId ||
    String(request.id) === redirectId
  );
}

/** Approvals-only: Popper `strategy: fixed` in scroll/tab layouts. Rest of the app uses default `TooltipAtom`. */
function ApprovalsTooltip(props: TooltipProps) {
  return (
    <TooltipAtom
      {...props}
      slotProps={{
        ...props.slotProps,
        popper: {
          strategy: "fixed",
          ...props.slotProps?.popper,
          // MUI v7 slot typing omits Popper `strategy`; runtime is valid
        } as Record<string, unknown>,
      }}
    />
  );
}

const expenseClaimStatusChipColor: Record<string, "success" | "warning" | "error" | "primary"> = {
  draft: "primary",
  pending: "warning",
  approved: "success",
  rejected: "error",
  paid: "success",
};

const expenseCardPaperSx = (theme: Theme) => ({
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  backgroundColor: theme.palette.secondary.light,
  overflow: "hidden",
  mb: 1,
  px: 2,
  py: 1.5,
});

function getExpenseCommentTooltip(claim: ExpenseClaimResponse): string | null {
  const text = claim.comment?.trim();
  return text || null;
}

function getExpenseRejectionTooltip(claim: ExpenseClaimResponse): string | null {
  const status = (claim.status ?? "").toString().toLowerCase();
  if (status !== "rejected") return null;
  const text = claim.rejectionReason?.trim();
  return text || null;
}

function ExpenseTitleCell({
  expenseTitle,
  commentTooltip,
}: {
  expenseTitle: string;
  commentTooltip: string | null;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, overflow: "hidden" }}>
      <ApprovalsTooltip title={expenseTitle} placement="top-start">
        <Typography
          variant="body2"
          noWrap
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            minWidth: 0,
            flex: 1,
            cursor: "default",
          }}
        >
          {expenseTitle}
        </Typography>
      </ApprovalsTooltip>
      {commentTooltip ? (
        <ApprovalsTooltip title={commentTooltip}>
          <InfoOutlined
            sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer", flexShrink: 0 }}
            aria-label="View comment"
          />
        </ApprovalsTooltip>
      ) : null}
    </Box>
  );
}

function ExpenseClaimApprovalCard({
  claim,
  onApprove,
  onReject,
  onPreviewAttachment,
}: {
  claim: ExpenseClaimResponse;
  onApprove: (claim: ExpenseClaimResponse) => void;
  onReject: (claim: ExpenseClaimResponse) => void;
  onPreviewAttachment: (attachments: { filename: string; path: string }[], index: number) => void;
}) {
  const theme = useTheme();
  const date = claim.expenseDate ? dayjs(claim.expenseDate).format("DD MMM YYYY") : "—";
  const employeeName = claim.employee?.contact?.name ?? "—";
  const category = claim.category?.categoryName ?? "—";
  const expenseTitle = claim.expenseTitle?.trim() || "—";
  const commentTooltip = getExpenseCommentTooltip(claim);
  const amount = `₹${Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const requestedOn = claim.requestedOn
    ? dayjs(claim.requestedOn).format("DD MMM YYYY")
    : "—";
  const attachments = claim.attachments ?? [];

  return (
    <Paper elevation={0} sx={expenseCardPaperSx(theme)}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 80px 120px",
          gap: 2,
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar alt={employeeName} sx={{ width: 32, height: 32, fontSize: "1rem" }}>
            {employeeName.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {employeeName}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <ApprovalsTooltip title={category} placement="top-start">
            <Typography
              variant="body2"
              noWrap
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                width: "100%",
                cursor: "default",
              }}
            >
              {category}
            </Typography>
          </ApprovalsTooltip>
        </Box>

        <ExpenseTitleCell expenseTitle={expenseTitle} commentTooltip={commentTooltip} />

        <Typography variant="body2">{formatDateShort(date)}</Typography>
        <Typography variant="body2">{formatDateShort(requestedOn)}</Typography>
        <Typography variant="body2" textAlign="right">
          {amount}
        </Typography>

        <Box>
          {attachments.length > 0 && (
            <ApprovalsTooltip
              title={
                attachments.length === 1
                  ? "View attachment"
                  : `View attachments (${attachments.length})`
              }
            >
              <IconButton
                size="small"
                color="info"
                onClick={() => onPreviewAttachment(attachments, 0)}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </ApprovalsTooltip>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          <ApprovalsTooltip title="Approve">
            <IconButton size="small" color="success" onClick={() => onApprove(claim)}>
              <CheckIcon fontSize="small" />
            </IconButton>
          </ApprovalsTooltip>
          <ApprovalsTooltip title="Reject">
            <IconButton size="small" color="error" onClick={() => onReject(claim)}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </ApprovalsTooltip>
        </Box>
      </Box>
    </Paper>
  );
}

function getEmployeeDisplayName(emp: ExpenseClaimResponse["employee"] | null | undefined): string {
  if (!emp) return "—";
  const c = (emp as any).contact;
  return c?.name ?? (emp as any).nameAsPerPan ?? emp.employeeId ?? "—";
}

function formatPoiDeclarationStatus(status?: string): string {
  if (!status?.trim()) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function PoiPendingDeclarationCard({
  declaration,
  mode = "pending",
}: {
  declaration: ApprovalPendingITDeclaration;
  mode?: "pending" | "history";
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const employeeName = getItDeclarationEmployeeDisplayName(declaration);
  const financialYear = declaration.financialYear
    ? formatFinancialYearLabel(declaration.financialYear)
    : "—";
  const statusLabel = formatPoiDeclarationStatus(declaration.status);
  const employeePk = getPoiApprovalEmployeePk(declaration);
  const canOpen = employeePk != null && !!declaration.financialYear;
  const isHistory = mode === "history";

  return (
    <Paper elevation={0} sx={expenseCardPaperSx(theme)}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 100px",
          gap: 2,
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar alt={employeeName} sx={{ width: 32, height: 32, fontSize: "1rem" }}>
            {employeeName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {employeeName}
          </Typography>
        </Box>
        <Typography variant="body2">{financialYear}</Typography>
        <Chip
          label={statusLabel}
          color={getItDeclarationStatusChipColor(declaration.status)}
          size="small"
          sx={{ width: "fit-content" }}
        />
        <Box display="flex" justifyContent="center">
          <PrimaryButton
            size="small"
            disabled={!canOpen}
            onClick={() => {
              if (!canOpen || employeePk == null || !declaration.financialYear) return;
              const params = new URLSearchParams({
                financialYear: declaration.financialYear,
                employeeName,
              });
              if (isHistory) params.set("source", "history");
              navigate(`/people/approvals/poi/${employeePk}?${params.toString()}`);
            }}
          >
            {isHistory ? "Edit" : "View"}
          </PrimaryButton>
        </Box>
      </Box>
    </Paper>
  );
}

function ExpenseClaimPendingPaymentCard({
  claim,
  onMakePayment,
  onReject,
  onPreviewAttachment,
}: {
  claim: ExpenseClaimResponse;
  onMakePayment: (claim: ExpenseClaimResponse) => void;
  onReject: (claim: ExpenseClaimResponse) => void;
  onPreviewAttachment?: (attachments: { filename: string; path: string }[], index: number) => void;
}) {
  const theme = useTheme();
  const date = claim.expenseDate ? dayjs(claim.expenseDate).format("DD MMM YYYY") : "—";
  const employeeName = getEmployeeDisplayName(claim.employee);
  const category = claim.category?.categoryName ?? "—";
  const expenseTitle = claim.expenseTitle?.trim() || "—";
  const commentTooltip = getExpenseCommentTooltip(claim);
  const amount = `₹${Number(claim.amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
  const requestedOn = claim.requestedOn
    ? dayjs(claim.requestedOn).format("DD MMM YYYY")
    : "—";
  const approvedBy = getEmployeeDisplayName(claim.approvedOrRejectedBy as any);
  const attachments = claim.attachments ?? [];

  return (
    <Paper elevation={0} sx={expenseCardPaperSx(theme)}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 1.2fr 80px 120px",
          gap: 2,
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Avatar alt={employeeName} sx={{ width: 32, height: 32, fontSize: "1rem" }}>
            {employeeName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Avatar>
          <Typography
            variant="body2"
            fontWeight={500}
            noWrap
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {employeeName}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
          <ApprovalsTooltip title={category} placement="top-start">
            <Typography
              variant="body2"
              noWrap
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                width: "100%",
              }}
            >
              {category}
            </Typography>
          </ApprovalsTooltip>
        </Box>

        <ExpenseTitleCell expenseTitle={expenseTitle} commentTooltip={commentTooltip} />

        <Typography fontWeight={500} variant="body2">
          {formatDateShort(date)}
        </Typography>
        <Typography fontWeight={500} variant="body2">
          {formatDateShort(requestedOn)}
        </Typography>
        <Typography
          fontWeight={500}
          variant="body2"
          noWrap
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            pl: 2,
          }}
        >
          {approvedBy}
        </Typography>
        <Typography fontWeight={500} variant="body2" sx={{ textAlign: "right", pr: 1 }}>
          {amount}
        </Typography>

        <Box display="flex" justifyContent="flex-start" pl={2}>
          {attachments.length > 0 && (
            <ApprovalsTooltip
              title={
                attachments.length === 1
                  ? "View attachment"
                  : `View attachments (${attachments.length})`
              }
            >
              <IconButton
                size="small"
                color="info"
                onClick={() => onPreviewAttachment?.(attachments, 0)}
                sx={{ p: 0.5 }}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </ApprovalsTooltip>
          )}
        </Box>

        <Box display="flex" alignItems="center" justifyContent="flex-start" gap={0.5}>
          <ApprovalsTooltip title="Make payment">
            <IconButton size="small" color="primary" onClick={() => onMakePayment(claim)}>
              <PaymentIcon fontSize="small" />
            </IconButton>
          </ApprovalsTooltip>
          <ApprovalsTooltip title="Reject">
            <IconButton size="small" color="error" onClick={() => onReject(claim)}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </ApprovalsTooltip>
        </Box>
      </Box>
    </Paper>
  );
}

function ExpenseClaimDisplayCard({
  claim,
  onPreviewAttachment,
}: {
  claim: ExpenseClaimResponse;
  onPreviewAttachment?: (attachments: { filename: string; path: string }[], index: number) => void;
}) {
  const theme = useTheme();
  const name = getEmployeeDisplayName(claim.employee);
  const expenseDate = claim.expenseDate ? dayjs(claim.expenseDate).format("DD MMM YYYY") : "—";
  const expenseTitle = claim.expenseTitle?.trim() || "—";
  const commentTooltip = getExpenseCommentTooltip(claim);
  const rejectionTooltip = getExpenseRejectionTooltip(claim);
  const requestedOn = claim.requestedOn
    ? dayjs(claim.requestedOn).format("DD MMM YYYY")
    : "—";
  const approvedOrRejectedBy = getEmployeeDisplayName(claim.approvedOrRejectedBy as any);
  const paymentMadeBy = getEmployeeDisplayName(claim.paymentBy as any);
  const amount = `₹${Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const status = (claim.status ?? "").toString();
  const chipColor = expenseClaimStatusChipColor[status.toLowerCase()] ?? "primary";

  return (
    <Paper elevation={0} sx={expenseCardPaperSx(theme)}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr",
          gap: 2,
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar alt={name} sx={{ width: 32, height: 32, fontSize: "1rem" }}>
            {name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {name}
          </Typography>
        </Box>
        <Box>
          <Typography fontWeight={500} variant="body2">
            {formatDateShort(expenseDate)}
          </Typography>
        </Box>
        <ExpenseTitleCell expenseTitle={expenseTitle} commentTooltip={commentTooltip} />
        <Box>
          <Typography fontWeight={500} variant="body2">
            {formatDateShort(requestedOn)}
          </Typography>
        </Box>
        <Box sx={{ pl: 2 }}>
          <Typography fontWeight={500} variant="body2">
            {approvedOrRejectedBy}
          </Typography>
        </Box>
        <Box sx={{ pl: 2 }}>
          <Typography fontWeight={500} variant="body2">
            {paymentMadeBy}
          </Typography>
        </Box>
        <Box>
          <Typography fontWeight={500} variant="body2" textAlign="right">
            {amount}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5} sx={{ pl: 2 }}>
          <Chip label={status} size="small" color={chipColor} />
          {rejectionTooltip ? (
            <ApprovalsTooltip title={rejectionTooltip}>
              <InfoOutlined
                sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }}
                aria-label="View rejection reason"
              />
            </ApprovalsTooltip>
          ) : null}
        </Box>
        <Box>
          {claim.attachments?.length > 0 && (
            <ApprovalsTooltip
              title={
                claim.attachments?.length === 1
                  ? "View attachment"
                  : `View attachments (${claim.attachments?.length})`
              }
            >
              <IconButton
                size="small"
                color="info"
                onClick={() => onPreviewAttachment?.(claim.attachments, 0)}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </ApprovalsTooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export const Approvals = forwardRef<{ openAddModal: () => void }>((_, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectId = searchParams.get("redirectId");
  const notifDateParam = searchParams.get(NOTIF_DATE_URL_PARAM);
  const approvalTabParam = searchParams.get("approvalTab");

  const [openFilter, setOpenFilter] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("__all__");
  const [activeTab, setActiveTab] = useState(() =>
    approvalTabParam != null ? Number(approvalTabParam) : 0
  );
  const [attendanceStatusTab, setAttendanceStatusTab] = useState(0);
  const [approveLeaveModal, setApproveLeaveModal] = useState<{
    request: LeaveApprovalRequest;
    variant: "leave" | "request";
  } | null>(null);
  /** Pending reject vs history “cancel approval” share one modal + API with different `action` */
  const [leaveRejectModal, setLeaveRejectModal] = useState<
    | { mode: "reject"; request: LeaveApprovalRequest }
    | { mode: "cancelApproved"; request: LeaveApprovalRequest }
    | null
  >(null);
  const [expenseStatusTab, setExpenseStatusTab] = useState(0);
  const [approveClaim, setApproveClaim] = useState<ExpenseClaimResponse | null>(null);
  const [rejectClaim, setRejectClaim] = useState<ExpenseClaimResponse | null>(null);
  const [makePaymentClaim, setMakePaymentClaim] = useState<ExpenseClaimResponse | null>(null);

  const [compOffStatusTab, setCompOffStatusTab] = useState(0);
  const [regularizeStatusTab, setRegularizeStatusTab] = useState(0);
  const [poiStatusTab, setPoiStatusTab] = useState(0);
  const [highlightTargetId, setHighlightTargetId] = useState<string | null>(null);
  const [highlightPulse, setHighlightPulse] = useState(0);
 

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });
  const showSnackbar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });
  const [attachmentPreview, setAttachmentPreview] = useState<{
    open: boolean;
    attachments: { filename: string; path: string }[];
    currentIndex: number;
  }>({ open: false, attachments: [], currentIndex: 0 });
  const openAttachmentPreview = (attachments: { filename: string; path: string }[], index: number) =>
    setAttachmentPreview({ open: true, attachments, currentIndex: index });
  const closeAttachmentPreview = () =>
    setAttachmentPreview((p) => ({ ...p, open: false }));

  const { data: employeeInfo, isSuccess: employeeInfoSuccess, isLoading: employeeInfoLoading, isError: employeeInfoError } =
    useGetEmployeeInfoQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const { data: payableData } = useGetNextPayableQuery();

  const data = employeeInfo?.data;

  const isManagerUser = data?.isManager === true;
  /** Admin + employee uses `GET /requests` (no employeeId); takes precedence over manager reportee queue. */
  const useAdminEmployeeRequestsQueue =
    data?.isAdmin === true && data?.isEmployee === true;
  const canAccessApprovalsPage = isManagerUser || useAdminEmployeeRequestsQueue;
  /** POI tab: admin + employee only (reporting manager flag does not matter). */
  const showPoiTab = useAdminEmployeeRequestsQueue;
  /** Leave / attendance queue: manager+employee, or admin+employee (global queue). */
  const showAttendanceTab =
    data?.isEmployee === true && (isManagerUser || useAdminEmployeeRequestsQueue);
  /** Tab index: 0–2 Leave / Regularize / Comp Off (when shown), then Expense (3), then POI (4, admin+employee). */
  const expenseTabIndex = showAttendanceTab ? 3 : 0;
  const poiTabIndex = showAttendanceTab ? 4 : 1;
  const isPoiTab = showPoiTab && activeTab === poiTabIndex;

  const { data: pendingPoiDeclarations = [], isLoading: isPoiPendingLoading } =
    useGetPoiApprovalsQuery(undefined, {
      skip:
        !employeeInfoSuccess ||
        !canAccessApprovalsPage ||
        !isPoiTab ||
        poiStatusTab !== 0,
      refetchOnMountOrArgChange: true,
    });

  const { data: poiHistoryDeclarations = [], isLoading: isPoiHistoryLoading } =
    useGetPoiApprovalsQuery(
      { status: "history" },
      {
        skip:
          !employeeInfoSuccess ||
          !canAccessApprovalsPage ||
          !isPoiTab ||
          poiStatusTab !== 1,
        refetchOnMountOrArgChange: true,
      },
    );

  /**
   * When opened from a notification deep-link (redirectId present), widen the
   * date range to the past 3 months so the target request is guaranteed to be
   * within the query window regardless of when it was submitted.
   */
  const [employeeRequestAppliedStart, setEmployeeRequestAppliedStart] = useState<Dayjs | null>(() =>
    redirectId
      ? dayjs().subtract(3, "month").startOf("month")
      : dayjs().startOf("month")
  );
  const [employeeRequestAppliedEnd, setEmployeeRequestAppliedEnd] = useState<Dayjs | null>(() =>
    redirectId ? dayjs().endOf("day") : dayjs().endOf("month")
  );
  /** Draft range — picker UI while choosing; reverts to applied on popover close if incomplete. */
  const [employeeRequestDraftStart, setEmployeeRequestDraftStart] = useState<Dayjs | null>(() =>
    redirectId
      ? dayjs().subtract(3, "month").startOf("month")
      : dayjs(payableData?.payableDate).startOf("month")
  );
  const [employeeRequestDraftEnd, setEmployeeRequestDraftEnd] = useState<Dayjs | null>(() =>
    redirectId ? dayjs().endOf("day") : dayjs(payableData?.payableDate)
  );

  const leaveQueryRange = useMemo(() => {
    if (employeeRequestAppliedStart == null || employeeRequestAppliedEnd == null) {
      return null;
    }
    const a = employeeRequestAppliedStart.isBefore(employeeRequestAppliedEnd)
      ? employeeRequestAppliedStart
      : employeeRequestAppliedEnd;
    const b = employeeRequestAppliedStart.isBefore(employeeRequestAppliedEnd)
      ? employeeRequestAppliedEnd
      : employeeRequestAppliedStart;
    return {
      fromDate: a.format("YYYY-MM-DD"),
      toDate: b.format("YYYY-MM-DD"),
    };
  }, [employeeRequestAppliedStart, employeeRequestAppliedEnd]);

  /** Latest range for onClose — Popover fires after setTimeout(200) and can see stale closures if we read state only. */
  const employeeRequestRangeRef = useRef({
    draftStart: employeeRequestDraftStart,
    draftEnd: employeeRequestDraftEnd,
    appliedStart: employeeRequestAppliedStart,
    appliedEnd: employeeRequestAppliedEnd,
  });
  useEffect(() => {
    employeeRequestRangeRef.current = {
      draftStart: employeeRequestDraftStart,
      draftEnd: employeeRequestDraftEnd,
      appliedStart: employeeRequestAppliedStart,
      appliedEnd: employeeRequestAppliedEnd,
    };
  }, [
    employeeRequestDraftStart,
    employeeRequestDraftEnd,
    employeeRequestAppliedStart,
    employeeRequestAppliedEnd,
  ]);

  const handleEmployeeRequestRangeChange = useCallback((dates: [Dayjs | null, Dayjs | null]) => {
    const [start, end] = dates;
    setEmployeeRequestDraftStart(start);
    setEmployeeRequestDraftEnd(end);

    const cur = employeeRequestRangeRef.current;
    employeeRequestRangeRef.current = { ...cur, draftStart: start, draftEnd: end };

    /** Commit immediately so RTK Query gets `fromDate` / `toDate` and UI props stay in sync. */
    if (start != null && end != null && start.isValid() && end.isValid()) {
      const lo = start.isBefore(end) ? start : end;
      const hi = start.isBefore(end) ? end : start;
      const loDay = lo.startOf("day");
      const hiDay = hi.startOf("day");
      setEmployeeRequestAppliedStart(loDay);
      setEmployeeRequestAppliedEnd(hiDay);
      employeeRequestRangeRef.current = {
        draftStart: loDay,
        draftEnd: hiDay,
        appliedStart: loDay,
        appliedEnd: hiDay,
      };
    }
  }, []);

  const handleEmployeeRequestPickerClose = useCallback(() => {
    const { draftStart, draftEnd, appliedStart, appliedEnd } = employeeRequestRangeRef.current;
    if (draftStart != null && draftEnd != null && draftStart.isValid() && draftEnd.isValid()) {
      const a = draftStart.isBefore(draftEnd) ? draftStart : draftEnd;
      const b = draftStart.isBefore(draftEnd) ? draftEnd : draftStart;
      const aDay = a.startOf("day");
      const bDay = b.startOf("day");
      setEmployeeRequestAppliedStart(aDay);
      setEmployeeRequestAppliedEnd(bDay);
      setEmployeeRequestDraftStart(aDay);
      setEmployeeRequestDraftEnd(bDay);
    } else {
      setEmployeeRequestDraftStart(appliedStart);
      setEmployeeRequestDraftEnd(appliedEnd);
    }
  }, []);

  const widenEmployeeRequestRangeForDeepLink = useCallback(() => {
    const { appliedStart, appliedEnd } = employeeRequestRangeRef.current;
    
    if (notifDateParam != null) {
      const expanded = expandRangeToIncludeNotificationDate(
        notifDateParam,
        appliedStart,
        appliedEnd,
      );
      if (expanded) {
        setEmployeeRequestAppliedStart(expanded.start);
        setEmployeeRequestAppliedEnd(expanded.end);
        setEmployeeRequestDraftStart(expanded.start);
        setEmployeeRequestDraftEnd(expanded.end);
        employeeRequestRangeRef.current = {
          draftStart: expanded.start,
          draftEnd: expanded.end,
          appliedStart: expanded.start,
          appliedEnd: expanded.end,
        };
      }
      // If expanded is null, the notification date is already inside the current range.
      // We keep the current range unchanged, so do nothing.
    } else {
      const { start, end } = defaultWideRangeForDeepLink();
      setEmployeeRequestAppliedStart(start);
      setEmployeeRequestAppliedEnd(end);
      setEmployeeRequestDraftStart(start);
      setEmployeeRequestDraftEnd(end);
      employeeRequestRangeRef.current = {
        draftStart: start,
        draftEnd: end,
        appliedStart: start,
        appliedEnd: end,
      };
    }
  }, [notifDateParam]);

  useNotificationDeepLinkRefresh(redirectId, {
    onNewRedirectId: widenEmployeeRequestRangeForDeepLink,
  });

  /** Leave / regularize / comp off share manager queue (`GET /requests/employees`). */
  const isEmployeeRequestsTab = activeTab === 0 || activeTab === 1 || activeTab === 2;
  /** Keep date picker display aligned with applied query range when switching Leave / Regularize / Comp Off. */
  useEffect(() => {
    if (employeeRequestAppliedStart == null || employeeRequestAppliedEnd == null) return;
    setEmployeeRequestDraftStart(employeeRequestAppliedStart);
    setEmployeeRequestDraftEnd(employeeRequestAppliedEnd);
    employeeRequestRangeRef.current = {
      ...employeeRequestRangeRef.current,
      draftStart: employeeRequestAppliedStart,
      draftEnd: employeeRequestAppliedEnd,
      appliedStart: employeeRequestAppliedStart,
      appliedEnd: employeeRequestAppliedEnd,
    };
  }, [activeTab, employeeRequestAppliedStart, employeeRequestAppliedEnd]);

  /** Attendance tab: reportees (`/requests/employees`) unless admin+employee → global queue (`GET /requests`). */
  const skipLeaveQueueBase =
    !showAttendanceTab || activeTab !== 0 || leaveQueryRange == null;
  const skipManagerQueueBase =
    !showAttendanceTab ||
    !isEmployeeRequestsTab ||
    leaveQueryRange == null ||
    useAdminEmployeeRequestsQueue;
  const skipAdminLeaveQueue = skipLeaveQueueBase || !useAdminEmployeeRequestsQueue;

  const skipCompOffQueueBase =
    !showAttendanceTab || activeTab !== 2 || leaveQueryRange == null;
  const skipCompOffAdminQueue = skipCompOffQueueBase || !useAdminEmployeeRequestsQueue;

  const skipRegularizeQueueBase =
    !showAttendanceTab || activeTab !== 1 || leaveQueryRange == null;
  const skipRegularizeAdminQueue = skipRegularizeQueueBase || !useAdminEmployeeRequestsQueue;

  const managerEmployeeFilterId =
    selectedEmployeeId !== "__all__" ? Number(selectedEmployeeId) : undefined;

  const managerQueueQueryArgs = {
    ...(leaveQueryRange ?? { fromDate: "", toDate: "" }),
  };

  const leavePendingAdminQueryArgs = {
    ...managerQueueQueryArgs,
    status: "pending" as const,
    requestType: "leave" as const,
    ...(managerEmployeeFilterId != null ? { employeeId: managerEmployeeFilterId } : {}),
  };
  const leaveHistoryAdminQueryArgs = {
    ...managerQueueQueryArgs,
    status: "history" as const,
    requestType: "leave" as const,
    ...(managerEmployeeFilterId != null ? { employeeId: managerEmployeeFilterId } : {}),
  };
  const compOffPendingAdminQueryArgs = {
    ...managerQueueQueryArgs,
    status: "pending" as const,
    requestType: "compOff" as const,
    ...(managerEmployeeFilterId != null ? { employeeId: managerEmployeeFilterId } : {}),
  };
  const compOffHistoryAdminQueryArgs = {
    ...managerQueueQueryArgs,
    status: "history" as const,
    requestType: "compOff" as const,
    ...(managerEmployeeFilterId != null ? { employeeId: managerEmployeeFilterId } : {}),
  };
  const regularizePendingAdminQueryArgs = {
    ...managerQueueQueryArgs,
    status: "pending" as const,
    requestType: "regularize" as const,
    ...(managerEmployeeFilterId != null ? { employeeId: managerEmployeeFilterId } : {}),
  };
  const regularizeHistoryAdminQueryArgs = {
    ...managerQueueQueryArgs,
    status: "history" as const,
    requestType: "regularize" as const,
    ...(managerEmployeeFilterId != null ? { employeeId: managerEmployeeFilterId } : {}),
  };

  const managerPendingQueryArgs = {
    ...managerQueueQueryArgs,
    status: "pending" as const,
  };
  const managerHistoryQueryArgs = {
    ...managerQueueQueryArgs,
    status: "history" as const,
  };

  const { data: managerPendingRaw, isLoading: managerPendingLoading } =
    useGetApproverEmployeesRequestsQuery(managerPendingQueryArgs, {
      skip: skipManagerQueueBase,
      refetchOnMountOrArgChange: true,
    });
  const { data: managerHistoryRaw, isLoading: managerHistoryLoading } =
    useGetApproverEmployeesRequestsQuery(managerHistoryQueryArgs, {
      skip: skipManagerQueueBase,
      refetchOnMountOrArgChange: true,
    });

  const managerPendingFilteredData = useMemo(
    () =>
      filterApproverEmployeeRequestsPayload(
        managerPendingRaw?.data,
        managerEmployeeFilterId,
      ),
    [managerPendingRaw, managerEmployeeFilterId],
  );
  const managerHistoryFilteredData = useMemo(
    () =>
      filterApproverEmployeeRequestsPayload(
        managerHistoryRaw?.data,
        managerEmployeeFilterId,
      ),
    [managerHistoryRaw, managerEmployeeFilterId],
  );

  const { data: leavePendingAdmin, isLoading: leavePendingLoadingAdmin } =
    useGetAdminEmployeeRequestsQueueQuery(leavePendingAdminQueryArgs, {
      skip: skipAdminLeaveQueue,
      refetchOnMountOrArgChange: true,
    });
  const { data: leaveHistoryAdmin, isLoading: leaveHistoryLoadingAdmin } =
    useGetAdminEmployeeRequestsQueueQuery(leaveHistoryAdminQueryArgs, {
      skip: skipAdminLeaveQueue,
      refetchOnMountOrArgChange: true,
    });

  const leavePendingResponse = useAdminEmployeeRequestsQueue
    ? leavePendingAdmin
    : { data: managerPendingFilteredData };
  const leaveHistoryResponse = useAdminEmployeeRequestsQueue
    ? leaveHistoryAdmin
    : { data: managerHistoryFilteredData };
  const leavePendingLoading = useAdminEmployeeRequestsQueue
    ? leavePendingLoadingAdmin
    : managerPendingLoading;
  const leaveHistoryLoading = useAdminEmployeeRequestsQueue
    ? leaveHistoryLoadingAdmin
    : managerHistoryLoading;

  const { data: compOffPendingAdmin, isLoading: compOffPendingLoadingAdmin } =
    useGetAdminEmployeeRequestsQueueQuery(compOffPendingAdminQueryArgs, {
      skip: skipCompOffAdminQueue,
      refetchOnMountOrArgChange: true,
    });
  const { data: compOffHistoryAdmin, isLoading: compOffHistoryLoadingAdmin } =
    useGetAdminEmployeeRequestsQueueQuery(compOffHistoryAdminQueryArgs, {
      skip: skipCompOffAdminQueue,
      refetchOnMountOrArgChange: true,
    });

  const { data: regularizePendingAdmin, isLoading: regularizePendingLoadingAdmin } =
    useGetAdminEmployeeRequestsQueueQuery(regularizePendingAdminQueryArgs, {
      skip: skipRegularizeAdminQueue,
      refetchOnMountOrArgChange: true,
    });
  const { data: regularizeHistoryAdmin, isLoading: regularizeHistoryLoadingAdmin } =
    useGetAdminEmployeeRequestsQueueQuery(regularizeHistoryAdminQueryArgs, {
      skip: skipRegularizeAdminQueue,
      refetchOnMountOrArgChange: true,
    });

  const compOffPendingResponse = useAdminEmployeeRequestsQueue
    ? compOffPendingAdmin
    : { data: managerPendingFilteredData };
  const compOffHistoryResponse = useAdminEmployeeRequestsQueue
    ? compOffHistoryAdmin
    : { data: managerHistoryFilteredData };
  const compOffPendingLoading = useAdminEmployeeRequestsQueue
    ? compOffPendingLoadingAdmin
    : managerPendingLoading;
  const compOffHistoryLoading = useAdminEmployeeRequestsQueue
    ? compOffHistoryLoadingAdmin
    : managerHistoryLoading;

  const regularizePendingResponse = useAdminEmployeeRequestsQueue
    ? regularizePendingAdmin
    : { data: managerPendingFilteredData };
  const regularizeHistoryResponse = useAdminEmployeeRequestsQueue
    ? regularizeHistoryAdmin
    : { data: managerHistoryFilteredData };
  const regularizePendingLoading = useAdminEmployeeRequestsQueue
    ? regularizePendingLoadingAdmin
    : managerPendingLoading;
  const regularizeHistoryLoading = useAdminEmployeeRequestsQueue
    ? regularizeHistoryLoadingAdmin
    : managerHistoryLoading;

  const compOffPending = useMemo(() => {
    const attendance = splitGroupedEmployeeRequestsToLeaveAndAttendance(
      compOffPendingResponse?.data,
    ).attendance;
    return useAdminEmployeeRequestsQueue
      ? attendance
      : filterCompOffAttendanceRequests(attendance);
  }, [compOffPendingResponse, useAdminEmployeeRequestsQueue]);

  const compOffApprovedOrRejected = useMemo(() => {
    const attendance = splitGroupedEmployeeRequestsToLeaveAndAttendance(
      compOffHistoryResponse?.data,
    ).attendance;
    return useAdminEmployeeRequestsQueue
      ? attendance
      : filterCompOffAttendanceRequests(attendance);
  }, [compOffHistoryResponse, useAdminEmployeeRequestsQueue]);

  const regularizePending = useMemo(() => {
    const attendance = splitGroupedEmployeeRequestsToLeaveAndAttendance(
      regularizePendingResponse?.data,
    ).attendance;
    return useAdminEmployeeRequestsQueue
      ? attendance
      : filterRegularizeAttendanceRequests(attendance);
  }, [regularizePendingResponse, useAdminEmployeeRequestsQueue]);

  const regularizeApprovedOrRejected = useMemo(() => {
    const attendance = splitGroupedEmployeeRequestsToLeaveAndAttendance(
      regularizeHistoryResponse?.data,
    ).attendance;
    return useAdminEmployeeRequestsQueue
      ? attendance
      : filterRegularizeAttendanceRequests(attendance);
  }, [regularizeHistoryResponse, useAdminEmployeeRequestsQueue]);

  const leavePending = useMemo(
    () => splitGroupedEmployeeRequestsToLeaveAndAttendance(leavePendingResponse?.data).leave,
    [leavePendingResponse],
  );
  const attendancePending = useMemo(
    () => splitGroupedEmployeeRequestsToLeaveAndAttendance(leavePendingResponse?.data).attendance,
    [leavePendingResponse],
  );
  const leaveApprovedOrRejected = useMemo(
    () => splitGroupedEmployeeRequestsToLeaveAndAttendance(leaveHistoryResponse?.data).leave,
    [leaveHistoryResponse],
  );
  const attendanceApprovedOrRejected = useMemo(
    () => splitGroupedEmployeeRequestsToLeaveAndAttendance(leaveHistoryResponse?.data).attendance,
    [leaveHistoryResponse],
  );

  const isExpenseTab = activeTab === expenseTabIndex;

  useEffect(() => {
    if (!showAttendanceTab && activeTab !== 0) setActiveTab(0);
  }, [showAttendanceTab, activeTab]);

  // Notification deep-link: open the correct Approvals sub-tab (card highlight uses redirectId).
  useEffect(() => {
    if (!approvalTabParam || !employeeInfoSuccess) return;

    setActiveTab(Number(approvalTabParam));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("approvalTab");
        return next;
      },
      { replace: true },
    );
  }, [approvalTabParam, employeeInfoSuccess, setSearchParams]);

  const isAdminUser = data?.isAdmin === true;

  const { data: expensePendingClaims = [], isLoading: isExpensePendingLoading } =
    useGetExpenseClaimsByApproverQuery(
      { status: "pending", isAdmin: isAdminUser },
      {
        skip:
          !employeeInfoSuccess ||
          !canAccessApprovalsPage ||
          !(isExpenseTab && expenseStatusTab === 0),
      }
    );
  const { data: expensePendingPayments = [], isLoading: isExpensePaymentsLoading } =
    useGetExpenseClaimsByApproverQuery(
      { status: "approved", isAdmin: isAdminUser },
      {
        skip:
          !employeeInfoSuccess ||
          !canAccessApprovalsPage ||
          !(isExpenseTab && expenseStatusTab === 1),
      }
    );
  const { data: expenseHistoryClaims = [], isLoading: isExpenseHistoryLoading } =
    useGetExpenseClaimsByApproverQuery(
      { status: "history", isAdmin: isAdminUser },
      {
        skip:
          !employeeInfoSuccess ||
          !canAccessApprovalsPage ||
          !(isExpenseTab && expenseStatusTab === 2),
      }
    );

  const [approveExpenseClaim, { isLoading: isApproving }] = useApproveExpenseClaimMutation();
  const [rejectExpenseClaim, { isLoading: isRejecting }] = useRejectExpenseClaimMutation();
  const [payExpenseClaim, { isLoading: isPaying }] = usePayExpenseClaimMutation();
  const [approveEmployeeRequest, { isLoading: isApprovingLeave }] = useApproveEmployeeRequestMutation();
  const [rejectOrCancelEmployeeRequest, { isLoading: isRejectingLeave }] =
    useRejectOrCancelEmployeeRequestMutation();

  const { data: employeesResponse } = useGetEmployeesQuery(undefined, {
    skip: !showAttendanceTab,
  });
  const attendanceEmployeeOptions = useMemo(() => {
    const rows = employeesResponse?.data ?? [];
    const options = rows
      .map((emp) => {
        const label =
          (emp as any)?.contact?.name ??
          `${(emp as any)?.contact?.firstName ?? ""} ${(emp as any)?.contact?.lastName ?? ""}`.trim() ??
          (emp as any)?.employeeId ??
          "—";
        return { label, value: String((emp as any)?.id ?? "") };
      })
      .filter((opt) => opt.value !== "" && opt.label !== "—")
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ label: "All employees", value: "__all__" }, ...options];
  }, [employeesResponse]);

  const handleApproveConfirm = async () => {
    if (!approveClaim) return;
    try {
      await approveExpenseClaim(approveClaim.id).unwrap();
      setApproveClaim(null);
      showSnackbar("Expense claim approved successfully", "success");
    } catch {
      // Error handled by RTK / global handler
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!rejectClaim) return;
    try {
      await rejectExpenseClaim({ id: rejectClaim.id, reason }).unwrap();
      setRejectClaim(null);
      showSnackbar("Expense claim rejected successfully", "success");
    } catch {
      // Error handled by RTK / global handler
    }
  };

  const handleMakePaymentSubmit = async (paymentAccountId: number, paymentDate: string) => {
    if (!makePaymentClaim) return;
    try {
      await payExpenseClaim({
        id: makePaymentClaim.id,
        body: { paymentAccountId, paymentDate },
      }).unwrap();
      setMakePaymentClaim(null);
      showSnackbar("Payment recorded successfully", "success");
    } catch {
      // Error handled by RTK / global handler
    }
  };

  const handleApproveLeaveConfirm = async () => {
    if (!approveLeaveModal) return;
    try {
      await approveEmployeeRequest(approveLeaveModal.request.id).unwrap();
      setApproveLeaveModal(null);
      showSnackbar("Request approved successfully", "success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err && err.data && typeof (err.data as any).message === "string"
          ? (err.data as { message: string }).message
          : "Failed to approve request";
      showSnackbar(msg, "error");
    }
  };

  const handleLeaveRejectModalSubmit = async (reason: string) => {
    if (!leaveRejectModal) return;
    const { mode, request } = leaveRejectModal;
    try {
      await rejectOrCancelEmployeeRequest({
        groupReqId: request.groupReqId ?? request.id,
        body: {
          action: mode === "cancelApproved" ? "cancel" : "reject",
          message: reason,
        },
      }).unwrap();
      setLeaveRejectModal(null);
      showSnackbar(
        mode === "cancelApproved" ? "Approval cancelled successfully" : "Request rejected successfully",
        "success"
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err && err.data && typeof (err.data as any).message === "string"
          ? (err.data as { message: string }).message
          : mode === "cancelApproved"
            ? "Failed to cancel approval"
            : "Failed to reject request";
      showSnackbar(msg, "error");
    }
  };

  /**
   * Keep the date-range control out of the big `tabs` useMemo so list/query
   * updates do not remount DateRangePicker (which closed the popover and broke selection).
   */
  const attendanceDateRangePickerAction = useMemo(
    () => (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0.5,
          minWidth: { xs: 200, sm: 520 },
          maxWidth: { xs: "100%", sm: 640 },
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "flex-end" }}>
          Request date range
        </Typography>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "flex-start",
            gap: 1,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <DateRangePicker
            label="From – To"
            startValue={employeeRequestDraftStart}
            endValue={employeeRequestDraftEnd}
            onChange={handleEmployeeRequestRangeChange}
            onClose={handleEmployeeRequestPickerClose}
            months={2}
            width="16.5rem"
          />
          <SingleSelectElement
            label="Employee"
            value={selectedEmployeeId}
            onChange={(value) => setSelectedEmployeeId((value as string) || "__all__")}
            options={attendanceEmployeeOptions}
            clearable={selectedEmployeeId !== "__all__"}
            width="16.5rem"
            placeholder="Search employee..."
          />
        </Box>
      </Box>
    ),
    [
      attendanceEmployeeOptions,
      employeeRequestDraftStart,
      employeeRequestDraftEnd,
      handleEmployeeRequestRangeChange,
      handleEmployeeRequestPickerClose,
      selectedEmployeeId,
    ]
  );

// Stable toggle callbacks


  /**
   * Deep-link from notification: find leave card by redirectId (groupReqId or id),
   * open Pending/History sub-tab, scroll into view, pulse-highlight. redirectId is
   * cleared from the URL after highlight so back-navigation does not re-trigger.
   */
  useEffect(() => {
    if (!redirectId || activeTab !== 0) return;
    if (leavePendingLoading || leaveHistoryLoading) return;

    const pendingMatch = leavePending.find((r) =>
      requestMatchesRedirectId(r, redirectId),
    );
    const historyMatch = leaveApprovedOrRejected.find((r) =>
      requestMatchesRedirectId(r, redirectId),
    );

    if (!pendingMatch && !historyMatch) return;

    const isPending = Boolean(pendingMatch);
    const match = pendingMatch ?? historyMatch!;
    const requiredStatusTab = isPending ? 0 : 1;
    const cardId = `leave-${isPending ? "pending" : "history"}-${match.groupReqId ?? match.id}-${match.id}`;

    if (attendanceStatusTab !== requiredStatusTab) {
      setAttendanceStatusTab(requiredStatusTab);
      return;
    }

    let clearHighlightTimer: ReturnType<typeof setTimeout> | undefined;

    const scrollTimer = setTimeout(() => {
      document.getElementById(cardId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightTargetId(cardId);
      setHighlightPulse((n) => n + 1);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("redirectId");
          next.delete(NOTIF_DATE_URL_PARAM);
          return next;
        },
        { replace: true },
      );
      clearHighlightTimer = setTimeout(() => {
        setHighlightTargetId(null);
      }, NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS);
    }, NOTIFICATION_DEEP_LINK_DOM_READY_MS);

    return () => {
      clearTimeout(scrollTimer);
      if (clearHighlightTimer != null) clearTimeout(clearHighlightTimer);
    };
  }, [
    redirectId,
    activeTab,
    attendanceStatusTab,
    leavePending,
    leaveApprovedOrRejected,
    leavePendingLoading,
    leaveHistoryLoading,
    setSearchParams,
  ]);

  // Deep-link for regularize tab (activeTab === 1)
  useEffect(() => {
    if (!redirectId || activeTab !== 1) return;
    if (regularizePendingLoading || regularizeHistoryLoading) return;

    const pendingMatch = regularizePending.find((r) =>
      requestMatchesRedirectId(r, redirectId),
    );
    const historyMatch = regularizeApprovedOrRejected.find((r) =>
      requestMatchesRedirectId(r, redirectId),
    );

    if (!pendingMatch && !historyMatch) return;

    const isPending = Boolean(pendingMatch);
    const match = pendingMatch ?? historyMatch!;
    const requiredStatusTab = isPending ? 0 : 1;
    const cardId = `regularize-${isPending ? "pending" : "history"}-${match.groupReqId ?? match.id}-${match.id}`;

    if (regularizeStatusTab !== requiredStatusTab) {
      setRegularizeStatusTab(requiredStatusTab);
      return;
    }

    let clearHighlightTimer: ReturnType<typeof setTimeout> | undefined;

    const scrollTimer = setTimeout(() => {
      document.getElementById(cardId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightTargetId(cardId);
      setHighlightPulse((n) => n + 1);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("redirectId");
          next.delete(NOTIF_DATE_URL_PARAM);
          return next;
        },
        { replace: true },
      );
      clearHighlightTimer = setTimeout(() => {
        setHighlightTargetId(null);
      }, NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS);
    }, NOTIFICATION_DEEP_LINK_DOM_READY_MS);

    return () => {
      clearTimeout(scrollTimer);
      if (clearHighlightTimer != null) clearTimeout(clearHighlightTimer);
    };
  }, [
    redirectId,
    activeTab,
    regularizeStatusTab,
    regularizePending,
    regularizeApprovedOrRejected,
    regularizePendingLoading,
    regularizeHistoryLoading,
    setSearchParams,
  ]);

  // Deep-link for comp off tab (activeTab === 2)
  useEffect(() => {
    if (!redirectId || activeTab !== 2) return;
    if (compOffPendingLoading || compOffHistoryLoading) return;

    const pendingMatch = compOffPending.find((r) =>
      requestMatchesRedirectId(r, redirectId),
    );
    const historyMatch = compOffApprovedOrRejected.find((r) =>
      requestMatchesRedirectId(r, redirectId),
    );

    if (!pendingMatch && !historyMatch) return;

    const isPending = Boolean(pendingMatch);
    const match = pendingMatch ?? historyMatch!;
    const requiredStatusTab = isPending ? 0 : 1;
    const cardId = `compoff-${isPending ? "pending" : "history"}-${match.groupReqId ?? match.id}-${match.id}`;

    if (compOffStatusTab !== requiredStatusTab) {
      setCompOffStatusTab(requiredStatusTab);
      return;
    }

    let clearHighlightTimer: ReturnType<typeof setTimeout> | undefined;

    const scrollTimer = setTimeout(() => {
      document.getElementById(cardId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightTargetId(cardId);
      setHighlightPulse((n) => n + 1);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("redirectId");
          next.delete(NOTIF_DATE_URL_PARAM);
          return next;
        },
        { replace: true },
      );
      clearHighlightTimer = setTimeout(() => {
        setHighlightTargetId(null);
      }, NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS);
    }, NOTIFICATION_DEEP_LINK_DOM_READY_MS);

    return () => {
      clearTimeout(scrollTimer);
      if (clearHighlightTimer != null) clearTimeout(clearHighlightTimer);
    };
  }, [
    redirectId,
    activeTab,
    compOffStatusTab,
    compOffPending,
    compOffApprovedOrRejected,
    compOffPendingLoading,
    compOffHistoryLoading,
    setSearchParams,
  ]);

  const tabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = [];
    if (showAttendanceTab) {
      items.push({
        label: "Leave",
        content: (
          <TabsAtom
            action={attendanceDateRangePickerAction}
            tabs={[
              {
                label: "Pending",
                content: (
                  <Stack spacing={2}>
                    {leavePendingLoading ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : leavePending.length === 0 && attendancePending.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No pending requests
                      </Typography>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, minmax(0, 1fr)) 120px",
                            gap: 2,
                            px: 2,
                            py: 1,
                            mb: 1,
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {["Employee", "Leave Type", "Date Applied", "Requested On", "Actions"].map((label) => (
                            <Typography
                              key={label}
                              variant="body2"
                              fontWeight="bold"
                              color="text.primary"
                              textAlign={label === "Actions" ? "center" : "left"} // match card alignment
                            >
                              {label}
                            </Typography>
                          ))}
                        </Box>
                        {leavePending.map((request) => {
                          const id = `leave-pending-${request.groupReqId ?? request.id}-${request.id}`;
                          return (
                            <Box key={id} id={id}>
                              <LeaveRequestCard
                                highlightPulse={
                                  highlightTargetId === id ? highlightPulse : 0
                                }
                                request={request}
                                showActions
                                onApprove={(r) => setApproveLeaveModal({ request: r, variant: "leave" })}
                                onReject={(r) => setLeaveRejectModal({ mode: "reject", request: r })}
                              />
                            </Box>
                          );
                        })}
                      </>
                    )}
                  </Stack>
                ),
              },
              {
                label: "History",
                content: (
                  <Stack spacing={2}>
                    {leaveHistoryLoading ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : leaveApprovedOrRejected.length === 0 &&
                      attendanceApprovedOrRejected.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No approved or rejected requests
                      </Typography>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(6, minmax(0, 1fr)) 120px",
                            gap: 2,
                            px: 2,
                            py: 1,
                            mb: 1,
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {["Employee", "Leave Type", "Date Applied", "Requested On", "Status", "Updated By", "Actions"].map((label) => (
                            <Typography
                              key={label}
                              variant="body2"
                              fontWeight="bold"
                              color="text.primary"
                              textAlign={label === "Actions" ? "center" : "left"} // match card alignment
                            >
                              {label}
                            </Typography>
                          ))}
                        </Box>
                        {leaveApprovedOrRejected.map((request) => {
                          const id = `leave-history-${request.groupReqId ?? request.id}-${request.id}`;
                          return (
                            <Box key={id} id={id}>
                              <LeaveRequestCard
                                highlightPulse={
                                  highlightTargetId === id ? highlightPulse : 0
                                }
                                request={request}
                                onCancelApproved={(r) =>
                                  setLeaveRejectModal({ mode: "cancelApproved", request: r })
                                }
                              />
                            </Box>
                          );
                        })}
                      </>
                    )}
                  </Stack>
                ),
              },
            ]}
            value={attendanceStatusTab}
            onChange={setAttendanceStatusTab}
            sx={{ flex: 1, minHeight: 0, overflow: "hidden", height: "100%" }}
            scrollable
            contentSx={{ height: "100%", pt: 1 }}
          />
        ),
      });
    }

    if (showAttendanceTab) {
      items.push({
      label: "Regularize",
      content: (
        <TabsAtom
          action={attendanceDateRangePickerAction}
          tabs={[
            {
              label: "Pending",
              content: (
                <Stack spacing={2}>
                  {regularizePendingLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : regularizePending.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No pending regularize requests
                    </Typography>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr)) 120px",
                          gap: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {["Employee", "Date Applied", "Requested On", "Clock Timings", "Actions"].map((label) => (
                          <Typography
                            key={label}
                            variant="body2"
                            fontWeight="bold"
                            color="text.primary"
                            textAlign={label === "Actions" ? "center" : "left"} // match card alignment
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                      {regularizePending.map((request) => {
                        const id = `regularize-pending-${request.groupReqId ?? request.id}-${request.id}`;
                        return (
                          <Box key={id} id={id}>
                            <AttendanceRequestCard
                              request={request}
                              showActions
                              highlightPulse={highlightTargetId === id ? highlightPulse : 0}
                              onApprove={(r) =>
                                setApproveLeaveModal({
                                  request: attendanceRequestToLeaveModalShim(r),
                                  variant: "request",
                                })
                              }
                              onReject={(r) =>
                                setLeaveRejectModal({
                                  mode: "reject",
                                  request: attendanceRequestToLeaveModalShim(r),
                                })
                              }
                            />
                          </Box>
                        );
                      })}
                    </>
                  )}
                </Stack>
              ),
            },
            {
              label: "History",
              content: (
                <Stack spacing={2}>
                  {regularizeHistoryLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : regularizeApprovedOrRejected.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No approved or rejected regularize requests
                    </Typography>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(6, minmax(0, 1fr)) 120px",
                          gap: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {["Employee", "Date Applied", "Requested On", "Clock Timings", "Status", "Updated By", "Actions"].map((label) => (
                          <Typography
                            key={label}
                            variant="body2"
                            fontWeight="bold"
                            color="text.primary"
                            textAlign={label === "Actions" ? "center" : "left"} // match card alignment
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                      {regularizeApprovedOrRejected.map((request) => {
                        const id = `regularize-history-${request.groupReqId ?? request.id}-${request.id}`;
                        return (
                          <Box key={id} id={id}>
                            <AttendanceRequestCard
                              highlightPulse={
                                highlightTargetId === id ? highlightPulse : 0
                              }
                              request={request}
                              onCancelApproved={(r) =>
                                setLeaveRejectModal({
                                  mode: "cancelApproved",
                                  request: attendanceRequestToLeaveModalShim(r),
                                })
                              }
                            />
                          </Box>
                        );
                      })}
                    </>
                  )}
                </Stack>
              ),
            },
          ]}
          value={regularizeStatusTab}
          onChange={setRegularizeStatusTab}
          sx={{ flex: 1, minHeight: 0, overflow: "hidden", height: "100%" }}
          scrollable
          contentSx={{ height: "100%", pt: 1 }}
        />
      ),
    });
  }

  if(showAttendanceTab) {
    items.push({
      label: "Comp Off",
      content: (
        <TabsAtom
          action={attendanceDateRangePickerAction}
          tabs={[
            {
              label: "Pending",
              content: (
                <Stack spacing={2}>
                  {compOffPendingLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : compOffPending.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No pending comp off requests
                    </Typography>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr)) 120px",
                          gap: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {["Employee", "Date Applied", "Requested On", "Actions"].map((label) => (
                          <Typography
                            key={label}
                            variant="body2"
                            fontWeight="bold"
                            color="text.primary"
                            textAlign={label === "Actions" ? "center" : "left"}
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                      {compOffPending.map((request) => {
                        const id = `compoff-pending-${request.groupReqId ?? request.id}-${request.id}`;
                        return (
                          <Box key={id} id={id}>
                            <CompOffPending
                              request={request}
                              showActions
                              highlightPulse={highlightTargetId === id ? highlightPulse : 0}
                              onApprove={(r) =>
                                setApproveLeaveModal({
                                  request: attendanceRequestToLeaveModalShim(r),
                                  variant: "request",
                                })
                              }
                              onReject={(r) =>
                                setLeaveRejectModal({
                                  mode: "reject",
                                  request: attendanceRequestToLeaveModalShim(r),
                                })
                              }
                            />
                          </Box>
                        );
                      })}
                    </>
                  )}
                </Stack>
              ),
            },
            {
              label: "History",
              content: (
                <Stack spacing={2}>
                  {compOffHistoryLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : compOffApprovedOrRejected.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No approved or rejected comp off requests
                    </Typography>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(5, minmax(0, 1fr)) 120px",
                          gap: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {["Employee", "Date Applied", "Requested On", "Status", "Updated By", "Actions"].map((label) => (
                          <Typography
                            key={label}
                            variant="body2"
                            fontWeight="bold"
                            color="text.primary"
                            textAlign={label === "Actions" ? "center" : "left"} // match card alignment
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                      {compOffApprovedOrRejected.map((request) => {
                        const id = `compoff-history-${request.groupReqId ?? request.id}-${request.id}`;
                        return (
                          <Box key={id} id={id}>
                            <CompOffHistoryCard
                              highlightPulse={
                                highlightTargetId === id ? highlightPulse : 0
                              }
                              request={request}
                              onCancelApproved={(r) =>
                                setLeaveRejectModal({
                                  mode: "cancelApproved",
                                  request: attendanceRequestToLeaveModalShim(r),
                                })
                              }
                            />
                          </Box>
                        );
                      })}
                    </>
                  )}
                </Stack>
              ),
            },
          ]}
          value={compOffStatusTab}
          onChange={setCompOffStatusTab}
          sx={{ flex: 1, minHeight: 0, overflow: "hidden", height: "100%" }}
          scrollable
          contentSx={{ height: "100%", pt: 1 }}
        />
      ),
    });
  }

    items.push({
      label: "Expense",
      content: (
        <TabsAtom
          tabs={[
            {
              label: "Pending approvals",
              content: (
                <Stack spacing={2}>
                  {isExpensePendingLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : expensePendingClaims.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No pending approval requests
                    </Typography>
                  ) : (<>
                    {/* HEADER */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 80px 120px",
                        gap: 2,
                        px: 2,
                        py: 1,
                        mb: 1,
                        alignItems: "left",
                      }}
                    >
                      {[
                        "Employee",
                        "Category",
                        "Title",
                        "Date",
                        "Requested On",
                        "Amount",
                        "Files",
                        "Actions",
                      ].map((label) => (
                        <Typography
                          key={label}
                          variant="body2"
                          fontWeight={"bold"}
                          color="text.primary"
                          textAlign={label === "Amount" ? "right" : "left"}
                          sx={{ ml: label === "Files" ? 2 : 0 }}
                        >
                          {label}
                        </Typography>
                      ))}
                    </Box>

                    {expensePendingClaims.map((claim) => (
                      <ExpenseClaimApprovalCard
                        key={`expense-pending-${claim.id}`}
                        claim={claim}
                        onApprove={setApproveClaim}
                        onReject={setRejectClaim}
                        onPreviewAttachment={openAttachmentPreview}
                      />
                    ))}
                  </>
                  )}
                </Stack>
              ),
            },
            {
              label: "Pending payments",
              content: (
                <Stack spacing={2}>
                  {isExpensePaymentsLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : expensePendingPayments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No pending payment requests
                    </Typography>
                  ) : (
                    <>
                      {/* HEADER */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 1.2fr 80px 120px",
                          gap: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          alignItems: "center",
                        }}
                      >
                        {[
                          "Employee",
                          "Category",
                          "Title",
                          "Date",
                          "Requested On",
                          "Approved By",
                          "Amount",
                          "Files",
                          "Actions",
                        ].map((label) => (
                          <Typography
                            key={label}
                            variant="body2"
                            fontWeight={"bold"}
                            color="text.primary"
                            sx={{
                              textAlign: label === "Amount" ? "right" : "left",
                              ml: label === "Approved By" || label === "Files" ? 2 : 0,
                            }}
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                      {expensePendingPayments.map((claim) => (
                        <ExpenseClaimPendingPaymentCard
                          key={`expense-payment-${claim.id}`}
                          claim={claim}
                          onMakePayment={setMakePaymentClaim}
                          onReject={setRejectClaim}
                          onPreviewAttachment={openAttachmentPreview}
                        />
                      ))}
                    </>
                  )}
                </Stack>
              ),
            },
            {
              label: "History",
              content: (
                <Stack spacing={2}>
                  {isExpenseHistoryLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : expenseHistoryClaims.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No history yet
                    </Typography>
                  ) : (

                    <>
                       <Box
                        sx={{
                        display: "grid",
                          gridTemplateColumns: "1fr 1.2fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr",
                          gap: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        {[
                          "Employee",
                          "Expense Date",
                          "Title",
                          "Requested On",
                          "Approved/Rejeted",
                          "Payment Made By",
                          "Amount",
                          "Status",
                          "Files",
                        ].map((label) => (
                          <Typography
                            key={label}
                            variant="body2"
                            fontWeight={"bold"}
                            color="text.primary"
                            sx={{
                              textAlign: label === "Amount" ? "right" : "left",
                              pl: label === "Approved/Rejeted" || label === "Status" ? 2 : 0,
                            }}
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                    {expenseHistoryClaims.map((claim) => (
                      <ExpenseClaimDisplayCard
                        key={`expense-history-${claim.id}`}
                        claim={claim}
                        onPreviewAttachment={openAttachmentPreview}
                      />
                    ))}
                    </>
                  )}
                </Stack>
              ),
            },
          ]}
          value={expenseStatusTab}
          onChange={setExpenseStatusTab}
          sx={{ height: "100%", overflow: "hidden" }}
          scrollable
          contentSx={{ height: "100%", pt: 1 }}
        />
      ),
    });

    if (showPoiTab) {
      const poiListHeader = (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 100px",
            gap: 2,
            px: 2,
            py: 1,
            mb: 1,
            alignItems: "center",
          }}
        >
          {["Employee", "Financial Year", "Status", "Actions"].map((label) => (
            <Typography
              key={label}
              variant="body2"
              fontWeight="bold"
              color="text.primary"
              textAlign={label === "Actions" ? "center" : "left"}
            >
              {label}
            </Typography>
          ))}
        </Box>
      );

      const renderPoiList = (
        declarations: ApprovalPendingITDeclaration[],
        keyPrefix: string,
        mode: "pending" | "history",
      ) => (
        <>
          {poiListHeader}
          {declarations.map((declaration) => (
            <PoiPendingDeclarationCard
              key={`${keyPrefix}-${declaration.id ?? declaration.employee?.id}`}
              declaration={declaration}
              mode={mode}
            />
          ))}
        </>
      );

      items.push({
        label: "POI",
        content: (
          <TabsAtom
            tabs={[
              {
                label: "Pending",
                content: (
                  <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
                    {isPoiPendingLoading ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : pendingPoiDeclarations.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No pending POI declarations
                      </Typography>
                    ) : (
                      renderPoiList(pendingPoiDeclarations, "poi-pending", "pending")
                    )}
                  </Stack>
                ),
              },
              {
                label: "History",
                content: (
                  <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
                    {isPoiHistoryLoading ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : poiHistoryDeclarations.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No POI approval history
                      </Typography>
                    ) : (
                      renderPoiList(poiHistoryDeclarations, "poi-history", "history")
                    )}
                  </Stack>
                ),
              },
            ]}
            value={poiStatusTab}
            onChange={setPoiStatusTab}
            sx={{ height: "100%", overflow: "hidden" }}
            scrollable
            contentSx={{ height: "100%", pt: 1 }}
          />
        ),
      });
    }

    return items;
  }, [
    highlightTargetId,
    highlightPulse,
    showAttendanceTab,
    showPoiTab,
    poiStatusTab,
    isPoiPendingLoading,
    isPoiHistoryLoading,
    pendingPoiDeclarations,
    poiHistoryDeclarations,
    activeTab,
    attendanceStatusTab,
    attendanceDateRangePickerAction,
    attendancePending,
    attendanceApprovedOrRejected,
    leavePending,
    leaveApprovedOrRejected,
    leavePendingLoading,
    leaveHistoryLoading,
    expenseStatusTab,
    expensePendingClaims,
    expensePendingPayments,
    expenseHistoryClaims,
    isExpensePendingLoading,
    isExpensePaymentsLoading,
    isExpenseHistoryLoading,
    compOffStatusTab,
    compOffPending,
    compOffApprovedOrRejected,
    compOffPendingLoading,
    compOffHistoryLoading,
    regularizeStatusTab,
    regularizePending,
    regularizeApprovedOrRejected,
    regularizePendingLoading,
    regularizeHistoryLoading,
  ]);

  useImperativeHandle(ref, () => ({
    openAddModal: () => setOpenFilter(true),
  }));

  return (
    <>
      <Card
        elevation={2}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {employeeInfoLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : employeeInfoError ? (
          <Typography variant="body2" color="text.secondary">
            Could not load your profile. Please try again.
          </Typography>
        ) : employeeInfoSuccess && !canAccessApprovalsPage ? (
          <Typography variant="body2" color="text.secondary">
            Approvals are available for reporting managers, or for admin users who are also employees.
          </Typography>
        ) : (
          <TabsAtom
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            sx={{ height: "100%", overflow: "hidden", minHeight: 0 }}
            scrollable
            contentSx={{ flex: 1, minHeight: 0, height: "100%" }}
          />
        )}
      </Card>
      <FilterModal open={openFilter} onClose={() => setOpenFilter(false)} />
      <ApproveExpenseModal
        open={approveClaim != null}
        onClose={() => setApproveClaim(null)}
        claim={approveClaim}
        onConfirm={handleApproveConfirm}
        isLoading={isApproving}
      />
      <RejectExpenseModal
        open={rejectClaim != null}
        onClose={() => setRejectClaim(null)}
        claim={rejectClaim}
        onSubmit={handleRejectSubmit}
        isLoading={isRejecting}
      />
      <ApproveLeaveModal
        open={approveLeaveModal != null}
        onClose={() => setApproveLeaveModal(null)}
        leave={approveLeaveModal?.request ?? null}
        variant={approveLeaveModal?.variant ?? "leave"}
        onConfirm={handleApproveLeaveConfirm}
        isLoading={isApprovingLeave}
      />
      <RejectLeaveModal
        open={leaveRejectModal != null}
        onClose={() => setLeaveRejectModal(null)}
        leave={leaveRejectModal?.request ?? null}
        variant={leaveRejectModal?.mode === "cancelApproved" ? "cancelApproved" : "reject"}
        onSubmit={handleLeaveRejectModalSubmit}
        isLoading={isRejectingLeave}
      />
      <MakePaymentExpenseModal
        open={makePaymentClaim != null}
        onClose={() => setMakePaymentClaim(null)}
        claim={makePaymentClaim}
        onSubmit={handleMakePaymentSubmit}
        isLoading={isPaying}
      />
      <AttachmentPreviewModal
        open={attachmentPreview.open}
        onClose={closeAttachmentPreview}
        attachments={attachmentPreview.attachments}
        currentIndex={attachmentPreview.currentIndex}
        showSnackBar={showSnackbar}
      />
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}
    </>
  );
});
