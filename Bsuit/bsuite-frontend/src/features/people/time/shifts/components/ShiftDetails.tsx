import { Box, IconButton, Typography, Stack, alpha, useTheme } from "@mui/material";
import {
  MoreVert,
  AccessTime,
  CalendarMonth,
  Timer,
  InfoOutlined,
  LayersOutlined,
  EventNote,
} from "@mui/icons-material";
import ShiftsModal from "./ShiftsModal";
import ShiftVersionModal from "./ShiftVersionModal";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Chip } from "../../../../../components/atom/chips";
import type { MenuAtomItem } from "../../../../../components/menuatom/MenuAtom";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import {
  useDeleteShiftMutation,
  useGetShiftsQuery,
  useUpdateShiftMutation,
  type IShift,
  type IShiftVersion,
} from "../api/shifts.api";
import TrackVersions from "./TrackVersions";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { ShiftEmployeeList } from "./ShiftEmployeeList";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import {
  formatDateShort,
  formatShiftTimeRange12h,
} from "../../../../../utils/numberFormatter";
import { getActiveShiftVersion, isFlexibleShiftType } from "../shiftForm.utils";
import { InfoGridCard } from "./InfoGridCard";
import { Tooltip } from "../../../../../components/atom/tooltip";

export interface ShiftDetailsRef {
  openAddModal: () => void;
  closeModal: () => void;
  selectShift: (id: string) => void;
  search: (query: string) => void;
  resetToSummary: () => void;

}

type ViewKey = "Summary" | "Employees" | "Track Versions";

export const ShiftDetails = forwardRef<ShiftDetailsRef>((_, ref) => {
  const { data: shifts = [], isLoading, error } = useGetShiftsQuery();
  const [updateShift] = useUpdateShiftMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<IShiftVersion | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("Summary");
  const [lastCreatedShiftId, setLastCreatedShiftId] = useState<number | null>(null);

  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    color: "info",
  });

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));
  const showSnackbar = (
    message: string,
    color: "success" | "error" = "success",
  ) => setSnackbar({ open: true, message, color });

  useImperativeHandle(ref, () => ({
    openAddModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    selectShift: (id: string) => setActiveShiftId(Number(id)),
    search: (query: string) => setSearchQuery(query),
    resetToSummary: () => setActiveView("Summary"),
  }));

  const activeShift = shifts.find((s) => s.id === activeShiftId);

  // Auto-select first shift or newly created shift
  useEffect(() => {
    if (shifts.length === 0) return;

    if (lastCreatedShiftId !== null) {
      setActiveShiftId(lastCreatedShiftId);
      setLastCreatedShiftId(null);
    } else if (activeShiftId === null) {
      setActiveShiftId(shifts[0].id);
    }
  }, [shifts, activeShiftId, lastCreatedShiftId]);

  const filteredShifts = shifts.filter((shift) =>
    shift.shiftName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (activeShiftId === null) return;

    const el = itemRefs.current[activeShiftId];
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [activeShiftId, filteredShifts]);

  const handleSetDefault = async (id: number) => {
    try {
      await updateShift({ id, data: { isDefault: true } }).unwrap();
      showSnackbar("Shift set as default successfully");
    } catch (error: any) {
      const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to set default shift.";
      showSnackbar(errorMsg, "error");
    }
  };

  const viewChips: { label: ViewKey }[] = [
    { label: "Summary" },
    { label: "Employees" },
    { label: "Track Versions" },
  ];

  if (isLoading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          height: "calc(100vh - 400px)",
        }}
      >
        <CustomCircularProgress />
      </Box>
    );
  if (error)
    return <Typography color="error">Failed to load shifts</Typography>;

  return (
    <Box sx={{ width: "100%", mx: "auto", height: "100%" }}>
      {filteredShifts.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 400px)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No shift found
          </Typography>
        </Box>
      ) : (
        <Box display="flex" width="100%" gap={1} height="100%" pt={1}>
          {/* Left panel — shift list */}
          <Box sx={{ width: "30%" }}>
            <Stack gap={0.5} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
              {filteredShifts.map((shift) => (
                <div key={shift.id} ref={(el) => { itemRefs.current[shift.id] = el; }}>
                  <ShiftListItem
                    shift={shift}
                    selected={shift.id === activeShiftId}
                    onClick={() => { setActiveShiftId(shift.id); setActiveView("Summary"); }}
                    setDefaultShift={handleSetDefault}
                    showSnackbar={showSnackbar}
                    onDeleteShift={(deletedShiftId) => {
                      if (activeShiftId === deletedShiftId) {
                        const nextShift = filteredShifts.find((s) => s.id !== deletedShiftId);
                        setActiveShiftId(nextShift ? nextShift.id : null);
                      }
                    }}
                  />
                </div>
              ))}
            </Stack>
          </Box>

          {/* Right panel */}
          <Box sx={{ width: "70%", display: "flex", flexDirection: "column", gap: 2, pl: 2 }}>
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
              {viewChips.map(({ label }) => (
                <Chip
                  key={label}
                  label={label}
                  size="small"
                  onClick={() => setActiveView(label)}
                  color={activeView === label ? "primary" : "secondary"}
                />
              ))}
            </Stack>
            {/* Content */}
            {activeView === "Summary" && <ShiftSummaryCard shift={activeShift} />}

            {activeView === "Employees" && (
              activeShift
                ? <ShiftEmployeeList shiftId={activeShift.id} />
                : <Typography color="text.secondary">No shift selected</Typography>
            )}

            {activeView === "Track Versions" && (
              activeShift
                ? (
                  <TrackVersions
                    shift={activeShift}
                    onEdit={(version) => { setSelectedVersion(version); setVersionModalOpen(true); }}
                  />
                )
                : <Typography color="text.secondary">No shift selected</Typography>
            )}
          </Box>
        </Box>
      )}

      {activeShift && (
        <ShiftVersionModal
          open={versionModalOpen}
          onClose={() => { setVersionModalOpen(false); setSelectedVersion(null); }}
          shiftId={activeShift.id}
          initialVersion={selectedVersion}
          onSuccess={(message) => showSnackbar(message, "success")}
          onError={(message) => showSnackbar(message, "error")}
        />
      )}
      <ShiftsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Shift"
        onError={(msg) => showSnackbar(msg, "error")}
        onSuccess={(created) => { setLastCreatedShiftId(created?.id || null); showSnackbar("Shift created successfully", "success"); }}
      />

      {snackbar.open && (
        <Snackbar message={snackbar.message} color={snackbar.color} onClose={handleCloseSnackbar} autoClose={6000} />
      )}
    </Box>
  );
});

