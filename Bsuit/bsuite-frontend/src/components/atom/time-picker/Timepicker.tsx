import { useMemo, useState } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import type { TimePickerElementProps } from "../../../types/types";

const fieldSx = (width?: string | number) => ({
  width: width ?? "100%",
  "& .MuiPickersOutlinedInput-root": {
    borderRadius: "8px",
  },
  "& .MuiPickersOutlinedInput-notchedOutline": {
    borderRadius: "8px",
  },
});

export function TimePickerElement({
  label,
  value = null,
  onChange,
  required = false,
  error = false,
  helperText,
  disabled = false,
  width,
  format = "hh:mm A",
  allowKeyboardInput = true,
  closeOnSelect = true,
  minutesStep = 1,
  sx,
}: TimePickerElementProps) {
  const [open, setOpen] = useState(false);
  const ampm = useMemo(() => /h{1,2}:mm\s*A/i.test(format), [format]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label={required ? `${label} *` : label}
        value={value}
        onChange={(newValue) => onChange?.(newValue)}
        disabled={disabled}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        format={format}
        ampm={ampm}
        minutesStep={minutesStep}
        closeOnSelect={closeOnSelect}
        slotProps={{
          textField: {
            error,
            size: "small",
            helperText,
            ...(allowKeyboardInput
              ? {}
              : {
                  readOnly: true,
                  onClick: () => !disabled && setOpen(true),
                }),
            sx: { ...fieldSx(width), ...sx },
          },
          openPickerButton: {
            "aria-label": `Open ${label} picker`,
          },
        }}
      />
    </LocalizationProvider>
  );
}
