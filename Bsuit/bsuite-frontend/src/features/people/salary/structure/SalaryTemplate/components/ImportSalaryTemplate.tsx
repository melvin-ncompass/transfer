import { useState } from "react";
import { Box, Card, Step, StepLabel, Stepper, Typography, Alert } from "@mui/material";
import { Stack } from "@mui/system";
import { SalaryTemplateUploadView } from "./ImportSalaryTemplateUpload";
import { SalaryTemplateValidationView } from "./SalaryTemplateValidationView";
import { SalaryTemplateConfirmView } from "./SalaryTemplateImportConfirmationPage";
import { useBulkCreateSalaryTemplatesMutation } from "../api/salaryTemplate.api";
import { useNavigate } from "react-router-dom";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { ArrowBack } from "@mui/icons-material";
import { useSnackbar } from "../../../../../../context/SnackbarContext";

export interface ISalaryTemplateEarning {
    earningName: string;
    monthlyAmount: number | string;
    payslipOrder: number;
}

export interface ISalaryTemplateDeduction {
    deductionName: string;
    deductionId?: number;
    monthlyAmount: number | string;
    payslipOrder: number;
}

export interface ISalaryTemplateItem {
    templateName: string;
    description: string;
    annualGross: number | string;
    monthlyGross: number | string;
    earnings: ISalaryTemplateEarning[];
    deductions: ISalaryTemplateDeduction[];
}

// Parsed from "templates.0.earnings.1.monthlyAmount must be a string"
export interface ParsedValidationError {
    templateIndex: number;
    path: string;        // e.g. "earnings.1.monthlyAmount"
    field: string;       // e.g. "monthlyAmount"
    message: string;     // full message
    subType?: "earnings" | "deductions" | "root";
    subIndex?: number;
}
export interface TemplateValidationError {
    templateIndex: number;
    templateName: string;
    messages: string[];
}

export const parseValidationMessages = (messages: string[]): ParsedValidationError[] => {
    return messages.map((msg) => {
        // e.g. "templates.0.earnings.1.monthlyAmount must be a string"
        const match = msg.match(/^templates\.(\d+)\.(.+?)\s+(.+)$/);
        if (!match) return null;

        const templateIndex = parseInt(match[1], 10);
        const pathPart = match[2];       // e.g. "earnings.1.monthlyAmount"

        const subMatch = pathPart.match(/^(earnings|deductions)\.(\d+)\.(.+)$/);
        if (subMatch) {
            return {
                templateIndex,
                path: pathPart,
                field: subMatch[3],
                message: msg,
                subType: subMatch[1] as "earnings" | "deductions",
                subIndex: parseInt(subMatch[2], 10),
            };
        }

        return {
            templateIndex,
            path: pathPart,
            field: pathPart,
            message: msg,
            subType: "root",
        };
    }).filter(Boolean) as ParsedValidationError[];
};

interface UploadResult {
    rows: ISalaryTemplateItem[];
    errors: ParsedValidationError[];
}

const steps = [
    { label: "Upload CSV", description: "Download the sample, fill it in, and upload" },
    { label: "Review & Map", description: "Fix validation errors before confirming" },
    { label: "Confirm", description: "Finalize and apply the salary structures" },
];

export const ImportSalaryTemplatePage = () => {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [activeStep, setActiveStep] = useState(0);
    const [uploadResult, setUploadResult] = useState<UploadResult>({ rows: [], errors: [] });
    const [workingTemplates, setWorkingTemplates] = useState<ISalaryTemplateItem[]>([]);
    const [templatesToConfirm, setTemplatesToConfirm] = useState<ISalaryTemplateItem[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    const [bulkCreateSalaryTemplates, { isLoading: isImporting }] = useBulkCreateSalaryTemplatesMutation();

    const handleUploadComplete = (rows: ISalaryTemplateItem[], errors: ParsedValidationError[]) => {
        setUploadResult({ rows, errors });
        setWorkingTemplates(rows);
        setTemplatesToConfirm([]);
        setImportError(null);
        setImportSuccess(false);
        setActiveStep(1);
    };

    const handleValidationConfirm = (templates: ISalaryTemplateItem[]) => {
        setWorkingTemplates(templates);
        setTemplatesToConfirm(templates);
        setImportError(null);
        setImportSuccess(false);
        setActiveStep(2);
    };

    const toSalaryTemplateRequest = (items: ISalaryTemplateItem[]) =>
        items.map((item) => ({
            ...item,
            annualGross: String(item.annualGross),
            monthlyGross: String(item.monthlyGross),
            earnings: item.earnings.map((e) => ({
                ...e,
                monthlyAmount: String(e.monthlyAmount),
                payslipOrder: Number(e.payslipOrder ?? 0),
            })),
            deductions: item.deductions.map((d) => ({
                ...d,
                monthlyAmount: String(d.monthlyAmount),
                payslipOrder: Number(d.payslipOrder ?? 0),
            })),
        })) as unknown as any[];

    const handleConfirmImport = async () => {
        setImportError(null);
        setImportSuccess(false);

        try {
            await bulkCreateSalaryTemplates({ templates: toSalaryTemplateRequest(templatesToConfirm) }).unwrap();
            setImportSuccess(true);
            showSnackbar("Salary templates imported successfully.", "success");
            navigate(-1)
        } catch (err: any) {
            const errMsg = err?.data?.message ?? "Failed to import salary templates.";
            setImportError(errMsg);
            showSnackbar(errMsg, "error");
        }
    };

    return (
        <Card elevation={2} sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <PrimaryIconButton variant="outlined"
                    icon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                >

                </PrimaryIconButton>
                <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={700}>Import Salary Templates</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Follow the steps below to bulk-import salary structures from a CSV file.
                    </Typography>
                </Stack>
            </Stack>

            <Box sx={{ px: 4, py: 2.5 }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((step, index) => (
                        <Step key={step.label} completed={index < activeStep}>
                            <StepLabel
                                onClick={() => index < activeStep ? setActiveStep(index) : undefined}
                                sx={{ cursor: index < activeStep ? "pointer" : "default" }}
                                optional={
                                    <Typography variant="caption" color="text.secondary">
                                        {step.description}
                                    </Typography>
                                }
                            >
                                <Typography
                                    variant="body2"
                                    fontWeight={activeStep === index ? 700 : 500}
                                    color={activeStep === index ? "primary.main" : "text.primary"}
                                >
                                    {step.label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", borderRadius: 2 }}>
                {activeStep === 0 && (
                    <SalaryTemplateUploadView onUploadComplete={handleUploadComplete} />
                )}
                {activeStep === 1 && (
                    <SalaryTemplateValidationView
                        uploadedData={workingTemplates}
                        initialErrors={uploadResult.errors}
                        onConfirm={handleValidationConfirm}
                    />
                )}
                {activeStep === 2 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {importError && <Alert severity="error">{importError}</Alert>}
                        {importSuccess && <Alert severity="success">Salary templates imported successfully.</Alert>}
                        <SalaryTemplateConfirmView
                            templates={templatesToConfirm}
                            onBack={() => setActiveStep(1)}
                            onConfirm={handleConfirmImport}
                            isSubmitting={isImporting}
                        />
                    </Box>
                )}
            </Box>
        </Card>
    );
};

export default ImportSalaryTemplatePage;