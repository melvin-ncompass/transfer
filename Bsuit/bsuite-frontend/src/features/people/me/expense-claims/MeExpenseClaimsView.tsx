import { forwardRef, useImperativeHandle, useState } from "react";
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { StandardTable } from "../../../../components/tables/standard-table";
import { Chip } from "../../../../components/atom/chips";
import { Snackbar } from "../../../../components/atom/snackbar";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AttachmentPreviewModal from "../../../books/transact/transactHome/components/dialogs/AttachmentPreviewModal";
import { ClaimExpenseModal } from "./components/ClaimExpenseModal";
import {
  useGetMyExpenseClaimsQuery,
  type ExpenseClaimResponse,
  type ExpenseClaimStatus,
  type ExpenseClaimStatusFilter,
} from "./api/expenseClaim.api";
import dayjs from "dayjs";
import {
  formatExpenseClaimAmount,
  getExpenseClaimApprovedOrRejectedBy,
  getExpenseClaimPaidBy,
  getExpenseClaimRejectionTooltip,
} from "./expenseClaimDisplay";

export interface MeExpenseClaimsViewRef {
  openAddModal: () => void;
}

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

const statusColorMap: Record<
  ExpenseClaimStatus,
  string
> = {
  draft: "default",
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

const getColumns = (
  onEditDraft: (row: ExpenseClaimResponse) => void,
  onView: (row: ExpenseClaimResponse) => void
) => [
  {
    id: "expenseDate",
    label: "Date",
    render: (row: ExpenseClaimResponse) => (
      <Typography variant="body2">
        {dayjs(row.expenseDate).format("MMM DD, YYYY")}
      </Typography>
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
          sx={{
            maxWidth: 240,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
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
    width: 150,
    render: (row: ExpenseClaimResponse) => {
      const text = row.category?.categoryName?.trim() ?? "";
      const body = (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {text || "—"}
        </Typography>
      );
      return text ? (
        <Tooltip title={text} placement="top-start">
          <Box component="span" sx={{ display: "inline-block", maxWidth: 140 }}>
            {body}
          </Box>
        </Tooltip>
      ) : (
        body
      );
    },
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
      const display = text || "—";
      const body = (
        <Typography
          variant="body2"
          color={text ? "text.primary" : "text.secondary"}
          sx={{
            maxWidth: 260,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {display}
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
            size="xs"
            color={statusColorMap[row.status] as any ?? "default"}
            onClick={row.status === "draft" ? () => onEditDraft(row) : undefined}
            sx={{
              width: "fit-content",
              maxWidth: "100%",
              ...(row.status === "draft" ? { cursor: "pointer", "&:hover": { opacity: 0.8 } } : undefined),
            }}
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
    id: "view",
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
              onClick={() => onView(row)}
              aria-label={`View attachments for expense claim ${row.id}`}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      );
    },
  },
  {
    id: "actions",
    label: "Actions",
    width: 90,
    headerAlign: "center" as const,
    align: "center" as const,
    render: (row: ExpenseClaimResponse) =>
      row.status === "draft" ? (
        <IconButton size="small" onClick={() => onEditDraft(row)} aria-label="Edit draft expense claim">
          <EditIcon fontSize="small" />
        </IconButton>
      ) : (
        <Typography variant="body2" color="text.secondary">
          -
        </Typography>
      ),
  },
];

export const MeExpenseClaimsView = forwardRef<MeExpenseClaimsViewRef>(
  (_, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [draftData, setDraftData] = useState<ExpenseClaimResponse | null>(null);
    const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
    const [attachmentPreview, setAttachmentPreview] = useState<{
      open: boolean;
      attachments: { filename: string; path: string }[];
      currentIndex: number;
    }>({ open: false, attachments: [], currentIndex: 0 });
    const [snackbar, setSnackbar] = useState<{
      open: boolean;
      message: string;
      severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });

    const activeStatus: ExpenseClaimStatusFilter | void =
      statusFilter === STATUS_ALL ? undefined : (statusFilter as ExpenseClaimStatusFilter);
    const { data: claims, isLoading } = useGetMyExpenseClaimsQuery(activeStatus);

    useImperativeHandle(ref, () => ({
      openAddModal: () => {
        setDraftData(null);
        setIsModalOpen(true);
      },
    }));

    const handleOpenModal = (draft?: ExpenseClaimResponse) => {
      setDraftData(draft || null);
      setIsModalOpen(true);
    };

    const handleCloseModal = () => {
      setDraftData(null);
      setIsModalOpen(false);
    };

    const showSnackbar = (message: string, severity: "success" | "error") =>
      setSnackbar({ open: true, message, severity });

    const handleSuccess = (isSubmit: boolean) =>
      showSnackbar(
        isSubmit
          ? "Expense claim submitted for approval!"
          : "Expense claim saved as draft!",
        "success"
      );

    const handleError = (message: string) => showSnackbar(message, "error");

    const openAttachmentPreview = (row: ExpenseClaimResponse) => {
      const attachments = row.attachments ?? [];
      if (!attachments.length) {
        showSnackbar("No attachments to preview.", "error");
        return;
      }
      setAttachmentPreview({
        open: true,
        attachments,
        currentIndex: 0,
      });
    };

    const closeAttachmentPreview = () =>
      setAttachmentPreview((p) => ({ ...p, open: false }));

    return (
      <Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Expense Claims History
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ minWidth: 160 }}>
              <SingleSelectElement
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={STATUS_FILTER_OPTIONS}
                fullWidth
              />
            </Box>
            <PrimaryButton size="small" onClick={() => handleOpenModal()}>
              Claim Expense
            </PrimaryButton>
          </Box>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <StandardTable
            columns={getColumns(handleOpenModal, openAttachmentPreview)}
            rows={claims ?? []}
            loading={false}
            sticky
            rowHeight={35}
            emptyMessage="No expense claims found"
          />
        )}

        <ClaimExpenseModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          onError={handleError}
          draftData={draftData}
        />

        <AttachmentPreviewModal
          open={attachmentPreview.open}
          onClose={closeAttachmentPreview}
          attachments={attachmentPreview.attachments}
          currentIndex={attachmentPreview.currentIndex}
          showSnackBar={(message, color) => showSnackbar(message, color)}
        />

        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            color={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            autoClose={4000}
          />
        )}
      </Box>
    );
  }
);
