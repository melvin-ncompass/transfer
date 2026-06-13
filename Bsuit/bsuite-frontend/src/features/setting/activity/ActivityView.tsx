import { Box, Typography, IconButton, Divider } from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import {
  FilterList,
  Refresh,
  ArrowBack, // Added for back button
  IosShare,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; // Added for navigation
import { type Dayjs } from "dayjs";
import ActivityTable from "./components/ActivityTable";
import MenuAtom, {
  type MenuAtomItem,
} from "../../../components/menuatom/MenuAtom";
import { PrimaryButton } from "../../../components/atom/button/PrimaryButton";
import { ModalElement } from "../../../components/dialogs/modal-element/ModalElement";
import { DatePickerElement } from "../../../components/atom/date-picker";
import { MultiSelectElement } from "../../../components/atom/select-field/MultiSelect";
import { Checkbox } from "../../../components/atom/check-box/Checkbox";
import { Chip } from "../../../components/atom/chips";
import { Snackbar } from "../../../components/atom/snackbar";
import { Stack } from "@mui/system";
import {
  useGetDisplayNamesQuery,
  useGetFeaturesModulesQuery,
  useExportActivityReportMutation,
} from "./api/activity.api";
import type { ActivityFilterParams } from "./types/activity.types";
import { PrimaryIconButton } from "../../../components/atom/button";

export default function FullActivityView() {
  const navigate = useNavigate(); // Navigation hook

  // -------------------- Permanent filter state (applied) --------------------
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [filters, setFilters] = useState<ActivityFilterParams>({
    page: 1,
    limit: 20,
  });

  // -------------------- Temporary modal state --------------------
  const [tempUsers, setTempUsers] = useState<string[]>([]);
  const [tempModules, setTempModules] = useState<string[]>([]);
  const [tempFeatures, setTempFeatures] = useState<string[]>([]);
  const [tempStartDate, setTempStartDate] = useState<Dayjs | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Dayjs | null>(null);
  const [tempShowStartDate, setTempShowStartDate] = useState(false);
  const [tempShowEndDate, setTempShowEndDate] = useState(false);

  // -------------------- Menus and modals --------------------
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", color: "info" });

  const open = Boolean(anchorEl);

  // -------------------- Active filters --------------------
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedUsers.length > 0) count++;
    if (selectedModules.length > 0) count++;
    if (selectedFeatures.length > 0) count++;
    if (showStartDate && startDate) count++;
    if (showEndDate && endDate) count++;
    return count;
  }, [
    selectedUsers,
    selectedModules,
    selectedFeatures,
    showStartDate,
    startDate,
    showEndDate,
    endDate,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (selectedUsers.length > 0) {
      chips.push({
        id: "users",
        label: `Users: ${selectedUsers.length}`,
        onDelete: () => {
          setSelectedUsers([]);
          setFilters((prev) => ({ ...prev, users: undefined }));
        },
      });
    }
    if (selectedModules.length > 0) {
      chips.push({
        id: "modules",
        label: `Modules: ${selectedModules.length}`,
        onDelete: () => {
          setSelectedModules([]);
          setFilters((prev) => ({ ...prev, modules: undefined }));
        },
      });
    }
    if (selectedFeatures.length > 0) {
      chips.push({
        id: "features",
        label: `Features: ${selectedFeatures.length}`,
        onDelete: () => {
          setSelectedFeatures([]);
          setFilters((prev) => ({ ...prev, features: undefined }));
        },
      });
    }
    if (showStartDate && startDate) {
      chips.push({
        id: "startDate",
        label: `Start: ${tempStartDate?.format("YYYY-MM-DD hh:mm A")}`,
        onDelete: () => {
          setStartDate(null);
          setShowStartDate(false);
          setEndDate(null);
          setShowEndDate(false);
          setFilters((prev) => {
            const { startTime, endTime, ...rest } = prev;
            return rest;
          });
        },
      });
    }
    if (showEndDate && endDate) {
      chips.push({
        id: "endDate",
        label: `End: ${tempEndDate?.format("YYYY-MM-DD hh:mm A")}`,
        onDelete: () => {
          setEndDate(null);
          setShowEndDate(false);
          setStartDate(null);
          setShowStartDate(false);
          setFilters((prev) => {
            const { startTime, endTime, ...rest } = prev;
            return rest;
          });
        },
      });
    }

    return chips;
  }, [
    selectedUsers,
    selectedModules,
    selectedFeatures,
    showStartDate,
    startDate,
    showEndDate,
    endDate,
  ]);

  // -------------------- Export mutation --------------------
  const [exportActivityReport] = useExportActivityReportMutation();

  // -------------------- Export menu --------------------
  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);
  const handleExportClose = () => setAnchorEl(null);

  const handleExportPDF = async () => {
    try {
      const { page, limit, ...filterParams } = filters;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = { ...filterParams, type: "pdf" as const, timezone };
      await exportActivityReport(payload).unwrap();
      setSnackbar({
        open: true,
        message: "PDF exported successfully",
        color: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Failed to export PDF: ${error?.message || "Unknown error"}`,
        color: "error",
      });
    }
    handleExportClose();
  };

  const handleExportXLSX = async () => {
    try {
      const { page, limit, ...filterParams } = filters;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = { ...filterParams, type: "excel" as const, timezone };
      await exportActivityReport(payload).unwrap();
      setSnackbar({
        open: true,
        message: "Excel exported successfully",
        color: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Failed to export Excel: ${error?.message || "Unknown error"}`,
        color: "error",
      });
    }
    handleExportClose();
  };

  const exportItems: MenuAtomItem[] = [
    { label: "Export as PDF", onClick: handleExportPDF },
    { label: "Export as XLSX", onClick: handleExportXLSX },
  ];

  // -------------------- Filter logic --------------------
  const handleFilter = () => {
    setTempUsers(selectedUsers);
    setTempModules(selectedModules);
    setTempFeatures(selectedFeatures);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempShowStartDate(showStartDate);
    setTempShowEndDate(showEndDate);
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setTempUsers(selectedUsers);
    setTempModules(selectedModules);
    setTempFeatures(selectedFeatures);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempShowStartDate(showStartDate);
    setTempShowEndDate(showEndDate);
    setFilterOpen(false);
  };

  const handleApplyFilter = () => {
    setSelectedUsers(tempUsers);
    setSelectedModules(tempModules);
    setSelectedFeatures(tempFeatures);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowStartDate(tempShowStartDate);
    setShowEndDate(tempShowEndDate);

    const cleanUsers = tempUsers
      .filter((u) => u && u.trim() !== "")
      .map((u) => {
        const match = u.match(/\(([^)]*)\)/);
        return match && match[1] ? match[1].trim() : u.trim();
      });
    const cleanModules = tempModules.filter((m) => m && m.trim() !== "");
    const cleanFeatures = tempFeatures.filter((f) => f && f.trim() !== "");

    const newFilters: ActivityFilterParams = { page: 1, limit: 20 };

    if (cleanUsers.length > 0) newFilters.users = cleanUsers;
    if (cleanModules.length > 0) newFilters.modules = cleanModules;
    if (cleanFeatures.length > 0) newFilters.features = cleanFeatures;

    if (tempShowStartDate && tempStartDate) {
      newFilters.startTime = tempStartDate.format("YYYY-MM-DDTHH:mm:ss") ;
    }

    if (tempShowEndDate && tempEndDate) {
      newFilters.endTime = tempEndDate.format("YYYY-MM-DDTHH:mm:ss");
    }

    setFilters(newFilters);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedUsers([]);
    setSelectedModules([]);
    setSelectedFeatures([]);
    setStartDate(null);
    setEndDate(null);
    setShowStartDate(false);
    setShowEndDate(false);
    setFilters({ page: 1, limit: 20 });
  };

  const handleRefresh = () => {
    setSelectedUsers([]);
    setSelectedModules([]);
    setSelectedFeatures([]);
    setStartDate(null);
    setEndDate(null);
    setShowStartDate(false);
    setShowEndDate(false);
    setFilters((prev) => ({
      page: 1,
      limit: 20,
      _refresh: (prev._refresh ?? 0) + 1,
    }));

    if ((window as any).__activityTableRefetch) {
      (window as any).__activityTableRefetch();
    }
  };

  // -------------------- Fetch data --------------------
  const { data: displayNamesData } = useGetDisplayNamesQuery();
  const { data: featuresModulesData } = useGetFeaturesModulesQuery();

  const userOptions = useMemo(() => {
    return (displayNamesData?.data || []).map((user) => ({
      value: user,
      label: user,
    }));
  }, [displayNamesData]);

  const moduleOptions = useMemo(() => {
    return (featuresModulesData?.data?.modules || []).map((module) => ({
      value: module,
      label: module,
    }));
  }, [featuresModulesData]);

  const featureOptions = useMemo(() => {
    return (featuresModulesData?.data?.features || []).map((feature) => ({
      value: feature,
      label: feature,
    }));
  }, [featuresModulesData]);

  const isApplyDisabled = (() => {
    // Start checked but no date
    if (tempShowStartDate && !tempStartDate) return true;

    // End checked but no date
    if (tempShowEndDate && !tempEndDate) return true;

    // Both checked but invalid range
    if (
      tempShowStartDate &&
      tempShowEndDate &&
      tempStartDate &&
      tempEndDate &&
      tempStartDate.isAfter(tempEndDate)
    ) {
      return true;
    }

    return false;
  })();

  // -------------------- Render --------------------
  return (
    <Box >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 1.5,
          mb: 2,
        }}
      >
        {/* Top Row - Navigation and Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            mb: activeFilterChips.length > 0 ? 2 : 0,
            gap: 1.5,
          }}
        >
          {/* Left: Back + Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            
            <IconButton
              onClick={() => navigate("/company/settings")}
              sx={{
                p: 1,
                borderRadius: 1.5,
                "&:hover": { backgroundColor: "action.hover" },
              }}
            >
              <ArrowBack fontSize="small" sx={{ color: "text.primary" }} />
            </IconButton>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                fontSize: "1.5rem",
              }}
            >
              User Activity
            </Typography>
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PrimaryIconButton
              onClick={handleRefresh}
              icon={<Refresh fontSize="small" />}
              title="Reset"
            />

            <MenuAtom
              items={exportItems}
              anchorEl={anchorEl}
              open={open}
              onClose={handleExportClose}
              onCloseAll={handleExportClose}
            />

            <PrimaryIconButton
              onClick={handleExportClick}
              icon={<IosShare />}
              title="Export"
            />

            <PrimaryIconButton
              icon={<FilterList />}
              title="More Filters"
              onClick={handleFilter}
            />
          </Box>
        </Box>

        {/* Applied Filters Row */}
        {activeFilterChips.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mt: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              Applied filters:
            </Typography>

            {activeFilterChips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                onDelete={chip.onDelete}
                color="primary"
                size="small"
                sx={{
                  backgroundColor: "primary.lighter",
                  color: "primary.dark",
                  fontWeight: 500,
                }}
              />
            ))}

            <Typography
              component="button"
              onClick={handleClearFilters}
              sx={{
                border: "none",
                background: "none",
                color: "primary.main",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
                ml: 0.5,
              }}
            >
              Clear All
            </Typography>
          </Box>
        )}
      </Box>

      {/* Filter Modal */}
      <ModalElement
        open={filterOpen}
        title="Filter Activity"
        onClose={handleFilterClose}
        sx={{
          "& .MuiDialog-paper": {
            width: { xs: "90vw", sm: "auto" },
            maxWidth: { xs: "90vw", sm: 500 },
            margin: { xs: 1, sm: 2 },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            minWidth: { xs: 0, sm: 450 },
            py: 1,
            px: { xs: 1, sm: 0 },
          }}
        >
          {/* Date Range */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
            >
              Date Range
            </Typography>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: { xs: "100%", sm: 100 } }}>
                  <Checkbox
                    label="Start Date"
                    checked={tempShowStartDate}
                    onChange={(e) => setTempShowStartDate(e.target.checked)}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  {tempShowStartDate && (
                    <DatePickerElement
                      label="Start Date"
                      value={tempStartDate}
                      onChange={setTempStartDate}
                      width="100%"
                      withTime={true}
                    />
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: 3,
                }}
              >
                <Box sx={{ minWidth: { xs: "100%", sm: 100 } }}>
                  <Checkbox
                    label="End Date"
                    checked={tempShowEndDate}
                    onChange={(e) => setTempShowEndDate(e.target.checked)}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  {tempShowEndDate && (
                    <DatePickerElement
                      label="End Date"
                      value={tempEndDate}
                      onChange={setTempEndDate}
                      width="100%"
                      withTime={true}
                    />
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Filters */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
            >
              Filters
            </Typography>

            <Stack spacing={2.5}>
              <MultiSelectElement
                label="Users"
                options={userOptions}
                value={tempUsers}
                onChange={setTempUsers}
                width="100%"
              />
              <MultiSelectElement
                label="Modules"
                options={moduleOptions}
                value={tempModules}
                onChange={setTempModules}
                width="100%"
              />
              <MultiSelectElement
                label="Features"
                options={featureOptions}
                value={tempFeatures}
                onChange={setTempFeatures}
                width="100%"
              />
            </Stack>
          </Box>

          <Divider />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              pt: 1,
            }}
          >
            <PrimaryButton
              onClick={handleApplyFilter}
              disabled={isApplyDisabled}
            >
              Apply Filters
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>

      {/* Activity Table */}
      <ActivityTable height="64.9vh" type="full" filters={filters} />

      {/* Snackbar for export feedback */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          autoClose={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </Box>
  );
}
