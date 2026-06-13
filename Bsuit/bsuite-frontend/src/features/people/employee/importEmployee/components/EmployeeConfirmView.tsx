import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Collapse,
    Divider,
    IconButton,
    Typography,
    Chip,
    Button,
    Stack,
    Alert,
} from "@mui/material";
import {
    CheckCircle,
    ExpandMore,
    ExpandLess,
    ArrowBack,
    CheckCircleOutline,
} from "@mui/icons-material";
import { type ImportedEmployeeItem } from "../api/employeeImport.api";

interface Props {
    employees: ImportedEmployeeItem[];
    onConfirm: () => void;
    onBack: () => void;
    isSubmitting?: boolean;
}

export const EmployeeConfirmView = ({ employees, onConfirm, onBack, isSubmitting }: Props) => {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    const toggle = (i: number) =>
        setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

    if (!employees.length) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320 }}>
                <Typography variant="body2" color="text.secondary">
                    No employees to confirm.
                </Typography>
            </Box>
        );
    }

    const infoBoxSx = {
        flex: "1 1 180px",
        bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'grey.50',
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        px: 2,
        py: 1.25,
    };

    return (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Header bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h6" fontWeight={700}>Confirm Import</Typography>
                    <Chip label={`${employees.length} employees`} size="small" variant="outlined" />
                    <Chip
                        icon={<CheckCircle fontSize="small" />}
                        label="Ready to import"
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                    />
                </Stack>

                <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" startIcon={<ArrowBack fontSize="small" />} onClick={onBack} sx={{ borderRadius: 2 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        color="success"
                        sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                    >
                        {isSubmitting ? "Importing..." : "Confirm & Import"}
                    </Button>
                </Stack>
            </Stack>

            <Alert severity="success" icon={<CheckCircleOutline />} sx={{ borderRadius: 2 }}>
                <strong>Ready to Import: {employees.length} Employees</strong>. All rows have been validated. Review the summaries below and click <strong>Confirm & Import</strong> to finalize.
            </Alert>

            {/* Employee cards */}
            <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}>
                {employees.map((employee, ti) => {
                    const isExpanded = !!expanded[ti];

                    return (
                        <Card
                            key={ti}
                            variant="outlined"
                            sx={{ 
                                borderColor: "success.light", 
                                borderRadius: 3, 
                                overflow: "hidden",
                                boxShadow: "none",
                                "&:hover": {
                                    boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 4px 20px 0 rgba(0,0,0,0.2)' : '0 4px 16px 0 rgba(0,0,0,0.03)'
                                }
                            }}
                        >
                            <CardHeader
                                onClick={() => toggle(ti)}
                                sx={{
                                    cursor: "pointer",
                                    bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'success.50',
                                    py: 1.5,
                                    "& .MuiCardHeader-action": { alignSelf: "center" },
                                }}
                                avatar={<CheckCircle color="success" />}
                                title={
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {employee.contactName || `Employee ${ti + 1}`}
                                    </Typography>
                                }
                                subheader={
                                    <Typography variant="caption" color="text.secondary">
                                        ID: {employee.employeeId} · {employee.workEmail}
                                    </Typography>
                                }
                                action={
                                    <IconButton size="small">
                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                }
                            />

                            <Collapse in={isExpanded}>
                                <CardContent sx={{ pt: 2.5, px: 3, pb: 3 }}>

                                    {/* Personal Info */}
                                    <Typography variant="overline" color="text.secondary" fontWeight={700} gutterBottom display="block" pb={1}>
                                        Personal Information
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
                                        {[
                                            { label: "Contact Name", value: employee.contactName },
                                            { label: "Employee ID", value: employee.employeeId },
                                            { label: "Work Email", value: employee.workEmail },
                                            { label: "Mobile", value: employee.mobileNumber || "—" },
                                            { label: "Date of Birth", value: employee.dateOfBirth || "—" },
                                            { label: "PAN", value: employee.panNumber || "—" },
                                            { label: "Date of Joining", value: employee.dateOfJoining },
                                            { label: "Gender", value: employee.gender || "—" },
                                        ].map(({ label, value }) => (
                                            <Box key={label} sx={infoBoxSx}>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.25 }}>
                                                    {label}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    {/* Organization */}
                                    <Typography variant="overline" color="text.secondary" fontWeight={700} gutterBottom display="block" pb={1}>
                                        Organization
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
                                        {[
                                            { label: "Department", value: employee.department },
                                            { label: "Sub Department", value: employee.subDepartment || "—" },
                                            { label: "Designation", value: employee.designation },
                                            { label: "Employee Type", value: employee.employeeType },
                                            { label: "Portal Enabled", value: employee.isEmployeePortalEnabled ? "Yes" : "No" },
                                        ].map(({ label, value }) => (
                                            <Box key={label} sx={infoBoxSx}>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.25 }}>
                                                    {label}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    {/* Payroll */}
                                    {employee.payroll && (
                                        <>
                                            <Divider sx={{ my: 2.5 }} />
                                            <Typography variant="overline" color="text.secondary" fontWeight={700} gutterBottom display="block" pb={1}>
                                                Payroll Configuration
                                            </Typography>
                                            <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
                                                {[
                                                    { label: "Payroll Enabled", value: "Yes" },
                                                    { label: "Salary Template", value: employee.payroll.template },
                                                    { label: "Annual Gross", value: `₹${Number(employee.payroll.annualGross).toLocaleString()}` },
                                                    { label: "PF Enabled", value: employee.payroll.isPfEnabled ? "Yes" : "No" },
                                                    { label: "PF Number", value: employee.payroll.pfNumber || "—" },
                                                    { label: "UAN Number", value: employee.payroll.uanNumber || "—" },
                                                ].map(({ label, value }) => (
                                                    <Box key={label} sx={infoBoxSx}>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.25 }}>
                                                            {label}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </>
                                    )}

                                    {/* Attendance */}
                                    {employee.attendance && (
                                        <>
                                            <Divider sx={{ my: 2.5 }} />
                                            <Typography variant="overline" color="text.secondary" fontWeight={700} gutterBottom display="block" pb={1}>
                                                Attendance Configuration
                                            </Typography>
                                            <Stack direction="row" flexWrap="wrap" gap={2}>
                                                {[
                                                    { label: "Shift", value: employee.attendance.shift },
                                                    { label: "Week Off", value: employee.attendance.weekoff },
                                                    { label: "Leave Plan", value: employee.attendance.leavePlan },
                                                    { label: "Holiday Plan", value: employee.attendance.holidayPlan },
                                                ].map(({ label, value }) => (
                                                    <Box key={label} sx={infoBoxSx}>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.25 }}>
                                                            {label}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </>
                                    )}

                                </CardContent>
                                <Divider />
                            </Collapse>
                        </Card>
                    );
                })}
            </Box>
        </Box>
    );
};

export default EmployeeConfirmView;
