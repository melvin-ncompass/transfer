import { useState, type SetStateAction } from "react";
import {
  Stack,
  Typography,
  IconButton,
  Box,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import {
  useGetAttachmentsQuery,
  useDeleteAttachmentMutation,
  useUploadAttachmentsMutation,
} from "../../api/transact.api";
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import type { HighlightedRow } from "../../../../../../types/types";
import { PermissionGuard } from "../../../../../../guards/ComponentGuard";
import { usePermission } from "../../../../../../context/PermissionContext";

interface AttachmentsModalProps {
  open: boolean;
  onClose: () => void;
  transactionTypeId: string;
  transactionTypeName: string;
  paymentId?: string;
  showSnackBar: (message: string, color: "success" | "error") => void;
  onSuccess?: () => void;
  onDelete?: ({
    transactionTypeId,
    transactionTypeName,
    paymentId,
  }: {
    transactionTypeId: string;
    transactionTypeName: string;
    paymentId?: string;
  }) => void;
  setHighlightedRow: React.Dispatch<React.SetStateAction<HighlightedRow>>;
}

export function AttachmentsModal({
  open,
  onClose,
  transactionTypeId,
  transactionTypeName,
  paymentId,
  showSnackBar,
  onSuccess,
  onDelete,
  setHighlightedRow,
}: AttachmentsModalProps) {
  const {permissions} = usePermission();  
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  //  Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  //  Fetch attachments
  const { data: attachmentsResponse, isLoading: isLoadingAttachments } =
    useGetAttachmentsQuery(
      { transactionTypeId, transactionTypeName, paymentId },
      { skip: !open },
    );

  const attachments =
    Array.isArray(attachmentsResponse?.data) &&
    Array.isArray(attachmentsResponse.data[0]?.attachments)
      ? attachmentsResponse.data[0].attachments.map((a: any) => ({
          filename: a.filename,
          path: a.path,
        }))
      : [];

  const [deleteAttachment, { isLoading: isDeletingAttachment }] =
    useDeleteAttachmentMutation();
  const [uploadAttachments, { isLoading: isUploadingAttachments }] =
    useUploadAttachmentsMutation();

  /* ----------------- File Operations ------------------ */

  const handleAddFiles = (files: File | File[] | null) => {
    if (!files) return;
    const list = Array.isArray(files) ? files : [files];
    setNewFiles((prev) => [...prev, ...list]);
  };

  const handleRemoveNewFile = (index: number) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDeleteAttachment = (filename: string) => {
    setFileToDelete(filename);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!fileToDelete) return;

    deleteAttachment({
      transactionTypeId,
      transactionTypeName,
      filename: fileToDelete,
      paymentId,
    })
      .unwrap()
      .then(() => {
        showSnackBar("Attachment deleted successfsully", "success");
        setDeleteConfirmOpen(false);
        setFileToDelete(null);
        onDelete?.({
          transactionTypeId,
          transactionTypeName,
          paymentId,
        });
        setHighlightedRow({
          key: "transactionTypeId",
          value: transactionTypeId,
          type: "edit",
          counter: Date.now(),
        });
      })
      .catch((err: any) => {
        showSnackBar(
          err?.data?.message || "Failed to delete attachment",
          "error",
        );
        setDeleteConfirmOpen(false);
      });
  };

  const handleUploadNewFiles = () => {
    if (newFiles.length === 0) return;

    uploadAttachments({
      files: newFiles,
      transactionTypeId,
      transactionTypeName,
      paymentId,
    })
      .unwrap()
      .then(() => {
        showSnackBar("Attachments uploaded successfully", "success");
        setNewFiles([]);
        onSuccess?.();
        setHighlightedRow({
          key: "transactionTypeId",
          value: transactionTypeId,
          type: "add",
          counter: Date.now(),
        });
      })
      .catch((err: any) => {
        showSnackBar(
          err?.data?.message || "Failed to upload attachments",
          "error",
        );
      });
  };

  const handleClose = () => {
    setNewFiles([]);
    onClose();
  };

  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  /* ----------------- Render ------------------ */

  return (
    <>
      <ModalElement
        open={open}
        onClose={handleClose}
        title="Manage Attachments"
        maxWidth="lg"
        // sx={{ height: 500 }}
        onClick={permissions.includes("manage_transactions") ? handleUploadNewFiles : undefined}
        draggable
        disabled={isUploadingAttachments || newFiles.length === 0}
      >
        {isLoadingAttachments || attachmentsResponse === undefined ? (
          <Box
            sx={{
              width: "100%",
              minHeight: 280,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} direction={"row"} height={"100%"}>
            <>
              {/* Upload New Attachments */}
            <PermissionGuard permission={"manage_transactions"}>
                <Stack spacing={2} flex={1}>
                {/* Fixed top section */}
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Add New Attachments
                  </Typography>

                  <FileUploadField
                    label="Choose Files"
                    multiple
                    maxFiles={10} // max number of files allowed
                    maxSize={5} // max size per file in MB
                    accept={[
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                      "application/pdf",
                    ]} // allowed types
                    value={null}
                    onChange={handleAddFiles}
                  />

                  <Typography variant="caption" color="text.secondary">
                    {newFiles.length} file(s) ready to upload
                  </Typography>
                </Stack>

                {/* Scrollable list section */}
                {newFiles.length > 0 && (
                  <Stack
                    spacing={1}
                    sx={{
                      maxHeight: 200, // adjust as needed
                      overflowY: "auto",
                      pr: 0.5, // avoids scrollbar overlay
                    }}
                  >
                    {newFiles.map((file, index) => (
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
                          onClick={() => handleRemoveNewFile(index)}
                          disabled={isUploadingAttachments}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            </PermissionGuard>

              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  alignSelf: "stretch",
                  borderWidth: 1,
                  bgcolor: "divider",
                }}
              />

              {/* Existing Attachments */}
              {attachments.length > 0 ? (
                <Stack spacing={2} flex={1} minHeight={0}>
                  {/* Fixed header */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Existing Attachments ({attachments.length})
                  </Typography>

                  {/* Scrollable list */}
                  <Stack
                    spacing={1}
                    sx={{
                      flex: 1,
                      maxHeight: 300,
                      overflowY: "auto",
                      pr: 0.5, // prevents scrollbar overlay on content
                    }}
                  >
                    {attachments.map((attachment, index) => (
                      <Stack
                        key={`${attachment.filename}-${index}`}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          px: 1.5,
                          py: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          backgroundColor: "action.hover",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            cursor: "pointer",
                            color: "primary.main",
                            textDecoration: "underline",
                            "&:hover": { color: "primary.dark" },
                            mr: 1,
                          }}
                          noWrap
                          onClick={() => handlePreview(index)}
                        >
                          {attachment.filename}
                        </Typography>

                       <PermissionGuard permission={"manage_transactions"}>
                         <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleDeleteAttachment(attachment.filename)
                          }
                          disabled={isDeletingAttachment}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        </PermissionGuard>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    display: "flex",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <Typography color="text.secondary">
                    No attachments uploaded yet
                  </Typography>
                </Box>
              )}

              {/* Footer */}
              {/* <Stack
                direction="row"
                spacing={2}
                sx={{
                  mt: 3,
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  justifyContent: "flex-end",
                }}
              >
                {newFiles.length > 0 && (
                  <PrimaryButton
                    onClick={handleUploadNewFiles}
                    variant="contained"
                    disabled={isUploadingAttachments}
                  >
                    {isUploadingAttachments ? "Saving..." : "Save"}
                  </PrimaryButton>
                )}
              </Stack> */}
            </>
          </Stack>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Attachment"
          message="Are you sure you want to delete this attachment?"
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          confirmText="Yes, Delete"
          confirmColor="error"
        />
      </ModalElement>

      {/* Attachment Preview Modal */}
      {attachments.length > 0 && previewIndex !== null && (
        <AttachmentPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          attachments={attachments}
          currentIndex={previewIndex}
          showSnackBar={showSnackBar}
        />
      )}
    </>
  );
}

export default AttachmentsModal;
