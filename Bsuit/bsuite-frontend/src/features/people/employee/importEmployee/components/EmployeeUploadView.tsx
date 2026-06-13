import { useState, useCallback, useRef } from "react";
import {
    Box,
    Alert,
    AlertTitle,
    Chip,
    Divider,
    Card,
    CardContent,
    Stack,
    Typography,
    CircularProgress,
    Grid,
} from "@mui/material";
import {
    CloudUpload,
    Close,
    Download,
    CheckCircleOutline,
    ErrorOutline,
    InsertDriveFile,
} from "@mui/icons-material";
import { PrimaryButton, PrimaryIconButton } from "../../../../../components/atom/button";
import {
    useDownloadEmployeeSampleExcelMutation,
    useImportEmployeesMutation,
    useValidateEmployeesMutation,
} from "../api/employeeImport.api";
import { validateEmployeeList } from "../api/employeeImportValidation";

interface EmployeeUploadViewProps {
    onUploadComplete: (rows: any[], errors: any[]) => void;
}

interface ImportSummary {
    total: number;
    errorCount: number;
    employeeErrors: { employeeId: string; contactName: string; count: number }[];
}

interface HeaderErrorDetails {
    message: string;
    missingHeaders?: string[];
    extraHeaders?: string[];
    expectedHeaders?: string[];
    receivedHeaders?: string[];
}

