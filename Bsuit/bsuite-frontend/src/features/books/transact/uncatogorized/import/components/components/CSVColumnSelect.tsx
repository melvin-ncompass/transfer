import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
export default function ColumnDropDown({
  onChange,
  value,
  options = [],
}: {
  onChange: (value: string) => void;
  value: string;
  options?: string[];
}) {
  // Transform simple string array options into the { label, value } format required by SingleSelectElement
  const formattedOptions = options.map((opt) => ({ label: opt, value: opt }));

  return (
    <SingleSelectElement
      label="Column"
      value={value}
      onChange={onChange}
      options={formattedOptions}
      required={false}
      error={false}
      helperText=""
      sx={{ width: "100%" }}
    />
  );
}