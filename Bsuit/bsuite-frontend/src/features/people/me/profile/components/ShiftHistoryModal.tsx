import { useState } from "react";
import { Box, Stack, Typography, CircularProgress, IconButton, Divider, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Chip } from "../../../../../components/atom/chips";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { DenseTableAtom } from "../../../../../components/tables/standard-table/DenseTableAtom";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import {
    useGetEmployeeShiftVersionsQuery,
    useAssignEmployeeShiftMutation,
    useDeleteEmployeeShiftVersionMutation,
} from "../../../time/shifts/api/shifts.api";
import { useGetShiftsQuery } from "../../../time/shifts/api/shifts.api";
import { formatDateShort } from "../../../../../utils/numberFormatter";
import dayjs, { type Dayjs } from "dayjs";

interface Props {
    open: boolean;
    onClose: () => void;
    employeeId: string | number;
    employeeName?: string;
}

function formatTimings(version: {
    shiftType: string;
    shiftFromTime?: string | null;
    shiftToTime?: string | null;
    grossHours?: number;
    breakDuration: number;
}): string {
    if (version.shiftType === "fixed" && version.shiftFromTime && version.shiftToTime) {
        const from = version.shiftFromTime.slice(0, 5);
        const to = version.shiftToTime.slice(0, 5);
        return `${from} - ${to}`;
    }
    if (version.shiftType === "flexible" && version.grossHours) {
        return `${version.grossHours} hrs/day`;
    }
    return "-";
}

function isCurrentVersion(record: {
    effectiveFromDate: string;
    effectiveToDate: string | null;
    hasEndDate: boolean;
}): boolean {
    const today = dayjs();
    const from = dayjs(record.effectiveFromDate);
    if (today.isBefore(from)) return false;
    if (!record.hasEndDate || !record.effectiveToDate) return true;
    return today.isBefore(dayjs(record.effectiveToDate).add(1, "day"));
}

