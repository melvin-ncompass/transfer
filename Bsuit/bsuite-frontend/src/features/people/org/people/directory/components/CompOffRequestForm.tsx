import { useState } from "react";
import { useRequestCompOffMutation } from "../api/directory.api";
import type { Dayjs } from "dayjs";
import { Stack } from "@mui/material";
import { DateRangePicker } from "../../../../../../components/atom/custom-date-range-picker/DateRangePicker";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";

export function CompOffRequestForm({
  open,
  employeeId,
  onClose,
  onAfterAction,
}: {
  open: boolean;
  employeeId: string;
  onClose: () => void;
  onAfterAction: (msg: string, color: string) => void;
}) {
  const [requestCompOff, { isLoading }] = useRequestCompOffMutation();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");

  const isDisabled = !startDate || !endDate || !note.trim();

  const handleSubmit = async () => {

        if(isDisabled){
            return;
        }

    const dateRange: string[] = [
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD"),
    ];

    try {
        await requestCompOff({
        employeeId,
        body: {
            dateRange,
            note,
            flag: "award",
        },
        }).unwrap();

        onAfterAction("Comp-Off awarded successfully.", "success");
        onClose();
    } catch (err: any) {
        onAfterAction(
        err?.data?.message || err?.message || "Failed to award comp-off.",
        "error"
        );
    }
    };

  return (
    <ModalElement
      maxWidth="sm"
      open={open}
      onClose={onClose}
      title="Award Comp-Off"
    >
    <Stack spacing={3} sx={{ mt: 2, minWidth: { xs: "auto", sm: 400 } }}>
      <Stack direction="row" spacing={2}>
        <DateRangePicker
          label="Select Date"
          startValue={startDate}
          endValue={endDate}
          onChange={([start, end]) => {
            setStartDate(start);
            setEndDate(end);
          }}
          required
          width="100%"
        />
      </Stack>
      <TextFieldElement
        label="Note"
        value={note}
        onChange={(e: any) => setNote(e.target.value)}
        multiline
        rows={3}
        required
        fullWidth
      />
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <PrimaryButton onClick={handleSubmit} loading={isLoading} disabled={isDisabled}>
          Submit
        </PrimaryButton>
      </Stack>
    </Stack>
    </ModalElement>
  );
}