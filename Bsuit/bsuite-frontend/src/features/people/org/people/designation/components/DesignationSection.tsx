import { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import {
    Box,
    Stack,
    Typography,
    IconButton,
    useTheme,
    alpha,
    Avatar,
} from "@mui/material";
import { Chip } from "../../../../../../components/atom/chips";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BadgeIcon from "@mui/icons-material/Badge";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Shared Components
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import { Snackbar } from "../../../../../../components/atom/snackbar/Snackbar";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";

import {
    useCreateDesignationMutation,
    useUpdateDesignationMutation,
    useDeleteDesignationMutation,
    useGetDesignationEmployeesQuery,
} from "../api/designation.api";
import { usePeopleContext } from "../../context/PeopleContext";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { DenseTableAtom } from "../../../../../../components/tables/standard-table/DenseTableAtom";
// import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";

function normalizeEmployeeStatusKey(status: string): string {
    return status.trim().toLowerCase().replace(/\s+/g, "_");
}

/** e.g. `invitation_sent` → `Invitation Sent` */
function formatEmployeeStatusLabel(status: string): string {
    const t = status.trim();
    if (!t || t === "-") return t;
    return t
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

function getEmployeeStatusChipColor(
    statusKey: string,
): "success" | "error" | "warning" | "primary" | "info" {
    if (statusKey === "invitation_sent") return "info";
    if (statusKey === "active") return "success";
    if (
        ["inactive", "terminated", "left", "exit_requested", "relieved"].includes(
            statusKey,
        )
    ) {
        return "error";
    }
    if (["onboarding", "probation", "draft", "in_notice_period"].includes(statusKey)) {
        return "warning";
    }
    return "primary";
}

export interface DesignationSectionRef {
    openAddModal: () => void;
}

interface DesignationSectionProps {
    searchQuery?: string;
}

type DesignationItem = { id: number; designationName: string };

export const DesignationSection = forwardRef<DesignationSectionRef, DesignationSectionProps>(
    ({ searchQuery = "" }, ref) => {
        const theme = useTheme();
        const { designation: designationSlice } = usePeopleContext();
        const designationData = designationSlice.data;
        const isLoading = designationSlice.isLoading;
        const [createDesignation] = useCreateDesignationMutation();
        const [updateDesignation] = useUpdateDesignationMutation();
        const [deleteDesignation] = useDeleteDesignationMutation();

        const [openDialog, setOpenDialog] = useState(false);
        const [editingItem, setEditingItem] = useState<{ id: number; designationName: string } | null>(null);
        const [name, setName] = useState("");

        const [deleteId, setDeleteId] = useState<number | null>(null);

        // Selection state
        const [selectedDesignation, setSelectedDesignation] = useState<{ id: number; designationName: string } | null>(null);

        const { data: designationEmployeesData, isLoading: isLoadingDesignationEmployees } = useGetDesignationEmployeesQuery(selectedDesignation?.id as number, {
            skip: !selectedDesignation,
        });

        // Menu state
        const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
        const [activeDesignation, setActiveDesignation] = useState<{ id: number; designationName: string } | null>(null);

        // Snackbar state
        const [snackbar, setSnackbar] = useState<{
            open: boolean;
            message: string;
            color: "success" | "error" | "info" | "warning";
        }>({
            open: false,
            message: "",
            color: "info",
        });

        const handleCloseSnackbar = () => {
            setSnackbar((prev) => ({ ...prev, open: false }));
        };

        const showSnackbar = (message: string, color: "success" | "error" = "success") => {
            setSnackbar({ open: true, message, color });
        };

        const handleOpenObj = (item?: { id: number; designationName: string }) => {
            if (item) {
                setEditingItem(item);
                setName(item.designationName);
            } else {
                setEditingItem(null);
                setName("");
            }
            setOpenDialog(true);
        };

        // Expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            openAddModal: () => handleOpenObj(),
        }));

        const handleSave = async () => {
            try {
                if (editingItem) {
                    await updateDesignation({ id: editingItem.id, designationName: name }).unwrap();
                    showSnackbar("Designation updated successfully");
                    setSelectedDesignation((prev) =>
                        prev?.id === editingItem.id
                            ? { ...prev, designationName: name.trim() }
                            : prev
                    );
                } else {
                    await createDesignation({ designationName: name }).unwrap();
                    showSnackbar("Designation created successfully");
                }
                setOpenDialog(false);
            } catch (error: any) {
                console.error("Failed to save designation", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to save designation.";
                showSnackbar(errorMsg, "error");
            }
        };

        const handleDelete = async () => {
            if (deleteId) {
                try {
                    await deleteDesignation(deleteId).unwrap();
                    showSnackbar("Designation deleted successfully");
                    setDeleteId(null);
                    // Close details panel if the selected designation was deleted
                    if (selectedDesignation?.id === deleteId) {
                        setSelectedDesignation(null);
                    }
                } catch (error: any) {
                    console.error("Failed to delete designation", error);
                    const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to delete designation.";
                    showSnackbar(errorMsg, "error");
                    setDeleteId(null);
                }
            }
        };

        const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, designation: { id: number; designationName: string }) => {
            event.stopPropagation();
            setMenuAnchor(event.currentTarget);
            setActiveDesignation(designation);
        };

        const handleCloseMenu = () => {
            setMenuAnchor(null);
            setActiveDesignation(null);
        };

        const menuItems = activeDesignation ? [
            {
                label: "Edit",
                icon: <EditIcon fontSize="small" />,
                onClick: () => {
                    handleOpenObj(activeDesignation);
                    handleCloseMenu();
                }
            },
            {
                label: "Delete",
                icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
                onClick: () => {
                    setDeleteId(activeDesignation.id);
                    handleCloseMenu();
                }
            }
        ] : [];

        const allRows = designationData?.data || [];
        const rows = [...allRows]
            .sort((a, b) => b.id - a.id)
            .filter((item) =>
                item.designationName.toLowerCase().includes(searchQuery.toLowerCase())
            );

        /** Latest name from context list so the employees panel updates after rename */
        const selectedDesignationDisplay = useMemo(() => {
            if (!selectedDesignation) return null;
            return allRows.find((r) => r.id === selectedDesignation.id) ?? selectedDesignation;
        }, [allRows, selectedDesignation]);

        // While searching: show employees for the top matching designation. When search is cleared, keep selection if it still exists, else first row.
        useEffect(() => {
            if (rows.length === 0) {
                setSelectedDesignation(null);
                return;
            }
            const q = searchQuery.trim();
            if (q !== "") {
                const top = rows[0];
                if (selectedDesignation?.id !== top.id) {
                    setSelectedDesignation(top);
                }
                return;
            }
            const selectedOk =
                selectedDesignation != null && rows.some((r) => r.id === selectedDesignation.id);
            if (!selectedOk) {
                setSelectedDesignation(rows[0]);
            }
        }, [searchQuery, rows, selectedDesignation]);

        // Dense Table Columns
        const tableColumns = [
            {
                id: "name",
                label: "Employee Name",
                width: 300,
                render: (row: any) => (
                    <Stack direction="row" gap={2} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>{(row.name && row.name !== "-") ? row.name.charAt(0).toUpperCase() : "?"}</Avatar>
                        <Stack>
                            <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                        </Stack>
                    </Stack>
                ),
            },

            {
                id: "status",
                label: "Status",
                minWidth: 140,
                render: (row: any) => {
                    if (!row.status || row.status === "-") {
                        return (
                            <Typography variant="body2" color="text.secondary">
                                -
                            </Typography>
                        );
                    }
                    const statusKey = normalizeEmployeeStatusKey(String(row.status));
                    return (
                        <Chip
                            label={formatEmployeeStatusLabel(String(row.status))}
                            size="small"
                            color={getEmployeeStatusChipColor(statusKey)}
                            sx={{
                                height: 24,
                                fontSize: "0.75rem",
                                width: "fit-content",
                                maxWidth: "100%",
                                "& .MuiChip-label": {
                                    px: 1.25,
                                    whiteSpace: "nowrap",
                                },
                            }}
                        />
                    );
                },
            }
        ];

        return (
            <Box sx={{ width: "100%", }}>
                {isLoading ? (
                    <Stack alignItems="center" justifyContent="center" py={6}>
                        <CustomCircularProgress size={24} />
                    </Stack>
                ) : rows.length === 0 ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 400px)" }}>
                        <Typography variant="body2" color="text.secondary">
                            No designation found
                        </Typography>
                    </Box>
                ) : (
                    <Box display={"flex"} width={"100%"} gap={1}>
                        <Box sx={{ width: "30%", py: 1 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%",
                                }}
                            >
                                <Stack gap={0.5} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
                                    {rows.map((designation) => (
                                        <DesignationListItem
                                            key={designation.id}
                                            designation={designation}
                                            selected={selectedDesignation?.id === designation.id}
                                            onClick={() => setSelectedDesignation(designation)}
                                            onEdit={(d) => { handleOpenObj(d); }}
                                            onDelete={(id) => { setDeleteId(id); }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Box>

                        <Box sx={{ width: "70%" }}>
                            <Box sx={{ p: 2, height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                                {selectedDesignation && selectedDesignationDisplay ? (
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6">
                                                Employees in {selectedDesignationDisplay.designationName}
                                            </Typography>
                                        </Stack>
                                        <DenseTableAtom
                                            columns={tableColumns}
                                            rows={(designationEmployeesData?.data || []).map((emp: any) => ({
                                                id: emp.employeeId || emp.id || "-",
                                                name: emp.contact?.name || emp.nameAsPerAadhar || emp.nameAsPerPan || emp.name || "-",
                                                designation:
                                                    emp.designation?.designationName ||
                                                    emp.designation ||
                                                    selectedDesignationDisplay.designationName ||
                                                    "-",
                                                department: emp.department?.departmentName || emp.department || "-",
                                                status: emp.status || "-",
                                            }))}
                                            loading={isLoadingDesignationEmployees}
                                        />
                                    </Box>
                                ) : (
                                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "center", height: "100%", flexGrow: 1, pt: 10 }}>
                                        <Typography variant="body1" color="text.secondary">Select a designation to view details</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box >
                )}

                {/* Menu */}
                <MenuAtom
                    items={menuItems}
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onCloseAll={handleCloseMenu}
                />

                {/* Add/Edit Dialog */}
                <ModalElement
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    title={editingItem ? "Edit Designation" : "Add Designation"}
                    onClick={handleSave}
                    maxWidth="sm"
                    disabled={!name.trim() || (editingItem ? name === editingItem.designationName : false)}
                >
                    <TextFieldElement
                        name="designationName"
                        label="Designation Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </ModalElement>

                {/* Delete Confirmation */}
                <ConfirmDialog
                    open={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    title="Delete Designation"
                    message="Are you sure you want to delete this designation?"
                    confirmText="Delete"
                    confirmColor="error"
                />

                {/* Snackbar Notifications */}
                {
                    snackbar.open && (
                        <Snackbar
                            message={snackbar.message}
                            color={snackbar.color}
                            onClose={handleCloseSnackbar}
                            autoClose={6000}
                        />
                    )
                }
            </Box >
        );
    }
);

function DesignationListItem({
    designation,
    selected,
    onClick,
    onEdit,
    onDelete,
}: {
    designation: DesignationItem;
    selected: boolean;
    onClick: () => void;
    onEdit: (designation: DesignationItem) => void;
    onDelete: (id: number) => void;
}) {
    const theme = useTheme();
    const [menuAnchor, setMenuAnchor] = useState(null);
    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };
    const handleMenuClose = () => setMenuAnchor(null);
    const menuItems = [
        { label: "Edit", onClick: () => { onEdit(designation); handleMenuClose(); } },
        { label: "Delete", onClick: () => { onDelete(designation.id); handleMenuClose(); } },
    ];
    return (
        <Box
            onClick={onClick}
            sx={{
                px: 1.5, py: 1,
                borderRadius: 1.5,
                cursor: "pointer",
                border: "1px solid",
                borderColor: "transparent",
                bgcolor: selected
                    ? alpha(theme.palette.primary.main, 0.15)
                    : "transparent",
                "&:hover": {
                    bgcolor: selected ? "primary.50" : "action.hover",
                },
                transition: "all 0.15s ease",
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap={1.5} alignItems="center" flex={1} sx={{ minWidth: 0 }}>
                    <Box sx={{
                        p: 0.75, borderRadius: 1.5, display: "flex",
                        bgcolor: selected
                            ? alpha(theme.palette.primary.main, 0.24)
                            : "action.hover",
                        color: "primary.main",
                    }}>
                        <BadgeIcon fontSize="small" />
                    </Box>
                    <Typography
                        variant="body2"
                        fontWeight={selected ? 600 : 400}
                        color={selected ? "primary.main" : "text.primary"}
                        noWrap
                        sx={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}
                    >
                        {designation.designationName}
                    </Typography>
                </Stack>
                <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
                <MenuAtom anchorEl={menuAnchor} open={Boolean(menuAnchor)}
                    items={menuItems} onCloseAll={handleMenuClose} />
            </Stack>
        </Box>
    );
}

DesignationSection.displayName = "DesignationSection";
