import { Stack, useTheme } from "@mui/system";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { Box, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { useEffect, useState } from "react";
import { RepeaterElement } from "../../../../../../components/atom/form-repeater";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { AutocompleteElement } from "../../../../../../components/atom/autocomplete";
import { Checkbox } from "../../../../../../components/atom/check-box";
import type { AssetType, AssetTypeAttribute } from "../api/assetCategory.api";

const fieldTypeOptions = [
    { label: "Text", value: "text" },
    { label: "Text Area", value: "text_area" },
    { label: "Number", value: "number" },
    { label: "Date", value: "date" },
    { label: "Time", value: "time" },
    { label: "Single Select", value: "Single Select" },
    { label: "Multiple Select", value: "Multi Select" },
];

export const AssetTypeModal = (
    {
        open,
        isEdit,
        onClose,
        onSave,
        assetTypeData,
    }: {
        open: boolean;
        isEdit: boolean;
        onClose: () => void;
        onSave: (data: any) => void;
        assetTypeData: AssetType | null;
    }) => {

    const [customFields, setCustomFields] = useState<AssetTypeAttribute[]>([
        { label: "", type: "", values: [], mandatory: false }
    ]);
    const [assetTypeName, setAssetTypeName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (open) {
            if (isEdit && assetTypeData) {
                setAssetTypeName(assetTypeData.typeName || "");
                setDescription(assetTypeData.description || "");

                const mappedAttributes = (assetTypeData.assetTypeAttributes || []).map((attr) => ({
                    ...attr,
                    values: (attr.values || []).map((v: any) =>
                        typeof v === "string" ? v : v.value
                    ),
                }));

                setCustomFields(mappedAttributes);
            } else {
                setAssetTypeName("");
                setDescription("");
                setCustomFields([{ label: "", type: "", values: [], mandatory: false }]);
            }
        }
    }, [open, isEdit, assetTypeData]);

    const handleClose = () => {
        onClose();
        setCustomFields([{ label: "", type: "", values: [], mandatory: false }]);
        setAssetTypeName("");
        setDescription("");
    }

    const handleSave = () => {
        const isSelectType = (type: string) =>
            type === "Single Select" || type === "Multi Select";

        const validFields = customFields.filter((field) => field.label.trim() !== "" || (field.type && field.type.trim() !== ""));

        const mappedAttributes = validFields.map((field) => {
            const mappedValues = isSelectType(field.type)
                ? (field.values ?? []).map((v) => ({
                    value: typeof v === "string" ? v : (v as any).value,
                }))
                : [];

                return {
                    label: field.label.trim(),
                    type: field.type,
                    mandatory: field.mandatory,
                    values: mappedValues,
                };
            });
        const trimmedAssetTypeName=assetTypeName.trim()
        const trimmedDescription=description.trim()
        
        onSave({
            typeName: trimmedAssetTypeName,
            description: trimmedDescription,
            assetTypeAttributes: mappedAttributes,
        });
    };

    const isCustomFieldsEqual = (arr1: AssetTypeAttribute[], arr2: AssetTypeAttribute[]) => {
        if (!arr1 && !arr2) return true;
        if (!arr1 || !arr2) return false;
        
        const validArr1 = arr1.filter((f) => f.label.trim() !== "" || (f.type && f.type.trim() !== ""));
        const validArr2 = arr2.filter((f) => f.label.trim() !== "" || (f.type && f.type.trim() !== ""));

        if (validArr1.length !== validArr2.length) return false;

        return validArr1.every((field1, index) => {
            const field2 = validArr2[index];
            if (!field2) return false;
            return field1.label === field2.label &&
                field1.type === field2.type &&
                field1.mandatory === field2.mandatory &&
                JSON.stringify(field1.values || []) === JSON.stringify(field2.values || []);
        });
    };

    const hasChanges = isEdit && assetTypeData ? (
        assetTypeName !== (assetTypeData.typeName || "") ||
        description !== (assetTypeData.description || "") ||
        !isCustomFieldsEqual(customFields, assetTypeData.assetTypeAttributes || [])
    ) : true;

    const isCustomFieldsValid = customFields.every((field) => {
        const hasLabel = field.label.trim() !== "";
        const hasType = field.type && field.type.trim() !== "";
        const isSelectType = field.type === "Single Select" || field.type === "Multi Select";

        if (!hasLabel && !hasType) return true;
        if (!hasLabel || !hasType) return false;
        if (isSelectType && (!field.values || field.values.length === 0)) return false;

        return true;
    });

    const isValid = assetTypeName.trim() !== "" && description.trim() !== "" && isCustomFieldsValid;

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            title={isEdit ? "Edit Asset Type" : "Add Asset Type"}
            onClose={() => {
                handleClose();
            }}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 600 }, margin: 2 },
            }}
        >
            <Box>
                <Stack spacing={2.5}>
                    <TextFieldElement
                        fullWidth
                        required
                        label="Asset Name"
                        value={assetTypeName}
                        onChange={(e) => setAssetTypeName(e.target.value)}
                    />
                    <TextFieldElement
                        label="Description"
                        value={description}
                        fullWidth
                        required
                        multiline
                        rows={2}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <Typography variant="body1">
                        Standard Asset Type Attributes
                    </Typography>
                    <Typography variant="caption">
                        The below attributes are standard and will appear in all asset
                        information forms under this asset type.
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                        Asset ID, Asset Name, Description, Location, Purchased On, Waranty Expires On,
                        State of Asset, Condition of Asset
                    </Typography>

                    <RepeaterElement<AssetTypeAttribute>
                        label="Custom Asset Type Attributes"
                        items={customFields}
                        setItems={setCustomFields}
                        initialItem={{ id: Date.now(), label: "", fieldType: "", values: [], mandatory: false }}
                        boxed={false}
                        gap={2}
                        renderItem={(field, index, handleChange) => (
                            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                                <Box sx={{ flex: 2, justifyContent: "center", alignItems: "center" }}>
                                    {index === 0 && (
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            Attribute Name
                                        </Typography>
                                    )}
                                    <TextFieldElement
                                        label=""
                                        fullWidth
                                        placeholder="Enter field label"
                                        value={field.label}
                                        onChange={(e) => handleChange("label", e.target.value)}
                                    />
                                </Box>

                                <Box sx={{ flex: 2, }}>
                                    {index === 0 && (
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            Field Type
                                        </Typography>
                                    )}
                                    <SingleSelectElement
                                        label=""
                                        options={fieldTypeOptions}
                                        value={field.type}
                                        onChange={(val: string) => handleChange("type", val)}

                                    />
                                </Box>

                                <Box sx={{ flex: 2, }}>
                                    {index === 0 && (
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            Values
                                        </Typography>
                                    )}
                                    <AutocompleteElement
                                        options={[]}
                                        value={field.values}
                                        multiple
                                        freeSolo

                                        placeholder={
                                            field.type !== "Single Select" && field.type !== "Multi Select"
                                                ? "Not applicable"
                                                : "Type and press comma"
                                        }
                                        onChange={(_: any, newValue: string[]) => handleChange("values", newValue)}
                                        disabled={
                                            field.type !== "Single Select" && field.type !== "Multi Select"
                                        }

                                    />
                                </Box>

                                <Box sx={{ width: 100, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }}>
                                    {index === 0 && (
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            Mandatory
                                        </Typography>
                                    )}
                                    <Checkbox
                                        checked={field.mandatory}
                                        onChange={(e) => handleChange("mandatory", e.target.checked)}
                                    />
                                </Box>
                            </Stack>
                        )}
                        canDeleteItem={(index) => customFields.length >= 1}
                    />

                </Stack>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2, mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <PrimaryButton
                        disabled={!isValid || !hasChanges}
                        onClick={handleSave}
                    >
                        Save
                    </PrimaryButton>
                </Box>
            </Box>

        </ModalElement>

    );
}
