import { Card, CardContent, IconButton, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";

import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { GroupedTable } from "../../../../../components/tables/standard-table";

import {
    ArrowBack,
    IosShare,
    PictureAsPdf,
    TableChart,
    Settings,
} from "@mui/icons-material";

import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import type { GridColDef } from "@mui/x-data-grid";

import {
    useLazyGetInvoiceSummaryQuery,
    useLazyExportInvoiceSummaryQuery,
} from "../../api/insights.api";

import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import { useToggleMutation } from "../../../coa/account/api/accounts.api";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

function InvoiceSummary() {
    const { data: headerData } = useGetHeaderDataQuery();
    const [toggle] = useToggleMutation();

    const commaSeparation =
        (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
    const currency =
        headerData?.data?.reportingCurrency?.split(" - ")[0] || "₹";

    const [fromDate, setFromDate] = useState<Dayjs | null>(null);
    const [toDate, setToDate] = useState<Dayjs | null>(null);

    const [settingsAnchorEl, setSettingsAnchorEl] =
        useState<null | HTMLElement>(null);
    const [exportAnchorEl, setExportAnchorEl] =
        useState<null | HTMLElement>(null);

    const [decimalPlaces, setDecimalPlaces] = useState(true);

    const isInitialLoad = useRef(true);

    const [getInvoiceSummary, { data, isFetching }] =
        useLazyGetInvoiceSummaryQuery();

    const [exportInvoiceSummary] =
        useLazyExportInvoiceSummaryQuery();

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const showSnack = (message: string, color: "success" | "error") =>
        setSnackbar({ open: true, message, color });

    const formatValue = (val: number) => {
        if (decimalPlaces)
            return formatCurrencyByCommaSeparation(
                val,
                commaSeparation,
                currency,
                true
            );

        return formatCurrencyByCommaSeparation(
            val,
            commaSeparation,
            currency,
            true
        ).split(".")[0];
    };

    // Initial load
    useEffect(() => {
        const start = dayjs().startOf("year");
        const end = dayjs().endOf("year");

        setFromDate(start);
        setToDate(end);

        getInvoiceSummary({
            fromDate: start.format("YYYY-MM-DD"),
            toDate: end.format("YYYY-MM-DD"),
        });
    }, []);

    // Fetch when date changes
    useEffect(() => {
        if (!fromDate || !toDate) return;
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const timer = setTimeout(() => {
            getInvoiceSummary({
                fromDate: fromDate.format("YYYY-MM-DD"),
                toDate: toDate.format("YYYY-MM-DD"),
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [fromDate, toDate]);

    useEffect(() => {
        if (!data?.data) return;

        setDecimalPlaces(data.data.decimalPlace ?? true);
    }, [data]);

    const handleSettingsOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSettingsAnchorEl(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setSettingsAnchorEl(null);
    };

    const handleExport = async (type: "excel" | "pdf") => {
        try {
            await exportInvoiceSummary({
                fromDate: fromDate?.format("YYYY-MM-DD"),
                toDate: toDate?.format("YYYY-MM-DD"),
                exportType: type,
            }).unwrap();

            showSnack("Export completed successfully", "success");
            setExportAnchorEl(null);
        } catch (error: any) {
            showSnack(error?.data?.message || "Export failed", "error");
        }
    };

    const groupedRows = useMemo(() => {
        if (!data?.data) return [];

        const {
            invoiceList,
            totalInvoiceAmountWithTds,
            totalInvoiceAmount,
            zeroBalance,
        } = data.data;

        const filteredInvoices = zeroBalance
            ? invoiceList
            : invoiceList.filter(
                (inv: any) =>
                    inv.invoiceAmountWithTds !== 0 ||
                    inv.invoiceAmount !== 0
            );

        const items = filteredInvoices.map((inv: any) => ({
            id: String(inv.contactId) + "-inv",
            invoiceDate: dayjs(inv.invoiceDate).format("MMM DD, YYYY"),
            invoiceNo: inv.invoiceNo,
            invoiceTo: inv.contactName,
            totalWithTds: inv.invoiceAmountWithTds,
            total: inv.invoiceAmount,
            accountType: "Contact" as const,
            _isTotal: false,
        }));

        const totalRow = {
            id: "total-row",
            invoiceDate: "",
            invoiceNo: "",
            invoiceTo: "Total",
            totalWithTds: totalInvoiceAmountWithTds,
            total: totalInvoiceAmount,
            _isTotal: true,
        };

        return [
            {
                groupName: "",
                items: [...items, totalRow],
            },
        ];
    }, [data]);

    const columns: GridColDef[] = [
        {
            field: "invoiceTo",
            headerName: "Invoice To",
            flex: 1,
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {row.invoiceTo}
                </Box>
            ),
        },
        {
            field: "invoiceDate",
            headerName: "Invoice Date",
            flex: 1,
        },
        {
            field: "invoiceNo",
            headerName: "Invoice No.",
            flex: 1,
        },
        {
            field: "totalWithTds",
            headerName: "Invoice Total including TDS",
            align: "right",
            headerAlign: "right",
            flex: 1,
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.totalWithTds ?? 0)}
                </Box>
            ),
        },
        {
            field: "total",
            headerName: "Invoice Total",
            align: "right",
            headerAlign: "right",
            flex: 1,
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.total ?? 0)}
                </Box>
            ),
        },
    ];

    return (
        <Card sx={{ mt: 1 }}>
            <CardContent sx={{ pt: 2.5, height: "calc(100vh - 150px)" }}>
                {/* Header */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    pb={1}
                >
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <IconButton
                            onClick={() => window.history.back()}
                            sx={{ pl: 0 }}
                        >
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6">
                            Invoice Summary
                        </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1}>
                        <DateRangePicker
                            label="Date Range"
                            startValue={fromDate}
                            endValue={toDate}
                            onChange={([start, end]) => {
                                setFromDate(start);
                                setToDate(end);
                            }}
                            width={300}
                        />

                        <Box
                            sx={{ width: "1px", height: 40, backgroundColor: "divider" }}
                        />

                        <Box sx={{ display: "flex", gap: 1 }}>
                            <PermissionGuard permission="export_insights">

                                <PrimaryIconButton
                                    title="Export"
                                    icon={<IosShare />}
                                    onClick={(e) => setExportAnchorEl(e.currentTarget)}
                                />
                            </PermissionGuard >

                            <PrimaryIconButton
                                title="Settings"
                                icon={<Settings />}
                                onClick={handleSettingsOpen}
                            />
                        </Box>
                    </Stack>
                </Stack>
                <Box display={"flex"} justifyContent={"end"} gap={1}>
                    <MenuAtom
                        anchorEl={settingsAnchorEl}
                        open={Boolean(settingsAnchorEl)}
                        onCloseAll={handleSettingsClose}
                        items={[
                            {
                                render: () => (
                                    <ToggleSwitch
                                        label="Decimal Places"
                                        checked={decimalPlaces}
                                        onChange={async () => {
                                            try {
                                                await toggle({
                                                    reportDecimalPlace: !decimalPlaces,
                                                }).unwrap();
                                                setDecimalPlaces(!decimalPlaces);
                                                handleSettingsClose();
                                            } catch (error: any) {
                                                showSnack(
                                                    error.data.message ?? "its an error",
                                                    "error",
                                                );
                                            }
                                        }}
                                    />
                                ),
                            },
                        ]}
                    />
                </Box>

                {/* Export Menu */}
                <MenuAtom
                    anchorEl={exportAnchorEl}
                    open={Boolean(exportAnchorEl)}
                    onCloseAll={() => setExportAnchorEl(null)}
                    items={[
                        {
                            render: () => (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="center"
                                    width="100%"
                                    onClick={() => handleExport("excel")}
                                >
                                    <TableChart color="secondary" />
                                    <Typography width="100%" align="center">
                                        Excel
                                    </Typography>
                                </Stack>
                            ),
                        },
                        {
                            render: () => (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="center"
                                    width="100%"
                                    onClick={() => handleExport("pdf")}
                                >
                                    <PictureAsPdf color="secondary" />
                                    <Typography width="100%" align="center">
                                        PDF
                                    </Typography>
                                </Stack>
                            ),
                        },
                    ]}
                />

                {/* Table */}
                <GroupedTable
                    expandAll
                    useDepth={false}
                    columns={columns}
                    groupedRows={groupedRows}
                    loading={isFetching}
                    tableHeight="calc(80vh - 180px)"
                    dateFrom={fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined}
                    dateTo={toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined}
                />

                {snackbar.open && (
                    <Snackbar
                        message={snackbar.message}
                        color={snackbar.color}
                        onClose={() =>
                            setSnackbar({
                                open: false,
                                message: "",
                                color: "success",
                            })
                        }
                    />
                )}
            </CardContent>
        </Card>
    );
}

export default InvoiceSummary;