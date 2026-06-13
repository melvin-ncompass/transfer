import { Box, Card, Stack, Typography } from "@mui/material";
import { Label } from "../../../../components/atom/label";
import { useState } from "react";
import {
  useToggleAppIntegrationMutation,
  useGetPeopleAccessQuery,
} from "../api/enablingapps.api";
import { Snackbar } from "../../../../components/atom/snackbar";
import { ToggleSwitch } from "../../../../components/atom/toggle-switch";
import { TogglePeopleIntegration } from "../../BusinessSettingsPermission";

function EnablingAppsCard() {
  const { data, isLoading: queryLoading } = useGetPeopleAccessQuery();
  const isPeopleEnabled = data?.data?.[0]?.isPeopleEnabled ?? false;

  const [toggleApp, { isLoading }] = useToggleAppIntegrationMutation();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const handleToggle = async () => {
    try {
      const newStatus = !isPeopleEnabled;

      await toggleApp({
        enable: newStatus,
      }).unwrap();

      setSnackbar({
        open: true,
        message: newStatus
          ? "People app has been successfully enabled!"
          : "People app has been disabled.",
        severity: "success",
      });
    } catch (error) {
      console.error("Toggle failed:", error);
      setSnackbar({
        open: true,
        message: String(error),
        severity: "error",
      });
    }
  };

  return (
    <Card sx={{ padding: 2.5 , height:"100%" }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Your Apps
      </Typography>

      {/* Side-by-side layout */}
      <Stack direction="column" spacing={4}>
        {/* Books App (Left) */}
        <Box flex={1}>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" gap={2}>
              <Typography variant="subtitle1">Books</Typography>
              <Label label="Active" color="success" />
            </Stack>
            <Typography variant="caption">
              This integration helps you sync all payroll transactions with your
              Books account automatically.
            </Typography>
          </Stack>
        </Box>

        {/* People App (Right) */}
        <Box flex={1}>
          <Stack spacing={1}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" gap={2}>
                <Typography variant="subtitle1">People</Typography>
                {isPeopleEnabled && <Label label="Active" color="success" />}
              </Stack>

             <TogglePeopleIntegration isPeopleEnabled={isPeopleEnabled} disabled={isLoading || queryLoading} handleToggle={handleToggle}/>
            </Stack>

            <Typography variant="caption">
              This integration helps you sync all payroll transactions with your
              Books account automatically.
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Card>
  );
}

export default EnablingAppsCard;
