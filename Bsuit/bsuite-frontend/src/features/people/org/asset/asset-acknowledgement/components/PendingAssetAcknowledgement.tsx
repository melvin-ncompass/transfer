// PendingAssetAcknowledgement.tsx

import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Typography } from "@mui/material";

import { PrimaryIconButton } from "../../../../../../components/atom/button";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import SendIcon from '@mui/icons-material/Send';
import { Checkbox } from "../../../../../../components/atom/check-box";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useSnackbar } from "../../../../../../context/SnackbarContext";
import { RecoverAssetModal } from "../../asset-list/components/RecoverAssetModal";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import { SearchBoxAtom } from "../../../../../../components/searchbar/SearchBoxAtom";
import { useGetAssetAcknowledgementsQuery, useNotifyAssetAcknowledgementMutation, type AssetAcknowledgement, type AssetAcknowledgementQueryParams } from "../api/assetAcknowledgement.api";
import { useRecoverAssetMutation } from "../../asset-list/api/assetRecover.api";
import { AssetDetailsModal } from "../../asset-list/components/AssetAuditModal";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { FilterModal } from "./FilterModal";

interface ActiveFilters {
    condition: string;
    assignedTo: any[];
    dateRangeAck: [Dayjs | null, Dayjs | null];
    dateRangeAssignedOn: [Dayjs | null, Dayjs | null];
}

/** Convert ActiveFilters → query params object for the API */
const buildQueryParams = (filters: ActiveFilters): AssetAcknowledgementQueryParams => {
    const params: AssetAcknowledgementQueryParams = { status: "pending" };

    if (filters.condition) {
        params.assetConditionId = filters.condition;
    }

    if (filters.assignedTo.length > 0) {
        params.assignedTo = filters.assignedTo.map((id: number) => Number(id));
    }

    const [fromAck, toAck] = filters.dateRangeAck;
    if (fromAck) params.acknowledgedOnFrom = fromAck.format("YYYY-MM-DD");
    if (toAck) params.acknowledgedOnTo = toAck.format("YYYY-MM-DD");

    const [fromAssigned, toAssigned] = filters.dateRangeAssignedOn;
    if (fromAssigned) params.assignedOnFrom = fromAssigned.format("YYYY-MM-DD");
    if (toAssigned) params.assignedOnTo = toAssigned.format("YYYY-MM-DD");

    return params;
};

const DEFAULT_FILTERS: ActiveFilters = {
    condition: "",
    assignedTo: [],
    dateRangeAck: [null, null],
    dateRangeAssignedOn: [null, null],
};

