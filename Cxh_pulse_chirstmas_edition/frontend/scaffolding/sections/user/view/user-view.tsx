import { useState, useMemo, useEffect, useCallback } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import {
  Chip,
  Button,
  Badge,
  IconButton,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Popover,
} from '@mui/material';
import { CircularProgress } from '@mui/material';
import { delay } from 'es-toolkit';

import { DashboardContent } from '../../../../src/layouts/dashboard';
import { Iconify } from '../../../../src/components/iconify';
import { PrimaryButton } from '../../../../src/components/buttons';
import { DataTable } from '../../../../src/components/tables/data-table';
import { fDateTime } from '../../../../src/utils/format-time';
import {
  useGetAllUsersQuery,
  useProcessRequestMutation,
  useUpdateUserRoleMutation,
  useGetRolesQuery,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useUpdateUserMutation,
} from '../../../../src/api';
import { useAppSelector } from '../../../../src/store/hooks';
import { selectCurrentUser } from '../../../../src/store/slices/authSlice';

import { InviteUserForm } from './invite-user-form';
import { Stack, Typography } from '@mui/material';
import { Label } from '../../../../src/components/label';

import type { User, Role } from '../../../../src/api';
import type { ISnackBar } from '../../../../src/types/component.types';
import FilterStack from './filter-stack';

