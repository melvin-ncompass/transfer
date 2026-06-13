import React, { forwardRef, useEffect, useState } from "react";
import { Box, TextField, Popover, Paper, Stack, IconButton, Divider, ButtonBase } from "@mui/material";
import { styled } from "@mui/material/styles";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { DatePickerElementProps } from "../../../types/types";
import type { Dayjs } from "dayjs";
interface CustomDateInputProps extends React.HTMLProps<HTMLButtonElement> {
  value?: string;
}
interface DateRangePickerProps
  extends Omit<DatePickerElementProps, "value" | "onChange"> {
  startValue?: Dayjs | null;
  endValue?: Dayjs | null;
  onChange?: (dates: [Dayjs | null, Dayjs | null]) => void;
  /** Fired when the popover closes (click outside, escape, or after a full range is picked). */
  onClose?: () => void;
  min?: Dayjs | null;
  max?: Dayjs | null;
  months?: number;
  displayFormat?: 'full' | 'month-day' | 'day-only' | 'custom';
  customFormat?: {
    start: string;
    end: string;
    separator?: string;
  };
}
// Styled wrapper for react-datepicker with MUI theme - Compact version
const StyledDatePickerWrapper = styled(Box)(({ theme }) => ({
  "& .react-datepicker": {
    fontFamily: theme.typography.fontFamily,
    border: "none",
    boxShadow: "none",
    backgroundColor: "transparent",
    fontSize: "0.875rem",
  },
  "& .react-datepicker__header": {
    backgroundColor: "transparent",
    borderBottom: "none",
    paddingTop: 0,
  },
  "& .react-datepicker__month-container": {
    padding: theme.spacing(0.5, 1),
  },
  "& .react-datepicker__day-names": {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: theme.spacing(0.5),
    paddingTop: theme.spacing(0.5),
  },
  "& .react-datepicker__day-name": {
    color: theme.palette.text.secondary,
    fontSize: "0.6875rem",
    fontWeight: 600,
    width: "2rem",
    lineHeight: "1.5rem",
    margin: 0,
  },
  "& .react-datepicker__week": {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "2px",
  },
  "& .react-datepicker__day": {
    width: "2rem",
    height: "2rem",
    lineHeight: "2rem",
    margin: "1px",
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    fontSize: "0.8125rem",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderRadius: theme.shape.borderRadius,
    },
  },
  "& .react-datepicker__day--selected": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
  },
  "& .react-datepicker__day--in-range": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    opacity: 0.85,
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
      opacity: 1,
    },
  },
  "& .react-datepicker__day--range-start, & .react-datepicker__day--range-end": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
  },
  "& .react-datepicker__day--keyboard-selected": {
    backgroundColor: theme.palette.action.selected,
    color: theme.palette.text.primary,
  },
  "& .react-datepicker__day--disabled": {
    color: theme.palette.text.disabled,
    cursor: "not-allowed",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  "& .react-datepicker__day--outside-month": {
    color: theme.palette.text.disabled,
    visibility: "visible",
  },
  "& .react-datepicker__day--today": {
    fontWeight: 600,
    border: `1px solid ${theme.palette.primary.main}`,
  },
  "& .react-datepicker__month": {
    margin: 0,
  },
}));
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const COLS = 4;

