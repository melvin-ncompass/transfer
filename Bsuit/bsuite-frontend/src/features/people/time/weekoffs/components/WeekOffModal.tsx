import { useState, useEffect } from "react";
import {
  DayPicker,
  type WeekDay,
} from "../../../../../components/atom/date-picker";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { Box, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useCreateWeekOffMutation, useUpdateWeekOffMutation } from "../api/weekoffs.api";

interface WeekOffModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data?: { id: string; weekOffName: string;  weekOffDays: WeekDay[]  };
  onSuccess: (created?: any,message?: string) => void;
  onError: (message: string) => void;
}

function WeekOffModal({ open, onClose, title, data, onSuccess, onError }: WeekOffModalProps) {
  const [weekOffName, setWeekOffName] = useState("");
  const [daysOff, setDaysOff] = useState<WeekDay[]>([]);

  const [createWeekOff, { isLoading: creating }] = useCreateWeekOffMutation();
  const [updateWeekOff, { isLoading: updating }] = useUpdateWeekOffMutation();

  // Helper: convert string[] to WeekDay[]
  const mapToWeekDays = (days: string[]): WeekDay[] => {
    return days.map((d) => d as WeekDay); // assert type
  };

  // Populate modal if editing
  useEffect(() => {
    if (data) {
      setWeekOffName(data.weekOffName);
      const apiDays = data.weekOffDays || [];
      setDaysOff(apiDays);
    } else {
      setWeekOffName("");
      setDaysOff([]);
    }
  }, [data, open]);

  const handleSave = async () => {
    if (!weekOffName || daysOff.length === 0) {
      if(!weekOffName) {
        onError("Week off name is required");
      }else if(daysOff.length === 0) {
        onError("At least one day off must be selected");
      }else {
      onError("Week off name and at least one day must be selected");
      return;
    }
    return;
  }
    const payload = {
      weekOffName,
      weekOffDays: daysOff, // DayPicker returns WeekDay[], which matches API string[]
    };

    try {
      if (data?.id) {
        // Editing existing week off
        await updateWeekOff({ id: data.id, data: { weekOffName: weekOffName, isDefault: false } }).unwrap();
        onSuccess("Week off updated successfully",);
      } else {
        // Creating new week off
        
        const res = await createWeekOff(payload).unwrap();
        onSuccess(res.data, "Week off created successfully");
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save week off:", err);
      onError(err.data?.message || "Failed to save week off");
    }
  };

  return (
    <ModalElement open={open} onClose={onClose} title={title} maxWidth="md">
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

        {/* Days Off */}
        <Typography variant="subtitle2">Days Off</Typography>
        <DayPicker value={daysOff} onChange={setDaysOff} label="" />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: 2 }}>
        <PrimaryButton onClick={handleSave} disabled={creating || updating}>
          Save
        </PrimaryButton>
      </Box>
    </ModalElement>
  );
}

export default WeekOffModal;
