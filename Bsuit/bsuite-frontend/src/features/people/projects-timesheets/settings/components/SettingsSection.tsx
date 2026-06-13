import { useState } from "react";
import { Stack } from "@mui/material";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { TechStackSection } from "./TechStackSection";
import { TagsSection } from "./TagsSection";

export const SettingsSection = () => {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  const handleSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      <TechStackSection onSnackbar={handleSnackbar} />
      <TagsSection onSnackbar={handleSnackbar} />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          autoClose={4000}
        />
      )}
    </Stack>
  );
};
