import {
    Stack,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress,
    type AlertColor,
} from "@mui/material";
import { Box } from "@mui/system";
import { useParams } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useState } from "react";
import dayjs from "dayjs";
import type { StandardTableColumn } from "../../../../../../../../types/types";
import { StandardTable } from "../../../../../../../../components/tables/standard-table";
import { useGetPayslipsQuery } from "../../../api/empdocs.api";
import { useDownloadTdsSheetMutation } from "../../../../../../salary/payrun/runpayroll/api/payrun.api";
import { Snackbar } from "../../../../../../../../components/atom/snackbar";
import TdsModal from "./TdsModal";

export default function TdsView({ empId }: { empId: number }) {
    const { id } = useParams<{ id: string }>();
    const employeeId = empId ?? Number(id);
    const hasValidEmployeeId = !isNaN(employeeId);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTds, setSelectedTds] = useState<any | null>(null);

    const { data, isLoading } = useGetPayslipsQuery(
        { employeeId },
        { skip: !id || !hasValidEmployeeId }
    );

    const [downloadTdsExport, { isLoading: isDownloadingTdsSheet }] =
        useDownloadTdsSheetMutation();

    const [message, setMessage] = useState<{ type: AlertColor; text: string } | null>(null);

    const handleDownloadTds = async (row?: { payableDate: string; payrunId: number; monthlyGross: number }) => {
        if (!hasValidEmployeeId || !data) return;
        setMessage(null);
        try {
            const { blob, fileName } = await downloadTdsExport({
                payrunId: row!.payrunId,
                employeeId: Number(employeeId),
            }).unwrap();

            // Prefer server filename from content-disposition, fall back to constructed name.
            // Format: "FY-2026-2027.pdf"
            let resolvedFileName = fileName;
            if (!fileName || fileName.startsWith("tds-sheet-")) {
                const d = dayjs(row!.payableDate);
                const month = d.month() + 1;
                const year = d.year();
                const fyStart = month >= 4 ? year : year - 1;
                resolvedFileName = `FY-${fyStart}-${fyStart + 1}.pdf`;
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
                text: e?.data?.message ?? e?.message ?? e?.error ?? "Failed to download TDS sheet.",
            });
        }
    };

    const handleOpenTds = (row: any) => {
        setSelectedTds(row);
        setModalOpen(true);
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
        {
            id: "tds",
            label: "TDS",
            align: "center",
            render: (row: any) => (
                <Tooltip title="View Payslip" placement="top">
                    <IconButton size="small" onClick={() => handleOpenTds(row._raw)} color="primary">
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
                <Tooltip title="Download TDS" placement="top">
                    <IconButton
                        size="small"
                        color="primary"
                        disabled={isDownloadingTdsSheet}
                        onClick={() => handleDownloadTds(row._raw)}
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
                    TDS
                </Typography>
                <Box sx={{ maxHeight: "calc(100vh - 425px)", overflowY: "auto" }}>
                    <StandardTable rows={rows} columns={columns} sticky />
                </Box>
            </Stack>
            <TdsModal
                employeeId={employeeId}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                payrunId={selectedTds?.payrunId ?? null}
            />
        </>
    );
}