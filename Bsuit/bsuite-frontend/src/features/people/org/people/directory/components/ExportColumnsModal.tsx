import { useState } from "react";
import {
    Box,
    Typography,
    FormControlLabel,
    Divider,
    IconButton,
} from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { useExportEmployeesMutation } from "../api/directory.api";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { PrimaryButton } from "../../../../../../components/atom/button";
import CloseIcon from "@mui/icons-material/Close";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";

const ALL_COLUMNS: { key: string; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "middleName", label: "Middle Name" },
    { key: "lastName", label: "Last Name" },
    { key: "employeeType", label: "Employee Type" },
    { key: "status", label: "Status" },
    { key: "employeeId", label: "Employee ID" },
    { key: "email", label: "Email" },
    { key: "dateOfJoining", label: "Date of Joining" },
    { key: "gender", label: "Gender" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "shiftType", label: "Shift Type" },
    { key: "leavePlan", label: "Leave Plan" },
    { key: "reportingTo", label: "Reporting To" },
    { key: "pfNumber", label: "PF Number" },
    { key: "uanNumber", label: "UAN Number" },
    { key: "template", label: "Template" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "personalEmail", label: "Personal Email" },
    { key: "panNumber", label: "PAN Number" },
    { key: "aadharNumber", label: "Aadhar Number" },
    { key: "taxConfig", label: "Tax Config" },
    { key: "pfEnabled", label: "PF Enabled" },
    { key: "inProbation", label: "In Probation" },
    { key: "probationEndDate", label: "Probation End Date" },
    { key: "expensePolicy", label: "Expense Policy" },
    { key: "bankAccountNo", label: "Bank Account No" },
    { key: "accountHolder", label: "Account Holder" },
    { key: "ifscCode", label: "IFSC Code" },
    { key: "bankName", label: "Bank Name" },
    { key: "bankBranchName", label: "Bank Branch Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "nameAsPerPan", label: "Name as per PAN" },
    { key: "nameAsPerAadhar", label: "Name as per Aadhar" },
    { key: "bloodGroup", label: "Blood Group" },
    { key: "fathersName", label: "Father's Name" },
    { key: "emergencyContact", label: "Emergency Contact" },
    { key: "maritalStatus", label: "Marital Status" },
    { key: "address", label: "Address" },
];

const ALL_KEYS = ALL_COLUMNS.map((c) => c.key);

interface ExportColumnsModalProps {
    isModalOpen: boolean;
    onClose: (open: false) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export default function ExportColumnsModal({
    isModalOpen,
    onClose,
    onSuccess,
    onError,
}: ExportColumnsModalProps) {
    const [selected, setSelected] = useState<string[]>(ALL_KEYS);
    const [exportEmployees, { isLoading }] = useExportEmployeesMutation();

    const allChecked = selected.length === ALL_KEYS.length;
    const someChecked = selected.length > 0 && !allChecked;

    const handleSelectAll = () => {
        setSelected(allChecked ? [] : ALL_KEYS);
    };

    const handleToggle = (key: string) => {
        setSelected((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleExport = async () => {
        try {
            const res = await exportEmployees({ columns: selected }).unwrap();
            handleClose();
            onSuccess(res.message ?? "Export initiated. Check your inbox after some time.");
        } catch (e: unknown) {
            const message =
                (e as { data?: { message?: string } })?.data?.message ??
                (e as { message?: string })?.message ??
                "Export failed. Please try again.";
            handleClose();
            onError(message);
        }
    };

    const handleClose = () => {
        onClose(false);
        setSelected(ALL_KEYS);
    };

    return (
        <ModalElement open={isModalOpen} onClose={handleClose} hideCloseButton={false}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "70vh",
                    maxHeight: 600,
                    overflow: "hidden",
                }}
            >
                {/* ── Pinned header ── */}
                <Box sx={{ flexShrink: 0 }}>
                    <Box display='flex' justifyContent='space-between'>
                        <Typography variant="h6" fontWeight={600} mb={0.5}>
                            Export Employees
                        </Typography>
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Select the columns you want to include in the export.
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={allChecked}
                                indeterminate={someChecked}
                                onChange={handleSelectAll}
                            />
                        }
                        label={
                            <Typography variant="body2" fontWeight={600}>
                                Select All ({selected.length}/{ALL_KEYS.length})
                            </Typography>
                        }
                        sx={{ pl: 1.4 }}
                    />
                    <Divider sx={{ mt: 1 }} />
                </Box>

                {/* ── Scrollable list only ── */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: "auto",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        alignContent: "start",
                        py: 1,
                        pr: 0.5,
                    }}
                >
                    {ALL_COLUMNS.map(({ key, label }) => (
                        <FormControlLabel
                            key={key}
                            control={
                                <Checkbox
                                    checked={selected.includes(key)}
                                    onChange={() => handleToggle(key)}
                                />
                            }
                            label={<Typography variant="body2">{label}</Typography>}
                            sx={{ mx: 0 }}
                        />
                    ))}
                </Box>

                {/* ── Pinned footer ── */}
                <Box sx={{ flexShrink: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                        <PrimaryButton
                            variant="contained"
                            onClick={handleExport}
                            disabled={isLoading || selected.length === 0}
                            startIcon={isLoading ? <CustomCircularProgress size={16} /> : null}
                        >
                            {isLoading ? "Exporting..." : "Export"}
                        </PrimaryButton>
                    </Box>
                </Box>
            </Box>
        </ModalElement>
    );
}