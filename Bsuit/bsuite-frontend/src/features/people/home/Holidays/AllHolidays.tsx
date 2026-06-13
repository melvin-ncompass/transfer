import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Tabs,
  Tab,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useGetHolidaysForHomeQuery } from "./api/homeHoliday.api";
import { useGetEmployeeInfoQuery } from "../../api/people.api";
import { Tooltip } from "../../../../components/atom/tooltip";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";

// Types
interface Holiday {
  id: number;
  date: string;
  description: string;
}

// Helpers
const groupByMonth = (holidays: Holiday[]) => {
  return holidays.reduce((acc: Record<string, Holiday[]>, holiday) => {
    const month = dayjs(holiday.date).format("MMMM YYYY");
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});
};

const HolidayView = () => {
  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const employeeId = employeeInfo?.data?.employeeId; // replace with real

  const { data: holidays = [], isLoading } = useGetHolidaysForHomeQuery(
    employeeId?.toString()!,
  );

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "compact">("card");
  const [selectedYear, setSelectedYear] = useState("");

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    holidays.forEach((h) => {
      const y = dayjs(h.date).year();
      if (Number.isFinite(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [holidays]);

  const yearOptions = useMemo(
    () => availableYears.map((y) => ({ label: String(y), value: String(y) })),
    [availableYears],
  );

  useEffect(() => {
    if (availableYears.length === 0) {
      setSelectedYear("");
      return;
    }
    setSelectedYear((prev) => {
      const allowed = new Set(availableYears.map(String));
      if (prev && allowed.has(prev)) return prev;
      const current = String(dayjs().year());
      if (allowed.has(current)) return current;
      return String(availableYears[0]);
    });
  }, [availableYears]);

  const yearFilteredHolidays = useMemo(() => {
    if (!selectedYear) return [];
    const year = Number(selectedYear);
    return holidays.filter((h) => dayjs(h.date).year() === year);
  }, [holidays, selectedYear]);

  const processed = useMemo(() => {
    let filtered = yearFilteredHolidays;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((h) =>
        h.description.toLowerCase().includes(q),
      );
    }

    const startOfToday = dayjs().startOf("day");
    const upcoming = filtered.filter(
      (h) => !dayjs(h.date).startOf("day").isBefore(startOfToday),
    );
    const past = filtered.filter((h) =>
      dayjs(h.date).startOf("day").isBefore(startOfToday),
    );

    return tab === 0 ? upcoming : past;
  }, [yearFilteredHolidays, tab, search]);

  const sorted = useMemo(() => {
    return [...processed].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [processed]);

  const grouped = useMemo(() => groupByMonth(sorted), [sorted]);

  const nextHoliday = useMemo(() => {
    const startOfToday = dayjs().startOf("day");
    return yearFilteredHolidays.find(
      (h) => !dayjs(h.date).startOf("day").isBefore(startOfToday),
    );
  }, [yearFilteredHolidays]);

  const today = dayjs();

  if (isLoading) return <Typography p={3}>Loading...</Typography>;

  return (
    <Box p={1}>
      {/* Next Holiday - Sticky */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "#fff",
          mb: 2,
          pb: 2,
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            p: 2,
            border: "2px solid #1976d2",
            background: "linear-gradient(135deg, #e3f2fd 0%, #fff 100%)",
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.15)",
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="primary" fontWeight={600}>
              Next Holiday
            </Typography>
            {nextHoliday ? (
              <>
                <Typography variant="h6" fontWeight={700}>
                  {nextHoliday.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dayjs(nextHoliday.date).format("dddd, MMM DD, YYYY")} •{" "}
                  {dayjs(nextHoliday.date).diff(today, "day")} days away
                </Typography>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                No upcoming holiday
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1.5}
        rowGap={1.5}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto" }, minWidth: 0 }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ minHeight: 40, flexShrink: 0 }}
          >
            <Tab label="Upcoming" />
            <Tab label="Past" />
          </Tabs>
          <SingleSelectElement
            label="Year"
            options={yearOptions}
            value={selectedYear}
            onChange={setSelectedYear}
            width={112}
            menuWidth={120}
            sx={{ flexShrink: 0, "& .MuiFormControl-root": { mb: 0 } }}
          />
        </Box>

        <Box
          display="flex"
          gap={1.5}
          alignItems="center"
          flexWrap="wrap"
          sx={{
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
            justifyContent: { xs: "flex-start", sm: "flex-end" },
          }}
        >
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="compact">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            size="small"
            placeholder="Search holidays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: "100%", sm: 200 }, minWidth: 160, flexShrink: 0 }}
          />
        </Box>
      </Box>

      {/* List */}
      {Object.entries(grouped).map(([month, items]) => (
        <Box key={month} mb={3}>
          {/* Sticky Month Header */}
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              position: "sticky",
              top: nextHoliday ? 120 : 0,
              background: "#fff",
              zIndex: 5,
              py: 1.5,
              borderBottom: "2px solid #f5f5f5",
            }}
          >
            {month}
          </Typography>

          {viewMode === "card" ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {items.map((holiday) => {
                const isToday = dayjs(holiday.date).isSame(today, "day");
                const dateObj = dayjs(holiday.date);

                return (
                  <Grid size={{ xs: 4, sm: 3, md: 2 }} key={holiday.id}>
                    <Box
                      sx={{
                        aspectRatio: "3/4",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: isToday ? "2px solid #1976d2" : "1px solid #e0e0e0",
                        boxShadow: isToday
                          ? "0 4px 12px rgba(25, 118, 210, 0.2)"
                          : "0 2px 8px rgba(0,0,0,0.08)",
                        transition: "all 0.3s ease",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#fff",
                        "&:hover": {
                          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      {/* Calendar Header */}
                      <Box
                        sx={(theme) => ({
                          background: isToday
                            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                            : `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                          height: "20%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: theme.palette.common.white,
                          position: "relative",
                        })}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          sx={{ letterSpacing: 1 }}
                        >
                          {dateObj.format("MMMM")}
                        </Typography>
                      </Box>

                      {/* Date Number */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Typography
                          variant="h2"
                          fontWeight={700}
                          sx={{
                            color: isToday ? "#1976d2" : "#424242",
                            fontSize: { xs: "3rem", sm: "4rem" },
                          }}
                        >
                          {dateObj.format("D")}
                        </Typography>
                      </Box>

                      {/* Holiday Name */}
                      <Box
                        sx={{
                          p: 1,
                          backgroundColor: "#fff",
                          borderTop: "1px solid #e0e0e0",
                          minHeight: "30%",
                          maxHeight: "32%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.25, fontSize: "0.65rem", lineHeight: 1.2 }}
                        >
                          {dateObj.format("dddd")}
                        </Typography>
                        <Tooltip title={holiday.description} placement="top" maxWidth={280}>
                          <Typography
                            component="span"
                            variant="caption"
                            fontWeight={600}
                            sx={{
                              fontSize: "0.7rem",
                              lineHeight: 1.25,
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {holiday.description}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <List sx={{ mt: 1 }}>
              {items.map((holiday) => {
                const isToday = dayjs(holiday.date).isSame(today, "day");
                const dateObj = dayjs(holiday.date);

                return (
                  <ListItem
                    key={holiday.id}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: isToday ? "2px solid #1976d2" : "1px solid #e0e0e0",
                      backgroundColor: isToday ? "#e3f2fd" : "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        backgroundColor: isToday ? "#e3f2fd" : "#fafafa",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 80,
                        textAlign: "center",
                        mr: 2,
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} color={isToday ? "primary" : "text.primary"}>
                        {dateObj.format("D")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dateObj.format("MMM")}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Tooltip title={holiday.description} placement="top" maxWidth={320}>
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {holiday.description}
                            </Typography>
                          </Tooltip>
                          {isToday && (
                            <Chip label="Today" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {dateObj.format("dddd, MMM DD, YYYY")}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      ))}

      {/* Empty State */}
      {sorted.length === 0 && (
        <Box textAlign="center" mt={5}>
          <Typography color="text.secondary">
            {!selectedYear
              ? "Select a year"
              : tab === 0
                ? "No upcoming holidays for this year"
                : "No past holidays for this year"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default HolidayView;
