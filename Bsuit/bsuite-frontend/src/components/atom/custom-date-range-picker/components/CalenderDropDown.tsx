import { Box, Select, useTheme, type SelectChangeEvent } from "@mui/material";
import React from "react";

interface CalenderDropDownProps {
  values: string[];
  onChange: (value: number) => void;
  id: string;
  nowValue: number;
  isMonth?: boolean;
}

export const CalenderDropDown: React.FC<CalenderDropDownProps> = ({
  values,
  onChange,
  id,
  nowValue,
  isMonth,
}) => {
  const theme = useTheme();
  const onSelect = (e: SelectChangeEvent<string>) => {
    if (isMonth) {
      onChange(values.indexOf(e.target.value));
    } else {
      onChange(parseInt(e.target.value));
    }
  };

  return (
    <Box>
      <Select
        id={id}
        onChange={onSelect}
        sx={{
          textAlign: "left",
          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          fontWeight: theme.typography.fontWeightMedium,
        }}
        displayEmpty
        inputProps={{ "aria-label": "Without label" }}
        size="small"
        variant="outlined"
        value={isMonth ? values[nowValue] : nowValue.toString()}
        native
      >
        {values.map((value) => (
          <option
            key={value}
            value={value}
            style={{
              fontSize: "0.9rem",
              padding: "8px 12px",
              color: theme.palette.text.primary,
              fontWeight: theme.typography.fontWeightMedium,
              backgroundColor: theme.palette.background.default,
            }}
          >
            {value}
          </option>
        ))}
      </Select>
    </Box>
  );
};
