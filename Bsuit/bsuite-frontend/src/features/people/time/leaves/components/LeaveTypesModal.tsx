import { Box, Stack } from "@mui/system";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { useEffect, useState } from "react";
import { ColorPickerField } from "../../../../../components/atom/color-picker-field";
import { Checkbox } from "../../../../../components/atom/check-box";
import { Typography } from "@mui/material";
import { RadioButton } from "../../../../../components/atom/radio-button";
import type { LeaveType, LeaveTypeCategory, AllocationMethod, LeaveBalancePolicy, GenderLimit } from "../api/leaveType.api";
import { AllocationMethodEnum, LeaveBalancePolicyEnum, LeaveTypeCategoryEnum, GenderLimitEnum } from "../api/leaveType.api";

type LimitType = "unlimited" | "limited";

export const LeaveTypeModal = ({ open, onClose, isEdit, onSave, editRow, isLoading }: {
    open: boolean;
    onClose: () => void;
    isEdit: boolean;
    isLoading: boolean;
    onSave: (data: LeaveType) => void;
    editRow?: LeaveType | null;
}) => {
    const [leaveType, setLeaveType] = useState<LeaveTypeCategory>(LeaveTypeCategoryEnum.REGULAR);
    const [leaveTypeName, setLeaveTypeName] = useState<string>("");
    const [leaveCode, setLeaveCode] = useState<string>("");
    const [limitGender, setLimitGender] = useState<GenderLimit>(GenderLimitEnum.MALE);
    const [colorCode, setColorCode] = useState<string>("#1af22c");
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalancePolicy>(LeaveBalancePolicyEnum.CARRY_OVER);

    const [limitType, setLimitType] = useState<LimitType>("limited");
    const [days, setDays] = useState<string | "">("");

    const [maxInstances, setMaxInstances] = useState<string>("");

    const [prevLimitType, setPrevLimitType] = useState<LimitType>("limited");
    const [prevDays, setPrevDays] = useState<string | "">("");
    const [prevIsEncashable, setPrevIsEncashable] = useState<boolean>(false);
    
    const [expiresAfter, setExpiresAfter] = useState<string>("");

    const [allocationType, setAllocationType] = useState<AllocationMethod>(AllocationMethodEnum.PERIODICALLY);
    const [isMarriageAnniversary, setIsMarriageAnniversary] = useState<boolean>(false);
    const [isBirthday, setIsBirthday] = useState<boolean>(false);
    const [isWorkAnniversary, setIsWorkAnniversary] = useState<boolean>(false);
    const [isEncashable, setIsEncashable] = useState<boolean>(false);

    const isCompOff = leaveType === LeaveTypeCategoryEnum.COMPOFF;

    // Prefill form when editing
    useEffect(() => {
        if (isEdit && editRow) {
            setLeaveType(editRow.leaveType);
            setLeaveTypeName(editRow.leaveName);
            setLeaveCode(editRow.shortCode || "");
            setLimitGender(editRow.limitToGender || GenderLimitEnum.COMMON);
            setColorCode(editRow.colorCode || "#1af22c");
            setLeaveBalance(editRow.leaveBalances);
            
            if (editRow.leaveType === LeaveTypeCategoryEnum.COMPOFF) {
                // setCompOffAnnualLimit(editRow.yearlyQuota ?? "");
                setMaxInstances(editRow.maxInstances?.toString() || "");
                setExpiresAfter(editRow.expiresAfter?.toString() || "");
                 // -------------
            } else {
                setDays(editRow.yearlyQuota === "unlimited" ? "" : editRow.yearlyQuota);
                setLimitType(editRow.yearlyQuota === "unlimited" ? "unlimited" : "limited");
            }
            
            setAllocationType(editRow.allocation);
            setIsMarriageAnniversary(editRow.specialDays?.marriage || false);
            setIsBirthday(editRow.specialDays?.birthday || false);
            setIsWorkAnniversary(editRow.specialDays?.work || false);
            setIsEncashable(editRow.isEncashable || false);
            setPrevIsEncashable(editRow.isEncashable || false);
        } else if (open) {
            clearForm();
        }
    }, [isEdit, editRow, open]);

    const handleChangeLimitType = (value: LimitType) => {
        setLimitType(value);
        if (value === "unlimited") {
            setPrevDays(days);
            setDays("");
        } else {
            setDays(prevDays);
        }
    };

    const handleChangeAllocationType = (value: AllocationMethod) => {
        setAllocationType(value);
    };

    const handleSave = () => {
        const data = {
            id: editRow?.id,
            leaveType: leaveType,
            leaveName: leaveTypeName,
            colorCode: colorCode,
            shortCode: leaveCode || null,
            leaveBalances: leaveBalance,
            limitToGender: limitGender,
            specialDays: {
                work: isWorkAnniversary,
                marriage: isMarriageAnniversary,
                birthday: isBirthday,
            },
            ...(isCompOff
            ? {
                maxInstances: maxInstances ? maxInstances : null,
                expiresAfter: expiresAfter ? Number(expiresAfter) : null,
              }
            : {
                yearlyQuota: limitType === "limited" ? days : "unlimited",
                allocation: allocationType,
              }),
            isEncashable: isEncashable,
        } as LeaveType;
        onSave(data);
    };

    const handleDays = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setDays("");
            return;
        }
        const numValue = Number(value);
        if (numValue > 0 && numValue <= 366) {
            setDays(value);
        }
    };
    // Check if data has changes
    const initialLimitType = editRow?.yearlyQuota === "unlimited" ? "unlimited" : "limited";
    const initialDays = editRow?.yearlyQuota === "unlimited" ? "" : (editRow?.yearlyQuota ?? "");
    const initialExpiresAfter = editRow?.expiresAfter ? String(editRow.expiresAfter) : "";

    const isDataSameAsInitial = isEdit && editRow ? (
        leaveType === editRow.leaveType &&
        leaveTypeName === editRow.leaveName &&
        leaveCode === (editRow.shortCode || "") &&
        limitGender === (editRow.limitToGender || GenderLimitEnum.COMMON) &&
        colorCode === (editRow.colorCode || "#1af22c") &&
        leaveBalance === editRow.leaveBalances &&
        (leaveType === LeaveTypeCategoryEnum.COMPOFF || limitType === initialLimitType) &&
        (leaveType === LeaveTypeCategoryEnum.COMPOFF
            ? maxInstances === (editRow?.maxInstances?.toString() || "")
            : days === initialDays) &&
        (leaveType !== LeaveTypeCategoryEnum.COMPOFF || expiresAfter === initialExpiresAfter) &&
        (leaveType === LeaveTypeCategoryEnum.COMPOFF || allocationType === editRow.allocation) &&
        isMarriageAnniversary === (editRow.specialDays?.marriage || false) &&
        isBirthday === (editRow.specialDays?.birthday || false) &&
        isWorkAnniversary === (editRow.specialDays?.work || false) &&
        isEncashable === (editRow.isEncashable || false)
    ) : false;

    // Validation for save button
    const isSaveDisabled =
        !leaveTypeName ||
        !leaveType ||
        !leaveBalance ||
        (!isCompOff && limitType === "limited" && !days) ||
        (isCompOff && (!expiresAfter || !maxInstances)) ||
        !limitGender ||
        isDataSameAsInitial;

    const clearForm = () => {
        setLeaveType(LeaveTypeCategoryEnum.REGULAR);
        setLeaveTypeName("");
        setLeaveCode("");
        setLimitGender(GenderLimitEnum.COMMON);
        setColorCode("#1af22c");
        setLeaveBalance(LeaveBalancePolicyEnum.CARRY_OVER);
        setDays("");
        setLimitType("limited");
        setAllocationType(AllocationMethodEnum.PERIODICALLY);
        setIsMarriageAnniversary(false);
        setIsBirthday(false);
        setIsWorkAnniversary(false);
        setIsEncashable(true);

        setMaxInstances("");
        setExpiresAfter("");
    };

    useEffect(() => {
        if (isBirthday) {
            // Save current values before overriding
            setPrevLimitType(limitType);
            setPrevDays(days);
            setLimitType("limited");
            setDays("1");
        } else {
            // Restore previous values when unchecked
            setLimitType(prevLimitType);
            setDays(prevDays);
        }
    }, [isBirthday]);

    useEffect(() => {
        if (leaveType === LeaveTypeCategoryEnum.UNPAID) {
            setPrevIsEncashable(isEncashable);
            setIsEncashable(false);
        } else if (isEdit && editRow) {
            setIsEncashable(editRow.isEncashable || false);
        } else {
            setIsEncashable(prevIsEncashable);
        }
    }, [leaveType])

    return (
        <ModalElement
            maxWidth="md"
            open={open}
            height={800}
            title={isEdit ? "Edit Leave Type" : "Create Leave Type"}
            onClose={() => {
                clearForm();
                onClose();
            }}
            onClick={handleSave}
            disabled={isSaveDisabled || isLoading}
            sx={{
                "& .MuiDialog-paper": { 
                    width: { xs: "90vw" }, 
                    margin: 2,
                    height: "90vh",
                    display: "flex",
                    flexDirection: "column", 
                },
                height: '80vh'
            }}
        >
            <Box sx={{ p: 2, flex: 1, overflowY: "auto", minHeight: 0 }} width="100%">
                <Stack spacing={4} sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    <Stack spacing={2} gap={3} direction={{ xs: "column", sm: "row" }} sx={{ flex: 1}}>
                        <TextFieldElement
                            label="Leave Type Name"
                            placeholder="Enter Leave Type Name"
                            required
                            value={leaveTypeName}
                            onChange={(e) => setLeaveTypeName(e.target.value)}
                            sx={{
                                flex: 1,
                                "& .MuiInputBase-input": { textAlign: "left" }
                            }}
                            slotProps={{
                                htmlInput: {
                                    maxLength: 150,
                                },
                            }}
                        />
                        <TextFieldElement
                            placeholder="Enter Leave Code"
                            label="Short Code"
                            value={leaveCode}
                            onChange={(e) => setLeaveCode(e.target.value)}
                            sx={{
                                // flex: 1,
                                "& .MuiInputBase-input": { textAlign: "left" }
                            }}
                        />
                        <ColorPickerField
                            label="Color Code"
                            value={colorCode}
                            onChange={setColorCode}
                        />
                    </Stack>

                    <Stack spacing={2} gap={1} direction={{ xs: "column", sm: "row" }}>
                        <SingleSelectElement
                            label="Leave Type"
                            required
                            value={leaveType}
                            options={[
                                { label: "Regular", value: LeaveTypeCategoryEnum.REGULAR },
                                { label: "Unpaid", value: LeaveTypeCategoryEnum.UNPAID },
                                { label: "Comp-Off", value: LeaveTypeCategoryEnum.COMPOFF },
                                { label: "Incident", value: LeaveTypeCategoryEnum.INCIDENT },
                            ]}
                            onChange={(value) => { setLeaveType(value as LeaveTypeCategory) }}
                            sx={{ flex: 1 }}
                        />
                        <SingleSelectElement
                            label="Limit Gender"
                            value={limitGender}
                            options={[
                                { label: "Common", value: GenderLimitEnum.COMMON },
                                { label: "Female", value: GenderLimitEnum.FEMALE },
                                { label: "Male", value: GenderLimitEnum.MALE },
                                { label: "Others", value: GenderLimitEnum.OTHERS },
                            ]}
                            onChange={(value) => { setLimitGender(value as GenderLimit) }}
                            sx={{ flex: 1 }}
                        />
                        <SingleSelectElement
                            label="Leave Balance"
                            value={leaveBalance}
                            required
                            options={[
                                { label: "Reset To Zero", value: LeaveBalancePolicyEnum.RESET_TO_ZERO },
                                { label: "Carry Over", value: LeaveBalancePolicyEnum.CARRY_OVER },
                            ]}
                            onChange={(value) => {
                                const newBalance = value as LeaveBalancePolicy;
                                if (newBalance === LeaveBalancePolicyEnum.RESET_TO_ZERO) {
                                    // Save encashable before disabling
                                    setPrevIsEncashable(isEncashable);
                                    setIsEncashable(false);
                                } else {
                                    // Restore when switching back
                                    setIsEncashable(prevIsEncashable);
                                }
                                setLeaveBalance(newBalance);
                            }}
                            sx={{ flex: 1 }}
                        />
                    </Stack>
                    <Box>
                        <Checkbox
                            label="Encashable"
                            checked={leaveBalance === LeaveBalancePolicyEnum.CARRY_OVER && isEncashable}
                            disabled={leaveBalance === LeaveBalancePolicyEnum.RESET_TO_ZERO || leaveType === LeaveTypeCategoryEnum.UNPAID}
                            onChange={(e) => setIsEncashable(e.target.checked)}
                        />
                    </Box>

                    {leaveType === LeaveTypeCategoryEnum.COMPOFF ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <Box sx={{ display: "flex", width: "100%" }}>
                                <TextFieldElement
                                    required
                                    type="number"
                                    label="Expires after"
                                    value={expiresAfter}
                                    onChange={(e) => setExpiresAfter(e.target.value)}
                                    sx={{
                                    flex: 1,
                                    }}
                                />

                                <Box
                                    sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    px: 2,
                                    bgcolor: (theme) => theme.palette.grey[200],
                                    border: (theme) => `1px solid ${theme.palette.grey[400]}`,
                                    borderLeft: "none",
                                    borderTopRightRadius: "8px",
                                    borderBottomRightRadius: "8px",
                                    color: "text.secondary",
                                    whiteSpace: "nowrap",
                                    }}
                                >
                                    days
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", width: "100%" }}>
                                <TextFieldElement
                                    required
                                    type="number"
                                    label="Annual Limit"
                                    value={maxInstances}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                            setMaxInstances("");
                                            return;
                                        }
                                        const numValue = Number(value);
                                        if (numValue >= 0 && numValue <= 366) {
                                            setMaxInstances(value);
                                        }
                                    }}
                                    sx={{
                                    flex: 1,
                                    }}
                                />

                                <Box
                                    sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    px: 2,
                                    bgcolor: (theme) => theme.palette.grey[200],
                                    border: (theme) => `1px solid ${theme.palette.grey[400]}`,
                                    borderLeft: "none",
                                    borderTopRightRadius: "8px",
                                    borderBottomRightRadius: "8px",
                                    color: "text.secondary",
                                    whiteSpace: "nowrap",
                                    }}
                                >
                                    per year
                                </Box>
                            </Box>
                        </Stack>
                    ) : (
                        <Stack direction="row"  >
                            <Box sx={{ width: "50%" }}>
                                <Typography variant="subtitle2" color="textSecondary" mb={1.5}>
                                    Yearly Quota
                                    <Typography variant="body1" component="span" sx={{ color: 'error.main', marginLeft: '4px' }}>
                                        *
                                    </Typography>
                                </Typography>

                                <Stack direction="row">
                                    <RadioButton
                                        label="Limited"
                                        name="leaveLimit"
                                        value="limited"
                                        checked={limitType === "limited"}
                                        disabled={isBirthday}
                                        onChange={() => handleChangeLimitType("limited")}
                                    />

                                    {limitType === "limited" && (
                                        <TextFieldElement
                                            width={130}
                                            required
                                            placeholder="Enter no. of days"
                                            label="Days"
                                            type="number"
                                            value={days}
                                            disabled={isBirthday}
                                            onChange={handleDays}
                                            sx={{ maxWidth: 200, ml: 4 }}
                                        />
                                    )}
                                </Stack>
                                <RadioButton
                                    label="Unlimited"
                                    name="leaveLimit"
                                    value="unlimited"
                                    disabled={isBirthday}
                                    checked={limitType === "unlimited"}
                                    onChange={() => handleChangeLimitType("unlimited")}
                                />
                            </Box>

                            <Box display="flex" flexDirection="column">
                                <Typography variant="subtitle2" color="textSecondary" mb={1.5}>
                                    Allocation
                                    <Typography variant="body1" component="span" sx={{ color: 'error.main', marginLeft: '4px' }}>
                                        *
                                    </Typography>
                                </Typography>
                                <RadioButton
                                    label="Leave accrued periodically"
                                    name="allocationPeriodically"
                                    value={AllocationMethodEnum.PERIODICALLY}
                                    checked={allocationType === AllocationMethodEnum.PERIODICALLY}
                                    onChange={() => handleChangeAllocationType(AllocationMethodEnum.PERIODICALLY)}
                                />
                                <RadioButton
                                    label="Leave available immediately"
                                    name="allocationImmediately"
                                    value={AllocationMethodEnum.IMMEDIATE}
                                    checked={allocationType === AllocationMethodEnum.IMMEDIATE}
                                    onChange={() => handleChangeAllocationType(AllocationMethodEnum.IMMEDIATE)}
                                />

                            </Box>
                        </Stack>
                    )}
                    {leaveType !== LeaveTypeCategoryEnum.COMPOFF && (
                    <Stack direction={{ xs: "column", sm: "column" }} alignItems="flex-start">
                        <Typography variant="body2" color="textPrimary" mb={1.5}>
                            Check all special days you'd would like to allow employees to take leaves
                        </Typography>
                        <Box>
                            <Checkbox
                                label="Birthday"
                                checked={isBirthday}
                                onChange={(e) => setIsBirthday(e.target.checked)}
                            />
                        </Box>
                    </Stack>
                    )}
                    <Box sx={{ flexGrow: 1 }} /> 
                </Stack>
            </Box>

        </ModalElement>
    );
};