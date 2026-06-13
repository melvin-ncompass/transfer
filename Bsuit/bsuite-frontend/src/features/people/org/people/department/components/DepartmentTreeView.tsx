import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
    Box,
    Stack,
    Typography,
    IconButton,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Paper,
    useTheme,
    alpha,
    Avatar,
} from "@mui/material";
import { Chip } from "../../../../../../components/atom/chips";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";


// Shared Components
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import { DenseTableAtom } from "../../../../../../components/tables/standard-table/DenseTableAtom"; // Import DenseTableAtom
import { Snackbar } from "../../../../../../components/atom/snackbar/Snackbar";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";

import {
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation,
} from "../api/department.api";

import {
    useGetAllSubDepartmentsByDepartmentIdQuery,
    useLazyGetAllSubDepartmentsByDepartmentIdQuery,
    useCreateSubDepartmentMutation,
    useUpdateSubDepartmentMutation,
    useDeleteSubDepartmentMutation,
    useGetSubDepartmentEmployeesQuery,
} from "../sub-department/api/sub-department.api";
import { useGetDepartmentEmployeesQuery } from "../api/department.api";
import { usePeopleContext } from "../../context/PeopleContext";

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

interface DepartmentItemProps {
    department: {
        id: number;
        departmentName: string;
    };
    onEditDepartment: (dept: { id: number; departmentName: string }) => void;
    onDeleteDepartment: (id: number) => void;
    onAddSubDepartment: (deptId: number) => void;
    onEditSubDepartment: (sub: { id: number; subDepartmentName: string; department?: { id: number } }) => void;
    onDeleteSubDepartment: (payload: { id: number; departmentId: number }) => void;
    searchQuery: string;
    onSelectSubDepartment: (sub: { id: number; subDepartmentName: string }) => void;
    selectedSubId: number | null;
    onSelectDepartment: (dept: { id: number; departmentName: string }) => void; // New Prop
    selectedDeptId?: number | null; // New Prop for highlighting
}

