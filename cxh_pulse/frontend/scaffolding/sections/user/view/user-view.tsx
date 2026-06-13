import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import {
  Chip,
  Button,
  Badge,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Popover,
  SelectChangeEvent,
  TextField,
  InputAdornment,
} from '@mui/material';
import { CircularProgress } from '@mui/material';
import { delay } from 'es-toolkit';

import { Iconify } from '../../../../src/components/iconify';
import { PrimaryButton } from '../../../../src/components/buttons';
import { LazyDataTable } from '../../../../src/components/tables/lazy-data-table';
import { ProgressSnackbar } from '../../../../src/components/snackbar';
import { fDateTime } from '../../../../src/utils/format-time';
import {
  useLazyGetAllUsersQuery,
  useProcessRequestMutation,
  useUpdateUserRoleMutation,
  useGetRolesQuery,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useReinviteUserMutation,
} from '../../../../src/api';
import { useAppSelector } from '../../../../src/store/hooks';
import { selectCurrentUser } from '../../../../src/store/slices/authSlice';

import { InviteUserForm } from './invite-user-form';
import { Stack, Typography } from '@mui/material';

import type { User, Role } from '../../../../src/api';
import type { ISnackBar } from '../../../../src/types/component.types';
import { UserType } from '../../../../src/types/user.types';
import FilterStack from './filter-stack';
import { debounce } from 'lodash';
import { useMedia } from '../../../../src/hooks/use-media';
import { usePermission } from '../../../../src/hooks/use-permissions';
import { PermissionName } from '../../../../src/types/permissions';
import { CreateRoleForm } from '../../../../scaffolding/sections/role/view/crete-role-form';
import { PermissionGuard } from '@/sections/dashboard/components/protected-components/permission-guard';
import { SUPER_ADMIN_ROLE } from '@/store/constants';


