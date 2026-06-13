import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import {
  Snackbar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  TextField,
} from '@mui/material';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Alert } from '@mui/material';
import { FiEdit } from 'react-icons/fi';
import { IconButton } from '@mui/material';

import { Stack } from '@mui/material';
import { DataTable } from '../../../../src/components/tables/data-table';
import { fDateTime } from '../../../../src/utils/format-time';
import { formatPermissionName } from '../../../../src/utils/format-text';

import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  type UserMapping,
  Role,
} from '../../../../src/api';
import { PrimaryButton } from '../../../../src/components/buttons';
import { Iconify } from '../../../../src/components/iconify';
import { CreateRoleForm } from './crete-role-form';
import { ISnackBar } from '../../../../src/types/component.types';
import { RoleProps } from '../../../../src/types/role.types';

import type { User } from '../../../../src/api';
import { Permission } from '../../../../src/types';

// ----------------------------------------------------------------------

export function RoleView() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: roles = [], isLoading, refetch } = useGetRolesQuery();

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [snackbarOpen, setSnackbarOpen] = useState<ISnackBar>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [filterName, setFilterName] = useState('');
  const [isCreateRoleOpen, setCreateRoleOpen] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<any[]>([]);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedRoleUsers, setSelectedRoleUsers] = useState<User[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [viewPermissions, setViewPermissions] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [selectedBusinessPermissions, setSelectedBusinessPermissions] = useState<any[]>([]);

  const handleCreateRole = () => {
    setIsEdit(false);
    setSelectedRoleId('');
    setSelectedRoleName('');
    setSelectedRolePermissions([]);
    setCreateRoleOpen(true);
  };

  const handleCreateRoleSuccess = () => {
    setSnackbarOpen({ open: true, message: 'Role created successfully!', severity: 'success' });
    refetch();
  };

  const handleCreateRoleError = (error: unknown) => {
    const message = typeof error === 'string' ? error : (error as { message?: string })?.message;
    setSnackbarOpen({ open: true, message: message || 'Error creating role!', severity: 'error' });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen((prev) => ({ ...prev, open: false }));
  };

  const handleViewPermissionsEdit = (
    permissionList: any[],
    businessPermissions: any[],
    name: string,
    roleId: string
  ) => {
    setSelectedRoleName(name);
    setSelectedRoleId(roleId);
    setNewRoleName(name);
    setSelectedRolePermissions(permissionList);
    setSelectedBusinessPermissions(businessPermissions);
    setIsEdit(true);
    setCreateRoleOpen(true);
  };

  const handleShowPermissions = (permissionList: any[], name: string, roleId: string) => {
    setSelectedRoleName(name);
    setSelectedRoleId(roleId);
    setSelectedRolePermissions(permissionList);
    setViewPermissions(true);
  };

  const handleViewUsers = (users: User[], roleName: string) => {
    setSelectedRoleUsers(users);
    setSelectedRoleName(roleName);
    setUsersDialogOpen(true);
  };

  const handleCloseUsersDialog = () => {
    setUsersDialogOpen(false);
  };

  // DELETE ROLE HANDLER
  const handleDeleteRoleQuery = async () => {
    if (selectedRoleId === null) {
      return;
    }

    try {
      await deleteRole(selectedRoleId);
      setConfirmDeleteModal(false);
      setSnackbarOpen({
        open: true,
        message: 'Role successfully deleted',
        severity: 'success',
      });
    } catch (err) {
      console.error(err);
      setConfirmDeleteModal(false);
      setSnackbarOpen({
        open: true,
        message: 'Error deleting role',
        severity: 'error',
      });
    }
  };

  // OPENS CONFIRM DELETE MODAL
  const handleDeleteModal = (roleID: string) => {
    setSelectedRoleId(roleID);
    setConfirmDeleteModal(true);
  };

  return (
    <Stack direction="column" spacing={3} p={3} pt={0}>
      <Card>
        <DataTable<RoleProps>
          columns={[
            { id: 'name', label: 'Name' },
            { id: 'permissions', label: 'Permissions' },
            { id: 'users', label: 'Users' },
            { id: 'createdAt', label: 'Created At' },
            { id: 'updatedAt', label: 'Updated At' },
            { id: 'edit', label: 'Edit' },
          ]}
          rows={roles as unknown as Role[]}
          getRowId={(row) => row.id}
          filterName={filterName}
          onFilterName={(e) => setFilterName(e.target.value)}
          filterFn={(row, filter) => {
            const searchLower = filter.toLowerCase();
            return row.name?.toLowerCase().includes(searchLower) || false;
          }}
          isLoading={isLoading}
          rightAction={
            <PrimaryButton
              sx={isSmallScreen ? { m: 0, minWidth: 40, px: 1 } : {}}
              startIcon={!isSmallScreen ? <Iconify icon="mingcute:add-line" /> : undefined}
              onClick={handleCreateRole}
            >
              {isSmallScreen ? <Iconify icon="mingcute:add-line" /> : 'Create role'}
            </PrimaryButton>
          }
          renderCells={(row) => [
            <Box key="name" sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              {row.name}
            </Box>,
            <Box key="permissions">
              {row.systemPermissions ||
              (row.businessPermissions &&
                ((row.systemPermissions as unknown as Permission["system"]).length > 0 || (row.businessPermissions as unknown as Permission["business"]).length > 0)) ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleShowPermissions(
                      [...(row.systemPermissions as unknown as Permission["system"]), ...(row.businessPermissions as unknown as Permission["business"])],
                      row.name,
                      row.id
                    )
                  }
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1,
                    px: 2,
                    minWidth: 120,
                  }}
                >
                  {(row.systemPermissions as unknown as Permission["system"]).length + (row.businessPermissions as unknown as Permission["business"]).length}{' '}
                  {(row.systemPermissions as unknown as Permission["system"]).length + (row.businessPermissions as unknown as Permission["business"]).length === 1
                    ? 'Permission'
                    : 'Permissions'}
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No permissions
                </Typography>
              )}
            </Box>,
            <Chip
              key="users"
              label={row.users?.length || 0}
              variant="outlined"
              size="small"
              onClick={() =>
                row.users && row.users.length > 0 && handleViewUsers(row.users, row.name)
              }
              sx={{
                cursor: row.users && row.users.length > 0 ? 'pointer' : 'default',
                color: 'var(--brand-text)',
                borderColor: 'var(--brand-border, rgba(0,0,0,0.12))',
                '&:hover':
                  row.users && row.users.length > 0
                    ? {
                        bgcolor: 'var(--brand-surface-hover, var(--brand-surface))',
                      }
                    : {},
              }}
            />,
            fDateTime(row.createdAt),
            fDateTime(row.updatedAt),
            <Box gap={4}>
              <IconButton
                size="small"
                aria-label="role name edit button"
                title="Edit role"
                onClick={() =>
                  handleViewPermissionsEdit(
                    row.systemPermissions,
                    row.businessPermissions,
                    row.name,
                    row.id
                  )
                }
              >
                <FiEdit fontSize="small" />
              </IconButton>
              {!row.isDefault && (
                <IconButton
                  size="small"
                  aria-label="role delete button"
                  onClick={() => handleDeleteModal(row.id)}
                >
                  <RiDeleteBin6Line fontSize="medium" color="#ff0000" title="Delete role" />
                </IconButton>
              )}
            </Box>,
          ]}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
      <CreateRoleForm
        open={isCreateRoleOpen}
        onClose={() => setCreateRoleOpen(false)}
        onSuccess={handleCreateRoleSuccess}
        onError={handleCreateRoleError}
        isEdit={isEdit}
        selectedRoleId={selectedRoleId ?? undefined}
        selectedRoleName={selectedRoleName}
        selectedRolePermissions={selectedRolePermissions}
        selectedBusinessPermissions={selectedBusinessPermissions}
      />
      <Snackbar
        open={snackbarOpen.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarOpen.severity}
          sx={{ width: '100%' }}
        >
          {snackbarOpen.message}
        </Alert>
      </Snackbar>

      {/* Permissions Dialog */}
      <Dialog
        open={viewPermissions}
        onClose={() => setViewPermissions(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Role Permissions</DialogTitle>
        <DialogContent sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1 }}>
            {selectedRolePermissions.map((pm) => (
              <Chip
                key={pm.id}
                label={formatPermissionName(pm.name)}
                variant="outlined"
                sx={{
                  fontSize: '0.875rem',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <PrimaryButton variant="outlined" onClick={() => setViewPermissions(false)}>
            Close
          </PrimaryButton>
        </DialogActions>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={usersDialogOpen} onClose={handleCloseUsersDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Users with {selectedRoleName} Role</DialogTitle>
        <DialogContent>
          {selectedRoleUsers.length > 0 ? (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedRoleUsers.length} user{selectedRoleUsers.length !== 1 ? 's' : ''} assigned
                to this role
              </Typography>
              <Stack spacing={1}>
                {selectedRoleUsers.map((userMapping) => (
                  <Box
                    key={userMapping.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'var(--brand-surface)',
                      color: 'var(--brand-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Iconify icon="solar:user-bold-duotone" width={20} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'var(--brand-text)' }}
                      >
                        {userMapping.userInfo.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'var(--brand-text-secondary, var(--brand-text))' }}
                      >
                        {userMapping.userInfo.email}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No users assigned to this role
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsersDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Are you sure you want to delete this role?</DialogTitle>
        <DialogContent sx={{ mb: 2 }}>
          <Typography>This action cannot be undone later.</Typography>
        </DialogContent>
        <DialogActions>
          <PrimaryButton variant="outlined" onClick={() => setConfirmDeleteModal(false)}>
            Cancel
          </PrimaryButton>
          <PrimaryButton variant="contained" onClick={handleDeleteRoleQuery}>
            Delete
          </PrimaryButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
