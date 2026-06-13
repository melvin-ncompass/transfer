import { useRef, useState } from "react";
import {
    Box,
    Card,
    Step,
    StepLabel,
    Stepper,
    Typography,
    Stack,
    Alert,
    CircularProgress,
    IconButton,
} from "@mui/material";
import { CloudUpload, CheckCircle, Tune, ArrowBack } from "@mui/icons-material";
import HolidayPlanUploadView from "./HolidayPlanUploadView";
import type { IHolidayPlanUploadItem } from "../api/holidayPlan.api";
import HolidayPlanValidationView, { type HolidayPlanValidationViewRef } from "./HolidayPlanValidation";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useBulkCreateHolidayPlanMutation } from "../api/holidayPlan.api";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { useNavigate } from "react-router-dom";
import { Country } from "country-state-city";

interface StepConfig {
    label: string;
    description: string;
    icon: React.ReactNode;
}

// ----------
// Component
// ----------
const HolidayPlanImportPage = () => {
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(0);
    const [uploadedData, setUploadedData] = useState<IHolidayPlanUploadItem[]>([]);
    const [validatedData, setValidatedData] = useState<IHolidayPlanUploadItem[]>([]);
    const [initialErrors, setInitialErrors] = useState<any[]>([]);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [canProceed, setCanProceed] = useState(false);
    const [hasEditsInValidation, setHasEditsInValidation] = useState(false);

    const validationRef = useRef<HolidayPlanValidationViewRef>(null);


    // Bulk create mutation
    const [bulkCreateHolidayPlan, { isLoading: isCreating, isSuccess: isCreateSuccess, isError: isCreateError, error: createError }] = useBulkCreateHolidayPlanMutation();

    // Step configurations
    const steps: StepConfig[] = [
        {
            label: "Upload CSV",
            description: "Download the sample, fill it in, and upload",
            icon: <CloudUpload fontSize="small" />,
        },
        {
            label: "Review & Map",
            description: "Verify column mappings before import",
            icon: <Tune fontSize="small" />,
        },
        {
            label: "Confirm",
            description: "Finalize and apply the holiday plans",
            icon: <CheckCircle fontSize="small" />,
        },
    ];

    const isFirst = activeStep === 0;
    const isLast = activeStep === steps.length - 1;

    const handleNext = async () => {
        if (activeStep === 1) {
            await validationRef.current?.validate();
            return;
        }

        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

    const handleFinish = async () => {
        try {
            await bulkCreateHolidayPlan({ data: validatedData }).unwrap();
        } catch (err) {
            console.error("Failed to create holiday plans:", err);
        }
    };

    // Handle upload completion from Step 1
    const handleUploadComplete = (data: IHolidayPlanUploadItem[], errors?: any[]) => {
        setUploadedData(data);
        setValidatedData(data);
        setInitialErrors(errors || []);
        setCanProceed(data.length > 0);
    };

    // Handle validation completion from Step 2
    const handleValidationComplete = (results: any[]) => {
        setValidationResults(results);

        const isValid = results.length === 0;
        setCanProceed(isValid);
        setHasEditsInValidation(false);

        if (isValid) {
            setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handleEditStateChange = (hasEdits: boolean) => {
        setHasEditsInValidation(hasEdits);
        if (hasEdits) {
            setCanProceed(true);
        }
    };

    // Handle data updates from Step 2
    const handleDataUpdate = (data: IHolidayPlanUploadItem[]) => {
        setValidatedData(data);
    };

    // Render step content based on active step
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <HolidayPlanUploadView
                        onValidated={(data) => handleUploadComplete(data)}
                    />
                );
            case 1:
                return (
                    <HolidayPlanValidationView
                        ref={validationRef}
                        uploadedData={validatedData}
                        initialErrors={initialErrors}
                        onValidationComplete={handleValidationComplete}
                        onDataUpdate={handleDataUpdate}
                        onEditStateChange={handleEditStateChange}
                    />
                );
            case 2:
                return (
                    <ConfirmView
                        data={validatedData}
                        isLoading={isCreating}
                        isSuccess={isCreateSuccess}
                        isError={isCreateError}
                        error={createError}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Card
            elevation={2}
            sx={{
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                height: "100%",
            }}
        >
            {/* Page Title */}
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <IconButton
                    onClick={() => {
                        navigate('/people/home?tab=6&subtab=2')
                    }}
                    sx={{ pl: 0 }}
                >
                    <ArrowBack />
                </IconButton>
                <Typography variant="h6" fontWeight={700}>
                    Import Holiday Plans
                </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" mb={1}>
                Follow the steps below to bulk-import holiday plans from a CSV file.
            </Typography>

            {/* Stepper */}
            <Box sx={{ borderRadius: 2, px: 4, py: 2.5 }}>
                <Stepper activeStep={activeStep} alternativeLabel={false}>
                    {steps.map((step, index) => (
                        <Step key={step.label} completed={index < activeStep}>
                            <StepLabel
                                onClick={() => {
                                    if (index < activeStep && !isCreateSuccess) {
                                        setActiveStep(index);
                                    }
                                }}
                                sx={{ cursor: index < activeStep && !isCreateSuccess ? "pointer" : "default" }}
                                optional={
                                    <Typography variant="caption" color="text.secondary">
                                        {step.description}
                                    </Typography>
                                }
                            >
                                <Typography
                                    variant="body2"
                                    fontWeight={activeStep === index ? 700 : 500}
                                    color={
                                        activeStep === index ? "primary.main" : "text.primary"
                                    }
                                >
                                    {step.label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Step Content */}
            <Box sx={{ borderRadius: 2, overflow: "auto", flex: 1 }}>
                {renderStepContent()}
            </Box>

            {/* Navigation Buttons */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                    pt: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    gap: 2,
                }}
            >
                <PrimaryButton
                    variant="outlined"
                    size="small"
                    onClick={handleBack}
                    disabled={isFirst || isCreating || isCreateSuccess}
                >
                    Back
                </PrimaryButton>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                    }}
                >
                    {activeStep === 1 && hasEditsInValidation && (
                        <Typography
                            variant="body2"
                            color="warning.main"
                            sx={{
                                fontWeight: 500,
                            }}
                        >
                            Data has been edited. Click 'Validate & Next' to re-validate
                            before proceeding.
                        </Typography>
                    )}

                    <PrimaryButton
                        variant="contained"
                        size="small"
                        onClick={isLast ? handleFinish : handleNext}
                        disabled={
                            isCreating ||
                            isCreateSuccess ||
                            (activeStep === 0 && !canProceed) ||
                            (activeStep === 1 && !canProceed)
                        }
                    >
                        {isLast
                            ? (isCreating ? "Creating..." : "Finish")
                            : activeStep === 1
                                ? "Validate & Next"
                                : "Next"}
                    </PrimaryButton>
                </Box>
            </Box>
        </Card>
    );
};

const ConfirmView = ({
    data,
    isLoading,
    isSuccess,
    isError,
    error,
}: {
    data: IHolidayPlanUploadItem[];
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error?: any;
}) => {
    const navigate = useNavigate();
    const uniquePlans = new Set(
        data.map((item) => `${item.planName}-${item.country}`)
    ).size;

    const totalHolidays = data.length;

    /* ---------- TABLE CONFIG ---------- */

    const columns = [
        {
            id: "index",
            label: "#",
            width: 60,
            render: (row: any) => row.id + 1,
        },
        {
            id: "planName",
            label: "Plan Name",
            minWidth: 160,
        },
        {
            id: "country",
            label: "Country",
            minWidth: 120,
        },
        {
            id: "date",
            label: "Date",
            minWidth: 120,
        },
        {
            id: "description",
            label: "Description",
            minWidth: 200,
        },
    ];

    const rows = data.map((item, index) => ({
        id: index,
        ...item,
        country:
            Country.getCountryByCode(item.country)?.name || item.country,
    }));

    /* ---------- STATES ---------- */

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 320,
                    gap: 2,
                }}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Creating holiday plans...
                </Typography>
            </Box>
        );
    }

    if (isSuccess) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 320,
                    gap: 2,
                    p: 3,
                }}
            >
                <CheckCircle sx={{ fontSize: 64, color: "success.main" }} />
                <Typography variant="h6" fontWeight={600}>
                    Import Successful!
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                >
                    Successfully created {uniquePlans} holiday plan
                    {uniquePlans !== 1 ? "s" : ""} with {totalHolidays} holiday
                    {totalHolidays !== 1 ? "s" : ""}.
                </Typography>
                <PrimaryButton
                    onClick={() => { navigate('/people/home?tab=6&subtab=2') }}>
                    Return to Holiday Plans
                </PrimaryButton>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 320,
                    gap: 2,
                    p: 3,
                }}
            >
                <Alert severity="error" sx={{ width: "100%", maxWidth: 500 }}>
                    <Typography variant="body2" fontWeight={600}>
                        Failed to create holiday plans
                    </Typography>
                    <Typography variant="caption">
                        {error?.data?.message ||
                            error?.message ||
                            "An unexpected error occurred"}
                    </Typography>
                </Alert>
            </Box>
        );
    }

    /* ---------- DEFAULT VIEW ---------- */

    return (
        <Box
            sx={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
            }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>
                Confirm Import —{" "}
                <span>
                    <strong style={{ color: "#2e7d32" }}>
                        {uniquePlans} Plan{uniquePlans !== 1 ? "s" : ""}
                    </strong>
                    {"  •  "}
                    <strong style={{ color: "#1976d2" }}>
                        {totalHolidays} Holiday
                        {totalHolidays !== 1 ? "s" : ""}
                    </strong>
                </span>
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
                Review the data below and click <strong>Finish</strong> to create
                the holiday plans.
            </Alert>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "auto",
                    border: "1px solid #ccc",
                    borderRadius: 1,
                }}
            >
                <StandardTable
                    columns={columns}
                    rows={rows}
                    sticky
                    stickyTop={0}
                    emptyMessage="No holiday data to display"
                />
            </Box>
        </Box>
    );
};

export default HolidayPlanImportPage;