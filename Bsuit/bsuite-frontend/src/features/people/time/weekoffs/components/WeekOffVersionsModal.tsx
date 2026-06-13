import { useState, useEffect, useRef } from "react";
import {
  DatePickerElement,
  DayPicker,
  type WeekDay,
} from "../../../../../components/atom/date-picker";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { Box, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useCreateWeekOffVersionMutation, useUpdateWeekOffMutation } from "../api/weekoffs.api";
import dayjs, { Dayjs } from "dayjs";

interface WeekOffModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data?: {
    id: string;
    weekOffName: string;
    weekOffDays: WeekDay[];
    effectiveFromDate: string;
    weekOffId?: string;
  };
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function WeekOffVersionsModal({
  open,
  onClose,
  title,
  data,
  onSuccess,
  onError,
}: WeekOffModalProps) {
  const [weekOffName, setWeekOffName] = useState("");
  const [daysOff, setDaysOff] = useState<WeekDay[]>([]);
  const [effectiveFromDate, setEffectiveFromDate] = useState<Dayjs | null>(
    null,
  );

  const initializedRef = useRef(false);

  const [createWeekOff, { isLoading: creating }] =
    useCreateWeekOffVersionMutation();
  const [updateWeekOff, { isLoading: updating }] = useUpdateWeekOffMutation();

  // Helper: convert string[] to WeekDay[]
  const mapToWeekDays = (days: string[]): WeekDay[] => {
    return days.map((d) => d as WeekDay); // assert type
  };

  // Populate modal if editing
  useEffect(() => {
    if (open) {
        if (!initializedRef.current) {
          // Only populate on first open
            if (data) {
              setWeekOffName(data.weekOffName);
              setDaysOff(data.weekOffDays || []);
              setEffectiveFromDate(dayjs(data.effectiveFromDate));
            } else {
              setWeekOffName("");
              setDaysOff([]);
              setEffectiveFromDate(null);
            }
          initializedRef.current = true;
        }
    } else {
      // Reset the flag when modal closes so next open re-populates
      initializedRef.current = false;
    }
  }, [data, open]);

  const handleSave = async () => {
    if (!weekOffName || daysOff.length === 0) return;

    const payload = {
      weekOffVersionName: weekOffName,
      weekOffDays: daysOff, // DayPicker returns WeekDay[], which matches API string[]
      effectiveFromDate: effectiveFromDate?.format("YYYY-MM-DD") || "",
    };

    try {
      // Creating new week off
      await createWeekOff({ id: data?.id!, data: payload }).unwrap();

      onSuccess("Week off version created successfully");
      onClose();
    } catch (err: any) {
      console.error("Failed to save week off:", err);
      onError(err.data.message || "Failed to save week off");
    }
  };

  return (
    <ModalElement
      open={open}
      onClose={() => {
        onClose();
      }}
      title={title}
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
        {/* Week Off Name */}
        <Typography variant="subtitle2">Week Off Name</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextFieldElement
            value={weekOffName}
            onChange={(e) => setWeekOffName(e.target.value)}
            placeholder="Enter week off name"
            label=""
            fullWidth
            slotProps={{
              htmlInput: {
                maxLength: 100,
              },
            }}
          />
          <DatePickerElement
            label="Effective From Date"
            value={dayjs(effectiveFromDate)}
            onChange={(date) => setEffectiveFromDate(date)}
          />
        </Box>

        {/* Days Off */}
        <Typography variant="subtitle2">Days Off</Typography>
        <DayPicker value={daysOff} onChange={setDaysOff} label="" />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          mt: 2,
        }}
      >
        <PrimaryButton onClick={handleSave} disabled={creating || updating}>
          Save
        </PrimaryButton>
      </Box>
    </ModalElement>
  );
}

export default WeekOffVersionsModal;
