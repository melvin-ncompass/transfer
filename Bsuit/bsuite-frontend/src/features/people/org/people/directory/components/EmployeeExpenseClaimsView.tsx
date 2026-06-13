import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";
import { Chip } from "../../../../../../components/atom/chips";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import AttachmentPreviewModal from "../../../../../books/transact/transactHome/components/dialogs/AttachmentPreviewModal";
import {
  useGetEmployeeExpenseClaimsQuery,
  type ExpenseClaimResponse,
  type ExpenseClaimStatus,
  type ExpenseClaimStatusFilter,
} from "../../../../me/expense-claims/api/expenseClaim.api";
import {
  formatExpenseClaimAmount,
  getExpenseClaimApprovedOrRejectedBy,
  getExpenseClaimPaidBy,
  getExpenseClaimRejectionTooltip,
} from "../../../../me/expense-claims/expenseClaimDisplay";

const statusColorMap: Record<
  ExpenseClaimStatus,
  "warning" | "success" | "error" | "info" | "primary"
> = {
  draft: "primary",
  pending: "warning",
  approved: "success",
  rejected: "error",
  paid: "info",
};

const statusLabel: Record<ExpenseClaimStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

const buildColumns = (onViewAttachments: (row: ExpenseClaimResponse) => void) => [
  {
    id: "expenseDate",
    label: "Date",
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2">{dayjs(row.expenseDate).format("MMM DD, YYYY")}</Typography>
    ),
  },
  {
    id: "expenseTitle",
    label: "Expense Title",
    width: 200,
    render: (row: ExpenseClaimResponse) => {
      const text = row.expenseTitle?.trim() ?? "";
      const body = (
        <Typography
          variant="body2"
          sx={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {text || "—"}
        </Typography>
      );
      return text ? (
        <Tooltip title={text} placement="top-start">
          <Box component="span" sx={{ display: "inline-block", maxWidth: 240 }}>
            {body}
          </Box>
        </Tooltip>
      ) : (
        body
      );
    },
  },
  {
    id: "category",
    label: "Category",
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2">{row.category?.categoryName ?? "—"}</Typography>
    ),
  },
  {
    id: "requestedOn",
    label: "Requested on",
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2">
        {row.requestedOn ? dayjs(row.requestedOn).format("MMM DD, YYYY") : "—"}
      </Typography>
    ),
  },
  {
    id: "amount",
    label: "Amount",
    align: "right" as const,
    headerAlign: "left" as const,
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2" sx={{ textAlign: "right" }}>
        {formatExpenseClaimAmount(row.amount)}
      </Typography>
    ),
  },
  {
    id: "comment",
    label: "Comment",
    width: 220,
    render: (row: ExpenseClaimResponse) => {
      const text = row.comment?.trim() ?? "";
      const body = (
        <Typography
          variant="body2"
          color={text ? "text.primary" : "text.secondary"}
          sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {text || "—"}
        </Typography>
      );
      return text ? (
        <Tooltip title={text} placement="top-start">
          <Box component="span" sx={{ display: "inline-block", maxWidth: 260 }}>
            {body}
          </Box>
        </Tooltip>
      ) : (
        body
      );
    },
  },
  {
    id: "status",
    label: "Status",
    render: (row: ExpenseClaimResponse) => {
      const rejectionTooltip = getExpenseClaimRejectionTooltip(row);
      return (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <Chip
            label={statusLabel[row.status] ?? row.status}
            color={statusColorMap[row.status] ?? "primary"}
            size="xs"
          />
          {rejectionTooltip ? (
            <Tooltip title={rejectionTooltip} placement="top-start">
              <InfoOutlined
                sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }}
                aria-label="View rejection reason"
              />
            </Tooltip>
          ) : null}
        </Box>
      );
    },
  },
  {
    id: "approvedOrRejectedBy",
    label: "Approved / Rejected by",
    width: 160,
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2">{getExpenseClaimApprovedOrRejectedBy(row)}</Typography>
    ),
  },
  {
    id: "paidBy",
    label: "Paid by",
    width: 140,
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2">{getExpenseClaimPaidBy(row)}</Typography>
    ),
  },
  {
    id: "attachments",
    label: "View",
    width: 72,
    headerAlign: "center" as const,
    align: "center" as const,
    render: (row: ExpenseClaimResponse) => {
      const hasFiles = (row.attachments?.length ?? 0) > 0;
      return (
        <Tooltip title={hasFiles ? "View attachments" : "No attachments"}>
          <span>
            <IconButton
              size="small"
              disabled={!hasFiles}
              onClick={() => onViewAttachments(row)}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      );
    },
  },
];

/** Sentinel for “All statuses” — avoids empty-string issues in SingleSelect label display */
const STATUS_ALL = "__all__";

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: STATUS_ALL, label: "All" },
  { value: "history", label: "History" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

export interface EmployeeExpenseClaimsViewProps {
  /** Viewed employee’s work email (required for API). */
  employeeEmail?: string;
}

export default function EmployeeExpenseClaimsView({ employeeEmail }: EmployeeExpenseClaimsViewProps) {
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    open: boolean;
    attachments: { filename: string; path: string }[];
    currentIndex: number;
  }>({ open: false, attachments: [], currentIndex: 0 });

  const safeEmployeeEmail = (employeeEmail ?? "").trim();

  const queryArgs = useMemo(() => {
    const status: ExpenseClaimStatusFilter | undefined =
      statusFilter === STATUS_ALL ? undefined : (statusFilter as ExpenseClaimStatusFilter);
    return {
      employeeEmail: safeEmployeeEmail,
      ...(status ? { status } : {}),
    };
  }, [safeEmployeeEmail, statusFilter]);

  const { data: claims = [], isLoading, isError } = useGetEmployeeExpenseClaimsQuery(queryArgs, {
    skip: !safeEmployeeEmail,
  });

  const openAttachmentPreview = (row: ExpenseClaimResponse) => {
    const attachments = row.attachments ?? [];
    if (!attachments.length) return;
    setAttachmentPreview({ open: true, attachments, currentIndex: 0 });
  };

  const closeAttachmentPreview = () =>
    setAttachmentPreview((p) => ({ ...p, open: false }));

  if (!safeEmployeeEmail) {
    return (
      <div style={{ color: "rgba(0, 0, 0, 0.6)", paddingTop: 16, paddingBottom: 16 }}>
        Work email is not available for this employee, so expense claims cannot be loaded.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 32, paddingBottom: 32 }}>
        <CustomCircularProgress size={28} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ color: "#d32f2f", paddingTop: 16, paddingBottom: 16 }}>
        Could not load expense claims for this employee.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ maxWidth: 280 }}>
        <SingleSelectElement
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={STATUS_FILTER_OPTIONS}
          fullWidth
        />
      </div>
      <StandardTable
        columns={buildColumns(openAttachmentPreview)}
        rows={claims}
        loading={false}
        sticky
        rowHeight={35}
        emptyMessage="No expense claims found"
      />
      <AttachmentPreviewModal
        open={attachmentPreview.open}
        onClose={closeAttachmentPreview}
        attachments={attachmentPreview.attachments}
        currentIndex={attachmentPreview.currentIndex}
        showSnackBar={() => {}}
      />
    </div>
  );
}
