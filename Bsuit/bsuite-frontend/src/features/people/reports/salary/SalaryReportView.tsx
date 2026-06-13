import {
  Box,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { PrimaryButton } from "../../../../components/atom/button";
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";
import { MonthYearPickerElement } from "../../../../components/atom/date-picker";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { Snackbar } from "../../../../components/atom/snackbar";
import { StandardTable } from "../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../types/types";
import { useGetEmployeesQuery } from "../../org/people/directory/api/directory.api";
import type { EmployeeListItem } from "../../org/people/directory/types/employee.types";
import {
  useExportSalaryReportMutation,
  useLazyGetSalaryReportQuery,
  type SalaryReportData,
  type SalaryReportLine,
} from "./api/salaryReport.api";

function getEmployeeDisplayName(emp: EmployeeListItem): string {
  if ("contact" in emp && emp.contact) {
    const c = emp.contact;
    if (c.name) return c.name;
    const parts = [c.firstName, c.middleName, c.lastName].filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  if ("employeeId" in emp && emp.employeeId) return emp.employeeId;
  if ("name" in emp && emp.name) return emp.name;
  return `Employee #${emp.id}`;
}

function formatAmount(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getReportCellValue(row: SalaryReportLine, key: string, index: number): unknown {
  if (Array.isArray(row.amount)) return row.amount[index];
  return row[key];
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as { data?: { message?: string }; message?: string };
    if (typeof o.data?.message === "string") return o.data.message;
    if (typeof o.message === "string") return o.message;
  }
  return "Could not load the salary report.";
}

export default function SalaryReportView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: employeesResponse, isLoading: employeesLoading } = useGetEmployeesQuery();
  const [triggerReport, { data: reportResponse, isFetching, isError, error }] =
    useLazyGetSalaryReportQuery();
  const [exportSalaryReport, { isLoading: isExporting }] = useExportSalaryReportMutation();

  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [fromMonth, setFromMonth] = useState<Dayjs | null>(() => dayjs().startOf("month"));
  const [toMonth, setToMonth] = useState<Dayjs | null>(() => dayjs().startOf("month"));
  const [groupByRevision, setGroupByRevision] = useState(false);
  const [excludeLopAndIt, setExcludeLopAndIt] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const employeeOptions = useMemo(() => {
    const rows = employeesResponse?.data ?? [];
    return rows
      .map((emp) => ({
        label: getEmployeeDisplayName(emp),
        value: String(emp.id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employeesResponse]);

  const canSubmit = employeeId !== "";

  const reportData: SalaryReportData | undefined = reportResponse?.data;
  const hasReportRows = Boolean(
    reportData &&
      reportData.payableDates.length > 0 &&
      (reportData.earnings.length > 0 ||
        reportData.deductions.length > 0 ||
        reportData.netPay.length > 0)
  );

  const salaryReportColumns: StandardTableColumn[] = useMemo(() => {
    if (!reportData) return [];
    return [
      {
        id: "componentName",
        label: "Components",
        minWidth: 220,
        render: (row: { componentName: string; rowType: string }) => (
          <Typography
            variant="body2"
            fontWeight={row.rowType === "section" || row.rowType === "net" ? 700 : 400}
          >
            {row.componentName}
          </Typography>
        ),
      },
      ...reportData.payableDates.map((d, index) => ({
        id: d,
        label: dayjs(d).isValid() ? dayjs(d).format(isMobile ? "MMM YYYY" : "MMMM YYYY") : d,
        minWidth: 160,
        align: "right" as const,
        headerAlign: "center" as const,
        render: (row: SalaryReportLine & { rowType: string }) =>
          row.rowType === "section" ? "" : formatAmount(getReportCellValue(row, d, index)),
      })),
    ];
  }, [isMobile, reportData]);

  const salaryReportRows = useMemo(() => {
    if (!reportData) return [];
    const sectionRow = (id: string, title: string) => ({
      id,
      componentName: title,
      rowType: "section",
    });
    const mapLine = (prefix: string, row: SalaryReportLine, rowType: "data" | "net" = "data") => ({
      id: `${prefix}-${row.name}`,
      componentName: rowType === "net" ? "Net Pay" : row.name,
      rowType,
      ...row,
    });

    return [
      sectionRow("section-earnings", "Earnings"),
      ...reportData.earnings.map((row) => mapLine("earn", row)),
      sectionRow("section-deductions", "Deductions"),
      ...reportData.deductions.map((row) => mapLine("ded", row)),
      ...reportData.netPay.map((row) => mapLine("net", row, "net")),
    ];
  }, [reportData]);

  const handleUpdateReport = () => {
    if (!canSubmit || !fromMonth || !toMonth) return;
    if (fromMonth.isAfter(toMonth, "month")) {
      setSnackbar({
        open: true,
        message: "From month must be before or equal to To month.",
        color: "warning",
      });
      return;
    }
    const from = fromMonth.startOf("month").format("YYYY-MM-DD");
    const to = toMonth.startOf("month").format("YYYY-MM-DD");
    void triggerReport({
      employeeId: Number(employeeId),
      from,
      to,
      excludeLop: excludeLopAndIt,
      groupByRevision,
    });
  };

  const handleExport = async () => {
    if (!canSubmit || !fromMonth || !toMonth) return;
    if (fromMonth.isAfter(toMonth, "month")) {
      setSnackbar({
        open: true,
        message: "From month must be before or equal to To month.",
        color: "warning",
      });
      return;
    }

    try {
      const from = fromMonth.startOf("month").format("YYYY-MM-DD");
      const to = toMonth.startOf("month").format("YYYY-MM-DD");
      const { blob, fileName } = await exportSalaryReport({
        employeeId: Number(employeeId),
        exportType: "pdf",
        from,
        to,
        excludeLop: excludeLopAndIt,
        groupByRevision,
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: "Salary report exported successfully.",
        color: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message ?? err?.error ?? err?.message ?? "Failed to export salary report.",
        color: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        p: 2.5,
        overflow: "scroll",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
        maxWidth: 1120,
        mx: "auto",
        px: { xs: 0.5, sm: 1.5, md: 3 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.25, sm: 2, md: 2.5 },
          boxShadow: (theme) => theme.shadows[1],
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", lg: "flex-end" }}
            flexWrap="wrap"
            useFlexGap
          >
            <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 240px" }, minWidth: 0 }}>
              <SingleSelectElement
                label="Employee Name"
                placeholder="Select an option"
                required
                value={employeeId === "" ? "" : String(employeeId)}
                onChange={(v) => {
                  const s = v as string;
                  setEmployeeId(s === "" ? "" : Number(s));
                }}
                options={employeeOptions}
                fullWidth
                disabled={employeesLoading}
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 180px" }, minWidth: 0 }}>
              <MonthYearPickerElement
                label="From Month & Year"
                required
                value={fromMonth}
                onChange={(v) => setFromMonth(v)}
                width="100%"
                max={toMonth ?? undefined}
              />
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 180px" }, minWidth: 0 }}>
              <MonthYearPickerElement
                label="To Month & Year"
                required
                value={toMonth}
                onChange={(v) => setToMonth(v)}
                width="100%"
                min={fromMonth ?? undefined}
              />
            </Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" } }}
            >
              <PrimaryButton
                onClick={handleUpdateReport}
                disabled={!canSubmit || !fromMonth || !toMonth}
                loading={isFetching}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Update Report
              </PrimaryButton>
              <PrimaryButton
                onClick={handleExport}
                disabled={!canSubmit || !fromMonth || !toMonth}
                loading={isExporting}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Export
              </PrimaryButton>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 3 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={groupByRevision}
                  onChange={(_, c) => setGroupByRevision(c)}
                  color="primary"
                />
              }
              label="Group by Revision"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={excludeLopAndIt}
                  onChange={(_, c) => setExcludeLopAndIt(c)}
                  color="primary"
                />
              }
              label="Exclude LOP and IT"
            />
          </Stack>
        </Stack>
      </Paper>

      {isError && (
        <Typography color="error" variant="body2">
          {getErrorMessage(error)}
        </Typography>
      )}

      {!reportData && !isFetching && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Select employee name, from month, and to month to view the salary report.
          </Typography>
        </Paper>
      )}

      {isFetching && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center">
            <CustomCircularProgress size={22} />
            
          </Stack>
        </Paper>
      )}

      {reportData && !hasReportRows && !isFetching && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            No data found for the selected employee and month range.
          </Typography>
        </Paper>
      )}

      {reportData && hasReportRows && !isFetching && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Salary report
          </Typography>
          <Paper variant="elevation" sx={{ borderRadius: 0, maxHeight: { xs: 420, sm: 500 }, overflow: "auto" }}>
            <StandardTable
              columns={salaryReportColumns}
              // cellBorderBottom="1px solid rgb(39, 34, 34) "
              rows={salaryReportRows}
              sticky
              gap={2}
              emptyMessage="No Data Available"
              sx={{ borderRadius: 0 }}
            />
          </Paper>
        </Box>
      )}

      {snackbar.open && (
        <Snackbar
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          message={snackbar.message}
          color={snackbar.color}
        />
      )}
    </Box>
  );
}
