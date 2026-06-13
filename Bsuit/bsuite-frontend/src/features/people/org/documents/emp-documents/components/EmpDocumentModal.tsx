import { Box, Stack } from "@mui/system";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { useState, useEffect } from "react";
import { RadioButton } from "../../../../../../components/atom/radio-button";
import { Typography } from "@mui/material";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { AutocompleteElement } from "../../../../../../components/atom/autocomplete";
import { RepeaterElement } from "../../../../../../components/atom/form-repeater/FormRepeater";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import {
    useCreateEmployeeDocFolderTypeMutation,
    useUpdateEmployeeDocFolderTypeMutation,
    useGetEmployeeDocFolderTypeByIdQuery,
    type EmployeeDocumentType,
    type CreateEmployeeDocumentTypeRequest,
    type CustomFormField,
} from "../api/employee-doc.api";

type EmpDocumentModalProps = {
    open: boolean;
    onClose: () => void;
    isEdit: boolean;
    editRow?: EmployeeDocumentType | null;
    folderId: number;
};

export const EmpDocumentModal = ({
    open,
    onClose,
    isEdit,
    editRow,
    folderId,
}: EmpDocumentModalProps) => {
    const [documentName, setDocumentName] = useState<string>("");
    const [documentDescription, setDocumentDescription] = useState<string>("");
    const [isMandatory, setIsMandatory] = useState<boolean>(false);
    const [isNotApplicable, setIsNotApplicable] = useState<boolean>(false);
    const [isVerificationRequired, setIsVerificationRequired] = useState<boolean>(false);
    const [isFileUploadOptional, setIsFileUploadOptional] = useState<boolean>(false);

    const [attachmentType, setAttachmentType] = useState<string>("single");

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    type LocalCustomField = {
        id: number;
        label: string;
        fieldType: string;
        values: string[];
        mandatory: boolean;
    };

    const [customFields, setCustomFields] = useState<LocalCustomField[]>([
        { id: Date.now(), label: "", fieldType: "", values: [], mandatory: false }
    ]);

    const fieldTypeOptions = [
        { label: "Text", value: "text" },
        { label: "Text Area", value: "text_area" },
        { label: "Number", value: "number" },
        { label: "Date", value: "date" },
        { label: "Time", value: "time" },
        { label: "Single Select", value: "Single Select" },
        { label: "Multiple Select", value: "Multi Select" },
    ];

    // API Hooks
    const [createDocumentType] = useCreateEmployeeDocFolderTypeMutation();
    const [updateDocumentType] = useUpdateEmployeeDocFolderTypeMutation();

    const { data: editData } = useGetEmployeeDocFolderTypeByIdQuery(
        editRow?.id || 0,
        { skip: !isEdit || !editRow?.id }
    );

    // Pre-fill form when editing
    useEffect(() => {
        if (!open) return;

        if (isEdit && editData) {
            setDocumentName(editData.documentTypeName ?? "");
            setDocumentDescription(editData.description ?? "");
            setIsMandatory(editData.isMandatory ?? false);
            setIsNotApplicable(editData.isNotApplicable ?? false);
            setIsVerificationRequired(editData.isVerificationRequired ?? false);
            setIsFileUploadOptional(editData.isFileUploadOptional ?? false);
            setAttachmentType(editData.attachmentType ?? "single");

            if (editData.customFormFields && editData.customFormFields.length > 0) {
                setCustomFields(
                    editData.customFormFields.map((f: CustomFormField, idx: number) => ({
                        id: Date.now() + idx,
                        label: f.fieldLabel,
                        fieldType: f.fieldType,
                        values: f.values ?? [],
                        mandatory: f.isMandatory,
                    }))
                );
            } else {
                setCustomFields([
                    { id: Date.now(), label: "", fieldType: "", values: [], mandatory: false }
                ]);
            }
        } else if (!isEdit) {
            // Reset form for "Add"
            setDocumentName("");
            setDocumentDescription("");
            setIsMandatory(false);
            setIsNotApplicable(false);
            setIsVerificationRequired(false);
            setIsFileUploadOptional(false);
            setAttachmentType("single");
            setCustomFields([
                { id: Date.now(), label: "", fieldType: "", values: [], mandatory: false }
            ]);
        }
    }, [open, isEdit, editData]);

    const handleClearFields = () => {
        setDocumentName("");
        setDocumentDescription("");
        setIsMandatory(false);
        setIsNotApplicable(false);
        setIsVerificationRequired(false);
        setIsFileUploadOptional(false);
        setAttachmentType("single");
        setCustomFields([
            { id: Date.now(), label: "", fieldType: "", values: [], mandatory: false }
        ]);
    }





    const handleSave = async () => {
        const payload: CreateEmployeeDocumentTypeRequest = {
            documentTypeName: documentName.trim(),
            description: documentDescription.trim(),
            // documentFolder: { id: folderId },
            isMandatory,
            isNotApplicable,
            isVerificationRequired,
            isFileUploadOptional,
            attachmentType,
            customFormFields: customFields
                .filter((f) => f.label.trim() !== "" && f.fieldType.trim() !== "")
                .map((f) => ({
                    fieldLabel: f.label,
                    fieldType: f.fieldType,
                    values: f.values,
                    isMandatory: f.mandatory,
                })),
        };

        try {
            if (isEdit && editRow?.id) {
                await updateDocumentType({ id: editRow.id, body: payload }).unwrap();
                setSnackbar({
                    open: true,
                    message: "Document type updated successfully",
                    color: "success",
                });
            } else {
                await createDocumentType({ folderId, body: payload }).unwrap();
                setSnackbar({
                    open: true,
                    message: "Document type created successfully",
                    color: "success",
                });
            }
            onClose();
            handleClearFields();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error?.data?.message || "Failed to save document type",
                color: "error",
            });
        }
    };

    const normalizeFields = (fields?: any[]) => {
        if (!fields) return [];

        return fields.map((f) => ({
            fieldLabel: f.fieldLabel ?? f.label,
            fieldType: f.fieldType,
            values: f.values ?? [],
            isMandatory: f.isMandatory ?? f.mandatory,
        }));
    };

    const hasChanges = () => {
        const basicChanged =
            documentName.trim() !== editData?.documentTypeName ||
            documentDescription.trim() !== editData?.description ||
            isMandatory !== editData?.isMandatory ||
            isNotApplicable !== editData?.isNotApplicable ||
            isVerificationRequired !== editData?.isVerificationRequired ||
            isFileUploadOptional !== editData?.isFileUploadOptional ||
            attachmentType !== editData?.attachmentType;

        const original = normalizeFields(editData?.customFormFields);

        /* 
        * Filter out empty/blank fields before comparing so the single blank
        * default row doesn't count as a change when editData has no fields. 
        * */
        const current = normalizeFields(
            customFields.filter((f) => f.label.trim() !== "" || f.fieldType.trim() !== "")
        );

        const fieldsChanged =
            original.length !== current.length ||
            JSON.stringify(current) !== JSON.stringify(original);

        return basicChanged || fieldsChanged;
    };

    const isFormValid = () => {
        const isBasicValid = documentName.trim() !== "" && documentDescription.trim() !== "";
        if (!isBasicValid) return false;

        if (isFileUploadOptional) {
            const hasMandatoryField = customFields.some(
                (f) => f.label.trim() !== "" && f.fieldType.trim() !== "" && f.mandatory
            );
            if (!hasMandatoryField) return false;
        }

        const areFieldsValid = customFields.every((field) => {
            const hasLabel = field.label.trim() !== "";
            const hasType = field.fieldType && field.fieldType.trim() !== "";
            const isSelectType = field.fieldType === "Single Select" || field.fieldType === "Multi Select";

            if (!hasLabel && !hasType) return true;
            if (!hasLabel || !hasType) return false;
            if (isSelectType && (!field.values || field.values.length === 0)) return false;

            return true;
        });

        return areFieldsValid;
    };

    const getDisabledReason = () => {
        if (!isFormValid()) {
            const reasons: string[] = [];
            if (documentName.trim() === "") reasons.push("Document Name is required");
            if (documentDescription.trim() === "") reasons.push("Document Description is required");
            
            if (isFileUploadOptional) {
                const hasMandatoryField = customFields.some(
                    (f) => f.label.trim() !== "" && f.fieldType.trim() !== "" && f.mandatory
                );
                if (!hasMandatoryField) {
                    reasons.push("At least one custom field must be mandatory if file upload is optional");
                }
            }

            customFields.forEach((field, index) => {
                const hasLabel = field.label.trim() !== "";
                const hasType = field.fieldType && field.fieldType.trim() !== "";
                const isSelectType = field.fieldType === "Single Select" || field.fieldType === "Multi Select";

                if (hasLabel && !hasType) {
                    reasons.push(`Field ${index + 1} is missing a Field Type`);
                }
                if (!hasLabel && hasType) {
                    reasons.push(`Field ${index + 1} is missing a Field Label`);
                }
                if (hasLabel && hasType && isSelectType && (!field.values || field.values.length === 0)) {
                    reasons.push(`Field ${index + 1} (${field.label}) is missing values/options`);
                }
            });

            return reasons.join(", ");
        }

        if (!hasChanges()) {
            return "No changes to save";
        }

        return "";
    };

    return (
        <>
            <ModalElement
                maxWidth="lg"
                open={open}
                title={isEdit ? "Edit Document Type" : "Add Document Type"}
                onClose={() => {
                    onClose();
                    handleClearFields();
                }}
                sx={{
                    "& .MuiDialog-paper": { width: { xs: "98vw", sm: 800, md: 1000 }, margin: 2 }
                }}
            >
                <Box sx={{ p: 1, height: "100%" }} key={editRow?.id || "create"} >
                    <Stack spacing={2} gap={1} direction="column" height="100%">
                        <TextFieldElement
                            fullWidth
                            label="Document Name"
                            placeholder="Enter document name"
                            value={documentName}
                            required
                            onChange={(e) => setDocumentName(e.target.value)}
                            inputProps={{ maxLength: 100 }}
                        />
                        <TextFieldElement
                            fullWidth
                            label="Document Description"
                            placeholder="Enter document description"
                            value={documentDescription}
                            onChange={(e) => setDocumentDescription(e.target.value)}
                            multiline
                            rows={2}
                            required
                            inputProps={{ maxLength: 500 }}
                        />

                        {/* Top Checkboxes Row */}
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={2}
                        >
                            <Stack spacing={1}>
                                <Checkbox
                                    label="Document is mandatory"
                                    checked={isMandatory}
                                    onChange={(e) => setIsMandatory(e.target.checked)}
                                />
                                <Checkbox
                                    label="Can employee mark as not applicable"
                                    checked={isNotApplicable}
                                    onChange={(e) => setIsNotApplicable(e.target.checked)}
                                />
                            </Stack>

                            <Stack spacing={1}>
                                <Checkbox
                                    label="Document verification required"
                                    checked={isVerificationRequired}
                                    onChange={(e) => setIsVerificationRequired(e.target.checked)}
                                />
                                <Checkbox
                                    label="File upload is optional (At least one form field below should be mandatory)"
                                    checked={isFileUploadOptional}
                                    onChange={(e) => setIsFileUploadOptional(e.target.checked)}
                                />
                            </Stack>
                        </Stack>

                        <Stack spacing={1}>
                            <Typography variant="subtitle2">
                                Number of attachments allowed per employee?
                            </Typography>

                            <Stack direction="row" spacing={4}>
                                <RadioButton
                                    label="Employees can have single attachment of this type"
                                    value="single"
                                    checked={attachmentType === "single"}
                                    onChange={() => setAttachmentType("single")}
                                />
                                <RadioButton
                                    label="Employees can have multiple attachments of this type"
                                    value="multiple"
                                    checked={attachmentType === "multiple"}
                                    onChange={() => setAttachmentType("multiple")}
                                />
                            </Stack>
                        </Stack>

                        <RepeaterElement<LocalCustomField>
                            label="Custom Form Fields"
                            items={customFields}
                            setItems={setCustomFields}
                            initialItem={{ id: Date.now(), label: "", fieldType: "", values: [], mandatory: false }}
                            boxed={false}
                            gap={2}
                            renderItem={(field, index, handleChange) => (
                                <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                                    <Box sx={{ flex: 2 }}>
                                        {index === 0 && (
                                            <Typography variant="caption" sx={{ display: 'block', px: 1, mb: 0.5 }}>
                                                Field Label
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
                                            <Typography variant="caption" sx={{ display: 'block', px: 1, mb: 0.5 }}>
                                                Field Type
                                            </Typography>
                                        )}
                                        <SingleSelectElement
                                            label=""
                                            options={fieldTypeOptions}
                                            value={field.fieldType}
                                            onChange={(val: string) => handleChange("fieldType", val)}

                                        />
                                    </Box>

                                    <Box sx={{ flex: 2, }}>
                                        {index === 0 && (
                                            <Typography variant="caption" sx={{ display: 'block', px: 1, mb: 0.5 }}>
                                                Values
                                            </Typography>
                                        )}
                                        <AutocompleteElement
                                            options={[]}
                                            value={field.values}
                                            multiple
                                            freeSolo
                                            placeholder={
                                                field.fieldType !== "Single Select" && field.fieldType !== "Multi Select"
                                                    ? "Not applicable"
                                                    : "Type and press comma"
                                            }
                                            onChange={(_: any, newValue: string[]) => handleChange("values", newValue)}
                                            disabled={
                                                field.fieldType !== "Single Select" && field.fieldType !== "Multi Select"
                                            }

                                        />
                                    </Box>

                                    <Box sx={{ width: 100, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }}>
                                        {index === 0 && (
                                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Tooltip title={getDisabledReason()} placement="top">
                            <span>
                                <PrimaryButton
                                    onClick={handleSave}
                                    disabled={!isFormValid() || !hasChanges()}
                                >
                                    Save
                                </PrimaryButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
            </ModalElement>
            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                />
            )}
        </>
    );
};