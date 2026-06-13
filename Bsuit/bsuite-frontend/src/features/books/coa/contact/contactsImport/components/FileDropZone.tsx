import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useState, useRef } from "react";
import { CloudUpload as UploadIcon } from "@mui/icons-material";
import FilePresentIcon from "@mui/icons-material/FilePresent";

interface FileDropZoneProps {
  onFileUpload: (files: File) => void;
}

function FileDropZone({ onFileUpload }: FileDropZoneProps) {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (droppedFile.type === "text/csv") {
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

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        position: "relative",
        border: "2px dashed",
        borderRadius: 2,
        p: 6,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        borderColor: isDragging
          ? "primary.main"
          : file
          ? "primary.main"
          : "divider",
        backgroundColor: isDragging
          ? theme.palette.mode === "light"
            ? "primary.lighter"
            : "rgba(25, 103, 210, 0.1)"
          : file
          ? theme.palette.mode === "light"
            ? "primary.lighter"
            : "rgba(25, 103, 210, 0.08)"
          : "transparent",

        // Conditional spread — no more 'false' type
        ...(!file && !isDragging && {
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
        accept=".csv"
      />

      {file ? (
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
              {file.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                display: "block",
              }}
            >
              {(file.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
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
              {" or drag and drop"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                display: "block",
              }}
            >
              CSV files
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default FileDropZone;
