import { useParams } from "react-router-dom";
import {
  Stack,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  type AlertColor,
} from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DownloadIcon from "@mui/icons-material/Download";
import dayjs from "dayjs";
import { useGetPayslipsQuery, type PayslipDate } from "../../../api/empdocs.api";
import type { StandardTableColumn } from "../../../../../../../../types/types";
import { StandardTable } from "../../../../../../../../components/tables/standard-table";
import { useDownloadPayslipExportMutation } from "../../../../../../salary/payrun/runpayroll/api/payrun.api";
import { Snackbar } from "../../../../../../../../components/atom/snackbar";
import { PayslipModal } from "../../../../../../salary/payrun/runpayroll/components/PayslipModal";

export default function PayslipView({ empId }: { empId?: number }) {
  const { id } = useParams<{ id: string }>();
  const employeeId = empId ?? Number(id);
  const hasValidEmployeeId = !isNaN(employeeId);

  const { data, isLoading } = useGetPayslipsQuery(
    { employeeId },
    { skip: !hasValidEmployeeId }
  );

  const [downloadPayslipExport, { isLoading: isDownloadingPayslip }] =
    useDownloadPayslipExportMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDate | null>(null);

  const [message, setMessage] = useState<{ type: AlertColor; text: string } | null>(null);

  const handleOpenPayslip = (row: PayslipDate) => {
    setSelectedPayslip(row);
    setModalOpen(true);
  };

  const handleDownloadPayslip = async (row?: { payableDate: string; payrunId: number; monthlyGross: number; }) => {
    if (!hasValidEmployeeId || !data) return;
    setMessage(null);
    try {
      const { blob, fileName } = await downloadPayslipExport({
        payrunId: row!.payrunId,
        employeeId: Number(employeeId),
        history: false,
      }).unwrap();

      // Prefer the filename from content-disposition header (if CORS exposes it).
      // Otherwise construct from the row's payable date to match the backend format.
      let resolvedFileName = fileName;
      if (!fileName || fileName.startsWith("payslip-")) {
        const period = dayjs(row!.payableDate).format("MMMM YYYY");
        resolvedFileName = `${period}-payslip.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resolvedFileName;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string; error?: string };
      setMessage({
        type: "error",
        text: e?.data?.message ?? e?.message ?? e?.error ?? "Failed to download payslip.",
      });
    }
  };

  const rows =
    data?.data?.map((item, index) => ({
      id: index,
      paymentDate: dayjs(item.payableDate).format("MMM DD, YYYY"),
      month: dayjs(item.payableDate).format("MMMM YYYY"),
      grossPay: `₹${item.monthlyGross.toLocaleString("en-IN")}`,
      _raw: item,
    })) ?? [];

  const columns: StandardTableColumn[] = [
    { id: "paymentDate", label: "Payment Date" },
    { id: "month", label: "Month", align: "center" },
    { id: "grossPay", label: "Gross Pay", align: "center" },
    {
      id: "payslips",
      label: "Payslips",
      align: "center",
      render: (row: any) => (
        <Tooltip title="View Payslip" placement="top">
          <IconButton size="small" onClick={() => handleOpenPayslip(row._raw)} color="primary">
            <ReceiptLongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      id: "download",
      label: "Download",
      align: "center",
      render: (row: any) => (
        <Tooltip title="Download Payslip" placement="top">
          <IconButton
            size="small"
            color="primary"
            disabled={isDownloadingPayslip}
            onClick={() => handleDownloadPayslip(row._raw)}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <>
      {message && (
        <Snackbar
          message={message.text}
          color={message.type}
          onClose={() => setMessage(null)}
        />
      )}
      <Stack spacing={1}>
        <Typography variant="h6" color="textPrimary">
          Payslips
        </Typography>
        <Box sx={{ maxHeight: "calc(100vh - 425px)", overflowY: "auto" }}>
          <StandardTable rows={rows} columns={columns} sticky />
        </Box>
      </Stack>

      <PayslipModal
        employeeId={employeeId}
        open={modalOpen}
        disableDownload={true}
        onClose={() => setModalOpen(false)}
        payrunId={selectedPayslip?.payrunId ?? 0}
        readOnlyIncomeTax
      />
    </>
  );
}