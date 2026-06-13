import { Box } from "@mui/material";
import { useState, useEffect } from "react";

interface FilePreviewProps {
    file: File | null;
}

export function FilePreview({ file }: FilePreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

    if (!file || !previewUrl) return null;

    return (
        <Box sx={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {file.type.startsWith("image/") ? (
                <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
            ) : (
                <iframe
                    src={previewUrl}
                    title="Document Preview"
                    style={{ border: "none", flex: 1, width: "100%", height: "100%", display: "block" }}
                />
            )}
        </Box>
    );
}
