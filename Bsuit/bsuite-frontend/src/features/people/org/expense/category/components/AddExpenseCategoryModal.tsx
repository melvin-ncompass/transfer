import React, { useState } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../../components/atom/text-field/TextField";
import { ModalElement } from "../../../../../../components/dialogs/modal-element/ModalElement";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useGetExpensePoliciesQuery } from "../../policy/api/expensePolicy.api";

export interface ExpenseCategory {
    id: number;
    categoryName: string;
    expenseCode: string;
    description: string;
    maxLimit: number;
    expensePolicyId: number;
}

interface AddExpenseCategoryModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (category: Omit<ExpenseCategory, "id">) => void;
}

export function AddExpenseCategoryModal({
    open,
    onClose,
    onSave,
}: AddExpenseCategoryModalProps) {
    const [categoryName, setCategoryName] = useState("");
    const [expenseCode, setExpenseCode] = useState("");
    const [expensePolicyId, setExpensePolicyId] = useState("");
    const [maxLimit, setMaxLimit] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: apiPolicies } = useGetExpensePoliciesQuery();

    const policyOptions = apiPolicies
        ? apiPolicies.map((p: any) => ({
            label: p.policyName,
            value: p.id.toString(),
        }))
        : [];

    const handleSave = () => {
        const newErrors: Record<string, string> = {};
        const maxLimitNum = Number(maxLimit.replace(/,/g, ""));

        if (!categoryName.trim()) newErrors.categoryName = "Category Name is required";
        if (!expensePolicyId) newErrors.expensePolicyId = "Policy is required";
        if (!maxLimit.trim() || isNaN(maxLimitNum)) newErrors.maxLimit = "Max Limit must be a valid number";
        if (!description.trim()) newErrors.description = "Description is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            categoryName,
            expenseCode,
            expensePolicyId: Number(expensePolicyId),
            maxLimit: maxLimitNum,
            description,
        });
        handleClose();
    };

    const handleClose = () => {
        setCategoryName("");
        setExpenseCode("");
        setExpensePolicyId("");
        setMaxLimit("");
        setDescription("");
        setErrors({});
        onClose();
    };

    return (
        <ModalElement
            open={open}
            onClose={handleClose}
            title="Add Category"
            onClick={handleSave}
            maxWidth="md"
            disabled={!categoryName.trim() || !expensePolicyId || !maxLimit.trim() || isNaN(Number(maxLimit.replace(/,/g, ""))) || !description.trim()}
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
                    name="categoryName"
                    label="Category Name"
                    required
                    fullWidth
                    value={categoryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCategoryName(e.target.value);
                        if (errors.categoryName) setErrors({ ...errors, categoryName: "" });
                    }}
                    placeholder="Enter Category Name"
                    error={!!errors.categoryName}
                    helperText={errors.categoryName}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                />

                <TextFieldElement
                    name="expenseCode"
                    label="Expense Code"
                    fullWidth
                    value={expenseCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseCode(e.target.value)}
                    placeholder="Enter Category Code"
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                />

                <SingleSelectElement
                    label="Policy"
                    required
                    options={policyOptions}
                    value={expensePolicyId}
                    onChange={(val: string) => {
                        setExpensePolicyId(val);
                        if (errors.expensePolicyId) setErrors({ ...errors, expensePolicyId: "" });
                    }}
                    error={!!errors.expensePolicyId}
                    helperText={errors.expensePolicyId}
                />

                <TextFieldElement
                    name="maxLimit"
                    label="Max Limit"
                    type="text"
                    required
                    fullWidth
                    value={maxLimit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, "");
                        setMaxLimit(rawValue ? Number(rawValue).toLocaleString("en-IN") : "");
                        if (errors.maxLimit) setErrors({ ...errors, maxLimit: "" });
                    }}
                    placeholder="Enter Max Limit"
                    error={!!errors.maxLimit}
                    helperText={errors.maxLimit}
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
