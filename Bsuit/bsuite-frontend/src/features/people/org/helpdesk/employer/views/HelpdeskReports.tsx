import React, { useState } from "react";
import { Box, Typography, Grid, Paper, Skeleton, Alert, Button } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { BarChart, LineChart } from "@mui/x-charts";
import dayjs, { type Dayjs } from "dayjs";

import {
  useGetAllTicketsReportQuery,
  useGetClosedTicketsReportQuery,
  useGetAggregatesByCategoryQuery,
  useGetAggregatesByAssigneeQuery,
  useGetMonthlyTrendsQuery,
  useGetAvgFirstResponseQuery,
  useGetAvgResolutionTimeQuery,
  useGetOnHoldStatsQuery,
} from "../../api/helpdeskReports.api";
import  { PrimaryButton } from "../../../../../../components/atom/button";
import { DateRangePicker } from "../../../../../../components/atom/custom-date-range-picker";

// --- Helper Components ---
const MetricCard = ({ title, value, loading, error }: { title: string; value: string | number; loading: boolean; error: boolean }) => (
  <Paper sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%", borderRadius: 2 }} variant="outlined">
    <Typography color="text.secondary" fontSize={14} fontWeight={500} gutterBottom>
      {title}
    </Typography>
    {loading ? (
      <Skeleton variant="text" width="60%" height={40} />
    ) : error ? (
      <Typography color="error" fontSize={14}>Failed to load</Typography>
    ) : (
      <Typography variant="h5" fontWeight={600}>
        {value}
      </Typography>
    )}
  </Paper>
);

const ChartCard = ({ title, children, loading, error }: { title: string; children: React.ReactNode; loading: boolean; error: boolean }) => (
  <Paper sx={{ p: 2, borderRadius: 2, height: "100%", minHeight: 350, display: "flex", flexDirection: "column" }} variant="outlined">
    <Typography variant="h6" fontWeight={600} mb={2}>
      {title}
    </Typography>
    <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={300} />
      ) : error ? (
        <Alert severity="error">Failed to load chart data</Alert>
      ) : (
        children
      )}
    </Box>
  </Paper>
);

