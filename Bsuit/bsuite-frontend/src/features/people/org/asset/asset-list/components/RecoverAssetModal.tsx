import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import dayjs from "dayjs";
import { useGetAssetConditionsQuery } from "../../settings/api/assetCondition.api";
import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import type { AssetType, AssetCategoryType } from "../../asset-category/api/assetCategory.api";
import { useEmployees } from "../../../../hooks/useEmployees";

type RecoverAssetForm = {
    recoveredBy: string;
    recoveredOn: string;
    assetConditionId: string;
};

type RecoverAssetModalProps = {
    open: boolean;
    onClose: () => void;
    onRecover: (data: any) => void;
    asset: any | undefined;
    activeType: AssetType | null | undefined;
    activeCategory: AssetCategoryType | null | undefined;
    isLoading: boolean;
};

export const RecoverAssetModal = ({
    open,
    onClose,
    onRecover,
    asset,
    activeType,
    activeCategory,
    isLoading,
}: RecoverAssetModalProps) => {

    const [form, setForm] = useState<RecoverAssetForm>({
        recoveredBy: "",
        recoveredOn: "",
        assetConditionId: "",
    });

    const { data: assetConditions } = useGetAssetConditionsQuery();
    const { data: employeeList } = useEmployees({ activeOnly: true });

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

    const handleChange = (key: keyof RecoverAssetForm, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (open) {
            setForm({
                recoveredBy: "",
                recoveredOn: "",
                assetConditionId: String(asset?.asset?.assetCondition?.id || ""),
            });
        }
    }, [open, asset]);

    const handleRecover = () => {
        onRecover({
            recoveredBy: Number(form.recoveredBy),
            recoveredOn: form.recoveredOn ? dayjs(form.recoveredOn) : "",
            assetConditionId: Number(form.assetConditionId),
        });
    };

    const isDisabled =
        !form.recoveredBy ||
        !form.recoveredOn ||
        !form.assetConditionId;

    const selectedEmployee = employeeList?.data?.find(
        (employee) => String(employee.id) === form.recoveredBy
    );

    const employeeJoiningDate = selectedEmployee?.dateOfJoining
        ? dayjs(selectedEmployee.dateOfJoining)
        : null;

    const assetPurchasedOnDate = asset?.asset?.purchasedOn
        ? dayjs(asset.asset.purchasedOn)
        : null;

    /*  
        *  Determine the minimum date for the recovered_on date picker
        *  Min is DOJ if purchased on is before DOJ
        *  Min is purchased on if purchased on is after DOJ
    */
    const recoveredOnMinDate =
        employeeJoiningDate && assetPurchasedOnDate
            ? employeeJoiningDate.isSameOrAfter(assetPurchasedOnDate)
                ? employeeJoiningDate
                : assetPurchasedOnDate

            : employeeJoiningDate || assetPurchasedOnDate || dayjs(); // fallback 

    useEffect(() => {
        if (
            form.recoveredOn &&
            recoveredOnMinDate &&
            dayjs(form.recoveredOn).isBefore(recoveredOnMinDate, "day")
        ) {
            setForm((prev) => ({
                ...prev,
                recoveredOn: "",
            }));
        }
    }, [recoveredOnMinDate, form.recoveredOn]);

    const assignment = asset?.asset?.assignments?.[0];

    const minDate = assignment?.assignedOn
        ? dayjs(assignment.assignedOn)
        : assignment?.recoveredOn
            ? dayjs(assignment.recoveredOn)
            : recoveredOnMinDate;

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            maxWidth="md"
            height={600}
            title="Recover Asset"
            sx={{
                "& .MuiDialog-paper": {
                    overflow: "hidden",
                },
            }}
        >
            <Box
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        p: 3,
                    }}
                >
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2}>
                            <TextFieldElement
                                label="Asset Name"
                                value={asset?.assetName ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />

                            <TextFieldElement
                                label="Asset ID"
                                value={asset?.id ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />

                            <TextFieldElement
                                label="Asset Type"
                                value={activeType?.typeName ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <TextFieldElement
                                label="Asset Category"
                                value={activeCategory?.categoryName ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />

                            <TextFieldElement
                                label="Location"
                                value={asset?.location ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />

                            <Box sx={{ flex: 1 }} />
                        </Stack>

                        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                            Asset recovery details
                        </Typography>

                        <Stack direction="row" spacing={2}>
                            <SingleSelectElement
                                label="Asset recovered by"
                                value={form.recoveredBy}
                                required
                                options={employeeOptions}
                                onChange={(v) =>
                                    handleChange("recoveredBy", v as string)
                                }
                                sx={{ flex: 1 }}
                            />

                            <DatePickerElement
                                label="Asset recovered on"
                                value={form.recoveredOn ? dayjs(form.recoveredOn) : null}
                                required
                                onChange={(value) =>
                                    handleChange("recoveredOn", value ? value.format("YYYY-MM-DD") : "")
                                }
                                min={minDate}
                                max={dayjs(Date.now())}
                                width={"50%"}
                            />
                        </Stack>
                        <Stack direction="row" spacing={4}>
                            <SingleSelectElement
                                label="Asset condition"
                                value={form.assetConditionId}
                                required
                                options={assetConditionOptions}
                                onChange={(v) =>
                                    handleChange("assetConditionId", v as string)
                                }
                                clearable={false}
                                sx={{ flex: 1 }}
                            />
                            <Box sx={{ flex: 1 }} />
                        </Stack>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2
                    }}
                >
                    <PrimaryButton
                        onClick={handleRecover}
                        disabled={isDisabled || isLoading}
                    >
                        Save
                    </PrimaryButton>
                </Box>
            </Box>
        </ModalElement>
    );
};
