import { useEffect, useState } from "react";
import { Box, Stack, Typography, FormControlLabel } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import dayjs from "dayjs";
import { useGetAssetConditionsQuery } from "../../settings/api/assetCondition.api";
import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import type { AssetType } from "../../asset-category/api/assetCategory.api";
import type { AssignAsset } from "../api/assetList.api";
import { useEmployees } from "../../../../hooks/useEmployees";

type AssignAssetForm = {
    assignedTo: string;
    assignedOn: string;
    assetConditionId: string;
    note: string;
    isAcknowledgementRequested: boolean;
};

export type AssignAssetModalProps = {
    open: boolean;
    onClose: () => void;
    onAssign: (data: AssignAssetForm) => void;
    asset: AssignAsset | undefined;
    activeType: AssetType | null | undefined;
};

export const AssignAssetModal = ({
    open,
    onClose,
    onAssign,
    asset,
    activeType,
}: AssignAssetModalProps) => {

    const [form, setForm] = useState<AssignAssetForm>({
        assignedTo: "",
        assignedOn: "",
        assetConditionId: "",
        note: "",
        isAcknowledgementRequested: true,
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

    const handleChange = (key: keyof AssignAssetForm, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (open) {
            setForm({
                assignedTo: "",
                assignedOn: "",
                assetConditionId: String(asset?.asset?.assetCondition?.id || ""),
                note: "",
                isAcknowledgementRequested: true,
            });
        }
    }, [open, asset]);

    const handleAssign = () => {
        onAssign(form);
    };

    const isDisabled =
        !form.assignedTo ||
        !form.assignedOn ||
        !form.assetConditionId;

    const selectedEmployee = employeeList?.data?.find(
        (employee) => String(employee.id) === form.assignedTo
    );

    const employeeJoiningDate = selectedEmployee?.dateOfJoining
        ? dayjs(selectedEmployee.dateOfJoining)
        : null;

    const assetPurchasedOnDate = asset?.asset?.purchasedOn
        ? dayjs(asset.asset.purchasedOn)
        : null;

    /*  
        *  Determine the minimum date for the assigned_on date picker
        *  Min is DOJ if purchased on is before DOJ
        *  Min is purchased on if purchased on is after DOJ
    */
    const assignedOnMinDate =
        employeeJoiningDate && assetPurchasedOnDate
            ? employeeJoiningDate.isSameOrAfter(assetPurchasedOnDate)
                ? employeeJoiningDate
                : assetPurchasedOnDate

            : employeeJoiningDate || assetPurchasedOnDate || dayjs(); // fallback 


    useEffect(() => {
        if (
            form.assignedOn &&
            assignedOnMinDate &&
            dayjs(form.assignedOn).isBefore(assignedOnMinDate, "day")
        ) {
            setForm((prev) => ({
                ...prev,
                assignedOn: "",
            }));
        }
    }, [assignedOnMinDate, form.assignedOn]);

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            maxWidth="md"
            height={600}
            title="Assign Asset"
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

                        {/* Asset Details */}
                        <Typography variant="subtitle1">
                            Asset Details
                        </Typography>

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
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <TextFieldElement
                                label="Asset Type"
                                value={activeType?.typeName ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />

                            <TextFieldElement
                                label="Location"
                                value={asset?.location ?? ""}
                                disabled
                                sx={{ flex: 1 }}
                            />
                        </Stack>

                        {/* Assignment Details */}
                        <Typography variant="subtitle1">
                            Assignment Details
                        </Typography>

                        <Stack direction="row" spacing={2} >
                            <SingleSelectElement
                                label="Assign Asset To"
                                value={form.assignedTo}
                                required
                                options={employeeOptions}
                                onChange={(v) =>
                                    handleChange("assignedTo", v as string)
                                }
                                sx={{ maxWidth: "100%" }}
                            />

                            <DatePickerElement
                                label="Assigned On"
                                value={form.assignedOn ? dayjs(form.assignedOn) : null}
                                required
                                onChange={(value) =>
                                    handleChange("assignedOn", value ? value.format("YYYY-MM-DD") : "")
                                }
                                min={assignedOnMinDate}
                                width={"50%"}
                                max={dayjs()}
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextFieldElement
                                label="Note"
                                multiline
                                rows={3}
                                sx={{ flex: 0.96 }}
                                value={form.note}
                                onChange={(e) =>
                                    handleChange("note", e.target.value)
                                }
                            />
                            <SingleSelectElement
                                label="Asset Condition"
                                value={form.assetConditionId}
                                required
                                options={assetConditionOptions}
                                onChange={(v) =>
                                    handleChange("assetConditionId", v as string)
                                }
                                clearable={false}
                                sx={{ flex: 1 }}
                            />
                        </Stack>

                        {/* <FileUploadField
                            label="Asset Image"
                            value={attachments}
                            onChange={handleUpload}
                            multiple={true}
                            maxSize={5}
                        /> */}
                        {/* Existing attachments — shown in edit mode */}
                        {/* {existingAttachments.length > 0 && (
                            <Stack spacing={1}>
                                <Typography variant="caption" color="text.secondary">
                                    Existing Attachments
                                </Typography>

                                {existingAttachments.map((att, index) => (
                                    <Stack
                                        key={`${att.filename}-${index}`}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            px: 1.5,
                                            py: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            width: "400px",
                                        }}
                                    >
                                        <Typography variant="body2">{att.filename}</Typography>

                                        <PrimaryIconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveExistingFile(index)}
                                            icon={<DeleteIcon fontSize="small" />}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        )} */}

                        {/* Newly added files */}
                        {/* {attachments.length > 0 && (
                            <Stack spacing={1}>
                                <Typography variant="caption" color="text.secondary">
                                    New Attachments
                                </Typography>

                                {attachments.map((file, index) => (
                                    <Stack
                                        key={`${file.name}-${index}`}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            px: 1.5,
                                            py: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            width: "400px",
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                        </Typography>

                                        <PrimaryIconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveNewFile(index)}
                                            icon={<DeleteIcon fontSize="small" />}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        )} */}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={form.isAcknowledgementRequested}
                                    onChange={(e) =>
                                        handleChange(
                                            "isAcknowledgementRequested",
                                            e.target.checked
                                        )
                                    }
                                />
                            }
                            label="Request employee acknowledgement"
                        />
                    </Stack>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <PrimaryButton
                        onClick={handleAssign}
                        disabled={isDisabled}
                    >
                        Assign
                    </PrimaryButton>
                </Box>
            </Box>
        </ModalElement>
    );
};