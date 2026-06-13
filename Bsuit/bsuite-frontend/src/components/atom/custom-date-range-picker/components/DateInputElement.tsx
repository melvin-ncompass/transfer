import { IconButton, InputAdornment, TextField } from "@mui/material";
import React from "react";

import DateRangeIcon from '@mui/icons-material/DateRange';

type DateInputShowComponentProps = {
  id: string;
  placeholder: string;
  onClick: React.MouseEventHandler<HTMLElement> | undefined;
  ref: React.Ref<HTMLDivElement>;
  label?: string;
  error?: boolean;
  helperText?: string;
  width?: string | number;
  required?: boolean;
};

export const DateInputShowComponent: React.FC<DateInputShowComponentProps> = ({
  id,
  placeholder,
  onClick,
  ref,
  label,
  error = false,
  helperText,
  width = "300px",
  required = false,
}) => {
  const onClickHandler = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event);
  };
  return (
    <TextField
      id={id}
      label={required ? `${label} *` : label}
      value={placeholder}
      onClick={(e) => onClickHandler(e)}
      variant="outlined"
      ref={ref}
      sx={{ mt: 1, width }}
      size="small"
      error={error}
      helperText={helperText}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle date range picker"
              onClick={(e) => onClickHandler(e)}
              edge="end"
            >
            <DateRangeIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