export const PendingAssetAcknowledgement = () => {
    const { showSnackbar } = useSnackbar();

    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<AssetAcknowledgement | null>(null);

    const [openRecover, setOpenRecover] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Record<number, AssetAcknowledgement>>({});
    const [openDetails, setOpenDetails] = useState(false);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [openFilter, setOpenFilter] = useState(false);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

    const [recoverAsset, { isLoading: isRecoveringAsset }] = useRecoverAssetMutation();
    const [notifyAssetAck, { isLoading: isNotifyAssetAckLoading }] = useNotifyAssetAcknowledgementMutation();

    const { data: pendingData, isFetching: isPendingFetching } = useGetAssetAcknowledgementsQuery(
        buildQueryParams(activeFilters)
    );
    const pendingRows = pendingData ?? [];

    const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const tableRows = pendingRows ?? [];

    const handleFilteredData = useCallback((data: any[]) => {
        setFilteredAssets(data);
        setIsSearching(data.length !== tableRows.length);
    }, [tableRows]);

    useEffect(() => {
        setIsSearching(false);
        setFilteredAssets([]);
    }, [tableRows]);

    const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedAsset(row);
    };

    const handleRowMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleViewTrigger = () => {
        setOpenDetails(true);
        setMenuAnchorEl(null);
    };

    const handleSendTrigger = async () => {
        try {
            if (!selectedAsset?.id || !selectedAsset?.assignments?.[0]?.assignedTo?.id) return;
            await notifyAssetAck({
                toNotify: [
                    {
                        employeeId: selectedAsset?.assignments?.[0]?.assignedTo?.id,
                        assetId: selectedAsset?.id,
                    },
                ],
            }).unwrap();
            showSnackbar("Asset notified successfully", "success");
            setMenuAnchorEl(null);
        } catch (error: any) {
            showSnackbar(error?.data?.message || "Failed to notify asset", "error");
        }
    };

    const handleRecoverTrigger = () => {
        setMenuAnchorEl(null);
        setOpenRecover(true);
    };

    const handleRecover = async (data: any) => {
        if (!selectedAsset || !selectedAsset?.assetType?.id) return;
        const payload = {
            ...data,
            recoveredOn: data.recoveredOn
                ? dayjs(data.recoveredOn).format("YYYY-MM-DD")
                : undefined,
        };
        try {
            await recoverAsset({
                typeId: selectedAsset?.assetType.id,
                listId: selectedAsset?.id,
                data: payload,
            }).unwrap();
            showSnackbar("Asset recovered successfully", "success");
            setOpenRecover(false);
            setSelectedAsset(null);
        } catch (error: any) {
            showSnackbar(error?.data?.message || "Failed to recover asset", "error");
        }
    };

    const handleSelectAsset = (asset: AssetAcknowledgement, checked: boolean) => {
        setSelectedAssets((prev) => {
            const updated = { ...prev };
            if (checked) {
                updated[asset.id] = asset;
            } else {
                delete updated[asset.id];
            }
            return updated;
        });
    };

    const allSelected =
        tableRows.length > 0 &&
        tableRows.every((row) => selectedAssets[row.id]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const selected = tableRows.reduce((acc, row) => {
                acc[row.id] = row;
                return acc;
            }, {} as Record<number, AssetAcknowledgement>);
            setSelectedAssets(selected);
        } else {
            setSelectedAssets({});
        }
    };

    const handleBulkReminder = async () => {
        try {
            const selected = Object.values(selectedAssets);
            if (!selected.length) {
                showSnackbar("Please select at least one asset", "error");
                return;
            }
            await notifyAssetAck({
                toNotify: selected.map((asset) => ({
                    employeeId: asset.assignments?.[0]?.assignedTo?.id,
                    assetId: asset.id,
                })),
            }).unwrap();
            showSnackbar(`${selected.length} reminder(s) sent successfully`, "success");
            setSelectedAssets({});
        } catch (error: any) {
            showSnackbar(error?.data?.message || "Failed to send reminders", "error");
        }
    };

    const handleApplyFilter = (filters: ActiveFilters) => {
        setActiveFilters(filters);
        setOpenFilter(false);
    };

    const columns: StandardTableColumn[] = [
        {
            id: "select",
            label: "",
            render: (row) => (
                <Checkbox
                    label=""
                    checked={!!selectedAssets[row.id]}
                    onChange={(e) => handleSelectAsset(row, e.target.checked)}
                />
            ),
        },
        { id: "assetId", label: "Asset ID" },
        { id: "assetName", label: "Asset Name" },
        {
            id: "assignedTo",
            label: "Assigned To",
            render: (row) => (
                <Typography variant="body2">
                    {row.assignments?.[0]?.assignedTo?.nameAsPerAadhar ||
                        row.assignments?.[0]?.assignedTo?.nameAsPerPan ||
                        row.assignments?.[0]?.assignedTo?.contact?.name || "-"}
                </Typography>
            ),
        },
        {
            id: "assignedOn",
            label: "Assigned On",
            render: (row) => (
                <Typography variant="body2">
                    {row.assignments?.[0]?.assignedOn
                        ? dayjs(row.assignments[0].assignedOn).format("MMM DD, YYYY")
                        : "-"}
                </Typography>
            ),
        },
        {
            id: "assetCondition",
            label: "Asset Condition",
            render: (row) => (
                <Typography variant="body2">
                    {row.assetCondition?.conditionName || "-"}
                </Typography>
            ),
        },
        {
            id: "actions",
            label: "Actions",
            align: "center",
            render: (row) => (
                <PrimaryIconButton
                    variant="outlined"
                    size="small"
                    icon={<MoreVertIcon fontSize="small" titleAccess="Actions" />}
                    onClick={(e) => handleRowMenuOpen(e, row)}
                />
            ),
        },
    ];

    const activeFilterCount =
        (activeFilters.condition ? 1 : 0) +
        (activeFilters.assignedTo.length > 0 ? 1 : 0) +
        (activeFilters.dateRangeAck[0] !== null || activeFilters.dateRangeAck[1] !== null ? 1 : 0) +
        (activeFilters.dateRangeAssignedOn[0] !== null || activeFilters.dateRangeAssignedOn[1] !== null ? 1 : 0);


    return (
        <>
            <Box sx={{ p: 1, display: "flex", flexDirection: "column", flexGrow: 1, height: "100%" }}>
                <Typography variant="subtitle1" color="textPrimary">
                    Pending Asset Acknowledgement
                </Typography>
                <Typography variant="caption" color="textSecondary">
                    These are assigned assets yet to be acknowledged by the employees.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, mt: 2, minHeight: 0 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <Tooltip title="Select All">
                                <Checkbox
                                    checked={allSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </Tooltip>

                            <PrimaryIconButton
                                variant="outlined"
                                color="primary"
                                size="small"
                                title="Remind"
                                icon={<SendIcon fontSize="small" />}
                                onClick={handleBulkReminder}
                                disabled={
                                    Object.keys(selectedAssets).length === 0 ||
                                    isNotifyAssetAckLoading
                                }
                            />
                        </Box>

                        <Box display="flex" gap={2} justifyContent="center" alignItems="center">
                            {/* Filter button — tinted when a filter is active */}
                            <Badge badgeContent={activeFilterCount} color={activeFilterCount > 0 ? "error" : "default"}>
                                <PrimaryIconButton
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    title="Filter"
                                    icon={<FilterListIcon />}
                                    onClick={() => setOpenFilter(true)}
                                />
                            </Badge>
                            <PrimaryIconButton
                                variant="outlined"
                                icon={<RestartAltIcon />}
                                disabled={activeFilterCount === 0}
                                onClick={() => { setActiveFilters(DEFAULT_FILTERS) }}
                                title="Clear Filters"
                            />

                            <Box minWidth="240px">
                                <SearchBoxAtom
                                    data={tableRows}
                                    searchKeys={[
                                        "assetIdSeries",
                                        "assetType.assetCategory.categoryName",
                                        "purchasedOn",
                                        "assetId",
                                        "warrantyExpiresOn",
                                        "location",
                                        "assetType.typeName",
                                        "assetName",
                                        "assetStatus",
                                        "assetCondition.conditionName",
                                    ]}
                                    placeholder="Search asset..."
                                    onFilteredData={handleFilteredData}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <StandardTable
                        rows={isSearching ? filteredAssets : tableRows}
                        columns={columns}
                        loading={isPendingFetching}
                        sticky
                        sx={{ height: "100%" }}
                    />
                </Box>
            </Box>

            {/* ── Filter Modal ── */}
            <FilterModal
                open={openFilter}
                onClose={() => setOpenFilter(false)}
                onApply={handleApplyFilter}
                initialValues={activeFilters}
                hideAckowledgeOn={true}
            />

            <RecoverAssetModal
                open={openRecover}
                onClose={() => { setOpenRecover(false); setSelectedAsset(null); }}
                activeType={selectedAsset?.assetType ?? null}
                activeCategory={selectedAsset?.assetType?.assetCategory}
                asset={selectedAsset}
                isLoading={isRecoveringAsset}
                onRecover={handleRecover}
            />

            <AssetDetailsModal
                open={openDetails}
                onClose={() => { setOpenDetails(false); setSelectedAsset(null); }}
                asset={{ asset: selectedAsset }}
                activeType={selectedAsset?.assetType}
                hideHistory={true}
                chipStatus={"Acknowledgement Request"}
            />

            <MenuAtom
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onCloseAll={handleRowMenuClose}
                items={[
                    { label: "Remind", onClick: handleSendTrigger },
                    { label: "Recover Asset", onClick: handleRecoverTrigger },
                    { label: "View Asset Details", onClick: handleViewTrigger },
                ]}
            />
        </>
    );
};