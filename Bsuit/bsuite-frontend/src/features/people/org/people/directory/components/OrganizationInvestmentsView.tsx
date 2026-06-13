import { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Typography,
  Divider,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Delete,
  ChevronLeft,
  ChevronRight,
  InsertDriveFileOutlined,
  Edit,
  ChatBubbleOutlineOutlined,
  AttachFile,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { POICommentsDrawer } from "../../../../me/investments/components/POICommentsDrawer";
import { useAppDispatch } from "../../../../../../store/store";
import { type StandardTableColumn } from "../../../../../../types/types";
import { useGetAttachmentFileQuery } from "../../../../../books/transact/transactHome/api/transact.api";
import {
  type POIAttachment,
  useGetFinancialYearQuery,
  useGetDeclaredDataForFYQuery,
  useGetPOIAttachmentsQuery,
  useDeleteDeclarationMutation,
  useUploadPOIProofMutation,
  shouldHideDeclared80CInvestmentExemption,
  itDeclarationApi,
  useGetPOIApplicableStatusQuery,
  buildFinancialYearSelectOptions,
  formatFinancialYearLabel,
  isHistoricalFinancialYear,
  isItDeclarationReadOnly,
  isItDeclarationSubmitted,
  getItDeclarationStatusChipColor,
  useSubmitPOIMutation,
} from "../../../../me/investments/api/itDeclaration.api";
import {
  buildItDeclarationTableRows,
  getItDeclarationTableRowSx,
  type ItDeclarationTableRow,
} from "../../../../me/investments/utils/itDeclarationTableRows";
import { renderPoiCountIconButton } from "../../../../me/investments/utils/poiCountIconButton";
import { usePoiScopedComments } from "../../../../me/investments/hooks/usePoiScopedComments";
import {
  appendPoiEntityFormIds,
  buildPoiScopedFetchParams,
  isRentedHouseEntityType,
} from "../../../../me/investments/utils/poiEntityTypes";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { Chip } from "../../../../../../components/atom/chips";
import { useGetEmployeeQuery } from "../api/directory.api";

/* ---------- Helpers ---------- */
const formatDate = (date?: string) => {
  if (!date) return "";
  const d = dayjs(date);
  return d.isValid() ? d.format("MMM DD, YYYY") : date;
};

const formatStatus = (statusStr: string) => {
  if (statusStr?.toLowerCase() === "submitted") {
    return "Awaiting Approval";
  }

  return statusStr
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

interface ITDeclarationProps {
  employeeId: number;
  /** Refetch IT declaration APIs when the Investments tab is active. */
  parentPanelVisible?: boolean;
}

/* ---------- Carousel sub-components ---------- */
function ProofCarouselItem({ proof }: { proof: POIAttachment }) {
  const {
    data: blob,
    isLoading,
    isError,
  } = useGetAttachmentFileQuery(proof?.path, { skip: !proof?.path });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isPdf = proof?.filename.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (isLoading)
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <CircularProgress size={32} />
      </Box>
    );

  if (isError || !objectUrl)
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        gap={1}
      >
        <InsertDriveFileOutlined
          sx={{ fontSize: 48, color: "text.disabled" }}
        />
        <Typography variant="caption" color="error">
          Failed to load
        </Typography>
      </Box>
    );

  if (isPdf)
    return (
      <Box
        component="iframe"
        src={objectUrl}
        sx={{ width: "100%", height: "100%", border: "none", borderRadius: 1 }}
        title={proof?.filename}
      />
    );

  return (
    <Box
      component="img"
      src={objectUrl}
      alt={proof?.filename}
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
    <Stack spacing={1} flex={1} minHeight={0} height="100%">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Existing Proofs ({proofs.length})
        </Typography>
        {proofs?.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {index + 1} / {proofs.length}
          </Typography>
        )}
      </Stack>

      {proofs?.length > 0 && (
        <Box
          sx={{
            flex: 1,
            minHeight: 420,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            backgroundColor: "grey.50",
            position: "relative",
          }}
        >
          <ProofCarouselItem proof={current} />
        </Box>
      )}

      {proofs?.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ textAlign: "center" }}
        >
          {current?.filename}
        </Typography>
      )}

      {proofs?.length > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
        >
          <IconButton
            size="small"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronLeft />
          </IconButton>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {proofs.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIndex(i)}
                sx={{
                  width: i === index ? 10 : 7,
                  height: i === index ? 10 : 7,
                  borderRadius: "50%",
                  backgroundColor: i === index ? "primary.main" : "grey.400",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </Stack>
          <IconButton
            size="small"
            onClick={() => setIndex((i) => Math.min(proofs.length - 1, i + 1))}
            disabled={index === proofs.length - 1}
          >
            <ChevronRight />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}

/* ---------- Main Component ---------- */
export default function ITDeclarationView({
  employeeId,
  parentPanelVisible,
}: ITDeclarationProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [submitpoi] = useSubmitPOIMutation();
  const { data: applicable, refetch: refetchPOIApplicable } =
    useGetPOIApplicableStatusQuery(undefined, { refetchOnMountOrArgChange: true });
  /* ---------- FY selector ---------- */
  const { data: fyData, isLoading: isLoadingFY, refetch: refetchFinancialYear } =
    useGetFinancialYearQuery(String(employeeId), {
      skip: !employeeId,
      refetchOnMountOrArgChange: true,
    });
  const [fySelectValue, setFySelectValue] = useState("");
  const derivedFY = fyData?.currentFinancialYear.financialYear ?? "";
  const activeFY = fySelectValue || derivedFY;
  const isHistoricalFY =
    !!fyData && !!activeFY && isHistoricalFinancialYear(fyData, activeFY);
  const [openLetOutRows, setOpenLetOutRows] = useState<{ [id: string]: boolean }>({});

  const fyOptions = useMemo(() => {
    if (!fyData) return [];
    return buildFinancialYearSelectOptions(fyData);
  }, [fyData]);

  useEffect(() => {
    const currentFY = fyData?.currentFinancialYear.financialYear;
    if (currentFY && !fySelectValue) setFySelectValue(currentFY);
  }, [fyData, fySelectValue]);

  const { data: empData } = useGetEmployeeQuery(employeeId, {
    skip: !employeeId,
  });
  /* ---------- Declared Data ---------- */
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofComment, setProofComment] = useState("");
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const {
    data: declaredData,
    isLoading,
    isFetching,
    refetch: refetchDeclaredData,
  } = useGetDeclaredDataForFYQuery(
    { employeeId, financialYear: activeFY },
    {
      skip: !employeeId || !activeFY,
      refetchOnMountOrArgChange: true,
    },
  );

  useEffect(() => {
    if (parentPanelVisible !== true) return;
    if (employeeId) void refetchFinancialYear();
    void refetchPOIApplicable();
    if (employeeId && activeFY) void refetchDeclaredData();
  }, [
    parentPanelVisible,
    employeeId,
    activeFY,
    refetchFinancialYear,
    refetchPOIApplicable,
    refetchDeclaredData,
  ]);

  const poiFetchArgs = useMemo(
    () =>
      declaredData?.id && drawerContent?.entityType
        ? buildPoiScopedFetchParams(
            declaredData.id,
            drawerContent.entityType,
            drawerContent.originalId,
          )
        : null,
    [declaredData?.id, drawerContent?.entityType, drawerContent?.originalId],
  );

  const {
    comments: apiComments,
    loading: isLoadingComments,
    refetch: refetchComments,
  } = usePoiScopedComments(poiFetchArgs, !isDrawerOpen || !poiFetchArgs);

  const proofAttachmentArgs = poiFetchArgs;

  const {
    data: existingProofs = [],
    isLoading: isLoadingAttachments,
    isFetching: isFetchingAttachments,
  } = useGetPOIAttachmentsQuery(
    proofAttachmentArgs ?? { declarationId: 0, entityType: "" },
    {
      skip: !proofModalOpen || !proofAttachmentArgs,
      refetchOnMountOrArgChange: true,
    },
  );

  const proofViewKey = proofAttachmentArgs
    ? `${proofAttachmentArgs.declarationId}-${proofAttachmentArgs.entityType}-${drawerContent?.originalId ?? ""}`
    : "none";

  const attachmentsLoading = isLoadingAttachments || isFetchingAttachments;
  const proofsToDisplay = attachmentsLoading ? [] : existingProofs;

  const hasDeclaredData =
    (declaredData?.rentedHouseDetails?.length ?? 0) > 0 ||
    declaredData?.selfOccupiedProperty != null ||
    (declaredData?.letOutProperties?.length ?? 0) > 0 ||
    (declaredData?.exemptionDetails?.length ?? 0) > 0;

  const isDeclarationReadOnly = isItDeclarationReadOnly({
    isHistoricalFY,
    isLocked: declaredData?.isLocked,
  });
  const isPoiSubmitted = isItDeclarationSubmitted(declaredData?.status);
  const canEditDeclaration = !isDeclarationReadOnly;
  const canDeleteDeclaration = canEditDeclaration && !isPoiSubmitted;

  const canShowPoiSubmitSection =
    applicable?.POIMonthStatus === true &&
    canEditDeclaration &&
    !isPoiSubmitted;

  const [deleteDeclaration, { isLoading: isDeleting }] =
    useDeleteDeclarationMutation();
  const [uploadPOIProof, { isLoading: isUploading }] =
    useUploadPOIProofMutation();

  /* ---------- Rows ---------- */
  const rows = useMemo(
    () => buildItDeclarationTableRows(declaredData),
    [declaredData],
  );

  /* ---------- Handlers ---------- */
  const handleSaveComment = async () => {
    if (
      !newComment.trim() ||
      !declaredData?.id ||
      !drawerContent?.entityType ||
      !drawerContent.originalId
    )
      return;

    const formData = new FormData();
    formData.append("declarationId", String(declaredData.id));
    
    const resolvedParams = buildPoiScopedFetchParams(
      declaredData.id,
      drawerContent.entityType,
      drawerContent.originalId
    );
    formData.append("entityType", resolvedParams.entityType);

    if (!appendPoiEntityFormIds(formData, resolvedParams.entityType, drawerContent.originalId)) {
      setSnackbar({ message: "Unknown entity type", color: "error" });
      return;
    }

    formData.append("comment", newComment);

    try {
      await uploadPOIProof(formData).unwrap();
      setSnackbar({ message: "Comment added successfully", color: "success" });
      setNewComment("");
      void refetchComments();
    } catch (error: unknown) {
      const e = error as any;
      setSnackbar({ message: e?.data?.message ?? e?.error ?? e?.message ?? "Failed to add comment.", color: "error" });
    }
  };

  const handleEditDeclaration = () => {
    navigate(`/people/directory/employee/${employeeId}/investment/edit?tab=3`, {
      state: { financialYear: activeFY, isEdit: true },
    });
  };

  const handleDelete = async () => {
    if (!declaredData?.id || !employeeId || !activeFY) return;
    try {
      await deleteDeclaration(declaredData.id).unwrap();
      dispatch(
        itDeclarationApi.util.updateQueryData(
          "getDeclaredDataForFY",
          { employeeId, financialYear: activeFY },
          () => null,
        ),
      );
      setSnackbar({
        message: "IT declaration deleted successfully.",
        color: "success",
      });
    } catch (e: any) {
      setSnackbar({
        message: e?.data?.message ?? e?.error ?? e?.message ?? "Failed to delete declaration.",
        color: "error",
      });
    }
    setConfirmOpen(false);
  };

  const handleUploadProofs = async () => {
    if (!proofFiles.length || isUploading) return;
    if (
      !declaredData?.id ||
      !drawerContent?.entityType ||
      !drawerContent.originalId
    ) {
      setSnackbar({
        message: "Cannot upload proof: invalid entity",
        color: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("declarationId", String(declaredData.id));
    
    const resolvedParams = buildPoiScopedFetchParams(
      declaredData.id,
      drawerContent.entityType,
      drawerContent.originalId
    );
    formData.append("entityType", resolvedParams.entityType);

    if (!appendPoiEntityFormIds(formData, resolvedParams.entityType, drawerContent.originalId)) {
      setSnackbar({ message: "Unknown entity type", color: "error" });
      return;
    }

    formData.append("comment", proofComment || "proof uploaded");
    proofFiles.forEach((file) => formData.append("files", file));

    try {
      await uploadPOIProof(formData).unwrap();
      setSnackbar({ message: "Proof uploaded successfully", color: "success" });
      setProofModalOpen(false);
      setProofFiles([]);
      setProofComment("");
    } catch (err: unknown) {
      const e = err as any;
      setSnackbar({ message: e?.data?.message ?? e?.error ?? e?.message ?? "Upload failed.", color: "error" });
    }
  };

  const handleCloseProofModal = () => {
    setProofModalOpen(false);
    setDrawerContent(null);
    setProofFiles([]);
    setProofComment("");
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<any>(null);

  const loadingState =
    isLoadingFY || isLoading || (isFetching && declaredData == null);
  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (!row.isLetOutChild) return true;
      const parentId = row.parentId;
      if (!parentId) return false;
      return !!openLetOutRows[parentId];
    });
  }, [rows, openLetOutRows]);

  const isProofCommentReadOnly = ["submitted", "approved"].includes(declaredData?.status ?? "");

  /* ---------- Table Columns ---------- */
  const columns: StandardTableColumn[] = [
    {
      id: "particulars",
      label: "Particulars",
      render: (row: any) =>
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
            <Typography variant="body2" color="text.secondary">{row.particulars}</Typography>
          </Box>
        ) :
          isRentedHouseEntityType(row.entityType) ? (
            <Box px={1} gap={1} display="flex" flexDirection="column">
              <Typography>{row.particulars}</Typography>
              <Stack direction="row" gap={1} display={"flex"} alignItems="center">
                <Typography variant="subtitle2">Landlord Name</Typography>
                <Typography variant="body2">{row.LandlordName}</Typography>
              </Stack>
              <Stack direction="row" gap={1} display={"flex"} alignItems="center">
                <Typography variant="subtitle2">PAN</Typography>
                <Typography variant="body2">{row.PAN}</Typography>
              </Stack>
            </Box>) :
            (
              <Box px={1}>
                <Typography variant="body2">{row.particulars}</Typography>
              </Box>
            ),
    }, ,
    {
      id: "amount",
      label: "Declared Amount",
      align: "right",
      render: (row: any) =>
        row.isSection ? "" : <Stack direction={"column"} display={"flex"} flexDirection={"column"} alignItems="flex-end" justifyContent={"start"} height={"100%"}>
          {row.amount?.toLocaleString?.() ?? "—"}
        </Stack>,
    },
    {
      id: "proof",
      label: "Proof",
      align: "center",
      minWidth: 64,
      width: 64,
      render: (row: ItDeclarationTableRow) =>
        row.isSection || !row.originalId || !row.entityType ? "" : (
          <Box display="flex" justifyContent="center">
            {renderPoiCountIconButton(
              row.attachmentsCount ?? 0,
              "View proofs",
              <AttachFile fontSize="small" />,
              () => {
                setDrawerContent(row);
                setProofModalOpen(true);
              },
              !applicable?.POIMonthStatus || isDeclarationReadOnly,
            )}
          </Box>
        ),
    },
    {
      id: "comments",
      label: "Comments",
      align: "center",
      minWidth: 64,
      width: 64,
      render: (row: ItDeclarationTableRow) =>
        row.isSection || !row.originalId || !row.entityType ? "" : (
          <Box display="flex" justifyContent="center">
            {renderPoiCountIconButton(
              row.commentsCount ?? 0,
              "View comments",
              <ChatBubbleOutlineOutlined fontSize="small" />,
              () => {
                setDrawerContent(row);
                setIsDrawerOpen(true);
              },
              !applicable?.POIMonthStatus || isDeclarationReadOnly,
            )}
          </Box>
        ),
    },
  ].filter(Boolean) as StandardTableColumn[];

  /* ---------- UI ---------- */
  return (
    <Box p={3}>
      {/* Header */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Grid>
          <Typography variant="h6" fontWeight={600}>
            IT DECLARATIONS{" "}
          </Typography>
        </Grid>
        <Grid sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {loadingState ? (
            <CustomCircularProgress size={24} />
          ) : fyOptions.length <= 1 ? (
            <Box width={250} mb={1.5}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                Financial Year
              </Typography>
              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "grey.50",
                  fontSize: "0.9rem",
                }}
              >
                {fyOptions[0]?.label ??
                  formatFinancialYearLabel(activeFY, fyData?.currentFinancialYear) ??
                  "—"}
              </Box>
            </Box>
          ) : (
            <Box width={200}>
              <SingleSelectElement
                label="Financial Year"
                value={activeFY}
                onChange={(v: any) => setFySelectValue(v ?? "")}
                options={fyOptions}
              />
            </Box>
          )}
          {declaredData?.isLocked && (
            <Chip label="Locked" color="secondary" size="small" />
          )}
          {hasDeclaredData && (
            <>
              <Chip
                label={formatStatus(declaredData?.status ?? "not_submitted")}
                color={getItDeclarationStatusChipColor(declaredData?.status)}
                size="small"
              />
              {canEditDeclaration && (
                <PrimaryIconButton
                  icon={<Edit />}
                  variant="outlined"
                  title="Edit"
                  onClick={handleEditDeclaration}
                />
              )}
              {canDeleteDeclaration && (
                <PrimaryIconButton
                  icon={<Delete />}
                  variant="outlined"
                  color="error"
                  title="Delete"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isDeleting}
                />
              )}
            </>
          )}
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />

      {/* Table or Empty */}
      {loadingState ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={280}
        >
          <CustomCircularProgress size={40} />
        </Box>
      ) : !hasDeclaredData ? (
        <Box textAlign="center">
          <Typography variant="h6" mb={isDeclarationReadOnly ? 0 : 2}>
            {isHistoricalFY
              ? "No investment submitted"
              : "No declaration available"}
          </Typography>
          {!isDeclarationReadOnly && (
            <Button
              variant="contained"
              onClick={() =>
                navigate(
                  `/people/directory/employee/${employeeId}/investment/add`,
                  {
                    state: { financialYear: activeFY },
                  },
                )
              }
            >
              Add Declaration
            </Button>
          )}
        </Box>
      ) : (
        <>
          <StandardTable 
            columns={columns} 
            rows={visibleRows} 
            sticky 
            nowrapCells={false} 
            getRowSx={getItDeclarationTableRowSx}
          />
          {canShowPoiSubmitSection && declaredData?.id != null && (
            <>
              <Checkbox
                label={`I ${empData?.data?.contact?.name},  do hereby certify that the information given is complete and correct`}
              />
              <PrimaryButton
                onClick={async () => {
                  if (declaredData?.id == null) return;
                  try {
                    await submitpoi(declaredData.id).unwrap();
                    await refetchDeclaredData();
                    setSnackbar({
                      message: "POI Submitted Successfully",
                      color: "success",
                    });
                  } catch (error: any) {
                    setSnackbar({
                      message:
                        error?.data?.message ??
                        error?.error ??
                        error?.message ??
                        "Failed to submit POI.",
                      color: "error",
                    });
                  }
                }}
              >
                Submit
              </PrimaryButton>
            </>
          )}
        </>
      )}

      <POICommentsDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setNewComment("");
        }}
        subtitle={drawerContent?.particulars}
        comments={apiComments.comments ?? []}
        loading={isLoadingComments}
        readOnly={isDeclarationReadOnly || isProofCommentReadOnly}
        newComment={newComment}
        onNewCommentChange={setNewComment}
        onSubmit={handleSaveComment}
        isSubmitting={isUploading}
      />

      {/* Proof Modal */}
      <ModalElement
        open={proofModalOpen}
        onClose={handleCloseProofModal}
        title="Manage Proof of Investment"
        maxWidth="lg"
        height="85vh"
        contentSx={{ minHeight: 0, display: "flex", flexDirection: "column" }}
        onClick={handleUploadProofs}
        draggable
        disabled={
          isDeclarationReadOnly || isUploading || proofFiles.length === 0
        }
      >
        <Stack
          spacing={3}
          direction="row"
          sx={{ flex: 1, minHeight: 0, height: "100%", alignItems: "stretch" }}
        >
          {!isDeclarationReadOnly && (
            <Stack spacing={2} flex={1}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Add New Proofs
                </Typography>

                <FileUploadField
                  label="Choose Files"
                  multiple
                  maxFiles={10}
                  maxSize={5}
                  accept={[
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "application/pdf",
                  ]}
                  value={proofFiles}
                  onChange={(files) => {
                    setProofFiles(
                      Array.isArray(files) ? files : files ? [files] : [],
                    );
                  }}
                />

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    mb={0.5}
                    display="block"
                  >
                    Comment (optional)
                  </Typography>
                  <input
                    type="text"
                    placeholder="Enter comment..."
                    value={proofComment}
                    onChange={(e) => setProofComment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box",
                    }}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {proofFiles.length} file(s) ready to upload
                </Typography>
              </Stack>

              {proofFiles.length > 0 && (
                <Stack
                  spacing={1}
                  sx={{ maxHeight: 200, overflowY: "auto", pr: 0.5 }}
                >
                  {proofFiles.map((file, index) => (
                    <Stack
                      key={`${file.name}-${index}`}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 1.5,
                        py: 1,
                        border: "1px solid",
                        borderColor: "info.main",
                        borderRadius: 1,
                        backgroundColor: "info.lighter",
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isUploading}
                        onClick={() =>
                          setProofFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {!isDeclarationReadOnly && (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ alignSelf: "stretch", borderWidth: 1, bgcolor: "divider" }}
            />
          )}

          {attachmentsLoading ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : proofsToDisplay.length > 0 ? (
            <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
              <ProofCarousel key={proofViewKey} proofs={proofsToDisplay} />
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Typography color="text.secondary">
                No proofs uploaded yet
              </Typography>
            </Box>
          )}
        </Stack>
      </ModalElement>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete Declaration?"
        onConfirm={handleDelete}
        confirmText="Delete"
      />

      {/* Snackbar */}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar(null)}
        />
      )}
    </Box>
  );
}
