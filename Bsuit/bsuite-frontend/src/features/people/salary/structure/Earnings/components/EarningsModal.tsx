import { useState, useEffect } from "react";
import { Box, InputAdornment, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import InfoIcon from "@mui/icons-material/Info";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import {
    formatNumberForTyping,
    parseNumberForTyping,
} from "../../../../../../utils/numberFormatter";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { EarningCalculationEnum, EarningFrequencyEnum, type CalculationType, type EarningFrequencyType, type EarningRequestType, type EarningType } from "../api/earnings.api";
import { GROSS_ID } from "./EarningsSection";

type EarningsModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (data: EarningRequestType) => void;
    isEdit?: boolean;
    editRow?: EarningType | null;
    earningsOptions: { label: string; value: string }[];
    isLoadingData?:  boolean;
};

export const EarningsModal = ({ open, onClose, onSave, isEdit, editRow, earningsOptions, isLoadingData }: EarningsModalProps) => {

    const [amount, setAmount] = useState("");
    const [prevAmount, setPrevAmount] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [taxExempt, setTaxExempt] = useState(false);
    const [earningName, setEarningName] = useState("");
    const [nameInPayslip, setNameInPayslip] = useState("");
    const [isProRataBasis, setIsProRataBasis] = useState(false);
    const [rowId, setRowId] = useState<string | undefined>(undefined);
    const [percentageOf, setPercentageOf] = useState<string | null>(GROSS_ID);
    const [amountType, setAmountType] = useState<CalculationType>(EarningCalculationEnum.AMOUNT);
    const [initialData, setInitialData] = useState<EarningType | null>(null);
    const [frequency, setFrequency] = useState<EarningFrequencyType>(EarningFrequencyEnum.RECURRING);

    const { data: headerData } = useGetHeaderDataQuery();

    const commaSeparation =
        (headerData?.data.commaSeparation as "US" | "IN") || "IN";

    useEffect(() => {
        if (!editRow || !isEdit) return;

        setInitialData(editRow);
    }, [editRow, isEdit]);


    // Reset form for "Add"
    useEffect(() => {
        if (!open) return;

        if (!isEdit) {
            setFrequency(EarningFrequencyEnum.RECURRING);
            setEarningName("");
            setNameInPayslip("");
            setAmount("");
            setPrevAmount("");
            setAmountType(EarningCalculationEnum.AMOUNT);
            setIsActive(true);
            setTaxExempt(false);
            setPercentageOf(GROSS_ID);
            setIsProRataBasis(false);
        }
    }, [editRow, open, isEdit]);

    useEffect(() => {
        if (!editRow || !isEdit) return;

        setRowId(editRow?.id);
        setFrequency(editRow.earningFrequency);
        setEarningName(editRow.earningName ?? "");
        setNameInPayslip(editRow.nameInPayslip ?? "");
        setAmountType(editRow.calculationType);
        if (editRow.calculationType === EarningCalculationEnum.PERCENTAGE) {
            setAmount(editRow.percentage ? String(editRow.percentage) : "");
            setPrevAmount(editRow.amount ? String(editRow.amount) : "");
            setPercentageOf(
                editRow.percentageOf ? String(editRow.percentageOf) : GROSS_ID
            );
        } else {
            setAmount(editRow.amount ? String(editRow.amount) : "");
            setPrevAmount("");
            setPercentageOf(GROSS_ID);
        }
        setIsActive(editRow.isActive ?? true);
        setTaxExempt(editRow.taxExempt ?? false);
        setIsProRataBasis(editRow.isProRataBasis ?? false);
    }, [editRow, isEdit]);

    
    const isFormValid = () => {
        const numericAmount = Number(amount);

        const hasBasicFields =
            earningName.trim() !== "" &&
            nameInPayslip.trim() !== "" &&
            amount.trim() !== "" &&
            numericAmount > 0;

        if (!hasBasicFields) return false;

        return true;
    }

    const hasChanges = () => {
        if (!initialData) return true;

        return (
            earningName !== initialData.earningName ||
            nameInPayslip !== initialData.nameInPayslip ||
            frequency !== initialData.earningFrequency ||
            amountType !== initialData.calculationType ||
            (amountType === EarningCalculationEnum.AMOUNT && String(initialData.amount ?? "") !== amount) ||
            (amountType === EarningCalculationEnum.PERCENTAGE && String(initialData.percentage ?? "") !== amount) ||
            isActive !== initialData.isActive ||
            taxExempt !== (initialData.taxExempt ?? false) ||
            isProRataBasis !== (initialData.isProRataBasis ?? false) ||
            (amountType === EarningCalculationEnum.PERCENTAGE &&
                percentageOf !== String(initialData.percentageOf ?? null))
        );
    };

    const disabledMessages = () => {
        const messages: string[] = [];

        if (!isFormValid()) {
            if (earningName.trim() === "") messages.push("Earning name is required");
            if (nameInPayslip.trim() === "") messages.push("Name in payslip is required");
            if (amount.trim() === "") messages.push("Amount is required");
        }
        if (!hasChanges()) messages.push("No changes made");

        return messages;
    };

    const handleSave = () => {
        onSave({
            id: rowId,
            earningName: earningName.trim(),
            nameInPayslip: nameInPayslip.trim(),
            amount: amountType === EarningCalculationEnum.AMOUNT ? amount : undefined,
            percentage: amountType === EarningCalculationEnum.PERCENTAGE ? amount : undefined,
            calculationType: amountType,
            earningFrequency: frequency,
            isActive,
            taxExempt,
            isProRataBasis,
            isEditable: true,
            percentageOf:
                amountType === EarningCalculationEnum.PERCENTAGE
                    ? (percentageOf)
                    : undefined,
        })
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        if (inputValue === "") {
            setAmount("");
            return;
        }

        const rawValue = parseNumberForTyping(inputValue);

        // Validate percentage values
        if (amountType === EarningCalculationEnum.PERCENTAGE) {
            const numValue = Number(rawValue);
            if (numValue > 100) return;
            if (numValue < 0) return;
        }

        setAmount(rawValue);
    };

    const handleAmountTypeChange = (value: string) => {
        const newType = value as EarningCalculationEnum;

        if (newType === EarningCalculationEnum.PERCENTAGE) {
            setPrevAmount(amount);
            setAmount("");
        } else {
            setAmount(prevAmount);
        }
        setAmountType(newType);
    };

    // Format amount for display
    const formattedAmount =
        amountType === EarningCalculationEnum.PERCENTAGE
            ? amount
            : formatNumberForTyping(amount, commaSeparation);

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            height={800}
            title={isEdit ? "Edit Earning" : "Add Earning"}
            onClose={onClose}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 800 }, margin: 2 },
            }}
        >
            <Box sx={{ p: 2 }} width="100%" key={editRow?.id || "create"}>
                <Stack spacing={3}>
                    {/* Row 1 */}
                    <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                        <TextFieldElement
                            fullWidth
                            label="Earning name"
                            required
                            value={earningName}
                            onChange={(e) => setEarningName(e.target.value)}
                            slotProps={{
                                htmlInput: {
                                    maxLength: 100,
                                },
                            }}
                            sx={{ "& .MuiInputBase-input": { textAlign: "left", } }}
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
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems="center">
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                display: "flex",
                                gap: 2,
                                justifyContent: "flex-start",
                                alignItems: "center"
                            }}
                        >
                            <Box sx={{
                                flex: 1,
                                maxWidth: amountType === EarningCalculationEnum.PERCENTAGE ? "100%" : "49%",
                             
                            }}>
                                <TextFieldElement

                                    required
                                    label="Amount"
                                    value={formattedAmount}
                                    onChange={handleAmountChange}
                                    sx={{ "& .MuiInputBase-input": { textAlign: "right" }, width: "100%" }}
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
                                                            options={[
                                                                { label: "₹", value: EarningCalculationEnum.AMOUNT },
                                                                { label: "%", value: EarningCalculationEnum.PERCENTAGE },
                                                            ]}
                                                            onChange={handleAmountTypeChange}
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

                            {amountType === EarningCalculationEnum.PERCENTAGE && (
                                <>
                                    <Typography sx={{ whiteSpace: "nowrap" }}>of</Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <SingleSelectElement
                                            required
                                            label="Earning"
                                            value={percentageOf ?? GROSS_ID}
                                            options={earningsOptions}
                                            onChange={(value) => setPercentageOf(value)}
                                        />
                                    </Box>
                                </>
                            )}
                        </Box>

                    </Stack>
                        <Box sx={{ flex: 1, maxWidth: "49%" }}>
                            <SingleSelectElement
                                // fullWidth
                                required
                                label="Earning Frequency"
                                options={[
                                    { label: "Recurring Earning", value: EarningFrequencyEnum.RECURRING },
                                    { label: "Non-recurring Earning", value: EarningFrequencyEnum.NON_RECURRING },
                                ]}
                                value={frequency}
                                onChange={(value) => setFrequency(value as EarningFrequencyEnum)}
                            />
                        </Box>

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

                        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
                            <Checkbox
                                label="Tax Exempt"
                                checked={taxExempt}
                                onChange={(e) => setTaxExempt(e.target.checked)}
                            />
                        </Box>

                        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Checkbox
                                label="Pro-Rata Basis"
                                checked={isProRataBasis}
                                onChange={(e) => setIsProRataBasis(e.target.checked)}
                            />
                        </Box>
                        <Tooltip
                            title="Pay will be adjusted based on employee working days"
                            placement="top"
                            variant="info"
                        >
                            <InfoIcon fontSize="small" sx={{ cursor: "pointer", mt: 1 }} />
                        </Tooltip>
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