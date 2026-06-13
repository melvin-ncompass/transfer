import { Box, Card, InputAdornment } from "@mui/material";
import { TabsAtom, type TabItem } from "../../../components/tabs";
import ShiftsView from "./shifts/ShiftsView";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import type { ShiftDetailsRef } from "./shifts/components/ShiftDetails";
import HolidayPlanView from "./holiday-plan/HolidayPlanView";
import type { HolidayPlanRef } from "./holiday-plan/components/HolidayPlanDetails";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PrimaryIconButton } from "../../../components/atom/button";
import { AccessTime, Add, AlarmOff, ChecklistRtl, Search, Settings } from "@mui/icons-material";
import WeekOffsView from "./weekoffs/WeekOffsView";
import type { WeekOffRef } from "./weekoffs/components/WeekOffDetails";
import { TextFieldElement } from "../../../components/atom/text-field";
import SettingsHomeView from "./settings/SettingsHomeView";
import { LeavesView } from "./leaves/LeavesView";
import AttendanceTrackingView from "./attendance-tracking/AttendanceTrackingView";
import type { AttendanceTrackingRef } from "./attendance-tracking/components/AttendanceTrackingDetails";
import { useGetEmployeeInfoQuery } from "../api/people.api";

export const TimeView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = parseInt(searchParams.get("subtab") || "0", 10);
  const [activeTab, setActiveTab] = useState(initialSubTab);
  const [searchText, setSearchParamsText] = useState("");

  const { data: employeeInfo, isSuccess: employeeInfoLoaded } = useGetEmployeeInfoQuery();
  /** Reporting manager (`isManager`) may be true or false; tab requires both admin and employee. */
  const showAttendanceTracking =
    employeeInfoLoaded &&
    employeeInfo?.data?.isAdmin === true &&
    employeeInfo?.data?.isEmployee === true;

  // Tick counter used to re-render the toolbar when attendance selection changes.
  // filteredRecords or selectedIds change so the Total / Regularise reflect live state.
  // Sync state if URL changes externally
  useEffect(() => {
    const subtabParam = searchParams.get("subtab");
    if (subtabParam) {
      setActiveTab(parseInt(subtabParam, 10));
    }
  }, [searchParams]);

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
    setSearchParamsText("");
    setSearchParams((prev) => {
      prev.set("subtab", String(newValue));
      prev.delete("leaveView");
      return prev;
    });
  };

  const shiftsRef = useRef<ShiftDetailsRef>(null);
  const weekOffsRef = useRef<WeekOffRef>(null);
  const holidayPlanRef = useRef<HolidayPlanRef>(null);
  const attendanceRef = useRef<AttendanceTrackingRef>(null);
  const leavesRef = useRef<ShiftDetailsRef>(null);
  const templateRef = useRef<ShiftDetailsRef>(null);

  const tabs: TabItem[] = useMemo(() => {
    const base: TabItem[] = [
      {
        label: "Shifts",
        icon: <AccessTime />,
        content: <ShiftsView ref={shiftsRef} />,
        ref: shiftsRef,
      },
      {
        label: "Week Offs",
        icon: <AlarmOff />,
        content: <WeekOffsView ref={weekOffsRef} />,
        ref: weekOffsRef,
      },
      {
        label: "Holiday Plan",
        icon: <EventAvailableIcon />,
        content: <HolidayPlanView ref={holidayPlanRef} />,
        ref: holidayPlanRef,
      },
    ];
    const attendanceTab: TabItem = {
      label: "Attendance Tracking",
      icon: <ChecklistRtl />,
      content: <AttendanceTrackingView ref={attendanceRef} />,
      ref: attendanceRef,
    };
    const tail: TabItem[] = [
      {
        label: "Leaves",
        icon: <BeachAccessIcon />,
        content: <LeavesView ref={leavesRef} />,
        ref: leavesRef,
      },
      {
        label: "Settings",
        icon: <Settings />,
        content: <SettingsHomeView />,
        ref: templateRef,
      },
    ];
    return showAttendanceTracking ? [...base, attendanceTab, ...tail] : [...base, ...tail];
  }, [showAttendanceTracking]);

  const handleOpenModal = () => {
    tabs[activeTab]?.ref?.current?.openAddModal?.();
  };

  const handleSearch = () => {
    if (tabs[activeTab]?.ref?.current?.search) {
      tabs[activeTab]?.ref?.current?.search(searchText);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchText]);

  useEffect(() => {
    if (tabs.length === 0) return;
    if (activeTab >= tabs.length) {
      const next = tabs.length - 1;
      setActiveTab(next);
      setSearchParams((prev) => {
        prev.set("subtab", String(next));
        return prev;
      });
    }
  }, [tabs.length, activeTab, setSearchParams]);
  useEffect(() => {
    const currentTab = tabs[activeTab];

    if (currentTab?.label === "Shifts") {
      shiftsRef.current?.resetToSummary?.();
    }
    if (currentTab?.label === "Week Offs") {
      weekOffsRef.current?.resetToSummary?.();
    }
  }, [activeTab, tabs]);
  const attendanceTabIndex = useMemo(
    () => tabs.findIndex((t) => t.label === "Attendance Tracking"),
    [tabs],
  );

  // ── Toolbar action area ──────────────────────────────────────────────────
  // For all other tabs (except Settings): show the search field + add button.
  const isAttendanceTab = attendanceTabIndex >= 0 && activeTab === attendanceTabIndex;
  const isSettingsTab = activeTab === tabs.length - 1;

  const actionArea = isSettingsTab ? null : (
    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={2}>
      <TextFieldElement
        label=""
        width = {isAttendanceTab ? 250 : 'auto'}
        value={searchText}
        onChange={(e) => setSearchParamsText(e.target.value)}
        placeholder={`Search ${tabs[activeTab]?.label || "Shifts"}`}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      {!isAttendanceTab && (
        <PrimaryIconButton icon={<Add />} variant="outlined" onClick={handleOpenModal} />
      )}
    </Box>
  );

  return (
    <Card elevation={2} sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>
      <Box height="100%">
        <TabsAtom
          tabs={tabs}
          value={activeTab}
          onChange={handleTabChange}
          action={actionArea}
        />
      </Box>
    </Card>
  );
};