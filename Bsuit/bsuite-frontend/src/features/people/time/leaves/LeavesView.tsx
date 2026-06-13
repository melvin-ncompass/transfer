import { Box, Stack } from "@mui/material";
import { forwardRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { ShiftDetailsRef } from "../shifts/components/ShiftDetails";
import { LeaveTypes } from "./components/LeaveTypes";
import { LeavePlan } from "./components/LeavePlan";
import { Chip } from "../../../../components/atom/chips";

type LeaveViewType = "TYPE" | "PLAN";

const leaveViewChips: { value: LeaveViewType; label: string }[] = [
  { value: "TYPE", label: "Types" },
  { value: "PLAN", label: "Plan" },
];

export const LeavesView = forwardRef<ShiftDetailsRef>((props, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get("leaveView") as LeaveViewType) || "TYPE";
  const [view, setView] = useState<LeaveViewType>(initialView);

  useEffect(() => {
    const viewParam = searchParams.get("leaveView") as LeaveViewType;
    if (viewParam && (viewParam === "TYPE" || viewParam === "PLAN")) {
      setView(viewParam);
    }
  }, [searchParams]);

  const handleViewChange = (newView: LeaveViewType) => {
    setView(newView);
    setSearchParams((prev) => {
      prev.set("leaveView", newView);
      return prev;
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ flexShrink: 0, pb: 1,  }}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          {leaveViewChips.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              size="small"
              onClick={() => handleViewChange(value)}
              color={view === value ? "primary" : "secondary"}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {view === "TYPE" && <LeaveTypes ref={ref} />}
        {view === "PLAN" && <LeavePlan ref={ref} />}
      </Box>
    </Box>
  );
});