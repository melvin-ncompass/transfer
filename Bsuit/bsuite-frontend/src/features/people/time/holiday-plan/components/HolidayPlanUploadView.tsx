import { useCallback, useRef, useState } from "react";
import {
    Box,
    Typography,
    Chip,
    CircularProgress,
    Divider,
    Alert,
    AlertTitle,
    Card,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import { Stack } from "@mui/system";
import {
    CloudUpload,
    Download,
    InsertDriveFile,
    Close,
    CheckCircleOutline,
    ErrorOutline,
} from "@mui/icons-material";

import {
    useLazyDownloadHolidayPlanTemplateQuery,
    useUploadHolidayPlanMutation,
    type IHolidayPlanUploadItem,
    type IHolidayPlanValidateError,
} from "../api/holidayPlan.api";
import { PrimaryButton, PrimaryIconButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";

// ----------
// Types
// ----------
interface UploadState {
    status: "idle" | "validating" | "success" | "error";
    errors?: IHolidayPlanValidateError[];
    genericMessage?: string;
    parsedData?: IHolidayPlanUploadItem[];
}

interface Props {
    onValidated?: (data: IHolidayPlanUploadItem[]) => void;
}

// ----------
// Helpers
// ----------
const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const HolidayPlanUploadView = ({ onValidated }: Props) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const showSnack = (message: string, color: "success" | "error") => {
        setSnackbar({ open: true, message, color });
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [triggerDownload] = useLazyDownloadHolidayPlanTemplateQuery();
    const [uploadHolidayPlan] = useUploadHolidayPlanMutation();

    const hasResponse = uploadState.status !== "idle";
    const isValidating = uploadState.status === "validating";
    const isSuccess = uploadState.status === "success";
    const hasRowErrors =
        uploadState.status === "error" &&
        uploadState.errors &&
        uploadState.errors.length > 0;
    const hasGenericError =
        uploadState.status === "error" && !!uploadState.genericMessage && !hasRowErrors;

    const handleFileSelect = (selected: File | null) => {
        if (!selected) return;

        if (!selected.name.match(/\.(xlsx|xls)$/i)) {
            setUploadState({
                status: "error",
                genericMessage: "Only Excel (.xlsx, .xls) files are supported.",
            });
            showSnack("Only Excel files are allowed", "error");
            return;
        }

        setFile(selected);
        setUploadState({ status: "idle" });
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files?.[0] ?? null);
    }, []);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleBrowseClick = () => fileInputRef.current?.click();

    const handleRemoveFile = () => {
        setFile(null);
        setUploadState({ status: "idle" });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownloadSample = async () => {
        try {
            const result = await triggerDownload().unwrap();
            downloadBlob(result, "holiday_plan_template.xlsx");
            showSnack("Template downloaded successfully", "success");
        } catch {
            showSnack("Failed to download template", "error");
        }
    };

    const handleValidate = useCallback(async () => {
        if (!file) return;

        setUploadState({ status: "validating" });

        try {
            const formData = new FormData();
            formData.append("file", file);

            const data = await uploadHolidayPlan(formData).unwrap();

            setUploadState({
                status: "success",
                parsedData: data,
            });

            showSnack("File uploaded successfully", "success");
            onValidated?.(data);

        } catch (err: any) {
            const response = err?.data;

            setUploadState({
                status: "error",
                genericMessage: "Upload failed",
            });

            const missingHeaders = response?.missingHeaders || [];
            const extraHeaders = response?.extraHeaders || [];

            let snackMessage =
                response?.message || err?.message || "Upload failed";

            if (missingHeaders.length) {
                snackMessage = `Missing headers: ${missingHeaders.join(", ")}`;
            } else if (extraHeaders.length) {
                snackMessage = `Unexpected headers: ${extraHeaders.join(", ")}`;
            }

            showSnack(snackMessage, "error");
        }
    }, [file, uploadHolidayPlan, onValidated]);

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 2 }}>

            <Box width="100%" display="flex" justifyContent="flex-end">
                <PrimaryIconButton
                    title="Download Sample CSV"
                    icon={<Download />}
                    variant="outlined"
                    onClick={handleDownloadSample}
                />
            </Box>

            <Box display="flex" gap={2} alignItems="stretch">
                <Box
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={!file ? handleBrowseClick : undefined}
                    sx={{
                        width: hasResponse ? "50%" : "100%",
                        border: "2px dashed",
                        transition: "width 0.3s ease",
                        borderRadius: 2,
                        p: 5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        cursor: file ? "default" : "pointer",
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        hidden
                        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    />

                    {file ? (
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <InsertDriveFile color="success" sx={{ fontSize: 36 }} />
                            <Box>
                                <Typography variant="body1" fontWeight={600}>
                                    {file.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {(file.size / 1024).toFixed(1)} KB · Excel
                                </Typography>
                            </Box>
                            <PrimaryIconButton
                                icon={<Close fontSize="small" />}
                                onClick={(e: any) => {
                                    e.stopPropagation();
                                    handleRemoveFile();
                                }}
                                variant="outlined"
                                size="small"
                            />
                        </Stack>
                    ) : (
                        <>
                            <CloudUpload sx={{ fontSize: 48, color: "text.disabled" }} />
                            <Typography>Drag & drop your Excel file here</Typography>
                            <Chip label=".xlsx, .xls only" size="small" variant="outlined" />
                        </>
                    )}
                </Box>
                {hasResponse && (
                    <>
                        <Divider orientation="vertical" flexItem />

                        <Box
                            sx={{
                                width: "50%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                gap: 1.5,
                                overflow: "auto",
                            }}
                        >
                            {isSuccess && (
                                <Alert
                                    severity="success"
                                    icon={<CheckCircleOutline />}
                                >
                                    <AlertTitle>Upload Successful</AlertTitle>
                                    Your holiday plan has been uploaded successfully.
                                </Alert>
                            )}

                            {hasGenericError && (
                                <Alert severity="error">
                                    <AlertTitle>Upload Failed</AlertTitle>
                                    {uploadState.genericMessage}
                                </Alert>
                            )}

                            {hasRowErrors && (
                                <Card
                                    variant="outlined"
                                    sx={{ borderColor: "error.light", borderRadius: 2, overflow: "hidden" }}
                                >
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.25,
                                            bgcolor: "error.50",
                                            borderBottom: "1px solid",
                                            borderColor: "error.light",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <ErrorOutline color="error" fontSize="small" />
                                        <Typography variant="subtitle2" color="error.dark" fontWeight={600}>
                                            {uploadState.errors!.length} Validation{" "}
                                            {uploadState.errors!.length > 1 ? "Errors" : "Error"} Found
                                        </Typography>
                                        <Typography variant="caption" color="error.main" ml="auto">
                                            Fix and re-upload.
                                        </Typography>
                                    </Box>

                                    <List dense disablePadding sx={{ maxHeight: 220, overflow: "auto" }}>
                                        {uploadState.errors!.map((err, idx) => {
                                            const errorMessages = Object.entries(err.data)
                                                .filter(([_, field]) => field.error !== null)
                                                .map(([column, field]) => ({ column, error: field.error }));

                                            return (
                                                <Box key={idx}>
                                                    <ListItem sx={{ px: 2, py: 1 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <ErrorOutline color="error" fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Stack spacing={0.5}>
                                                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                                                        <Chip
                                                                            label={`Row ${err.rowNumber}`}
                                                                            size="small"
                                                                            color="error"
                                                                            variant="outlined"
                                                                            sx={{ fontFamily: "monospace", fontWeight: 600 }}
                                                                        />
                                                                    </Stack>
                                                                    {errorMessages.map((errMsg, i) => (
                                                                        <Stack
                                                                            key={i}
                                                                            direction="row"
                                                                            alignItems="center"
                                                                            spacing={1}
                                                                            flexWrap="wrap"
                                                                            sx={{ pl: 1 }}
                                                                        >
                                                                            <Chip
                                                                                label={errMsg.column}
                                                                                size="small"
                                                                                variant="filled"
                                                                                sx={{
                                                                                    fontFamily: "monospace",
                                                                                    fontSize: "0.7rem",
                                                                                    height: "20px"
                                                                                }}
                                                                            />
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {errMsg.error}
                                                                            </Typography>
                                                                        </Stack>
                                                                    ))}
                                                                </Stack>
                                                            }
                                                        />
                                                    </ListItem>
                                                    {idx < uploadState.errors!.length - 1 && (
                                                        <Divider component="li" />
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </List>

                                    {/* Footer actions */}
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.25,
                                            bgcolor: "grey.50",
                                            borderTop: "1px solid",
                                            borderColor: "divider",
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            gap: 1,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <PrimaryButton
                                            startIcon={<CloudUpload />}
                                            variant="outlined"
                                            onClick={handleRemoveFile}
                                        >
                                            Re-upload Excel
                                        </PrimaryButton>
                                        <PrimaryButton
                                            startIcon={<Download />}
                                            variant="text"
                                            onClick={handleDownloadSample}
                                        >
                                            Download Template
                                        </PrimaryButton>
                                    </Box>
                                </Card>
                            )}
                        </Box>
                    </>
                )}
            </Box>

            {file && !isSuccess && (
                <Stack direction="row" justifyContent="flex-end">
                    <PrimaryButton
                        startIcon={
                            isValidating ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <CloudUpload />
                            )
                        }
                        onClick={handleValidate}
                        disabled={isValidating}
                    >
                        {isValidating ? "Uploading..." : "Upload & Validate"}
                    </PrimaryButton>
                </Stack>
            )}

            {
                snackbar.open && (
                    <Snackbar
                        message={snackbar.message}
                        color={snackbar.color}
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    />
                )
            }
        </Box >
    );
};

export default HolidayPlanUploadView;