export default function HelpdeskReports() {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [appliedFilters, setAppliedFilters] = useState<{ start?: string; end?: string }>({
    start: dayjs().startOf("month").toISOString(),
    end: dayjs().toISOString(),
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      start: dateRange[0]?.toISOString(),
      end: dateRange[1]?.toISOString(),
    });
  };

  // --- API Queries ---
  const { data: allTicketsData, isLoading: loadingAll, isError: errorAll } = useGetAllTicketsReportQuery(appliedFilters);
  const { data: closedTicketsData, isLoading: loadingClosed, isError: errorClosed } = useGetClosedTicketsReportQuery(appliedFilters);
  const { data: catAggData, isLoading: loadingCat, isError: errorCat } = useGetAggregatesByCategoryQuery();
  const { data: assigneeAggData, isLoading: loadingAssignee, isError: errorAssignee } = useGetAggregatesByAssigneeQuery();
  const { data: monthlyData, isLoading: loadingMonthly, isError: errorMonthly } = useGetMonthlyTrendsQuery();
  const { data: avgFirstData, isLoading: loadingFirst, isError: errorFirst } = useGetAvgFirstResponseQuery();
  const { data: avgResData, isLoading: loadingRes, isError: errorRes } = useGetAvgResolutionTimeQuery();
  const { data: onHoldData, isLoading: loadingHold, isError: errorHold } = useGetOnHoldStatsQuery();

  // Parse generic responses safely
  const getSafeCount = (data: any) => data?.data?.count ?? data?.data ?? data?.count ?? data ?? 0;
  const getSafeTime = (data: any) => data?.data?.timeString ?? data?.data ?? data?.timeString ?? data ?? "N/A";

  const totalTickets = getSafeCount(allTicketsData);
  const closedTickets = getSafeCount(closedTicketsData);
  const avgFirstResponse = getSafeTime(avgFirstData);
  const avgResolutionTime = getSafeTime(avgResData);
  const onHoldCount = getSafeCount(onHoldData);

  // Parse chart data
  const categoryData = catAggData?.data || [];
  const assigneeData = assigneeAggData?.data || [];
  const trendsData = monthlyData?.data || [];

  // --- Table Columns ---
  const categoryColumns: GridColDef[] = [
    { field: "categoryName", headerName: "Category", flex: 1, minWidth: 150 },
    { field: "totalTickets", headerName: "Total Tickets", type: "number", width: 130 },
    { field: "resolved", headerName: "Resolved", type: "number", width: 120 },
    { field: "pending", headerName: "Pending", type: "number", width: 120 },
    { field: "breachedSla", headerName: "Breached SLA", type: "number", width: 130 },
  ];

  const assigneeColumns: GridColDef[] = [
    { field: "assigneeName", headerName: "Assignee", flex: 1, minWidth: 150 },
    { field: "assignedTickets", headerName: "Assigned Tickets", type: "number", width: 150 },
    { field: "resolvedTickets", headerName: "Resolved Tickets", type: "number", width: 150 },
    { field: "avgResolutionTime", headerName: "Avg Resolution Time", width: 180 },
    { field: "slaBreaches", headerName: "SLA Breaches", type: "number", width: 130 },
  ];

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={3} pb={4}>
      {/* HEADER & FILTERS */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Helpdesk Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Track ticket trends, SLA performance, and workload distribution
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Box width={260}>
            <DateRangePicker
              startValue={dateRange[0]}
              endValue={dateRange[1]}
              onChange={(dates) => setDateRange([dates[0], dates[1]])}
              label="Date Range"
              displayFormat="month-day"
            />
          </Box>
          <PrimaryButton onClick={handleApplyFilters}>Apply Filters</PrimaryButton>
        </Box>
      </Box>

      {/* METRICS ROW */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <MetricCard title="Total Tickets" value={totalTickets} loading={loadingAll} error={errorAll} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <MetricCard title="Closed Tickets" value={closedTickets} loading={loadingClosed} error={errorClosed} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <MetricCard title="Avg First Response" value={avgFirstResponse} loading={loadingFirst} error={errorFirst} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <MetricCard title="Avg Resolution Time" value={avgResolutionTime} loading={loadingRes} error={errorRes} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <MetricCard title="On Hold Tickets" value={onHoldCount} loading={loadingHold} error={errorHold} />
        </Grid>
      </Grid>

      {/* CHARTS */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Tickets by Category" loading={loadingCat} error={errorCat}>
            {categoryData.length === 0 && !loadingCat ? (
              <Typography color="text.secondary">No report data available</Typography>
            ) : (
              <BarChart
                xAxis={[{ scaleType: "band", data: categoryData.map((d) => d.categoryName) }]}
                series={[{ data: categoryData.map((d) => d.totalTickets), label: "Ticket Count", color: "#1976d2" }]}
                height={300}
                margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
              />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Monthly Trends" loading={loadingMonthly} error={errorMonthly}>
            {trendsData.length === 0 && !loadingMonthly ? (
              <Typography color="text.secondary">No report data available</Typography>
            ) : (
              <LineChart
                xAxis={[{ scaleType: "point", data: trendsData.map((d) => d.month) }]}
                series={[
                  { data: trendsData.map((d) => d.createdTickets), label: "Created", color: "#1976d2" },
                  { data: trendsData.map((d) => d.closedTickets || 0), label: "Closed", color: "#2e7d32" },
                ]}
                height={300}
                margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
              />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ChartCard title="Tickets by Assignee" loading={loadingAssignee} error={errorAssignee}>
            {assigneeData.length === 0 && !loadingAssignee ? (
              <Typography color="text.secondary">No report data available</Typography>
            ) : (
              <BarChart
                layout="horizontal"
                yAxis={[{ scaleType: "band", data: assigneeData.map((d) => d.assigneeName) }]}
                series={[{ data: assigneeData.map((d) => d.assignedTickets), label: "Assigned Tickets", color: "#9c27b0" }]}
                height={350}
                margin={{ left: 100, right: 20, top: 20, bottom: 30 }}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* TABLES */}
      <Box display="flex" flexDirection="column" gap={2}>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box p={2} borderBottom="1px solid" borderColor="divider">
            <Typography variant="h6" fontWeight={600}>Category Breakdown</Typography>
          </Box>
          <DataGrid
            rows={categoryData.map((d, i) => ({ id: i, ...d }))}
            columns={categoryColumns}
            loading={loadingCat}
            autoHeight
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            pageSizeOptions={[5, 10, 25]}
            sx={{ border: 0 }}
          />
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box p={2} borderBottom="1px solid" borderColor="divider">
            <Typography variant="h6" fontWeight={600}>Assignee Performance</Typography>
          </Box>
          <DataGrid
            rows={assigneeData.map((d, i) => ({ id: i, ...d }))}
            columns={assigneeColumns}
            loading={loadingAssignee}
            autoHeight
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            pageSizeOptions={[5, 10, 25]}
            sx={{ border: 0 }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
