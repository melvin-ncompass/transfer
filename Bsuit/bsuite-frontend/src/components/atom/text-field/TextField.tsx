import { TextField, type TextFieldProps } from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/system";
import type { TextFieldElementProps } from "../../../types/types";

export function TextFieldElement({
name,
label,
value,
onChange,
onBlur,
onFocus,
variant = "outlined",
required = false,
error = false,
helperText,
placeholder,
fullWidth,
disabled = false,
sx,
width,
type,
slotProps,
multiline,
rows,
inputProps
}: TextFieldElementProps) {
const theme = useTheme();
const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (type === "number") {
    // Block invalid keys
    const invalidKeys = ["e", "E", "+", "-"];
    if (invalidKeys.includes(e.key)) {
      e.preventDefault();
    }
  }
};

const mergedSlotProps: TextFieldProps["slotProps"] = {
  inputLabel: {
    shrink: true,
    ...(slotProps?.inputLabel || {}),
  },
  input: {
    onWheel: (e: React.WheelEvent<HTMLInputElement>) => {
      if (type === "number") {
        // Prevent scroll-based number changes
        e.preventDefault();
        e.stopPropagation();

        // Optional safety: blur to stop Chrome’s default behavior entirely
        (e.target as HTMLInputElement).blur();
      }
    },
    onKeyDown: handleKeyDown,
    ...(slotProps?.input || {}),
  },
  htmlInput: {
    ...inputProps,
    ...(slotProps?.htmlInput || {}),
  },
  ...slotProps,
};

return (
  <TextField
    name={name}
    label={label}
    size="small"
    type={type}
    placeholder={placeholder}
    variant={variant}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    onFocus={onFocus}
    disabled={disabled}
    required={required}
    error={error}
    helperText={error ? helperText : ""}
    slotProps={mergedSlotProps}
    multiline={multiline}
    rows={rows}
    
    sx={{
      width: fullWidth ? "100%" : width ?? (isSmallScreen ? "100%" : "20%"),
      "& .MuiInputLabel-root": {
        pointerEvents: "none", // :point_left: Prevent label from blocking clicks
      },
      "&.Mui-disabled": {
        cursor: "not-allowed",
      },
      "& .MuiInputBase-input.Mui-disabled": {
        cursor: "not-allowed",
      },
      "& .MuiOutlinedInput-root.Mui-disabled": {
        cursor: "not-allowed",
      },

      /* 🧮 Remove number input spin buttons */
      "& input[type=number]": {
        MozAppearance: "textfield",
      },
      "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
      {
        WebkitAppearance: "none",
        margin: 0,
      },

      /* 🎨 Input text + placeholder */
      "& .MuiInputBase-input": {
        fontSize: "0.9rem",
        padding: "10px 12px",
        color: (theme) => theme.palette.text.primary,
        "::placeholder": {
          fontSize: "0.8rem",
          color: (theme) => theme.palette.text.secondary,
          opacity: 0.8,
        },
      },

      /* 🧱 Outlined input styling */
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px",

        // "&:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
        //   borderColor: theme.palette.secondary.main,
        // },
        // "&:not(.Mui-error):hover .MuiOutlinedInput-notchedOutline": {
        //   borderColor: theme.palette.secondary.main,
        // },

        // Let MUI handle red border when error is true
        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: (theme) => theme.palette.error.main,
        },
      },

      "& .MuiOutlinedInput-notchedOutline": {
        borderRadius: "8px",
      },

      ...sx,
    }}
  />
);
}
