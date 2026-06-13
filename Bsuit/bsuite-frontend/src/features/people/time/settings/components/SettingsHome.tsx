import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RepeatIcon from "@mui/icons-material/Repeat";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import {
  useGetSlackConfigQuery,
  useUpdateSlackConfigMutation,
  useRemoveSlackConfigMutation,
  useGetAttendanceConfigQuery,
  type AttendanceConfigRequestDto,
} from "../api/settings.api";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { AttendanceConfigModal } from "./AttendanceConfigModal";
import { InfoGridCard } from "../../shifts/components/InfoGridCard";
import { TextFieldElement } from "../../../../../components/atom/text-field";

// ── small helper: Yes/No chip ─────────────────────────────────────────────────
function YesNoChip({ value }: { value: boolean }) {
  return (
    <Chip
      size="small"
      icon={
        value ? (
          <CheckCircleOutlineIcon fontSize="small" />
        ) : (
          <CancelOutlinedIcon fontSize="small" />
        )
      }
      label={value ? "Yes" : "No"}
      color={value ? "success" : "default"}
      variant="outlined"
      sx={{ fontWeight: 500, width: "fit-content" }}
    />
  );
}

export function SettingsHome() {
  const { data: slackData, isLoading: isSlackLoading } = useGetSlackConfigQuery();
  const [updateSlackConfig, { isLoading: isUpdating }] = useUpdateSlackConfigMutation();
  const [removeSlackConfig, { isLoading: isRemovingSlack }] = useRemoveSlackConfigMutation();

  const [slackUrl, setSlackUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [removeSlackDialogOpen, setRemoveSlackDialogOpen] = useState(false);

  useEffect(() => {
    if (slackData == null) return;
    const raw = slackData.data;
    setSlackUrl(typeof raw === "string" && raw.trim() ? raw.trim() : null);
  }, [slackData]);

  const handleEditClick = () => {
    setTempUrl(slackUrl ?? "");
    setEditing(true);
  };

  const handleSlackSave = async () => {
    const newUrl = tempUrl.trim();
    try {
      await updateSlackConfig({ slackUrl: newUrl }).unwrap();
      setSlackUrl(newUrl || null);
      setEditing(false);
      showToast("Slack configuration updated successfully", "success");
    } catch (error: any) {
      showToast(error?.data?.message || "Failed to update Slack configuration", "error");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setTempUrl("");
  };

  const handleCloseRemoveSlackDialog = () => {
    if (isRemovingSlack) return;
    setRemoveSlackDialogOpen(false);
  };

  const handleConfirmRemoveSlack = async () => {
    try {
      const res = await removeSlackConfig().unwrap();
      setSlackUrl(null);
      setEditing(false);
      setTempUrl("");
      setRemoveSlackDialogOpen(false);
      showToast(
        (typeof res?.message === "string" && res.message) ||
        "Slack configuration removed successfully",
        "success",
      );
    } catch (error: any) {
      showToast(error?.data?.message || "Failed to remove Slack configuration", "error");
    }
  };

  const isSaveDisabled = isUpdating || tempUrl.trim() === (slackUrl ?? "");
  const isSlackEditMode = Boolean(slackUrl);

  /* ─── Attendance Config ─── */
  const { data: attendanceData, isLoading: isAttendanceLoading } = useGetAttendanceConfigQuery();

  const rawAttendance = attendanceData?.data ?? attendanceData ?? null;
  const attendanceConfig: (AttendanceConfigRequestDto & { id: number }) | null =
    rawAttendance && typeof rawAttendance === "object" && "allowRegularisation" in rawAttendance
      ? rawAttendance
      : null;

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  /* ─── Toast ─── */
  const [toast, setToast] = useState({
    message: "",
    color: "info" as "success" | "error" | "info" | "warning",
    open: false,
  });

  const showToast = (message: string, color: typeof toast.color) =>
    setToast({ open: true, message, color });

  const isLoading = isSlackLoading || isAttendanceLoading;

  /* ─── InfoGridCard rows ─── */
  const attendanceRows = attendanceConfig
    ? [
      {
        icon: <CheckCircleOutlineIcon fontSize="inherit" />,
        label: "Allow Regularisation",
        value: <YesNoChip value={attendanceConfig.allowRegularisation} />,
      },
      {
        icon: <RepeatIcon fontSize="inherit" />,
        label: "Reason Required",
        value: <YesNoChip value={attendanceConfig.reasonRequired} />,
      },
      {
        icon: <CalendarTodayIcon fontSize="inherit" />,
        label: "Max Regularisations",
        value: attendanceConfig.maxRegularisationAllowed
          ? `${attendanceConfig.maxRegularisationAllowed.count} / ${attendanceConfig.maxRegularisationAllowed.timePeriod}`
          : "Not set",
      },
      {
        icon: <EventAvailableIcon fontSize="inherit" />,
        label: "Last Date to Regularise",
        value:
          attendanceConfig.lastDateToRegularise != null
            ? `Day ${attendanceConfig.lastDateToRegularise} of the month`
            : "Not set",
      },
      {
        icon: <HourglassEmptyIcon fontSize="inherit" />,
        label: "Max Days After Incident",
        value:
          attendanceConfig.maxDaysAfterIncident != null
            ? `${attendanceConfig.maxDaysAfterIncident} days`
            : "Not set",
      },
    ]
    : [];

  return (
    <Box
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        position: "relative",
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(255,255,255,0.7)",
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* ── Attendance Configuration ── */}
      {attendanceConfig ? (
        <InfoGridCard
          title="Attendance Configuration"
          rows={attendanceRows}
          columns={3}
          onEdit={() => setAttendanceModalOpen(true)}
        />
      ) : (
        <InfoGridCard
          title="Attendance Configuration"
          rows={[
            {
              label: "Status",
              value: (
                <Typography variant="body2" color="text.secondary">
                  No regularisation configuration set.
                </Typography>
              ),
            },
          ]}
          columns={1}
          onEdit={isAttendanceLoading ? undefined : () => setAttendanceModalOpen(true)}
          headerExtra={
            <PrimaryIconButton
              icon={<AddIcon />}
              onClick={() => setAttendanceModalOpen(true)}
              title="Add"
              variant="outlined"
              disabled={isAttendanceLoading}
              sx={{ ml: 1 }}
            />
          }
        />
      )}

      {/* ── Slack Webhook ── */}
      <Box mt={2}>
        <InfoGridCard
          title="Slack Incoming Webhook URL"
          Headerheight={48}
          rows={[
            {
              label: "Webhook URL",
              value: (
                <Box sx={{
                  display: "flex",
                  height: 60,
                  alignItems: "center",
                  width: "100%",
                }}>
                  {editing ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%", py: 1 }}>
                      <TextFieldElement
                        fullWidth
                        label=""
                        placeholder="Enter Slack Webhook URL"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        disabled={isUpdating}
                      />
                      <Tooltip title="Save">
                        <span>
                          <IconButton
                            color="success"
                            onClick={handleSlackSave}
                            disabled={isSaveDisabled}
                            size="small"
                          >
                            {isUpdating ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <DoneIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <span>
                          <IconButton
                            color="error"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  ) : slackUrl ? (
                    <Typography variant="body2" fontWeight={500} sx={{ wordBreak: "break-all" }}>
                      {slackUrl}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No Slack URL specified.
                    </Typography>
                  )}
                </Box>
              ),
            },
          ]}
          columns={1}
          onEdit={!editing && !isSlackLoading && !isUpdating && !isRemovingSlack
            ? handleEditClick
            : undefined
          }
          onDelete={
            !editing && isSlackEditMode && !isSlackLoading && !isUpdating && !isRemovingSlack
              ? () => setRemoveSlackDialogOpen(true)
              : undefined
          }
        />
      </Box>

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={removeSlackDialogOpen}
        title="Remove Slack configuration"
        message="This will clear the Slack incoming webhook URL for your organization. You can add a new URL later. Continue?"
        onClose={handleCloseRemoveSlackDialog}
        onConfirm={() => { void handleConfirmRemoveSlack(); }}
        confirmColor="error"
        disableConfirmButton={isRemovingSlack}
      />

      <AttendanceConfigModal
        open={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        existingData={attendanceConfig}
        onSuccess={(msg) => showToast(msg, "success")}
        onError={(msg) => showToast(msg, "error")}
      />

      {toast.open && (
        <Snackbar
          message={toast.message}
          color={toast.color}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
      )}
    </Box>
  );
}