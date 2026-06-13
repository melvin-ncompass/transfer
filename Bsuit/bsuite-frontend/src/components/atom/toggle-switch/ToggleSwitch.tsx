import { Switch, FormControlLabel, Typography } from "@mui/material";
// import type { ToggleSwitchProps } from "../../../types/types";

// Update your interface to include the new size prop
interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning" | "default";
  disabled?: boolean;
  size?: "small" | "medium" | "large"; // New prop
  bold?: boolean;
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
  color = "primary",
  disabled = false,
  size = "medium", // Default to medium
  bold = false
}: ToggleSwitchProps) {
  
  // 1. Map custom size prop to MUI Switch 'size' prop (MUI only has small/medium)
  const muiSwitchSize = size === "large" ? "medium" : size;

  // 2. Define font sizes for the label based on the prop
  const labelFontSize = {
    small: "0.875rem", // 14px (Body 2)
    medium: "1rem",    // 16px (Body 1)
    large: "1.25rem",  // 20px (H6)
  }[size];

  // 3. Define scaling for the switch if 'large' is selected
  const switchScale = size === "large" ? "scale(1.3)" : "scale(1)";

  return (
    <FormControlLabel
      // Target the internal MUI label class to change font size
      sx={{
        "& .MuiFormControlLabel-label": {
          fontSize: labelFontSize,
        },
        // Optional: Adjust margin to align better if sizes change
        marginLeft: size === "small" ? 0 : undefined, 
      }}
      control={
        <Switch
          checked={checked}
          onChange={onChange}
          color={color}
          disabled={disabled}
          size={muiSwitchSize}
          sx={{
            transform: switchScale,
            // If scaling up, we might need a bit of margin so it doesn't overlap
            margin: size === "large" ? "0 4px" : undefined, 
          }}
        />
      }
      label={bold ? <Typography variant="subtitle2">{label}</Typography> : label}
    />
  );
}