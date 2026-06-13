import {
    Checkbox,
    Box,
    Typography,
    CircularProgress,
    IconButton,
    Stack,
    Chip,
} from "@mui/material";
import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../components/atom/button/PrimaryButton";
import { SecondaryButton } from "../../../../../components/atom/button/SecondaryButton";
import { useRegisterContactMutation } from "../../../../../features/books/coa/contact/api/contact.api";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import AddContactForm from "../../../../../features/books/coa/contact/dialog/ContactForm";
import type { UploadedFileItem } from "../UploaderTab";
import { StandardTable } from "../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../types/types";
import { useAllAccountOptions } from "../../transactHome/hooks/useAllAccountOptions";

interface FilesTableProps {
    files: UploadedFileItem[];
    onUpdateFile: (id: string, updates: Partial<UploadedFileItem>) => void;
    onDeleteFiles: (ids: string[]) => void;
    onPreviewFile: (id: string) => void;
    onRetryFile: (id: string) => void;
}

const TYPE_OPTIONS = [
    { label: "Bill", value: "bill" },
    { label: "Invoice", value: "invoice" },
];

export function FilesTable({ files, onUpdateFile, onDeleteFiles, onPreviewFile, onRetryFile }: FilesTableProps) {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [addContactRowId, setAddContactRowId] = useState<string | null>(null);
    const { contactsData } = useAllAccountOptions();
    const [registerContact] = useRegisterContactMutation();
    const contactOptions = React.useMemo(
        () =>
            (contactsData?.data ?? []).map((c: any) => ({
                label: c.name,
                value: String(c.id),
            })),
        [contactsData]
    );

    const handleAddContact = async (data: any) => {
        const res = await registerContact(data).unwrap();
        const newId = String((res as any).data?.id ?? (res as any).data?.contact?.id ?? "");
        if (newId && addContactRowId) {
            onUpdateFile(addContactRowId, { contact: newId });
        }
        setAddContactRowId(null);
    };

    if (files.length === 0) return null;

    const readyFiles = files.filter((f) => !f.processing);
    const isAllSelected = readyFiles.length > 0 && selectedIds.size === readyFiles.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < readyFiles.length;

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedIds(new Set(readyFiles.map((f) => f.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        onDeleteFiles(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    return (
        <Box>
        <StandardTable
            columns={[
                {
                    id: "select",
                    label: "",
                    width: 56,
                    headerAlign: "center",
                    align: "center",
                    headerRender: () => (
                        <Checkbox
                            size="small"
                            checked={isAllSelected}
                            indeterminate={isIndeterminate}
                            onChange={handleSelectAll}
                        />
                    ),
                    render: (file: UploadedFileItem) => (
                        <Checkbox
                            size="small"
                            checked={selectedIds.has(file.id)}
                            disabled={!!file.processing}
                            onChange={() => handleSelectRow(file.id)}
                        />
                    ),
                },
                {
                    id: "actualFileName",
                    label: "Actual file name",
                    width: 200,
                    render: (file: UploadedFileItem) => (
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {file.file.name || file.modifiedName}
                        </Typography>
                    ),
                },
                {
                    id: "modifiedFileName",
                    label: "Modified filename",
                    width: 250,
                    render: (file: UploadedFileItem) => {
                        const isProcessing = !!file.processing;
                        const isNotDocument = !!file.isNotDocument;
                        return isProcessing ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircularProgress size={14} />
                                <Typography variant="body2" color="text.secondary">Processing...</Typography>
                            </Box>
                        ) : isNotDocument ? (
                            <Typography variant="body2" color="text.disabled"> </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {file.modifiedName}
                            </Typography>
                        );
                    },
                },
                {
                    id: "type",
                    label: "Type",
                    width: 140,
                    render: (file: UploadedFileItem) => {
                        const isProcessing = !!file.processing;
                        const isNotDocument = !!file.isNotDocument;
                        return isNotDocument ? (
                            <Typography variant="body2" color="text.disabled"> </Typography>
                        ) : (
                            <SingleSelectElement
                                label=""
                                value={file.type}
                                onChange={(val: string) => onUpdateFile(file.id, { type: val })}
                                options={TYPE_OPTIONS}
                                fullWidth
                                disabled={isProcessing}
                            />
                        );
                    },
                },
                {
                    id: "contact",
                    label: "Contact",
                    width: 140,
                    render: (file: UploadedFileItem) => {
                        const isProcessing = !!file.processing;
                        const isNotDocument = !!file.isNotDocument;
                        return isNotDocument ? (
                            <Typography variant="body2" color="text.disabled"> </Typography>
                        ) : (
                            <Stack direction="row" alignItems="center">
                                <SingleSelectElement
                                    label=""
                                    value={file.contact}
                                    onChange={(val: string) => onUpdateFile(file.id, { contact: val })}
                                    options={contactOptions}
                                    fullWidth
                                    disabled={isProcessing}
                                />
                                {!isProcessing && (
                                    <IconButton size="small" onClick={() => setAddContactRowId(file.id)}>
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>
                        );
                    },
                },
                {
                    id: "action",
                    label: "Action",
                    width: 220,
                    headerRender: () =>
                        selectedIds.size > 0 ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <SecondaryButton
                                    variant="contained"
                                    color="error"
                                    onClick={handleBulkDelete}
                                    sx={{ py: 0.5, px: 1, minWidth: "auto", fontSize: "0.75rem", bgcolor: "error.main", color: "error.contrastText", "&:hover": { bgcolor: "error.dark" } }}
                                >
                                    Delete ({selectedIds.size})
                                </SecondaryButton>
                            </Box>
                        ) : (
                            "Action"
                        ),
                    render: (file: UploadedFileItem) => {
                        const isProcessing = !!file.processing;
                        const isNotDocument = !!file.isNotDocument;
                        return isNotDocument ? (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <PrimaryButton
                                    variant="text"
                                    sx={{ color: "text.secondary", minWidth: "auto", px: 1, textTransform: "none" }}
                                    onClick={() => onRetryFile(file.id)}
                                >
                                    Retry
                                </PrimaryButton>
                                <SecondaryButton
                                    variant="text"
                                    sx={{ minWidth: "auto", px: 1, textTransform: "none", color: "error.main", "&:hover": { bgcolor: "error.light", color: "error.dark" }, bgcolor: "transparent" }}
                                    onClick={() => onDeleteFiles([file.id])}
                                >
                                    Delete
                                </SecondaryButton>
                                <Chip
                                    icon={<InfoOutlinedIcon fontSize="small" />}
                                    label={file.notDocumentReason ?? "Not a valid bill/invoice"}
                                    color="info"
                                    variant="outlined"
                                    size="small"
                                    sx={{ maxWidth: 230, fontSize: "0.72rem" }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                {!isProcessing && (
                                    <SecondaryButton
                                        variant="text"
                                        sx={{ minWidth: "auto", px: 1, textTransform: "none", color: "error.main", "&:hover": { bgcolor: "error.light", color: "error.dark" }, bgcolor: "transparent" }}
                                        onClick={() => onDeleteFiles([file.id])}
                                    >
                                        Delete
                                    </SecondaryButton>
                                )}
                                {!isProcessing && (
                                    <PrimaryButton
                                        variant="text"
                                        sx={{ color: "text.secondary", minWidth: "auto", px: 1, textTransform: "none" }}
                                        onClick={() => onRetryFile(file.id)}
                                    >
                                        Retry
                                    </PrimaryButton>
                                )}
                                {!isProcessing && file.processed && (
                                    <PrimaryButton
                                        variant="contained"
                                        sx={{ minWidth: "auto", px: 2, height: 32, fontSize: "0.75rem", borderRadius: 4 }}
                                        onClick={() => onPreviewFile(file.id)}
                                    >
                                        Preview
                                    </PrimaryButton>
                                )}
                            </Box>
                        );
                    },
                },
            ] as StandardTableColumn[]}
            rows={files}
            emptyMessage="No files"
            isRowSelected={(file: UploadedFileItem) => selectedIds.has(file.id)}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0 }}
        />

            <ModalElement
                open={!!addContactRowId}
                onClose={() => setAddContactRowId(null)}
                title="Add Contact"
                maxWidth="md"
            >
                <AddContactForm onSubmit={handleAddContact} />
            </ModalElement>
        </Box>
    );
}
