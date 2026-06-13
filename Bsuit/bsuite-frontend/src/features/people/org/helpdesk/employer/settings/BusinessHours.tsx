import { Add, Delete, Edit } from "@mui/icons-material";
import {
    Box,
    Divider,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from "react";

import {
    PrimaryButton,
    PrimaryIconButton,
} from "../../../../../../components/atom/button";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import {
   type BusinessHourPolicy,
    useCreateBusinessHourPolicyMutation,
    useDeleteBusinessHourPolicyMutation,
    useGetBusinessHourPoliciesQuery,
    useUpdateBusinessHourPolicyMutation,
} from "../../api/businessHours.api";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";

const DAYS = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
];

type DaySchedule = {
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
};

const defaultSchedule = (): DaySchedule[] =>
    DAYS.map((day) => ({
        dayOfWeek: day.value,
        enabled: day.value >= 1 && day.value <= 5,
        startTime: "09:00",
        endTime: "18:00",
    }));

export type BusinessHoursRef = { openAddModal: () => void };

export default forwardRef<BusinessHoursRef, { searchQuery?: string }>(function BusinessHours(
    { searchQuery = "" },
    ref,
) {
    const [searchText, setSearchText] = useState<string>("");
    const effectiveSearch = searchQuery || searchText;
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<BusinessHourPolicy | null>(null);
    const [deletingPolicy, setDeletingPolicy] = useState<BusinessHourPolicy | null>(null);

    const [name, setName] = useState("");
    const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);

    const { data, isLoading } = useGetBusinessHourPoliciesQuery();

    const [createBusinessHourPolicy, { isLoading: isCreating }] =
        useCreateBusinessHourPolicyMutation();

    const [updateBusinessHourPolicy, { isLoading: isUpdating }] =
        useUpdateBusinessHourPolicyMutation();

    const [deleteBusinessHourPolicy, { isLoading: isDeleting }] =
        useDeleteBusinessHourPolicyMutation();

    const isEditMode = Boolean(editingPolicy);

    useImperativeHandle(ref, () => ({ openAddModal: () => { resetForm(); setAddModalOpen(true); } }));

    // Count only working days for display (excludes isDayOff entries)
    const workingDaysCount = (policy: BusinessHourPolicy) =>
        policy.schedules?.filter((s) => !s.isDayOff).length ?? 0;

    const payload = useMemo(() => {
        return {
            name,
            // Send all 7 days — enabled days as working, disabled as isDayOff
            schedule: schedule.map((d) => ({
                dayOfWeek: d.dayOfWeek,
                startTime: d.startTime,
                endTime: d.endTime,
                isDayOff: !d.enabled,
            })),
        };
    }, [name, schedule]);

    const updateDay = (
        dayOfWeek: number,
        field: keyof DaySchedule,
        value: string | boolean,
    ) => {
        setSchedule((prev) =>
            prev.map((item) =>
                item.dayOfWeek === dayOfWeek
                    ? { ...item, [field]: value }
                    : item,
            ),
        );
    };

    const resetForm = () => {
        setName("");
        setSchedule(defaultSchedule());
        setEditingPolicy(null);
    };

    const openEditModal = (policy: BusinessHourPolicy) => {
        setEditingPolicy(policy);
        setName(policy.name);

        const mappedSchedule = DAYS.map((day) => {
            const existing = policy.schedules?.find(
                (s) => s.dayOfWeek === day.value,
            );

            return {
                dayOfWeek: day.value,
                // A day is enabled if it exists in schedules and is NOT marked as a day off
                enabled: Boolean(existing) && !existing?.isDayOff,
                startTime: existing?.startTime ?? "09:00",
                endTime: existing?.endTime ?? "18:00",
            };
        });

        setSchedule(mappedSchedule);
        setAddModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteBusinessHourPolicy(id).unwrap();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        try {
            if (isEditMode && editingPolicy) {
                await updateBusinessHourPolicy({
                    id: editingPolicy.id,
                    body: payload,
                }).unwrap();
            } else {
                await createBusinessHourPolicy(payload).unwrap();
            }

            setAddModalOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!addModalOpen) {
            resetForm();
        }
    }, [addModalOpen]);

    const filteredPolicies =
        data?.data?.filter((policy) =>
            policy.name.toLowerCase().includes(effectiveSearch.toLowerCase()),
        ) ?? [];

    return (
        <Box width={"100%"} height={"100%"}>

            <Stack spacing={2}>
                {!isLoading &&
                    filteredPolicies.map((policy) => (
                        <Paper
                            key={policy.id}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                        >
                            <Box
                                display={"flex"}
                                justifyContent={"space-between"}
                                alignItems={"center"}
                                gap={2}
                            >
                                <Box>
                                    <Typography fontWeight={600}>
                                        {policy.name}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        mt={0.5}
                                    >
                                        {workingDaysCount(policy)} working day
                                        {workingDaysCount(policy) !== 1 ? "s" : ""}
                                    </Typography>
                                </Box>

                                <Box display={"flex"} gap={1}>
                                    <PrimaryIconButton
                                        icon={<Edit />}
                                        variant="outlined"
                                        onClick={() => openEditModal(policy)}
                                    />

                                    <PrimaryIconButton
                                        icon={<Delete />}
                                        color="error"
                                        variant="outlined"
                                        loading={isDeleting}
                                        onClick={() => {
                                            setDeletingPolicy(policy);
                                            setDeleteModalOpen(true);
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    ))}
            </Stack>

            <ConfirmDialog
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    if (deletingPolicy) {
                        handleDelete(deletingPolicy.id);
                    }
                    setDeleteModalOpen(false);
                    setDeletingPolicy(null);
                }}
                confirmColor="error"
                message="Are you sure you want to delete this business hour policy?"
            />

            <ModalElement
                open={addModalOpen}
                title={isEditMode ? "Edit Business Hours" : "Add Business Hours"}
                onClose={() => setAddModalOpen(false)}
            >
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    gap={2}
                    width={700}
                    maxWidth={"100%"}
                >
                    <TextFieldElement
                        label="Business Hour Policy Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                    />

                    <Divider />

                    <Stack spacing={1.5}>
                        {DAYS.map((day) => {
                            const current = schedule.find(
                                (d) => d.dayOfWeek === day.value,
                            )!;

                            return (
                                <Paper
                                    key={day.value}
                                    variant="outlined"
                                    sx={{ p: 2, borderRadius: 2 }}
                                >
                                    <Box
                                        display={"flex"}
                                        alignItems={"center"}
                                        justifyContent={"space-between"}
                                        gap={2}
                                        flexWrap={"wrap"}
                                    >
                                        <Box
                                            minWidth={140}
                                            display={"flex"}
                                            alignItems={"center"}
                                        >
                                            <Typography fontWeight={600}>
                                                {day.label}
                                            </Typography>
                                        </Box>

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={current.enabled}
                                                    onChange={(e) =>
                                                        updateDay(
                                                            day.value,
                                                            "enabled",
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            }
                                            label={
                                                current.enabled
                                                    ? "Working Day"
                                                    : "Off Day"
                                            }
                                        />

                                        <Box
                                            display={"flex"}
                                            alignItems={"center"}
                                            gap={2}
                                            flex={1}
                                            minWidth={260}
                                        >
                                            <TextFieldElement
                                                label="Start Time"
                                                type="time"
                                                value={current.startTime}
                                                onChange={(e) =>
                                                    updateDay(
                                                        day.value,
                                                        "startTime",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!current.enabled}
                                                fullWidth
                                            />

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                to
                                            </Typography>

                                            <TextFieldElement
                                                label="End Time"
                                                type="time"
                                                value={current.endTime}
                                                onChange={(e) =>
                                                    updateDay(
                                                        day.value,
                                                        "endTime",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!current.enabled}
                                                fullWidth
                                            />
                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>

                    <Box display={"flex"} justifyContent={"flex-end"} mt={1}>
                        <PrimaryButton
                            onClick={handleSubmit}
                            loading={isCreating || isUpdating}
                            disabled={
                                !name.trim() ||
                                // Must have at least one working day
                                payload.schedule.every((d) => d.isDayOff)
                            }
                        >
                            {isEditMode ? "Update" : "Save"}
                        </PrimaryButton>
                    </Box>
                </Box>
            </ModalElement>
        </Box>
    );
});