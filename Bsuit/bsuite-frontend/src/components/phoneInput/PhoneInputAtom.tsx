import { Box } from "@mui/material";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputAtomProps {
  country?: string;
  value: string;
  onChange: (value: string, data: any) => void;
  label?: string;
  required?: boolean;
}

export const PhoneInputAtom = ({
  country,
  value,
  onChange,
  label = "Phone",
  required = false,
}: PhoneInputAtomProps) => {
  const displayLabel = required ? `${label} *` : label;

  return (
    <Box
      sx={{
        width: "100%",
        position: "relative",

        "& .phone-label": {
          position: "absolute",
          top: "-9px",
          left: "12px",
          zIndex: 2,
          pointerEvents: "none",
          fontSize: "12px",
          lineHeight: 1,
          px: "4px",
          backgroundColor: "background.paper",
          color: "text.secondary",
          whiteSpace: "nowrap",
        },

        "& .react-tel-input .special-label": {
          display: "none",
        },

        "& .react-tel-input .form-control": {
          height: 40,
          width: "100%",
          borderRadius: "7px",
          fontSize: "14px",
          paddingTop: 0,
          paddingBottom: 0,
          "&:focus": {
            borderColor: "primary.main",
            boxShadow: "none",
          },
        },

        "& .react-tel-input .flag-dropdown": {
          borderRadius: "7px 0 0 7px",
        },
        "& .react-tel-input .selected-flag": {
          padding: "0 0 0 8px",
          borderRadius: "7px 0 0 7px",
        },
        "& .react-tel-input .flag-dropdown.open": {
          backgroundColor: "#fff",
          borderRadius: "7px 0 0 7px",
        },
        "& .react-tel-input .flag-dropdown.open .selected-flag": {
          backgroundColor: "#fff",
          borderRadius: "7px 0 0 7px",
        },
      }}
    >
      <Box component="span" className="phone-label">
        {displayLabel}
      </Box>

      <PhoneInput
        value={value}
        country={country || "in"}
        onChange={onChange}
        specialLabel=""
        countryCodeEditable
        inputProps={{
          autoComplete: "tel",
          required,
        }}
      />
    </Box>
  );
};