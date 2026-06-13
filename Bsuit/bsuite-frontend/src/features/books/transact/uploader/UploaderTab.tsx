import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { DropzoneArea } from "./components/DropzoneArea";
import { FilesTable } from "./components/FilesTable";
import { useAppSelector } from "../../../../store/store";
import BillModal from "../modals/BillModal";
import InvoiceModal from "../modals/InvoiceModal";

export interface UploadedFileItem {
    id: string;
    file: File;
    modifiedName: string;
    type: string;
    contact: string;
    processing?: boolean;
    processed?: boolean;
    result?: any;
    isNotDocument?: boolean;
    notDocumentReason?: string;
    hasBeenPreviewed?: boolean;
    hasBeenSavedInModal?: boolean;
}

interface UploaderTabProps {
    showSnackBar: (message: string, color: "success" | "error") => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export const UploaderTab = ({ showSnackBar }: UploaderTabProps) => {
    const [files, setFiles] = useState<UploadedFileItem[]>([]);

    const accessToken = useAppSelector((s: any) => s.auth.accessToken);
    const invoiceFormContactId = useAppSelector((s: any) => s.invoiceForm?.header?.contactId ?? null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewType, setPreviewType] = useState<string>("bill");
    const [previewData, setPreviewData] = useState<any | null>(null);

    // Sync contact changes made inside the preview modal back to the FilesTable row
    useEffect(() => {
        if (!previewFile || !invoiceFormContactId) return;
        setFiles((prev) =>
            prev.map((item) => {
                if (item.file !== previewFile) return item;
                const newContact = String(invoiceFormContactId);
                if (item.contact === newContact) return item;
                return {
                    ...item,
                    contact: newContact,
                    result: item.result ? { ...item.result, contactId: invoiceFormContactId } : item.result,
                };
            })
        );
    }, [invoiceFormContactId, previewFile]);

    const applyOcrResult = (ocr: any, isError = false) => {
        setFiles((prev) =>
            prev.map((item) => {
                if (item.id !== ocr.id) return item;
                // Handle backend "not a bill/invoice" signal for both valid and error events.
                if (ocr.result?.isNotDocument) {
                    return {
                        ...item,
                        processing: false,
                        processed: false,
                        isNotDocument: true,
                        notDocumentReason: ocr.result.reason ?? "Not a valid bill/invoice",
                    };
                }
                if (isError) {
                    return { ...item, processing: false, processed: false };
                }
                const docType = ocr.result?.documentType?.toLowerCase();
                const contactId = ocr.result?.contactId;
                return {
                    ...item,
                    processing: false,
                    processed: ocr.processed ?? true,
                    result: ocr.result ?? null,
                    isNotDocument: false,
                    notDocumentReason: undefined,
                    modifiedName: ocr.modifiedFilename ?? item.modifiedName,
                    type:
                        docType === "invoice"
                            ? "invoice"
                            : docType === "bill"
                                ? "bill"
                                : item.type,
                    contact: contactId != null ? String(contactId) : item.contact,
                };
            })
        );
    };

    const streamUpload = async (itemsToUpload: UploadedFileItem[], onAllFailed: () => void) => {
        const ids = new Set(itemsToUpload.map((f) => f.id));

        const formData = new FormData();
        itemsToUpload.forEach((f) => formData.append("files", f.file));
        formData.append("fileIds", JSON.stringify(itemsToUpload.map((f) => f.id)));

        try {
            const response = await fetch(`${API_BASE}transact/upload_bill_invoice`, {
                method: "POST",
                body: formData,
                credentials: "include",
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            });

            if (!response.ok || !response.body) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let currentEventType = "valid";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("event: ")) {
                        currentEventType = trimmed.slice(7).trim();
                    } else if (trimmed.startsWith("data: ")) {
                        try {
                            const parsed = JSON.parse(trimmed.slice(6));
                            if (currentEventType === "error") {
                                applyOcrResult(parsed, true);
                            } else if (currentEventType !== "done") {
                                applyOcrResult(parsed, false);
                            }
                        } catch {}
                        currentEventType = "valid";
                    }
                }
            }

            // Flush remaining buffer
            if (buffer.trim().startsWith("data: ")) {
                try {
                    const parsed = JSON.parse(buffer.trim().slice(6));
                    applyOcrResult(parsed, currentEventType === "error");
                } catch {}
            }

