import { useState } from "react";
import { Box, Stack } from "@mui/material";

import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { usePeopleContext } from "../context/PeopleContext";
import { EmployeeIdPrefix } from "./EmpIdGeneration/components/EmployeeIdPrefix";
import { NoticePeriod } from "./NoticePeriod/components/NoticePeriod";

/** People > Settings sub-tab. Notice period and Employee ID prefix get data from PeopleContext. */
export default function PeopleSettingsView() {
  const { noticePeriod, empIdPrefix } = usePeopleContext();
  const isSettingsLoading = noticePeriod.isLoading || empIdPrefix.isLoading;

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "success" });

  const showSnackbar = (message: string, color: "success" | "error") => {
    setSnackbar({ open: true, message, color });
  };

  if (isSettingsLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" py={6}>
        <CustomCircularProgress size={24} />
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        p: 1,
      }}
    >
      <Stack spacing={2.5}>
        <EmployeeIdPrefix onShowSnackbar={showSnackbar} />
        <NoticePeriod onShowSnackbar={showSnackbar} />
      </Stack>

      {snackbar.open && (
        <Snackbar
          key={snackbar.message}
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Box>
  );
}
