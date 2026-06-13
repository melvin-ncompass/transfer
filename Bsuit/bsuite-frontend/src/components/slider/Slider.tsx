import Slider from "@mui/material/Slider";
import React from "react";

export interface SliderAtomProps {
  value: number | number[];
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: boolean | { value: number; label?: string }[];
  disabled?: boolean;
  ariaLabel?: string;
  sx?: object;
}

export function SliderAtom({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks = false,
  disabled = false,
  ariaLabel = "slider",
  sx = {},
}: SliderAtomProps) {
  const [internalValue, setInternalValue] = React.useState<number | number[]>(value);

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setInternalValue(newValue); // only update internal slider smoothly
  };

  const handleChangeCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    onChange(newValue as number); // update parent state once
  };

  return (
    <Slider
      value={internalValue}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      min={min}
      max={max}
      step={step}
      marks={marks}
      disabled={disabled}
      aria-label={ariaLabel}
      sx={sx}
    />
  );
}
