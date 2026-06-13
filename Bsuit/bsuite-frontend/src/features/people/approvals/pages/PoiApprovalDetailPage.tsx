import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import {
  Box,
  Alert,
  Card,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ContentCopy from "@mui/icons-material/ContentCopy";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { PrimaryButton } from "../../../../components/atom/button";
import { PrimaryIconButton } from "../../../../components/atom/button/PrimaryIconButton";
import { Chip } from "../../../../components/atom/chips";
import { TextFieldElement } from "../../../../components/atom/text-field/TextField";
import { StandardTable } from "../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../types/types";
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";
import { Snackbar } from "../../../../components/atom/snackbar";
import { Tooltip } from "../../../../components/atom/tooltip";
import { useGetAttachmentFileQuery } from "../../../books/transact/transactHome/api/transact.api";
import {
  formatFinancialYearLabel,
  getItDeclarationStatusChipColor,
  getPoiItemStatusChipColor,
  useGetDeclaredDataForFYQuery,
  useGetPOIAttachmentsQuery,
  useUpdatePOIStatusMutation,
  useConsiderForITMutation,
  useUploadPOIProofMutation,
  type POIAttachment,
} from "../../me/investments/api/itDeclaration.api";
import {
  buildItDeclarationTableRows,
  getInitialPoiRowDecision,
  getPoiApprovalRowKey,
  isPoiApprovalActionableRow,
  type ItDeclarationTableRow,
} from "../../me/investments/utils/itDeclarationTableRows";
import { renderPoiCountIconButton } from "../../me/investments/utils/poiCountIconButton";
import { usePoiScopedComments } from "../../me/investments/hooks/usePoiScopedComments";
import {
  appendPoiEntityFormIds,
  buildPoiScopedFetchParams,
  isRentedHouseEntityType,
} from "../../me/investments/utils/poiEntityTypes";
import { buildUpdatePOIStatusDto } from "../../me/investments/utils/poiStatusUpdate";
import { POICommentsDrawer } from "../../me/investments/components/POICommentsDrawer";
import {
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../utils/numberFormatter";

type PoiRowApprovalState = {
  decision: "approved" | "rejected" | null;
  approvedAmount: string;
};

type EntityPanelTarget = {
  entityType: string;
  label: string;
  originalId: number;
};

function formatPoiStatus(status?: string): string {
  if (!status?.trim()) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRowStatusLabel(row: ItDeclarationTableRow): string | null {
  if (row.isSection || row.isSummary) return null;

  if (row.itemStatus?.trim()) return row.itemStatus;
  if (isPoiApprovalActionableRow(row)) return "pending";

  return null;
}

function defaultApprovedAmount(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): string {
  if (isRejectedRow(row, state)) return "0";
  if (row.apiApprovedAmount != null) return String(row.apiApprovedAmount);
  return "";
}

function isRejectedRow(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): boolean {
  const status = (row.itemStatus ?? "").trim().toLowerCase();
  if (status === "rejected") return true;
  return state?.decision === "rejected";
}

function isApprovedOrPartiallyApprovedRow(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): boolean {
  const status = (row.itemStatus ?? "").trim().toLowerCase();
  if (status === "approved" || status === "partially_approved") return true;
  return state?.decision === "approved";
}

function isReviewedAmountDisplayRow(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): boolean {
  return isApprovedOrPartiallyApprovedRow(row, state) || isRejectedRow(row, state);
}

function getDisplayApprovedAmount(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): string {
  if (isRejectedRow(row, state)) return "0";
  if (state?.approvedAmount?.trim()) return state.approvedAmount.trim();
  if (row.apiApprovedAmount != null) return String(row.apiApprovedAmount);
  return "";
}

function formatApprovedAmountDisplay(amount: string): string {
  if (!amount.trim()) return "—";
  const parsed = Number(parseNumberForTyping(amount));
  if (!Number.isFinite(parsed)) return amount;
  return parsed.toLocaleString("en-IN");
}

function getDeclaredAmountString(row: ItDeclarationTableRow): string {
  if (row.amount == null || !Number.isFinite(row.amount)) return "";
  return String(row.amount);
}

function getSavedApprovedAmountString(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): string {
  if (isRejectedRow(row, state)) return "0";
  if (row.apiApprovedAmount == null) return "";
  return String(row.apiApprovedAmount);
}

function normalizeApprovedAmount(amount: string): number | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;
  const parsed = Number(parseNumberForTyping(trimmed));
  return Number.isFinite(parsed) ? parsed : null;
}

function hasApprovedAmountChanged(
  row: ItDeclarationTableRow,
  state?: PoiRowApprovalState,
): boolean {
  const current = normalizeApprovedAmount(state?.approvedAmount ?? "");
  const saved = normalizeApprovedAmount(getSavedApprovedAmountString(row, state));
  if (current == null && saved == null) return false;
  if (current == null || saved == null) return true;
  return current !== saved;
}

function isServerReviewedRow(row: ItDeclarationTableRow): boolean {
  const status = (row.itemStatus ?? "").trim().toLowerCase();
  return (
    status === "approved" ||
    status === "partially_approved" ||
    status === "rejected"
  );
}

function canSubmitRowAction(
  row: ItDeclarationTableRow,
  state: PoiRowApprovalState | undefined,
  isSaving: boolean,
): boolean {
  if (isSaving) return false;
  if (isRejectedRow(row, state)) {
    return hasApprovedAmountChanged(row, state);
  }
  if (isApprovedOrPartiallyApprovedRow(row, state)) {
    return hasApprovedAmountChanged(row, state);
  }
  if (!isServerReviewedRow(row)) return true;
  return hasApprovedAmountChanged(row, state);
}

function buildInitialRowStates(
  actionableRows: ItDeclarationTableRow[],
): Record<string, PoiRowApprovalState> {
  const initial: Record<string, PoiRowApprovalState> = {};
  for (const row of actionableRows) {
    const key = getPoiApprovalRowKey(row);
    initial[key] = {
      decision: getInitialPoiRowDecision(row.itemStatus),
      approvedAmount: defaultApprovedAmount(row),
    };
  }
  return initial;
}

type ApprovedAmountEditFieldProps = {
  autoFocus?: boolean;
  onAutoFocusDone?: () => void;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
};

function ApprovedAmountEditField({
  autoFocus = false,
  onAutoFocusDone,
  value,
  onChange,
  onBlur,
  disabled = false,
}: ApprovedAmountEditFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => {
      const input = inputRef.current;
      input?.focus();
      input?.select();
      onAutoFocusDone?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, onAutoFocusDone]);

  return (
    <TextFieldElement
      label=" "
      type="text"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      slotProps={{ input: { inputRef } }}
      sx={{
        minWidth: 120,
        "& .MuiFormLabel-root": { display: "none" },
      }}
      inputProps={{
        inputMode: "decimal",
        style: { textAlign: "right" },
      }}
    />
  );
}

function ProofCarouselItem({ proof }: { proof: POIAttachment }) {
  const { data: blob, isLoading, isError } = useGetAttachmentFileQuery(proof.path);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isPdf = proof.filename.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError || !objectUrl) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        gap={1}
      >
        <InsertDriveFileOutlined sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography variant="caption" color="error">
          Failed to load
        </Typography>
      </Box>
    );
  }

  if (isPdf) {
    return (
      <Box
        component="iframe"
        src={objectUrl}
        sx={{ width: "100%", height: "100%", border: "none", borderRadius: 1 }}
        title={proof.filename}
      />
    );
  }

  return (
    <Box
      component="img"
      src={objectUrl}
      alt={proof.filename}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        borderRadius: 1,
        cursor: "pointer",
      }}
      onClick={() => window.open(objectUrl, "_blank")}
    />
  );
}

