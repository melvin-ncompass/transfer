import { Stack, Typography, Button, Box, Tooltip } from "@mui/material";
import { Chip } from "../../../components/atom/chips";
import { useState } from "react";
import type { FileUploadField } from "../../../types/types";

export function FileUploadField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  accept = "*",
  maxSize,
  maxFiles,
  sx,
  multiple = false,
}: FileUploadField) {
  const [error, setError] = useState<string | null>(null);

  // Normalize accept prop
  const normalizedAccept = Array.isArray(accept) ? accept.join(",") : accept;

  const effectiveMultiple = maxFiles !== undefined ? maxFiles > 1 : multiple;

  const currentCount = Array.isArray(value) ? value.length : value ? 1 : 0;

  const isMaxReached = maxFiles !== undefined && currentCount >= maxFiles;

  // Create a readable string for allowed types
  const allowedTypesText = (() => {
    if (accept === "*" || !accept) return "Any file type allowed";
    const types = Array.isArray(accept) ? accept : accept.split(",");
    return types.map((t) => {
      if (t === "application/pdf") return "pdf";
      if (t === "application/msword") return "doc";
      if (t.includes("wordprocessingml")) return "docx";
      if (t === "image/*") return "images";
      return t.replace("image/", "");
    }).join(", ");
  })();

  // Allowed info summary text
  const allowedInfo = [
    maxFiles !== undefined ? `Max files: ${maxFiles}` : null,
    maxSize !== undefined ? `Max size: ${maxSize} MB` : null,
    allowedTypesText !== "Any file type allowed"
      ? `Allowed types: ${allowedTypesText}`
      : allowedTypesText,
  ]
    .filter(Boolean)
    .join(" | ");

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      onChange(multiple ? [] : null);
      setError(null);
      return;
    }

    const fileArray = Array.from(files);

    // Reset error before validation
    setError(null);

    // Validation order: max files > max size > file type, show first error only

    // 1. Max files
    if (maxFiles !== undefined) {
      const totalCount = effectiveMultiple
        ? currentCount + fileArray.length
        : fileArray.length;
      if (totalCount > maxFiles) {
        setError(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`);
        e.target.value = "";
        return;
      }
    }

    // 2. Max size
    if (maxSize !== undefined) {
      const oversized = fileArray.find((f) => f.size > maxSize * 1024 * 1024);
      if (oversized) {
        setError(`Each file must be less than ${maxSize} MB`);
        e.target.value = "";
        return;
      }
    }

    // 3. File type
    if (accept && accept !== "*") {
      const allowedTypes = Array.isArray(accept) ? accept : accept.split(",");

      const isValidType = (fileType: string) => {
        return allowedTypes.some((type) => {
          if (type.endsWith("/*")) {
            // handle wildcard like image/*
            return fileType.startsWith(type.replace("/*", ""));
          }
          return fileType === type;
        });
      };

      const invalid = fileArray.find((f) => !isValidType(f.type));

      if (invalid) {
        setError(`Invalid file type selected`);
        e.target.value = "";
        return;
      }
    }

    // All good
    if (effectiveMultiple) {
      const existingFiles = Array.isArray(value) ? value : value ? [value] : [];
      const combinedFiles = [...existingFiles, ...fileArray];
      const finalFiles = maxFiles
        ? combinedFiles.slice(0, maxFiles)
        : combinedFiles;
      onChange(finalFiles);
    } else {
      onChange(fileArray[0]);
    }

    e.target.value = "";
  };

  return (
    <Stack
      spacing={1}
      direction={{ xs: "column", md: "row" }}
      alignItems={{ xs: "flex-start", md: "center" }}
      sx={{ ...sx }}
    >
      {/* Label */}
      {label && (
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ minWidth: { xs: "auto", md: 100 } }}
        >
          {required ? `${label} *` : label}
        </Typography>
      )}

      {/* Upload button + count badge + allowed info */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="outlined"
          component="label"
          disabled={
            disabled || (maxFiles !== undefined && currentCount >= maxFiles)
          }
          sx={{ textTransform: "none", position: "relative" }}
        >
          {effectiveMultiple
            ? "Select Files"
            : value
              ? "Change File"
              : "Select a File"}

          <input
            type="file"
            hidden
            multiple={effectiveMultiple}
            accept={normalizedAccept}
            onChange={handleSelect}
          />

          {currentCount > 0 && (
            <Box
              component="span"
              sx={{
                ml: 1,
                minWidth: 20,
                height: 20,
                bgcolor:
                  maxFiles !== undefined && currentCount >= maxFiles
                    ? "error.main"
                    : "primary.main",
                color: "white",
                fontWeight: "bold",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                userSelect: "none",
              }}
              aria-label={`${currentCount} files uploaded`}
            >
              {currentCount}
            </Box>
          )}
        </Button>

        {/* Allowed info tooltip */}
        <Tooltip title={allowedInfo} placement="right" arrow>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ userSelect: "none", cursor: "help" }}
          >
            ℹ️
          </Typography>
        </Tooltip>
      </Stack>

      {/* Error message, show only one at a time */}
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ ml: { md: 2 }, mt: { xs: 0.5, md: 0 } }}
        >
          {error}
        </Typography>
      )}

      {/* File Preview (only single file preview) */}
      {value && !Array.isArray(value) && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {value.name} {value.size && `(${(value.size / 1024).toFixed(2)} KB)`}
        </Typography>
      )}
    </Stack>
  );
}
