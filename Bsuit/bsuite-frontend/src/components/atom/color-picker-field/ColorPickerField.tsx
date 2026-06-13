import { useState, useRef, useEffect } from "react";
import { Popover, TextField, Box, InputAdornment } from "@mui/material";
import { HexColorPicker } from "react-colorful";
import type { ColorPickerFieldProps } from "../../../types/types";
import { useMediaQuery, useTheme } from "@mui/system";

export const ColorPickerField = ({
  label,
  value,
  onChange,
  disabled = false,
}: ColorPickerFieldProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newColor: string) => {
    setLocalValue(newColor);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onChange?.(newColor);
    }, 150);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <TextField
        size="small"
        label={label}
        value={localValue.toUpperCase()}
        disabled={disabled}
        onClick={handleClick}
        variant="outlined"
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    border: "1px solid #ccc",
                    backgroundColor: localValue,
                  }}
                />
              </InputAdornment>
            ),
          }
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            cursor: disabled ? "not-allowed" : "pointer",
          },
          width: (isSmallScreen ? "100%" : "20%"),
        }}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: { p: 2, borderRadius: "12px" },
        }}
      >
        <HexColorPicker
          color={localValue}
          onChange={handleChange}
          style={{
            width: "180px",
            height: "180px",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </Popover>
    </>
  );
};
