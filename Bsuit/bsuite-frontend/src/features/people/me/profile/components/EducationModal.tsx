import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { useUpdateEducationMutation } from "../api/profile.api";
import type { IEducationInformation } from "../types/profile.types";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";

interface Props {
    open: boolean;
    onClose: () => void;
    data: IEducationInformation;
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
}

export default function EducationModal({ open, onClose, data, employeeId, showMessage }: Props) {
    const [form, setForm] = useState<IEducationInformation>(data);
    const [updateEducation, { isLoading }] = useUpdateEducationMutation();

    useEffect(() => {
        if (open) setForm(data);
    }, [open, data]);

    const hasChanges = useMemo(() => {
        return (
            (form.branch ?? "") !== (data.branch ?? "") ||
            (form.cgpa ?? "") !== (data.cgpa ?? "") ||
            (form.degree ?? "") !== (data.degree ?? "") ||
            (form.university ?? "") !== (data.university ?? "") ||
            (form.tenure ?? "") !== (data.tenure ?? "")
        );
    }, [form, data]);

    const set = useCallback(
        (field: keyof IEducationInformation) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, [field]: e.target.value })),
        []
    );

    const handleSave = useCallback(async () => {
        try {
            const toNull = (value: string | undefined) => {
                const trimmed = (value ?? "").trim();
                return trimmed === "" ? null : trimmed;
            };
            await updateEducation({
                id: employeeId,
                body: {
                    branch: toNull(form.branch) as any,
                    cgpa: toNull(form.cgpa) as any,
                    degree: toNull(form.degree) as any,
                    university: toNull(form.university) as any,
                    tenure: toNull(form.tenure) as any,
                },
            }).unwrap();
            showMessage("Education details updated successfully.", "success");
            onClose();
        } catch (error: any) {
            showMessage(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update education details.", "error");
        }
    }, [form, employeeId, updateEducation, onClose, showMessage]);

    const hasIncompleteFields = useMemo(() => {
        return (
            !(form.branch ?? "").trim() ||
            !(form.cgpa ?? "").trim() ||
            !(form.degree ?? "").trim() ||
            !(form.university ?? "").trim() ||
            !(form.tenure ?? "").trim()
        );
    }, [form]);

    const isSaveDisabled = isLoading || !hasChanges || hasIncompleteFields;
    const saveDisabledTooltip = useMemo(
        () =>
            buildModalSaveDisabledTooltip([
                isLoading && "Save is in progress.",
                !hasChanges && "Make a change before saving.",
                hasIncompleteFields && "Please fill in all the fields.",
            ]),
        [isLoading, hasChanges, hasIncompleteFields],
    );

    const fields: { label: string; field: keyof IEducationInformation }[] = [
        { label: "Branch/Specialization *", field: "branch" },
        { label: "CGPA/Percentage *", field: "cgpa" },
        { label: "Degree *", field: "degree" },
        { label: "University/College *", field: "university" },
        { label: "Tenure *", field: "tenure" },
    ];

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Education Information"
            maxWidth="sm"
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {fields.map(({ label, field }) => (
                    <Box key={field}>
                        <Typography variant="subtitle2" mb={1}>{label}</Typography>
                        <TextFieldElement label="" fullWidth value={(form[field] as string) ?? ""} onChange={set(field)} />
                    </Box>
                ))}
            </Box>
        </ModalElement>
    );
}
