import { useState } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useMediaQuery, useTheme } from "@mui/system";
import type { Dayjs } from "dayjs";
import type { DatePickerElementProps } from "../../../types/types";

export function MonthYearPickerElement({
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
    format = "MMM YYYY",
    shouldDisableMonth,
    referenceDate,
}: DatePickerElementProps & {
    min?: Dayjs | null;
    max?: Dayjs | null;
    format?: string;
    /** If provided, months for which this returns true will be disabled (e.g. to allow only one month). */
    shouldDisableMonth?: (month: Dayjs) => boolean;
    /** Month/year view anchor when value is empty (defaults to today). */
    referenceDate?: Dayjs | null;
}) {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                views={["year", "month"]}
                label={required ? `${label} *` : label}
                value={value}
                referenceDate={referenceDate ?? undefined}
                minDate={min!}
                maxDate={max!}
                disabled={disabled}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                onChange={(newValue) => { onChange?.(newValue) }}
                format={format}
                shouldDisableMonth={shouldDisableMonth}
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
                            /* Month grid */
                            "& .MuiMonthCalendar-root": {
                                padding: 2,
                            },
                            "& .MuiYearCalendar-root": {
                                paddingBottom: 1,
                            },
                        }
                    }
                }}
            />
        </LocalizationProvider>
    );
}
