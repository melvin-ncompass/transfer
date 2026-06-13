import React, { useState } from "react";
import {
  Box,
  Paper,
  Divider,
  Typography,
  Link,
  IconButton,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";

import ManageUserModal from "./ManageUserDialog";
import MenuAtom from "../../../../components/menuatom/MenuAtom";
import { ChipDualIcon } from "../../../../components/atom/chips";
import { ConfirmDialog } from "../../../../components/dialogs/confirm-dialog";
import type { IRoleDetails, IRoleUser } from "../../types/rba.types";
import { useGetAllUsersQuery } from "../../../setting/usermanagement/api/user.api";
import {
  useDeleteRoleMutation,
  useRevokeRoleMutation,
  useSyncUserRoleMutation,
} from "../../api/rba.api";
import { Snackbar } from "../../../../components/atom/snackbar";
import { PermissionGuard } from "../../../../guards/ComponentGuard";
import { useGetUserPermissionsQuery } from "../../../../api/permission.api";

interface RoleListProps {
  roles: IRoleDetails[];
}

// interface role

const RoleList = ({ roles }: RoleListProps) => {
  const navigate = useNavigate();
  const {data:userpermissionData} = useGetUserPermissionsQuery();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<IRoleDetails | null>(null);
  const [roleDeleteDialog, setRoleDeleteDialog] = useState(false);
  const [userDeleteDialog, setUserDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    roleId: string;
    userId: string;
    userName: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAssignedUsers, setModalAssignedUsers] = useState<IRoleUser[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  const [deleteRole] = useDeleteRoleMutation();
  const [syncUserRole] = useSyncUserRoleMutation();
  const [revokeRole] = useRevokeRoleMutation();

  const { data: usersData } = useGetAllUsersQuery();

  const allUserList =
    usersData?.data?.map((user) => ({
      userId: user.id,
      userName: user.userName,
    })) || [];

  const openMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    role: IRoleDetails,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRole(role);
  };

  const closeMenu = () => setMenuAnchor(null);

  const handleEdit = () => {
    if (!selectedRole) return;
    navigate("/role/edit", { state: { role: selectedRole } });
    closeMenu();
  };

  const handleRoleDelete = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id).unwrap();
      setSnackbar({
        open: true,
        message: "Role deleted successfully",
        color: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || "Failed to delete role",
        color: "error",
      });
    }
    setRoleDeleteDialog(false);
    setSelectedRole(null);
    closeMenu();
  };

  const handleManageUsers = (role: IRoleDetails) => {
    setSelectedRole(role);
    setModalAssignedUsers(role.users || []);
    setIsModalOpen(true);
  };

  const handleModalClose = () => setIsModalOpen(false);

  const handleModalSave = async (selectedUserIds: string[]) => {
    if (!selectedRole) return;
    try {
      await syncUserRole({
        roleId: selectedRole.id,
        userIds: selectedUserIds,
      }).unwrap();
      setSnackbar({
        open: true,
        message: "Users updated successfully",
        color: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || "Failed to update users",
        color: "error",
      });
    }
  };

  const handleUserRemove = ({
    roleId,
    userId,
    userName,
  }: {
    roleId: string;
    userId: string;
    userName: string;
  }) => {
    setUserToDelete({ roleId, userId, userName });
    setUserDeleteDialog(true);
  };

  const handleRevokeUserRole = async () => {
    if (!userToDelete) {
      return;
    }
    try {
      await revokeRole({
        roleId: userToDelete?.roleId,
        userId: userToDelete.userId,
      }).unwrap();
      setSnackbar({
        open: true,
        message: "User removed from role successfully",
        color: "success",
      });
      setModalAssignedUsers((prev) =>
        prev.filter((u) => u.id !== userToDelete.userId),
      );
      setUserDeleteDialog(false);
      setUserToDelete(null); // Clear user after deletion
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || "Failed to remove user",
        color: "error",
      });
    }
  };

  return (
    <Box px={2} pb={4} display="flex" flexWrap="wrap" gap={3}>
      {roles?.map((role) => (
        <Paper
          key={role.id}
          elevation={0}
          sx={{
            width: { lg: "48%", xs: "100%" },
            minHeight: 300,
            p: 2.5,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
            border: "1px solid",
            borderColor: "divider",
            transition: "transform 0.4s ease-in-out, box-shadow 0.3s ease",
            // "&:hover": {
            //   transform: "scale(1.03)",
            //   boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            // },
          }}
        >
          <Box display="flex" justifyContent="space-between" gap={1}>
            <Box minWidth={0}>
              <Tooltip title={role.roleName}>
                <Typography fontWeight={700} fontSize={15} noWrap>
                  {role.roleName}
                </Typography>
              </Tooltip>
              <Tooltip title={role.description}>
                <Typography fontSize={12.5} color="text.secondary" noWrap>
                  {role.description}
                </Typography>
              </Tooltip>
            </Box>
           
             {userpermissionData?.data?.roles.includes("Global Admin") && <IconButton
              size="small"
              sx={{ borderRadius: "50%", width: 32, height: 32, padding: 0 }}
              onClick={(e) => openMenu(e, role)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box display="flex" flexDirection="column" flex={1}>
            <Link
              component="button"
              underline="none"
              sx={{
                fontWeight: 600,
                fontSize: 13,
                mb: 1,
                alignSelf: "flex-start",
                color: "primary.main",
              }}
              onClick={() => handleManageUsers(role)}
            >
              Manage Users ({role.users.length || 0})
            </Link>

            <Box
              display="flex"
              flexWrap="wrap"
              gap={0.75}
              pr={0.5}
              pt={0.5}
              sx={{
                maxHeight: 150,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#cfcfcf",
                  borderRadius: 6,
                },
              }}
            >
              {(role.users || []).map((user) => (
                <ChipDualIcon
                  key={user.id}
                  label={user.displayName}
                  onDelete={() =>
                    handleUserRemove({
                      roleId: role.id,
                      userId: user.id,
                      userName: user.username,
                    })
                  }
                />
              ))}
            </Box>
          </Box>
        </Paper>
      ))}

      {/* ManageUserModal */}
      <ManageUserModal
        roleId={selectedRole?.id || ""}
        open={isModalOpen}
        onClose={handleModalClose}
        allUser={allUserList}
        modalAssignedUsers={modalAssignedUsers}
        onSave={handleModalSave}
      />

      {/* MenuAtom */}
      {selectedRole && (
        <MenuAtom
          items={[
            { label: "Edit", onClick: handleEdit },
            { label: "Delete", onClick: () => setRoleDeleteDialog(true) },
          ]}
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onCloseAll={closeMenu}
        />
      )}

      {/* Role Delete Dialog */}
      <ConfirmDialog
        open={roleDeleteDialog}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onClose={() => setRoleDeleteDialog(false)}
        onConfirm={handleRoleDelete}
        confirmColor="error"
      />

      {/* User Delete Dialog */}
      <ConfirmDialog
        open={userDeleteDialog}
        title="Remove User"
        message={`Are you sure you want to remove (${userToDelete?.userName}) from this role?`}
        onClose={() => setUserDeleteDialog(false)}
        onConfirm={handleRevokeUserRole}
        confirmColor="error"
      />

      {/* Snackbar */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Box>
  );
};

export default RoleList;
