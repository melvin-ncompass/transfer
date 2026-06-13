import { useState, useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import { EmployeeIdPrefixModal } from "./EmployeeIdPrefixModal";
import { useDeleteEmployeeIdPrefixMutation } from "../api/empidgen.api";
import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { usePeopleContext } from "../../../context/PeopleContext";
import type { EmployeeIdPrefixResponse } from "../types/empidgen.types";

export interface EmployeeIdPrefixProps {
  /** Optional override; when not provided, uses PeopleContext. */
  data?: EmployeeIdPrefixResponse;
  isLoading?: boolean;
  /** When provided, parent shows a single snackbar (latest replaces previous). */
  onShowSnackbar?: (message: string, color: "success" | "error") => void;
}

export function EmployeeIdPrefix(props: EmployeeIdPrefixProps = {}) {
  const [open, setOpen] = useState(false);
  const ctx = usePeopleContext();
  const data = props.data !== undefined ? props.data : ctx.empIdPrefix.data;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "success" });

  const [deleteEmployeeIdPrefix, { isLoading: isDeleteLoading }] =
    useDeleteEmployeeIdPrefixMutation();

  const prefixData = useMemo(() => {
    const apiData = Array.isArray(data?.data) ? data.data : [];
    return apiData.reduce<Record<string, string>>((acc, curr: any) => {
      if (curr.seriesName === "permanent")
        acc.seriesPrefixPermanent = curr.seriesPrefix;
      if (curr.seriesName === "intern")
        acc.seriesPrefixIntern = curr.seriesPrefix;
      return acc;
    }, {});
  }, [data]);

  const isEditMode =
    !!prefixData.seriesPrefixPermanent || !!prefixData.seriesPrefixIntern;

  const handleSuccess = (message: string) => {
    const msg = message?.trim() || "Saved successfully.";
    if (props.onShowSnackbar) props.onShowSnackbar(msg, "success");
    else setSnackbar({ open: true, message: msg, color: "success" });
  };

  const handleError = (message: string) => {
    if (props.onShowSnackbar) props.onShowSnackbar(message, "error");
    else setSnackbar({ open: true, message, color: "error" });
  };

  const handleDelete = async () => {
    try {
      await deleteEmployeeIdPrefix().unwrap();
      setConfirmDelete(false);
      const msg = "Employee ID Prefix configurations deleted successfully.";
      if (props.onShowSnackbar) props.onShowSnackbar(msg, "success");
      else setSnackbar({ open: true, message: msg, color: "success" });
    } catch (err: any) {
      const msg =
        err?.data?.message || "Failed to delete Employee ID Prefix configurations.";
      if (props.onShowSnackbar) props.onShowSnackbar(msg, "error");
      else setSnackbar({ open: true, message: msg, color: "error" });
    }
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
          Employee ID Prefix
        </Typography>

        <Stack direction="row" spacing={1}>
          <PrimaryIconButton
            icon={isEditMode ? <EditIcon /> : <AddIcon />}
            onClick={() => setOpen(true)}
            title={isEditMode ? "Edit" : "Add"}
            sx={{ flexShrink: 0 }}
            variant="outlined"
          />
          {isEditMode && (
            <PrimaryIconButton
              icon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
              disabled={isDeleteLoading}
              title={isDeleteLoading ? "Deleting..." : "Delete"}
              sx={{ flexShrink: 0 }}
              variant="outlined"
              color="error"
            />
          )}
        </Stack>
      </Stack>

      {/* ---------- Prefix Display ---------- */}
      {isEditMode ? (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {[ 
            { label: "Permanent", value: prefixData.seriesPrefixPermanent ?? "-" },
            { label: "Intern", value: prefixData.seriesPrefixIntern ?? "-" },
          ].map((item, idx) => (
            <Stack
              key={idx}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={{ xs: 0.25, sm: 0 }}
            >
              <Box sx={{ minWidth: { xs: 0, sm: 140, md: 200 } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={500}>
                {item.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No prefixes added yet.
        </Typography>
      )}

      {/* ---------- Modal ---------- */}
      <EmployeeIdPrefixModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        mode={isEditMode ? "edit" : "create"}
        initialData={data}
      />

      {/* ---------- Confirm Delete Dialog ---------- */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Configuration"
        message="Are you sure you want to delete all Employee ID Prefix configurations? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />

      {/* ---------- Snackbar ---------- */}
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
