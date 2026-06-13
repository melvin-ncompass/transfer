import { useState } from "react";
import { QuickFilterDataGrid } from "../../../../../components/tables/data-table";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import {
  useDeleteUserMutation,
  useInviteUserMutation,
  useGetUserRolesListQuery,
} from "../../api/user.api";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../store/store";
import { getErrorMessage } from "../../utils/errorHandler";
import { getUserTableColumns } from "./UserTableColumns";
import { useGetUserPermissionsQuery } from "../../../../../api/permission.api";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";

export default function UserTable({ data }: any) {
  const [deleteUser] = useDeleteUserMutation();
  const [inviteUser] = useInviteUserMutation();
  const {data:userpermissionsData} = useGetUserPermissionsQuery();
  const { data: rolesData } = useGetUserRolesListQuery();
const {data:headerData} = useGetHeaderDataQuery();
  const currentUserEmail = headerData?.data?.userEmail;

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [openDeleteDialog, setDeleteDialog] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const handleDelete = async () => {
    if (!selectedRow) return;
    try {
      await deleteUser({ id: selectedRow }).unwrap();
      showSnackbar("User deleted successfully!", "success");
    } catch (err: any) {
      showSnackbar(getErrorMessage(err), "error");
    } finally {
      setDeleteDialog(false);
    }
  };

  const handleResendInvite = async (email: string, roleNames: string) => {
    const names = roleNames.split(",").map((n) => n.trim()).filter(Boolean);
    const roleIds = names
      .map((name) =>
        rolesData?.data?.find(
          (r) => r.roleName.toLowerCase() === name.toLowerCase()
        )?.id
      )
      .filter((id): id is number => id !== undefined);

    if (roleIds.length === 0) {
      showSnackbar("Could not find matching role(s). Please try again.", "error");
      return;
    }

    try {
      await inviteUser({
        email,
        roleId: roleIds.length === 1 ? roleIds[0] : roleIds,
      }).unwrap();
      showSnackbar("Invitation resent successfully!", "success");
    } catch (err: any) {
      showSnackbar(getErrorMessage(err), "error");
    }
  };

  const columns = getUserTableColumns({
    currentUserEmail: currentUserEmail!,
    setSelectedRow,
    setDeleteDialog,
    onResendInvite: handleResendInvite,
    hideActionsColumn:userpermissionsData?.data?.permissions?.includes("manage_user_management") ? false : true
  });
  return (
    <>
      <QuickFilterDataGrid columns={columns} rows={data?.data || []} />

      <ConfirmDialog
        open={openDeleteDialog}
        title="Confirm User Delete"
        message="Are you sure you want to delete this user?"
        confirmText="Delete"
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        confirmColor="error"
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}
    </>
  );
}
