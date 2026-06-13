import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { Close } from "@mui/icons-material";

export default function SearchBar({ value, onChange, width, sx }: any) {
  return (
    <TextField
      size="small"
      placeholder="Search..."
      value={value}
      onChange={onChange}
      sx={{
        width: width ?? "100%",
        "& .MuiOutlinedInput-root": {
          borderRadius: "10px",
        },
        ...sx
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <Close
                fontSize="small"
                onClick={() => onChange({ target: { value: "" } })}
                style={{ cursor: "pointer" }}
              />
            </InputAdornment>
          ),
          sx: {
            // extra styling for input area if needed
          },
        },
      }}
    />
  );
}
