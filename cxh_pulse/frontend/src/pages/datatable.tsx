import { useState, useMemo } from 'react';
import { Box, Typography, Stack, CircularProgress, Chip, Badge } from '@mui/material';
import { DataTable } from '../components/tables/data-table';
import { PrimaryButton } from '../components/buttons';
import type { DataTableColumn } from '../types';
import DateRangeSlider from '../components/custom-date-range-picker/date-range-picker';
import { useGetDataTableQuery } from '../api';
import { getDateRangeMaxDate, getDateLastYearDate } from '../store/constants';
import { toSmallTitleCase } from '../utils/format-text';
import { datatablePageStyles } from '../styles/pages/datatable.styles';
import { ReportGuard } from '../sections/dashboard/components/protected-components/permission-guard';
import { generateFilename } from '../utils/branded-export-common';

// ----------------------------------------------------------------------

type WardData = {
  id: string;
  ward: string;
  subcounty: string;
  avgTemp: number;
  precip: number;
  maternalMortality: number;
  malariaCases: number;
};

// ----------------------------------------------------------------------

/**
 * DataTable Page
 *
 * Ward-level data export page with climate and health indicators.
 */

const getFullDateRange = (): { from: Date; to: Date } => {
  const minDate = getDateLastYearDate();
  const maxDate = getDateRangeMaxDate();
  return { from: minDate, to: maxDate };
}
export default function DataTablePage() {
  const [filterName, setFilterName] = useState('');
  const skeletonRows = 8;


  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(getFullDateRange());

  // Prepare API params from date range
  const apiParams = useMemo(() => {
    const startYear = dateRange.from.getFullYear();
    const startMonth = dateRange.from.getMonth() + 1; // JavaScript months are 0-indexed
    const endYear = dateRange.to.getFullYear();
    const endMonth = dateRange.to.getMonth() + 1; // JavaScript months are 0-indexed

    return {
      startYear,
      startMonth,
      endYear,
      endMonth,
    };
  }, [dateRange]);

  // Fetch data from API
  const { data: apiData, isLoading, isFetching, isSuccess } = useGetDataTableQuery(apiParams);

  // Use API data if query succeeded (even if empty), otherwise fall back to dummy data (for initial load)
  const tableData = isSuccess ? apiData || [] : [];

  const columns: DataTableColumn[] = [
    { id: 'ward', label: 'Ward', align: 'left', width: '15%' },
    { id: 'subcounty', label: 'Sub-County', align: 'left' },
    { id: 'avgTemp', label: 'Avg Temperature (°C)', align: 'right' },
    { id: 'precip', label: 'Total Precipitation (mm)', align: 'right' },
    { id: 'maternalMortality', label: 'Severe Acute Malnutrition Cases', align: 'right' },
    { id: 'malariaCases', label: 'Malaria Cases', align: 'right' },
  ];

  // Custom sort function to properly sort by row data properties
  const sortFn = (row: WardData, columnId: string): string | number => {
    switch (columnId) {
      case 'ward':
        return row.ward || '';
      case 'subcounty':
        return row.subcounty || '';
      case 'avgTemp':
        return row.avgTemp || 0;
      case 'precip':
        return row.precip || 0;
      case 'maternalMortality':
        return row.maternalMortality || 0;
      case 'malariaCases':
        return row.malariaCases || 0;
      default:
        return '';
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Ward',
      'Sub-County',
      'Avg Temperature (°C)',
      'Total Precipitation (mm)',
      'Severe Acute Malnutrition Cases',
      'Malaria Cases',
    ];
    const rows = tableData.map((row: WardData) => [
      row.ward,
      row.subcounty,
      row.avgTemp.toString(),
      row.precip.toString(),
      row.maternalMortality.toString(),
      row.malariaCases.toString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row: string[]) => row.join(','))].join(
      '\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', generateFilename('Ward-Level Data', 'csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterFn = (row: WardData, filter: string) => {
    const searchTerm = filter.toLowerCase();
    return (
      row.ward.toLowerCase().includes(searchTerm) ||
      row.subcounty.toLowerCase().includes(searchTerm)
    );
  };

  const filteredRows = useMemo(() => {
    if (!filterName.trim()) {
      return tableData;
    }

    return tableData.filter((row) => filterFn(row, filterName));
  }, [tableData, filterName]);


  const renderCells = (row: WardData) => {
    // Safely convert to numbers and handle undefined/null values
    const avgTemp =
      typeof row.avgTemp === 'number' ? row.avgTemp : parseFloat(String(row.avgTemp || 0));
    const precip =
      typeof row.precip === 'number' ? row.precip : parseFloat(String(row.precip || 0));
    const maternalMortality =
      typeof row.maternalMortality === 'number'
        ? row.maternalMortality
        : parseInt(String(row.maternalMortality || 0), 10);
    const malariaCases =
      typeof row.malariaCases === 'number'
        ? row.malariaCases
        : parseInt(String(row.malariaCases || 0), 10);

    return [
      toSmallTitleCase(row.ward || ''),
      toSmallTitleCase(row.subcounty || ''),
      isNaN(avgTemp) ? '0.0' : avgTemp.toFixed(1),
      isNaN(precip) ? '0' : precip.toString(),
      isNaN(maternalMortality) ? '0' : maternalMortality.toString(),
      isNaN(malariaCases) ? '0' : malariaCases.toString(),
    ];
  };

  return (
    <Box sx={datatablePageStyles.container}>
      <Stack spacing={1}>
        {/* Header */}
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <Typography variant="h4">Ward-Level Data</Typography>
            {isFetching && <CircularProgress size={22} sx={{ mt: 0.5 }} />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Aggregated Climate And Health Indicators
          </Typography>
        </Box>

        {/* Data Table */}
        <DataTable
          columns={columns}
          rows={tableData}
          getRowId={(row) => row.id}
          filterName={filterName}
          onFilterName={(e) => setFilterName(e.target.value)}
          filterFn={filterFn}
          renderCells={renderCells}
          sortFn={sortFn}
          placeholder="Search by ward or sub-county..."
          isLoading={isLoading}
          middleAction={
            <Box sx={datatablePageStyles.dateRangeWrapper}>
              <DateRangeSlider
                initialFrom={dateRange.from}
                initialTo={dateRange.to}
                onChange={(range) => setDateRange(range)}
              />
            </Box>
          }
          rightAction={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={filteredRows.length} color='primary' max={999}>
                <Chip
                  label='All'
                  color='primary'
                  variant='filled'
                  sx={{ fontWeight: 600, height: 32 }}
                />
              </Badge>
              <ReportGuard>
                <PrimaryButton onClick={handleExportCSV}>
                  Export CSV
                </PrimaryButton>
              </ReportGuard>
            </Box>
          }
          disablePagination
          tableHeight='calc(100vh - 270px)'
          skeletonRows={skeletonRows}
        />
      </Stack>
    </Box>
  );
}