export const EmployeeUploadView = ({ onUploadComplete }: EmployeeUploadViewProps) => {
    const [downloadSampleExcel, { isLoading: isDownloading }] = useDownloadEmployeeSampleExcelMutation();
    const [importEmployees] = useImportEmployeesMutation();
    const [validateEmployees] = useValidateEmployeesMutation();

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [headerErrors, setHeaderErrors] = useState<HeaderErrorDetails | null>(null);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selected: File | null) => {
        if (!selected) return;
        if (!selected.name.endsWith(".xlsx")) {
            setUploadError("Only .xlsx files are supported.");
            setHeaderErrors(null);
            return;
        }
        setFile(selected);
        setUploadError(null);
        setHeaderErrors(null);
        setImportSummary(null);
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files?.[0] ?? null);
    }, []);

    const handleRemoveFile = () => {
        setFile(null);
        setUploadError(null);
        setHeaderErrors(null);
        setImportSummary(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownloadSample = async () => {
        try {
            const blob = await downloadSampleExcel().unwrap();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "employees-sample.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadError(null);
        setHeaderErrors(null);
        setImportSummary(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const importResponse = await importEmployees(formData).unwrap();
            console.log(importResponse)
            const rows = importResponse.data;

            // 1. Run client-side validation first
            const clientErrors = validateEmployeeList(rows);

            // 2. Validate employees via API
            let apiErrors: any[] = [];
            try {
                const response = await validateEmployees({ employees: rows }).unwrap();
                if (response?.data?.errors?.length > 0) {
                    apiErrors = response.data.errors;
                }
            } catch (validationErr: any) {
                if (validationErr?.data?.errors) {
                    apiErrors = validationErr.data.errors;
                }
            }

            // 3. Merge clientErrors and apiErrors
            const mergedMap = new Map<string, any>();
            
            clientErrors.forEach(err => {
                mergedMap.set(err.employeeId, { ...err, fields: { ...err.fields } });
            });

            apiErrors.forEach(err => {
                const existing = mergedMap.get(err.employeeId);
                if (existing) {
                    Object.entries(err.fields || {}).forEach(([field, msgs]) => {
                        const existingMsgs = existing.fields[field] || [];
                        const uniqueMsgs = Array.from(new Set([...existingMsgs, ...(msgs as string[])]));
                        existing.fields[field] = uniqueMsgs;
                    });
                } else {
                    mergedMap.set(err.employeeId, { ...err, fields: { ...err.fields } });
                }
            });

            const mergedErrors = Array.from(mergedMap.values());

            // Build summary
            const employeeErrorMap = new Map<string, number>();
            mergedErrors.forEach((error) => {
                const count = Object.values(error.fields || {}).reduce((s: number, msgs: any) => {
                    const len = Array.isArray(msgs) ? msgs.length : (msgs ? 1 : 0);
                    return s + len;
                }, 0);
                employeeErrorMap.set(String(error.employeeId || ""), count);
            });

            setImportSummary({
                total: rows.length,
                errorCount: mergedErrors.length,
                employeeErrors: rows.map((r) => ({
                    employeeId: String(r.employeeId || ""),
                    contactName: r.contactName,
                    count: employeeErrorMap.get(String(r.employeeId || "")) ?? 0,
                })),
            });

            // Auto-advance after a short moment so user sees the summary
            setTimeout(() => onUploadComplete(rows, mergedErrors), 1000);

        } catch (e: any) {
            console.error("Upload error details:", e);
            if (e?.data?.statusCode === 400 && e?.data?.message === "Invalid Excel format") {
                setHeaderErrors({
                    message: "The uploaded file does not match the expected column structure. Please fix the columns below and try again.",
                    missingHeaders: e.data.missingHeaders,
                    extraHeaders: e.data.extraHeaders,
                    expectedHeaders: e.data.expectedHeaders,
                    receivedHeaders: e.data.receivedHeaders,
                });
            } else {
                setUploadError(e?.data?.message ?? "Failed to connect to the server. Please try again.");
            }
        } finally {
            setIsUploading(false);
        }
    };

    const hasResponse = !!importSummary || !!uploadError || !!headerErrors;

    const importerCardStyles = {
        bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
        borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        backdropFilter: "blur(12px)",
        borderRadius: 3,
        border: "1px solid",
        boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 24px 0 rgba(0, 0, 0, 0.06)',
        transition: "transform 0.2s ease, border-color 0.2s ease",
        "&:hover": {
            borderColor: "rgba(99, 102, 241, 0.4)",
        }
    };

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box width="100%" display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                    Need the Excel template?
                </Typography>
                <PrimaryIconButton
                    title="Download Sample Excel"
                    icon={<Download />}
                    variant="outlined"
                    onClick={handleDownloadSample}
                    disabled={isDownloading}
                />
            </Box>

            <Grid container spacing={3} alignItems="stretch">
                {/* Drag and Drop Zone */}
                <Grid size={{ xs: 12, md: hasResponse ? 6 : 7 }}>
                    <Box
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={!file ? () => fileInputRef.current?.click() : undefined}
                        sx={{
                            ...importerCardStyles,
                            height: "100%",
                            minHeight: 220,
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            cursor: file ? "default" : "pointer",
                            borderColor: isDragging ? "primary.main" : file ? "success.main" : "divider",
                            bgcolor: isDragging 
                                ? (theme => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'primary.50') 
                                : file 
                                    ? (theme => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'success.50') 
                                    : undefined,
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept=".xlsx" hidden
                            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />

                        {file ? (
                            <Stack direction="row" alignItems="center" spacing={2.5}>
                                <InsertDriveFile color="success" sx={{ fontSize: 42 }} />
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>{file.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {(file.size / 1024).toFixed(1)} KB · Microsoft Excel
                                    </Typography>
                                </Box>
                                <PrimaryIconButton
                                    icon={<Close fontSize="small" />}
                                    onClick={(e: any) => { e.stopPropagation(); handleRemoveFile(); }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Stack>
                        ) : (
                            <>
                                <CloudUpload sx={{ fontSize: 52, color: "primary.main", mb: 0.5 }} />
                                <Box textAlign="center">
                                    <Typography variant="body1" fontWeight={600}>Drag & drop your Excel file here</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        or{" "}
                                        <Typography component="span" variant="body2" color="primary.main" fontWeight={700} sx={{ cursor: "pointer", textDecoration: "underline" }}>
                                            browse local files
                                        </Typography>
                                    </Typography>
                                </Box>
                                <Chip label="Supports .xlsx template" size="small" variant="outlined" sx={{ mt: 1 }} />
                            </>
                        )}
                    </Box>
                </Grid>

                {/* Right Panel: Formatting Guide or Import Summary / Header Errors */}
                <Grid size={{ xs: 12, md: hasResponse ? 6 : 5 }}>
                    {!hasResponse ? (
                        <Card variant="outlined" sx={{ borderRadius: 3, height: "100%", bgcolor: "background.paper" }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                                    Formatting Quick Guide
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.primary" display="block" mb={0.25}>
                                            Mandatory Columns:
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Contact Name, Employee ID, Work Email, Date of Joining, Department, Designation, Mobile Number, PAN Number
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.primary" display="block" mb={0.25}>
                                            Format Constraints:
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" component="div">
                                            • <strong>PAN Number:</strong> Format (AAAAA9999A) e.g. ABCDE1234F<br />
                                            • <strong>UAN Number:</strong> Exactly 12 digits if provided<br />
                                            • <strong>PF Number:</strong> Format (e.g. MHBAN123456700000012345) if PF is enabled
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="text.primary" display="block" mb={0.25}>
                                            Manager & PF Configuration:
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" component="div">
                                            • <strong>Reporting Manager:</strong> Required if 'Self Reporting' is disabled.<br />
                                            • <strong>PF Number:</strong> Required if PF is toggled on under Payroll.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    ) : (
                        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
                            {uploadError && (
                                <Alert severity="error" icon={<ErrorOutline />} sx={{ borderRadius: 2 }}>
                                    <AlertTitle sx={{ fontWeight: 700 }}>Upload Failed</AlertTitle>
                                    {uploadError}
                                </Alert>
                            )}

                            {headerErrors && (
                                <Alert severity="error" icon={<ErrorOutline />} sx={{ borderRadius: 2 }}>
                                    <AlertTitle sx={{ fontWeight: 700 }}>Invalid Excel Format</AlertTitle>
                                    <Typography variant="body2" mb={2} color="text.secondary">
                                        {headerErrors.message}
                                    </Typography>
                                    
                                    <Stack spacing={2} sx={{ mb: 2 }}>
                                        {headerErrors.missingHeaders && headerErrors.missingHeaders.length > 0 && (
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="error.dark" display="block" mb={0.5}>
                                                    Missing Required Columns:
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                    {headerErrors.missingHeaders.map((h, i) => (
                                                        <Chip key={i} label={h} size="small" color="error" variant="filled" />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                        {headerErrors.extraHeaders && headerErrors.extraHeaders.length > 0 && (
                                            <Box>
                                                <Typography variant="caption" fontWeight={700} color="warning.dark" display="block" mb={0.5}>
                                                    Unrecognized Columns:
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                    {headerErrors.extraHeaders.map((h, i) => (
                                                        <Chip key={i} label={h} size="small" color="warning" variant="outlined" />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Stack>
                                    
                                    <Divider sx={{ my: 1.5 }} />
                                    
                                    <Stack spacing={1}>
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                                                Expected Columns:
                                            </Typography>
                                            <Typography variant="caption" color="text.primary" sx={{ fontFamily: "monospace", display: "block" }}>
                                                {headerErrors.expectedHeaders?.join(", ") || "—"}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                                                Received Columns:
                                            </Typography>
                                            <Typography variant="caption" color="text.primary" sx={{ fontFamily: "monospace", display: "block" }}>
                                                {headerErrors.receivedHeaders?.join(", ") || "—"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Alert>
                            )}

                            {importSummary && (
                                <>
                                    <Alert
                                        severity={importSummary.errorCount > 0 ? "warning" : "success"}
                                        icon={importSummary.errorCount > 0 ? <ErrorOutline /> : <CheckCircleOutline />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <AlertTitle sx={{ fontWeight: 700 }}>
                                            {importSummary.errorCount > 0 ? "Validation Issues Found" : "File Parsed Successfully"}
                                        </AlertTitle>
                                        {importSummary.errorCount > 0
                                            ? `${importSummary.errorCount} of ${importSummary.total} employees have issues that require correction.`
                                            : `All ${importSummary.total} employees are validated and ready to review.`}
                                    </Alert>

                                    <Card variant="outlined" sx={{ borderRadius: 3, flex: 1, overflow: "hidden" }}>
                                        <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                                            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                                Import Status Summary
                                            </Typography>
                                            <Stack gap={1} sx={{ overflow: "auto", maxH: 220 }}>
                                                {importSummary.employeeErrors.map((emp, i) => (
                                                    <Box
                                                        key={i}
                                                        sx={{
                                                            p: 1.25,
                                                            borderRadius: 2,
                                                            bgcolor: emp.count > 0 ? "error.50" : "success.50",
                                                            border: "1px solid",
                                                            borderColor: emp.count > 0 ? "error.100" : "success.100",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {emp.contactName || "Unnamed Employee"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ID: {emp.employeeId || "—"}
                                                            </Typography>
                                                        </Box>
                                                        <Chip 
                                                            label={emp.count > 0 ? `${emp.count} error${emp.count > 1 ? "s" : ""}` : "Valid"}
                                                            size="small"
                                                            color={emp.count > 0 ? "error" : "success"}
                                                            variant="filled"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>

            {file && !importSummary && !headerErrors && (
                <Stack direction="row" justifyContent="flex-end" mt={1}>
                    <PrimaryButton
                        startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
                        onClick={handleUpload}
                        disabled={isUploading}
                        sx={{ px: 4, py: 1.25, borderRadius: 2 }}
                    >
                        {isUploading ? "Uploading & Analyzing..." : "Analyze & Validate"}
                    </PrimaryButton>
                </Stack>
            )}
        </Box>
    );
};

export default EmployeeUploadView;
