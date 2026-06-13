import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../../components/atom/text-area-field/TextAreaField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import type { AssetUnavailableStatusResponse } from "../api/assetUnavailableStatus.api";

interface EditReasonModalProps {
    open: boolean;
    reason: AssetUnavailableStatusResponse | null;
    onClose: () => void;
    onSave: (id: number, data: { reasonName: string; description?: string }) => void;
}

export function EditReasonModal({ open, reason, onClose, onSave }: EditReasonModalProps) {
    const [reasonName, setReasonName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && reason) {
            setReasonName(reason.reasonName);
            setDescription(reason.description ?? "");
            setError("");
        }
    }, [open, reason]);

    const hasChanges =
        reasonName !== (reason?.reasonName ?? "") ||
        description !== (reason?.description ?? "");

    const handleSave = () => {
        if (!reasonName.trim()) {
            setError("Reason Name is required");
            return;
        }
        if (reason) {
            onSave(reason.id, { reasonName, description: description || undefined });
        }
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Reason"
            onClick={handleSave}
            maxWidth="sm"
            disabled={!reasonName.trim() || !hasChanges}
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
