import { useState } from "react";
import { Box, Stack, Typography, Divider, TextField } from "@mui/material";
import { Business, HelpOutline, CalendarToday } from "@mui/icons-material";
import EditIcon from '@mui/icons-material/Edit';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { AccordionElement } from "../../../../../../components/atom/accordion";
import { CompanyterminationReasons, EmployeeTerminationReasons } from "../../directory/components/InitiateExitModal";

import dayjs, { type Dayjs } from "dayjs";
import { formatReason } from "../util/formatReason";
import { useEditExitMutation } from "../api/exit.api";

import type { Exit, ExitRequest } from "../api/exit.api";
import { Chip } from "../../../../../../components/atom/chips";
import { Snackbar } from "../../../../../../components/atom/snackbar";

interface ExitDetailsCardProps {
    ExitData: Exit;
    suggestedLastWorkingDate?: Dayjs | null;
}

export const ExitDetailsCard = ({ ExitData, suggestedLastWorkingDate }: ExitDetailsCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [reasonForExit, setReasonForExit] = useState(ExitData.reasonForExit);
    const [comments, setComments] = useState(ExitData.comments || "");
    const toLastWorkingDayjs = (value: string | null | undefined): Dayjs | null => {
        if (!value) return null;
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed : null;
    };
    const [lastWorkingDateValue, setLastWorkingDateValue] = useState<Dayjs | null>(
        toLastWorkingDayjs(ExitData.lastWorkingDate)
    );
    const [editExit, { isLoading }] = useEditExitMutation();

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const lastWorkingDate = ExitData.lastWorkingDate;

    const resetEditForm = () => {
        setReasonForExit(ExitData.reasonForExit);
        setComments(ExitData.comments || "");
        setLastWorkingDateValue(toLastWorkingDayjs(ExitData.lastWorkingDate));
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await editExit({
                exitId: ExitData.id,
                body: {
                    reasonForExit,
                    lastWorkingDate: lastWorkingDateValue?.isValid()
                        ? lastWorkingDateValue.format("YYYY-MM-DD")
                        : "",
                    comments,
                    exitInitiatedDate: ExitData.exitInitiatedDate,
                    initiateExitBy: ExitData.initiateExitBy,
                }
            }).unwrap();
            setSnackbar({
                open: true,
                message: "Exit details updated successfully",
                severity: "success",
            })
            setIsEditing(false);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error?.data?.message || "Failed to edit exit",
                severity: "error",
            })
            console.error("Failed to edit exit:", error);
        }
    };

    return (
        <>
            <AccordionElement
                title="Exit details"
                open={expanded}
                onChange={(_e, isExpanded) => setExpanded(isExpanded)}
                headerActions={
                    !isEditing ? (
                        <PrimaryIconButton
                            icon={<EditIcon />}
                            variant="outlined"
                            color="primary"
                            size="small"
                            title="Edit"
                            onClick={(e) => {
                                e.stopPropagation();
                                resetEditForm();
                                setIsEditing(true);
                            }}
                        />
                    ) : (
                        <Box display="flex" gap={1} pr={2}>
                            <PrimaryIconButton
                                icon={<CancelOutlinedIcon />}
                                variant="outlined"
                                color="primary"
                                size="small"
                                title="Cancel"
                                sx={{}}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    resetEditForm();
                                    setIsEditing(false);
                                }}
                            />
                            <PrimaryIconButton
                                icon={<CheckCircleIcon />}
                                variant="outlined"
                                color="success"
                                size="small"
                                title="Save"
                                loading={isLoading}
                                onClick={handleSave}
                            />
                        </Box>
                    )
                }
            >
                <Stack spacing={3}>
                    {/* Initiator */}
                    <Box display="flex" gap={1.5} alignItems="flex-start">
                        <Business sx={{ color: "text.secondary", fontSize: 20, mt: 0.2 }} />
                        <Box>
                            <Typography variant="body2">
                                {ExitData.initiateExitBy === "employee"
                                    ? `${ExitData.employee.contact?.name || "-"} initiated resignation for themselves`
                                    : (`Company initiated exit for ${ExitData.employee.employeeId}`
                                        + `: ${ExitData.employee.contact?.name || "-"}`)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                On {dayjs(ExitData.exitInitiatedDate).format("MMM DD, YYYY")}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Reason */}
                    <Box display="flex" gap={1.5} alignItems="flex-start">
                        <HelpOutline sx={{ color: "text.secondary", fontSize: 20, mt: 0.2 }} />
                        <Box width="50%">
                            {!isEditing ? (
                                <>
                                    <Typography variant="body2">
                                        Reason: {formatReason(ExitData.reasonForExit)}
                                    </Typography>
                                    {ExitData.status === 'approved' && (
                                        <Typography variant="body2">
                                            Approved by: {ExitData.approvedBy?.contact?.name ||
                                                ExitData.approvedBy?.nameAsPerAadhar ||
                                                ExitData.approvedBy?.nameAsPerPan ||
                                                ExitData.approvedBy?.employeeId || "-"}
                                        </Typography>
                                    )}
                                </>
                            ) : (
                                <SingleSelectElement
                                    fullWidth
                                    label="Reason for exit"
                                    value={reasonForExit}
                                    onChange={(value) => setReasonForExit(value)}
                                    options={ExitData.initiateExitBy === 'employee'
                                        ? EmployeeTerminationReasons : CompanyterminationReasons}

                                />
                            )}
                        </Box>
                    </Box>

                    {/* Last Working Day */}
                    <Box display="flex" gap={1.5} alignItems="flex-start">
                        <CalendarToday sx={{ color: "text.secondary", fontSize: 20, mt: 0.2 }} />
                        <Box width="100%">
                            {!isEditing ? (
                                <Typography variant="body2">
                                    Last working day:{" "}
                                    {lastWorkingDate
                                        ? dayjs(lastWorkingDate).format("MMM DD, YYYY")
                                        : "-"}

                                    {suggestedLastWorkingDate?.isValid() && (
                                        <>
                                            <br />
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                - Suggested last working day:{" "}
                                                {suggestedLastWorkingDate.format("MMM DD, YYYY")}
                                            </Typography>
                                        </>
                                    )}
                                </Typography>
                            ) : (
                                <DatePickerElement
                                    label="Last Working Date"
                                    value={lastWorkingDateValue}
                                    format="MMM DD, YYYY"
                                    width="50%"
                                    onChange={(value) => setLastWorkingDateValue(value)}
                                />
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ borderStyle: "dashed" }} />

                    <Box>
                        <Stack spacing={2}>
                            <Box width="100%">
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    Additional comments
                                </Typography>
                                {!isEditing ? (
                                    <Typography variant="body2">
                                        {ExitData.comments || "-"}
                                    </Typography>
                                ) : (
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label=""
                                        multiline
                                        rows={2}
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </Box>

                            <Box gap={1} flexDirection='column' display='flex' justifyContent='flex-start' alignItems='flex-start'>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                    Status
                                </Typography>
                                <Box maxWidth={100}>
                                    <Chip
                                        label={ExitData.status.charAt(0).toUpperCase() + ExitData.status.slice(1)}
                                        color={ExitData.status === "approved"
                                            ? "info"
                                            : ExitData.status === "pending"
                                                ? "warning"
                                                : "error"}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </AccordionElement>
            {snackbar.open && (
                <Snackbar
                    color={snackbar.severity as 'success' | 'error' | 'warning' | 'info'}
                    onClose={() => setSnackbar({ open: false, message: "", severity: "success" })}
                    message={snackbar.message}
                />
            )}
        </>
    );
};
