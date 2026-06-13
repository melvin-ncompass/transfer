import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useState, useRef } from "react";
import { CloudUpload as UploadIcon, Close, Download } from "@mui/icons-material";
import FilePresentIcon from "@mui/icons-material/FilePresent";

interface FileDropZoneProps {
  onFileUpload: (files: File) => void;
  existingFile?: File | null;
  onRemove?: () => void;
  onDownload?: any;
}

function FileDropZone({ onFileUpload, existingFile, onRemove, onDownload }: FileDropZoneProps) {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(existingFile ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local file in sync if existingFile is cleared externally (e.g. remove from parent)
  const displayFile = existingFile ?? file;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(
        droppedFile.type
      )
    ) {
      setFile(droppedFile);
      onFileUpload(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove?.();
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.();
  };

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !displayFile && fileInputRef.current?.click()}
      sx={{
        position: "relative",
        border: "2px dashed",
        borderRadius: 2,
        p: 5,
        textAlign: "center",
        cursor: displayFile ? "default" : "pointer",
        transition: "all 0.2s ease-in-out",
        borderColor: isDragging
          ? "primary.main"
          : displayFile
            ? "primary.main"
            : "divider",
        backgroundColor: isDragging
          ? theme.palette.mode === "light"
            ? "primary.lighter"
            : "rgba(25, 103, 210, 0.1)"
          : displayFile
            ? theme.palette.mode === "light"
              ? "primary.lighter"
              : "rgba(25, 103, 210, 0.08)"
            : "transparent",
        ...(!displayFile && !isDragging && {
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor:
              theme.palette.mode === "light"
                ? "primary.lighter"
                : "rgba(25, 103, 210, 0.05)",
          },
        }),
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".csv,.xlsx,.xls"
      />

      {displayFile ? (
        <Stack spacing={1.5} alignItems="center">
          <FilePresentIcon
            sx={{
              width: 48,
              height: 48,
              color: "primary.main",
            }}
          />
          <Box>
            <Typography
              variant="body1"
              sx={{
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              {displayFile.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                display: "block",
              }}
            >
              {(displayFile.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>

          {/* Remove button — lives inside the box, no clipping */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            onClick={handleRemove}
            sx={{
              cursor: "pointer",
              color: "error.main",
              bgcolor: "error.lighter",
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              mt: 0.5,
              "&:hover": { bgcolor: "error.light" },
              transition: "background-color 0.15s",
            }}
          >
            <Close sx={{ fontSize: 13 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "error.main" }}>
              Remove file
            </Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5} alignItems="center">
          <UploadIcon
            sx={{
              width: 48,
              height: 48,
              color: "text.secondary",
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Click to upload
              </Typography>
              {' or drag and drop'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                display: "block",
              }}
            >
              CSV, XLSX or XLS files
            </Typography>
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            onClick={handleDownload}
            sx={{
              cursor: "pointer",
              color: "info.main",
              bgcolor: "info.lighter",
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              mt: 0.5,
              "&:hover": { bgcolor: "info.light" },
              transition: "background-color 0.15s",
            }}
          >
            <Download sx={{ fontSize: 13 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "info.main" }}>
              Download Sample CSV
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

export default FileDropZone;