export function UserView() {
  const { isSmallScreen, isMediumScreen } = useMedia();
  const ROWS_PER_PAGE = 20;
  const skeletonRows = 9;
  const canManageRoles = usePermission(PermissionName.MANAGE_ROLES);
  const [searchParams, setSearchParams] = useSearchParams();

  // Refs for focusing elements
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const hasInitializedFromUrl = useRef(false);

  //for viewing permissions
  const [viewPermissionsOpen, setViewPermissionsOpen] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<any[]>([]);
  const [selectedUserBusinessPermissions, setSelectedUserBusinessPermissions] = useState<any[]>([]);
  const [selectedUserRoleName, setSelectedUserRoleName] = useState('');


  const [userData, setUserData] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [recordsTotal, setRecordsTotal] = useState(0);
  // Initialize debouncedFilterName from URL immediately to prevent race condition
  const [debouncedFilterName, setDebouncedFilterName] = useState(() => searchParams.get('search') || '');

  const [totalUserPage, setTotalUserPage] = useState({
    page: 1,
    lastPage: 1,
  });
  // for request and invite counts
  const [pendingRequests, setPendingRequests] = useState({
    requests: 0,
    invites: 0,
  });
  // selected role to filter users - initialize from URL
  const [selectedRoleId, setSelectedRoleId] = useState<string | ''>(searchParams.get('role') || '');
  const [
    triggerFetch,
  ] = useLazyGetAllUsersQuery();

  const fetchData = useCallback(
    async (pageNum: number, search: string, selectedRole?: string) => {
      try {
        const result = await triggerFetch({
          page: pageNum,
          limit: ROWS_PER_PAGE,
          search: search || undefined,
          status: 'Get All',
          roleFilter: selectedRole || undefined,
        }).unwrap();

        const pageNumNormalized = Number(result.page);
        const lastPageNormalized = Number(result.lastPage);

        const invitedCount = Number(result?.userCount?.totalInvites || 0);
        const requestCount = Number(result?.userCount?.totalRequests || 0);

        setUserData(prev =>
          pageNum === 1 ? result.data : [...prev, ...result.data]
        );

        setRecordsTotal(result.total);
        setTotalUserPage({
          page: pageNumNormalized,
          lastPage: lastPageNormalized,
        });

        setPendingRequests({
          requests: requestCount,
          invites: invitedCount,
        })

      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setFetching(false);
      }
    },
    [triggerFetch]
  );

  //reset and refetch data
  const resetAndRefetch = useCallback(
    (search: string, role?: string) => {
      setUserData([]);
      setPage(1);
      setTotalUserPage({ page: 1, lastPage: 1 });
      setFetching(true);
      fetchData(1, search, role);
    },
    [fetchData]
  );

  // Use a ref to track if this is the initial mount to prevent duplicate calls
  const isInitialMount = useRef(true);

  useEffect(() => {
    // On initial mount, fetch once with the initialized values from URL
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setFetching(true);
      setPage(1);
      resetAndRefetch(debouncedFilterName, selectedRoleId);
      return;
    }

    // Subsequent changes trigger refetch
    setFetching(true);
    setPage(1);
    resetAndRefetch(debouncedFilterName, selectedRoleId);
  }, [debouncedFilterName, selectedRoleId, resetAndRefetch]);

  // Load next page on reaching limit rows
  const hasMore = totalUserPage.page < totalUserPage.lastPage;

  const handleLoadMore = useCallback(() => {
    if (fetching || !hasMore) return;

    const nextPage = page + 1;
    setFetching(true);
    setPage(nextPage);
    fetchData(nextPage, debouncedFilterName, selectedRoleId);
  }, [page, fetching, hasMore, fetchData, debouncedFilterName, selectedRoleId]);


  // Only fetch roles if user has MANAGE_ROLES permission
  const { data: rolesData = [] } = useGetRolesQuery(
    { isDetailed: true },
    {
      skip: !canManageRoles,
    }
  );
  const roles = Array.isArray(rolesData) ? rolesData : rolesData?.data || [];

  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [inviteUser, { isLoading: isLoadingReinvite }] = useReinviteUserMutation();
  const currentUser = useAppSelector(selectCurrentUser);

  // Initialize filterName from URL
  const [filterName, setFilterName] = useState(searchParams.get('search') || '');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<ISnackBar>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [processRequest] = useProcessRequestMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const tableLoading = Object.values(loadingActions).some(Boolean);
  // Initialize activeFilterType from URL
  const [activeFilterType, setActiveFilterType] = useState<string>(searchParams.get('status') || 'all');

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  // Update URL params when filters change
  const updateUrlParams = useCallback((updates: { search?: string; role?: string; status?: string; userId?: string | null }) => {
    const newParams = new URLSearchParams(searchParams);

    if (updates.search !== undefined) {
      if (updates.search) {
        newParams.set('search', updates.search);
      } else {
        newParams.delete('search');
      }
    }

    if (updates.role !== undefined) {
      if (updates.role) {
        newParams.set('role', updates.role);
      } else {
        newParams.delete('role');
      }
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== 'all') {
        newParams.set('status', updates.status);
      } else {
        newParams.delete('status');
      }
    }

    if (updates.userId !== undefined) {
      if (updates.userId) {
        newParams.set('userId', updates.userId);
      } else {
        newParams.delete('userId');
      }
    }

    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Debounce search input
  const debouncedSetFilter = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedFilterName(value);
        updateUrlParams({ search: value });
      }, 500),
    [updateUrlParams]
  );

  useEffect(() => {
    // Skip debounce on initial mount if filterName matches URL (already initialized)
    // This prevents duplicate API calls when component mounts with URL params
    const urlSearch = searchParams.get('search') || '';
    if (!hasInitializedFromUrl.current) {
      hasInitializedFromUrl.current = true;
      // On initial mount, if filterName matches URL, don't trigger debounce
      // The API call is already handled by the useEffect that depends on debouncedFilterName
      if (filterName === urlSearch) {
        return;
      }
    }

    // For subsequent changes, trigger debounce
    debouncedSetFilter(filterName);
    return () => debouncedSetFilter.cancel();
  }, [filterName, debouncedSetFilter, searchParams]);


  const filtereduserData: User[] = useMemo(() => {
    if (activeFilterType === 'all') return userData;
    return userData.filter((u: User) => u.type === activeFilterType);
  }, [userData, activeFilterType]);

  const handleApprove = async (id: string) => {
    const user = userData.find((u) => u.id === id);
    const userName = user?.userInfo?.name || user?.userInfo?.email || 'User';

    setLoadingActions((prev) => ({ ...prev, [`approve-${id}`]: true }));
    try {
      await processRequest({
        requestId: id,
        status: 'approved',
      }).unwrap();

      setSnackbar({
        open: true,
        message: `${userName}'s request has been approved`,
        severity: 'success',
      });
      resetAndRefetch(debouncedFilterName);
    } catch (error) {
      console.error('Failed to approve request:', error);
      setSnackbar({
        open: true,
        message: `Failed to approve ${userName}'s request`,
        severity: 'error',
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`approve-${id}`]: false }));
    }
  };

  const handleReject = async (id: string) => {
    const user = userData.find((u) => u.id === id);
    const userName = user?.userInfo?.name || user?.userInfo?.email || 'User';

    setLoadingActions((prev) => ({ ...prev, [`reject-${id}`]: true }));
    try {
      await processRequest({
        requestId: id,
        status: 'denied',
      }).unwrap();

      setSnackbar({
        open: true,
        message: `${userName}'s request has been rejected`,
        severity: 'success',
      });
      resetAndRefetch(debouncedFilterName);
    } catch (error) {
      console.error('Failed to reject request:', error);
      setSnackbar({
        open: true,
        message: `Failed to reject ${userName}'s request`,
        severity: 'error',
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`reject-${id}`]: false }));
    }
  };

  const handleRoleChange = async (userId: string, email: string, newRoleName: string) => {
    // Get user details before the change for descriptive message
    const user = userData.find((u) => u.id === userId);
    const userName = user?.userInfo?.name || email;
    const oldRoleName = user?.userInfo?.roles?.[0]?.name || 'Unknown';

    setLoadingActions((prev) => ({ ...prev, [`role-${email}`]: true }));

    try {
      const minDelay = delay(500);

      await updateUserRole({
        userId,
        email,
        roleName: newRoleName,
      }).unwrap();

      await minDelay;

      setSnackbar({
        open: true,
        message: `${userName}'s role has been changed from ${oldRoleName} to ${newRoleName}`,
        severity: 'success',
      });
      resetAndRefetch(debouncedFilterName, selectedRoleId);
    } catch (error) {
      await delay(500);
      setSnackbar({
        open: true,
        message: `Failed to change ${userName}'s role from ${oldRoleName} to ${newRoleName}`,
        severity: 'error',
      });
      console.error('Failed to update user role:', error);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`role-${email}`]: false }));
    }
  };

  const handleFilterChange = (filterType: string) => {
    setActiveFilterType(filterType);
    updateUrlParams({ status: filterType });
    // Focus on status filter area
    setTimeout(() => {
      if (statusFilterRef.current) {
        statusFilterRef.current.focus();
      }
    }, 100);
  };

  const handleResendInvite = async (email: string) => {
    const key = `resend-${email}`;

    try {
      setLoadingActions((prev) => ({ ...prev, [key]: true }));

      await inviteUser({ email }).unwrap();

      setSnackbar({
        open: true,
        message: `Invitation has been resent to ${email}`,
        severity: 'success',
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: `Failed to resend invitation to ${email}`,
        severity: 'error',
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [key]: false }));
    }
  }

  const handleInvite = () => {
    setIsInviteOpen(true);
  };

  const handleInviteSuccess = (email?: string) => {
    setSnackbar({
      open: true,
      message: email ? `Invitation has been sent to ${email}` : 'Invitation sent successfully',
      severity: 'success',
    });
    resetAndRefetch(debouncedFilterName);
  };

  const handleInviteError = (error: unknown, email?: string) => {
    const message = typeof error === 'string' ? error : (error as { message?: string })?.message;
    setSnackbar({
      open: true,
      message: message || (email ? `Failed to send invitation to ${email}` : 'Error sending invite'),
      severity: 'error',
    });
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
    // Get user name for descriptive message
    const user = userData.find((u) => u.userInfo?.email === email);
    const userName = user?.userInfo?.name || email;

    setLoadingActions((prev) => ({ ...prev, [`status-${email}`]: true }));
    try {
      if (status === 'active') {
        await deactivateUser(email).unwrap();
        setSnackbar({
          open: true,
          message: `${userName} has been deactivated`,
          severity: 'success',
        });
      } else {
        await activateUser(email).unwrap();
        setSnackbar({
          open: true,
          message: `${userName} has been activated`,
          severity: 'success',
        });
      }
      resetAndRefetch(debouncedFilterName);
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: `Failed to ${status === 'active' ? 'deactivate' : 'activate'} ${userName}`,
        severity: 'error',
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`status-${email}`]: false }));
    }
  };

  const getStatus = (row: User) => {
    if (row.type === UserType.REQUEST) {
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

    if (row.type === UserType.INVITE) {
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

    // --- Reinvite users ---
    else if (row.type === UserType.INVITE) {
      const loadingKey = `resend-${row.id}`;
      const isLoading = loadingActions[loadingKey];

      action = (
        <Button
          variant="outlined"
          size="small"
          color="inherit"
          onClick={() => handleResendInvite(row.userInfo.email)}
          disabled={isLoading}
          title={`Resend invite to ${row?.userInfo?.name}`}
          aria-label={`Resend invite to ${row?.userInfo?.name}`}
          sx={{
            minWidth: 'auto',
            px: 1.5,
            fontWeight: 500,
            '& .MuiButton-startIcon': { margin: 0 },
          }}
        >
          <Iconify icon="resend-icon:outline" width={18} />
        </Button>
      );
    }

    // --- User type: Activate/Deactivate buttons ---
    else if (row.type === UserType.USER && row.userInfo?.email) {
      const isActive = !row.isArchived;
      const email = row.userInfo.email;
      const loadingKey = `status-${email}`;
      const isLoading = loadingActions[loadingKey];
      const isSuperAdmin = row.userInfo?.roles?.some((role) => role.name === SUPER_ADMIN_ROLE);
      action = (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {!isSuperAdmin ? (isActive ? (
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
          )) : <Typography
            variant="body2"
            sx={{
              width: '100%',
              pl: '15px',
            }}
          >
            –
          </Typography>}
        </Stack>
      );
    } else {
      action = <Typography
        variant="body2"
        sx={{
          width: '100%',
          pl: '15px',
        }}
      >
        –
      </Typography>;
    }
    return action;
  };

  // // Sorting logic for users
  // const userSortFn = (row: User, columnId: string): string | number => {
  //   switch (columnId) {
  //     case 'name':
  //       return row.userInfo?.name?.toLowerCase() ?? '';
  //     case 'email':
  //       return row.userInfo?.email?.toLowerCase() ?? '';
  //     case 'role':
  //       return row.userInfo?.roles?.[0]?.name?.toLowerCase() ?? '';
  //     case 'status':
  //       return row?.isArchived ? 'inactive' : 'active';
  //     default:
  //       return '';
  //   }
  // };

  // Role filter
  const handleRoleSelect = (event: SelectChangeEvent) => {
    const role = event.target.value || '';
    setSelectedRoleId(role);
    updateUrlParams({ role });

    resetAndRefetch(debouncedFilterName, role);
  };

  const handleRefresh = useCallback(() => {
    setUserData([]);
    setPage(1);
    setTotalUserPage({ page: 1, lastPage: 1 });
    setFetching(true);
    fetchData(1, debouncedFilterName, selectedRoleId);
  }, [fetchData, debouncedFilterName, selectedRoleId]);


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

        <LazyDataTable
          tableHeight='calc(100vh - 190px)'
          columns={[
            { id: 'name', label: 'Name', sortable: false },
            { id: 'email', label: 'Email', sortable: false },
            { id: 'role', label: 'Role', sortable: false },
            { id: 'status', label: 'Status', sortable: false },
            { id: 'actions', label: 'Actions', sortable: false },
            { id: 'expand', label: '', width: 48, align: 'center', sortable: false },
          ]}
          rows={filtereduserData}
          getRowId={(row) => row.id}
          getRowProps={(row) => ({
            'data-user-id': row.id,
          })}
          filterName={filterName}
          // sortFn={userSortFn}
          onFilterName={(e) => setFilterName(e.target.value)}
          debouncedFilterName={debouncedFilterName}
          hideSearch={true}
          leftAction={
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: { xs: 1 } }}>
              <TextField
                inputRef={searchInputRef}
                value={filterName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterName(e.target.value)}
                placeholder="Search user..."
                label="Search"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Iconify width={18} icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                }}
                slotProps={{
                  htmlInput: {
                    maxLength: 50,
                  },
                }}
                sx={{ width: { xs: 140, sm: 180, md: 220 } }}
              />
              {canManageRoles && (
                <FormControl size="small" sx={{ width: isMediumScreen ? 140 : 180 }}>
                  <Select
                    value={selectedRoleId ?? ''}
                    onChange={handleRoleSelect}
                    displayEmpty
                    disabled={fetching}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          width: { xs: 150, md: 180 },
                        },
                      },
                    }}
                    sx={{
                      height: '40px',
                      '& .MuiSelect-select': {
                        py: 0.75,
                        fontSize: '0.875rem',
                      },
                      fieldset: {
                        borderColor: '#C4CDD5'
                      }
                    }}
                  >
                    <MenuItem value="">
                      All Roles
                    </MenuItem>

                    {roles.map((role: Role) => (
                      <MenuItem title={role.name} key={role.id} value={role.id}>
                        {role.name.slice(0, 22) + (role.name.length > 22 ? '...' : '')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          }
          rightAction={
            <>
              <PrimaryButton
                onClick={handleRefresh}
                disabled={fetching}
                startIcon={!isSmallScreen ? <Iconify icon="solar:restart-bold" width={20} /> : undefined}
                sx={isSmallScreen ? { m: 0, minWidth: 40, px: 1 } : { mr: 1 }}
              >
                {isSmallScreen ? <Iconify icon="solar:restart-bold" width={20} /> : 'Refresh'}
              </PrimaryButton>
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
                        recordsTotal={recordsTotal}
                        pendingRequests={pendingRequests}
                        handleFilterChange={handleFilterChange}
                      />
                    </Box>
                  </Popover>
                </>
              ) : (
                <Stack
                  ref={statusFilterRef}
                  direction="row"
                  spacing={1}
                  sx={{ mr: { xs: 1, md: 4, lg: 4 }, alignItems: 'center' }}
                  tabIndex={-1}
                >
                  <Badge badgeContent={recordsTotal} color='primary' max={999}>
                    <Chip
                      label='All'
                      onClick={() => handleFilterChange('all')}
                      color={activeFilterType === 'all' ? 'primary' : 'default'}
                      variant={activeFilterType === 'all' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeFilterType === 'all' ? 600 : 400 }}
                    />
                  </Badge>
                  <Badge color="primary">
                    <Chip
                      label="Users"
                      onClick={() => handleFilterChange('user')}
                      color={activeFilterType === UserType.USER ? 'primary' : 'default'}
                      variant={activeFilterType === UserType.USER ? 'filled' : 'outlined'}
                      sx={{ fontWeight: activeFilterType === UserType.USER ? 600 : 400 }}
                    />
                  </Badge>
                  <Badge badgeContent={pendingRequests.requests} color="primary">
                    <Chip
                      label="Requests"
                      onClick={() => handleFilterChange('request')}
                      color={
                        activeFilterType === UserType.REQUEST
                          ? 'primary'
                          : pendingRequests.requests > 0
                            ? 'warning'
                            : 'default'
                      }
                      variant={activeFilterType === UserType.REQUEST ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: activeFilterType === UserType.REQUEST ? 600 : 400,
                        ...(pendingRequests.requests > 0 &&
                          activeFilterType !== UserType.REQUEST && {
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                          },
                        }),
                      }}
                    />
                  </Badge>
                  <Badge badgeContent={pendingRequests.invites} color="primary">
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

              {/* Show all userData toggle */}
              {/* <Chip
                label={showAlluserData ? 'Show Active Only' : 'Show All userData'}
                onClick={() => setShowAlluserData(!showAlluserData)}
                color={showAlluserData ? 'primary' : 'default'}
                variant={showAlluserData ? 'filled' : 'outlined'}
                icon={
                  <Iconify
                    icon={showAlluserData ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    width={18}
                  />
                }
                sx={{
                  fontWeight: showAlluserData ? 600 : 400,
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
              <Box
                component="span"
                title={row.userInfo?.name}
                sx={{ fontWeight: 'medium', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
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
            canManageRoles ? (
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', width: '100%' }}>
                <FormControl key="role" size="small" sx={{ minWidth: 120, width: '100%' }}>
                  <Select
                    value={row.userInfo.roles?.[0]?.name || 'user'}
                    title={row.userInfo.roles?.[0]?.name || 'user'}
                    onChange={(e) => handleRoleChange(row.id, row.userInfo?.email, e.target.value)}
                    disabled={
                      loadingActions[`role-${row.userInfo?.email}`] ||
                      row.id === currentUser?.id ||
                      (row.type === UserType.REQUEST && row.status === 'denied') ||
                      (row.type === UserType.USER && row.isArchived === true)
                    }
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          width: { xs: 120, md: 180 },
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
                </FormControl>
                <PermissionGuard allowedPermissions={[PermissionName.MANAGE_ROLES]} children={<IconButton
                  onClick={() => {
                    const roleName = row.userInfo.roles?.[0]?.name;
                    const role = roles.find(
                      r => r.name.trim().toLowerCase() === roleName?.trim().toLowerCase()
                    );
                    setSelectedUserRoleName(roleName ?? 'Assigned Role');
                    setSelectedUserPermissions(role?.systemPermissions ?? []);
                    setSelectedUserBusinessPermissions(role?.businessPermissions ?? []);
                    setViewPermissionsOpen(true);
                  }}
                >
                  <Iconify icon="solar:info-circle-bold" />
                </IconButton>} />

              </Box>
            ) : (
              <Typography
                key="role"
                variant="body2"
                sx={{
                  py: 0.75,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                }}
              >
                {row.userInfo.roles?.[0]?.name || 'user'}
              </Typography>
            ),
            getStatus(row),
            actions(row),
          ]}
          renderExpandedRow={(row) => (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Additional Details
              </Typography>
              <Stack spacing={1.5}>
                {/* <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                    Phone:
                  </Typography>
                  <Typography variant="body2">{row.userInfo?.phone || '-'}</Typography>
                </Stack> */}
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
          isLoading={fetching}
          disablePagination
          skeletonRows={skeletonRows}
          isFetchingNextPage={fetching}
          hasMore={hasMore}
          page={page}
          onLoadMore={handleLoadMore}
        />
      </Card>
      <CreateRoleForm
        open={viewPermissionsOpen}
        onClose={() => setViewPermissionsOpen(false)}
        isEdit={false}
        selectedRoleName={selectedUserRoleName}
        selectedRolePermissions={selectedUserPermissions}
        selectedBusinessPermissions={selectedUserBusinessPermissions}
        isShow={true}
      />

      <InviteUserForm
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={handleInviteSuccess}
        onError={handleInviteError}
      />

      <ProgressSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </Stack>
  );
}
