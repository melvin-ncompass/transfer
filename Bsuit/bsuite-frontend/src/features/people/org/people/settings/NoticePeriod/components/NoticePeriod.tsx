import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import { NoticePeriodModal } from "./NoticePeriodModal";
import { usePeopleContext } from "../../../context/PeopleContext";
import type { NoticePeriodConfig } from "../types/notice.types";

export interface NoticePeriodProps {
  /** Optional override; when not provided, uses PeopleContext. */
  data?: NoticePeriodConfig | null;
  isLoading?: boolean;
  configId?: number;
  onConfigCreated?: (id: number) => void;
  /** When provided, parent shows a single snackbar (latest replaces previous). */
  onShowSnackbar?: (message: string, color: "success" | "error") => void;
}

export function NoticePeriod(props: NoticePeriodProps = {}) {
  const [open, setOpen] = useState(false);
  const ctx = usePeopleContext();
  const apiConfig = props.data !== undefined ? props.data : ctx.noticePeriod.data;
  const onConfigCreated = props.onConfigCreated ?? ctx.noticePeriod.onConfigCreated;

  const noticeData = apiConfig
    ? {
        id: apiConfig.id,
        duration: apiConfig.duration,
        policy: apiConfig.leaveEncashmentPolicyType ?? "Gross",
        encashmentValue: apiConfig.leavePolicyYear ?? apiConfig.leaveEncashmentValue ?? 0,
      }
    : null;
  const isEditMode = Boolean(noticeData);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "success" });

  const handleSuccess = (message: string) => {
    const msg = message?.trim() || "Saved successfully.";
    if (props.onShowSnackbar) props.onShowSnackbar(msg, "success");
    else setSnackbar({ open: true, message: msg, color: "success" });
  };

  const handleError = (message: string) => {
    if (props.onShowSnackbar) props.onShowSnackbar(message, "error");
    else setSnackbar({ open: true, message, color: "error" });
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 1 },
        backgroundColor: (theme) => theme.palette.background.paper,
        overflow: "auto",
      }}
    >
      {/* ---------- Header ---------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
        mb={2}
      >
        <Typography variant="h6" fontWeight={600}>
          Notice Period
        </Typography>

        <PrimaryIconButton
          icon={isEditMode ? <EditIcon /> : <AddIcon />}
          onClick={() => setOpen(true)}
          title={isEditMode ? "Edit" : "Add"}
          sx={{ flexShrink: 0 }}
          variant="outlined"
        />
      </Stack>

      {/* ---------- Notice Period Display ---------- */}
      {noticeData ? (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {[
            {
              label: "Notice Period Duration",
              value: `${noticeData.duration} month(s)`,
            },
            {
              label: "Leave Encashment Policy",
              value: `Gross / ${noticeData.encashmentValue}`,
            },
          ].map((item, idx) => (
            <Stack
              key={idx}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={{ xs: 0.25, sm: 0 }}
            >
              {/* Label column */}
              <Box sx={{ minWidth: { xs: 0, sm: 140, md: 200 } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>

              {/* Value column */}
              <Typography variant="body1" fontWeight={500}>
                {item.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No notice period information added yet.
        </Typography>
      )}

      {/* ---------- Modal ---------- */}
      <NoticePeriodModal
        open={open}
        onClose={() => setOpen(false)}
        mode={isEditMode ? "edit" : "add"}
        initialData={noticeData ?? undefined}
        configId={noticeData?.id ?? null}
        onSuccess={(message, createdId) => {
          handleSuccess(message);
          if (createdId != null) onConfigCreated?.(createdId);
        }}
        onError={handleError}
      />

      {!props.onShowSnackbar && snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Box>
  );
}
