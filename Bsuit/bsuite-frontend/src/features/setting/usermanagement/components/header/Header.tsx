import { Typography, Stack } from "@mui/material";
import { useState } from "react";
import { InviteUserModal } from "../dialog/InviteUserModal";
import { useNavigate } from "react-router-dom";
import { UserManagementHeader } from "../../../BusinessSettingsPermission";
export const Header = () => {
  const [openDialog, setDialogOpen] = useState(false);

  const navigate = useNavigate();

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        sx={{
          width: "100%",
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h6">User Management</Typography>
        </Stack>
        <UserManagementHeader handleDialogOpen={handleDialogOpen} />
      </Stack>

      <InviteUserModal open={openDialog} onClose={handleDialogClose} />
    </>
  );
};
