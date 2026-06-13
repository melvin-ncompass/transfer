import Box from "@mui/material/Box";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useEffect } from "react";

export default function ColumnDropDown({
  required,
  onChange,
  value,
  options = [],
}: {
  onChange: (value: string) => void;
  value: string;
  options?: string[];
  required: boolean;
}) {
  const formattedOptions = options.map((opt) => ({ label: opt, value: opt }));
  const isError = required && !value;
  useEffect(()=>{
  })
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <SingleSelectElement
        label="Column"
        value={value}
        onChange={onChange}
        options={formattedOptions}
        clearable={true}
        required={required}
        error={isError}
        helperText={isError ? "This field is required" : ""}
        sx={{ width: "100%" }}
      />
    </Box>
  );
}