function ProofCarousel({ proofs }: { proofs: POIAttachment[] }) {
  const [index, setIndex] = useState(0);
  const current = proofs[index];

  return (
    <Stack spacing={1} sx={{ flex: 1, minHeight: 0, height: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" fontWeight={600}>
          Proofs ({proofs.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {index + 1} / {proofs.length}
        </Typography>
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 420,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "grey.50",
        }}
      >
        <ProofCarouselItem proof={current} />
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap textAlign="center">
        {current.filename}
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <IconButton
          size="small"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          size="small"
          disabled={index === proofs.length - 1}
          onClick={() => setIndex((i) => Math.min(proofs.length - 1, i + 1))}
        >
          <ChevronRight />
        </IconButton>
      </Stack>
    </Stack>
  );
}

export default function PoiApprovalDetailPage() {
  const navigate = useNavigate();
  const { employeeId: employeeIdParam } = useParams<{ employeeId: string }>();
  const [searchParams] = useSearchParams();
  const employeeId = Number(employeeIdParam);
  const financialYear = searchParams.get("financialYear") ?? "";
  const employeeName = searchParams.get("employeeName") ?? "—";
  const isHistoryEdit = searchParams.get("source") === "history";
  const hasValidParams =
    Number.isFinite(employeeId) && employeeId > 0 && financialYear.trim().length > 0;

  const [openLetOutRows, setOpenLetOutRows] = useState<Record<string, boolean>>({});
  const [rowStates, setRowStates] = useState<Record<string, PoiRowApprovalState>>({});
  const [editingApprovedAmountKeys, setEditingApprovedAmountKeys] = useState<
    Record<string, true>
  >({});
  const [focusApprovedAmountRowKey, setFocusApprovedAmountRowKey] = useState<
    string | null
  >(null);
  const [proofTarget, setProofTarget] = useState<EntityPanelTarget | null>(null);
  const [commentsTarget, setCommentsTarget] = useState<EntityPanelTarget | null>(null);
  const [newComment, setNewComment] = useState("");
  const [uploadPOIProof, { isLoading: isSavingComment }] = useUploadPOIProofMutation();
  const [updatePOIStatus] = useUpdatePOIStatusMutation();
  const [considerForIt, { isLoading: isConsideringForIt }] =
    useConsiderForITMutation();
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    color: "success" | "error";
  } | null>(null);

  const {
    data: declaredData,
    isLoading,
    isFetching,
    refetch: refetchDeclaredData,
  } = useGetDeclaredDataForFYQuery(
    {
      employeeId,
      financialYear,
    },
    {
      skip: !hasValidParams,
      refetchOnMountOrArgChange: true,
    },
  );

  const declarationId = declaredData?.id;

  const rows = useMemo(
    () => buildItDeclarationTableRows(declaredData),
    [declaredData],
  );

  const actionableRows = useMemo(
    () => rows.filter(isPoiApprovalActionableRow),
    [rows],
  );

  useEffect(() => {
    if (!hasValidParams || !declaredData?.id) return;
    setRowStates(buildInitialRowStates(rows.filter(isPoiApprovalActionableRow)));
    setEditingApprovedAmountKeys({});
    setFocusApprovedAmountRowKey(null);
    setOpenLetOutRows({});
    setProofTarget(null);
    setCommentsTarget(null);
  }, [hasValidParams, declaredData?.id, rows]);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (row.isLetOutChild) return !!openLetOutRows[row.parentId ?? ""];
        return true;
      }),
    [rows, openLetOutRows],
  );

  const updateRowState = useCallback(
    (rowKey: string, patch: Partial<PoiRowApprovalState>) => {
      setRowStates((prev) => ({
        ...prev,
        [rowKey]: { ...prev[rowKey], ...patch },
      }));
    },
    [],
  );

  const finishEditingApprovedAmount = useCallback(
    (row: ItDeclarationTableRow, rowKey: string) => {
      setEditingApprovedAmountKeys((prev) => {
        if (!prev[rowKey]) return prev;
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });
      setRowStates((prev) => ({
        ...prev,
        [rowKey]: {
          ...prev[rowKey],
          approvedAmount: defaultApprovedAmount(row, prev[rowKey]),
        },
      }));
    },
    [],
  );

  const handleApprovedAmountBlur = useCallback(
    (
      row: ItDeclarationTableRow,
      rowKey: string,
      event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const related = event.relatedTarget as Node | null;
      const rowEl = event.currentTarget.closest("tr");
      const rowActions = rowEl?.querySelector("[data-poi-row-action]");
      const editTrigger = rowEl?.querySelector("[data-poi-edit-approved-amount]");
      if (related && rowActions?.contains(related)) return;
      if (related && editTrigger?.contains(related)) return;

      finishEditingApprovedAmount(row, rowKey);
    },
    [finishEditingApprovedAmount],
  );

  const clearApprovedAmountAutoFocus = useCallback(() => {
    setFocusApprovedAmountRowKey(null);
  }, []);

  const copyAllDeclaredToApproved = useCallback(() => {
    const nextEditing: Record<string, true> = {};
    setRowStates((prev) => {
      const next = { ...prev };
      for (const row of actionableRows) {
        const declared = getDeclaredAmountString(row);
        if (!declared) continue;
        const rowKey = getPoiApprovalRowKey(row);
        const state = prev[rowKey];
        if (state?.decision === "rejected") continue;
        if ((row.itemStatus ?? "").trim().toLowerCase() === "rejected") continue;

        next[rowKey] = {
          ...next[rowKey],
          approvedAmount: declared,
        };

        if (isApprovedOrPartiallyApprovedRow(row, state)) {
          nextEditing[rowKey] = true;
        }
      }
      return next;
    });
    if (Object.keys(nextEditing).length > 0) {
      setEditingApprovedAmountKeys((prev) => ({ ...prev, ...nextEditing }));
    }
  }, [actionableRows]);

  const handleRowDecision = useCallback(
    async (row: ItDeclarationTableRow, decision: "approved" | "rejected") => {
      if (declarationId == null) return;

      const rowKey = getPoiApprovalRowKey(row);
      const state = rowStates[rowKey];
      const approvedAmount = state?.approvedAmount ?? "";

      if (decision === "approved") {
        if (!approvedAmount.trim()) {
          setSnackbar({
            message: "Enter approved amount before approving.",
            color: "error",
          });
          return;
        }
        const parsed = Number(parseNumberForTyping(approvedAmount));
        if (!Number.isFinite(parsed) || parsed < 0) {
          setSnackbar({
            message: "Enter a valid approved amount.",
            color: "error",
          });
          return;
        }
        if (row.amount != null && parsed > row.amount) {
          setSnackbar({
            message: `Approved amount cannot exceed declared amount (${row.amount.toLocaleString("en-IN")}).`,
            color: "error",
          });
          return;
        }
      }

      const dto = buildUpdatePOIStatusDto(
        row,
        declarationId,
        decision,
        decision === "rejected" ? "0" : approvedAmount,
      );
      if (!dto) {
        setSnackbar({
          message: "Unable to update status for this row.",
          color: "error",
        });
        return;
      }

      setSavingRowKey(rowKey);
      try {
        await updatePOIStatus(dto).unwrap();
        setRowStates((prev) => ({
          ...prev,
          [rowKey]:
            decision === "rejected"
              ? { decision: "rejected", approvedAmount: "0" }
              : {
                  decision: "approved",
                  approvedAmount: approvedAmount.trim(),
                },
        }));
        setEditingApprovedAmountKeys((prev) => {
          const next = { ...prev };
          delete next[rowKey];
          return next;
        });
        await refetchDeclaredData();
        if (decision === "approved") {
          setSnackbar({
            message: "POI item approved successfully",
            color: "success",
          });
        }
      } catch (err: unknown) {
        const e = err as {
          data?: { message?: string };
          error?: string;
          message?: string;
        };
        setSnackbar({
          message:
            e?.data?.message ??
            e?.error ??
            e?.message ??
            "Failed to update POI status",
          color: "error",
        });
      } finally {
        setSavingRowKey(null);
      }
    },
    [declarationId, rowStates, updatePOIStatus, updateRowState, refetchDeclaredData],
  );

  const allRowsReviewed = useMemo(() => {
    if (actionableRows.length === 0) return false;
    return actionableRows.every((row) => {
      const state = rowStates[getPoiApprovalRowKey(row)];
      return state?.decision === "approved" || state?.decision === "rejected";
    });
  }, [actionableRows, rowStates]);

  const considerForItDisabledReason = useMemo((): string | null => {
    if (isConsideringForIt) return "Submitting declaration for IT…";
    if (declarationId == null) return "Declaration data is not available yet.";
    if (actionableRows.length === 0) return "No POI line items to review.";
    if (!allRowsReviewed) {
      const pendingCount = actionableRows.filter((row) => {
        const state = rowStates[getPoiApprovalRowKey(row)];
        return state?.decision !== "approved" && state?.decision !== "rejected";
      }).length;
      if (pendingCount === 1) {
        return "1 line item still needs approval or rejection.";
      }
      return `${pendingCount} line items still need approval or rejection.`;
    }
    return null;
  }, [
    actionableRows,
    allRowsReviewed,
    declarationId,
    isConsideringForIt,
    rowStates,
  ]);

  const proofAttachmentArgs = useMemo(
    () =>
      declarationId != null && proofTarget?.entityType
        ? buildPoiScopedFetchParams(
            declarationId,
            proofTarget.entityType,
            proofTarget.originalId,
          )
        : null,
    [declarationId, proofTarget?.entityType, proofTarget?.originalId],
  );

  const {
    data: proofAttachments = [],
    isLoading: proofsLoading,
    isFetching: proofsFetching,
  } = useGetPOIAttachmentsQuery(
    proofAttachmentArgs ?? { declarationId: 0, entityType: "" },
    {
      skip: !proofTarget || !proofAttachmentArgs,
      refetchOnMountOrArgChange: true,
    },
  );

  const proofViewKey = proofAttachmentArgs
    ? `${proofAttachmentArgs.declarationId}-${proofAttachmentArgs.entityType}-${proofTarget?.label ?? ""}`
    : "none";

  const attachmentsLoading = proofsLoading || proofsFetching;
  const proofsToDisplay = attachmentsLoading ? [] : proofAttachments;

  const commentsFetchArgs = useMemo(
    () =>
      declarationId != null && commentsTarget?.entityType
        ? buildPoiScopedFetchParams(
            declarationId,
            commentsTarget.entityType,
            commentsTarget.originalId,
          )
        : null,
    [declarationId, commentsTarget?.entityType, commentsTarget?.originalId],
  );

  const {
    comments: entityComments,
    loading: commentsLoading,
    refetch: refetchComments,
  } = usePoiScopedComments(commentsFetchArgs, !commentsTarget || !commentsFetchArgs);

  const handleSaveComment = async () => {
    if (
      !newComment.trim() ||
      declarationId == null ||
      !commentsTarget?.entityType ||
      commentsTarget.originalId == null
    ) {
      return;
    }

    const formData = new FormData();
    formData.append("declarationId", String(declarationId));
    formData.append("entityType", commentsTarget.entityType);

    if (!appendPoiEntityFormIds(formData, commentsTarget.entityType, commentsTarget.originalId)) {
      setSnackbar({ message: "Unknown entity type", color: "error" });
      return;
    }

    formData.append("comment", newComment);

    try {
      await uploadPOIProof(formData).unwrap();
      setNewComment("");
      setSnackbar({ message: "Comment added successfully", color: "success" });
      void refetchComments();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; error?: string; message?: string };
      setSnackbar({
        message:
          e?.data?.message ?? e?.error ?? e?.message ?? "Failed to add comment",
        color: "error",
      });
    }
  };

  const columns: StandardTableColumn[] = useMemo(
    () => [
      {
        id: "particulars",
        label: "Particulars",
        minWidth: 320,
        width: "34%",
        render: (row: ItDeclarationTableRow) =>
          row.isSection ? (
            <Box sx={{ fontWeight: 600, px: 1, py: 1 }}>
              <Typography variant="subtitle2">{row.particulars}</Typography>
            </Box>
          ) : row.isLetOutParent ? (
            <Stack direction="row" alignItems="center" px={1} gap={1}>
              <IconButton
                size="small"
                onClick={() =>
                  setOpenLetOutRows((prev) => ({
                    ...prev,
                    [row.id]: !prev[row.id],
                  }))
                }
              >
                {openLetOutRows[row.id] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
              <Typography variant="subtitle2">{row.particulars}</Typography>
            </Stack>
          ) : row.isLetOutChild ? (
            <Box px={4}>
              <Typography variant="body2" color="text.secondary">
                {row.particulars}
              </Typography>
            </Box>
          ) : isRentedHouseEntityType(row.entityType) ? (
            <Box px={1} gap={1.25} display="flex" flexDirection="column" py={0.5}>
              <Typography>{row.particulars}</Typography>
              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="subtitle2">Landlord Name</Typography>
                <Typography variant="body2">{row.LandlordName}</Typography>
              </Stack>
              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="subtitle2">PAN</Typography>
                <Typography variant="body2">{row.PAN}</Typography>
              </Stack>
            </Box>
          ) : (
            <Box px={1} py={0.5}>
              <Typography variant="body2">{row.particulars}</Typography>
            </Box>
          ),
      },
      {
        id: "amount",
        label: "Declared Amount",
        align: "right",
        minWidth: 120,
        width: "12%",
        render: (row: ItDeclarationTableRow) =>
          row.isSection || row.isSummary ? (
            ""
          ) : (
            <Typography variant="body2" textAlign="right">
              {row.amount?.toLocaleString?.("en-IN") ?? "—"}
            </Typography>
          ),
      },
      {
        id: "status",
        label: "Status",
        align: "center",
        minWidth: 168,
        width: "14%",
        render: (row: ItDeclarationTableRow) => {
          const status = getRowStatusLabel(row);
          if (!status) return "";
          return (
            <Box display="flex" justifyContent="center" sx={{ overflow: "visible" }}>
              <Chip
                label={formatPoiStatus(status)}
                color={getPoiItemStatusChipColor(status)}
                size="small"
                sx={{
                  maxWidth: "none",
                  "& .MuiChip-label": {
                    overflow: "visible",
                    textOverflow: "clip",
                    whiteSpace: "nowrap",
                    px: 1,
                  },
                }}
              />
            </Box>
          );
        },
      },
      {
        id: "proof",
        label: "Proof",
        align: "center",
        minWidth: 64,
        width: 64,
        render: (row: ItDeclarationTableRow) => {
          if (!isPoiApprovalActionableRow(row) || !row.entityType) return "";
          const count = row.attachmentsCount ?? 0;
          return (
            <Box display="flex" justifyContent="center">
              {renderPoiCountIconButton(
                count,
                "View proofs",
                <AttachFileIcon fontSize="small" />,
                () =>
                  setProofTarget({
                    entityType: row.entityType!,
                    label: row.particulars,
                    originalId: row.originalId!,
                  }),
              )}
            </Box>
          );
        },
      },
      {
        id: "comments",
        label: "Comments",
        align: "center",
        minWidth: 64,
        width: 64,
        render: (row: ItDeclarationTableRow) => {
          if (!isPoiApprovalActionableRow(row) || !row.entityType) return "";
          const count = row.commentsCount ?? 0;
          return (
            <Box display="flex" justifyContent="center">
              {renderPoiCountIconButton(
                count,
                "View comments",
                <ChatBubbleOutlineOutlined fontSize="small" />,
                () => {
                  setNewComment("");
                  setCommentsTarget({
                    entityType: row.entityType!,
                    label: row.particulars,
                    originalId: row.originalId!,
                  });
                },
              )}
            </Box>
          );
        },
      },
      {
        id: "approvedAmount",
        label: "Approved Amount",
        align: "right",
        minWidth: 130,
        width: "14%",
        render: (row: ItDeclarationTableRow) => {
          if (!isPoiApprovalActionableRow(row)) return "";
          const rowKey = getPoiApprovalRowKey(row);
          const state = rowStates[rowKey];
          const isReviewedDisplay = isReviewedAmountDisplayRow(row, state);
          const isEditing = editingApprovedAmountKeys[rowKey];
          const displayAmount = getDisplayApprovedAmount(row, state);

          if (isReviewedDisplay && !isEditing) {
            return (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={0.5}
              >
                <Typography variant="body2">
                  {formatApprovedAmountDisplay(displayAmount)}
                </Typography>
                <IconButton
                  size="small"
                  title="Edit approved amount"
                  data-poi-edit-approved-amount
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    updateRowState(rowKey, {
                      approvedAmount: displayAmount,
                    });
                    setEditingApprovedAmountKeys((prev) => ({
                      ...prev,
                      [rowKey]: true,
                    }));
                    setFocusApprovedAmountRowKey(rowKey);
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Stack>
            );
          }

          return (
            <ApprovedAmountEditField
              autoFocus={isReviewedDisplay && focusApprovedAmountRowKey === rowKey}
              onAutoFocusDone={clearApprovedAmountAutoFocus}
              value={formatNumberForTyping(state?.approvedAmount ?? "", "IN")}
              onChange={(e) =>
                updateRowState(rowKey, {
                  approvedAmount: parseNumberForTyping(e.target.value),
                })
              }
              onBlur={
                isReviewedDisplay
                  ? (e) => handleApprovedAmountBlur(row, rowKey, e)
                  : undefined
              }
            />
          );
        },
      },
      {
        id: "rowAction",
        label: "Action",
        align: "center",
        minWidth: 88,
        width: "8%",
        render: (row: ItDeclarationTableRow) => {
          if (!isPoiApprovalActionableRow(row)) return "";
          const rowKey = getPoiApprovalRowKey(row);
          const state = rowStates[rowKey];
          const isSaving = savingRowKey === rowKey;
          const actionsEnabled = canSubmitRowAction(row, state, isSaving);
          return (
            <Stack
              direction="row"
              spacing={0.5}
              justifyContent="center"
              data-poi-row-action
            >
              <IconButton
                size="small"
                color="success"
                disabled={!actionsEnabled}
                title="Approve row"
                onClick={() => void handleRowDecision(row, "approved")}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                disabled={!actionsEnabled}
                title="Reject row"
                onClick={() => void handleRowDecision(row, "rejected")}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        },
      },
    ],
    [
      openLetOutRows,
      rowStates,
      editingApprovedAmountKeys,
      focusApprovedAmountRowKey,
      savingRowKey,
      handleRowDecision,
      handleApprovedAmountBlur,
      copyAllDeclaredToApproved,
      updateRowState,
    ],
  );

  const loading = isLoading || (isFetching && declaredData == null);
  const financialYearLabel = financialYear
    ? formatFinancialYearLabel(financialYear)
    : "—";

  const goBack = () => navigate("/people/home?tab=10");

  const handleConsiderForIt = useCallback(async () => {
    if (declarationId == null) return;
    try {
      const result = await considerForIt(declarationId).unwrap();
      setSnackbar({
        message: result.message ?? "Declaration considered for IT successfully",
        color: "success",
      });
      goBack();
    } catch (err: unknown) {
      const e = err as {
        data?: { message?: string };
        error?: string;
        message?: string;
      };
      setSnackbar({
        message:
          e?.data?.message ??
          e?.error ??
          e?.message ??
          "Failed to consider declaration for IT",
        color: "error",
      });
    }
  }, [considerForIt, declarationId, navigate]);

  if (!hasValidParams) {
    return (
      <Card elevation={2} sx={{ p: 2.5, height: "100%" }}>
        <Typography variant="body2" color="text.secondary">
          Missing employee or financial year.
        </Typography>
      </Card>
    );
  }

  return (
    <>
      <Card
        elevation={2}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
          <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
              <IconButton onClick={goBack} aria-label="Back to approvals">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={600}>
                POI declaration review
              </Typography>
            </Stack>

            <Grid container spacing={2} alignItems="center" sx={{ flexShrink: 0 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Employee
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {employeeName}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Financial Year
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {financialYearLabel}
              </Typography>
            </Grid>
            <Grid
              size={{ xs: 12, sm: 4 }}
              display="flex"
              gap={1}
              flexWrap="wrap"
              alignItems="center"
            >
              <Chip
                label={formatPoiStatus(declaredData?.status ?? "not_submitted")}
                color={getItDeclarationStatusChipColor(declaredData?.status)}
                size="small"
              />
              {declaredData?.isLocked && (
                <Chip label="Locked" color="secondary" size="small" />
              )}
            </Grid>
          </Grid>

          {isHistoryEdit && (
            <Alert severity="warning" variant="outlined" sx={{ flexShrink: 0 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Since the Proof of Income (POI) has been approved,
                any updates made will be reflected in the Income Tax calculations directly.
              </Typography>
            </Alert>
          )}

          <Divider sx={{ flexShrink: 0 }} />

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ flex: 1, minHeight: 0 }}
            >
              <CustomCircularProgress size={40} />
            </Box>
          ) : visibleRows.length === 0 ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ flex: 1, minHeight: 0 }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No declaration details found
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                width: "100%",
              }}
            >
              <StandardTable
                columns={columns}
                rows={visibleRows}
                sticky
                stickyTop={0}
                tableSx={{
                  tableLayout: "fixed",
                  width: "100%",
                  minWidth: 1100,
                  "& td": { py: 1.25, verticalAlign: "middle" },
                  "& th": { py: 1.5 },
                  "& td:nth-of-type(3), & th:nth-of-type(3)": {
                    overflow: "visible",
                  },
                }}
                sx={{ overflow: "unset" }}
              />
            </Box>
          )}

          <Divider sx={{ flexShrink: 0 }} />

          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            {!loading && visibleRows.length > 0 && (
              <PrimaryIconButton
                icon={<ContentCopy fontSize="small" />}
                title="Copy declared to approved"
                disabled={actionableRows.length === 0}
                onClick={copyAllDeclaredToApproved}
              />
            )}
            {!isHistoryEdit && (
              <Tooltip
                title={considerForItDisabledReason ?? ""}
                placement="top"
                disableHoverListener={!considerForItDisabledReason}
                disableFocusListener={!considerForItDisabledReason}
              >
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <PrimaryButton
                    disabled={considerForItDisabledReason != null}
                    loading={isConsideringForIt}
                    onClick={() => void handleConsiderForIt()}
                  >
                    Consider for IT
                  </PrimaryButton>
                </Box>
              </Tooltip>
            )}
          </Stack>
          </Stack>
      </Card>

      <ModalElement
        open={proofTarget != null}
        onClose={() => setProofTarget(null)}
        title={`Proofs — ${proofTarget?.label ?? ""}`}
        maxWidth="lg"
        height="85vh"
        contentSx={{ minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        {attachmentsLoading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, minHeight: 420 }}
          >
            <CircularProgress />
          </Box>
        ) : proofsToDisplay.length === 0 ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ flex: 1, minHeight: 420 }}
          >
            <Typography color="text.secondary" textAlign="center">
              No proofs uploaded
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
            <ProofCarousel key={proofViewKey} proofs={proofsToDisplay} />
          </Box>
        )}
      </ModalElement>

      <POICommentsDrawer
        open={commentsTarget != null}
        onClose={() => {
          setCommentsTarget(null);
          setNewComment("");
        }}
        subtitle={commentsTarget?.label}
        comments={entityComments}
        loading={commentsLoading}
        newComment={newComment}
        onNewCommentChange={setNewComment}
        onSubmit={handleSaveComment}
        isSubmitting={isSavingComment}
      />

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar(null)}
        />
      )}
    </>
  );
}
