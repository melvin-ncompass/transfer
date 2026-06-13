  import { Box, IconButton, Typography } from "@mui/material";
import React from "react";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import dayjs from "dayjs";
import { CalenderDropDown } from "./CalenderDropDown";

const months = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

interface CustomHeaderProps {
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  minDate?: Date;
  maxDate?: Date;
}

export const DateRangeHeader: React.FC<CustomHeaderProps> = ({
  date,
  changeMonth,
  changeYear,
  decreaseMonth,
  increaseMonth,
  minDate,
  maxDate,
}) => {
  const canDecrease = !minDate || dayjs(date).isAfter(dayjs(minDate), 'month');
  const canIncrease = !maxDate || dayjs(date).isBefore(dayjs(maxDate), 'month');

  const startYear = minDate ? minDate.getFullYear() : 1990;
  const endYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 10;

  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => (startYear + i).toString()
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 1,
          alignItems: "center",
        }}
      >
        <IconButton
          sx={{ p: "2px" }}
          onClick={decreaseMonth}
          disabled={!canDecrease}
        >
          <ChevronLeftOutlinedIcon />
        </IconButton>
        <Typography variant="body2" fontWeight="bold">
          {dayjs(date).format("MMMM YYYY")}
        </Typography>
        <IconButton
          sx={{ p: "2px" }}
          onClick={increaseMonth}
          disabled={!canIncrease}
        >
          <ChevronRightOutlinedIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-evenly",
          px: 1,
          alignItems: "center",
        }}
      >
        <CalenderDropDown
          values={months}
          id={`months-${date.getTime()}`}
          nowValue={date.getMonth()}
          isMonth
          onChange={changeMonth}
        />
        <CalenderDropDown
          values={years}
          id={`years-${date.getTime()}`}
          nowValue={date.getFullYear()}
          onChange={changeYear}
        />
      </Box>
    </Box>
  );
};
