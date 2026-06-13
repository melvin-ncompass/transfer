import { Box, Stack } from "@mui/system";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SearchBoxAtom } from "../../../../../../components/searchbar/SearchBoxAtom";
import { useState, useMemo, useEffect } from "react";
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { Chip } from "../../../../../../components/atom/chips";
import { Checkbox } from "../../../../../../components/atom/check-box";
import {
    useGetOrganizationDocumentAcknowledgementQuery,
    useLazyGetOrganizationAcknowledgementExportQuery,
    useNotifyOrganizationDocumentMutation,
} from "../api/organization.api";
import { formatDateShort } from "../../../../../../utils/numberFormatter";
import SendIcon from '@mui/icons-material/Send';
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { Badge } from "@mui/material";
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import type { ChipProps, StandardTableColumn } from "../../../../../../types/types";

export const EmployeeAckListModal = ({ open, onClose, documentId, documentName, acknowledgementRequired }: {
    open: boolean,
    onClose: () => void,
    documentId?: number,
    documentName?: string,
    acknowledgementRequired?: boolean
}) => {

    const [openFilter, setOpenFilter] = useState(false);
    const [filterAcknowledged, setFilterAcknowledged] = useState(false);
    const [filterNotAcknowledged, setFilterNotAcknowledged] = useState(false);
    const [filterViewedNotAcknowledged, setFilterViewedNotAcknowledged] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<string | undefined>(undefined);

    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [searchKey, setSearchKey] = useState(0);
    const [isSearching, setIsSearching] = useState(false);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "warning" | "info"
    }>({ open: false, message: "", severity: "success" });

    const showReminderActions = acknowledgementRequired;

    const {
        data: ackData,
        isFetching: isFetchingEmployee,
        isLoading: isLoadingEmployee
    } = useGetOrganizationDocumentAcknowledgementQuery(
        {
            id: documentId!,
            status: appliedFilters
        },
        {
            skip: !documentId || !open,
            refetchOnMountOrArgChange: true
        }
    );

    const isLoading = isFetchingEmployee || isLoadingEmployee;

    const [getAcknowledgementExport, { isFetching: isExporting }] = useLazyGetOrganizationAcknowledgementExportQuery();
    const [notify] = useNotifyOrganizationDocumentMutation();

    const handleExport = async () => {
        if (!documentId) return;
        try {
            const blob = await getAcknowledgementExport({ id: documentId }).unwrap();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Employee Acknowledgement List ${documentName}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export acknowledgement data", error);
        }
    };

    const formattedData = useMemo(() => {
        if (!ackData?.data?.acknowledgements) return [];
        return ackData.data.acknowledgements.map(ack => ({
            id: ack.employee?.id,
            empID: ack.employee?.employeeId,
            name: ack.employee?.contact?.name,
            jobTitle: ack.employee?.designation?.designationName || '-',
            status: ack.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            acknowledgedDate: ack.acknowledgedAt ? formatDateShort(ack.acknowledgedAt) : '-',
            fileAccessedOn: ack.fileAccessedAt ? formatDateShort(ack.fileAccessedAt) : '-',
        }));
    }, [ackData]);

    // Reset filtered employees when formatted data changes
    useEffect(() => {
        setFilteredEmployees(formattedData);
    }, [formattedData]);

    const visibleIds: number[] = filteredEmployees.map((r) => r.id);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const isIndeterminate = !isAllSelected && visibleIds.some((id) => selectedIds.has(id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                visibleIds.forEach((id) => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                visibleIds.forEach((id) => next.add(id));
                return next;
            });
        }
    };

    const toggleRow = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleRemind = async (id?: number) => {
        if (!documentId) return;
        const employeeIds = id ? [id] : Array.from(selectedIds);
        if (employeeIds.length === 0) return;

        try {
            await notify({ documentId, body: { employeeId: employeeIds } }).unwrap();
            setSnackbar({
                open: true,
                message: "Reminder sent successfully",
                severity: "success",
            });
            if (!id) setSelectedIds(new Set());
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.data?.message || "Failed to remind employees",
                severity: "error",
            });
        }
    };

    useEffect(() => {
        if (!open) {
            setAppliedFilters(undefined);
            setFilterAcknowledged(false);
            setFilterNotAcknowledged(false);
            setFilterViewedNotAcknowledged(false);
            setSelectedIds(new Set());
            setFilteredEmployees([]);
        }
    }, [open]);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [appliedFilters]);

    const selectionColumn: StandardTableColumn[] = showReminderActions
        ? [
            {
                id: "select",
                label: "",
                width: '5%',
                render: (row: any) => (
                    <Checkbox
                        label=""
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                    />
                ),
            }
        ]
        : [];

    const actionColumn: StandardTableColumn[] = showReminderActions
        ? [
            {
                id: "actions",
                label: "Actions",
                align: "center",
                width: '10%',
                render: (row: any) => (
                    <PrimaryIconButton
                        variant="outlined"
                        size="small"
                        disabled={row.status === 'Acknowledged'}
                        title="Remind"
                        onClick={() => handleRemind(row.id)}
                        icon={<SendIcon />}
                    />
                )
            }
        ]
        : [];

    const columns: StandardTableColumn[] = [
        ...selectionColumn,
        {
            id: "empID",
            label: "Employee ID"
        },
        {
            id: "name",
            label: "Employee Name",
        },
        {
            id: "jobTitle",
            label: "Job Title",
        },
        {
            id: "status",
            label: "Status",
            align: "center",
            render(row) {
                const chipProps: { label: string; color: ChipProps['color'] } = (() => {
                    if (row.status === 'Acknowledged') {
                        return {
                            label: acknowledgementRequired ? 'Acknowledged' : 'Viewed',
                            color: 'success'
                        };
                    }

                    if (row.status === 'Not Acknowledged') {
                        return {
                            label: 'Not Viewed',
                            color: acknowledgementRequired ? 'error' : 'secondary'
                        };
                    }

                    if (row.status === 'Viewed Not Acknowledged') {
                        return {
                            label: 'Viewed',
                            color: 'success'
                        };
                    }

                    return {
                        label: row.status ?? '',
                        color: 'secondary'
                    };
                })();

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Chip
                            {...chipProps}
                            size="xs"
                            sx={{ textAlign: "center", width: 'auto' }}
                        />
                    </Box>
                );
            },
        },
        {
            id: "acknowledgedDate",
            label: "Acknowledged Date",
            align: "center"
        },
        {
            id: "fileAccessedOn",
            label: "File Accessed On",
            align: "center"
        },
        ...actionColumn
    ];

    const handleApplyFilter = () => {
        const statuses: string[] = [];
        if (filterAcknowledged) statuses.push("acknowledged");
        if (filterNotAcknowledged) statuses.push("not_acknowledged");
        if (filterViewedNotAcknowledged) statuses.push("viewed_not_acknowledged");
        setAppliedFilters(statuses.length > 0 ? statuses.join(",") : undefined);
        setOpenFilter(false);
    };

    const selectedCount = selectedIds.size;
    const remindLabel = selectedCount > 0 ? `Remind (${selectedCount})` : "Remind All";
    const appliedFilterCount = appliedFilters ? appliedFilters.split(',').length : 0;

    const isAllFilterSelected = filterAcknowledged && filterNotAcknowledged && filterViewedNotAcknowledged;
    const isFilterIndeterminate = !isAllFilterSelected && (filterAcknowledged || filterNotAcknowledged || filterViewedNotAcknowledged);

    const toggleSelectFilterAll = () => {
        if (isAllFilterSelected) {
            setFilterAcknowledged(false);
            setFilterNotAcknowledged(false);
            setFilterViewedNotAcknowledged(false);
        } else {
            setFilterAcknowledged(true);
            setFilterNotAcknowledged(true);
            setFilterViewedNotAcknowledged(true);
        }
    };

    // Shared primitive — resets the checkboxes
    const resetFilterSelections = () => {
        setFilterAcknowledged(false);
        setFilterNotAcknowledged(false);
        setFilterViewedNotAcknowledged(false);
    };

    const handleClearFilter = () => {
        resetFilterSelections();
        setAppliedFilters(undefined);
        setSearchKey(prev => prev + 1);
        setIsSearching(false);
    };

    // Sync checkboxes to applied filters
    useEffect(() => {
        if (openFilter) {
            const active = appliedFilters ? appliedFilters.split(",") : [];
            setFilterAcknowledged(active.includes("acknowledged"));
            setFilterNotAcknowledged(active.includes("not_acknowledged"));
            setFilterViewedNotAcknowledged(active.includes("viewed_not_acknowledged"));
        }
    }, [openFilter]);

    return (
        <>
            <ModalElement
                open={open}
                onClose={onClose}
                title="Acknowledgement Data"
                maxWidth="lg"
                sx={{
                    "& .MuiDialog-paper": {
                        width: { xs: "90vw", sm: 500, md: 800 },
                        margin: 2
                    },
                }}
                contentSx={{ overflow: 'hidden' }}
            >
                <Stack sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ flexShrink: 0 }}>
                        {showReminderActions ? (
                            <Box display='flex' alignItems='center' gap={1}>
                                <Checkbox
                                    label="Select all"
                                    checked={isAllSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={toggleSelectAll}
                                />
                                <Tooltip title={remindLabel}>
                                    <PrimaryIconButton
                                        variant="outlined"
                                        icon={<SendIcon />}
                                        onClick={() => handleRemind()}
                                        disabled={selectedCount === 0}
                                    />
                                </Tooltip>
                            </Box>
                        ) : <Box />}

                        <Box display='flex' justifyContent='flex-end' alignItems='center' gap={0.5} p={1}>
                            <Chip label={`Total: ${ackData?.data?.acknowledgements?.length || 0}`} />
                            <PrimaryIconButton
                                variant="outlined"
                                icon={<FileDownloadOutlinedIcon />}
                                onClick={handleExport}
                                disabled={isExporting}
                                title="Export"
                            />
                            <Badge
                                badgeContent={appliedFilterCount}
                                color={appliedFilterCount > 0 ? "error" : "default"}
                            >
                                <PrimaryIconButton
                                    variant="outlined"
                                    icon={<FilterListOutlinedIcon />}
                                    onClick={() => { setOpenFilter(true); }}
                                    title="Filter"
                                />
                            </Badge>

                            <PrimaryIconButton
                                variant="outlined"
                                icon={<RestartAltIcon />}
                                onClick={handleClearFilter}
                                title="Reset Filters"
                                disabled={!appliedFilterCount && !isSearching}
                            />
                            <Box minWidth="20px" ml={1}>
                                <SearchBoxAtom
                                    key={searchKey}
                                    data={formattedData}
                                    searchKeys={["name", "empID", "jobTitle", "status", "fileAccessedOn", "acknowledgedDate"]}
                                    placeholder="Search employee..."
                                    onFilteredData={
                                        (data) => {
                                            setFilteredEmployees(data);
                                            setIsSearching(data.length !== formattedData.length ? true : false);
                                        }
                                    }
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 1, mb: 2 }}>
                        <StandardTable
                            sticky
                            rows={filteredEmployees}
                            columns={columns}
                            loading={isLoading}
                            rowHeight={35}
                            sx={{ height: '100%', overflow: 'auto' }}
                        />
                    </Box>
                </Stack>
            </ModalElement>

            <ModalElement
                open={openFilter}
                onClose={() => {
                    resetFilterSelections();
                    setOpenFilter(false);
                }}
                title="Filter"
                maxWidth="xs"
                sx={{
                    "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500, md: 800 }, margin: 2 },
                }}
            >
                <Stack spacing={2} direction='column'>
                    <Box display='flex' justifyContent='flex-start' gap={1} alignItems='center'>
                        <Checkbox
                            label="Select All"
                            checked={isAllFilterSelected}
                            indeterminate={isFilterIndeterminate}
                            onChange={toggleSelectFilterAll}
                        />
                    </Box>
                    <Box display='flex' flexDirection='column' gap={1}>
                        <Checkbox
                            label="Acknowledged"
                            checked={filterAcknowledged}
                            onChange={() => { setFilterAcknowledged(!filterAcknowledged) }}
                        />
                        <Checkbox
                            label="Not Acknowledged"
                            checked={filterNotAcknowledged}
                            onChange={() => { setFilterNotAcknowledged(!filterNotAcknowledged) }}
                        />
                        <Checkbox
                            label="Viewed"
                            checked={filterViewedNotAcknowledged}
                            onChange={() => { setFilterViewedNotAcknowledged(!filterViewedNotAcknowledged) }}
                        />
                    </Box>
                    <Box display='flex' justifyContent='flex-end' gap={1} alignItems='center'>
                        <PrimaryButton variant="contained"
                            onClick={handleApplyFilter}
                        >
                            Apply
                        </PrimaryButton>
                    </Box>
                </Stack>
            </ModalElement>

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                />
            )}
        </>
    );
};