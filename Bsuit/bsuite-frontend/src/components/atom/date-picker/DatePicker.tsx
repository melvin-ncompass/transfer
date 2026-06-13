import { useMediaQuery, useTheme } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { Dayjs } from "dayjs";
import type { DatePickerElementProps } from "../../../types/types";

export function DatePickerElement({
  label,
  value = null,
  size = "small",
  onChange,
  required = false,
  error = false,
  helperText,
  disabled = false,
  width,
  min = null,
  max = null,
  views,
  format,
  openTo,
  withTime = false,
  onOpen,
  onClose,
}: DatePickerElementProps & {
  min?: Dayjs | null;
  max?: Dayjs | null;
  views?: ("year" | "month" | "day")[];
  format?: string;
  openTo?: "year" | "month" | "day";
  withTime?: boolean;
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const PickerComponent = withTime ? DateTimePicker : DatePicker;
  const resolvedViews = views ?? ["year", "month", "day"];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <PickerComponent
        label={required ? `${label} *` : label}
        value={value}
        minDate={min!}
        maxDate={max!}
        onChange={(newValue) => onChange?.(newValue)}
        onOpen={onOpen}
        onClose={onClose}
        disabled={disabled}
        views={resolvedViews}
        openTo={openTo ?? "day"}
        timeSteps={{ minutes: 1 }}
        desktopModeMediaQuery="@media (pointer: fine)"
        format={format ?? (withTime ? "MMM DD, YYYY hh:mm A" : "MMM DD, YYYY")}
        showDaysOutsideCurrentMonth={!withTime && resolvedViews.includes("day")}
        slotProps={{
          actionBar: {
            actions: ["cancel", "accept"],
          },
          textField: {
            error,
            size,
            helperText,
            readOnly: true,
            sx: {
              width: width ?? (isSmallScreen ? "100%" : "20%"),
              minWidth: 155,
              "& .MuiPickersInputBase-root": {
                fontSize: size === "small" ? "0.85rem" : "1rem",
                padding: "1px 11px !important",
              },
              "& .MuiPickersOutlinedInput-root": {
                borderRadius: "8px",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}