function DepartmentItem({
    department,
    onEditDepartment,
    onDeleteDepartment,
    onAddSubDepartment,
    onEditSubDepartment,
    onDeleteSubDepartment,
    searchQuery,
    onSelectSubDepartment,
    selectedSubId,
    onSelectDepartment,
    selectedDeptId,
}: DepartmentItemProps) {
    const theme = useTheme();

    // Auto-expand if subdepartment matches search
    const [expanded, setExpanded] = useState(searchQuery.trim() !== "");

    // Always fetch so expand control can reflect whether sub-departments exist
    const { data: subData, isFetching: isFetchingSubDepartments } =
        useGetAllSubDepartmentsByDepartmentIdQuery(department.id);
    const allSubDepartments = subData?.data || [];
    const hasSubDepartments = allSubDepartments.length > 0;
    const subDepartments = [...allSubDepartments]
        .sort((a, b) => b.id - a.id)
        .filter(sub =>
            sub.subDepartmentName.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Check if any subdepartment matches the search query
    const hasMatchingSubDepartment = searchQuery.trim() !== "" && subDepartments.length > 0;

    // Menu State - Must declare all hooks before any conditional returns
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuType, setMenuType] = useState<"department" | "subDepartment" | null>(null);
    const [activeSub, setActiveSub] = useState<{ id: number; subDepartmentName: string } | null>(null);

    // Update expansion when search changes
    useEffect(() => {
        if (hasMatchingSubDepartment) {
            setExpanded(true);
        }
    }, [hasMatchingSubDepartment]);

    // Hide this department if search is active and neither dept name nor any subdept matches
    const departmentNameMatches = department.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery.trim() !== "" && !departmentNameMatches && subDepartments.length === 0) {
        return null;
    }

    const handleOpenDeptMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setMenuType("department");
    };

    const handleOpenSubMenu = (event: React.MouseEvent<HTMLButtonElement>, sub: any) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setMenuType("subDepartment");
        setActiveSub(sub);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setMenuType(null);
        setActiveSub(null);
    };

    // Note: subDepartments is already defined and filtered above, no need to redefine
    // Menu Items
    const getMenuItems = () => {
        if (menuType === "department") {
            return [
                {
                    label: "Add Sub-department",
                    icon: <AddIcon fontSize="small" />,
                    onClick: () => {
                        onAddSubDepartment(department.id);
                        handleCloseMenu();
                    }
                },
                {
                    label: "Edit",
                    icon: <EditIcon fontSize="small" />,
                    onClick: () => {
                        onEditDepartment(department);
                        handleCloseMenu();
                    }
                },
                {
                    label: "Delete",
                    icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
                    onClick: () => {
                        onDeleteDepartment(department.id);
                        handleCloseMenu();
                    }
                }
            ];
        } else if (menuType === "subDepartment" && activeSub) {
            return [
                {
                    label: "Edit",
                    icon: <EditIcon fontSize="small" />,
                    onClick: () => {
                        onEditSubDepartment(activeSub as any);
                        handleCloseMenu();
                    }
                },
                {
                    label: "Delete",
                    icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
                    onClick: () => {
                        onDeleteSubDepartment({
                            id: activeSub.id,
                            departmentId: department.id,
                        });
                        handleCloseMenu();
                    }
                }
            ];
        }
        return [];
    };

    const isDeptSelected = selectedDeptId === department.id;

    return (
        <Box>
            <Box
                onClick={() => onSelectDepartment(department)}
                sx={{
                    px: 1.5, py: 1,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: "transparent",
                    bgcolor: isDeptSelected ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                    "&:hover": { bgcolor: isDeptSelected ? "primary.50" : "action.hover" },
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <IconButton
                    size="small"
                    aria-label={
                        expanded
                            ? `Collapse sub-departments for ${department.departmentName}`
                            : `Expand sub-departments for ${department.departmentName}`
                    }
                    sx={{
                        mr: 1,
                        visibility: hasSubDepartments || isFetchingSubDepartments ? "visible" : "hidden",
                    }}
                    disabled={!hasSubDepartments && !isFetchingSubDepartments}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!hasSubDepartments) return;
                        setExpanded((prev) => !prev);
                    }}
                >
                    {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>

                <Typography
                    variant="body2"
                    fontWeight={isDeptSelected ? 600 : 500}
                    color={isDeptSelected ? "primary.main" : "text.primary"}
                    sx={{ flex: 1 }}
                >
                    {department.departmentName}
                </Typography>

                <IconButton size="small" onClick={handleOpenDeptMenu}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            <Collapse in={expanded && hasSubDepartments} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {isFetchingSubDepartments && subDepartments.length === 0 ? (
                        <ListItem sx={{ pl: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                                Loading sub-departments…
                            </Typography>
                        </ListItem>
                    ) : subDepartments.length === 0 ? (
                        <ListItem sx={{ pl: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                                No sub-departments
                            </Typography>
                        </ListItem>
                    ) : (
                        subDepartments.map((sub) => (
                            <Box key={sub.id}>
                                <Box
                                    onClick={() => onSelectSubDepartment(sub)}
                                    sx={{
                                        pl: 6, pr: 1.5, py: 0.75,
                                        borderRadius: 1.5,
                                        cursor: "pointer",
                                        border: "1px solid",
                                        borderColor: "transparent",
                                        bgcolor: selectedSubId === sub.id ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                                        "&:hover": { bgcolor: selectedSubId === sub.id ? "primary.50" : "action.hover" },
                                        transition: "all 0.15s ease",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <SubdirectoryArrowRightIcon
                                        sx={{
                                            mr: 1,
                                            fontSize: 20,
                                            color: selectedSubId === sub.id ? "primary.main" : "text.secondary",
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        fontWeight={selectedSubId === sub.id ? 600 : 400}
                                        color={selectedSubId === sub.id ? "primary.main" : "text.primary"}
                                        sx={{ flex: 1 }}
                                    >
                                        {sub.subDepartmentName}
                                    </Typography>
                                    <IconButton size="small" onClick={(e) => handleOpenSubMenu(e, sub)}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))
                    )}
                </List>
            </Collapse>
            <Divider sx={{ my: 0.5 }} />

            <MenuAtom
                items={getMenuItems()}
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onCloseAll={handleCloseMenu}
            />
        </Box>
    );
}

export interface DepartmentTreeViewRef {
    openAddModal: () => void;
}

interface DepartmentTreeViewProps {
    searchQuery?: string;
}

export const DepartmentTreeView = forwardRef<DepartmentTreeViewRef, DepartmentTreeViewProps>(
    ({ searchQuery = "" }, ref) => {
        const { department: departmentSlice } = usePeopleContext();
        const departmentData = departmentSlice.data;
        const departments = [...(departmentData?.data || [])].sort((a, b) => b.id - a.id);

        const [createDepartment] = useCreateDepartmentMutation();
        const [updateDepartment] = useUpdateDepartmentMutation();
        const [deleteDepartment] = useDeleteDepartmentMutation();

        const [createSubDepartment] = useCreateSubDepartmentMutation();
        const [updateSubDepartment] = useUpdateSubDepartmentMutation();
        const [deleteSubDepartment] = useDeleteSubDepartmentMutation();
        const [triggerGetSubDepartments] = useLazyGetAllSubDepartmentsByDepartmentIdQuery();

        // Department dialog state
        const [openDeptDialog, setOpenDeptDialog] = useState(false);
        const [editingDept, setEditingDept] = useState<{ id: number; departmentName: string } | null>(null);
        const [deptName, setDeptName] = useState("");

        // SubDepartment dialog state
        const [openSubDialog, setOpenSubDialog] = useState(false);
        const [editingSub, setEditingSub] = useState<{ id: number; subDepartmentName: string; department?: { id: number } } | null>(null);
        const [subName, setSubName] = useState("");
        const [selectedDeptId, setSelectedDeptId] = useState<number | "">("");

        // Selection state
        const [selectedSub, setSelectedSub] = useState<{ id: number; subDepartmentName: string; department: { id: number } } | null>(null);
        const [selectedDept, setSelectedDept] = useState<{ id: number; departmentName: string } | null>(null);

        const { data: deptEmployeesData, isLoading: isLoadingDeptEmployees } = useGetDepartmentEmployeesQuery(selectedDept?.id as number, {
            skip: !selectedDept,
        });

        const { data: subDeptEmployeesData, isLoading: isLoadingSubDeptEmployees } = useGetSubDepartmentEmployeesQuery(selectedSub?.id as number, {
            skip: !selectedSub,
        });

        // Delete confirmation state
        const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
        const [deleteSubTarget, setDeleteSubTarget] = useState<{
            id: number;
            departmentId: number;
        } | null>(null);

        // Hide right panel state
        const [hideRightPanel, setHideRightPanel] = useState(false);

        useEffect(() => {
            if (searchQuery.trim() !== "") {
                setHideRightPanel(true);
            } else {
                setHideRightPanel(false);
            }
        }, [searchQuery]);

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

        // Expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            openAddModal: () => {
                setEditingDept(null);
                setDeptName("");
                setOpenDeptDialog(true);
            },
        }));

        const handleCloseSnackbar = () => {
            setSnackbar((prev) => ({ ...prev, open: false }));
        };

        const showSnackbar = (message: string, color: "success" | "error" = "success") => {
            setSnackbar({ open: true, message, color });
        };

        // Department handlers
        const handleOpenDeptDialog = (dept?: { id: number; departmentName: string }) => {
            if (dept) {
                setEditingDept(dept);
                setDeptName(dept.departmentName);
            } else {
                setEditingDept(null);
                setDeptName("");
            }
            setOpenDeptDialog(true);
        };

        const handleSaveDept = async () => {
            if (!deptName.trim()) return;
            try {
                if (editingDept) {
                    await updateDepartment({ id: editingDept.id, departmentName: deptName }).unwrap();
                    showSnackbar("Department updated successfully");
                    setSelectedDept((prev) =>
                        prev?.id === editingDept.id
                            ? { ...prev, departmentName: deptName.trim() }
                            : prev
                    );
                } else {
                    await createDepartment({ departmentName: deptName }).unwrap();
                    showSnackbar("Department created successfully");
                }
                setOpenDeptDialog(false);
                setDeptName("");
                setEditingDept(null);
            } catch (error: any) {
                console.error("Failed to save department", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to save department.";
                showSnackbar(errorMsg, "error");
            }
        };

        const handleDeleteDept = async () => {
            if (!deleteDeptId) return;
            try {
                // Fetch sub-departments for the department being deleted
                const subDepartmentsResponse = await triggerGetSubDepartments(deleteDeptId).unwrap();
                const subDepartmentsToDelete = subDepartmentsResponse.data || [];

                // Delete all associated sub-departments first
                for (const sub of subDepartmentsToDelete) {
                    await deleteSubDepartment({
                        id: sub.id,
                        departmentId: deleteDeptId,
                    }).unwrap();
                }

                // Then delete the department
                await deleteDepartment(deleteDeptId).unwrap();
                showSnackbar("Department and its sub-departments deleted successfully");
                setDeleteDeptId(null);

                // Close details panel if the selected sub-department belonged to the deleted department
                if (selectedSub && subDepartmentsToDelete.some((sub: { id: number; }) => sub.id === selectedSub.id)) {
                    setSelectedSub(null);
                }
                if (selectedDept?.id === deleteDeptId) setSelectedDept(null);

            } catch (error: any) {
                console.error("Failed to delete department or its sub-departments", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to delete department. It may contain sub-departments or an unexpected error occurred.";
                showSnackbar(errorMsg, "error");
                setDeleteDeptId(null);
            }
        };

        // SubDepartment handlers
        const handleOpenSubDialog = (deptId: number, sub?: { id: number; subDepartmentName: string; department?: { id: number } }) => {
            setSelectedDeptId(deptId);
            if (sub) {
                setEditingSub({ ...sub, department: sub.department || { id: deptId } } as any);
                setSubName(sub.subDepartmentName);
                setSelectedDeptId(sub.department?.id || deptId);
            } else {
                setEditingSub(null);
                setSubName("");
                setSelectedDeptId(deptId);
            }
            setOpenSubDialog(true);
        };

        const handleSaveSub = async () => {
            if (!subName.trim() || !selectedDeptId) return;
            try {
                if (editingSub) {
                    await updateSubDepartment({
                        id: editingSub.id,
                        subDepartmentName: subName,
                    }).unwrap();
                    showSnackbar("Sub-department updated successfully");
                    setSelectedSub((prev) =>
                        prev?.id === editingSub.id
                            ? { ...prev, subDepartmentName: subName.trim() }
                            : prev
                    );
                } else {
                    await createSubDepartment({
                        subDepartmentName: subName,
                        departmentId: Number(selectedDeptId),
                    }).unwrap();
                    showSnackbar("Sub-department created successfully");
                }
                setOpenSubDialog(false);
                setSubName("");
                setEditingSub(null);
            } catch (error: any) {
                console.error("Failed to save subdepartment", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to save sub-department.";
                showSnackbar(errorMsg, "error");
            }
        };

        const handleDeleteSub = async () => {
            if (!deleteSubTarget) return;
            try {
                await deleteSubDepartment(deleteSubTarget).unwrap();
                showSnackbar("Sub-department deleted successfully");
                if (selectedSub?.id === deleteSubTarget.id) {
                    setSelectedSub(null);
                }
                setDeleteSubTarget(null);
            } catch (error: any) {
                console.error("Failed to delete sub-department", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to delete sub-department.";
                showSnackbar(errorMsg, "error");
                setDeleteSubTarget(null);
            }
        };

        const departmentOptions = departments.map((d) => ({
            label: d.departmentName,
            value: String(d.id),
        }));

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
                    if (!row.status || row.status === "-") return <Typography variant="body2" color="text.secondary">-</Typography>;
                    const statusKey = normalizeEmployeeStatusKey(String(row.status));
                    return <Chip
                        label={formatEmployeeStatusLabel(String(row.status))}
                        size="small"
                        color={statusKey === "active" ? "success" : "info"}
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
                }
            }
        ];

        // Helper function to check if department should be shown
        const shouldShowDepartment = (dept: any) => {
            // Show if department name matches
            if (dept.departmentName.toLowerCase().includes(searchQuery.toLowerCase())) {
                return true;
            }
            // Show if any subdepartment matches (will be checked in DepartmentItem)
            return searchQuery.trim() !== "";
        };

        const filteredDepartments = departments.filter(shouldShowDepartment);

        // Auto-select first department if nothing is selected
        useEffect(() => {
            if (!selectedDept && !selectedSub && filteredDepartments.length > 0) {
                setSelectedDept(filteredDepartments[0]);
            }
        }, [filteredDepartments, selectedDept, selectedSub]);
        if (departmentSlice.isLoading) {
            return (
                <Stack alignItems="center" justifyContent="center" py={6}>
                    <CustomCircularProgress size={24} />
                </Stack>
            );
        }

        const selectedEntityName = selectedSub
            ? selectedSub.subDepartmentName
            : selectedDept
                ? selectedDept.departmentName
                : null;

        return (
            <Box sx={{ width: "100%" }}>
                {
                    filteredDepartments.length === 0 ||
                        (filteredDepartments.length > 0 &&
                            !filteredDepartments.some((dept) => {
                                const deptMatch = dept.departmentName
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase());

                                return deptMatch;
                            }) &&
                            searchQuery.trim() !== "") ? (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "calc(100vh - 400px)",
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                No department found
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
                                    <List className="department-list" sx={{
                                        borderRadius: 1,
                                        flex: 1,
                                        minHeight: 0,
                                        maxHeight: "50vh",
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                        pr: 1
                                    }}>
                                        {filteredDepartments.map((dept) => (
                                            <DepartmentItem
                                                key={dept.id}
                                                department={dept}
                                                searchQuery={searchQuery}
                                                onEditDepartment={handleOpenDeptDialog}
                                                onDeleteDepartment={setDeleteDeptId}
                                                onAddSubDepartment={(deptId) => handleOpenSubDialog(deptId)}
                                                onEditSubDepartment={(sub) => handleOpenSubDialog(dept.id, sub)}
                                                onDeleteSubDepartment={setDeleteSubTarget}
                                                onSelectSubDepartment={(sub) => {
                                                    setSelectedSub(sub as any);
                                                    setSelectedDept(null);
                                                    setHideRightPanel(false);
                                                }}
                                                selectedSubId={selectedSub?.id || null}
                                                onSelectDepartment={(dept) => {
                                                    setSelectedDept(dept);
                                                    setSelectedSub(null);
                                                    setHideRightPanel(false);
                                                }}
                                                selectedDeptId={selectedDept?.id || null}
                                            />
                                        ))}
                                    </List>
                                </Box>
                            </Box>

                            <Box sx={{ width: "70%", visibility: hideRightPanel ? "hidden" : "visible" }}>
                                <Paper sx={{ p: 2, height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                                    {selectedEntityName ? (
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Typography variant="h6">Employees in {selectedEntityName}</Typography>
                                            </Stack>
                                            <DenseTableAtom
                                                columns={tableColumns}
                                                rows={(selectedSub ? subDeptEmployeesData?.data || [] : selectedDept ? deptEmployeesData?.data || [] : []).map((emp: any) => ({
                                                    id: emp.employeeId || emp.id || "-",
                                                    name: emp.contact?.name || emp.nameAsPerAadhar || emp.nameAsPerPan || emp.name || "-",
                                                    designation: emp.designation?.designationName || emp.designation || "-",
                                                    department: emp.department?.departmentName || emp.department || selectedDept?.departmentName || selectedSub?.department?.id || "-",
                                                    status: emp.status || "-",
                                                }))}
                                                loading={selectedSub ? isLoadingSubDeptEmployees : selectedDept ? isLoadingDeptEmployees : false}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "center", height: "100%", flexGrow: 1, pt: 10 }}>
                                            <Typography variant="body1" color="text.secondary">Select a department or sub-department to view details</Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        </Box >
                    )
                }

                {/* Department Dialog */}
                <ModalElement
                    open={openDeptDialog}
                    onClose={() => setOpenDeptDialog(false)}
                    title={editingDept ? "Edit Department" : "Add Department"}
                    onClick={handleSaveDept}
                    maxWidth="sm"
                    disabled={!deptName.trim() || (editingDept ? deptName === editingDept.departmentName : false)}
                >
                    <TextFieldElement
                        name="departmentName"
                        label="Department Name"
                        fullWidth
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </ModalElement>

                {/* SubDepartment Dialog */}
                <ModalElement
                    open={openSubDialog}
                    onClose={() => setOpenSubDialog(false)}
                    title={editingSub ? "Edit Sub-Department" : "Add Sub-Department"}
                    onClick={handleSaveSub}
                    maxWidth="sm"
                    disabled={
                        !subName.trim() ||
                        !selectedDeptId ||
                        (editingSub
                            ? subName === editingSub.subDepartmentName &&
                            Number(selectedDeptId) === (editingSub.department?.id || 0)
                            : false)
                    }
                >
                    <Stack spacing={2} mt={1}>
                        <TextFieldElement
                            name="subDepartmentName"
                            label="Sub-Department Name"
                            fullWidth
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                        />
                        <SingleSelectElement
                            label="Parent Department"
                            value={selectedDeptId ? String(selectedDeptId) : ""}
                            onChange={(val) => setSelectedDeptId(Number(val) || "")}
                            options={departmentOptions}
                            fullWidth
                            disabled={!!editingSub}
                        />
                    </Stack>
                </ModalElement>

                {/* Department Delete Confirmation */}
                <ConfirmDialog
                    open={!!deleteDeptId}
                    onClose={() => setDeleteDeptId(null)}
                    onConfirm={handleDeleteDept}
                    title="Delete Department"
                    message="Are you sure you want to delete this department? All subdepartments will also be deleted."
                    confirmText="Delete"
                    confirmColor="error"
                />

                {/* SubDepartment Delete Confirmation */}
                <ConfirmDialog
                    open={!!deleteSubTarget}
                    onClose={() => setDeleteSubTarget(null)}
                    onConfirm={handleDeleteSub}
                    title="Delete Sub-Department"
                    message="Are you sure you want to delete this sub-department?"
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

DepartmentTreeView.displayName = "DepartmentTreeView";
