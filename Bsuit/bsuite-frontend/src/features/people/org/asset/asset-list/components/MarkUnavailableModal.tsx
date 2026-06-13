import { Box, Stack } from "@mui/system";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import DeleteIcon from "@mui/icons-material/Delete";
import { useGetAssetConditionsQuery } from "../../settings/api/assetCondition.api";
import { useGetAssetUnavailableStatusesQuery } from "../../settings/api/assetUnavailableStatus.api";
import type { Asset, AssetCategoryType, AssetType } from "../../asset-category/api/assetCategory.api";

export type MarkUnavailableForm = {
    assetUnavailableStatusId: string;
    assetConditionId: string;
};

export const MarkUnavailableModal = ({
    open,
    onClose,
    onSave,
    assetList,
    activeType,
    activeCategory,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: MarkUnavailableForm) => void;
    assetList: Asset | null | any;
    activeType: AssetType | undefined | null,
    activeCategory: AssetCategoryType | undefined | null,

}) => {
    const [form, setForm] = useState<MarkUnavailableForm>({
        assetUnavailableStatusId: "",
        assetConditionId: "",
    });

    // const [attachments, setAttachments] = useState<File[]>([]);

    const { data: assetConditions } = useGetAssetConditionsQuery();
    const { data: unavailableStatuses } = useGetAssetUnavailableStatusesQuery();

    const assetConditionOptions = [
        ...(assetConditions?.map((condition) => ({
            label: condition.conditionName,
            value: String(condition.id),
        })) ?? []),
    ];

    const unavailableStatusOptions = [
        ...(unavailableStatuses?.map((status) => ({
            label: status.reasonName,
            value: String(status.id),
        })) ?? []),
    ];

    useEffect(() => {
        if (open) {
            setForm({
                assetUnavailableStatusId: "",
                assetConditionId: String(assetList?.asset?.assetCondition?.id || ""),
             
            });
            // setAttachments([]);
        }
    }, [open]);

    // const handleUploadAttachment = (file: File | File[] | null) => {
    //     if (!file) return;
    //     const newFiles = Array.isArray(file) ? file : [file];
    //     setAttachments((prev) => [...prev, ...newFiles]);
    // };

    // const removeNewAttachment = (index: number) => {
    //     setAttachments((prev) => prev.filter((_, i) => i !== index));
    // };

    const handleChange = (key: keyof MarkUnavailableForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        const payload: MarkUnavailableForm = {
            assetUnavailableStatusId: form.assetUnavailableStatusId,
            assetConditionId: form.assetConditionId,
        };

        onSave(payload);
    };

    const isSaveDisabled = !form.assetUnavailableStatusId || !form.assetConditionId;

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            maxWidth="md"
            title={`Mark as Not Available - ${assetList?.assetName || ''}`}
        >
            <Box p={3}>
                <Stack spacing={3}>
                    {/* Asset Details Readonly block */}
                    {assetList && (
                        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                            <Typography variant="subtitle2" mb={2}>Asset details</Typography>
                            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                                <Box minWidth={150}>
                                    <Typography variant="caption" color="text.secondary">Condition</Typography>
                                    <Typography variant="body2">{ assetList.conditionName || '-'}</Typography>
                                </Box>
                                <Box minWidth={150}>
                                    <Typography variant="caption" color="text.secondary">Asset Name</Typography>
                                    <Typography variant="body2">{assetList.assetName || '-'}</Typography>
                                </Box>
                                <Box minWidth={150}>
                                    <Typography variant="caption" color="text.secondary">Asset ID</Typography>
                                    <Typography variant="body2">{assetList.id || '-'}</Typography>
                                </Box>
                                <Box minWidth={150}>
                                    <Typography variant="caption" color="text.secondary">Asset Type</Typography>
                                    <Typography variant="body2">{activeType?.typeName || '-'}</Typography>
                                </Box>
                                <Box minWidth={150} mt={2}>
                                    <Typography variant="caption" color="text.secondary">Asset Category</Typography>
                                    <Typography variant="body2">{activeCategory?.categoryName || '-'}</Typography>
                                </Box>
                                <Box minWidth={150} mt={2}>
                                    <Typography variant="caption" color="text.secondary">Location</Typography>
                                    <Typography variant="body2">{assetList.location || '-'}</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {/* Form Fields */}
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2" mb={2} color="primary">Status change details</Typography>
                        <Stack direction="row" spacing={3}>
                            <SingleSelectElement
                                label="Reason for marking the asset as Not available"
                                value={form.assetUnavailableStatusId}
                                required
                                options={unavailableStatusOptions}
                                onChange={(v) => handleChange("assetUnavailableStatusId", v as string)}
                                sx={{ flex: 1 }}
                            />
                            <SingleSelectElement
                                label="Asset Condition"
                                value={form.assetConditionId}
                                required
                                options={assetConditionOptions}
                                onChange={(v) => handleChange("assetConditionId", v as string)}
                                sx={{ flex: 1 }}
                            />
                        </Stack>
                    </Box>

                    {/* Attachments */}
                    {/* <Box> */}
                        {/* <Typography variant="subtitle2" mb={1}>Additional attachments</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Additional attachments. For example: asset invoice, asset insurance documents etc.
                        </Typography> */}

                        {/* <FileUploadField
                            label="Add attachment"
                            value={attachments}
                            onChange={handleUploadAttachment}
                            multiple
                            maxSize={20}
                        /> */}

                        {/* {attachments.length > 0 && (
                            <Stack spacing={1} mt={2}>
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
                                        <Typography variant="body2">
                                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                        </Typography>
                                        <PrimaryIconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeNewAttachment(index)}
                                            icon={<DeleteIcon fontSize="small" />}
                                        />
                                    </Stack>
                                ))}
                            </Stack>
                        )} */}
                    {/* </Box> */}
                </Stack>
            </Box>

            <Box display="flex" justifyContent="flex-end" p={2}>
                <PrimaryButton onClick={handleSave} disabled={isSaveDisabled}>
                    Save
                </PrimaryButton>
            </Box>
        </ModalElement>
    );
};
