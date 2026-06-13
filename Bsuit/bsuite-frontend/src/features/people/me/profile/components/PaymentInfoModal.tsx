import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { useUpdatePaymentMutation } from "../api/profile.api";
import type { IPaymentInformation } from "../types/profile.types";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";

// ── Input formatters (same pattern as AddEmployee) ──────────────────────────
/** Account number: digits only, 9–18 chars */
function formatAccountNumber(input: string): string {
    return input.replace(/\D/g, "").slice(0, 18);
}

/**
 * IFSC: BBBB0XXXXXX — 4 uppercase letters, forced '0', 6 uppercase alphanumeric.
 * Invalid chars in each segment simply don't register.
 */
function formatIFSCCode(input: string): string {
    const raw = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
    const bank   = raw.slice(0, 4).replace(/[^A-Z]/g, "").slice(0, 4);   // 4 letters
    const zero   = raw.length >= 5 ? "0" : "";                            // position 4 always '0'
    const branch = raw.slice(5, 11).replace(/[^A-Z0-9]/g, "").slice(0, 6); // 6 alphanumeric
    return bank + zero + branch;
}

// ── Validation ─────────────────────────────────────────────────────────────
const IFSC_REGEX    = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

type PaymentErrors = { bankAccountNumber?: string; bankIfscCode?: string };

function validatePaymentField(field: string, value: string): string {
    if (field === "bankAccountNumber" && value && !ACCOUNT_REGEX.test(value))
        return "Account number must be 9–18 digits";
    if (field === "bankIfscCode" && value && !IFSC_REGEX.test(value))
        return "Invalid IFSC — format: ABCD0123456 (4 letters · 0 · 6 alphanumeric)";
    return "";
}

interface Props {
    open: boolean;
    onClose: () => void;
    data: IPaymentInformation;
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
}

export default function PaymentInfoModal({ open, onClose, data, employeeId, showMessage }: Props) {
    const [form, setForm] = useState<IPaymentInformation>(data);
    const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({});
    const [updatePayment, { isLoading }] = useUpdatePaymentMutation();
    const hasPaymentErrors = useMemo(() => Object.values(paymentErrors).some(Boolean), [paymentErrors]);

    useEffect(() => {
        if (open) { setForm(data); setPaymentErrors({}); }
    }, [open, data]);

    const hasChanges = useMemo(() => {
        return (
            (form.bankAccountHolderName ?? "") !== (data.bankAccountHolderName ?? "") ||
            (form.bankAccountNumber ?? "") !== (data.bankAccountNumber ?? "") ||
            (form.bankName ?? "") !== (data.bankName ?? "") ||
            (form.bankBranchName ?? "") !== (data.bankBranchName ?? "") ||
            (form.bankIfscCode ?? "") !== (data.bankIfscCode ?? "")
        );
    }, [form, data]);

    const set = useCallback(
        (field: keyof IPaymentInformation) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                let value = e.target.value;
                // Use formatters so invalid chars simply don't register (same as AddEmployee)
                if (field === "bankAccountNumber") value = formatAccountNumber(value);
                else if (field === "bankIfscCode")  value = formatIFSCCode(value);
                setForm((prev) => ({ ...prev, [field]: value }));
                const err = validatePaymentField(field as string, value);
                if (field === "bankAccountNumber" || field === "bankIfscCode")
                    setPaymentErrors((prev) => ({ ...prev, [field]: err }));
            },
        []
    );

    const handleSave = useCallback(async () => {
        const accErr  = validatePaymentField("bankAccountNumber", form.bankAccountNumber ?? "");
        const ifscErr = validatePaymentField("bankIfscCode", form.bankIfscCode ?? "");
        const newErrs: PaymentErrors = { bankAccountNumber: accErr, bankIfscCode: ifscErr };
        setPaymentErrors(newErrs);
        const firstErr = accErr || ifscErr;
        if (firstErr) { showMessage(firstErr, "error"); return; }

        try {
            const toNull = (value: string) => {
                const trimmed = value.trim();
                return trimmed === "" ? null : trimmed;
            };
            await updatePayment({
                id: employeeId,
                body: {
                    bankAccountHolderName: toNull(form.bankAccountHolderName),
                    bankAccountNo: toNull(form.bankAccountNumber),
                    bankName: toNull(form.bankName),
                    bankBranchName: toNull(form.bankBranchName),
                    bankIfscCode: toNull(form.bankIfscCode),
                },
            }).unwrap();
            showMessage("Payment information updated successfully.", "success");
            onClose();
        } catch (error: any) {
            showMessage(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update payment information.", "error");
        }
    }, [form, employeeId, updatePayment, onClose, showMessage]);

    const isSaveDisabled = isLoading || !hasChanges || hasPaymentErrors;
    const saveDisabledTooltip = useMemo(
        () =>
            buildModalSaveDisabledTooltip([
                isLoading && "Save is in progress.",
                !hasChanges && "Make a change before saving.",
                hasPaymentErrors &&
                    (paymentErrors.bankAccountNumber ||
                        paymentErrors.bankIfscCode ||
                        "Fix validation errors before saving."),
            ]),
        [isLoading, hasChanges, hasPaymentErrors, paymentErrors],
    );

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Payment Information"
            maxWidth="sm"
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                    <Typography variant="subtitle2" mb={1}>Account Holder Name</Typography>
                    <TextFieldElement label="" fullWidth value={form.bankAccountHolderName} onChange={set("bankAccountHolderName")} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" mb={1}>Account Number</Typography>
                    <TextFieldElement
                        label="" fullWidth value={form.bankAccountNumber} onChange={set("bankAccountNumber")}
                        placeholder="9–18 digits"
                        slotProps={{ htmlInput: { maxLength: 18, inputMode: "numeric" } }}
                        error={!!paymentErrors.bankAccountNumber} helperText={paymentErrors.bankAccountNumber}
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" mb={1}>Bank Name</Typography>
                    <TextFieldElement label="" fullWidth value={form.bankName} onChange={set("bankName")} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" mb={1}>Bank Branch Name</Typography>
                    <TextFieldElement label="" fullWidth value={form.bankBranchName} onChange={set("bankBranchName")} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" mb={1}>IFSC Code</Typography>
                    <TextFieldElement
                        label="" fullWidth value={form.bankIfscCode} onChange={set("bankIfscCode")}
                        placeholder="HDFC0001234"
                        slotProps={{ htmlInput: { maxLength: 11 } }}
                        error={!!paymentErrors.bankIfscCode} helperText={paymentErrors.bankIfscCode || "4 letters · 0 · 6 alphanumeric"}
                    />
                </Box>
            </Box>
        </ModalElement>
    );
}
