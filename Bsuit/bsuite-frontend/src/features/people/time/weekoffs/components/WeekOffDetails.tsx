import {
  Box,
  IconButton,
  Typography,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import { MoreVert, CalendarMonth, EventNote, InfoOutlined } from "@mui/icons-material";
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { Chip } from "../../../../../components/atom/chips";
import type { MenuAtomItem } from "../../../../../components/menuatom/MenuAtom";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import {
  useGetAllWeekOffsQuery,
  useUpdateWeekOffMutation,
  useDeleteWeekOffMutation,
  useDeleteWeekOffVersionMutation,
  type WeekOffVersion,
} from "../api/weekoffs.api";
import type { WeekDay } from "../../../../../components/atom/date-picker";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { WeekOffEmployeeList } from "./WeekOffEmployeeList";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import WeekOffModal from "./WeekOffModal";
import WeekOffVersionsModal from "./WeekOffVersionsModal";
import { formatDateShort, formatDateTimeShort } from "../../../../../utils/numberFormatter";
import { getActiveWeekOffVersion } from "../weekOff.utils";
import type { WeekOff as ApiWeekOff } from "../api/weekoffs.api";
import { InfoGridCard } from "../../shifts/components/InfoGridCard";
import { Tooltip } from "../../../../../components/atom/tooltip";

export interface WeekOff {
  id: string;
  weekOffName: string;
  weekOffVersions?: WeekOffVersion[];
  days: string[];
  isDefault?: boolean;
}

export interface WeekOffRef {
  openAddModal: () => void;
  closeModal: () => void;
  selectWeekOff: (id: string) => void;
  search: (query: string) => void;
  resetToSummary: () => void;
}

function mapWeekOffFromApi(w: ApiWeekOff): WeekOff {
  const activeVersion = getActiveWeekOffVersion(w.weekOffVersions);
  return {
    id: String(w.id),
    weekOffName: w.weekOffName,
    isDefault: w.isDefault,
    days: activeVersion?.weekOffDays ?? [],
    weekOffVersions: w.weekOffVersions,
  };
}

type ViewKey = "Summary" | "Employees" | "Track Versions";

export const WeekOffDetails = forwardRef<WeekOffRef>((_, ref) => {
  const { data: weekOffsData, isLoading, error } = useGetAllWeekOffsQuery();
  const [updateWeekOff] = useUpdateWeekOffMutation();

  const [weekOffs, setWeekOffs] = useState<WeekOff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeWeekOffId, setActiveWeekOffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<WeekOffVersion | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("Summary");
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));
  const showSnackbar = (
    message: string,
    color: "success" | "error" = "success",
  ) => setSnackbar({ open: true, message, color });

  // Populate local state when API data changes
  useEffect(() => {
    if (!weekOffsData?.data) return;
    const mapped = weekOffsData.data.map(mapWeekOffFromApi);
    setWeekOffs(mapped);

    if (lastCreatedId) {
      setActiveWeekOffId(lastCreatedId);
      setLastCreatedId(null);
    } else if (activeWeekOffId === null && mapped.length > 0) {
      setActiveWeekOffId(mapped[0].id);
    }
  }, [weekOffsData]);

  useEffect(() => {
    if (!activeWeekOffId) return;
    const el = itemRefs.current[activeWeekOffId];
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [activeWeekOffId, weekOffs]);

  useImperativeHandle(ref, () => ({
    openAddModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    selectWeekOff: (id: string) => {
      setActiveWeekOffId(id);
      setActiveView("Summary");
    },
    search: (query: string) => setSearchQuery(query),
    resetToSummary: () => setActiveView("Summary"),
  }));

  const activeWeekOff = weekOffs.find((w) => w.id === activeWeekOffId);

  const filteredWeekOffs = weekOffs.filter((w) =>
    w.weekOffName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSetDefault = async (id: string) => {
    const selected = weekOffs.find((w) => w.id === id);
    if (!selected) return;
    try {
      await updateWeekOff({
        id,
        data: { weekOffName: selected.weekOffName, isDefault: true },
      }).unwrap();
      showSnackbar("Default week off updated successfully");
    } catch (error: any) {
      showSnackbar(
        error?.data?.message ?? "Failed to set default week off",
        "error",
      );
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
    return <Typography color="error">Failed to load week offs</Typography>;

  return (
    <Box sx={{ width: "100%", mx: "auto", height: "100%" }}>
      {filteredWeekOffs.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 400px)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No week off found
          </Typography>
        </Box>
      ) : (
        <Box display="flex" width="100%" gap={1} height="100%" pt={1}>
          {/* Left panel — week off list */}
          <Box sx={{ width: "30%" }}>
            <Stack
              gap={0.5}
              sx={{ height: "100%", overflowY: "auto", pr: 1 }}
            >
              {filteredWeekOffs.map((weekOff) => (
                <div
                  key={weekOff.id}
                  ref={(el) => {
                    itemRefs.current[weekOff.id] = el;
                  }}
                >
                  <WeekOffListItem
                    weekOff={weekOff}
                    selected={weekOff.id === activeWeekOffId}
                    onClick={() => {
                      setActiveWeekOffId(weekOff.id);
                      setActiveView("Summary");
                    }}
                    setDefaultWeekOff={handleSetDefault}
                    showSnackbar={showSnackbar}
                    onDeleteWeekOff={(deletedId) => {
                      if (activeWeekOffId === deletedId) {
                        const next = filteredWeekOffs.find(
                          (w) => w.id !== deletedId,
                        );
                        setActiveWeekOffId(next ? next.id : null);
                      }
                    }}
                  />
                </div>
              ))}
            </Stack>
          </Box>

          {/* Right panel — chip nav + content */}
          <Box
            sx={{
              width: "70%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pl: 2,
            }}
          >
            {/* Navigation chips */}
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
              alignItems="center"
            >
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
            {activeView === "Summary" && (
              <WeekOffSummaryCard weekOff={activeWeekOff} />
            )}

            {activeView === "Employees" &&
              (activeWeekOff ? (
                <WeekOffEmployeeList weekOffId={activeWeekOff.id} />
              ) : (
                <Typography color="text.secondary">
                  No week off selected
                </Typography>
              ))}

            {activeView === "Track Versions" &&
              (activeWeekOff ? (
                <TrackVersionsAccordion
                  weekOff={activeWeekOff}
                  onEdit={(version) => {
                    setSelectedVersion(version);
                    setVersionModalOpen(true);
                  }}
                  onDelete={() => { }}
                />
              ) : (
                <Typography color="text.secondary">
                  No week off selected
                </Typography>
              ))}
          </Box>
        </Box>
      )}

      {/* Modals */}
      <WeekOffModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Week Off"
        onError={(msg) => showSnackbar(msg, "error")}
        onSuccess={(created) => {
          setLastCreatedId(String(created.id));
          showSnackbar("Week off created successfully", "success");
        }}
      />

      {activeWeekOff && (
        <WeekOffVersionsModal
          open={versionModalOpen}
          onClose={() => {
            setVersionModalOpen(false);
            setSelectedVersion(null);
          }}
          title="Edit Version"
          data={{
            id: String(selectedVersion?.id),
            effectiveFromDate: selectedVersion?.effectiveFromDate ?? "",
            weekOffDays: (selectedVersion?.weekOffDays as WeekDay[]) ?? [],
            weekOffName: selectedVersion?.weekOffVersionName ?? "",
            weekOffId: activeWeekOff.id,
          }}
          onSuccess={(message) => showSnackbar(message, "success")}
          onError={(message) => showSnackbar(message, "error")}
        />
      )}

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={handleCloseSnackbar}
          autoClose={6000}
        />
      )}
    </Box>
  );
});

