import { Box, CircularProgress, Typography } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { useEffect, useState, useCallback } from "react";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { AttachmentCarousel } from "./AttachmentCarousel";
import { useLazyViewAssetAttachmentsQuery } from "../api/assetList.api";
import type { AssetType } from "../../asset-category/api/assetCategory.api";
interface Attachment {
    /** Storage path forwarded to the API */
    path: string;
    /** Display name shown in the carousel */
    fileName: string;
}

interface AssetAttachmentsModalProps {
    open: boolean;
    onClose: () => void;
    
    asset: any | null;
    activeType: AssetType | null | undefined;
}

export function AssetAttachmentsModal({
    open,
    onClose,
    asset,
    activeType,
}: AssetAttachmentsModalProps) {
    const [fetchAttachment] = useLazyViewAssetAttachmentsQuery();

    /**
     * A map from attachment path → resolved File.
     * Attachments that haven't been fetched yet are absent from the map;
     * the carousel will show a generic file icon for those.
     */
    const [filesMap, setFilesMap] = useState<Record<string, File>>({});
    const [fetchingPath, setFetchingPath] = useState<string | null>(null);

    const attachments: Attachment[] = (asset?.attachments ?? []).map((a: any) => ({
        path: a.path ?? "",
        fileName: a.filename ?? "",
    }));

    useEffect(() => {
        if (open) setFilesMap({});
    }, [open, asset]);

    // ── Fetch a single attachment blob and cache it as a File ─────────────────
    const fetchIfNeeded = useCallback(
        async (att: Attachment) => {
            if (!activeType?.id || !asset || filesMap[att.path] || fetchingPath === att.path) return;

            const listId = asset.id ?? asset.assetId;
            if (!listId) return;

            try {
                setFetchingPath(att.path);
                const blob = await fetchAttachment({
                    typeId: activeType.id,
                    listId,
                    path: att.path,
                }).unwrap();

                const file = new File([blob], att.fileName, { type: blob.type });
                setFilesMap((prev) => ({ ...prev, [att.path]: file }));
            } finally {
                setFetchingPath(null);
            }
        },
        [activeType?.id, asset, fetchAttachment, filesMap, fetchingPath]
    );

    // ── Fetch the first attachment as soon as the modal opens 
    useEffect(() => {
        if (open && attachments.length > 0) {
            fetchIfNeeded(attachments[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    /**
     * Build the File[] that AttachmentCarousel expects.
     *
     * - Fetched attachments  → real File with content + correct MIME type
     * - Unfetched attachments → empty File (no content, no type)
     *   The carousel's `isImage` check is `type.startsWith("image/")`, which
     *   returns false for an empty-type File, so the generic icon is shown
     *   until the real file arrives — a natural loading state with zero extra UI.
     */
    const files: File[] = attachments.map(
        (att) => filesMap[att.path] ?? new File([], att.fileName)
    );

    // ── Handle slide changes coming from the carousel ─────────────────────────
    // AttachmentCarousel doesn't expose an onIndexChange prop, so we
    // pre-fetch all attachments sequentially after the first one loads.
    useEffect(() => {
        if (!open) return;
        attachments.forEach((att) => fetchIfNeeded(att));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, filesMap]);

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title={`Attachments — ${asset?.assetName ?? ""}`}
            maxWidth="md"
            sx={{ height: 500 }}
        >
            {attachments.length === 0 ? (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 6,
                        gap: 1,
                    }}
                >
                    <InsertDriveFileOutlinedIcon
                        sx={{ fontSize: 56, color: "text.disabled" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        No attachments for this asset.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ position: "relative" }}>
                    <AttachmentCarousel attachments={files} sx={{ height: 350 }} />

                    {/* Subtle spinner overlay while first fetch is in-flight */}
                    {fetchingPath && files.every((f) => f.size === 0) && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "rgba(255,255,255,0.55)",
                                borderRadius: 1,
                                pointerEvents: "none",
                            }}
                        >
                            <CircularProgress size={32} />
                        </Box>
                    )}
                </Box>
            )}
        </ModalElement>
    );
}