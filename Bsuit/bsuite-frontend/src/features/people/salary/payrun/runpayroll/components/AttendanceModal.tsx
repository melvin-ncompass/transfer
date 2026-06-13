import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Chip,
} from "@mui/material";
import dayjs from "dayjs";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { useGetAttendanceEntriesQuery } from "../api/payrun.api";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  cycleStart: string;
  cycleEnd: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AttendanceModal({
  open,
  onClose,
  employeeId,
  employeeName,
  cycleStart,
  cycleEnd,
}: AttendanceModalProps) {
  const { data, isLoading, isError } = useGetAttendanceEntriesQuery(employeeId, {
    skip: !open,
  });

  const presentSet = new Set(data?.dates ?? []);

  // Build all days in the cycle period
  const start = dayjs(cycleStart);
  const end = dayjs(cycleEnd);
  const totalDays = end.diff(start, "day") + 1;

  const allDays = Array.from({ length: totalDays }, (_, i) =>
    start.add(i, "day")
  );

  // Padding blanks before first day
  const firstDayOfWeek = start.day(); // 0=Sun
  const blanks = Array.from({ length: firstDayOfWeek });

  // Counts
  const weekendDays = allDays.filter((d) => d.day() === 0 || d.day() === 6);
  const workingDays = allDays.filter((d) => d.day() !== 0 && d.day() !== 6);
  const presentCount = workingDays.filter((d) =>
    presentSet.has(d.format("YYYY-MM-DD"))
  ).length;
  const absentCount = workingDays.length - presentCount;

  const monthLabel = start.format("MMMM YYYY");

  const getCell = (day: dayjs.Dayjs) => {
    const dateStr = day.format("YYYY-MM-DD");
    const isWeekend = day.day() === 0 || day.day() === 6;
    const isPresent = presentSet.has(dateStr);

    let bg = "transparent";
    let color = "text.primary";
    let border = "1px solid transparent";

    if (isWeekend) {
      bg = "#f5f5f5";
      color = "text.disabled";
    } else if (isPresent) {
      bg = "#e8f5e9";
      color = "#2e7d32";
      border = "1px solid #a5d6a7";
    } else {
      bg = "#fff3e0";
      color = "#e65100";
      border = "1px solid #ffcc80";
    }

    return { bg, color, border };
  };

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title={`Attendance — ${employeeName}`}
      maxWidth="sm"
    >
      <Box>
        {/* Month label */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          align="center"
          mb={1.5}
          color="text.secondary"
        >
          {monthLabel}
        </Typography>

        {isLoading ? (
          <Box
            display="grid"
            gridTemplateColumns="repeat(7, 1fr)"
            gap={0.5}
          >
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={36} />
            ))}
          </Box>
        ) : isError ? (
          <Alert severity="error">Failed to load attendance data.</Alert>
        ) : (
          <>
            {/* Day headers */}
            <Box
              display="grid"
              sx={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}
            >
              {DAY_LABELS.map((d) => (
                <Typography
                  key={d}
                  variant="caption"
                  fontWeight={700}
                  align="center"
                  color="text.secondary"
                  sx={{ py: 0.5 }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            {/* Calendar grid */}
            <Box
              display="grid"
              sx={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}
            >
              {/* Leading blanks */}
              {blanks.map((_, i) => (
                <Box key={`blank-${i}`} />
              ))}

              {/* Day cells */}
              {allDays.map((day) => {
                const { bg, color, border } = getCell(day);
                return (
                  <Box
                    key={day.format("YYYY-MM-DD")}
                    sx={{
                      bgcolor: bg,
                      border,
                      borderRadius: 1,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ color }}
                    >
                      {day.date()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Legend */}
            <Box
              display="flex"
              gap={1.5}
              mt={2}
              flexWrap="wrap"
              justifyContent="center"
            >
              <Chip
                size="small"
                label={`Present: ${presentCount}`}
                sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
              />
              <Chip
                size="small"
                label={`Absent: ${absentCount}`}
                sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
              />
              <Chip
                size="small"
                label={`Weekend: ${weekendDays.length}`}
                sx={{ bgcolor: "#f5f5f5", color: "#757575", fontWeight: 600 }}
              />
              <Chip
                size="small"
                label={`Working Days: ${workingDays.length}`}
                sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 600 }}
              />
            </Box>
          </>
        )}
      </Box>
    </ModalElement>
  );
}
