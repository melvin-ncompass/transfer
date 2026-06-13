import { Card, CardContent, CircularProgress, IconButton, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import dayjs, { type Dayjs } from "dayjs";

import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { GroupedTable } from "../../../../../components/tables/standard-table";
import type { ContactBillData, ContactData, ContactInvData, ContactJournalData } from "../../../coa/types/coa.types";

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
    useLazyGetContactBalanceSummaryQuery,
    useLazyGetContactBalanceSummaryDetailedQuery,
    useLazyExportContactBalanceSummaryQuery,
} from "../../api/insights.api";

import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import { useToggleMutation } from "../../../coa/account/api/accounts.api";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

function ContactBalanceSummary() {
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
    const [detailedView, setDetailedView] = useState(false);
    const [zeroBalance, setZeroBalance] = useState(false);

    const isInitialLoad = useRef(true);

    const [getContactBalanceSummary, { data: simpleData, isFetching: simpleFetching }] =
        useLazyGetContactBalanceSummaryQuery();

    const [getContactBalanceSummaryDetailed, { data: detailedData, isFetching: detailedFetching }] =
        useLazyGetContactBalanceSummaryDetailedQuery();

    const [exportContactBalanceSummary] =
        useLazyExportContactBalanceSummaryQuery();

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

        getContactBalanceSummary({
            fromDate: start.format("YYYY-MM-DD"),
            toDate: end.format("YYYY-MM-DD"),
        });
    }, []);

    // Fetch when date changes or view toggles
    useEffect(() => {
        if (!fromDate || !toDate) return;
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (detailedView) {
                getContactBalanceSummaryDetailed({
                    fromDate: fromDate.format("YYYY-MM-DD"),
                    toDate: toDate.format("YYYY-MM-DD"),
                    isDetailedView: true,
                });
            } else {
                getContactBalanceSummary({
                    fromDate: fromDate.format("YYYY-MM-DD"),
                    toDate: toDate.format("YYYY-MM-DD"),
                });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [fromDate, toDate, detailedView]);

    useEffect(() => {
        const activeData = detailedView ? detailedData : simpleData;
        if (!activeData?.data) return;

        setDecimalPlaces(activeData.data.decimalPlace ?? true);
        setZeroBalance(activeData.data.zeroBalance ?? false);
    }, [simpleData, detailedData, detailedView]);

    const handleSettingsOpen = (event: MouseEvent<HTMLButtonElement>) => {
        setSettingsAnchorEl(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setSettingsAnchorEl(null);
    };

    const handleExport = async (type: "excel" | "pdf") => {
        try {
            await exportContactBalanceSummary({
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

    const groupedRowsSimple = useMemo(() => {
        if (!simpleData?.data) return [];

        const {
            contactData,
            totalContactBalance,
            zeroBalance,
        } = simpleData.data;

        const filteredContacts = zeroBalance
            ? contactData
            : contactData.filter((contact: ContactData) => contact.balanceAmount !== 0);

        if (!filteredContacts?.length) return [];

        const items = filteredContacts.map((contact: ContactData) => ({
            id: contact.id.toString(),
            contactName: contact.name,
            balanceAmount: contact.balanceAmount,
            accountType: "Contact" as const,
            _isTotal: false,
        }));

        return [
            {
                groupName: "",
                items: [...items, { id: "total-row", contactName: "Total", balanceAmount: totalContactBalance, _isTotal: true }],
            },
        ];
    }, [simpleData]);

    const groupedRowsReceivables = useMemo(() => {
        if (!detailedData?.data) return [];

        const {
            contactInvData,
            totalInvoicedAmount,
            totalAmountReceived,
        } = detailedData.data;

        if (!contactInvData?.length) return [];

        return [
            {
                groupName: "",
                items: [
                    ...contactInvData.map((inv: ContactInvData) => ({
                        id: String(inv.id) + "-inv",
                        contactName: inv.name,
                        invoicedAmount: inv.invoicedAmount,
                        amountReceived: inv.amountReceived,
                        accountType: "Contact" as const,
                        _isTotal: false,
                    })),
                    {
                        id: "total-inv",
                        contactName: "Total",
                        invoicedAmount: totalInvoicedAmount,
                        amountReceived: totalAmountReceived,
                        _isTotal: true
                    },
                ],
            },
        ];
    }, [detailedData]);

    const groupedRowsPayables = useMemo(() => {
        if (!detailedData?.data) return [];

        const {
            contactBillData,
            totalBilledAmount,
            totalAmountPaid,
        } = detailedData.data;

        if (!contactBillData?.length) return [];

        return [
            {
                groupName: "",
                items: [
                    ...contactBillData.map((bill: ContactBillData) => ({
                        id: String(bill.id) + "-bill",
                        contactName: bill.name,
                        billedAmount: bill.billedAmount,
                        amountPaid: bill.amountPaid,
                        accountType: "Contact" as const,
                        _isTotal: false,
                    })),
                    {
                        id: "total-bill",
                        contactName: "Total",
                        billedAmount: totalBilledAmount,
                        amountPaid: totalAmountPaid,
                        _isTotal: true,
                    },
                ],
            },
        ];
    }, [detailedData]);

    const groupedRowsJournal = useMemo(() => {
        if (!detailedData?.data) return [];

        const {
            contactJournalData,
            totalJournalDebit,
            totalJournalCredit
        } = detailedData.data;

        if (!contactJournalData?.length) return [];

        return [
            {
                groupName: "",
                items: [
                    ...contactJournalData.map((journal: ContactJournalData) => ({
                        id: String(journal.id) + "-journal",
                        contactName: journal.name,
                        totalDebit: journal.totalDebit,
                        totalCredit: journal.totalCredit,
                        accountType: "Contact" as const,
                        _isTotal: false,
                    })),
                    {
                        id: "total-journal",
                        contactName: "Total",
                        totalDebit: totalJournalDebit,
                        totalCredit: totalJournalCredit,
                        _isTotal: true
                    },
                ],
            },
        ];
    }, [detailedData]);

    const columnsSimple: GridColDef[] = [
        {
            field: "contactName",
            headerName: "Contact Name",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {row.contactName}
                </Box>
            ),
        },
        {
            field: "balanceAmount",
            headerName: "Contact Balance",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.balanceAmount ?? 0)}
                </Box>
            ),
        },
    ];

    const columnsReceivables: GridColDef[] = [
        {
            field: "contactName",
            headerName: "Contact Name",
        },
        {
            field: "invoicedAmount",
            headerName: "Receivable Amount",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.invoicedAmount ?? 0)}
                </Box>
            ),
        },
        {
            field: "amountReceived",
            headerName: "Amount Received",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.amountReceived ?? 0)}
                </Box>
            ),
        },
    ];

    const columnsPayables: GridColDef[] = [
        {
            field: "contactName",
            headerName: "Contact Name",
        },
        {
            field: "billedAmount",
            headerName: "Payable Amount",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.billedAmount ?? 0)}
                </Box>
            ),
        },
        {
            field: "amountPaid",
            headerName: "Amount Paid",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.amountPaid ?? 0)}
                </Box>
            ),
        },
    ];

    const columnsJournal: GridColDef[] = [
        {
            field: "contactName",
            headerName: "Contact Name",
        },
        {
            field: "totalDebit",
            headerName: "Debit",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.totalDebit ?? 0)}
                </Box>
            ),
        },
        {
            field: "totalCredit",
            headerName: "Credit",
            align: "right",
            headerAlign: "right",
            renderCell: (row: any) => (
                <Box fontWeight={row._isTotal ? 600 : "normal"}>
                    {formatValue(row.totalCredit ?? 0)}
                </Box>
            ),
        },
    ];

    const isFetching = detailedView ? detailedFetching : simpleFetching;

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
                            Contact Balance Summary
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
                            </PermissionGuard>
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
                                        label="Zero Balance"
                                        checked={zeroBalance}
                                        onChange={async () => {
                                            try {
                                                await toggle({
                                                    reportZeroBalance: !zeroBalance,
                                                }).unwrap();
                                                setZeroBalance(!zeroBalance);
                                                handleSettingsClose();
                                            } catch (error: any) {
                                                showSnack(
                                                    error.data.message ?? "Its an error",
                                                    "error",
                                                );
                                            }
                                        }}
                                    />
                                ),
                            },
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
                                                    error.data.message ?? "Its an error",
                                                    "error",
                                                );
                                            }
                                        }}
                                    />
                                ),
                            },
                            {
                                render: () => (
                                    <ToggleSwitch
                                        label="Detailed View"
                                        checked={detailedView}
                                        onChange={() => {
                                            setDetailedView(!detailedView);
                                            handleSettingsClose();
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

                {/* Tables - Simple View */}
                {!detailedView && (
                    <Box sx={{ position: "relative" }}>
                        {isFetching && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === "light"
                                            ? "rgba(255,255,255,1)"
                                            : "rgba(18,18,18,1)",
                                    borderRadius: 1,
                                    minHeight: 200,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        )}
                        <GroupedTable
                            expandAll
                            useDepth={false}
                            columns={columnsSimple}
                            groupedRows={groupedRowsSimple}
                            tableHeight="calc(80vh - 160px)"
                            dateFrom={fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined}
                            dateTo={toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined}
                        />
                    </Box>
                )}

                {/* Tables - Detailed View */}
                {detailedView && (
                    <Box sx={{ position: "relative", minHeight: 200 }}>
                        {isFetching || !detailedData ? (
                            <Stack height={200} alignItems="center" justifyContent="center">
                                <CircularProgress />
                            </Stack>
                        ) : (
                            <Stack gap={2} sx={{ overflowY: "auto", maxHeight: "calc(80vh - 100px)" }}>
                                {!isFetching && detailedData && groupedRowsReceivables.length === 0 && groupedRowsPayables.length === 0 && groupedRowsJournal.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: "center" }}>
                                        <Typography color="textSecondary">
                                            No data available for the selected date range
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                                Receivables Summary
                                            </Typography>
                                            <GroupedTable
                                                expandAll
                                                useDepth={false}
                                                columns={columnsReceivables}
                                                groupedRows={groupedRowsReceivables}
                                                dateFrom={fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined}
                                                dateTo={toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                                Payables Summary
                                            </Typography>
                                            <GroupedTable
                                                expandAll
                                                useDepth={false}
                                                columns={columnsPayables}
                                                groupedRows={groupedRowsPayables}
                                                dateFrom={fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined}
                                                dateTo={toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                                Journal Summary
                                            </Typography>
                                            <GroupedTable
                                                expandAll
                                                useDepth={false}
                                                columns={columnsJournal}
                                                groupedRows={groupedRowsJournal}
                                                dateFrom={fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined}
                                                dateTo={toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined}
                                            />
                                        </Box>
                                    </>
                                )
                                }

                            </Stack>
                        )}
                    </Box>
                )}

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

export default ContactBalanceSummary;