            // Mark any still-processing files as failed (stream ended early)
            setFiles((prev) =>
                prev.map((item) =>
                    ids.has(item.id) && item.processing
                        ? { ...item, processing: false, processed: false }
                        : item
                )
            );
        } catch (error: any) {
            onAllFailed();
            showSnackBar(error?.message || "OCR processing failed.", "error");
        }
    };

    const handleFilesAccepted = async (acceptedFiles: File[]) => {
        const totalFilesAfterAdd = files.length + acceptedFiles.length;
        let filesToAdd = acceptedFiles;

        if (totalFilesAfterAdd > 10) {
            const allowedCount = Math.max(0, 10 - files.length);
            filesToAdd = acceptedFiles.slice(0, allowedCount);
            showSnackBar(
                `You can only upload a maximum of 10 files total. Only ${allowedCount} more file(s) were added.`,
                "error"
            );
        }

        const newItems: UploadedFileItem[] = filesToAdd.map((file) => ({
            id: crypto.randomUUID(),
            file,
            modifiedName: file.name.replace(/\.[^/.]+$/, ""),
            type: "",
            contact: "",
            processing: true,
            processed: false,
        }));

        setFiles((prev) => [...prev, ...newItems]);

        const newItemIds = new Set(newItems.map((n) => n.id));
        await streamUpload(newItems, () => {
            setFiles((prev) =>
                prev.map((item) =>
                    newItemIds.has(item.id)
                        ? { ...item, processing: false, processed: false }
                        : item
                )
            );
        });
    };

    const handleUpdateFile = (id: string, updates: Partial<UploadedFileItem>) => {
        setFiles((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const merged = { ...item, ...updates };
                // Keep result.contactId in sync with the contact dropdown
                if (updates.contact !== undefined && merged.result) {
                    merged.result = {
                        ...merged.result,
                        contactId: updates.contact ? Number(updates.contact) : null,
                    };
                }
                return merged;
            })
        );
    };

    const handleDeleteFiles = (idsToDelete: string[]) => {
        setFiles((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
    };

    const handleRetryFile = async (id: string) => {
        const fileItem = files.find((f) => f.id === id);
        if (!fileItem) return;

        setFiles((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, processing: true, processed: false } : item
            )
        );

        await streamUpload([fileItem], () => {
            setFiles((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, processing: false, processed: false } : item
                )
            );
        });
    };

    const handleModalSuccess = (_meta?: any, action?: 'saveAndNext') => {
        if (!previewFile) return true;
        const currentIndex = files.findIndex(f => f.file === previewFile);
        if (currentIndex === -1) {
             setPreviewFile(null);
             return true;
        }
        
        const newFiles = files.filter((_, i) => i !== currentIndex);
        setFiles(newFiles);

        if (action === "saveAndNext") {
            const nextFile = newFiles.find(f => f.processed && f.result && !f.isNotDocument);
            
            if (nextFile) {
                setPreviewFile(nextFile.file);
                setPreviewType(nextFile.type);
                setPreviewData(nextFile.result || null);
                return false;
            }
        }
        
        setPreviewFile(null);
        return true;
    };

    const handlePreviewFile = (id: string) => {
        const fileItem = files.find((f) => f.id === id);
        if (fileItem) {
            setPreviewFile(fileItem.file);
            setPreviewType(fileItem.type);
            setPreviewData(fileItem.result || null);
        }
    };

    return (
        <Box sx={{ p: 3, pt: 4, bgcolor: "background.default", flex: 1, minHeight: "100%" }}>
            <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, boxShadow: 1 }}>
                <DropzoneArea onFilesAccepted={handleFilesAccepted} maxFiles={10} showSnackBar={showSnackBar} />
            </Box>

            {files.length > 0 && (
                <Box sx={{ mt: 3, bgcolor: "background.paper", p: 2, borderRadius: 2, boxShadow: 1 }}>
                    <FilesTable
                        files={files}
                        onUpdateFile={handleUpdateFile}
                        onDeleteFiles={handleDeleteFiles}
                        onPreviewFile={handlePreviewFile}
                        onRetryFile={handleRetryFile}
                    />
                </Box>
            )}

            {previewType === "bill" && (
                <BillModal
                    open={!!previewFile}
                    mode="Make"
                    onClose={() => setPreviewFile(null)}
                    showSnackBar={showSnackBar}
                    previewFile={previewFile}
                    extractedData={previewData}
                    onSuccess={handleModalSuccess}
                />
            )}

            {previewType === "invoice" && (
                <InvoiceModal
                    open={!!previewFile}
                    mode="Make"
                    onClose={() => setPreviewFile(null)}
                    showSnackBar={showSnackBar}
                    previewFile={previewFile}
                    extractedData={previewData}
                    onSuccess={handleModalSuccess}
                />
            )}
        </Box>
    );
};
