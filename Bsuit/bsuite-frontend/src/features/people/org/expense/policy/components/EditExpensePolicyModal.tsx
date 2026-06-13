import { useState, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useEmployees } from "../../../../hooks/useEmployees";
import React from "react";

export interface ExpensePolicy {
    id: number;
    policyName: string;
    description: string;
    approver: any;
}

interface EditExpensePolicyModalProps {
    open: boolean;
    policyInfo: ExpensePolicy | null;
    onClose: () => void;
    onSave: (id: number, policy: Partial<ExpensePolicy>) => void;
}

export function EditExpensePolicyModal({
    open,
    policyInfo,
    onClose,
    onSave,
}: EditExpensePolicyModalProps) {
    const [policyName, setPolicyName] = useState("");
    const [description, setDescription] = useState("");
    const [approver, setApprover] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Snapshot of initial values to detect changes
    const [initial, setInitial] = useState<Record<string, string>>({});

    const { employees, isLoading: isLoadingEmployees } = useEmployees();

    useEffect(() => {
        if (policyInfo && open) {
            const approverId = policyInfo.approver?.id || policyInfo.approver;
            const initVals = {
                policyName: policyInfo.policyName || "",
                description: policyInfo.description || "",
                approver: approverId ? approverId.toString() : "",
            };
            setPolicyName(initVals.policyName);
            setDescription(initVals.description);
            setApprover(initVals.approver);
            setInitial(initVals);
            setErrors({});
        }
    }, [policyInfo, open]);

    const approverOptions = useMemo(
        () =>
            employees.map((emp) => ({
                label: emp.contact?.name || "Unknown",
                value: emp.id.toString(),
            })),
        [employees],
    );

    const hasChanges = useMemo(() => (
        policyName !== initial.policyName ||
        description !== initial.description ||
        approver !== initial.approver
    ), [policyName, description, approver, initial]);

    const handleSave = () => {
        if (!policyInfo) return;

        const newErrors: Record<string, string> = {};
        if (!policyName.trim()) newErrors.policyName = "Policy Name is required";
        if (!description.trim()) newErrors.description = "Description is required";
        if (!approver) newErrors.approver = "Approver is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(policyInfo.id, { policyName, description, approver });
        handleClose();
    };

    const handleClose = () => {
        setPolicyName("");
        setDescription("");
        setApprover("");
        setErrors({});
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={handleClose}
            title="Edit Expense Policy"
            onClick={handleSave}
            maxWidth="md"
            disabled={!hasChanges}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    mt: 1,
                }}
            >
                <TextFieldElement
                    name="policyName"
                    label="Policy Name"
                    required
                    fullWidth
                    value={policyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setPolicyName(e.target.value);
                        if (errors.policyName) setErrors({ ...errors, policyName: "" });
                    }}
                    error={!!errors.policyName}
                    helperText={errors.policyName}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                />

                <SingleSelectElement
                    label="Approver"
                    required
                    options={approverOptions}
                    value={approver}
                    onChange={(val: any) => {
                        setApprover(val as string);
                        if (errors.approver) setErrors({ ...errors, approver: "" });
                    }}
                    disabled={isLoadingEmployees}
                    error={!!errors.approver}
                    helperText={errors.approver}
                />

                <Box sx={{ gridColumn: "span 2" }}>
                    <TextFieldElement
                        name="description"
                        label="Description"
                        required
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setDescription(e.target.value);
                            if (errors.description) setErrors({ ...errors, description: "" });
                        }}
                        error={!!errors.description}
                        helperText={errors.description}
                        slotProps={{ htmlInput: { maxLength: 400 } }}
                    />
                </Box>
            </Box>
        </ModalElement>
    );
}