function ShiftListItem({
  shift, selected, onClick, setDefaultShift, showSnackbar, onDeleteShift,
}: {
  shift: IShift;
  selected: boolean;
  onClick: () => void;
  setDefaultShift: (id: number) => void;
  showSnackbar: (message: string, color?: "success" | "error") => void;
  onDeleteShift: (shiftId: number) => void;
}) {
  const theme = useTheme();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [name, setName] = useState(shift.shiftName);

  const [updateShift] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  useEffect(() => {
    setName(shift.shiftName);
  }, [shift.shiftName]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };
  const handleMenuClose = () => setMenuAnchor(null);

  const handleRenameSave = async () => {
    if (!name.trim()) return;
    try {
      await updateShift({ id: shift.id, data: { shiftName: name.trim() } }).unwrap();
      showSnackbar("Shift renamed successfully");
    } catch (err: any) {
      showSnackbar(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to rename shift.", "error");
      handleRenameCancel();
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => { setName(shift.shiftName); setIsRenaming(false); };

  const confirmDeleteShift = async () => {
    if (shift.isDefault) {
      setConfirmDeleteOpen(false);
      showSnackbar("The default shift cannot be deleted. Set another shift as default first.", "error");
      return;
    }
    try {
      await deleteShift(shift.id).unwrap();
      showSnackbar("Shift deleted successfully");
      onDeleteShift(shift.id);
    } catch (err: any) {
      showSnackbar(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete shift.", "error");
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const activeVersion = getActiveShiftVersion(shift.shiftVersions);
  const timeLabel = activeVersion
    ? isFlexibleShiftType(activeVersion.shiftType)
      ? `${activeVersion.grossHours} hrs`
      : formatShiftTimeRange12h(activeVersion.shiftFromTime, activeVersion.shiftToTime)
    : "";

  const menuItems: MenuAtomItem[] = [
    ...(shift.isDefault ? [] : [{ label: "Set Default", onClick: () => { setDefaultShift(shift.id); handleMenuClose(); } }]),
    { label: "Rename", onClick: () => { setIsRenaming(true); handleMenuClose(); } },
    ...(!shift.isDefault ? [{ label: "Delete", onClick: () => { setConfirmDeleteOpen(true); handleMenuClose(); } }] : []),
  ];

  return (
    <Box
      onClick={!isRenaming ? onClick : undefined}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        cursor: "pointer",
        border: "1px solid",
        borderColor: "transparent",
        bgcolor: selected
          ? alpha(theme.palette.primary.main, 0.15)
          : "transparent",
        "&:hover": { bgcolor: selected ? "primary.50" : "action.hover" },
        transition: "all 0.15s ease",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack flex={1} gap={0.25}>
          {isRenaming ? (
            <Stack direction="row" gap={1} alignItems="center">
              <TextFieldElement value={name} onChange={(e) => setName(e.target.value)} label="" fullWidth slotProps={{ htmlInput: { maxLength: 50 } }} />
              <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleRenameSave(); }}>✔</IconButton>
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleRenameCancel(); }}>✖</IconButton>
            </Stack>
          ) : (
            <>
              <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Tooltip title={shift.shiftName} placement="top-start">
                  <Typography
                    variant="body2"
                    fontWeight={selected ? 600 : 400}
                    color={selected ? "primary.main" : "text.primary"}
                    noWrap
                    sx={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}
                  >
                    {shift.shiftName}
                  </Typography>
                </Tooltip>
                {shift.isDefault && <Chip size="small" label="Default" color="success" />}
              </Stack>
              {timeLabel && (
                <Typography variant="caption" color="text.secondary">{timeLabel}</Typography>
              )}
            </>
          )}
        </Stack>
        {!isRenaming && (
          <>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert fontSize="small" />
            </IconButton>
            <MenuAtom anchorEl={menuAnchor} open={Boolean(menuAnchor)} items={menuItems} onCloseAll={handleMenuClose} />
            <ConfirmDialog open={confirmDeleteOpen} title="Delete Shift" message="Are you sure you want to delete this shift? This action cannot be undone." onClose={() => setConfirmDeleteOpen(false)} onConfirm={confirmDeleteShift} confirmText="Delete" confirmColor="error" />
          </>
        )}
      </Stack>
    </Box>
  );
}

// ─── Summary card ────────────────────────────────────────────────────────────

function ShiftSummaryCard({ shift }: { shift?: IShift }) {
  if (!shift) return <Typography>No shift selected</Typography>;

  const currentVersion = getActiveShiftVersion(shift.shiftVersions);

  if (!currentVersion) {
    return (
      <Typography color="text.secondary">
        {shift.shiftVersions?.length ? "No active track version" : "No version data available"}
      </Typography>
    );
  }

  const isFixed = !isFlexibleShiftType(currentVersion.shiftType);

  const rows = [
    { icon: <InfoOutlined fontSize="small" />, label: "Type", value: isFixed ? "Fixed" : "Flexible" },
    { icon: <CalendarMonth fontSize="small" />, label: "Working Days", value: currentVersion.workingDays.join(", ") },
    {
      icon: <AccessTime fontSize="small" />, label: isFixed ? "Timings" : "Gross Hours",
      value: isFixed ? formatShiftTimeRange12h(currentVersion.shiftFromTime, currentVersion.shiftToTime) : `${currentVersion.grossHours} hrs`
    },
    { icon: <Timer fontSize="small" />, label: "Break", value: `${currentVersion.breakDuration} mins` },
    { icon: <LayersOutlined fontSize="small" />, label: "Current Version", value: currentVersion.shiftVersionName },
    { icon: <EventNote fontSize="small" />, label: "Effective From", value: formatDateShort(currentVersion.effectiveFromDate) },
  ];

  return (
    <InfoGridCard
      title="Summary"
      rows={rows}
      columns={3}
    />
  );
}