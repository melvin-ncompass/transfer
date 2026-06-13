import { PermissionGuard } from "../../guards/ComponentGuard";
import { Tooltip } from "../../components/atom/tooltip";
import { PrimaryIconButton } from "../../components/atom/button";
import { Add, Edit, ManageAccounts } from "@mui/icons-material";
import { ToggleSwitch } from "../../components/atom/toggle-switch";
import MenuAtom from "../../components/menuatom/MenuAtom";
import { StandardTable } from "../../components/tables/standard-table";
import type { StandardTableColumn } from "../../types/types";
import { Stack } from "@mui/system";
import { useNavigate } from "react-router-dom";

export function EditCompanyBrandingButton({
  onClick,
}: {
  onClick: (s: boolean) => void;
}) {
  return (
    <PermissionGuard permission="update_business_settings">
      <Tooltip title="Edit Company Details/ Branding">
        <PrimaryIconButton
          icon={<Edit fontSize="small" />}
          onClick={() => onClick(true)}
        />
      </Tooltip>
    </PermissionGuard>
  );
}

export function EditIdentityButton({
  onClick,
}: {
  onClick: (s: boolean) => void;
}) {
  return (
    <PermissionGuard permission="update_business_settings">
      <Tooltip title="Edit Identity">
        <PrimaryIconButton
          icon={<Edit fontSize="small" />}
          onClick={() => onClick(true)}
        />
      </Tooltip>
    </PermissionGuard>
  );
}

export function EditReportStructureButton({
  onClick,
}: {
  onClick: (s: boolean) => void;
}) {
  return (
    <PermissionGuard permission="update_business_settings">
      <Tooltip title="Edit Report Structure">
        <PrimaryIconButton
          icon={<Edit fontSize="small" />}
          onClick={() => onClick(true)}
        />
      </Tooltip>
    </PermissionGuard>
  );
}

export function TogglePeopleIntegration({
  isPeopleEnabled,
  handleToggle,
  disabled,
}: {
  isPeopleEnabled: boolean;
  handleToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <PermissionGuard permission="update_business_settings">
      <ToggleSwitch
        label=""
        checked={isPeopleEnabled}
        onChange={handleToggle}
        disabled={disabled}
        color={isPeopleEnabled ? "error" : "primary"}
        size="medium"
      />
    </PermissionGuard>
  );
}

export function AddReminder({ onClick }: { onClick: (s: boolean) => void }) {
  return (
    <PermissionGuard permission="manage_reminders">
      <Tooltip title="Add reminder">
        <PrimaryIconButton
          onClick={() => {
            onClick(true);
          }}
          icon={<Add />}
        />
      </Tooltip>
    </PermissionGuard>
  );
}

export function RemindersTableMenu({
  menuAnchor,
  closeMenu,
  onEditClick,
  onDeleteClick,
  onDuplicateClick,
}: {
  menuAnchor: {
    anchorEl: HTMLElement | null;
  };
  closeMenu: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onDuplicateClick: () => void;
}) {
  return (
    <PermissionGuard permission="manage_reminders">
      <MenuAtom
        items={[
          { label: "Edit", onClick: onEditClick },
          { label: "Delete", onClick: onDeleteClick },
          { label: "Duplicate", onClick: onDuplicateClick},
        ]}
        anchorEl={menuAnchor.anchorEl}
        open={Boolean(menuAnchor.anchorEl)}
        onCloseAll={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </PermissionGuard>
  );
}

export function RemindersTable({
  columns,
  rows,
}: {
  columns: StandardTableColumn[];
  rows: any[];
}) {
  return (
    <PermissionGuard permission={"manage_permission"}>
      <StandardTable columns={columns} rows={rows} sticky />
    </PermissionGuard>
  );
}

export function UserManagementHeader({
  handleDialogOpen,
}: {
  handleDialogOpen:  React.MouseEventHandler<HTMLButtonElement>
}) {
  const navigate = useNavigate();
  return (
    <PermissionGuard permission="manage_user_management">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={2}
        sx={{
          width: { xs: "100%", sm: "auto" },
          "& button": {
            flex: { xs: 1, sm: "auto" },
          },
        }}
      >
        <Tooltip title="Manage User Roles">
          <PrimaryIconButton
            icon={<ManageAccounts />}
            onClick={() => navigate("/role/home")}
          />
        </Tooltip>
        <Tooltip title="Invite User">
          <PrimaryIconButton onClick={handleDialogOpen} icon={<Add />} />
        </Tooltip>
      </Stack>
    </PermissionGuard>
  );
}
