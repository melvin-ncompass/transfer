import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Typography } from "@mui/material";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { StandardTable } from "../../../../../../components/tables/standard-table";
import { SearchBoxAtom } from "../../../../../../components/searchbar/SearchBoxAtom";
import type { StandardTableColumn } from "../../../../../../types/types";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { AssetDetailsModal } from "../../asset-list/components/AssetAuditModal";
import { useGetAssetAcknowledgementsQuery, type AssetAcknowledgementQueryParams } from "../api/assetAcknowledgement.api";
import { FilterModal } from "./FilterModal";
import { RecoverAssetModal } from "../../asset-list/components/RecoverAssetModal";
import { useRecoverAssetMutation } from "../../asset-list/api/assetRecover.api";
import { useSnackbar } from "../../../../../../context/SnackbarContext";
interface ActiveFilters {
    condition: string;
    assignedTo: any[];
    dateRangeAck: [Dayjs | null, Dayjs | null];
    dateRangeAssignedOn: [Dayjs | null, Dayjs | null];
}

const DEFAULT_FILTERS: ActiveFilters = {
    condition: "",
    assignedTo: [],
    dateRangeAck: [null, null],
    dateRangeAssignedOn: [null, null],
};

const buildQueryParams = (filters: ActiveFilters): AssetAcknowledgementQueryParams => {
    const params: AssetAcknowledgementQueryParams = { status: "completed" };

    if (filters.condition) params.assetConditionId = filters.condition;
    if (filters.assignedTo.length > 0)
        params.assignedTo = filters.assignedTo.map((id: number) => Number(id));

    const [fromAck, toAck] = filters.dateRangeAck;
    if (fromAck) params.acknowledgedOnFrom = fromAck.format("YYYY-MM-DD");
    if (toAck) params.acknowledgedOnTo = toAck.format("YYYY-MM-DD");

    const [fromAssigned, toAssigned] = filters.dateRangeAssignedOn;
    if (fromAssigned) params.assignedOnFrom = fromAssigned.format("YYYY-MM-DD");
    if (toAssigned) params.assignedOnTo = toAssigned.format("YYYY-MM-DD");

    return params;
};

export const CompletedAcknowledgementAssets = () => {
    const { showSnackbar } = useSnackbar();
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [openDetails, setOpenDetails] = useState(false);

    const [openRecover, setOpenRecover] = useState(false);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [openFilter, setOpenFilter] = useState(false);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

    const { data: completedData, isFetching: isCompletedFetching } =
        useGetAssetAcknowledgementsQuery(buildQueryParams(activeFilters));

    const [recoverAsset, { isLoading: isRecoveringAsset }] = useRecoverAssetMutation();

    const tableRows = useMemo(() => completedData ?? [], [completedData]);

    const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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

    const handleRowMenuClose = () => setMenuAnchorEl(null);

    const handleViewTrigger = () => {
        setOpenDetails(true);
        setMenuAnchorEl(null);
    };

    const handleRecoverTrigger = () => {
        setMenuAnchorEl(null);
        setOpenRecover(true);
    };

    // ── Filter handlers ───────────────────────────────────────────────────────
    const handleApplyFilter = (filters: ActiveFilters) => {
        setActiveFilters(filters);
        setOpenFilter(false);
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

    const activeFilterCount =
        (activeFilters.condition ? 1 : 0) +
        (activeFilters.assignedTo.length > 0 ? 1 : 0) +
        (activeFilters.dateRangeAck[0] !== null || activeFilters.dateRangeAck[1] !== null ? 1 : 0) +
        (activeFilters.dateRangeAssignedOn[0] !== null || activeFilters.dateRangeAssignedOn[1] !== null ? 1 : 0);

    const columns: StandardTableColumn[] = [
        { id: "assetId", label: "Asset ID" },
        { id: "assetName", label: "Asset Name" },
        {
            id: "assignedTo",
            label: "Assigned To",
            render: (row) => (
                <Typography variant="body2">
                    {row.assignments?.[0]?.assignedTo?.nameAsPerAadhar ||
                        row.assignments?.[0]?.assignedTo?.nameAsPerPan ||
                        row.assignments?.[0]?.assignedTo?.contact?.name ||
                        "-"}
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

    return (
        <>
            <Box sx={{ p: 1, display: "flex", flexDirection: "column", flexGrow: 1, height: "100%" }}>
                <Typography variant="subtitle1" color="textPrimary">
                    Completed Acknowledgement
                </Typography>
                <Typography variant="caption" color="textSecondary">
                    This is the list of acknowledged assets within the organization.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, mt: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            mb: 2,
                            gap: 2,
                        }}
                    >
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
                            onClick={() => setActiveFilters(DEFAULT_FILTERS)}
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

                    <StandardTable
                        rows={isSearching ? filteredAssets : tableRows}
                        columns={columns}
                        loading={isCompletedFetching}
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
                hideAckowledgeOn={false}
                initialValues={activeFilters}
            />

            <AssetDetailsModal
                open={openDetails}
                onClose={() => { setOpenDetails(false); setSelectedAsset(null); }}
                asset={{ asset: selectedAsset }}
                activeType={selectedAsset?.assetType}
                hideHistory={true}
                chipStatus={"Acknowledgement Request"}
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

            <MenuAtom
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onCloseAll={handleRowMenuClose}
                items={[
                    { label: "View Asset Details", onClick: handleViewTrigger },
                    { label: "Recover Asset", onClick: handleRecoverTrigger },
                ]}
            />
        </>
    );
};