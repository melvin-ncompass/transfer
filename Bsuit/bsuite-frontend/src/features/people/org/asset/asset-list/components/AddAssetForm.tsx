import { Box, Stack } from "@mui/system";
import { Divider, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import DeleteIcon from "@mui/icons-material/Delete";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import type { AssetCategoryType, AssetType } from "../../asset-category/api/assetCategory.api";
import { useGetAssetConfigAssetIdQuery, useGetAssetConfigsQuery } from "../../settings/api/assetConfig.api";
import { useGetAssetConditionsQuery } from "../../settings/api/assetCondition.api";
import { AttachmentCarousel } from "./AttachmentCarousel";

type AssetForm = {
    assetCategory: string;
    assetType: string;
    assetIdSeries: string;
    assetId: string;
    assetName: string;
    location: string;
    purchasedOn: string;
    warrantyExpiresOn: string;
    attachments?: File[];
    assetConditionId: string;
    assetStatus: string;
};

export const AddAssetModal = ({
    open,
    onClose,
    onSave,
    isEdit,
    editRow,
    assetType,
    assetCategory,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: FormData) => void;
    isEdit?: boolean;
    editRow?: any | null;
    assetType: AssetType;
    assetCategory: AssetCategoryType;
}) => {
    const [form, setForm] = useState<AssetForm>({
        assetCategory: String(assetCategory.id),
        assetType: String(assetType.id),
        assetIdSeries: "",
        assetId: "",
        assetName: "",
        location: "",
        purchasedOn: "",
        warrantyExpiresOn: "",
        assetConditionId: "",
        assetStatus: "",
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
    const [customFields, setCustomFields] = useState<Record<string, string | string[]>>({});

    const { data: assetConfigs } = useGetAssetConfigsQuery(undefined, {
        refetchOnMountOrArgChange: true
    });
    const { data: assetConditions } = useGetAssetConditionsQuery(undefined,
        {refetchOnMountOrArgChange: true}
    );

    const { data: assetConfigsAssetId, isFetching: isFetchingAssetId } = useGetAssetConfigAssetIdQuery(undefined, {
        refetchOnMountOrArgChange: true
    });

    const assetSeriesOptions = [
        {
            label: "Manual",
            value: "manual"
        },
        ...(assetConfigs
            ?.filter((config) => config.isAssestSeriesEnabled)
            .map((config) => ({
                label: config.seriesTitle,
                value: String(config.id),
            })) ?? []),
    ];
    
    const assetConditionOptions = [
        ...(assetConditions?.map((condition) => ({
            label: condition.conditionName,
            value: String(condition.id),
        })) ?? []),
    ];

    useEffect(() => {
        if (open) {
            if (!isEdit) {
                setForm({
                    assetCategory: String(assetCategory?.id),
                    assetType: String(assetType?.id),
                    assetIdSeries: "",
                    assetId: "",
                    assetName: "",
                    location: "",
                    purchasedOn: "",
                    warrantyExpiresOn: "",
                    assetConditionId: "",
                    assetStatus: "",
                });
                setAttachments([]);
                setExistingAttachments([]);
                setCustomFields({});
            } else {
                setForm((prev) => ({
                    ...prev,
                    assetCategory: String(assetCategory?.id),
                    assetType: String(assetType?.id),
                }));
            }
        }
    }, [open, assetCategory, assetType]);

    useEffect(() => {
        if (isEdit && editRow) {
            setExistingAttachments(editRow.attachments ?? []);
            setAttachments([]);

            setForm({
                assetCategory: String(assetCategory?.id || ""),
                assetType: String(assetType?.id || ""),
                assetIdSeries: editRow.assetIdSeries || "",
                assetId: editRow.assetId || "",
                assetName: editRow.assetName || "",
                location: editRow.location || "",
                purchasedOn: editRow.purchasedOn || "",
                warrantyExpiresOn: editRow.warrantyExpiresOn || "",
                assetConditionId: String(editRow.assetCondition?.id || ""),
                assetStatus: String(editRow.assetStatus || ""),
            });

            const initialCustomFields: Record<string, string | string[]> = {};
            const attributes = assetType?.assetTypeAttributes ?? [];

            attributes.forEach((attr) => {
                const label = attr.label;

                // Check editRow.attributes object keyed by label (exact match)
                if (editRow.attributes && editRow.attributes[label] !== undefined) {
                    initialCustomFields[label] = editRow.attributes[label];
                    return;
                }

            });

            setCustomFields(initialCustomFields);
        }
    }, [isEdit, editRow, assetType, assetCategory]);

    useEffect(() => {
        if (!form.assetIdSeries || form.assetIdSeries === "manual") {
            if (!isEdit) setForm((prev) => ({ ...prev, assetId: "" }));
            return;
        }
        if (!assetConfigsAssetId || isFetchingAssetId) return;

        const matchedAssetId = String(assetConfigsAssetId?.[form.assetIdSeries as keyof typeof assetConfigsAssetId]);

        setForm((prev) => ({ ...prev, assetId: matchedAssetId ?? "" }));
    }, [form.assetIdSeries]); // change asset id  series id 

    const handleUploadAttachment = (file: File | File[] | null) => {

        if (!file) return;
        const newFiles = Array.isArray(file) ? file : [file];
        setAttachments(newFiles);
    };

    const removeNewAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (index: number) => {
        setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (key: keyof AssetForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleCustomFieldChange = (label: string, value: string | string[]) => {
        setCustomFields((prev) => ({ ...prev, [label]: value }));
    };

    const handleSave = () => {
        const formData = new FormData();

        Object.entries(form).forEach(([key, value]) => {
            if (key === "attachments" || key === "attributeValues") return; // handled separately below
            formData.append(key, (value as string) ?? "");
        });

        // asset attributes (custom fields)
        formData.append("attributes", JSON.stringify(customFields));

        // New files
        attachments.forEach((file) => {
            formData.append("files", file);
        });

        if (isEdit) {
            const attachmentNames = existingAttachments.map((a) => a.filename);
            formData.append("attachmentNames", JSON.stringify(attachmentNames));
        }

        onSave(formData);
    };

    const mainFormInvalid =
        !form.assetCategory ||
        !form.assetType ||
        !form.assetIdSeries ||
        (form.assetIdSeries === "manual" && !form.assetId) ||
        !form.assetName ||
        !form.purchasedOn ||
        !form.warrantyExpiresOn ||
        !form.assetConditionId ||
        !form.assetStatus;

    const customFieldsInvalid =
        assetType.assetTypeAttributes?.some((attr) => {
            if (attr.mandatory) {
                const val = customFields[attr.label];
                if (Array.isArray(val)) {
                    return val.length === 0;
                }
                return !val || String(val).trim() === "";
            }
            return false;
        }) ?? false;

    const isSaveDisabled = mainFormInvalid || customFieldsInvalid;

    const attributes = assetType.assetTypeAttributes ?? [];

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            maxWidth="lg"
            height={650}
            title={isEdit ? "Edit Asset" : "Add Asset"}
        >
            <Box p={3}>
                <Box>
                    <Stack spacing={3}>

                        {/* Asset Details */}
                        <Typography variant="subtitle1">Asset details</Typography>

                        <Stack direction="row" spacing={3}>
                            <SingleSelectElement
                                label="Asset Category"
                                value={form.assetCategory}
                                options={[
                                    {
                                        label: assetCategory.categoryName,
                                        value: String(assetCategory.id)
                                    },
                                ]}
                                disabled
                                required
                                onChange={(v) => handleChange("assetCategory", v as string)}
                                sx={{ flex: 1 }}
                                clearable={false}
                            />
                            <SingleSelectElement
                                label="Asset Type"
                                value={form.assetType}
                                required
                                options={[
                                    {
                                        label: assetType.typeName,
                                        value: String(assetType.id)
                                    },
                                ]}
                                disabled
                                onChange={(v) => handleChange("assetType", v as string)}
                                sx={{ flex: 1 }}
                                clearable={false}
                            />
                        </Stack>

                        <Stack direction="row" spacing={3}>
                            <SingleSelectElement
                                label="Asset ID series"
                                value={form.assetIdSeries}
                                required
                                options={assetSeriesOptions}
                                onChange={(v) => handleChange("assetIdSeries", v as string)}
                                sx={{ flex: 1 }}
                                disabled={isEdit}
                            />
                            <TextFieldElement
                                label="Asset ID"
                                placeholder="Enter asset ID"
                                disabled={form.assetIdSeries !== "manual" || isEdit}
                                value={form.assetId}
                                required={form.assetIdSeries !== "manual" ? false : true}
                                onChange={(e) =>
                                    handleChange("assetId", e.target.value)
                                }
                                sx={{ flex: 1 }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={3}>
                            <TextFieldElement
                                label="Asset Name"
                                placeholder="Enter asset name"
                                required
                                value={form.assetName}
                                onChange={(e) =>
                                    handleChange("assetName", e.target.value)
                                }
                                sx={{ flex: 1 }}
                            />
                            <TextFieldElement
                                label="Location"
                                value={form.location}
                                onChange={(e) => handleChange("location", e.target.value)}
                                sx={{ flex: 1 }}
                            />

                        </Stack>

                        <Stack direction="row" spacing={3} width="100%">
                            <DatePickerElement
                                label="Purchased On"
                                value={form.purchasedOn ? dayjs(form.purchasedOn) : null}
                                onChange={(val: Dayjs | null) =>
                                    handleChange("purchasedOn", val ? val.format("YYYY-MM-DD") : "")
                                }
                                width={"50%"}
                                required
                                max={dayjs(Date.now())}
                            />
                            <DatePickerElement
                                label="Warranty expires on"

                                value={form.warrantyExpiresOn ? dayjs(form.warrantyExpiresOn) : null}
                                onChange={(val: Dayjs | null) =>
                                    handleChange("warrantyExpiresOn", val ? val.format("YYYY-MM-DD") : "")
                                }
                                required
                                min={dayjs(form.purchasedOn).add(1, "day")}
                                width={"50%"}
                            />
                        </Stack>

                        {/* Custom Fields */}
                        {attributes.length > 0 && (
                            <>
                                <Typography variant="subtitle1">Asset custom fields</Typography>

                                <Stack spacing={3}>
                                    {attributes
                                        .reduce((resultArray, item, index) => {
                                            const chunkIndex = Math.floor(index / 2);
                                            if (!resultArray[chunkIndex]) {
                                                resultArray[chunkIndex] = [];
                                            }
                                            resultArray[chunkIndex].push(item);
                                            return resultArray;
                                        }, [] as any[][])
                                        .map((chunk, chunkIndex) => (
                                            <Stack direction="row" spacing={3} key={`custom-field-row-${chunkIndex}`}>
                                                {chunk.map((attr) => {
                                                    const typeLower = attr.type?.toLowerCase() ?? "text";
                                                    const isMulti =
                                                        typeLower === "multi select" ||
                                                        typeLower === "multiple select";
                                                    const isSingle = typeLower === "single select";
                                                    const isDatePicker = typeLower === "date";

                                                    const options =
                                                        attr.values?.map((v: any) => ({
                                                            label: v.value,
                                                            value: v.value,
                                                        })) || [];

                                                    const customFieldName = attr.label;

                                                    if (isMulti) {
                                                        return (
                                                            <Box sx={{ flex: 1 }} key={customFieldName}>
                                                                <MultiSelectElement
                                                                    label={customFieldName}
                                                                    value={(customFields[customFieldName] as string[]) || []}
                                                                    required={attr.mandatory}
                                                                    options={options}
                                                                    // disabled={isEdit}
                                                                    onChange={(val) =>
                                                                        handleCustomFieldChange(customFieldName, val)
                                                                    }
                                                                    sx={{ width: "100%" }}
                                                                />
                                                            </Box>
                                                        );
                                                    }

                                                    if (isSingle) {
                                                        return (
                                                            <SingleSelectElement
                                                                key={customFieldName}
                                                                label={customFieldName}
                                                                value={(customFields[customFieldName] as string) || ""}
                                                                required={attr.mandatory}
                                                                options={options}
                                                                // disabled={isEdit}
                                                                onChange={(val) =>
                                                                    handleCustomFieldChange(customFieldName, val as string)
                                                                }
                                                                sx={{ flex: 1 }}
                                                            />
                                                        );
                                                    }

                                                    if (isDatePicker) {
                                                        return (
                                                            <Box sx={{ flex: 1 }} key={customFieldName}>
                                                                <DatePickerElement
                                                                    label={customFieldName}
                                                                    value={
                                                                        customFields[customFieldName]
                                                                            ? dayjs(customFields[customFieldName] as string)
                                                                            : null
                                                                    }
                                                                    required={attr.mandatory}
                                                                    // disabled={isEdit}
                                                                    onChange={(val: Dayjs | null) =>
                                                                        handleCustomFieldChange(
                                                                            customFieldName,
                                                                            val ? val.format("YYYY-MM-DD") : ""
                                                                        )
                                                                    }
                                                                    width={"100%"}
                                                                />
                                                            </Box>
                                                        );
                                                    }

                                                    return (
                                                        <TextFieldElement
                                                            key={customFieldName}
                                                            label={customFieldName}
                                                            type={typeLower}
                                                            value={(customFields[customFieldName] as string) || ""}
                                                            required={attr.mandatory}
                                                            // disabled={isEdit}
                                                            onChange={(e) =>
                                                                handleCustomFieldChange(customFieldName, e.target.value)
                                                            }
                                                            sx={{ flex: 1 }}
                                                        />
                                                    );
                                                })}

                                                {chunk.length === 1 && <Box sx={{ flex: 1 }} />}
                                            </Stack>
                                        ))}
                                </Stack>
                            </>
                        )}

                        {/* Condition & Status */}
                        <Typography variant="subtitle1">
                            Asset condition and status
                        </Typography>

                        <Stack direction="row" spacing={3}>
                            <SingleSelectElement
                                label="Asset Condition"
                                value={form.assetConditionId}
                                required
                                options={assetConditionOptions}
                                onChange={(v) =>
                                    handleChange("assetConditionId", v as string)
                                }
                                sx={{ flex: 1 }}
                            />
                            <SingleSelectElement
                                label="Asset Status"
                                value={form.assetStatus}
                                required
                                options={[
                                    { label: "Available", value: "available" },
                                    { label: "Not Available", value: "not_available" },
                                    ...(isEdit
                                        ? [
                                            { label: "Assigned", value: "assigned" },
                                            // { label: "Recovered", value: "recovered" },
                                        ]
                                        : []),
                                ]}
                                onChange={(v) =>
                                    handleChange("assetStatus", v as string)
                                }
                                sx={{ flex: 1 }}
                            />
                        </Stack>

                        <Typography variant="subtitle1"> Asset Attachments</Typography>

                        <FileUploadField
                            label="Add Attachment"
                            value={attachments}
                            onChange={handleUploadAttachment}
                            multiple
                            accept={[
                                "application/pdf",
                                "image/*",
                            ]}
                            maxSize={10}
                        />

                        {/* Existing Attachments */}
                        {existingAttachments.length > 0 && (
                            <Stack spacing={1} sx={{ flexShrink: 0, width: '40%', }}>
                                <Typography variant="caption" color="text.secondary">
                                    Existing Attachments
                                </Typography>
                                {existingAttachments.map((file, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{
                                            px: 1.5,
                                            py: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Typography variant="body2">{file.filename}</Typography>
                                        <PrimaryIconButton
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            onClick={() => removeExistingAttachment(index)}
                                            icon={<DeleteIcon fontSize="small" />}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        )}

                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            {/* File list — only shown when there are files */}
                            {attachments.length > 0 && (
                                <Stack spacing={1} sx={{ flexShrink: 0, width: '40%', }}>
                                    <Typography variant="caption" color="text.secondary">
                                        New Attachments
                                    </Typography>
                                    {attachments.map((file, index) => (
                                        <Stack
                                            key={index}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                sx={{ flex: 1, minWidth: 0, mr: 0.5 }}
                                            >
                                                {file.name}
                                            </Typography>
                                            <PrimaryIconButton
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => removeNewAttachment(index)}
                                                icon={<DeleteIcon fontSize="small" />}
                                            />
                                        </Stack>
                                    ))}
                                </Stack>
                            )}

                            {attachments.length > 0 && <>
                                <Divider orientation="vertical" flexItem />
                                <Box sx={{ flex: 1 }}>
                                    <AttachmentCarousel
                                        attachments={attachments}
                                        sx={{
                                            height: '60vh'
                                        }}
                                    />
                                </Box>
                            </>
                            }
                        </Stack>

                    </Stack>
                </Box>
            </Box>

            <Box display="flex" justifyContent="flex-end">
                <PrimaryButton onClick={handleSave} disabled={isSaveDisabled}>
                    Save
                </PrimaryButton>
            </Box>
        </ModalElement>
    );
};