import { Box, Typography, Divider, Skeleton, useTheme, Tooltip } from "@mui/material";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { useEffect, useState } from "react";
import CardAtom from "../../../../../../components/atom/card/Card";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { Stack } from "@mui/system";
import { Chip } from "../../../../../../components/atom/chips";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import { Edit, Upload, Visibility } from "@mui/icons-material";
import {
  type EmployeeFolderType,
  useGetEmployeeDocFolderTypeByIdQuery,
  useGetEmployeeDocFolderTypesWithoutPermissionsQuery,
} from "../../../../org/documents/emp-documents/api/employee-doc.api";
import DynamicModal from "./DynamicModal";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";

type EmpDocumentPanelProps = {
  folder: EmployeeFolderType | null;
  highlightDocumentTypeId?: number | null;
  highlightDocumentPulse?: number;
};

// ─── Skeleton for a single document row card ─────────────────────────────────
const DocumentRowSkeleton = () => (
  <CardAtom
    sx={{
      p: 0.5,
      px: 1.5,
      border: "1px solid #e0e0e0",
      borderRadius: 2,
      boxShadow: "none",
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
      <Box display="flex" gap={1} alignItems="center">
        <Skeleton variant="text" width={140} height={22} />
      </Box>
      <Box display="flex" gap={1} alignItems="center">
        <Skeleton variant="rounded" width={90} height={28} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" width={80} height={30} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  </CardAtom>
);

// ─── List of row skeletons ────────────────────────────────────────────────────
const DocumentListSkeleton = ({ count = 5 }: { count?: number }) => (
  <Box display="grid" gap={1}>
    {Array.from({ length: count }).map((_, i) => (
      <DocumentRowSkeleton key={i} />
    ))}
  </Box>
);

const EmpDocsPanel = ({
  folder,
  highlightDocumentTypeId = null,
  highlightDocumentPulse = 0,
}: EmpDocumentPanelProps) => {
  const theme = useTheme();
  const { data: info } = useGetEmployeeInfoQuery();
  
  // Use the highlight hook to get styling for document type
  const { getHighlightSx, scrollToElement } = useNotificationHighlight(["documentTypeId"]);

  const [openDynamicModal, setOpenDynamicModal] = useState(false);
  const [selectedDocumentForMe, setSelectedDocumentForMe] = useState<
    number | null
  >(null);
  const [customFields, setCustomFields] = useState<any>();
  const [rejected, setRejected] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [view, setView] = useState(false);
  const [attachments, setAttachments] = useState<
    { path: string; filename: string }[]
  >([]);

  const { data: docData, isFetching } = useGetEmployeeDocFolderTypeByIdQuery(
    selectedDocumentForMe!,
    {
      skip: !selectedDocumentForMe,
      refetchOnMountOrArgChange: true,
    },
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const { data: documentTypesWithPermission, isLoading } =
    useGetEmployeeDocFolderTypesWithoutPermissionsQuery(
      {
        folderId: folder?.id || 0,
        employeeId: info?.data?.employeeId!,
      },
      { skip: !folder?.id || !info?.data },
    );

  const safeDocuments = Array.isArray(documentTypesWithPermission?.documents)
    ? documentTypesWithPermission.documents
    : [];

  useEffect(() => {
    if (selectedDocumentForMe && docData && !isFetching) {
      setOpenDynamicModal(true);
    }
  }, [selectedDocumentForMe, docData, isFetching]);

  // Scroll to document row once folder types have loaded.
  useEffect(() => {
    if (highlightDocumentTypeId == null || highlightDocumentPulse === 0 || isLoading) return;
    if (!safeDocuments.some((d:any) => d.documentTypeId === highlightDocumentTypeId)) return;

    scrollToElement(`emp-doc-type-${highlightDocumentTypeId}`, "center", 150);
  }, [
    highlightDocumentTypeId,
    highlightDocumentPulse,
    isLoading,
    safeDocuments,
    scrollToElement
  ]);

  return (
    <>
      <Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
          <Typography variant="h6">
            {folder?.documentFolderName || "Documents"}
          </Typography>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {isLoading ? (
          <DocumentListSkeleton count={5} />
        ) : safeDocuments.length === 0 ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <Typography variant="body1" color="textSecondary">
              No document types found
            </Typography>
          </Box>
        ) : (
          <Box display="grid" gap={1}>
            {safeDocuments.map((doc: any) => {
              const rejectionReason = doc.documentDetails?.rejectedReason || 
                doc.documentDetails?.customFields?.rejectedReason || 
                doc.documentDetails?.attachments?.find((att: any) => att.status === "rejected")?.rejectedReason;
              return (
              <CardAtom
                key={`${doc.documentTypeId}-${highlightDocumentPulse}`}
                id={`emp-doc-type-${doc.documentTypeId}`}
                sx={{
                  p: 0.5,
                  px: 1.5,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  boxShadow: "none",
                  ...getHighlightSx("documentTypeId", doc.documentTypeId, theme)
                }}
              >
                <Box display="flex" justifyContent="space-between">
                  <Box display="flex" flexDirection="column">
                    <Box display="flex" gap={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doc.documentTypeName}
                      </Typography>
                      {(doc.isMandatory ||
                        doc.documentDetails?.documentType?.isMandatory) && (
                          <Chip label="Mandatory" color="warning" size="small" />
                        )}
                    </Box>
                    {doc.isRejected && rejectionReason && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
                        Reason: {rejectionReason}
                      </Typography>
                    )}
                  </Box>

                  <Box display="flex" gap={1} alignItems="center">
                    {doc.isUploaded &&
                      (doc.isVerified ? (
                        <Chip label="Verified" color="success" />
                      ) : doc.isRejected ? (
                        <Tooltip title={rejectionReason ? `Reason: ${rejectionReason}` : "Rejected by admin"} placement="top">
                          <span>
                            <Chip label="Rejected" color="error" />
                          </span>
                        </Tooltip>
                      ) : (
                        <Chip label="Pending verification" color="warning" />
                      ))}

                    {folder?.employeeSelfPermission.view && doc.documentDetails && (
                      <PrimaryIconButton
                        icon={<Visibility />}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (!doc.documentTypeId) return;
                          setSelectedDocumentForMe(doc.documentTypeId);
                          setRejected(
                            doc.isUploaded && (doc.isRejected || !doc.isVerified),
                          );
                          setDetailsId(
                            doc.documentDetails?.customFields?.detailsId ?? null,
                          );
                          setCustomFields(doc?.documentDetails?.customFields);
                          setAttachments(doc.documentDetails?.attachments || []);
                          setIsVerified(doc.isVerified === true);
                          setView(true);
                        }}
                      />
                    )}
                    {folder?.employeeSelfPermission.addUpdate && !doc.isVerified && (
                      <PrimaryIconButton
                        icon={doc.isUploaded ? <Edit /> : <Upload />}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (!doc.documentTypeId) return;
                          setSelectedDocumentForMe(doc.documentTypeId);
                          setRejected(
                            doc.isUploaded && (doc.isRejected || !doc.isVerified),
                          );
                          setDetailsId(
                            doc.documentDetails?.customFields?.detailsId ?? null,
                          );
                          setCustomFields(doc?.documentDetails?.customFields);
                          setAttachments(doc.documentDetails?.attachments || []);
                          setIsVerified(doc.isVerified === true);
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </CardAtom>
            );
            })}
          </Box>
        )}
      </Box>

      <ModalElement
        title={!isVerified ? "Manage Document" : "View Document"}
        open={openDynamicModal}
        onClose={() => {
          setOpenDynamicModal(false);
          setView(false);
          setSelectedDocumentForMe(null);
        }}
        maxWidth="lg"
        height={"80vh"}
        contentSx={{}}
      >
        {selectedDocumentForMe && docData && (
          <DynamicModal
            folder={folder!}
            docData={docData}
            employeeId={String(info?.data?.employeeId!)}
            customFields={customFields}
            attachments={attachments}
            onClose={() => {
              setOpenDynamicModal(false);
              setSelectedDocumentForMe(null);
            }}
            rejected={rejected}
            detailsId={detailsId}
            isVerified={isVerified}
            view={view}
          />
        )}
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
};

export default EmpDocsPanel;