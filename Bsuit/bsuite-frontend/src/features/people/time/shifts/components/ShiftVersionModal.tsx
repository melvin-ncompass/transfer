import { useEffect, useState, type ReactNode } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
    DayPicker,
    type WeekDay,
} from "../../../../../components/atom/date-picker";
import { RadioButton } from "../../../../../components/atom/radio-button";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { TimePickerElement } from "../../../../../components/atom/time-picker";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { Box, Stack } from "@mui/system";
import { InputAdornment, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../../components/atom/button";
import {
    useCreateShiftVersionMutation,
    type IShiftVersion,
} from "../api/shifts.api";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import {
    mapApiWorkingDaysToWeekDays,
    isFlexibleShiftType,
    parseTimeStringToDayjs,
} from "../shiftForm.utils";

function ReqLabel({ children }: { children: ReactNode }) {
    return (
        <Typography variant="subtitle2" component="span">
            {children}{" "}
            <Typography component="span" color="error" variant="subtitle2">
                *
            </Typography>
        </Typography>
    );
}

interface ShiftVersionModalProps {
    open: boolean;
    onClose: () => void;
    shiftId: number;
    /** When set, modal opens in edit/upsert mode for this version */
    initialVersion?: IShiftVersion | null;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function ShiftVersionModal({
    open,
    onClose,
    shiftId,
    initialVersion,
    onSuccess,
    onError,
}: ShiftVersionModalProps) {
    const [versionName, setVersionName] = useState("");
    const [workWeek, setWorkWeek] = useState<WeekDay[]>([]);
    const [type, setType] = useState<string>("fixed");
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [grossHours, setGrossHours] = useState<string>("");
    const [breakDuration, setBreakDuration] = useState<string>("");
    const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(null);

    const [createVersion, { isLoading }] = useCreateShiftVersionMutation();

    useEffect(() => {
        if (!open) return;
        if (initialVersion) {
            setVersionName(initialVersion.shiftVersionName);
            setWorkWeek(mapApiWorkingDaysToWeekDays(initialVersion.workingDays));
            setType(isFlexibleShiftType(initialVersion.shiftType) ? "flexible" : "fixed");
            setStartTime(parseTimeStringToDayjs(initialVersion.shiftFromTime));
            setEndTime(parseTimeStringToDayjs(initialVersion.shiftToTime));
            setGrossHours(
                initialVersion.grossHours != null
                    ? String(Math.trunc(Number(initialVersion.grossHours)))
                    : "",
            );
            setBreakDuration(String(initialVersion.breakDuration));
            setEffectiveDate(dayjs(initialVersion.effectiveFromDate));
        } else {
            setVersionName("");
            setWorkWeek([]);
            setType("fixed");
            setStartTime(null);
            setEndTime(null);
            setGrossHours("");
            setBreakDuration("");
            setEffectiveDate(null);
        }
    }, [open, initialVersion?.id]);

    const grossHoursNum =
        grossHours.trim() === "" ? NaN : Number(grossHours);
    const grossHoursInvalid =
        type === "flexible" &&
        grossHours.trim() !== "" &&
        (!Number.isFinite(grossHoursNum) ||
            !Number.isInteger(grossHoursNum) ||
            grossHoursNum <= 0 ||
            grossHoursNum >= 24);

    const handleSave = async () => {
        if (type === "flexible" && grossHoursInvalid) {
            onError("Gross hours must be a whole number from 1 to 23.");
            return;
        }
        try {
            const dayMap: Record<WeekDay, string> = {
                Sun: "Sun",
                Mon: "Mon",
                Tue: "Tue",
                Wed: "Wed",
                Thu: "Thu",
                Fri: "Fri",
                Sat: "Sat",
            };

            const workingDays = workWeek.map((day) => dayMap[day]);

            const formatTime = (date: Dayjs | null) => {
                if (!date) return "";
                const hours = date.hour().toString().padStart(2, "0");
                const minutes = date.minute().toString().padStart(2, "0");
                return `${hours}:${minutes}`;
            };

            const formatDate = (date: Dayjs | null) => {
                if (!date) return "";
                const year = date.year();
                const month = (date.month() + 1).toString().padStart(2, "0");
                const day = date.date().toString().padStart(2, "0");
                return `${year}-${month}-${day}`;
            };

            const versionKey = initialVersion?.id;

            const data =
                type === "fixed"
                    ? {
                        shiftVersionName: versionName,
                        shiftType: "fixed" as const,
                        workingDays,
                        shiftFromTime: formatTime(startTime),
                        shiftToTime: formatTime(endTime),
                        breakDuration: Number(breakDuration),
                        effectiveFromDate: formatDate(effectiveDate),
                        ...(versionKey != null ? { shiftVersionId: versionKey } : {}),
                    }
                    : {
                        shiftVersionName: versionName,
                        shiftType: "flexible" as const,
                        workingDays,
                        grossHours: parseInt(grossHours, 10),
                        breakDuration: Number(breakDuration),
                        effectiveFromDate: formatDate(effectiveDate),
                        ...(versionKey != null ? { shiftVersionId: versionKey } : {}),
                    };

            await createVersion({ shiftId, data }).unwrap();
            onSuccess(
                initialVersion
                    ? "Shift version updated successfully"
                    : "Shift version created successfully",
            );
            handleClose();
        } catch (error: any) {
            console.error("Failed to save shift version:", error);
            const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to save shift version.";
            onError(errorMsg);
        }
    };

    const handleClose = () => {
        setVersionName("");
        setWorkWeek([]);
        setType("fixed");
        setStartTime(null);
        setEndTime(null);
        setGrossHours("");
        setBreakDuration("");
        setEffectiveDate(null);
        onClose();
    };

    const isValid =
        versionName.trim() !== "" &&
        workWeek.length > 0 &&
        effectiveDate !== null &&
        breakDuration.trim() !== "" &&
        (type === "fixed"
            ? startTime !== null && endTime !== null
            : grossHours.trim() !== "" && !grossHoursInvalid);

    return (
        <ModalElement
            open={open}
            onClose={handleClose}
            title={initialVersion ? "Edit Shift Version" : "Add Shift Version"}
            maxWidth="md"
        >
            <Box
                display="grid"
                gridTemplateColumns="180px 1fr"
                rowGap={2}
                columnGap={3}
                alignItems="center"
                mt={1}
            >
                <ReqLabel>Version Name</ReqLabel>
                <TextFieldElement
                    placeholder="Enter version name"
                    label=""
                    required
                    fullWidth
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    slotProps={{
                        htmlInput: {
                            maxLength: 50,
                        },
                    }}
                />

                <ReqLabel>Work Week</ReqLabel>
                <DayPicker value={workWeek} onChange={(value) => setWorkWeek(value)} label="" />

                <ReqLabel>Type</ReqLabel>
                <Stack direction="row" spacing={2}>
                    <RadioButton
                        label="Fixed Shift Timings"
                        checked={type === "fixed"}
                        onChange={() => setType("fixed")}
                    />
                    <RadioButton
                        label="Flexible Shift Timings"
                        checked={type === "flexible"}
                        onChange={() => setType("flexible")}
                    />
                </Stack>

                {type === "fixed" && (
                    <>
                        <ReqLabel>Shift Timings</ReqLabel>
                        <Stack direction="row" spacing={2}>
                            <Box flex={1}>
                                <TimePickerElement
                                    label="Start Time"
                                    required
                                    value={startTime}
                                    onChange={(date) => setStartTime(date)}
                                    width="100%"
                                />
                            </Box>
                            <Box flex={1}>
                                <TimePickerElement
                                    label="End Time"
                                    required
                                    value={endTime}
                                    onChange={(date) => setEndTime(date)}
                                    width="100%"
                                />
                            </Box>
                        </Stack>
                    </>
                )}

                {type === "flexible" && (
                    <>
                        <ReqLabel>Gross Hours</ReqLabel>
                        <TextFieldElement
                            label=""
                            required
                            type="number"
                            value={grossHours}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || /^\d+$/.test(v)) setGrossHours(v);
                            }}
                            fullWidth
                            error={grossHoursInvalid}
                            helperText="Enter a whole number from 1 to 23 hours."
                            slotProps={{
                                htmlInput: {
                                    min: 1,
                                    max: 23,
                                    step: 1,
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                },
                                input: {
                                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                                        const allowedKeys = [
                                            "Backspace",
                                            "Delete",
                                            "Tab",
                                            "ArrowLeft",
                                            "ArrowRight",
                                            "Home",
                                            "End",
                                        ];
                                        if (allowedKeys.includes(e.key)) return;
                                        if (!/^\d$/.test(e.key)) e.preventDefault();
                                    },
                                },
                            }}
                        />
                    </>
                )}

                <ReqLabel>Break Duration</ReqLabel>
                <TextFieldElement
                    label=""
                    required
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value)}
                    width="48.5%"
                    slotProps={{
                        htmlInput: { style: { textAlign: "right" } },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Box>mins</Box>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <ReqLabel>Effective From</ReqLabel>
                <DatePickerElement
                    label="Select Date"
                    required
                    value={effectiveDate}
                    onChange={(date) => setEffectiveDate(date)}
                    width="48.5%"
                />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: 2 }}>
                <PrimaryButton onClick={handleSave} disabled={isLoading || !isValid}>
                    {isLoading ? "Saving..." : "Save"}
                </PrimaryButton>
            </Box>

        </ModalElement>
    );
}

export default ShiftVersionModal;
