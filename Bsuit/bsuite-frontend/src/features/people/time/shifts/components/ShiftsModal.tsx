import { useState, type ReactNode } from "react";
import type { Dayjs } from "dayjs";
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
import { useCreateShiftMutation } from "../api/shifts.api";

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

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data?: {
    id: string;
    shiftName: string;
    workWeek: WeekDay[];
    type: string;
    shiftFromTime?: string;
    shiftToTime?: string;
    grossHours?: number;
    breakDuration: number;
  };
  onSuccess: (created?: any, message?: string) => void;
  onError: (message: string) => void;
}

function ShiftsModal({ open, onClose, title ,data,onError,onSuccess}: ShiftModalProps) {
  // State variables
  const [shiftName, setShiftName] = useState("");
  const [workWeek, setWorkWeek] = useState<WeekDay[]>([]);
  const [type, setType] = useState<string>("fixed");
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [grossHours, setGrossHours] = useState<string>("");
  const [breakDuration, setBreakDuration] = useState<string>("");

  const [createShift, { isLoading }] = useCreateShiftMutation();

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
      // Convert working days to full names
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

      // Format times to HH:mm
      const formatTime = (date: Dayjs | null) => {
        if (!date) return "";
        const hours = date.hour().toString().padStart(2, "0");
        const minutes = date.minute().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      const data =
        type === "fixed"
          ? {
              shiftName,
              shiftType: "fixed" as const,
              workingDays,
              shiftFromTime: formatTime(startTime),
              shiftToTime: formatTime(endTime),
              breakDuration: Number(breakDuration),
            }
          : {
              shiftName,
              shiftType: "flexible" as const,
              workingDays,
              grossHours: parseInt(grossHours, 10),
              breakDuration: Number(breakDuration),
            };

      const res = await createShift(data).unwrap();
      onSuccess(res.data, "Shift saved successfully");
      handleClose();
    } catch (error: any) {
      console.error("Failed to create shift:", error);
      const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to create shift.";
      onError(errorMsg);
    }
  };

  const handleClose = () => {
    // Reset form
    setShiftName("");
    setWorkWeek([]);
    setType("fixed");
    setStartTime(null);
    setEndTime(null);
    setGrossHours("");
    setBreakDuration("");
    onClose();
  };

  const isValid =
    shiftName.trim() !== "" &&
    workWeek.length > 0 &&
    breakDuration.trim() !== "" &&
    (type === "fixed"
      ? startTime !== null && endTime !== null
      : grossHours.trim() !== "" && !grossHoursInvalid);

  return (
    <ModalElement open={open} onClose={handleClose} title={title} maxWidth="md">
      <Box
        display="grid"
        gridTemplateColumns="180px 1fr"
        rowGap={2}
        columnGap={3}
        alignItems="center"
        mt={1}
      >
        <ReqLabel>Shift Name</ReqLabel>
        <TextFieldElement
          placeholder="Enter shift name"
          label=""
          required
          fullWidth
          value={shiftName}
          onChange={(e) => setShiftName(e.target.value)}
          slotProps={{
            htmlInput: {
              maxLength: 50,
            },
          }}
        />

        <ReqLabel>Work Week</ReqLabel>
        <DayPicker
          value={workWeek}
          onChange={(value) => setWorkWeek(value)}
          label=""
        />

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

        {/* Conditional */}
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
          fullWidth
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
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          mt: 2,
        }}
      >
        <PrimaryButton onClick={handleSave} disabled={isLoading || !isValid}>
          {isLoading ? "Saving..." : "Save"}
        </PrimaryButton>
      </Box>

    </ModalElement>
  );
}

export default ShiftsModal;
