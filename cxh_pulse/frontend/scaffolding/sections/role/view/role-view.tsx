import { useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import {
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { FiEdit } from 'react-icons/fi';
import { IconButton } from '@mui/material';

import { Stack } from '@mui/material';
import { fDateTime } from '../../../../src/utils/format-time';
import { formatPermissionName } from '../../../../src/utils/format-text';

import {
  useLazyGetRolesQuery,
  useDeleteRoleMutation,
  type UserMapping,
  Role,
} from '../../../../src/api';
import { PrimaryButton } from '../../../../src/components/buttons';
import { Iconify } from '../../../../src/components/iconify';
import { ProgressSnackbar } from '../../../../src/components/snackbar';
import { CreateRoleForm } from './crete-role-form';
import { DefaultRoleChip } from './default-role-chip';
import { ISnackBar } from '../../../../src/types/component.types';
import { RoleProps } from '../../../../src/types/role.types';

import type { User } from '../../../../src/api';
import { Permission } from '../../../../src/types';
import { debounce } from 'lodash';
import { LazyDataTable } from '../../../../src/components/tables/lazy-data-table';
import { usePermission } from '@/hooks/use-permissions';
import { PermissionName } from '@/types/permissions';

// ----------------------------------------------------------------------

export function RoleView() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const ROWS_PER_PAGE = 20;

  const hasRolePermission = usePermission(PermissionName.MANAGE_ROLES);

  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [totalRolesPage, setTotalRolesPage] = useState({
    page: 1,
    lastPage: 1,
  });

  const [triggerFetch, { isLoading: isLoadingData, isFetching }] = useLazyGetRolesQuery();

  const fetchData = useCallback(
    async (pageNum: number, search: string) => {
      try {
        const responseRoles = await triggerFetch({
          isDetailed: true,
          page: pageNum,
          limit: ROWS_PER_PAGE,
          search: search ?? '',
        }).unwrap();

        setRolesData(prev =>
          pageNum === 1 ? responseRoles.data : [...prev, ...responseRoles.data]
        );

        setRecordsTotal(responseRoles.total);
        setTotalRolesPage({
          page: responseRoles.page,
          lastPage: responseRoles.lastPage,
        });
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setFetching(false);
      }
    },
    [triggerFetch]
  );

  // Load next page on reaching limit rows
  const hasMore = totalRolesPage.page < totalRolesPage.lastPage;

  // reset page on search params change
  useEffect(() => {
    setPage(1);
    fetchData(1, debouncedFilterName);
  }, [debouncedFilterName, fetchData]);

  const handleLoadMore = useCallback(() => {
    if (fetching || !hasMore) return;

    const nextPage = page + 1;
    setFetching(true);
    setPage(nextPage);
    fetchData(nextPage, debouncedFilterName);
  }, [page, fetching, hasMore, fetchData, debouncedFilterName]);

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

  // Debounce search input
  const debouncedSetFilter = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedFilterName(value);
      }, 500),
    []
  );

  useEffect(() => {
    debouncedSetFilter(filterName);
    return () => debouncedSetFilter.cancel();
  }, [filterName, debouncedSetFilter]);

  const handleCreateRole = () => {
    setIsEdit(false);
    setSelectedRoleId('');
    setSelectedRoleName('');
    setSelectedRolePermissions([]);
    setCreateRoleOpen(true);
  };

  const handleCreateRoleSuccess = (roleName?: string) => {
    const name = roleName || selectedRoleName || 'Role';
    setSnackbarOpen({
      open: true,
      message: isEdit ? `${name} role has been updated successfully` : `${name} role has been created successfully`,
      severity: 'success',
    });
    // Refresh table with current filters
    setRolesData([]);
    setPage(1);
    setTotalRolesPage({ page: 1, lastPage: 1 });
    setFetching(true);
    fetchData(1, debouncedFilterName);
  };

  const handleRefresh = useCallback(() => {
    setRolesData([]);
    setPage(1);
    setTotalRolesPage({ page: 1, lastPage: 1 });
    setFetching(true);
    fetchData(1, debouncedFilterName);
  }, [fetchData, debouncedFilterName]);

  const handleCreateRoleError = (error: unknown, roleName?: string) => {
    const message = typeof error === 'string' ? error : (error as { message?: string })?.message;
    const name = roleName || selectedRoleName || 'role';
    setSnackbarOpen({
      open: true,
      message: message || (isEdit ? `Failed to update ${name} role` : `Failed to create ${name} role`),
      severity: 'error',
    });
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

    // Get role name for descriptive message
    const role = rolesData.find((r) => r.id === selectedRoleId);
    const roleName = role?.name || 'Role';

    try {
      await deleteRole(selectedRoleId);
      setConfirmDeleteModal(false);
      setSnackbarOpen({
        open: true,
        message: `${roleName} role has been deleted successfully`,
        severity: 'success',
      });
      // Refresh table with current filters
      setRolesData([]);
      setPage(1);
      setTotalRolesPage({ page: 1, lastPage: 1 });
      setFetching(true);
      fetchData(1, debouncedFilterName);
    } catch (err) {
      console.error(err);
      setConfirmDeleteModal(false);
      setSnackbarOpen({
        open: true,
        message: `Failed to delete ${roleName} role`,
        severity: 'error',
      });
    }
  };

  // OPENS CONFIRM DELETE MODAL
  const handleDeleteModal = (roleID: string) => {
    setSelectedRoleId(roleID);
    setConfirmDeleteModal(true);
  };

  // // Sorting logic for roles
  // const roleSortFn = (row: Role, columnId: string) => {
  //   switch (columnId) {
  //     case 'name':
  //       return row.name?.toLowerCase();
  //     case 'users':
  //       return row.users?.length ?? 0;
  //     case 'permissions':
  //       return row.systemPermissions?.length + row.businessPermissions?.length;
  //     case 'createdAt':
  //       return new Date(row.createdAt).getTime();
  //     case 'updatedAt':
  //       return new Date(row.updatedAt).getTime();
  //     default:
  //       return '';
  //   }
  // };

  return (
    <Stack direction="column" spacing={3} p={3} pt={0}>
      <Card>
        <LazyDataTable<RoleProps>
          columns={[
            { id: 'name', label: 'Name', sortable: false },
            { id: 'permissions', label: 'Permissions', sortable: false },
            { id: 'users', label: 'Users', sortable: false },
            { id: 'createdAt', label: 'Created At', sortable: false },
            { id: 'updatedAt', label: 'Updated At', sortable: false },
            { id: 'edit', label: 'Edit', sortable: false },
          ]}
          rows={rolesData as unknown as Role[]}
          getRowId={(row) => row.id}
          filterName={filterName}
          // sortFn={roleSortFn}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          isFetchingNextPage={fetching}
          page={page}
          debouncedFilterName={debouncedFilterName}
          onFilterName={(e) => setFilterName(e.target.value)}
          filterFn={(row, filter) => {
            const searchLower = filter.toLowerCase();
            return row.name?.toLowerCase().includes(searchLower) || false;
          }}
          isLoading={isLoadingData || isFetching}
          rightAction={
            <>
              <PrimaryButton
                onClick={handleRefresh}
                disabled={fetching || isLoadingData || isFetching}
                startIcon={!isSmallScreen ? <Iconify icon="solar:restart-bold" width={20} /> : undefined}
                sx={isSmallScreen ? { m: 0, minWidth: 40, px: 1, mr: 1 } : { mr: 1 }}
              >
                {isSmallScreen ? <Iconify icon="solar:restart-bold" width={20} /> : 'Refresh'}
              </PrimaryButton>
              <Badge badgeContent={recordsTotal} color='primary' sx={{ mr: 2 }} max={999}>
                <Chip
                  label='All'
                  color='primary'
                  variant='filled'
                  sx={{ fontWeight: 600 }}
                />
              </Badge>
              <PrimaryButton
                sx={isSmallScreen ? { m: 0, minWidth: 40, px: 1 } : {}}
                startIcon={!isSmallScreen ? <Iconify icon="mingcute:add-line" /> : undefined}
                onClick={handleCreateRole}
              >
                {isSmallScreen ? <Iconify icon="mingcute:add-line" /> : 'Create role'}
              </PrimaryButton>
            </>
          }
          renderCells={(row) => [
            <Box key="name" sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              {row.name}
              {row.isDefault && <DefaultRoleChip sx={{ ml: 0.5 }} />}
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
              {(row as any).isEditable !== false ? (
                <>
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

                  {row.isDefault ? null : <IconButton
                    size="small"
                    aria-label="role delete button"
                    onClick={() => handleDeleteModal(row.id)}
                  >
                    <RiDeleteBin6Line fontSize="medium" color="#ff0000" title="Delete role" />
                  </IconButton>}
                </>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    width: '100%',
                    pl: '5px',
                  }}
                >
                  –
                </Typography>
              )}
            </Box>,
          ]}
          tableHeight='calc(100vh - 200px)'
          // rowsPerPageOptions={[5, 10, 25]}
          disablePagination={true}
        />
      </Card>

      {hasRolePermission && (
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
          isDefault={selectedRoleId ? rolesData.find((r) => r.id === selectedRoleId)?.isDefault : false}
        />)}
      <ProgressSnackbar
        open={snackbarOpen.open}
        message={snackbarOpen.message}
        severity={snackbarOpen.severity}
        onClose={handleSnackbarClose}
      />

      {/* Permissions Dialog */}
      <Dialog
        open={viewPermissions}
        onClose={() => setViewPermissions(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Role Permissions
          {selectedRoleName && rolesData.find((r) => r.name === selectedRoleName)?.isDefault && (
            <DefaultRoleChip sx={{ ml: 1 }} />
          )}
        </DialogTitle>
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
          <PrimaryButton
            variant="contained"
            onClick={handleDeleteRoleQuery}
            disabled={isDeleting}
            startIcon={isDeleting ? <Iconify icon="svg-spinners:180-ring" /> : undefined}
          >
            Delete
          </PrimaryButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