// Custom header with month/year grid popovers
const CustomHeader: React.FC<{
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
  minDate?: Date;
  maxDate?: Date;
}> = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  minDate,
  maxDate,
}) => {
    const currentYear = dayjs(date).year();
    const currentMonth = dayjs(date).month();
    const startYear = minDate ? dayjs(minDate).year() : 1990;
    const endYear = maxDate ? dayjs(maxDate).year() : dayjs().year() + 10;
    const years = Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i
    );

    const [monthAnchor, setMonthAnchor] = React.useState<HTMLElement | null>(null);
    const [yearAnchor, setYearAnchor] = React.useState<HTMLElement | null>(null);

    const handleMonthClick = (month: number) => {
      changeMonth(month);
      setMonthAnchor(null);
    };
    const handleYearClick = (year: number) => {
      changeYear(year);
      setYearAnchor(null);
    };

    return (
      <Stack sx={{ px: 0.5, py: 0.5, mb: 0 }} spacing={0.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton
            size="small"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            sx={{ p: 0.5, "&:hover": { bgcolor: "action.hover" } }}
          >
            <ChevronLeftIcon sx={{ fontSize: "1.25rem" }} />
          </IconButton>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ButtonBase
              onClick={(e) => setMonthAnchor(e.currentTarget)}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: "0.8125rem",
                fontWeight: 600,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {MONTHS[currentMonth]}
            </ButtonBase>
            <ButtonBase
              onClick={(e) => setYearAnchor(e.currentTarget)}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: "0.8125rem",
                fontWeight: 600,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {currentYear}
            </ButtonBase>
          </Stack>

          <IconButton
            size="small"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            sx={{ p: 0.5, "&:hover": { bgcolor: "action.hover" } }}
          >
            <ChevronRightIcon sx={{ fontSize: "1.25rem" }} />
          </IconButton>
        </Stack>

        <Popover
          open={Boolean(monthAnchor)}
          anchorEl={monthAnchor}
          onClose={() => setMonthAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          slotProps={{ paper: { sx: { mt: 0.5, minWidth: 140 } } }}
        >
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gap: 0.25,
              }}
            >
              {MONTHS.map((label, i) => (
                <ButtonBase
                  key={label}
                  onClick={() => handleMonthClick(i)}
                  sx={{
                    py: 0.5,
                    px: 0.75,
                    borderRadius: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: currentMonth === i ? 600 : 400,
                    bgcolor: currentMonth === i ? "primary.main" : "transparent",
                    color: currentMonth === i ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      bgcolor: currentMonth === i ? "primary.light" : "action.hover",
                      color: currentMonth === i ? "primary.contrastText" : undefined,
                    },
                  }}
                >
                  {label}
                </ButtonBase>
              ))}
            </Box>
          </Paper>
        </Popover>

        <Popover
          open={Boolean(yearAnchor)}
          anchorEl={yearAnchor}
          onClose={() => setYearAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160 } } }}
        >
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gap: 0.25,
              }}
            >
              {years.map((y) => (
                <ButtonBase
                  key={y}
                  onClick={() => handleYearClick(y)}
                  sx={{
                    py: 0.5,
                    px: 0.75,
                    borderRadius: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: currentYear === y ? 600 : 400,
                    bgcolor: currentYear === y ? "primary.main" : "transparent",
                    color: currentYear === y ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      bgcolor: currentYear === y ? "primary.light" : "action.hover",
                      color: currentYear === y ? "primary.contrastText" : undefined,
                    },
                  }}
                >
                  {y}
                </ButtonBase>
              ))}
            </Box>
          </Paper>
        </Popover>
      </Stack>
    );
  };

