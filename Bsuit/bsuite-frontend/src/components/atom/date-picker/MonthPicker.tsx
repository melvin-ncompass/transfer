import { useState } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useMediaQuery, useTheme } from "@mui/system";
import type { Dayjs } from "dayjs";
import type { DatePickerElementProps } from "../../../types/types";

export function MonthPickerElement({
    label,
    value = null,
    onChange,
    required = false,
    error = false,
    helperText,
    disabled = false,
    width,
    min = null,
    max = null,
    format = "MMM",
}: DatePickerElementProps & {
    min?: Dayjs | null;
    max?: Dayjs | null;
    format?: string;
}) {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                views={["month"]}
                label={required ? `${label} *` : label}
                value={value}
                minDate={min!}
                maxDate={max!}
                disabled={disabled}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                onChange={(newValue) => {
                    onChange?.(newValue);
                    setOpen(false);
                }}
                format={format}
                slotProps={{
                    textField: {
                        size: "small",
                        error,
                        helperText,
                        readOnly: true,
                        onClick: () => !disabled && setOpen(true),
                        sx: {
                            width: width ?? (isSmallScreen ? "100%" : "20%"),
                            "& .MuiPickersInputBase-root": {
                                fontSize: "1rem",
                                padding: "1px 11px !important",
                            },
                            "& .MuiPickersOutlinedInput-root": {
                                borderRadius: "8px",
                            },
                            "& .MuiPickersOutlinedInput-notchedOutline": {
                                borderRadius: "8px",
                            },
                            "& .MuiOutlinedInput-input::placeholder": {
                                opacity: 0,
                            },
                        },
                    },
                    popper: {
                        sx: {
                            "& .MuiMonthCalendar-root": {
                                padding: 2,
                            },
                        }
                    }
                }}
            />
        </LocalizationProvider>
    );
}
