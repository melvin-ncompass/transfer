import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

import Card from '@mui/material/Card';
import { Badge, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Button, TextField, InputAdornment, useMediaQuery, Popover, IconButton, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import { fDateTime } from '../../../../src/utils/format-time';
import { Session, useGetAllUsersQuery, useLazyGetSessionQuery, User } from '../../../../src/api';
import { LazyDataTable } from '../../../../src/components/tables/lazy-data-table';
import { Iconify } from '../../../../src/components/iconify';

import { debounce } from 'lodash';
// ----------------------------------------------------------------------

export function SessionView() {
  const ROWS_PER_PAGE = 100;
  const skeletonRows = 9;
  const isSmallScreen = useMediaQuery('(max-width: 900px)');

  // Date range limits - timezone-aware
  // MIN_DATE is static (2025-01-01), MAX_DATE recalculates to always be "today"
  const MIN_DATE = useMemo(() => dayjs('2025-01-01').startOf('day'), []);
  const MAX_DATE = dayjs().endOf('day'); // Today - recalculates each render to stay current

  const [logsData, setLogsData] = useState<Session[]>([]);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [recordTotal, setRecordTotal] = useState(0);
  const [hasError, setHasError] = useState(false);

  const [filterName, setFilterName] = useState('');
  const [debouncedFilterName, setDebouncedFilterName] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [openPopover, setOpenPopover] = useState<HTMLElement | null>(null);

  // Date range filter states
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [totalLogsPage, setTotalLogsPage] = useState({
    page: 1,
    lastPage: 1,
  });

  const {
    data: { data: allUsers = [] } = {},
    isLoading: usersLoading
  } = useGetAllUsersQuery();

  const [
    triggerFetch,
  ] = useLazyGetSessionQuery();


  // Debounce search input (for future use - currently not auto-triggering)
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


  // Fetch data
  const fetchData = useCallback(
    async (pageNum: number, search: string, userFilter?: string, startDateFilter?: string, endDateFilter?: string) => {
      try {
        setHasError(false); // Clear error state on new fetch attempt
        const result = await triggerFetch({
          page: pageNum,
          limit: ROWS_PER_PAGE,
          search: search || undefined,
          userFilter: userFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        }).unwrap();

        setLogsData(prev =>
          pageNum === 1 ? result.data : [...prev, ...result.data]
        );
        if (pageNum === 1) {
          setRecordTotal(result.total);
        }
        setTotalLogsPage({
          page: result.page,
          lastPage: result.lastPage,
        });
        setHasError(false); // Ensure error is cleared on success
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setHasError(true); // Set error state to prevent infinite retries
      } finally {
        setFetching(false);
        setIsInitialLoad(false);
      }
    },
    [triggerFetch]
  );

  // Initial load effect
  useEffect(() => {
    setFetching(true);
    fetchData(1, '', undefined, undefined, undefined);
  }, []);

  // Auto-filter when user or date range changes
  useEffect(() => {
    if (!isInitialLoad) {
      setLogsData([]);
      setPage(1);
      setFetching(true);
      setHasError(false); // Clear error state when filters change
      const start = startDate ? startDate.format('DD MMM YYYY') : undefined;
      const end = endDate ? endDate.format('DD MMM YYYY') : undefined;
      const userFilter = selectedUser || undefined;
      fetchData(1, debouncedFilterName, userFilter, start, end);
    }
  }, [selectedUser, startDate, endDate, debouncedFilterName]);

  // Load next page on reaching limit rows
  const hasMore = totalLogsPage.page < totalLogsPage.lastPage;

  const handleLoadMore = useCallback(() => {
    if (fetching || !hasMore || hasError) return; // Prevent loading more if there's an error

    const nextPage = page + 1;
    setFetching(true);
    setPage(nextPage);
    const start = startDate ? startDate.format('DD MMM YYYY') : undefined;
    const end = endDate ? endDate.format('DD MMM YYYY') : undefined;
    const userFilter = selectedUser || undefined;
    fetchData(nextPage, debouncedFilterName, userFilter, start, end);
  }, [page, fetching, hasMore, hasError, debouncedFilterName, selectedUser, startDate, endDate, fetchData]);

  const handleStartDateChange = useCallback((newValue: Dayjs | null) => {
    if (!newValue) {
      setStartDate(null);
      return;
    }

    // Check if the date is valid before applying constraints
    if (!newValue.isValid()) {
      // Allow invalid dates during typing - don't set state yet
      return;
    }

    let validatedDate = newValue;

    // Enforce minimum date (2025-01-01)
    if (validatedDate.isBefore(MIN_DATE, 'day')) {
      validatedDate = MIN_DATE;
    }

    // Enforce maximum date (today)
    if (validatedDate.isAfter(MAX_DATE, 'day')) {
      validatedDate = MAX_DATE;
    }

    setStartDate(validatedDate);
    // If start date is after end date, clear end date
    if (validatedDate && endDate && validatedDate.isAfter(endDate, 'day')) {
      setEndDate(null);
    }
  }, [endDate]);

  const handleEndDateChange = useCallback((newValue: Dayjs | null) => {
    if (!newValue) {
      setEndDate(null);
      return;
    }

    // Check if the date is valid before applying constraints
    if (!newValue.isValid()) {
      // Allow invalid dates during typing - don't set state yet
      return;
    }

    let validatedDate = newValue;

    // Enforce minimum date (2025-01-01)
    if (validatedDate.isBefore(MIN_DATE, 'day')) {
      validatedDate = MIN_DATE;
    }

    // Enforce maximum date (today)
    if (validatedDate.isAfter(MAX_DATE, 'day')) {
      validatedDate = MAX_DATE;
    }

    setEndDate(validatedDate);
    // If end date is before start date, clear start date
    if (validatedDate && startDate && validatedDate.isBefore(startDate, 'day')) {
      setStartDate(null);
    }
  }, [startDate]);

  const handleClearFilters = useCallback(() => {
    setFilterName('');
    setDebouncedFilterName('');
    setSelectedUser('');
    setStartDate(null);
    setEndDate(null);
    setLogsData([]);
    setPage(1);
    setFetching(true);
    setHasError(false); // Clear error state when clearing filters
    fetchData(1, '', undefined, undefined, undefined);
  }, [fetchData]);

  // result sorting on front end
  const sortedSessions = useMemo(
    () =>
      [...logsData].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }),
    [logsData]
  );

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);


  // // Sorting logic for sessions
  // const sessionSortFn = (row: Session, columnId: string) => {
  //   switch (columnId) {
  //     case 'name':
  //       return row.user?.userinfo?.name.toLowerCase() ?? '';
  //     case 'email':
  //       return row.user?.userinfo?.email.toLowerCase() ?? '';
  //     case 'userAgent':
  //       return row.userAgent?.toLowerCase() ?? '';
  //     case 'method':
  //       return row?.method.toLowerCase() ?? '';
  //     case 'endpoint':
  //       return row?.endpoint.toLowerCase() ?? '';
  //     case 'createdAt':
  //       return new Date(row.createdAt).getTime();
  //     default:
  //       return '';
  //   }
  // };


  return (
    <Stack direction="column" spacing={3} p={3} pt={0}>
      <Card>
        <LazyDataTable
          columns={[
            { id: 'name', label: 'Name', width: '10%', minWidth: '150px', sortable: false },
            { id: 'email', label: 'Email', width: '18%', minWidth: '180px', sortable: false },
            { id: 'userAgent', label: 'User Agent', width: '20%', sortable: false },
            { id: 'method', label: 'Method', width: '8%', minWidth: '80px', sortable: false },
            { id: 'endpoint', label: 'Endpoint', width: '25%', minWidth: '250px', sortable: false },
            { id: 'createdAt', label: 'Captured At', width: '14%', minWidth: '140px', sortable: false },
          ]}
          rows={sortedSessions}
          getRowId={(row) => row.id}
          renderCells={(row) => [
            <span key="name">{row.user?.userInfo?.name}</span>,
            <span key="email">{row.user?.userInfo?.email}</span>,
            <span key="userAgent">{row.userAgent}</span>,
            <span key="method">{row.method}</span>,
            <span key="endpoint">{row.endpoint}</span>,
            <span key="createdAt">{fDateTime(row.createdAt)}</span>,
          ]}
          leftAction={
            <Stack
              direction={{ xs: 'row', sm: 'row' }}
              spacing={{ xs: 1, sm: 1.5, md: 2 }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ width: '100%', pt: 1, pr: 1 }}
            >
              <TextField
                value={filterName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilterName(e.target.value)
                }
                placeholder="Search sessions..."
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
                sx={{
                  width: { xs: 120, sm: 200, md: 220 },
                }}
              />

              {isSmallScreen ? (
                <Stack direction="row" spacing={1}>
                  {/* Filter Icon */}
                  <IconButton
                    onClick={handleOpenPopover}
                    sx={{
                      width: 40,
                      height: 40,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Iconify icon="ic:round-filter-list" />
                  </IconButton>
                  <IconButton
                    onClick={handleClearFilters}
                    size="small"
                    sx={{
                      width: 40,
                      height: 40,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Iconify icon="eva:close-fill" />
                  </IconButton>

                  {/* Filter Popover */}
                  <Popover
                    open={Boolean(openPopover)}
                    anchorEl={openPopover}
                    onClose={handleClosePopover}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    slotProps={{
                      paper: {
                        sx: { width: 260, p: 2, mt: 1 },
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <FormControl fullWidth size="small" disabled={usersLoading}>
                        <InputLabel>User</InputLabel>
                        <Select
                          label="User"
                          value={selectedUser}
                          onChange={(e) => {
                            setSelectedUser(e.target.value as string);
                            handleClosePopover();
                          }}
                          MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {allUsers.filter(user =>
                            user.isAccountSetUp === true || !('isAccountSetUp' in user)
                          )?.map((user: User) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.userInfo?.name ?? user.userInfo?.email}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={startDate}
                          onChange={handleStartDateChange}
                          label="Start Date"
                          format="DD/MM/YYYY"
                          minDate={MIN_DATE}
                          maxDate={MAX_DATE}
                          shouldDisableDate={(date) => {
                            return date.isBefore(MIN_DATE, 'day') || date.isAfter(MAX_DATE, 'day');
                          }}
                          slotProps={{
                            textField: {
                              size: 'small',
                              readOnly: true,
                              sx: {
                                width: { xs: '100%', sm: 150, md: 170 },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>

                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={endDate}
                          onChange={handleEndDateChange}
                          label="End Date"
                          format="DD/MM/YYYY"
                          minDate={MIN_DATE}
                          maxDate={MAX_DATE}
                          shouldDisableDate={(date) => {
                            return date.isBefore(MIN_DATE, 'day') || date.isAfter(MAX_DATE, 'day');
                          }}
                          slotProps={{
                            textField: {
                              size: 'small',
                              readOnly: true,
                              sx: {
                                width: { xs: '100%', sm: 150, md: 170 },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Stack>
                  </Popover>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
                  <FormControl
                    size="small"
                    disabled={usersLoading}
                    sx={{ width: 160, 
                      '& .MuiOutlinedInput-root fieldset': {
                        borderColor: '#C4CDD5',
                      },
                     }}
                  >
                    <InputLabel>User</InputLabel>
                    <Select
                      label="User"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value as string)}
                      MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {allUsers.filter(user =>
                        user.isAccountSetUp === true || !('isAccountSetUp' in user)
                      )?.map((user: User) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.userInfo?.name ?? user.userInfo?.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={startDate}
                      onChange={handleStartDateChange}
                      label="Start Date"
                      format="DD/MM/YYYY"
                      minDate={MIN_DATE}
                      maxDate={MAX_DATE}

                      slotProps={{
                        textField: {
                          size: 'small',
                          readOnly: true,
                          sx: {
                            width: { xs: '100%', sm: 150, md: 170 },
                            '& .MuiPickersOutlinedInput-notchedOutline':{
                              borderColor: '#C4CDD5'
                            }
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={endDate}
                      onChange={handleEndDateChange}
                      label="End Date"
                      format="DD/MM/YYYY"
                      minDate={MIN_DATE}
                      maxDate={MAX_DATE}

                      slotProps={{
                        textField: {
                          size: 'small',
                          readOnly: true,
                          sx: {
                            width: { xs: '100%', sm: 150, md: 170 },
                            '& .MuiPickersOutlinedInput-notchedOutline':{
                              borderColor: '#C4CDD5'
                            }
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearFilters}
                    startIcon={<Iconify icon="eva:close-fill" />}
                    sx={{ minWidth: 100 }}
                  >
                    Clear
                  </Button>
                </Stack>
              )}
            </Stack>
          }
          middleAction={null}
          rightAction={
            <Badge badgeContent={recordTotal} max={9999999} color='primary' sx={{ mr: 2 }}>
              <Chip
                label='All'
                color='primary'
                variant='filled'
                sx={{ fontWeight: 600 }}
              />
            </Badge>
          }
          filterName=""
          debouncedFilterName=""
          onFilterName={() => { }}
          hideSearch={true}
          isLoading={fetching}
          initialLoad={isInitialLoad}
          isFetchingNextPage={fetching}
          hasMore={hasMore}
          hasError={hasError}
          onLoadMore={handleLoadMore}
          page={page}
          tableHeight='calc(100vh - 190px)'
          skeletonRows={skeletonRows}
        />
      </Card>
    </Stack>
  );
}
