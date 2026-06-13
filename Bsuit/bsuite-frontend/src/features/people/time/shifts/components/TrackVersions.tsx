import { Box, Typography, Stack } from "@mui/material";
import {
    AccessTime,
    CalendarMonth,
    Timer,
    InfoOutlined,
    EventNote,
    PersonOutline,
} from "@mui/icons-material";
import { useState } from "react";
import type { IShift, IShiftVersion } from "../api/shifts.api";
import { useDeleteShiftVersionMutation } from "../api/shifts.api";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { Chip } from "../../../../../components/atom/chips";
import {
    formatDateShort,
    formatDateTimeShort,
    formatShiftTimeRange12h,
} from "../../../../../utils/numberFormatter";
import { getActiveShiftVersion, isFlexibleShiftType } from "../shiftForm.utils";
import { InfoGridCard } from "./InfoGridCard";

interface TrackVersionsProps {
    shift: IShift;
    onEdit: (version: IShiftVersion) => void;
}

export default function TrackVersions({ shift, onEdit }: TrackVersionsProps) {
    const [deleteVersion] = useDeleteShiftVersionMutation();
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [versionToDelete, setVersionToDelete] = useState<number | null>(null);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", color: "info" });

    const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));
    const showSnackbar = (message: string, color: "success" | "error" = "success") =>
        setSnackbar({ open: true, message, color });

    const handleDeleteVersion = (versionId: number) => {
        setVersionToDelete(versionId);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (versionToDelete) {
            try {
                await deleteVersion(versionToDelete).unwrap();
                showSnackbar("Shift version deleted successfully");
            } catch (error: any) {
                const errorMsg =
                    error?.data?.message ?? error?.error ?? error?.message ?? "Failed to delete shift version.";
                showSnackbar(errorMsg, "error");
            }
        }
        setConfirmDeleteOpen(false);
        setVersionToDelete(null);
    };

    const versions = shift.shiftVersions || [];
    const sortedVersions = [...versions].sort(
        (a, b) => new Date(b.effectiveFromDate).getTime() - new Date(a.effectiveFromDate).getTime(),
    );

    const activeVersion = getActiveShiftVersion(versions);

    return (
        <Box>
            {sortedVersions.length === 0 ? (
                <Typography color="text.secondary">No versions available</Typography>
            ) : (
                <Stack spacing={1.5}>
                    {sortedVersions.map((version) => {
                        const isActive = activeVersion?.id === version.id;
                        const isFixed = !isFlexibleShiftType(version.shiftType);

                        const rows = [
                            { icon: <InfoOutlined fontSize="small" />, label: "Type", value: isFixed ? "Fixed" : "Flexible" },
                            { icon: <CalendarMonth fontSize="small" />, label: "Working Days", value: version.workingDays.join(", ") },
                            {
                                icon: <AccessTime fontSize="small" />,
                                label: isFixed ? "Timings" : "Gross Hours",
                                value: isFixed
                                    ? formatShiftTimeRange12h(version.shiftFromTime, version.shiftToTime)
                                    : `${version.grossHours} hrs`,
                            },
                            { icon: <Timer fontSize="small" />, label: "Break", value: `${version.breakDuration} mins` },
                            { icon: <EventNote fontSize="small" />, label: "Effective From", value: formatDateShort(version.effectiveFromDate) },
                            {
                                icon: <PersonOutline fontSize="small" />,
                                label: "Updated By",
                                value: `${version.updatedByName ?? "-"} · ${formatDateTimeShort(version.updatedAt)}`,
                            },
                        ];

                        return (
                            <InfoGridCard
                                key={version.id}
                                title={version.shiftVersionName}
                                rows={rows}
                                columns={3}
                                collapsible
                                defaultExpanded={isActive}
                                headerExtra={isActive ? <Chip size="small" label="Active" color="success" /> : undefined}
                                onEdit={() => onEdit(version)}
                                onDelete={() => handleDeleteVersion(version.id)}
                                deleteDisabled={isActive}
                                deleteDisabledTitle="Cannot delete the active version"
                            />
                        );
                    })}
                </Stack>
            )}

            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Delete Version"
                message="Are you sure you want to delete this shift version? This action cannot be undone."
                onClose={() => { setConfirmDeleteOpen(false); setVersionToDelete(null); }}
                onConfirm={confirmDelete}
                confirmText="Delete"
                confirmColor="error"
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={handleCloseSnackbar}
                    autoClose={6000}
                />
            )}
        </Box>
    );
}