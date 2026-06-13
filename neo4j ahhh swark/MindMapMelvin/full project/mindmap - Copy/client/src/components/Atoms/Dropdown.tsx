import { MenuItem, Select, type SelectProps } from "@mui/material";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps extends Omit<SelectProps, "onChange"> {
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  ...props
}) => {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value as string)}
      fullWidth
      displayEmpty
      disabled={disabled}
      sx={{
        bgcolor: disabled ? "#444" : "#f5f5f5",  
        color: disabled ? "#aaa" : "#000",
        borderRadius: 2,
        maxHeight: 40,
        "& .MuiSvgIcon-root": { color: disabled ? "#aaa" : "#000" },
        ...props.sx,
      }}
      {...props}
    >
      <MenuItem value="">
        <em>{placeholder}</em>
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value} sx={{ color: "#000" }}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default CustomDropdown;