export default function ShiftHistoryModal({ open, onClose, employeeId, employeeName }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [shiftId, setShiftId] = useState("");
    const [effectiveFrom, setEffectiveFrom] = useState<Dayjs | null>(null);
    const [formError, setFormError] = useState({ shiftId: false, effectiveFrom: false });

    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error";
    }>({ open: false, message: "", color: "success" });

    const showMessage = (message: string, color: "success" | "error" = "success") =>
        setSnackbar({ open: true, message, color });

    const handleClose = () => {
        setFormOpen(false);
        setShiftId("");
        setEffectiveFrom(null);
        setFormError({ shiftId: false, effectiveFrom: false });
        setDeleteTargetId(null);
        setSnackbar({ open: false, message: "", color: "success" });
        onClose();
    };

    const { data: versions = [], isLoading } = useGetEmployeeShiftVersionsQuery(employeeId, {
        skip: !open || !employeeId,
        refetchOnMountOrArgChange: true,
    });

    const { data: allShifts = [] } = useGetShiftsQuery(undefined, { skip: !open });

    const [assignShift, { isLoading: isAssigning }] = useAssignEmployeeShiftMutation();
    const [deleteShiftVersion, { isLoading: isDeleting }] = useDeleteEmployeeShiftVersionMutation();

    const shiftOptions = allShifts.map((s) => ({ value: String(s.id), label: s.shiftName }));

    const sorted = [...versions].sort(
        (a, b) => dayjs(b.effectiveFromDate).unix() - dayjs(a.effectiveFromDate).unix()
    );

    const handleToggleForm = () => {
        setFormOpen((prev) => !prev);
        setShiftId("");
        setEffectiveFrom(null);
        setFormError({ shiftId: false, effectiveFrom: false });
    };

    const handleSubmit = async () => {
        const errors = { shiftId: !shiftId, effectiveFrom: !effectiveFrom };
        setFormError(errors);
        if (errors.shiftId || errors.effectiveFrom) return;

        try {
            await assignShift({
                employeeId,
                shiftId: Number(shiftId),
                effectiveFromDate: effectiveFrom!.format("YYYY-MM-DD"),
            }).unwrap();
            showMessage("Shift assigned successfully");
            handleToggleForm();
        } catch (err: any) {
            showMessage(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to assign shift.", "error");
        }
    };

    const handleDeleteConfirm = async () => {
        if (deleteTargetId === null) return;
        try {
            await deleteShiftVersion({ shiftVersionId: deleteTargetId, employeeId }).unwrap();
            showMessage("Shift assignment deleted");
        } catch (err: any) {
            showMessage(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete shift assignment.", "error");
        } finally {
            setDeleteTargetId(null);
        }
    };

    const columns = [
        {
            id: "shiftName",
            label: "Shift Name",
            width: 200,
            render: (row: any) => {
                const current = isCurrentVersion(row);
                return (
                    <Stack spacing={0.3}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={500}>
                                {row.shiftName}
                            </Typography>
                            {current && (
                                <Chip
                                    label="Current"
                                    size="small"
                                    color="primary"
                                    sx={{ height: 18, fontSize: "0.65rem", "& .MuiChip-label": { px: 0.8 } }}
                                />
                            )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            {formatDateShort(row.effectiveFromDate)}
                            {" - "}
                            {row.hasEndDate && row.effectiveToDate
                                ? formatDateShort(row.effectiveToDate)
                                : "No end date yet"}
                        </Typography>
                    </Stack>
                );
            },
        },
        {
            id: "shiftType",
            label: "Shift Type",
            width: 100,
            render: (row: any) => (
                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {row.shiftType || "-"}
                </Typography>
            ),
        },
        {
            id: "workingDays",
            label: "Working Days",
            width: 220,
            render: (row: any) => (
                <Typography variant="body2">
                    {Array.isArray(row.workingDays) && row.workingDays.length > 0
                        ? row.workingDays.join(", ")
                        : "-"}
                </Typography>
            ),
        },
        {
            id: "timings",
            label: "Timings",
            width: 160,
            render: (row: any) => (
                <Stack spacing={0.3}>
                    <Typography variant="body2">{row.timings}</Typography>
                    {row.breakDuration > 0 && (
                        <Typography variant="caption" color="text.secondary">
                            Break: {row.breakDuration} mins
                        </Typography>
                    )}
                </Stack>
            ),
        },
        {
            id: "assignedBy",
            label: "Assigned by",
            width: 180,
            render: (row: any) => {
                const isFutureDated = dayjs(row.effectiveFromDate).isAfter(dayjs(), "day");
                return (
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack spacing={0.3}>
                            <Typography variant="body2">
                                {row.assignedByName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                on {row.assignedOn}
                            </Typography>
                        </Stack>
                        <Tooltip title={isFutureDated ? "" : "Only future-dated shift assignments can be deleted"}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    data-stop-row-click
                                    onClick={() => setDeleteTargetId(row.id)}
                                    disabled={!isFutureDated}
                                    sx={{ ml: 1 }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                );
            },
        },
    ];

    const rows = sorted.map((record) => {
        const version = record.shift.shiftVersions?.[0];
        return {
            id: record.id,
            shiftName: record.shift.shiftName,
            shiftType: version?.shiftType ?? "-",
            workingDays: version?.workingDays ?? [],
            timings: version ? formatTimings(version) : "-",
            breakDuration: version?.breakDuration ?? 0,
            effectiveFromDate: record.effectiveFromDate,
            effectiveToDate: record.effectiveToDate,
            hasEndDate: record.hasEndDate,
            assignedOn: formatDateShort(record.createdAt),
            assignedByName: record.assignedByName ?? "-",
        };
    });

    const editIcon = (
        <IconButton size="small" onClick={handleToggleForm} color={formOpen ? "primary" : "default"}>
            <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
    );

    return (
        <>
            <ModalElement
                open={open}
                onClose={handleClose}
                title={employeeName ? `Shift type assigned to ${employeeName}` : "Shift Assignment History"}
                maxWidth="lg" leftHeaderAction={editIcon}
            >
                {/* New shift details form */}
                {formOpen && (
                    <Box mb={2}>
                        <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                            New shift details
                        </Typography>
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <SingleSelectElement
                                    label="Shift Name"
                                    value={shiftId}
                                    onChange={(val) => {
                                        setShiftId(String(val));
                                        setFormError((e) => ({ ...e, shiftId: false }));
                                    }}
                                    options={shiftOptions}
                                    required
                                    error={formError.shiftId}
                                    helperText={formError.shiftId ? "Shift is required" : ""}
                                    placeholder="Select a shift to assign"
                                    fullWidth
                                />
                                <DatePickerElement
                                    label="Effective From"
                                    value={effectiveFrom}
                                    onChange={(val) => {
                                        setEffectiveFrom(val);
                                        setFormError((e) => ({ ...e, effectiveFrom: false }));
                                    }}
                                    required
                                    error={formError.effectiveFrom}
                                    helperText={formError.effectiveFrom ? "Date is required" : ""}
                                />
                            </Stack>
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <PrimaryButton variant="outlined" onClick={handleToggleForm}>
                                    Cancel
                                </PrimaryButton>
                                <PrimaryButton onClick={handleSubmit} disabled={isAssigning}>
                                    {isAssigning ? "Submitting…" : "Submit"}
                                </PrimaryButton>
                            </Stack>
                        </Stack>
                        <Divider sx={{ mt: 2, mb: 1 }} />
                    </Box>
                )}

                {/* History table */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <DenseTableAtom
                        columns={columns}
                        rows={rows}
                        loading={false}
                        emptyMessage="No shift assignment history found."
                        sx={{ maxHeight: "55vh", overflowY: "auto" }}
                    />
                )}
            </ModalElement>

            <ConfirmDialog
                open={deleteTargetId !== null}
                title="Delete shift assignment"
                message="Are you sure you want to delete this shift assignment? This action cannot be undone."
                confirmText={isDeleting ? "Deleting…" : "Delete"}
                confirmColor="error"
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDeleteConfirm}
                disableScrollLock
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                />
            )}
        </>
    );
}
