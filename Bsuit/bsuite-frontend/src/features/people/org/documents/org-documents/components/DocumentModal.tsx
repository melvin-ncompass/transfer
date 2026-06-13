import { Box, Stack } from "@mui/system";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { useState, useEffect } from "react";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import type { DocumentAttachment } from "../api/organization.api";
import { useGetOrganizationDocumentByIdQuery } from "../api/organization.api";

export const DocumentModal = ({
    open,
    onClose,
    isEdit,
    documentId,
    onSave,
}: {
    open: boolean,
    onClose: () => void,
    isEdit: boolean,
    documentId?: number | null;
    onSave: (data: FormData) => Promise<void>;
}) => {
    const [documentName, setDocumentName] = useState<string>("");
    const [documentDescription, setDocumentDescription] = useState<string>("");
    const [allowDownload, setAllowDownload] = useState<boolean>(false);
    const [acknowledgementRequired, setAcknowledgementRequired] = useState<boolean>(false);
    const [blockPortalAccess, setBlockPortalAccess] = useState<boolean>(false);
    const [attachment, setAttachment] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<DocumentAttachment[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const { data: documentData } = useGetOrganizationDocumentByIdQuery(documentId ?? 0, { skip: !isEdit || !open || !documentId });

    useEffect(() => {
        if (open && isEdit && documentData) {
            setDocumentName(documentData.name);
            setDocumentDescription(documentData.description);
            setAllowDownload(documentData.downloadAccess);
            setAcknowledgementRequired(documentData.acknowledgementRequired);
            setBlockPortalAccess(documentData.blockPortal);
            setExistingAttachments(documentData.attachments ?? []);
            setAttachment([]);
        } else if (open && !isEdit) {
            clearForm();
        }
    }, [open, isEdit, documentData]);

    const clearForm = () => {
        setDocumentName("");
        setDocumentDescription("");
        setAllowDownload(false);
        setAcknowledgementRequired(false);
        setBlockPortalAccess(false);
        setAttachment([]);
        setExistingAttachments([]);
        setIsSaving(false);
    };

    const handleSave = async () => {
        const formData = new FormData();

        formData.append("name", documentName.trim());
        formData.append("description", documentDescription.trim());
        formData.append("downloadAccess", String(allowDownload));
        formData.append("acknowledgementRequired", String(acknowledgementRequired));
        formData.append("blockPortal", String(blockPortalAccess));

        // New file uploads
        attachment.forEach((file) => {
            formData.append("files", file);
        });

        // Existing attachments to keep (edit mode)
        if (isEdit) {
            formData.append("attachmentNames", JSON.stringify(existingAttachments.map((a) => a.filename)));
        }

        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
        // onClose();
        // clearForm();
    };

    const handleUploadAttachment = (file: File | File[] | null) => {
        if (!file) return;
        const newFiles = Array.isArray(file) ? file : [file];
        setAttachment(newFiles);
    };

    const handleRemoveFile = (index: number) => {
        setAttachment((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingFile = (index: number) => {
        setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const hasChanges = () => {
        return documentName !== documentData?.name ||
            documentDescription !== documentData?.description ||
            allowDownload !== documentData?.downloadAccess ||
            acknowledgementRequired !== documentData?.acknowledgementRequired ||
            blockPortalAccess !== documentData?.blockPortal ||
            attachment.length > 0 ||
            existingAttachments.length !== (documentData?.attachments?.length ?? 0);
    };

    const isValid = documentName.trim() !== "" &&
        documentDescription.trim() !== "" &&
        (attachment.length > 0 || existingAttachments.length > 0);

    return (
        <ModalElement
            maxWidth="md"
            open={open}

            title={isEdit ? "Edit Document" : "Add Document"}
            onClose={() => {
                onClose();
                clearForm();
            }}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 800 }, margin: 2 },
            }}
        >
            <Box sx={{ p: 1, height: "100%" }} key={documentId || "create"}>
                <Stack spacing={2} gap={1.5} direction="column" height="100%">
                    <TextFieldElement
                        fullWidth
                        label="Name of Document"
                        placeholder="Enter name of document"
                        value={documentName}
                        required

                        inputProps={{ maxLength: 255 }}
                        onChange={(e) => setDocumentName(e.target.value)}
                    />
                    <TextFieldElement
                        fullWidth
                        label="Document Description"
                        placeholder="Enter document description"
                        value={documentDescription}
                        onChange={(e) => setDocumentDescription(e.target.value)}
                        multiline
                        inputProps={{ maxLength: 255 }}
                        rows={2}
                        required
                    />
                    <Stack direction="column" gap={1.5} width="100%">
                        <Checkbox
                            label="Allow employees to download the document"
                            checked={allowDownload}
                            onChange={(e) => setAllowDownload(e.target.checked)}
                        />
                        <Checkbox
                            label="Acknowledgement required from employees"
                            checked={acknowledgementRequired}
                            onChange={(e) => setAcknowledgementRequired(e.target.checked)}
                        />
                        <Box sx={{ minHeight: 40, ml: 2 }}>
                            {acknowledgementRequired && (
                                <Checkbox
                                    label="Block portal access to collect acknowledgement"
                                    checked={blockPortalAccess}
                                    onChange={(e) => setBlockPortalAccess(e.target.checked)}
                                />
                            )}
                        </Box>

                        <FileUploadField
                            label="Attach Documents"
                            value={attachment}
                            onChange={handleUploadAttachment}
                            required
                            accept={[
                                "application/pdf",
                                "image/*",
                            ]}
                            multiple
                            maxSize={10}
                            sx={{ ml: 1 }}
                        />

                        {/* Existing attachments — shown in edit mode */}
                        {existingAttachments.length > 0 && (
                            <Stack spacing={1}>
                                <Typography variant="caption" color="text.secondary">
                                    Existing Attachments
                                </Typography>
                                {existingAttachments.map((att, index) => (
                                    <Stack
                                        key={`${att.filename}-${index}`}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            px: 1.5,
                                            py: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            width: '400px'
                                        }}
                                    >
                                        <Typography variant="body2">{att.filename}</Typography>
                                        <PrimaryIconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveExistingFile(index)}
                                            icon={<DeleteIcon fontSize="small" />}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        )}

                        {/* Newly added files */}
                        {attachment.length > 0 && (
                            <Stack spacing={1}>
                                <Typography variant="caption" color="text.secondary">
                                    New Attachments
                                </Typography>
                                {attachment.map((file, index) => (
                                    <Stack
                                        key={`${file.name}-${index}`}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            px: 1.5,
                                            py: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            width: '400px'
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {file.name}
                                            {` (${(file.size / 1024).toFixed(2)} KB)`}
                                        </Typography>
                                        <PrimaryIconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveFile(index)}
                                            icon={<DeleteIcon fontSize="small" />}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </Box>

            {/* <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}> */}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <PrimaryButton onClick={handleSave} disabled={!isValid || !hasChanges() || isSaving}>
                    Save
                </PrimaryButton>
            </Box>
            {/* </Box> */}
        </ModalElement>
    );
};