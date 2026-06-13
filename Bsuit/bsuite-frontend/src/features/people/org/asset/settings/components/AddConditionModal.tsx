import { useState } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../../components/atom/text-area-field/TextAreaField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";

export interface AssetCondition {
    id: number;
    conditionName: string;
    description: string;
}

interface AddConditionModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (condition: Omit<AssetCondition, "id">) => void;
}

export function AddConditionModal({ open, onClose, onSave }: AddConditionModalProps) {
    const [conditionName, setConditionName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!conditionName.trim()) {
            setError("Condition Name is required");
            return;
        }
        onSave({ conditionName, description });
        handleClose();
    };

    const handleClose = () => {
        setConditionName("");
        setDescription("");
        setError("");
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={handleClose}
            title="Add Condition"
            onClick={handleSave}
            maxWidth="sm"
            disabled={!conditionName.trim()}
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
