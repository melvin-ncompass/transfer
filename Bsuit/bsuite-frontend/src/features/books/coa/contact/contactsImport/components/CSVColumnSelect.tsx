import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";

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

  const formattedOptions = options.map((opt) => ({
    label: opt,
    value: opt,
  }));

  const isError = required && !value;

  return (
    <SingleSelectElement
      label="Column"
      value={value}
      onChange={onChange}
      options={formattedOptions}
      required={required}
      error={isError}
      helperText={isError ? "This field is required" : ""}
      sx={{ width: "100%" }}
      clearable = {true}
    />
  );
}