/**
 * Custom DateRangePicker Component with MUI Design
 * 
 * A customizable date range picker matching MUI design system with multi-month views.
 * 
 * @example
 * // Full format (default): "Jan 15, 2024 - Feb 20, 2024"
 * <DateRangePicker
 *   label="Select Duration"
 *   startValue={dayjs()}
 *   endValue={dayjs().add(7, 'day')}
 *   onChange={([start, end]) => console.log(start, end)}
 *   displayFormat="full"
 * />
 * 
 * @example
 * // Month-day format: "Jan 15 - Feb 20"
 * <DateRangePicker
 *   label="Select Duration"
 *   displayFormat="month-day"
 * />
 * 
 * @example
 * // Day-only format (same month): "15 - 20"
 * <DateRangePicker
 *   label="Select Duration"
 *   displayFormat="day-only"
 * />
 * 
 * @example
 * // Custom format
 * <DateRangePicker
 *   label="Select Duration"
 *   displayFormat="custom"
 *   customFormat={{ start: "DD/MM/YYYY", end: "DD/MM/YYYY", separator: " to " }}
 * />
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label = "Select Date Range",
  startValue = null,
  endValue = null,
  onChange,
  onClose,
  required = false,
  error = false,
  helperText,
  disabled = false,
  width = "100%",
  min = null,
  max = null,
  months = 1,
  displayFormat = "full",
  customFormat,
}) => {
  const toLocalDate = (d: Dayjs): Date =>
    new Date(d.year(), d.month(), d.date(), 12, 0, 0, 0);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  // Initialize dates from startValue and endValue props
  useEffect(() => {
    setStartDate(startValue ? toLocalDate(startValue) : undefined);
    setEndDate(endValue ? toLocalDate(endValue) : undefined);
  }, [startValue, endValue]);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    if (startDate && !endDate) {
      return;
    }
    setAnchorEl(null);
    onClose?.();
  };

  const open = Boolean(anchorEl);

  // Format display value based on displayFormat prop
  const getDisplayValue = () => {
    if (!startDate) return "";

    const startDayjs = dayjs(startDate);
    const endDayjs = endDate ? dayjs(endDate) : null;

    switch (displayFormat) {
      case "full":
        // Format: "Jan 15, 2024 - Feb 20, 2024"
        return endDayjs
          ? `${startDayjs.format("MMM DD, YYYY")} - ${endDayjs.format("MMM DD, YYYY")}`
          : `${startDayjs.format("MMM DD, YYYY")} - `;
      case "month-day":
        // Format: "Jan 15 - Feb 20"
        return endDayjs
          ? `${startDayjs.format("MMM DD")} - ${endDayjs.format("MMM DD")}`
          : `${startDayjs.format("MMM DD")} - `;

      case "day-only":
        // Format: "15 - 20" (if same month) or "Jan 15 - Feb 20" (if different months)
        if (endDayjs) {
          const sameMonth = startDayjs.month() === endDayjs.month() && startDayjs.year() === endDayjs.year();
          if (sameMonth) {
            return `${startDayjs.format("DD")} - ${endDayjs.format("DD")}`;
          }
          return `${startDayjs.format("MMM DD")} - ${endDayjs.format("MMM DD")}`;
        }
        return `${startDayjs.format("DD")} - `;
      case "custom":
        // Custom format using provided format strings
        if (customFormat) {
          const separator = customFormat.separator || " - ";
          return endDayjs
            ? `${startDayjs.format(customFormat.start)}${separator}${endDayjs.format(customFormat.end)}`
            : `${startDayjs.format(customFormat.start)}${separator}`;
        }
        // Fallback to full format if customFormat not provided
        return endDayjs
          ? `${startDayjs.format("MMM DD, YYYY")} - ${endDayjs.format("MMM DD, YYYY")}`
          : `${startDayjs.format("MMM DD, YYYY")} - `;
      default:
        return endDayjs
          ? `${startDayjs.format("MMM DD, YYYY")} - ${endDayjs.format("MMM DD, YYYY")}`
          : `${startDayjs.format("MMM DD, YYYY")} - `;
    }
  };

  const displayValue = getDisplayValue();

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [rawStart, rawEnd] = dates;
    const hasBoth = rawStart != null && rawEnd != null;
    const start = hasBoth && rawStart > rawEnd ? rawEnd : rawStart;
    const end = hasBoth && rawStart > rawEnd ? rawStart : rawEnd;
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
    if (onChange) {
      const startDayjs = start ? dayjs(start) : null;
      const endDayjs = end ? dayjs(end) : null;
      onChange([startDayjs, endDayjs]);
    }
    // Auto-close when both dates are selected
    if (start && end) {
      setTimeout(() => {
        setAnchorEl(null);
        onClose?.();
      }, 200);
    }

  };
  const minDateObj = min ? toLocalDate(min) : undefined;
  const maxDateObj = max ? toLocalDate(max) : undefined;
  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={displayValue}
        onClick={handleClick}
        placeholder="Select date range"
        required={required}
        error={error}
        helperText={helperText}
        disabled={disabled}
        size="small"
        sx={{
          width,
          minWidth: 155,
          "& .MuiInputBase-root": {
            fontSize: "1rem",
            borderRadius: "8px",
          },
          "& .MuiOutlinedInput-input::placeholder": {
            opacity: 0,
          },
        }}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <CalendarTodayIcon
              sx={{
                color: disabled ? "action.disabled" : "action.active",
                fontSize: "1.1rem",
              }}
            />
          ),
          sx: {
            cursor: disabled ? "not-allowed" : "pointer",
            "& input": {
              cursor: disabled ? "not-allowed" : "pointer",
            },
          },
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 0.5,
              borderRadius: 1.5,
              overflow: "hidden",
            },
          },
        }}
      >
        <Paper elevation={0}>
          <StyledDatePickerWrapper>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              minDate={minDateObj}
              maxDate={maxDateObj}
              calendarStartDay={1}
              monthsShown={months}
              inline
              renderCustomHeader={(props) => (
                <CustomHeader
                  date={props.monthDate}
                  changeYear={props.changeYear}
                  changeMonth={props.changeMonth}
                  decreaseMonth={props.decreaseMonth}
                  increaseMonth={props.increaseMonth}
                  prevMonthButtonDisabled={props.prevMonthButtonDisabled}
                  nextMonthButtonDisabled={props.nextMonthButtonDisabled}
                  minDate={minDateObj}
                  maxDate={maxDateObj}
                />
              )}
            />
          </StyledDatePickerWrapper>
        </Paper>
      </Popover>
    </>
  );
};
