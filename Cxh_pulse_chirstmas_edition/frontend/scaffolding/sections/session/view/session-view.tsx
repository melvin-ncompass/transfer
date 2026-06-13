import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import { DataTable } from '../../../../src/components/tables/data-table';
import { fDateTime } from '../../../../src/utils/format-time';
import { useGetSessionsQuery } from '../../../../src/api';

import type { SessionProps } from '../session-table-row';
import { Stack } from '@mui/material';

// ----------------------------------------------------------------------

export function SessionView() {
  const { data: sessions = [], isLoading } = useGetSessionsQuery();
  const [filterName, setFilterName] = useState('');

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Sort by created_at descending (newest first)
      }),
    [sessions]
  );

  return (
    // <DashboardContent>
    <Stack direction="column" spacing={3} p={3} pt={0}>
      <Card>
        <DataTable
          columns={[
            { id: 'name', label: 'Name', width: '10%', minWidth: '150px' },
            { id: 'email', label: 'Email', width: '18%', minWidth: '180px' },
            { id: 'userAgent', label: 'User Agent', width: '20%' },
            { id: 'method', label: 'Method', width: '8%', minWidth: '80px' },
            { id: 'endpoint', label: 'Endpoint', width: '25%', minWidth: '250px' },
            { id: 'createdAt', label: 'Captured At', width: '14%', minWidth: '140px' },
          ]}
          rows={sortedSessions}
          getRowId={(row) => row.id}
          filterName={filterName}
          onFilterName={(e) => setFilterName(e.target.value)}
          filterFn={(row, filter) => {
            const searchLower = filter.toLowerCase();
            return (
              row.user?.userInfo?.name?.toLowerCase().includes(searchLower) ||
              row.method?.toLowerCase().includes(searchLower) ||
              row.endpoint?.toLowerCase().includes(searchLower) ||
              false
            );
          }}
          renderCells={(row) => [
            <span key="name" title={row.user?.userInfo?.name}>
              {row.user?.userInfo?.name}
            </span>,
            <span key="email" title={row.user?.userInfo?.email}>
              {row.user?.userInfo?.email}
            </span>,
            <span key="userAgent" title={row.userAgent}>
              {row.userAgent}
              </span>,
            <span key="method" title={row.method}>
              {row.method}
            </span>,
            <span key="endpoint" title={row.endpoint}>
              {row.endpoint}
            </span>,
            <span key="createdAt" title={fDateTime(row.createdAt)}>
              {fDateTime(row.createdAt)}
            </span>,
          ]}
          rowsPerPageOptions={[5, 10, 25]}
          isLoading={isLoading}
        />
      </Card>
    </Stack>
    // </DashboardContent>
  );
}
