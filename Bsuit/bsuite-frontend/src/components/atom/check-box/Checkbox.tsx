import { Checkbox as MUICheckbox, FormControlLabel, useTheme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import type { CheckboxProps } from "../../../types/types";

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  color = "primary",
  indeterminate,
  onClick
  , required = false
}: CheckboxProps) {
  const theme = useTheme();
  return (
    <FormControlLabel
      sx={{
        margin: "0px",
        marginRight: "10px",
        "& .MuiFormControlLabel-asterisk": {
          display: "none",
        },
      }}
      control={
        <MUICheckbox
          checked={checked}
          onChange={onChange}
          required={required}
          indeterminate={indeterminate}
          color={color}
          disabled={disabled}
          onClick={onClick}
          icon={
            <span
              style={{
                border: disabled ? `2px solid ${theme.palette.action.disabled}` : "2px solid #ccc",
                borderRadius: 4,
                width: 18,
                height: 18,
                display: "inline-flex",
                backgroundColor: disabled ? theme.palette.action.hover : "transparent",
              }}
            />
          }
          checkedIcon={
            <span
              style={{
                backgroundColor: disabled 
                  ? theme.palette.primary.light 
                  : theme.palette.primary.main,
                borderRadius: 4,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <CheckIcon sx={{ fontSize: 14 }} />
            </span>
          }
          indeterminateIcon={
            <span
              style={{
                backgroundColor: disabled 
                  ? theme.palette.primary.light 
                  : theme.palette.primary.main,
                borderRadius: 4,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 2,
                  backgroundColor: "#fff",
                }}
              />
            </span>
          }
        />

      }
      label={label}
    />
  );
}
