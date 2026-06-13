import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  TextField,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import dayjs, { type Dayjs } from "dayjs";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box/Checkbox";
import { DatePickerElement } from "../../../../../../components/atom/date-picker/DatePicker";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import type { StandardTableColumn } from "../../../../../../types/types";
import {
  useDownloadPayoutReportMutation,
  useGetPayoutReportPreviewMutation,
  type PayoutExportRow,
} from "../api/payrun.api";

interface PayoutReportModalProps {
  open: boolean;
  onClose: () => void;
  payrunId: number;
  onToast: (message: string, color?: "success" | "error" | "info" | "warning") => void;
}

const payoutColumns: StandardTableColumn[] = [
  { id: "employeeName", label: "Employee Name", minWidth: 160 },
  { id: "accountName", label: "Beneficiary Name", minWidth: 170, render: (row: PayoutExportRow) => row.accountName ?? "-" },
  { id: "accountNumber", label: "Beneficiary Account Number", minWidth: 190, render: (row: PayoutExportRow) => row.accountNumber ?? "-" },
  { id: "ifsc", label: "IFSC", minWidth: 120, render: (row: PayoutExportRow) => row.ifsc ?? "-" },
  {
    id: "netPay",
    label: "Amount",
    align: "right",
    headerAlign: "right",
    minWidth: 120,
    render: (row: PayoutExportRow) => Number(row.netPay ?? 0).toLocaleString("en-IN"),
  },
  { id: "currency", label: "Currency", minWidth: 90 },
  { id: "email", label: "Beneficiary Email ID", minWidth: 200, render: (row: PayoutExportRow) => row.email ?? "-" },
  { id: "remarks", label: "Remarks", minWidth: 180, render: (row: PayoutExportRow) => row.remarks ?? "-" },
];

type EditablePayoutField = "accountName" | "accountNumber" | "ifsc" | "currency" | "remarks";

export function PayoutReportModal({ open, onClose, payrunId, onToast }: PayoutReportModalProps) {
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(dayjs());
  const [rows, setRows] = useState<PayoutExportRow[]>([]);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(
    payoutColumns.map((col) => String(col.id))
  );
  const [fetchPreview, { isLoading: isFiltering }] = useGetPayoutReportPreviewMutation();
  const [downloadReport, { isLoading: isExporting }] = useDownloadPayoutReportMutation();

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const data = await fetchPreview(payrunId).unwrap();
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setTransactionDate(data.payableDate ? dayjs(data.payableDate) : dayjs());
      } catch {
        setRows([]);
        setTransactionDate(dayjs());
      }
    })();
  }, [open, payrunId, fetchPreview]);

  const mappedRows = useMemo(
    () =>
      rows.map((row, index) => ({
        id: `${row.employeeId ?? row.employeeName}-${index}`,
        __index: index,
        ...row,
      })),
    [rows]
  );
  const handleEditableCellChange = (rowIndex: number, field: EditablePayoutField, value: string) => {
    setRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };
  const visibleColumns = useMemo(
    () =>
      payoutColumns
        .filter((col) => visibleColumnIds.includes(String(col.id)))
        .map((col) => {
          if (
            col.id === "accountName" ||
            col.id === "accountNumber" ||
            col.id === "ifsc" ||
            col.id === "currency" ||
            col.id === "remarks"
          ) {
            const field = col.id as EditablePayoutField;
            return {
              ...col,
              render: (row: PayoutExportRow & { __index: number }) => (
                <TextField
                  size="small"
                  fullWidth
                  variant="outlined"
                  value={(row[field] as string | null) ?? "-"}
                  onChange={(event) =>
                    handleEditableCellChange(row.__index, field, event.target.value)
                  }
                  sx={{ mt: 1 }}
                  inputProps={{ style: {padding: "6px 8px", fontSize: "0.875rem" } }}
                />
              ),
            };
          }
          return col;
        }),
    [visibleColumnIds]
  );

  const toggleColumn = (columnId: string) => {
    setVisibleColumnIds((prev) => {
      if (prev.includes(columnId)) {
        // Keep at least one column visible.
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  };

  const handleExport = async () => {
    try {
      const exportRows = rows.map((row) => ({
        ...row,
        accountName: row.accountName ?? "-",
        accountNumber: row.accountNumber ?? "-",
        ifsc: row.ifsc ?? "-",
        email: row.email ?? "-",
        remarks: row.remarks ?? "-",
      }));
      const { blob, fileName } = await downloadReport({ payrunId, rows: exportRows }).unwrap();

      // Prefer Content-Disposition (requires Access-Control-Expose-Headers).
      // Otherwise match backend format, e.g. "May 2026 - Payout Report.xlsx"
      let resolvedFileName = fileName;
      if (!fileName || fileName.startsWith("payout-report-")) {
        const period = transactionDate?.format("MMMM YYYY") ?? dayjs().format("MMMM YYYY");
        resolvedFileName = `${period} - Payout Report.xlsx`;
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resolvedFileName;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
      onToast("Payout report exported successfully.", "success");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string; error?: string };
      onToast(
        e?.data?.message ?? e?.message ?? e?.error ?? "Failed to export payout report.",
        "error"
      );
    }
  };

  return (
    <ModalElement open={open} onClose={onClose} title="Payout Export Preview" maxWidth="xl">
        <Box sx={{ position: "relative" }}>
          {(isFiltering || isExporting) && (
            <LinearProgress
              sx={{ position: "absolute", left: 0, right: 0, top: -8, borderRadius: 1 }}
            />
          )}

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
              Transaction date *
            </Typography>
            <DatePickerElement
              label=""
              value={transactionDate}
              onChange={setTransactionDate}
              format="MMM DD, YYYY"
              width={220}
            />
            <PrimaryButton
              variant="contained"
              size="small"
              startIcon={<FilterAltIcon />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
            >
              Filter
            </PrimaryButton>
            <MenuAtom
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onCloseAll={() => setFilterAnchor(null)}
              width={290}
              items={payoutColumns.map((col) => {
                const id = String(col.id);
                const checked = visibleColumnIds.includes(id);
                return {
                  disableAutoClose: true,
                  render: () => (
                    <Box sx={{ width: "100%", px: 0.5 }}>
                      <Checkbox
                        label={col.label}
                        checked={checked}
                        onChange={() => toggleColumn(id)}
                      />
                    </Box>
                  ),
                };
              })}
            />
          </Box>

          <StandardTable
            sticky
            columns={visibleColumns}
            rows={mappedRows}
            emptyMessage="No data available in table"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              // borderRadius: 1.5,
              maxHeight: "min(52vh, 420px)",
              overflow: "auto",
            }}
          />

          {/* {rows.length === 0 && !isFiltering ? (
            <Alert severity="info" icon={false} sx={{ mt: 1.5 }}>
              No payout rows found. Choose transaction date and click Filter.
            </Alert>
          ) : null} */}

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <PrimaryButton
              variant="contained"
              size="small"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExport}
              disabled={isExporting || rows.length === 0}
            >
              {isExporting ? "Exporting..." : "Export as XLSX"}
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>
  );
}
