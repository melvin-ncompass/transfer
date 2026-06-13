import { Box, Typography } from "@mui/material";
import { useRef, useState } from "react";

interface DropzoneAreaProps {
    onFilesAccepted: (files: File[]) => void;
    maxFiles?: number;
    showSnackBar: (message: string, color: "success" | "error") => void;
}

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
];

export function DropzoneArea({ onFilesAccepted, maxFiles = 10, showSnackBar }: DropzoneAreaProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragActive) {
            setIsDragActive(true);
        }
    };

    const processFiles = (files: FileList | File[]) => {
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        const validFiles: File[] = [];
        let rejectedFormatCount = 0;
        let rejectedSizeCount = 0;

        Array.from(files).forEach((file) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                rejectedFormatCount++;
            } else if (file.size > MAX_FILE_SIZE) {
                rejectedSizeCount++;
            } else {
                validFiles.push(file);
            }
        });

        if (rejectedFormatCount > 0) {
            showSnackBar(`Rejected ${rejectedFormatCount} file(s) due to unsupported format.`, "error");
        }
        if (rejectedSizeCount > 0) {
            showSnackBar(`Rejected ${rejectedSizeCount} file(s) for exceeding the 10MB size limit.`, "error");
        }

        if (validFiles.length > maxFiles) {
            showSnackBar(`You can only upload a maximum of ${maxFiles} files at once. The first ${maxFiles} valid files were added.`, "error");
            onFilesAccepted(validFiles.slice(0, maxFiles));
        } else if (validFiles.length > 0) {
            onFilesAccepted(validFiles);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        // reset so the same files can be chosen again if needed
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <Box
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "divider",
                borderRadius: 2,
                bgcolor: isDragActive ? "action.hover" : "background.paper",
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                mb: 3,
                maxWidth: 1000,
                mx: "auto",
            }}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".jpeg,.jpg,.png,.webp,.pdf"
                onChange={handleChange}
                style={{ display: "none" }}
            />
            <Typography variant="body1" color="text.secondary">
                Drop PDF or images here (Max 10MB), or click to browse
            </Typography>
        </Box>
    );
}
