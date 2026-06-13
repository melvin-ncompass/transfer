import { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../../components/atom/text-area-field/TextAreaField";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { ToggleSwitch } from "../../../../../../components/atom/toggle-switch/ToggleSwitch";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import type { AssetConfigResponse } from "../api/assetConfig.api";

const DIGIT_OPTIONS = [
    { label: "1 digit", value: "1" },
    { label: "2 digits", value: "2" },
    { label: "3 digits", value: "3" },
    { label: "4 digits", value: "4" },
    { label: "5 digits", value: "5" },
    { label: "6 digits", value: "6" },
];

interface EditAssetIdSeriesModalProps {
    open: boolean;
    config: AssetConfigResponse | null;
    onClose: () => void;
    onSave: (id: number, data: Partial<{
        seriesTitle: string;
        description: string;
        numberOfDigits: string;
        isAssestSeriesEnabled: boolean;
        nextNumber: string;
        prefix: string;
        suffix: string;
    }>) => void;
}

export function EditAssetIdSeriesModal({ open, config, onClose, onSave }: EditAssetIdSeriesModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [prefix, setPrefix] = useState("");
    const [digits, setDigits] = useState("2");
    const [suffix, setSuffix] = useState("");
    const [nextNumber, setNextNumber] = useState("");
    const [enabled, setEnabled] = useState(true);
    const [titleError, setTitleError] = useState("");

    useEffect(() => {
        if (open && config) {
            setTitle(config.seriesTitle);
            setDescription(config.description ?? "");
            setPrefix(config.prefix ?? "");
            setDigits(String(config.numberOfDigits));
            setSuffix(config.suffix ?? "");
            setNextNumber(String(config.nextNumber));
            setEnabled(config.isAssestSeriesEnabled);
            setTitleError("");
        }
    }, [open, config]);

    const preview = useMemo(() => {
        if (!nextNumber) return "";
        const digitCount = parseInt(digits, 10);
        const paddedNumber = String(nextNumber).padStart(digitCount, "0");
        return `${prefix}${paddedNumber}${suffix}`;
    }, [prefix, digits, suffix, nextNumber]);

    const hasChanges =
        title !== (config?.seriesTitle ?? "") ||
        description !== (config?.description ?? "") ||
        prefix !== (config?.prefix ?? "") ||
        digits !== String(config?.numberOfDigits ?? "") ||
        suffix !== (config?.suffix ?? "") ||
        nextNumber !== String(config?.nextNumber ?? "") ||
        enabled !== config?.isAssestSeriesEnabled;

    const handleSave = () => {
        if (!title.trim()) {
            setTitleError("Series Title is required");
            return;
        }
        if (config) {
            onSave(config.id, {
                seriesTitle: title.trim(),
                description: description.trim(),
                numberOfDigits: digits,
                isAssestSeriesEnabled: enabled,
                nextNumber: nextNumber.trim(),
                prefix: prefix.trim() || "",
                suffix: suffix.trim() || "",
            });
        }
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Asset ID Series"
            onClick={handleSave}
            maxWidth="sm"
            disabled={!title.trim() || !String(nextNumber).trim() || !hasChanges}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
                <TextFieldElement
                    name="title"
                    label="Asset Series Title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (titleError) setTitleError("");
                    }}
                    required
                    fullWidth
                    placeholder="Enter Asset Series Title"
                    error={!!titleError}
                    helperText={titleError}
                />

                <TextAreaField
                    label="Description"
                    value={description}
                    onChange={(val) => setDescription(val)}
                    width="100%"
                    rows={3}
                />

                {/* Row: Prefix | Suffix */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <TextFieldElement
                        name="prefix"
                        label="Prefix"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="Enter Prefix"
                        fullWidth
                    />
                    <TextFieldElement
                        name="suffix"
                        label="Suffix"
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        placeholder="Enter Suffix"
                        fullWidth
                    />
                </Box>

                {/* Row: Number of digits | Next number */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <SingleSelectElement
                        label="Number of digits"
                        value={digits}
                        onChange={(val) => setDigits(val as string)}
                        options={DIGIT_OPTIONS}
                        required
                        fullWidth
                    />
                    <TextFieldElement
                        name="nextNumber"
                        label="Next number"
                        type="number"
                        value={nextNumber}
                        onChange={(e) => setNextNumber(e.target.value)}
                        required
                        placeholder="Enter Next Number"
                        fullWidth
                    />
                </Box>

                {/* Asset ID Preview — full width */}
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block", fontWeight: 500 }}>
                        Asset ID Preview
                    </Typography>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        minHeight: "44px",
                        display: "flex",
                        alignItems: "center",
                        color: preview ? "text.primary" : "text.disabled",
                        fontWeight: 600,
                        border: "1px solid",
                        borderColor: "grey.200",
                        fontSize: "0.95rem",
                    }}>
                        {preview || "Preview will appear here"}
                    </Box>
                </Box>

                <ToggleSwitch
                    label="Enable Asset Series"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                />
            </Box>
        </ModalElement>
    );
}
