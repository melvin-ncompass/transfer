import { Box, Stack } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { useGetAssetConditionsQuery } from "../../settings/api/assetCondition.api";
import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import { DateRangePicker } from "../../../../../../components/atom/custom-date-range-picker";

export const FilterModal = ({
    open,
    onClose,
    onApply,
    hideAckowledgeOn = false,
    initialValues,
}: {
    open: boolean,
    onClose: () => void,
    onApply: (filters: {
        condition: string;
        assignedTo: string[];
        dateRangeAck: [Dayjs | null, Dayjs | null];
        dateRangeAssignedOn: [Dayjs | null, Dayjs | null];
    }) => void,
    hideAckowledgeOn?: boolean,
    initialValues?: {
        condition?: string;
        assignedTo?: string[];
        dateRangeAck?: [Dayjs | null, Dayjs | null];
        dateRangeAssignedOn?: [Dayjs | null, Dayjs | null];
    },
}) => {
    const [condition, setCondition] = useState("");
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [dateRangeAck, setDateRangeAck] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [fromDateAck, toDateAck] = dateRangeAck;

    const [dateRangeAssignedOn, setDateRangeAssignedOn] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [fromDateAssignedOn, toDateAssignedOn] = dateRangeAssignedOn;

    const { data: assetConditions } = useGetAssetConditionsQuery();
    const { data: employeeList } = useGetEmployeesQuery();


    const assetConditionOptions = assetConditions?.map((condition) => ({
        label: condition.conditionName,
        value: String(condition.id),
    })) ?? [];

    const employeeOptions = [
        ...(employeeList?.data?.map((employee) => ({
            label: employee.nameAsPerAadhar || employee.nameAsPerPan || employee.contact?.name || "",
            value: String(employee.id),
        })) ?? []),
    ];

    useEffect(() => {
        if (open) {
            setCondition(initialValues?.condition ?? "");
            setAssignedTo(initialValues?.assignedTo ?? []);
            setDateRangeAck(initialValues?.dateRangeAck ?? [null, null]);
            setDateRangeAssignedOn(initialValues?.dateRangeAssignedOn ?? [null, null]);
        }
    }, [open])

    const handleClose = () => {
        // Discard unapplied changes by re-syncing (useEffect above handles it on next open)
        onClose();
    };

    return (
        <ModalElement
            maxWidth="sm"
            open={open}
            height={500}
            title="Filter"
            onClose={handleClose}
            sx={{
                "& .MuiDialog-paper": {
                    width: { xs: "90vw", sm: 500, md: 800 },
                    margin: 2,
                    height: "70vh",
                    display: "flex",
                    flexDirection: "column",
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Stack spacing={2} gap={3} direction="column">
                    <Stack spacing={2} direction="column">
                        <SingleSelectElement
                            label="Condition"
                            value={condition}
                            width={"100%"}
                            options={assetConditionOptions}
                            onChange={(value) => setCondition(value)}
                        />
                        <MultiSelectElement
                            label="Assigned To"
                            value={assignedTo}
                            width={"100%"}
                            options={employeeOptions}
                            onChange={(value) => setAssignedTo(value)}
                        />
                        <Box sx={{ flex: 1, width: "100%", mt: 1 }}>
                            <DateRangePicker
                                label="Assigned Date Range"
                                startValue={fromDateAssignedOn}
                                endValue={toDateAssignedOn}
                                onChange={setDateRangeAssignedOn}
                                displayFormat="full"
                                width="100%"
                            />
                        </Box>
                        {!hideAckowledgeOn && (
                            <Box sx={{ flex: 1, width: "100%", mt: 1 }}>
                                <DateRangePicker
                                    label="From-To"
                                    startValue={fromDateAck}
                                    endValue={toDateAck}
                                    onChange={setDateRangeAck}
                                    displayFormat="full"
                                    width="100%"
                                />
                            </Box>
                        )}
                    </Stack>
                </Stack>
            </Box>
            <Box
                sx={{
                    mt: "auto",
                    p: 2,
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                }}
            >
                <PrimaryButton onClick={() => onApply({
                    condition,
                    assignedTo,
                    dateRangeAck,
                    dateRangeAssignedOn
                })}
                >
                    Apply
                </PrimaryButton>
            </Box>
        </ModalElement>
    );
}