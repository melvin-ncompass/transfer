import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
import { TabsAtom } from "../../../../../components/tabs";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { TimesheetTabPanel } from "./TimesheetTabPanel";
import { getDefaultMonthRange } from "../utils/timesheet.utils";
import type { TimesheetStatusTab } from "../types/timesheet.types";

const STATUS_TABS: { label: string; value: TimesheetStatusTab }[] = [
  { label: "Pending on Employee", value: "pending_on_employee" },
  { label: "Pending Verification", value: "pending_verification" },
  { label: "Verified", value: "verified" },
];

export const TimesheetsSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = Number(searchParams.get("timesheetTab") ?? "0");
  const defaultRange = useMemo(() => getDefaultMonthRange(), []);

  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs(defaultRange.start),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(defaultRange.end));

  const handleTabChange = (newValue: number) => {
    setSearchParams((prev) => {
      prev.set("timesheetTab", String(newValue));
      return prev;
    });
  };

  const tabs = STATUS_TABS.map((tab) => ({
    label: tab.label,
    content: (
      <TimesheetTabPanel
        statusTab={tab.value}
        startDate={startDate}
        endDate={endDate}
      />
    ),
  }));

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TabsAtom
        tabs={tabs}
        value={activeTab}
        onChange={handleTabChange}
        sx={{ height: "100%" }}
        contentSx={{
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          overflowY: "hidden",
          pt: 1,
          display: "flex",
          flexDirection: "column",
        }}
        action={
          <DateRangePicker
            label=""
            startValue={startDate}
            endValue={endDate}
            onChange={([start, end]) => {
              setStartDate(start);
              setEndDate(end);
            }}
            width={280}
            displayFormat="full"
          />
        }
      />
    </Box>
  );
};
