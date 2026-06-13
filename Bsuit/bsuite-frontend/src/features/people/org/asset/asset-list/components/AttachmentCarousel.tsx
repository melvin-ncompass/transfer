import { IconButton, Typography } from "@mui/material";
import { Box, Stack, type SxProps } from "@mui/system";
import { useEffect, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import type { Theme } from "@emotion/react";

export function AttachmentCarousel({
    attachments,
    sx,
}: {
    attachments: File[];
    sx?: SxProps<Theme>;
}) {
    const [index, setIndex] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const current = attachments[index] ?? null;
    const isImage = current?.type.startsWith("image/") ?? false;
    const isPdf = current?.type === "application/pdf";

useEffect(() => {
    if ((!isImage && !isPdf) || !current) {
        setPreviewUrl(null);
        return;
    }

    const url = URL.createObjectURL(current);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
}, [current, isImage, isPdf]);

    useEffect(() => {
        if (attachments.length === 0) { setIndex(0); return; }
        setIndex((i) => Math.min(i, attachments.length - 1));
    }, [attachments.length]);

    const containerSx: SxProps<Theme> = {
        position: "relative",
        width: "100%",
        height: 180,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        bgcolor: "action.hover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx,
    };

    // Always render the container so the parent layout doesn't collapse.
    if (!current) {
        return (
            <Box sx={containerSx}>
                <Typography variant="caption" color="text.disabled">
                    Upload File to Preview
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={containerSx}>
        {isImage && previewUrl ? (
            <Box
                component="img"
                src={previewUrl}
                alt={current.name}
                sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
            />
        ) : isPdf && previewUrl ? (
            <Box
                component="iframe"
                src={previewUrl}
                sx={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                }}
            />
        ) : (
            <Stack alignItems="center" spacing={1}>
                <InsertDriveFileIcon sx={{ fontSize: 48 }} color="action" />
                <Typography variant="caption" color="text.secondary">
                    {current.name}
                </Typography>
            </Stack>
        )}

            {attachments.length > 1 && (
                <>
                    <IconButton
                        size="small"
                        onClick={() => setIndex((i) => (i - 1 + attachments.length) % attachments.length)}
                        sx={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", bgcolor: "background.paper", "&:hover": { bgcolor: "background.paper" } }}
                    >
                        <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => setIndex((i) => (i + 1) % attachments.length)}
                        sx={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", bgcolor: "background.paper", "&:hover": { bgcolor: "background.paper" } }}
                    >
                        <ChevronRightIcon fontSize="small" />
                    </IconButton>

                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)" }}
                    >
                        {attachments.map((_: any, i: number) => (
                            <Box
                                key={i}
                                onClick={() => setIndex(i)}
                                sx={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    bgcolor: i === index ? "primary.main" : "action.disabled",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s",
                                }}
                            />
                        ))}
                    </Stack>

                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            position: "absolute", top: 8, left: 8,
                            maxWidth: "55%",
                            bgcolor: "rgba(0,0,0,0.45)", color: "#fff",
                            px: 0.75, py: 0.25, borderRadius: 0.5,
                        }}
                    >
                        {current.name}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{
                            position: "absolute", top: 8, right: 8,
                            bgcolor: "rgba(0,0,0,0.45)", color: "#fff",
                            px: 0.75, py: 0.25, borderRadius: 0.5,
                        }}
                    >
                        {index + 1} / {attachments.length}
                    </Typography>
                </>
            )}
        </Box>
    );
}