import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { useState, useRef, forwardRef, useImperativeHandle, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { Check, Close, Delete, Edit } from "@mui/icons-material";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { StandardTable } from "../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../types/types";
import {
    type IHoliday,
    type IHolidayPlan,
    useAddHolidayMutation,
    useDeleteHolidayMutation,
    useGetPlanHolidaysQuery,
    useUpdateHolidayMutation,
} from "../api/holidayPlan.api";
import dayjs from "dayjs";

const ADD_ROW_ID = "__add__";
type TableRow = IHoliday | { id: typeof ADD_ROW_ID; _isAddRow: true };

export interface HolidayListProps {
    plan: IHolidayPlan;
    year: string;
    onYearChange: Dispatch<SetStateAction<string>>;
    onYearOptionsChange?: (options: { label: string; value: string }[]) => void;
}

export interface HolidayListRef {
    openAddRow: () => void;
}

export const HolidayList = forwardRef<HolidayListRef, HolidayListProps>(({ plan, year, onYearChange: setYear, onYearOptionsChange }, ref) => {
    const { data, isLoading } = useGetPlanHolidaysQuery({
        id: plan.id,
        year,
    });

    const holidays = data?.holidays || [];
    const years = data?.years || [];

    /** Include active `year` so a newly added holiday's year shows as a tab before API refreshes `years` */
    const chipYears = useMemo(() => {
        const yNum = parseInt(year, 10);
        const set = new Set(years);
        if (!Number.isNaN(yNum)) set.add(yNum);
        return Array.from(set).sort((a, b) => a - b);
    }, [years, year]);

    const yearOptions = useMemo(
        () => chipYears.map((y) => ({ label: y.toString(), value: y.toString() })),
        [chipYears]
    );

    /** Skip one sync after add — API `years` may lag behind the new holiday's calendar year */
    const skipYearSyncRef = useRef(false);

    useEffect(() => {
        if (skipYearSyncRef.current) {
            skipYearSyncRef.current = false;
            return;
        }
        if (years.length > 0 && !years.includes(parseInt(year, 10))) {
            setYear(years[0].toString());
        }
    }, [years, year]);

    useEffect(() => {
        onYearOptionsChange?.(yearOptions);
    }, [yearOptions]);

    const [addHoliday] = useAddHolidayMutation();
    const [updateHoliday] = useUpdateHolidayMutation();
    const [deleteHoliday] = useDeleteHolidayMutation();

    // State for inline editing
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<Partial<IHoliday>>({});

    // State for Adding new holiday
    const [isAdding, setIsAdding] = useState(false);
    const [newHolidayDate, setNewHolidayDate] = useState<any>(null);
    const [newHolidayDescription, setNewHolidayDescription] = useState("");

    // Track whether any date picker calendar is open so the outside-click
    // handler doesn't close the row while the user is picking a date.
    const isDatePickerOpenRef = useRef(false);


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
        openAddRow: () => {
            setIsAdding(true);
            setEditingId(null);
            setNewHolidayDate(null);
            setNewHolidayDescription("");
        }
    }));

    const handleEdit = (holiday: IHoliday) => {
        setEditingId(holiday.id!);
        setEditValues(holiday);
        setIsAdding(false);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };

    const handleSaveEdit = async () => {
        if (editingId && editValues.description && plan.id) {
            try {

                await updateHoliday({
                    id: plan.id,
                    holidayId: editingId,
                    description: editValues.description,
                    date: dayjs(editValues.date).format("YYYY-MM-DD"),
                }).unwrap();
                showSnackbar("Holiday updated successfully");
                setEditingId(null);
                setEditValues({});
            } catch (error: any) {
                console.error("Failed to update holiday", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update holiday.";
                showSnackbar(errorMsg, "error");
            }
        }
    };

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState<number | null>(null);

    const handleDelete = (holidayId: number) => {
        setHolidayToDelete(holidayId);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (plan.id && holidayToDelete) {
            try {
                await deleteHoliday({ id: plan.id, holidayId: holidayToDelete }).unwrap();
                showSnackbar("Holiday deleted successfully");
            } catch (error: any) {
                console.error("Failed to delete holiday", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to delete holiday.";
                showSnackbar(errorMsg, "error");
            }
        }
        setConfirmDeleteOpen(false);
        setHolidayToDelete(null);
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewHolidayDate(null);
        setNewHolidayDescription("");
    };

    // Close the inline "Add Holiday" / "Edit Holiday" row when user clicks outside it.
    // This avoids the inline row staying open even after the user continues elsewhere.
    useEffect(() => {
        const isEditing = editingId !== null;
        if (!isAdding && !isEditing) return;

        const isInsideDatePicker = (el: HTMLElement | null) => {
            if (!el) return false;
            // MUI pickers popper is usually portaled; keep it from triggering close.
            return Boolean(
                el.closest(".MuiPickersPopper-root") ||
                el.closest(".MuiPickersModal-root"),
            );
        };

        const onPointerDown = (e: PointerEvent) => {
            // Never close the row while a date picker calendar is open.
            if (isDatePickerOpenRef.current) return;

            const target = e.target as HTMLElement | null;
            if (!target) return;

            // If click is inside add row controls, ignore.
            if (target.closest('[data-holiday-add="true"]')) return;

            // If click is inside edit row controls, ignore.
            if (isEditing && target.closest('[data-holiday-edit="true"]')) return;

            // If click is on the date picker popper itself, ignore.
            if (isInsideDatePicker(target)) return;

            if (isAdding) handleCancelAdd();
            if (isEditing) handleCancelEdit();
        };

        document.addEventListener("pointerdown", onPointerDown, { capture: true });
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
        };
    }, [isAdding, editingId]);

    const handleSaveNew = async () => {
        if (!newHolidayDate || !newHolidayDescription) {
            showSnackbar("Date and Description are required", "error");
            return;
        }

        if (plan.id) {
            try {
                await addHoliday({
                    id: plan.id,
                    date: dayjs(newHolidayDate).format("YYYY-MM-DD"),
                    description: newHolidayDescription
                }).unwrap();
                const addedYear = dayjs(newHolidayDate).format("YYYY");
                skipYearSyncRef.current = true;
                setYear(addedYear);
                showSnackbar("Holiday added successfully");
                setIsAdding(false);
                setNewHolidayDate(null);
                setNewHolidayDescription("");
            } catch (error: any) {
                console.error("Failed to add holiday", error);
                const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to add holiday.";
                showSnackbar(errorMsg, "error");
            }
        }
    };

    const holidayTableColumns: StandardTableColumn[] = useMemo(
        () => [
            {
                id: "date",
                label: "Date",
                width: "30%",
                render: (row: TableRow) => {
                    if ("_isAddRow" in row && row._isAddRow) {
                        return (
                            <Box data-holiday-add="true">
                                <DatePickerElement
                                    label="Date"
                                    value={newHolidayDate}
                                    onChange={(date) => setNewHolidayDate(date)}
                                    onOpen={() => { isDatePickerOpenRef.current = true; }}
                                    onClose={() => { isDatePickerOpenRef.current = false; }}
                                />
                            </Box>
                        );
                    }
                    const h = row as IHoliday;
                    if (editingId === h.id) {
                        return (
                            <Box data-holiday-edit="true">
                                <DatePickerElement
                                    label=""
                                    value={editValues.date ? dayjs(editValues.date) : null}
                                    onChange={(date) =>
                                        setEditValues({ ...editValues, date: date ? date.format("YYYY-MM-DD") : "" })
                                    }
                                    onOpen={() => { isDatePickerOpenRef.current = true; }}
                                    onClose={() => { isDatePickerOpenRef.current = false; }}
                                />
                            </Box>
                        );
                    }
                    return dayjs(h.date).format("MMM DD, YYYY");
                },
            },
            {
                id: "description",
                label: "Description",
                width: "50%",
                render: (row: TableRow) => {
                    if ("_isAddRow" in row && row._isAddRow) {
                        return (
                            <Box data-holiday-add="true">
                                <TextFieldElement
                                    placeholder="Enter Description"
                                    label=""
                                    fullWidth
                                    value={newHolidayDescription}
                                    onChange={(e) => setNewHolidayDescription(e.target.value)}
                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 355,
                                        },
                                    }}
                                />
                            </Box>
                        );
                    }
                    const h = row as IHoliday;
                    if (editingId === h.id) {
                        return (
                            <Box data-holiday-edit="true">
                                <TextFieldElement
                                    fullWidth
                                    label=""
                                    value={editValues.description}
                                    onChange={(e) =>
                                        setEditValues({ ...editValues, description: e.target.value })
                                    }
                                />
                            </Box>
                        );
                    }
                    return h.description;
                },
            },
            {
                id: "actions",
                label: "",
                width: "20%",
                align: "right",
                render: (row: TableRow) => {
                    if ("_isAddRow" in row && row._isAddRow) {
                        return (
                            <Box data-holiday-add="true">
                                <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
                                    <IconButton size="small" color="success" onClick={handleSaveNew}>
                                        <Check />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={handleCancelAdd}>
                                        <Close />
                                    </IconButton>
                                </Stack>
                            </Box>
                        );
                    }
                    const h = row as IHoliday;
                    if (editingId === h.id) {
                        return (
                            <Box data-holiday-edit="true">
                                <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
                                    <IconButton size="small" color="success" onClick={handleSaveEdit}>
                                        <Check />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={handleCancelEdit}>
                                        <Close />
                                    </IconButton>
                                </Stack>
                            </Box>
                        );
                    }
                    return (
                        <Stack direction="row" justifyContent="center" gap={1}>
                            <IconButton size="small" onClick={() => handleEdit(h)} disabled={!h.canModify}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <Tooltip title={h.canModify ? "" : "This holiday cannot be deleted"}>
                                <span>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(h.id!)}
                                        disabled={!h.canModify}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    );
                },
            },
        ],
        [newHolidayDate, newHolidayDescription, editingId, editValues]
    );

    const holidayTableRows: TableRow[] = useMemo(
        () => [...(isAdding ? [{ id: ADD_ROW_ID, _isAddRow: true } as TableRow] : []), ...holidays],
        [isAdding, holidays]
    );

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    minHeight: 280,
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                }}
            >
                <CustomCircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxHeight: "100%", overflowY: "auto" }}>
            <StandardTable
                columns={holidayTableColumns}
                rows={holidayTableRows}
                loading={false}
                sx={{
                    maxHeight: "50vh",
                    overflowY: "auto",
                    "@media (min-height: 900px)": { maxHeight: "60vh" },
                }}
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

            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Delete Holiday"
                message="Are you sure you want to delete this holiday? This action cannot be undone."
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setHolidayToDelete(null);
                }}
                onConfirm={confirmDelete}
                confirmText="Delete"
                confirmColor="error"
            />
        </Box >
    );
});

HolidayList.displayName = "HolidayList";
