import {
  Box,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  useGetLeaveCalendarQuery,
  useGetLeaveQuery,
} from "./api/leave.api";
import { useGetEmployeeInfoQuery } from "../../api/people.api";
import { PrimaryButton } from "../../../../components/atom/button";
import {
  ApplyLeaveModal,
  type ApplyLeaveFormPayload,
} from "../attendance/components/ApplyLeaveModal";
import { useSnackbar } from "../../../../context/SnackbarContext";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { LeaveStatCard } from "./components/LeaveStatCard";

// =====================
// Helpers
// =====================

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

function getColor(stat: { leaveTypeColorCode?: string | null; colorCode?: string | null }, fallback: string) {
  return stat.leaveTypeColorCode || stat.colorCode || fallback;
}

// =====================
// Main Component
// =====================

function MeLeaveView({ id }: { id?: number }) {
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();

  const { data: info } = useGetEmployeeInfoQuery();
  const employeeId = id ?? info?.data?.employeeId ?? null;

  const [selectedRange, setSelectedRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [applyLeaveModalOpen, setApplyLeaveModalOpen] = useState(false);

  const { data: calendar } = useGetLeaveCalendarQuery(
    { id: employeeId! },
    { skip: employeeId == null }
  );

  const { data: leave } = useGetLeaveQuery(
    {
      id: employeeId!,
      startDate: selectedRange?.start,
      endDate: selectedRange?.end,
    },
    { skip: employeeId == null }
  );

  const leaveData = leave?.data;
  const chartsLoading = employeeId != null && !leaveData;

  const fallbackColor = theme.palette.primary.main;

  const yearRangeOptions =
    calendar?.data?.yearRanges?.map((r, index) => ({
      label: `${formatDate(r.start)} - ${formatDate(r.end)}`,
      value: index.toString(),
      start: r.start,
      end: r.end,
    })) ?? [];

  const handleRangeChange = (value: string | number) => {
    const selected = yearRangeOptions.find((r) => r.value === value);
    if (selected) {
      setSelectedRange({
        start: selected.start,
        end: selected.end,
      });
    }
  };

  const handleSubmit = (_payload: ApplyLeaveFormPayload) => {
    setApplyLeaveModalOpen(false);
    showSnackbar("Leave applied successfully", "success");
  };

  useEffect(() => {
    if (yearRangeOptions.length > 0 && !selectedRange) {
      const first = yearRangeOptions[0];
      setSelectedRange({
        start: first.start,
        end: first.end,
      });
    }
  }, [yearRangeOptions, selectedRange]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        flexWrap="wrap"
        gap={2}
      >
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 500,
            color: "text.primary",
          }}
        >
          My Leave Stats
        </Typography>

        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <SingleSelectElement
            label="Leave Cycle"
            value={
              selectedRange
                ? yearRangeOptions.find(
                    (r) =>
                      r.start === selectedRange.start &&
                      r.end === selectedRange.end
                  )?.value ?? ""
                : ""
            }
            onChange={handleRangeChange}
            options={yearRangeOptions}
          />

          {!id && (
            <PrimaryButton onClick={() => setApplyLeaveModalOpen(true)}>
              Apply Leave
            </PrimaryButton>
          )}
        </Stack>
      </Stack>

      {chartsLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : !leaveData ? (
        <Typography color="text.secondary">No data</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
              xl: "repeat(5, minmax(0, 1fr))",
            },
            gap: 2.5,
            width: "100%",
            justifyItems: "center",
          }}
        >
          {leaveData.leaveStats.map((stat) => {
            const baseColor = getColor(stat, fallbackColor);

            return (
              <LeaveStatCard
                key={stat.leaveTypeId}
                stat={stat}
                accentColor={baseColor}
              />
            );
          })}
        </Box>
      )}

      <ApplyLeaveModal
        open={applyLeaveModalOpen}
        onClose={() => setApplyLeaveModalOpen(false)}
        onSubmit={handleSubmit}
        initialLeaveDateIso={null}
        employeeId={employeeId!}
        showSnackbar={showSnackbar}
      />
    </Box>
  );
}

export default MeLeaveView;
