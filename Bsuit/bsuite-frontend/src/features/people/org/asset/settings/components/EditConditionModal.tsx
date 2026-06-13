import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../../components/atom/text-area-field/TextAreaField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import type { AssetConditionResponse } from "../api/assetCondition.api";

interface EditConditionModalProps {
    open: boolean;
    condition: AssetConditionResponse | null;
    onClose: () => void;
    onSave: (id: number, data: { conditionName: string; description?: string }) => void;
}

export function EditConditionModal({ open, condition, onClose, onSave }: EditConditionModalProps) {
    const [conditionName, setConditionName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && condition) {
            setConditionName(condition.conditionName);
            setDescription(condition.description ?? "");
            setError("");
        }
    }, [open, condition]);

    const hasChanges =
        conditionName !== (condition?.conditionName ?? "") ||
        description !== (condition?.description ?? "");

    const handleSave = () => {
        if (!conditionName.trim()) {
            setError("Condition Name is required");
            return;
        }
        if (condition) {
            onSave(condition.id, { conditionName, description: description || undefined });
        }
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Condition"
            onClick={handleSave}
            maxWidth="sm"
            disabled={!conditionName.trim() || !hasChanges}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextFieldElement
                    name="conditionName"
                    label="Condition Name"
                    required
                    fullWidth
                    value={conditionName}
                    onChange={(e) => {
                        setConditionName(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="Enter Condition Name"
                    error={!!error}
                    helperText={error}
                />
                <TextAreaField
                    label="Description"
                    value={description}
                    onChange={(val) => setDescription(val)}
                    width="100%"
                    rows={3}
                />
            </Box>
        </ModalElement>
    );
}