// ─── Week off list item ───────────────────────────────────────────────────────

function WeekOffListItem({
  weekOff,
  selected,
  onClick,
  setDefaultWeekOff,
  showSnackbar,
  onDeleteWeekOff,
}: {
  weekOff: WeekOff;
  selected: boolean;
  onClick: () => void;
  setDefaultWeekOff: (id: string) => void;
  showSnackbar: (message: string, color?: "success" | "error") => void;
  onDeleteWeekOff: (id: string) => void;
}) {
  const theme = useTheme();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [name, setName] = useState(weekOff.weekOffName);

  const [updateWeekOff] = useUpdateWeekOffMutation();
  const [deleteWeekOff] = useDeleteWeekOffMutation();

  useEffect(() => {
    setName(weekOff.weekOffName);
  }, [weekOff.weekOffName]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  const handleRenameSave = async () => {
    if (!name.trim()) return;
    try {
      await updateWeekOff({
        id: weekOff.id,
        data: { weekOffName: name.trim(), isDefault: !!weekOff.isDefault },
      }).unwrap();
      showSnackbar("Week off renamed successfully");
    } catch (err: any) {
      showSnackbar(
        err?.data?.message ?? err?.error ?? err?.message ?? "Failed to rename week off.",
        "error",
      );
      handleRenameCancel();
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setName(weekOff.weekOffName);
    setIsRenaming(false);
  };

  const confirmDeleteWeekOff = async () => {
    if (weekOff.isDefault) {
      setConfirmDeleteOpen(false);
      showSnackbar(
        "The default week off cannot be deleted. Set another week off as default first.",
        "error",
      );
      return;
    }
    try {
      await deleteWeekOff(weekOff.id).unwrap();
      showSnackbar("Week off deleted successfully");
      onDeleteWeekOff(weekOff.id);
    } catch (err: any) {
      showSnackbar(
        err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete week off.",
        "error",
      );
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const activeVersion = getActiveWeekOffVersion(weekOff.weekOffVersions);
  const daysLabel = activeVersion?.weekOffDays?.join(", ") ?? weekOff.days.join(", ");

  const menuItems: MenuAtomItem[] = [
    ...(!weekOff.isDefault
      ? [
        {
          label: "Set Default",
          onClick: () => {
            setDefaultWeekOff(weekOff.id);
            handleMenuClose();
          },
        },
      ]
      : []),
    {
      label: "Rename",
      onClick: () => {
        setIsRenaming(true);
        handleMenuClose();
      },
    },
    ...(!weekOff.isDefault
      ? [
        {
          label: "Delete",
          onClick: () => {
            setConfirmDeleteOpen(true);
            handleMenuClose();
          },
        },
      ]
      : []),
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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack flex={1} gap={0.25}>
          {isRenaming ? (
            <Stack direction="row" gap={1} alignItems="center">
              <TextFieldElement
                value={name}
                onChange={(e) => setName(e.target.value)}
                label=""
                fullWidth
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
              <IconButton
                size="small"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameSave();
                }}
              >
                ✔
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameCancel();
                }}
              >
                ✖
              </IconButton>
            </Stack>
          ) : (
            <>
              <Stack
                direction="row"
                gap={1}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Tooltip title={weekOff.weekOffName} placement="top">
                  <Typography
                    variant="body2"
                    fontWeight={selected ? 600 : 400}
                    color={selected ? "primary.main" : "text.primary"}
                    noWrap
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 160,
                    }}
                  >
                    {weekOff.weekOffName}
                  </Typography>
                </Tooltip>
                {weekOff.isDefault && (
                  <Chip size="small" label="Default" color="success" />
                )}
              </Stack>
              {daysLabel && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {daysLabel}
                </Typography>
              )}
            </>
          )}
        </Stack>

        {!isRenaming && (
          <>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert fontSize="small" />
            </IconButton>
            <MenuAtom
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              items={menuItems}
              onCloseAll={handleMenuClose}
            />
            <ConfirmDialog
              open={confirmDeleteOpen}
              title="Delete Week Off"
              message="Are you sure you want to delete this week off? This action cannot be undone."
              onClose={() => setConfirmDeleteOpen(false)}
              onConfirm={confirmDeleteWeekOff}
              confirmText="Delete"
              confirmColor="error"
            />
          </>
        )}
      </Stack>
    </Box>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function WeekOffSummaryCard({ weekOff }: { weekOff?: WeekOff }) {
  if (!weekOff) return <Typography>No week off selected</Typography>;

  const activeVersion = getActiveWeekOffVersion(weekOff.weekOffVersions);

  if (!activeVersion) {
    return (
      <Typography color="text.secondary">
        {weekOff.weekOffVersions?.length
          ? "No active track version"
          : "No version data available"}
      </Typography>
    );
  }

  const rows = [
    {
      icon: <InfoOutlined fontSize="small" />,
      label: "Name",
      value: weekOff.weekOffName,
    },
    {
      icon: <CalendarMonth fontSize="small" />,
      label: "Days Off",
      value: activeVersion.weekOffDays.join(", "),
    },
    {
      icon: <EventNote fontSize="small" />,
      label: "Effective From",
      value: formatDateShort(activeVersion.effectiveFromDate),
    },
  ];

  return <InfoGridCard title="Summary" rows={rows} columns={3} />;
}

