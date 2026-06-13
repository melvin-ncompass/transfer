import { Box, Stack } from "@mui/system";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { useEffect, useState } from "react";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";

import type { Dayjs } from "dayjs";
import { useGetAssetConditionsQuery } from "../../settings/api/assetCondition.api";
import dayjs from "dayjs";

export const FilterModalOrganization = ({
    open,
    onClose,
    onSave,
    appliedFilters = {},
}: {
    open: boolean,
    onClose: () => void,
    onSave: (filters: any) => void,
    appliedFilters?: Record<string, any>,

}) => {
    const [condition, setCondition] = useState<string[]>([]);
    const [warranty, setWarranty] = useState<string>("");
    const [status, setStatus] = useState<string[]>([]);
    const [expiresOn, setExpiresOn] = useState<Dayjs | null>(null);

    const { data: assetConditions } = useGetAssetConditionsQuery();

    const assetConditionOptions = assetConditions?.map((condition) => ({
        label: condition.conditionName,
        value: String(condition.id),
    })) ?? [];

    const handleApply = () => {
        onSave({
            condition,
            warranty,
            status,
            expiresOn,
        });
        onClose();
    }

    useEffect(() => {
        if (!open) return;

        setCondition(
            Array.isArray(appliedFilters.assetConditionId)
                ? appliedFilters.assetConditionId.map(String)
                : appliedFilters.assetConditionId
                    ? [String(appliedFilters.assetConditionId)]
                    : []
        );

        setStatus(
            Array.isArray(appliedFilters.assetStatus)
                ? appliedFilters.assetStatus
                : appliedFilters.assetStatus
                    ? [appliedFilters.assetStatus]
                    : []
        );
        setExpiresOn(
            appliedFilters.warrantyExpiresOn
                ? dayjs(appliedFilters.warrantyExpiresOn)
                : null
        );
    }, [open]);

    return (
        <ModalElement
            maxWidth="sm"
            open={open}
            height={350}
            title="Filter"
            onClose={() => {
                onClose();
                setCondition([]);
                setWarranty("");
                setStatus([]);
                setExpiresOn(null);
            }}
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
                        <MultiSelectElement
                            label="Condition"
                            value={condition}
                            width={"100%"}
                            options={assetConditionOptions}
                            onChange={(value) => setCondition(value)}
                        />
                        <MultiSelectElement
                            label="Status"
                            value={status}
                            width={"100%"}
                            options={[
                                { label: "Available", value: "available" },
                                { label: "Not Available", value: "not_available" },
                            ]}
                            onChange={(value) => setStatus(value)}
                        />
                        <Box sx={{ flex: 1, width: "100%", mt: 1 }}>
                            <DatePickerElement
                                label="Warranty Expires on or before"
                                value={expiresOn}
                                width={"100%"}
                                onChange={(value) => setExpiresOn(value)}
                            />
                        </Box>
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
                <PrimaryButton onClick={handleApply}>
                    Apply
                </PrimaryButton>
            </Box>
        </ModalElement>
    );
}