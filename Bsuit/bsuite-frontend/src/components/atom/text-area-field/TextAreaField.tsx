import { TextField, useTheme } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import type { TextAreaFieldProps } from "../../../types/types";
import { useMediaQuery } from "@mui/system";

export function TextAreaField({
  label,
  value,
  onChange,
  required,
  error,
  width,
  helperText,
  disabled,
  rows = 4,
  maxLength ,
  sx,
}: TextAreaFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<number | null>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // keep localValue synced if parent updates externally
  useEffect(() => {
    if (value !== localValue) setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Debounce updates to parent
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onChange?.(newValue);
    }, 150);
  };

  return (
    <TextField
      label={required ? `${label} *` : label}
      value={localValue}
      onChange={handleChange}
      multiline
      rows={rows}
      fullWidth
      disabled={disabled}
      error={error}
      helperText={helperText}
      slotProps={{
        input: {
          inputProps: {
            maxLength: maxLength, 
          },
        },
      }}
      sx={{
        width: isSmallScreen ? "100%" : (width ?? "50%"),
        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
        "& .MuiOutlinedInput-notchedOutline": { borderRadius: "8px" },
        "& textarea": { resize: "both" },
        ...sx,
      }}
    />
  );
}
