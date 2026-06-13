import { useState } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../../components/atom/text-area-field/TextAreaField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";

export interface UnavailableReason {
    id: number;
    reasonName: string;
    description: string;
}

interface AddReasonModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (reason: Omit<UnavailableReason, "id">) => void;
}

export function AddReasonModal({ open, onClose, onSave }: AddReasonModalProps) {
    const [reasonName, setReasonName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!reasonName.trim()) {
            setError("Reason Name is required");
            return;
        }
        onSave({ reasonName, description });
        handleClose();
    };

    const handleClose = () => {
        setReasonName("");
        setDescription("");
        setError("");
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={handleClose}
            title="Add Reason"
            onClick={handleSave}
            maxWidth="sm"
            disabled={!reasonName.trim()}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextFieldElement
                    name="reasonName"
                    label="Reason Name"
                    required
                    fullWidth
                    value={reasonName}
                    onChange={(e) => {
                        setReasonName(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="Enter Reason Name"
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
