import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useMemo, useEffect } from "react";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { TextAreaField } from "../../../../../../components/atom/text-area-field/TextAreaField";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../../components/atom/button/PrimaryButton";
import { ToggleSwitch } from "../../../../../../components/atom/toggle-switch/ToggleSwitch";

export interface AddAssetIdSeriesModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const DIGIT_OPTIONS = [
    { label: "1 digit", value: "1" },
    { label: "2 digits", value: "2" },
    { label: "3 digits", value: "3" },
    { label: "4 digits", value: "4" },
    { label: "5 digits", value: "5" },
    { label: "6 digits", value: "6" },
];

export const AddAssetIdSeriesModal = ({
    open,
    onClose,
    onSubmit,
}: AddAssetIdSeriesModalProps) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [prefix, setPrefix] = useState("");
    const [digits, setDigits] = useState("2");
    const [suffix, setSuffix] = useState("");
    const [nextNumber, setNextNumber] = useState("0");
    const [enabled, setEnabled] = useState(true);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setTitle("");
            setDescription("");
            setPrefix("");
            setDigits("2");
            setSuffix("");
            setNextNumber("0");
            setEnabled(true);
        }
    }, [open]);

    const preview = useMemo(() => {
        if (!nextNumber) return "";
        const digitCount = parseInt(digits, 10);
        const paddedNumber = String(nextNumber).padStart(digitCount, '0');
        return `${prefix}${paddedNumber}${suffix}`;
    }, [prefix, digits, suffix, nextNumber]);

    const handleSubmit = () => {
        onSubmit({
            title,
            description,
            prefix,
            digits,
            suffix,
            nextNumber,
            enabled,
            preview
        });
        onClose();
    };

    const isFormValid = title.trim() !== "" && nextNumber.trim() !== "";

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" fontWeight="bold">
                    Add Asset ID Series
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 3 }}>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <TextFieldElement
                        name="title"
                        label="Asset Series Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        fullWidth
                        placeholder="Enter Asset Series Title"
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
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                >
                    Submit
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};
