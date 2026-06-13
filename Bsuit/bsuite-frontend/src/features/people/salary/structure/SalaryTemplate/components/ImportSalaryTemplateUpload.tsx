import { useCallback, useRef, useState } from "react";
import {
    Box, Card, Typography, Alert, AlertTitle, Chip, Divider,
    List, ListItem, ListItemIcon, ListItemText, CircularProgress,
} from "@mui/material";
import { Stack } from "@mui/system";
import { CloudUpload, Download, ErrorOutline, InsertDriveFile, Close, CheckCircleOutline, ArrowForward } from "@mui/icons-material";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { useDownloadSampleExcelMutation, useImportSalaryTemplatesMutation, useValidateSalaryTemplatesMutation, type SalaryTemplateRequest } from "../api/salaryTemplate.api";
import { parseValidationMessages } from "./ImportSalaryTemplate";
import type { ISalaryTemplateItem, ParsedValidationError } from "./ImportSalaryTemplate";

interface SalaryTemplateUploadViewProps {
    onUploadComplete: (rows: ISalaryTemplateItem[], errors: ParsedValidationError[]) => void;
}

interface ImportSummary {
    total: number;
    errorCount: number;
    templateErrors: { name: string; count: number }[];
}

export const SalaryTemplateUploadView = ({ onUploadComplete }: SalaryTemplateUploadViewProps) => {
    const [downloadSampleExcel, { isLoading: isDownloading }] = useDownloadSampleExcelMutation();
    const [importSalaryTemplate] = useImportSalaryTemplatesMutation();
    const [validateSalaryTemplate] = useValidateSalaryTemplatesMutation();

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selected: File | null) => {
        if (!selected) return;
        if (!selected.name.endsWith(".xlsx")) {
            setUploadError("Only .xlsx files are supported.");
            return;
        }
        setFile(selected);
        setUploadError(null);
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
        setImportSummary(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownloadSample = async () => {
        try {
            const blob = await downloadSampleExcel().unwrap();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "salary-template-sample.xlsx");
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
        setImportSummary(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const importResponse = await importSalaryTemplate(formData).unwrap();
            const rows: ISalaryTemplateItem[] = importResponse.data;

            // Helper: coerce numeric fields to strings for the validate API
            const toSalaryTemplateRequest = (items: ISalaryTemplateItem[]): SalaryTemplateRequest[] =>
                items.map((item) => ({
                    ...item,
                    annualGross: String(item.annualGross),
                    monthlyGross: String(item.monthlyGross),
                    earnings: item.earnings.map((e) => ({
                        ...e,
                        monthlyAmount: String(e.monthlyAmount),
                    })),
                    deductions: item.deductions.map((d) => ({
                        ...d,
                        monthlyAmount: String(d.monthlyAmount),
                    })),
                })) as unknown as SalaryTemplateRequest[];

            // Call validate — check response for errors regardless of status
            let parsedErrors: ParsedValidationError[] = [];
            try {
                const response = await validateSalaryTemplate({ templates: toSalaryTemplateRequest(rows) }).unwrap();
                // Check if response indicates validation errors
                if (response?.data?.isValid === false && response?.data?.errors?.length > 0) {
                    // Convert structured errors to ParsedValidationError format
                    response.data.errors.forEach((error: any) => {
                        const templateIndex = rows.findIndex(row => row.templateName === error.templateName);
                        if (templateIndex === -1) return; // Skip if template not found

                        Object.entries(error.fields || {}).forEach(([fieldPath, messages]: [string, any]) => {
                            if (Array.isArray(messages)) {
                                messages.forEach((message: string) => {
                                    parsedErrors.push({
                                        templateIndex,
                                        path: fieldPath,
                                        field: fieldPath.split('.').pop() || fieldPath,
                                        message,
                                        subType: fieldPath.includes('.') ? (fieldPath.startsWith('earnings') || fieldPath.startsWith('deductions') ? fieldPath.split('.')[0] as 'earnings' | 'deductions' : 'root') : 'root',
                                        subIndex: fieldPath.includes('.') ? parseInt(fieldPath.split('.')[1]) : undefined,
                                    });
                                });
                            }
                        });
                    });
                }
            } catch (validationErr: any) {
                const messages: string[] = validationErr?.data?.message ?? [];
                parsedErrors = parseValidationMessages(messages);
            }

            // Build per-template error summary
            const templateErrorMap = new Map<number, number>();
            parsedErrors.forEach(({ templateIndex }) => {
                templateErrorMap.set(templateIndex, (templateErrorMap.get(templateIndex) ?? 0) + 1);
            });

            setImportSummary({
                total: rows.length,
                errorCount: templateErrorMap.size,
                templateErrors: rows.map((r, i) => ({
                    name: r.templateName,
                    count: templateErrorMap.get(i) ?? 0,
                })),
            });

            // Auto-advance after a short moment so user sees the summary
            setTimeout(() => onUploadComplete(rows, parsedErrors), 1000);

        } catch (e: any) {
            setUploadError(e?.data?.message ?? "Failed to connect to the server. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const hasResponse = !!importSummary || !!uploadError;

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box width="100%" display="flex" justifyContent="flex-end">
                <PrimaryIconButton
                    title="Download Sample Excel"
                    icon={<Download />}
                    variant="outlined"
                    onClick={handleDownloadSample}
                    disabled={isDownloading}
                />
            </Box>

            <Box display="flex" gap={2} alignItems="stretch">
                {/* Drop zone */}
                <Box
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={!file ? () => fileInputRef.current?.click() : undefined}
                    sx={{
                        width: hasResponse ? "50%" : "100%",
                        transition: "width 0.3s ease",
                        border: "2px dashed",
                        borderColor: isDragging ? "primary.main" : file ? "success.main" : "divider",
                        borderRadius: 2,
                        p: 5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        cursor: file ? "default" : "pointer",
                        bgcolor: isDragging ? "primary.50" : file ? "success.50" : "background.default",
                        "&:hover": !file ? { borderColor: "primary.main", bgcolor: "primary.50" } : {},
                    }}
                >
                    <input ref={fileInputRef} type="file" accept=".xlsx" hidden
                        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />

                    {file ? (
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <InsertDriveFile color="success" sx={{ fontSize: 36 }} />
                            <Box>
                                <Typography variant="body1" fontWeight={600}>{file.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {(file.size / 1024).toFixed(1)} KB · Excel
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
                            <CloudUpload sx={{ fontSize: 48, color: "text.disabled" }} />
                            <Box textAlign="center">
                                <Typography variant="body1" fontWeight={500}>Drag & drop your Excel file here</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    or{" "}
                                    <Typography component="span" variant="body2" color="primary.main" fontWeight={600} sx={{ cursor: "pointer" }}>
                                        browse to upload
                                    </Typography>
                                </Typography>
                            </Box>
                            <Chip label=".xlsx files only" size="small" variant="outlined" />
                        </>
                    )}
                </Box>

                {/* Response panel */}
                {hasResponse && (
                    <>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5, overflow: "auto" }}>

                            {uploadError && (
                                <Alert severity="error">
                                    <AlertTitle>Upload Failed</AlertTitle>
                                    {uploadError}
                                </Alert>
                            )}

                            {importSummary && (
                                <>
                                    <Alert
                                        severity={importSummary.errorCount > 0 ? "warning" : "success"}
                                        icon={importSummary.errorCount > 0 ? <ErrorOutline /> : <CheckCircleOutline />}
                                    >
                                        <AlertTitle>
                                            {importSummary.errorCount > 0
                                                ? `${importSummary.errorCount} template(s) need fixes`
                                                : "All templates valid — proceeding…"}
                                        </AlertTitle>
                                        <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                                            <Chip label={`${importSummary.total} templates imported`} size="small" color="success" />
                                            {importSummary.errorCount > 0 && (
                                                <Chip label={`${importSummary.errorCount} with errors`} size="small" color="warning" />
                                            )}
                                        </Stack>
                                    </Alert>

                                    {/* Per-template breakdown */}
                                    <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                                        <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
                                            <Typography variant="subtitle2" fontWeight={600}>Template Breakdown</Typography>
                                        </Box>
                                        <List dense disablePadding>
                                            {importSummary.templateErrors.map((t, idx) => (
                                                <Box key={idx}>
                                                    <ListItem sx={{ px: 2, py: 0.75 }}>
                                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                                            {t.count === 0
                                                                ? <CheckCircleOutline color="success" fontSize="small" />
                                                                : <ErrorOutline color="warning" fontSize="small" />
                                                            }
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={t.name}
                                                            secondary={t.count === 0 ? "Valid" : `${t.count} field error(s)`}
                                                            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                                                            secondaryTypographyProps={{
                                                                variant: "caption",
                                                                color: t.count === 0 ? "success.main" : "warning.main"
                                                            }}
                                                        />
                                                    </ListItem>
                                                    {idx < importSummary.templateErrors.length - 1 && <Divider component="li" />}
                                                </Box>
                                            ))}
                                        </List>
                                        <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                Moving to Review & Map <ArrowForward fontSize="inherit" />
                                            </Typography>
                                        </Box>
                                    </Card>
                                </>
                            )}
                        </Box>
                    </>
                )}
            </Box>

            {file && !importSummary && (
                <Stack direction="row" justifyContent="flex-end">
                    <PrimaryButton
                        startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
                        onClick={handleUpload}
                        disabled={isUploading}
                    >
                        {isUploading ? "Uploading..." : "Upload & Validate"}
                    </PrimaryButton>
                </Stack>
            )}
        </Box>
    );
};

export default SalaryTemplateUploadView;