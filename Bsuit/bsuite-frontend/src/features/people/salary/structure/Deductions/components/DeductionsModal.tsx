import { useState, useEffect } from "react";
import { Box, InputAdornment, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";

import { formatNumberForTyping, parseNumberForTyping } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import type { Deduction, DeductionCalculationType, DeductionFrequencyType } from "../api/deductions.api";
import { DeductionCalculationEnum, DeductionFrequencyEnum, DeductionTypeEnum } from "../api/deductions.api";
import { Tooltip } from "../../../../../../components/atom/tooltip";

type DeductionsModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (data: Deduction) => void;
    isEdit: boolean;
    editRow?: Deduction | null;
    deductionOptions: { label: string; value: string }[];
    isLoadingData?: boolean;
};

export const DeductionsModal = ({ open, onClose, onSave, isEdit, editRow, deductionOptions, isLoadingData }: DeductionsModalProps) => {
    const [amount, setAmount] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [percentageOf, setPercentageOf] = useState("");
    const [deductionName, setDeductionName] = useState("");
    const [nameInPayslip, setNameInPayslip] = useState("");
    const [initialData, setInitialData] = useState<Deduction | null>(null);
    const [frequency, setFrequency] = useState<DeductionFrequencyType>("recurring");
    const [amountType, setAmountType] = useState<DeductionCalculationType>("amount");

    useEffect(() => {
        if (!editRow || !isEdit) return;
        setInitialData(editRow);
    }, [editRow, isEdit]);

    const { data: headerData } = useGetHeaderDataQuery();

    const commaSeparation = (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

    // Reset form for "Add"
    useEffect(() => {
        if (!open) return;

        if (!isEdit) {
            setFrequency("recurring");
            setDeductionName("");
            setNameInPayslip("");
            setAmount("");
            setAmountType("amount");
            setIsActive(true);
        }
    }, [isEdit, open]);

    useEffect(() => {
        if (amountType === initialData?.calculationType) {
            setAmount(initialData?.amount ? String(initialData.amount) : "");
        }
        else {
            setAmount('');
        }
        }, [amountType, initialData,]);

    const formattedAmount =
        amountType === DeductionCalculationEnum.PERCENTAGE
            ? amount
            : formatNumberForTyping(amount, commaSeparation);


    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = parseNumberForTyping(e.target.value);

        if (amountType === DeductionCalculationEnum.PERCENTAGE) {
            const numValue = Number(rawValue);
            if (numValue < 0 || numValue > 100 || rawValue.length > 3) return;
        }
        setAmount(rawValue);
    };

    useEffect(() => {
        if (!editRow || !isEdit) return;

        setFrequency(editRow.deductionFrequency);
        setDeductionName(editRow.deductionName ?? "");
        setNameInPayslip(editRow.nameInPayslip ?? "");
        setAmount(editRow.amount ? String(editRow.amount) : "");
        setAmountType(editRow.calculationType ?? DeductionCalculationEnum.AMOUNT);
        setIsActive(editRow.isActive ?? true);
    }, [editRow, isEdit,]);

    const isFormValid = () => {
        const numericAmount = Number(amount);
        const isDataValid = (
            deductionName.trim() !== "" &&
            nameInPayslip.trim() !== "" &&
            amount.trim() !== "" &&
            numericAmount > 0
        )
        if (!isDataValid) return false;
        if (amountType === DeductionCalculationEnum.PERCENTAGE && !percentageOf) {
            return false;
        }
        return true;
    }

    const handleSave = () => {
        onSave({
            id: editRow?.id,
            deductionName: deductionName.trim(),
            deductionType: editRow?.deductionType ?? DeductionTypeEnum.POST_TAX,
            deductionFrequency: frequency,
            nameInPayslip: nameInPayslip.trim(),
            amount,
            calculationType: amountType,
            isActive,
            percentageOf: amountType === DeductionCalculationEnum.PERCENTAGE ? percentageOf : undefined
        })
    }

    const hasChanges = () => {
        if (!initialData) return true;

        return (
            deductionName !== initialData.deductionName ||
            nameInPayslip !== initialData.nameInPayslip ||
            frequency !== initialData.deductionFrequency ||
            amountType !== initialData.calculationType ||
            String(initialData.amount ?? "") !== amount ||
            isActive !== initialData.isActive
        );
    };

    const disabledMessages = () => {
        const messages: string[] = [];
        
        if (!isFormValid()) {
            if (deductionName.trim() === "") messages.push("Deduction name is required");
            if (nameInPayslip.trim() === "") messages.push("Name in Payslip is required");
            if (amount.trim() === "") messages.push("Amount is required");
        }
        if (isEdit && !hasChanges()) messages.push("No changes made");
        return messages;
    }

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            height={800}
            title={isEdit ? "Edit Deduction" : "Add Deduction"}

            onClose={onClose}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 800 }, margin: 2 },
            }}
        >
            <Box sx={{ p: 2 }} width="100%" key={editRow?.id || "create"}>
                <Stack spacing={4}>
                    {/* Row 1 */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                        <TextFieldElement
                            fullWidth
                            label="Deduction name"
                            required
                            value={deductionName}
                            onChange={(e) => setDeductionName(e.target.value)}
                            sx={{ "& .MuiInputBase-input": { textAlign: "left" } }}
                            slotProps={{
                                htmlInput: {
                                    maxLength: 100,
                                },
                            }}
                        />
                        <TextFieldElement
                            fullWidth
                            label="Name in Payslip"
                            required
                            value={nameInPayslip}
                            onChange={(e) => setNameInPayslip(e.target.value)}
                            sx={{ "& .MuiInputBase-input": { textAlign: "left" } }}
                        />
                    </Stack>

                    {/* Row 2 */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                        <Box 
                            sx={{ 
                                flex: 1, 
                                minWidth: 0, 
                                display: "flex", 
                                gap: 2,
                                justifyContent: 'center',
                                alignItems: 'center',
                                }}
                            >
                            <Box sx={{ flex: 1 }}>
                                <TextFieldElement
                                    fullWidth
                                    required
                                    label="Amount"
                                    value={formattedAmount}
                                    onChange={handleAmountChange}
                                    sx={{ "& .MuiInputBase-input": { textAlign: "right" } }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end" sx={{ p: 0 }}>
                                                    <Box
                                                        sx={{
                                                            height: "100%",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            borderLeft: "1px solid #D0D5DD",
                                                            pl: 1,
                                                        }}
                                                    >
                                                        <SingleSelectElement
                                                            label=""
                                                            value={amountType}
                                                            disabled={true}
                                                            options={[
                                                                { label: "₹", value: DeductionCalculationEnum.AMOUNT },
                                                                // { label: "%", value: DeductionCalculationEnum.PERCENTAGE },
                                                            ]}
                                                            onChange={(value) => setAmountType(value as DeductionCalculationType)}
                                                            sx={{
                                                                "& .MuiOutlinedInput-notchedOutline": {
                                                                    border: "none",
                                                                },
                                                                "& .MuiSelect-select": {
                                                                    padding: "8px 28px 8px 8px",
                                                                    fontWeight: 500,
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Box>

                            {/* "of Earning" Selector for Percentage Type */}
                            {amountType === DeductionCalculationEnum.PERCENTAGE && (
                                <>
                                    <Typography sx={{ whiteSpace: "nowrap" }}>of</Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <SingleSelectElement
                                            required
                                            label="Earning"
                                            value={percentageOf}
                                            options={deductionOptions}
                                            onChange={(value) => setPercentageOf(value)}
                                        />
                                    </Box>
                                </>
                            )}

                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <SingleSelectElement
                                fullWidth
                                required
                                label="Deduction Frequency"
                                options={[
                                    { label: "Recurring Deduction", value: DeductionFrequencyEnum.RECURRING },
                                    { label: "Non-recurring Deduction", value: DeductionFrequencyEnum.NON_RECURRING },
                                ]}
                                value={frequency}
                                onChange={(value) => setFrequency(value as DeductionFrequencyType)}
                            />
                        </Box>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                            <TextFieldElement
                                fullWidth
                                label="Deduction Type"
                                value={DeductionTypeEnum.POST_TAX}
                                disabled
                                sx={{ "& .MuiInputBase-input": { textAlign: "left" } }}
                            />
                        </Box>
                    </Stack>

                    {/* Checkboxes */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        sx={{ width: "100%" }}
                    >
                        <Box sx={{ flexShrink: 0 }}>
                            <Checkbox
                                label="Mark as active"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                        </Box>
                    </Stack>
                </Stack>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Tooltip title={disabledMessages().join(", ")}>
                    <PrimaryButton
                        onClick={handleSave}
                        disabled={!isFormValid() || !hasChanges() || isLoadingData}
                        >
                        Save
                    </PrimaryButton>
                    </Tooltip>
                </Box>
            </Box>
        </ModalElement>
    );
};