export function UserView() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery('(max-width:685px)');
  
  const { data: users = [], isLoading, refetch } = useGetAllUsersQuery(
    { status: 'Get All' }
  );

  const { data: roles = [] } = useGetRolesQuery(
  );
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const currentUser = useAppSelector(selectCurrentUser);

  const [open, setOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<ISnackBar>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [processRequest] = useProcessRequestMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const tableLoading = Object.values(loadingActions).some(Boolean);
  const [activeFilterType, setActiveFilterType] = useState<string>('all');

  const filteredUsers: User[] = useMemo(() => {
    if (activeFilterType === 'all') return users;
    return users.filter((u: User) => u.type === activeFilterType);
  }, [users, activeFilterType]);

  const filterCounts = useMemo(
    () =>
      users.reduce(
        (acc: Record<string, number>, user: User) => ({ ...acc, [user.type]: (acc[user.type] || 0) + 1 }),
        {} as Record<string, number>
      ),
    [users]
  );

  const pendingRequestsCount = useMemo(
    () => users.filter((u: User) => u.type === 'request' && u.status === 'pending').length,
    [users]
  );
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingActions((prev) => ({ ...prev, [`approve-${id}`]: true }));
    try {
      await processRequest({
        requestId: id,
        status: 'approved',
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`approve-${id}`]: false }));
    }
  };

  const handleReject = async (id: string) => {
    setLoadingActions((prev) => ({ ...prev, [`reject-${id}`]: true }));
    try {
      await processRequest({
        requestId: id,
        status: 'denied',
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`reject-${id}`]: false }));
    }
  };

  const handleRoleChange = async (userId: string, email: string, newRoleName: string) => {
    setLoadingActions((prev) => ({ ...prev, [`role-${email}`]: true }));

    try {
      const minDelay = delay(500);

      await updateUserRole({
        userId,
        email,
        roleName: newRoleName,
      }).unwrap();

      await minDelay;

      setSnackbar({ open: true, message: 'Role changed successfully.', severity: 'success' });
      refetch();
    } catch (error) {
      await delay(500);
      setSnackbar({ open: true, message: 'Error changing role.', severity: 'error' });
      console.error('Failed to update user role:', error);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`role-${email}`]: false }));
    }
  };

  const handleFilterChange = (filterType: string) => {
    setActiveFilterType(filterType);
  };

  const handleInvite = () => {
    setIsInviteOpen(true);
  };

  const handleInviteSuccess = () => {
    setSnackbar({ open: true, message: 'Invitation sent successfully', severity: 'success' });
    refetch();
  };

  const handleInviteError = (error: unknown) => {
    const message = typeof error === 'string' ? error : (error as { message?: string })?.message;
    setSnackbar({ open: true, message: message || 'Error sending invite', severity: 'error' });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleToggleStatus = async (email: string, status: string) => {
    setLoadingActions((prev) => ({ ...prev, [`status-${email}`]: true }));
    try {
      if (status === 'active') {
        await deactivateUser(email).unwrap();
        setSnackbar({
          open: true,
          message: 'User deactivated successfully',
          severity: 'success',
        });
      } else {
        await activateUser(email).unwrap();
        setSnackbar({
          open: true,
          message: 'User activated successfully',
          severity: 'success',
        });
      }
      refetch();
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: `Failed to ${status === 'active' ? 'deactivate' : 'activate'} user`,
        severity: 'error',
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`status-${email}`]: false }));
    }
  };

  const getStatus = (row: User) => {
    if (row.type === 'request') {
      if (row.isAccountSetUp) {
        return <Chip label="Approved" color="success" size="small" />;
      }
      if (row.status === 'approved') {
        return <Chip label="First login required" color="warning" size="small" />;
      }

      if (row.status === 'denied') {
        return <Chip label="Rejected" color="error" size="small" />;
      }

      return <Chip label="Approval required" color="warning" size="small" />;
    }

    if (row.type === 'invite') {
      if (row.isAccountSetUp) {
        return <Chip label="Active" color="success" size="small" />;
      }
      return <Chip label="First login required" color="warning" size="small" />;
    }

    if (row.isArchived) {
      return <Chip label="Inactive" color="error" size="small" />;
    }

    return <Chip label="Active" color="success" size="small" />;
  };

  const actions = (row: User) => {
    let action;

    // --- Pending requests ---
    if (row.status === 'pending') {
      action = (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {/* Reject button */}
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={
              !loadingActions[`reject-${row.id}`] && (
                <Iconify icon="mingcute:close-line" width={18} />
              )
            }
            onClick={() => handleReject(row.id)}
            disabled={loadingActions[`approve-${row.id}`] || loadingActions[`reject-${row.id}`]}
            aria-label={`Reject ${row?.userInfo?.name}`}
            sx={{
              minWidth: 'auto',
              width: 'auto',
              px: 1.5,
              fontWeight: 500,
              '& .MuiButton-startIcon': { margin: 0 },
              '&:hover': { bgcolor: 'error.lighter' },
            }}
          >
            {loadingActions[`reject-${row.id}`] && (
              <Iconify icon="svg-spinners:180-ring" width={18} />
            )}
          </Button>

          {/* Approve button */}
          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={
              !loadingActions[`approve-${row.id}`] && (
                <Iconify icon="solar:check-circle-bold" width={18} />
              )
            }
            onClick={() => handleApprove(row.id)}
            disabled={loadingActions[`approve-${row.id}`] || loadingActions[`reject-${row.id}`]}
            aria-label={`Approve ${row.userInfo?.name}`}
            sx={{
              minWidth: 'auto',
              width: 'auto',
              px: 1.5,
              fontWeight: 500,
              '& .MuiButton-startIcon': { margin: 0 },
              '&:hover': { bgcolor: 'success.lighter' },
            }}
          >
            {loadingActions[`approve-${row.id}`] && (
              <Iconify icon="svg-spinners:180-ring" width={18} />
            )}
          </Button>
        </Stack>
      );
    } 
    // --- User type: Activate/Deactivate buttons ---
    else if (row.type === 'user' && row.userInfo?.email) {
      const isActive = !row.isArchived;
      const email = row.userInfo.email;
      const loadingKey = `status-${email}`;
      const isLoading = loadingActions[loadingKey];

      action = (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {isActive ? (
            // Deactivate button
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={
                !isLoading && <Iconify icon="mingcute:close-line" width={18} />
              }
              title="Deactivate user"
              onClick={() => handleToggleStatus(email, 'active')}
              disabled={isLoading || row.id === currentUser?.id}
              aria-label={`Deactivate ${row.userInfo?.name}`}
              sx={{
                minWidth: 'auto',
                width: 'auto',
                px: 1.5,
                fontWeight: 500,
                '& .MuiButton-startIcon': { margin: 0 },
                '&:hover': { bgcolor: 'error.lighter' },
              }}
            >
              {isLoading && <Iconify icon="svg-spinners:180-ring" width={18} />}
            </Button>
          ) : (
            // Activate button
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={
                !isLoading && <Iconify icon="solar:check-circle-bold" width={18} />
              }
              title="Activate user"
              onClick={() => handleToggleStatus(email, 'inactive')}
              disabled={isLoading || row.id === currentUser?.id}
              aria-label={`Activate ${row.userInfo?.name}`}
              sx={{
                minWidth: 'auto',
                width: 'auto',
                px: 1.5,
                fontWeight: 500,
                '& .MuiButton-startIcon': { margin: 0 },
                '&:hover': { bgcolor: 'success.lighter' },
              }}
            >
              {isLoading && <Iconify icon="svg-spinners:180-ring" width={18} />}
            </Button>
          )}
        </Stack>
      );
    } else {
      action = <>-</>;
    }
    return action;
  };

  // const FilterStack = (
  //   <Stack
  //     direction="column"
  //     spacing={1}
  //     sx={{ mr: { xs: 1, md: 4, lg: 4 }, alignItems: 'flex-start' }}
  //   >
  //     <Chip
  //       label="All"
  //       onClick={() => handleFilterChange('all')}
  //       color={activeFilterType === 'all' ? 'primary' : 'default'}
  //       variant={activeFilterType === 'all' ? 'filled' : 'outlined'}
  //       sx={{ fontWeight: activeFilterType === 'all' ? 600 : 400 }}
  //     />
  //     <Badge color="primary">
  //       <Chip
  //         label="Users"
  //         onClick={() => handleFilterChange('user')}
  //         color={activeFilterType === 'user' ? 'primary' : 'default'}
  //         variant={activeFilterType === 'user' ? 'filled' : 'outlined'}
  //         sx={{ fontWeight: activeFilterType === 'user' ? 600 : 400 }}
  //       />
  //     </Badge>
  //     <Badge badgeContent={filterCounts['request'] || 0} color="primary">
  //       <Chip
  //         label="Requests"
  //         onClick={() => handleFilterChange('request')}
  //         color={
  //           activeFilterType === 'request'
  //             ? 'primary'
  //             : pendingRequestsCount > 0
  //               ? 'warning'
  //               : 'default'
  //         }
  //         variant={activeFilterType === 'request' ? 'filled' : 'outlined'}
  //         sx={{
  //           fontWeight: activeFilterType === 'request' ? 600 : 400,
  //           ...(pendingRequestsCount > 0 &&
  //             activeFilterType !== 'request' && {
  //               animation: 'pulse 2s ease-in-out infinite',
  //               '@keyframes pulse': {
  //                 '0%, 100%': { opacity: 1 },
  //                 '50%': { opacity: 0.7 },
  //               },
  //             }),
  //         }}
  //       />
  //     </Badge>
  //     <Badge badgeContent={filterCounts['invite'] || 0} color="primary">
  //       <Chip
  //         label="Invites"
  //         onClick={() => handleFilterChange('invite')}
  //         color={activeFilterType === 'invite' ? 'primary' : 'default'}
  //         variant={activeFilterType === 'invite' ? 'filled' : 'outlined'}
  //         sx={{ fontWeight: activeFilterType === 'invite' ? 600 : 400 }}
  //       />
  //     </Badge>
  //   </Stack>
  // );

  return (
    <Stack direction="column" spacing={3} p={3} pt={0}>
      <Card sx={{ position: 'relative' }}>
        {tableLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={40} thickness={5} />
          </Box>
        )}

        <DataTable
          columns={[
            { id: 'name', label: 'Name' },
            { id: 'email', label: 'Email' },
            { id: 'role', label: 'Role' },
            { id: 'status', label: 'Status' },
            { id: 'actions', label: 'Actions' },
          ]}
          rows={filteredUsers}
          getRowId={(row) => row.id}
          filterName={filterName}
          onFilterName={(e) => setFilterName(e.target.value)}
          filterFn={(row, filterType) => {
            const searchLower = filterType.toLowerCase();
            return (
              row.userInfo?.name?.toLowerCase().includes(searchLower) ||
              row.userInfo?.email?.toLowerCase().includes(searchLower) ||
              row.userInfo?.phone?.toLowerCase().includes(searchLower) ||
              false
            );
          }}
          rightAction={
            <>
              {/*filter section for mobile and desktop */}

              {isSmallScreen ? (
                <>
                  <IconButton
                    onClick={handleOpenPopover}
                    sx={{
                      p: '2px',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Iconify icon="ic:round-filter-list" />
                  </IconButton>
                  <Popover
                    open={!!openPopover}
                    anchorEl={openPopover}
                    onClose={handleClosePopover}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    slotProps={{
                      paper: {
                        sx: { width: 110 },
                      },
                    }}
                  >
                    <Box sx={{ p: 2, pb: 1.5 }}>
                      <FilterStack
                        activeFilterType={activeFilterType}
                        pendingRequestsCount={pendingRequestsCount}
                        filterCounts={filterCounts}
                        handleFilterChange={handleFilterChange}
                      />
                    </Box>
                  </Popover>
                </>
              ) : (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mr: { xs: 1, md: 4, lg: 4 }, alignItems: 'center' }}
                >
                  <Chip
                    label="All"
                    onClick={() => handleFilterChange('all')}
                    color={activeFilterType === 'all' ? 'primary' : 'default'}
                    variant={activeFilterType === 'all' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: activeFilterType === 'all' ? 600 : 400 }}
                  />
                  <Badge color="primary">
                    <Chip
                      label="Users"
                      onClick={() => handleFilterChange('user')}
                      color={activeFilterType === 'user' ? 'primary' : 'default'}
                      variant={activeFilterType === 'user' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeFilterType === 'user' ? 600 : 400 }}
                    />
                  </Badge>
                  <Badge badgeContent={filterCounts['request'] || 0} color="primary">
                    <Chip
                      label="Requests"
                      onClick={() => handleFilterChange('request')}
                      color={
                        activeFilterType === 'request'
                          ? 'primary'
                          : pendingRequestsCount > 0
                            ? 'warning'
                            : 'default'
                      }
                      variant={activeFilterType === 'request' ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: activeFilterType === 'request' ? 600 : 400,
                        ...(pendingRequestsCount > 0 &&
                          activeFilterType !== 'request' && {
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                          },
                        }),
                      }}
                    />
                  </Badge>
                  <Badge badgeContent={filterCounts['invite'] || 0} color="primary">
                    <Chip
                      label="Invites"
                      onClick={() => handleFilterChange('invite')}
                      color={activeFilterType === 'invite' ? 'primary' : 'default'}
                      variant={activeFilterType === 'invite' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeFilterType === 'invite' ? 600 : 400 }}
                    />
                  </Badge>
                </Stack>
              )}

              {/* Show all users toggle */}
              {/* <Chip
                label={showAllUsers ? 'Show Active Only' : 'Show All Users'}
                onClick={() => setShowAllUsers(!showAllUsers)}
                color={showAllUsers ? 'primary' : 'default'}
                variant={showAllUsers ? 'filled' : 'outlined'}
                icon={
                  <Iconify
                    icon={showAllUsers ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    width={18}
                  />
                }
                sx={{
                  fontWeight: showAllUsers ? 600 : 400,
                  mr: 1,
                }}
              /> */}

              {/*invite button */}
              <PrimaryButton
                sx={isSmallScreen ? { m: 0, minWidth: 40, px: 1 } : {}}
                startIcon={!isSmallScreen ? <Iconify icon="mingcute:add-line" /> : undefined}
                onClick={handleInvite}
              >
                {isSmallScreen ? <Iconify icon="mingcute:add-line" /> : 'Invite user'}
              </PrimaryButton>
            </>
          }
          renderCells={(row) => [
            <Box key="name" sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar
                alt={row.userInfo?.name || 'User avatar'}
                src={row.userInfo?.avatarUrl || undefined}
                sx={{ width: 40, height: 40 }}
              >
                {!row.userInfo?.avatarUrl ? getInitials(row.userInfo?.name) : null}
              </Avatar>
              <Box component="span" sx={{ fontWeight: 'medium' }}>
                {row.userInfo?.name}
              </Box>
            </Box>,
            <Link
              key="email"
              href={`mailto:${row.userInfo?.email}`}
              color="inherit"
              underline="hover"
            >
              {row.userInfo?.email}
            </Link>,
            <FormControl key="role" size="small" sx={{ width: {xs:120,md:180} }}>
              <Select
                value={row.userInfo.roles?.[0]?.name || 'user'}
                title={row.userInfo.roles?.[0]?.name || 'user'}
                onChange={(e) => handleRoleChange(row.id, row.userInfo?.email, e.target.value)}
                disabled={row.id === currentUser?.id}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      width: {xs:120,md:180},
                    },
                  },
                }}
                sx={{
                  '& .MuiSelect-select': {
                    py: 0.75,
                    fontSize: '0.875rem',
                  },
                }}
              >
                {roles.map((role: Role) => (
                  <MenuItem title={role.name} key={role.id} value={role.name}>
                    {role.name.slice(0, 22) + (role.name.length > 22 ? '...' : '')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>,
            getStatus(row),
            actions(row),
          ]}
          renderExpandedRow={(row) => (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Additional Details
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                    Phone:
                  </Typography>
                  <Typography variant="body2">{row.userInfo?.phone || '-'}</Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                    Created:
                  </Typography>
                  <Typography variant="body2">
                    {row.createdAt ? fDateTime(row.createdAt) : '-'}
                  </Typography>
                </Stack>
                {row.updatedAt && (
                  <Stack direction="row" spacing={2}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Last Updated:
                    </Typography>
                    <Typography variant="body2">{fDateTime(row.updatedAt)}</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          )}
          isLoading={isLoading}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
      <InviteUserForm
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={handleInviteSuccess}
        onError={handleInviteError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
