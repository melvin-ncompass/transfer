import { useNavigate } from "react-router-dom";
import { alpha, Box, ClickAwayListener, IconButton, MenuItem, Paper, Popper, Stack, Typography, useTheme } from "@mui/material";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import { Chip } from "../../../../../components/atom/chips";
import MenuAtom, { type MenuAtomItem } from "../../../../../components/menuatom/MenuAtom";
import { Add, KeyboardArrowDown, MoreVert, Upload } from "@mui/icons-material";
import { HolidayList, type HolidayListRef } from "./HolidayList";
import { EmployeeList } from "./EmployeeList";
import { HolidayPlanModal } from "./HolidayPlanModal";
import {
    type IHolidayPlan,
    useDeleteHolidayPlanMutation,
    useGetHolidayPlansQuery,
    useSetAsDefaultPlanMutation,
    useUpdateHolidayPlanMutation,
} from "../api/holidayPlan.api";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import dayjs from "dayjs";

export interface HolidayPlanRef {
    openAddModal: () => void;
    closeModal: () => void;
    selectPlan: (id: number) => void;
    search: (query: string) => void;
}

type ViewKey = "Holiday List" | "Employee List";

interface YearSelectProps {
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
}

export const HolidayPlanDetails = forwardRef<HolidayPlanRef>((_, ref) => {
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activePlanId, setActivePlanId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [planNameInput, setPlanNameInput] = useState("");

    const [planToRename, setPlanToRename] = useState<{ id: number; name: string } | null>(null);

    // State for auto-selecting new plan
    const [pendingSelectName, setPendingSelectName] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<ViewKey>("Holiday List");
    const [holidayYear, setHolidayYear] = useState(dayjs().year().toString());
    const [holidayYearOptions, setHolidayYearOptions] = useState<{ label: string; value: string }[]>([]);

    const holidayListRef = useRef<HolidayListRef>(null);

    const { data: plans = [], isLoading, refetch: refetchHolidayPlans } =
        useGetHolidayPlansQuery();
    const [deletePlan] = useDeleteHolidayPlanMutation();
    const [setAsDefault] = useSetAsDefaultPlanMutation();
    const [updatePlan] = useUpdateHolidayPlanMutation();

    // Effect to auto-select pending plan when plans list updates
    useEffect(() => {
        if (pendingSelectName && plans.length > 0) {
            const newPlan = plans.find(p => p.planName === pendingSelectName);
            if (newPlan) {
                setActivePlanId(newPlan.id);
                setPendingSelectName(null);
            }
        }
    }, [plans, pendingSelectName]);

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

    useImperativeHandle(ref, () => ({
        openAddModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        selectPlan: (id: number) => setActivePlanId(id),
        search: (query: string) => {
            setSearchQuery(query);
        },
    }));

    // Auto-select first plan if none selected
    if (!activePlanId && plans.length > 0) {
        setActivePlanId(plans[0].id);
    }

    const activePlan = plans.find((p) => p.id === activePlanId);

    const filteredPlans = plans.filter((p) =>
        p.planName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const viewChips: { label: ViewKey }[] = [
        { label: "Holiday List" },
        { label: "Employee List" },
    ];

    const handleSetDefault = async (id: number) => {
        try {
            await setAsDefault(id).unwrap();
            showSnackbar("Plan set as default successfully");
        } catch (error: any) {
            console.error("Failed to set default plan", error);
            const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to set default plan.";
            showSnackbar(errorMsg, "error");
        }
    }

    const [confirmPlanDeleteOpen, setConfirmPlanDeleteOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setPlanToDelete(id);
        setConfirmPlanDeleteOpen(true);
    };

    const confirmDeletePlan = async () => {
        if (!planToDelete) {
            setConfirmPlanDeleteOpen(false);
            return;
        }
        const idToDelete = planToDelete;
        try {
            await deletePlan(idToDelete).unwrap();
            showSnackbar("Plan deleted successfully");
            const { data: freshPlans } = await refetchHolidayPlans();
            const list = freshPlans ?? [];
            if (list.length === 0) {
                setActivePlanId(null);
            } else {
                setActivePlanId((prev) =>
                    prev != null && list.some((p) => p.id === prev)
                        ? prev
                        : list[0].id,
                );
            }
        } catch (error: any) {
            console.error("Failed to delete plan", error);
            const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to delete plan.";
            showSnackbar(errorMsg, "error");
        }
        setConfirmPlanDeleteOpen(false);
        setPlanToDelete(null);
    };

    const handleRename = async (id: number, newName: string) => {
        try {
            await updatePlan({ id, planName: newName }).unwrap();
            showSnackbar("Plan renamed successfully");
        } catch (error: any) {
            console.error("Failed to rename plan", error);
            const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to rename plan.";
            showSnackbar(errorMsg, "error");
        }
    };


    return (
        <Box sx={{ width: "100%", mt: 1 }}>
            {isLoading ? (
                <Box
                    sx={{
                        display: "flex",
                        width: "100%",
                        minHeight: "calc(100vh - 350px)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <CustomCircularProgress size={32} />
                </Box>
            ) : filteredPlans.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 400px)" }}>
                    <Typography variant="body2" color="text.secondary">
                        No holiday plan found
                    </Typography>
                </Box>
            ) : (
                <Box display={"flex"} width={"100%"} gap={1} mt={0}>
                    {/* Left Sidebar: Plan List */}
                    <Box sx={{ width: "30%", py: 0 }}>
                        <Stack
                            gap={1}
                            sx={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", pr: 1 }}
                        >
                            {filteredPlans.map((plan) => (
                                <HolidayPlanListItem
                                    key={plan.id}
                                    plan={plan}
                                    selected={plan.id === activePlanId}
                                    onClick={() => setActivePlanId(plan.id)}
                                    onSetDefault={() => handleSetDefault(plan.id)}
                                    onDelete={() => handleDelete(plan.id)}
                                    onRename={async (id, newName) => {
                                        await updatePlan({ id, planName: newName }).unwrap();
                                    }}
                                    showSnackbar={showSnackbar}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            width: "70%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            pl: 2,
                        }}
                    >
                        <Stack
                            direction="row"
                            gap={1}
                            flexWrap="wrap"
                            alignItems="center"
                            height={35}
                        >
                            {viewChips.map(({ label }) => (
                                <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    onClick={() => setActiveView(label)}
                                    color={activeView === label ? "primary" : "secondary"}
                                />
                            ))}

                            {activeView === "Holiday List" && activePlan && (
                                <>
                                    <Box flex={1} />
                                    <YearSelect
                                        value={holidayYear}
                                        options={holidayYearOptions}
                                        onChange={setHolidayYear}
                                    />
                                    <IconButton
                                        onClick={() => holidayListRef.current?.openAddRow()}
                                        color="primary"
                                        size="small"
                                    >
                                        <Add />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => navigate("/people/time/holiday-plan/import")}
                                        color="primary"
                                        size="small"
                                    >
                                        <Upload />
                                    </IconButton>
                                </>
                            )}
                        </Stack>

                        {/* Content */}
                        {activeView === "Holiday List" && (
                            activePlan
                                ? <HolidayList
                                    ref={holidayListRef}
                                    plan={activePlan}
                                    year={holidayYear}
                                    onYearChange={setHolidayYear}
                                    onYearOptionsChange={setHolidayYearOptions}
                                />
                                : <Typography>Select a plan</Typography>
                        )}
                        {activeView === "Employee List" && (
                            activePlan
                                ? <EmployeeList planId={activePlan.id.toString()} />
                                : <Typography>Select a plan</Typography>
                        )}
                    </Box>
                </Box>
            )}


            {/* Create Modal */}
            <HolidayPlanModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Holiday plan"

                onPlanCreated={(name) => {
                    setPendingSelectName(name);
                    showSnackbar("Holiday plan created successfully");
                }}
            />

            <ModalElement
                open={renameDialogOpen}
                onClose={() => {
                    setRenameDialogOpen(false);
                    setPlanToRename(null);
                    setPlanNameInput("");
                }}
                title="Rename Holiday Plan"
                onClick={() => {
                    if (planToRename && planNameInput.trim()) {
                        handleRename(planToRename.id, planNameInput.trim());
                        setRenameDialogOpen(false);
                        setPlanToRename(null);
                        setPlanNameInput("");
                    }
                }}
                maxWidth="sm"
                disabled={!planNameInput.trim() || planNameInput === planToRename?.name}
            >
                <TextFieldElement
                    name="planName"
                    label="Plan Name"
                    fullWidth
                    value={planNameInput}
                    onChange={(e) => setPlanNameInput(e.target.value)}
                    sx={{ mt: 1 }}
                    slotProps={{
                        htmlInput: {
                            maxLength: 355,
                        },
                    }}
                />
            </ModalElement>

            <ConfirmDialog
                open={confirmPlanDeleteOpen}
                title="Delete Holiday Plan"
                message="Are you sure you want to delete this holiday plan? This action cannot be undone."
                onClose={() => {
                    setConfirmPlanDeleteOpen(false);
                    setPlanToDelete(null);
                }}
                onConfirm={confirmDeletePlan}
                confirmText="Delete"
                confirmColor="error"
            />

            {/* Snackbar Notifications */}
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
});

function HolidayPlanListItem({
    plan,
    selected,
    onClick,
    onSetDefault,
    onDelete,
    onRename,
    showSnackbar,
}: {
    plan: IHolidayPlan;
    selected: boolean;
    onClick: () => void;
    onSetDefault: () => void;
    onDelete: () => void;
    onRename: (id: number, newName: string) => Promise<void>;
    showSnackbar: (message: string, color?: "success" | "error") => void;
}) {
    const theme = useTheme();

    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(plan.planName);

    useEffect(() => {
        setName(plan.planName);
    }, [plan.planName]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => setMenuAnchor(null);

    const handleRenameSave = async () => {
        if (!name.trim()) return;

        try {
            await onRename(plan.id, name.trim());
            showSnackbar("Plan renamed successfully");
        } catch (error: any) {
            const errorMsg =
                error?.data?.message ??
                error?.error ??
                error?.message ??
                "Failed to rename plan.";

            showSnackbar(errorMsg, "error");
            setName(plan.planName);
        }

        setIsRenaming(false);
    };

    const handleRenameCancel = () => {
        setName(plan.planName);
        setIsRenaming(false);
    };

    const menuItems: MenuAtomItem[] = [
        ...(!plan.default
            ? [{
                label: "Set as default",
                onClick: () => {
                    onSetDefault();
                    handleMenuClose();
                }
            }]
            : []),

        {
            label: "Rename",
            onClick: () => {
                setIsRenaming(true);
                handleMenuClose();
            },
        },

        ...(!plan.default
            ? [{
                label: "Delete",
                onClick: () => {
                    onDelete();
                    handleMenuClose();
                }
            }]
            : []),
    ];

    return (
        <Box
            onClick={!isRenaming ? onClick : undefined}
            sx={{
                px: 1.5,
                py: 1.5,
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
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Stack flex={1} gap={0.25} sx={{ minWidth: 0 }}>
                    {isRenaming ? (
                        <Stack direction="row" gap={1} alignItems="center">
                            <TextFieldElement
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                label=""
                                fullWidth
                                slotProps={{
                                    htmlInput: {
                                        maxLength: 355,
                                    },
                                }}
                            />

                            <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameSave();
                                }}
                            >
                                ✔
                            </IconButton>

                            <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameCancel();
                                }}
                            >
                                ✖
                            </IconButton>
                        </Stack>
                    ) : (
                        <Stack
                            direction="row"
                            gap={1}
                            alignItems="center"
                            sx={{ minWidth: 0 }}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={selected ? 600 : 400}
                                color={selected ? "primary.main" : "text.primary"}
                                noWrap
                                sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: 160,
                                }}
                            >
                                {plan.planName}
                            </Typography>

                            {plan.default && (
                                <Chip
                                    size="small"
                                    label="Default"
                                    color="success"
                                />
                            )}
                        </Stack>
                    )}
                </Stack>

                {!isRenaming && (
                    <Box
                        component="span"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        sx={{
                            display: "inline-flex",
                            flexShrink: 0,
                            ml: 0.5,
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            aria-label="Plan actions"
                        >
                            <MoreVert fontSize="small" />
                        </IconButton>

                        <MenuAtom
                            anchorEl={menuAnchor}
                            open={Boolean(menuAnchor)}
                            items={menuItems}
                            onCloseAll={handleMenuClose}
                        />
                    </Box>
                )}
            </Stack>
        </Box>
    );
}

const YearSelect = ({ value, options, onChange }: YearSelectProps) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Box>
                <Box
                    ref={anchorRef}
                    onClick={() => setOpen((prev) => !prev)}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        px: 1.25,
                        py: 0.5,
                        borderRadius: "999px",
                        border: "1.5px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        userSelect: "none",
                        typography: "body2",
                        fontWeight: 500,
                        color: "text.primary",
                        bgcolor: "background.paper",
                        "&:hover": {
                            borderColor: "text.secondary",
                        },
                        transition: "border-color 0.15s ease",
                    }}
                >
                    {value}
                    <KeyboardArrowDown
                        sx={{
                            fontSize: 16,
                            color: "text.secondary",
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                        }}
                    />
                </Box>

                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    sx={{ zIndex: 1300 }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            mt: 0.5,
                            minWidth: 80,
                            borderRadius: 1.5,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        {options.map((opt) => (
                            <MenuItem
                                key={opt.value}
                                selected={opt.value === value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                sx={{
                                    fontSize: 14,
                                    fontWeight: opt.value === value ? 600 : 400,
                                    minHeight: 36,
                                    px: 1.5,
                                }}
                            >
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Paper>
                </Popper>
            </Box>
        </ClickAwayListener>
    );
}