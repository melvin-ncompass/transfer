import { Radio as MUIRadio, FormControlLabel } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import type { RadioButtonProps } from "../../../types/types";

const labelSxBySize = {
  small: { fontSize: "0.8125rem" },
  medium: { fontSize: "1rem" },
};

export function RadioButton({
  label,
  checked,
  onChange,
  value,
  name,
  color = "primary",
  disabled = false,
  size = "medium",
}: RadioButtonProps) {
  return (
    <FormControlLabel
      control={
        <MUIRadio
          size={size}
          checked={checked}
          onChange={onChange}
          value={value}
          name={name}
          color={color}
          disabled={disabled}
          icon={<RadioButtonUncheckedIcon />}
          checkedIcon={<RadioButtonCheckedIcon />}
        />
      }
      label={label}
      sx={{
        "& .MuiFormControlLabel-label": labelSxBySize[size],
      }}
    />
  );
}