// ─── Track versions ───────────────────────────────────────────────────────────

export function TrackVersionsAccordion({
  weekOff,
  onEdit,
  onDelete,
}: {
  weekOff?: WeekOff;
  onEdit: (version: WeekOffVersion) => void;
  onDelete: (versionId: number) => void;
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);
  const [deleteWeekOffVersion] = useDeleteWeekOffVersionMutation();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const showSnackbar = (message: string, color: "success" | "error" = "success") =>
    setSnackbar({ open: true, message, color });

  const handleDeleteVersion = (versionId: number) => {
    setVersionToDelete(versionId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (versionToDelete) {
      try {
        await deleteWeekOffVersion(String(versionToDelete)).unwrap();
        showSnackbar("Week off version deleted successfully");
        onDelete(versionToDelete);
      } catch (err: any) {
        showSnackbar(
          err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete week off version.",
          "error",
        );
      }
    }
    setConfirmDeleteOpen(false);
    setVersionToDelete(null);
  };

  if (!weekOff || !weekOff.weekOffVersions?.length)
    return <Typography color="text.secondary">No versions available.</Typography>;

  const activeVersion = getActiveWeekOffVersion(weekOff.weekOffVersions);
  const sortedVersions = [...weekOff.weekOffVersions].sort(
    (a, b) => new Date(b.effectiveFromDate).getTime() - new Date(a.effectiveFromDate).getTime(),
  );

  return (
    <Box>
      <Stack spacing={1.5}>
        {sortedVersions.map((version) => {
          const isActive = activeVersion?.id === version.id;

          const rows = [
            {
              icon: <CalendarMonth fontSize="small" />,
              label: "Days Off",
              value: version.weekOffDays.join(", "),
            },
            {
              icon: <EventNote fontSize="small" />,
              label: "Effective From",
              value: formatDateShort(version.effectiveFromDate),
            },
            {
              icon: <InfoOutlined fontSize="small" />,
              label: "Updated By",
              value: `${version.updatedByName ?? "-"} · ${formatDateTimeShort(version.updatedAt)}`,
            },
          ];

          return (
            <InfoGridCard
              key={version.id}
              title={version.weekOffVersionName}
              rows={rows}
              columns={3}
              collapsible
              defaultExpanded={isActive}
              headerExtra={isActive ? <Chip size="small" label="Active" color="success" /> : undefined}
              onEdit={() => onEdit(version)}
              onDelete={() => handleDeleteVersion(version.id)}
              deleteDisabled={isActive}
              deleteDisabledTitle="Cannot delete the active version"
            />
          );
        })}
      </Stack>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Version"
        message="Are you sure you want to delete this week off version? This action cannot be undone."
        onClose={() => { setConfirmDeleteOpen(false); setVersionToDelete(null); }}
        onConfirm={confirmDelete}
        confirmText="Delete"
        confirmColor="error"
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          autoClose={6000}
        />
      )}
    </Box>
  );
}