import { useState } from "react";
import { Box, Card, Step, StepLabel, Stepper, Typography, Alert, Button } from "@mui/material";
import { Stack } from "@mui/system";
import { ArrowBack } from "@mui/icons-material";
import { EmployeeUploadView } from "./EmployeeUploadView";
import { EmployeeValidationView } from "./EmployeeValidationView";
import { EmployeeConfirmView } from "./EmployeeConfirmView";
import { useBulkCreateEmployeesMutation, type ImportedEmployeeItem } from "../api/employeeImport.api";
import { useNavigate } from "react-router-dom";
import { PrimaryIconButton } from "../../../../../components/atom/button";

interface UploadResult {
    rows: ImportedEmployeeItem[];
    errors: any[];
}

const steps = [
    { label: "Upload Excel", description: "Download the sample, fill it in, and upload" },
    { label: "Review & Validate", description: "Fix validation errors before confirming" },
    { label: "Confirm", description: "Finalize and import the employees" },
];

export const ImportEmployeePage = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [uploadResult, setUploadResult] = useState<UploadResult>({ rows: [], errors: [] });
    const [employeesToConfirm, setEmployeesToConfirm] = useState<ImportedEmployeeItem[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    const [bulkCreateEmployees, { isLoading: isImporting }] = useBulkCreateEmployeesMutation();

    const handleUploadComplete = (rows: ImportedEmployeeItem[], errors: any[]) => {
        setUploadResult({ rows, errors });
        setEmployeesToConfirm([]);
        setImportError(null);
        setImportSuccess(false);
        setActiveStep(1);
    };

    const handleValidationConfirm = (employees: ImportedEmployeeItem[]) => {
        setEmployeesToConfirm(employees);
        setImportError(null);
        setImportSuccess(false);
        setActiveStep(2);
    };

    const handleConfirmImport = async () => {
        setImportError(null);
        setImportSuccess(false);

        try {
            await bulkCreateEmployees({ employees: employeesToConfirm }).unwrap();
            setImportSuccess(true);
            setTimeout(() => {
                navigate(-1);
            }, 2000);
        } catch (err: any) {
            setImportError(err?.data?.message ?? "Failed to import employees.");
        }
    };

    return (
        <Card elevation={2} sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack direction="row" alignItems="center" justifyContent="start" gap={1}>

                {activeStep === 0 && (
                    <PrimaryIconButton
                        variant="outlined"
                        icon={<ArrowBack />}
                        onClick={() => navigate(-1)}
                        sx={{ borderRadius: 2 }}
                    />

                )} <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={700}>Import Employees</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Follow the steps below to bulk-import employees from an Excel file.
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
                    <EmployeeUploadView onUploadComplete={handleUploadComplete} />
                )}
                {activeStep === 1 && (
                    <EmployeeValidationView
                        uploadedData={uploadResult.rows}
                        initialErrors={uploadResult.errors}
                        onConfirm={handleValidationConfirm}
                        onBack={() => setActiveStep(0)}
                    />
                )}
                {activeStep === 2 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {importError && <Alert severity="error">{importError}</Alert>}
                        {importSuccess && <Alert severity="success">Employees imported successfully. Redirecting...</Alert>}
                        <EmployeeConfirmView
                            employees={employeesToConfirm}
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

export default ImportEmployeePage;
