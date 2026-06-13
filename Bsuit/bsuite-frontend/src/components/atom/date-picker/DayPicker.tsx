import * as React from "react";
import { Stack, Typography } from "@mui/material";
import { Chip } from "../chips";

export type WeekDay =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";

const DAYS: { label: string; value: WeekDay }[] = [
  { label: "Mon", value: "Mon" },
  { label: "Tue", value: "Tue" },
  { label: "Wed", value: "Wed" },
  { label: "Thu", value: "Thu" },
  { label: "Fri", value: "Fri" },
  { label: "Sat", value: "Sat" },
  { label: "Sun", value: "Sun" },
];

interface WeekDaySelectorProps {
  value: WeekDay[];
  onChange: (days: WeekDay[]) => void;  
  label?: string;
}

export function DayPicker({
  value,
  onChange,
  label = "Working Days",
}: WeekDaySelectorProps) {
  const toggleDay = (day: WeekDay) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" fontWeight={600}>{label}</Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {DAYS.map((day) => {
          const selected = value.includes(day.value);

          return (
            <Chip
              key={day.value}
              label={day.label}
              size="medium"
              color={selected ? "primary" : "secondary"}
              onClick={() => toggleDay(day.value)}
              sx={{
                cursor: "pointer",
                opacity: selected ? 1 : 0.6,
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
