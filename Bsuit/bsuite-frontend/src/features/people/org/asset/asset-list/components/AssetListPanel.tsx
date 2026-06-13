import { Box, Stack, Typography, Badge } from "@mui/material";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import AddIcon from "@mui/icons-material/Add";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { SearchBoxAtom } from "../../../../../../components/searchbar/SearchBoxAtom";
import { useCallback, useEffect, useMemo, useState } from "react";
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { FilterModalOrganization } from "./FilterModalAssetList";
import { AddAssetModal } from "./AddAssetForm";
import { AssignAssetModal } from "./AssignAssetModal";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from "@mui/icons-material/Restore";

import type { StandardTableColumn } from "../../../../../../types/types";
import { useGetAssetTypeByIdQuery, type AssetType } from "../../asset-category/api/assetCategory.api";
import type { AssetCategoryType } from "../../asset-category/api/assetCategory.api";
import { MarkUnavailableModal, type MarkUnavailableForm } from "./MarkUnavailableModal";
import { AssetDetailsModal } from "./AssetAuditModal";
import { AssignmentTurnedInTwoTone, } from "@mui/icons-material";
import { useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation } from "../api/assetList.api";
import { useAssignAssetMutation } from "../api/assetListAssignAsset.api";
import { useMarkAssetUnavailableMutation } from "../api/assetListMarkUnavailable.api";
import { useRecoverAssetMutation } from "../api/assetRecover.api";
import { Chip } from "../../../../../../components/atom/chips";
import { RecoverAssetModal } from "./RecoverAssetModal";
import dayjs from "dayjs";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { AssetAttachmentsModal } from "./AssetAttachmentsModal";

export const AssetListPanel = ({
    activeType,
    activeCategory,
}: {
    activeType: AssetType | null | undefined,
    activeCategory: AssetCategoryType | null | undefined
}) => {

    const [filteredAssets, setFilterAssets] = useState<any[]>([]);
    const [openFilter, setOpenFilter] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

    const [openDetails, setOpenDetails] = useState(false);
    const [apiFilters, setApiFilters] = useState<any>({});

    const [isSearching, setIsSearching] = useState(false);
    const [filterKey, setFilterKey] = useState(0);

    const [createAsset, { isLoading: isCreatingAsset }] = useCreateAssetMutation();
    const [updateAsset, { isLoading: isUpdatingAsset }] = useUpdateAssetMutation();
    const [deleteAsset, { isLoading: isDeletingAsset }] = useDeleteAssetMutation();
    const [assignAsset, { isLoading: isAssigningAsset }] = useAssignAssetMutation();
    const [markUnavailable, { isLoading: isMarkingUnavailable }] = useMarkAssetUnavailableMutation();
    const [recoverAsset, { isLoading: isRecoveringAsset }] = useRecoverAssetMutation();

    const [openAttachments, setOpenAttachments] = useState(false);

    const { data: assetType, isLoading: isLoadingData, isFetching: isFetchingData, } = useGetAssetTypeByIdQuery(
        {
            id: activeCategory?.id,
            typeId: activeType?.id,
            filters: Object.keys(apiFilters).length ? apiFilters : undefined
        },
        {
            skip: !activeCategory?.id || !activeType?.id,
        }
    );

    const loading = isAssigningAsset
        || isCreatingAsset
        || isUpdatingAsset
        || isDeletingAsset
        || isMarkingUnavailable
        || isRecoveringAsset
        || isFetchingData
        || isLoadingData;



    const tableRows = useMemo(() => {
        const assets = assetType?.assets ?? [];

        if (!assets.length) return [];

        return assets.map((asset) => ({
            id: asset.assetId,
            assetName: asset.assetName,
            location: asset.location,
            conditionName: asset.assetCondition?.conditionName,
            assetStatus: asset.assetStatus,
            isAcknowledgementRequested: asset.assignments?.[asset.assignments.length - 1]?.isAcknowledgementRequested ? "Yes" : "No",
            assignedTo: asset.assetStatus !== 'assigned'
                ? "-"
                : asset.assignments?.at(-1)?.assignedTo?.contact?.name ?? "-",
            warrantyExpiryStatus:
                new Date(asset.warrantyExpiresOn) > new Date() ? "Valid" : "Expired",
            warrantyExpiryDate: asset.warrantyExpiresOn
                ? new Date(asset.warrantyExpiresOn).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : "-",
            asset: asset,
        }));
    }, [assetType?.assets]);

    const handleFilteredData = useCallback((data: any[]) => {
        setFilterAssets(data);
        setIsSearching(data.length !== tableRows.length);
    }, [tableRows]);


    useEffect(() => {
        setIsSearching(false);
        setFilterAssets([]);
    }, [tableRows]);

    // Row action menu
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    // Assign modal
    const [openAssign, setOpenAssign] = useState(false);

    // Recover modal
    const [openRecover, setOpenRecover] = useState(false);

    // Mark unAvailable
    const [openUnavailableModal, setOpenUnavailable] = useState(false);

    // Delete confirm
    const [openConfirm, setOpenConfirm] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        color: "success" as "success" | "error",
    });

    const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedAsset(row);
    };

    const handleRowMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEditTrigger = () => {
        handleRowMenuClose();
        setIsEdit(true);
        setOpenAdd(true);
    };

    const handleAssignTrigger = () => {
        handleRowMenuClose();
        setOpenAssign(true);
    };

    const handleRecoverTrigger = () => {
        handleRowMenuClose();
        setOpenRecover(true);
    };

    const handleMarkUnavailableTrigger = () => {
        handleRowMenuClose();
        setOpenUnavailable(true);
    }

    const handleDeleteTrigger = () => {
        handleRowMenuClose();
        setOpenConfirm(true);
    };

    const handleView = () => {
        handleRowMenuClose();
        setOpenDetails(true);
    };

    const handleSaveAsset = async (data: FormData) => {
        if (!activeCategory?.id || !activeType?.id) return;

        try {
            if (isEdit && selectedAsset?.asset?.id) {
                await updateAsset({
                    categoryId: activeCategory.id,
                    typeId: activeType.id,
                    listId: selectedAsset.asset.id,
                    data,
                }).unwrap();
                setSnackbar({
                    open: true,
                    message: "Asset updated successfully",
                    color: "success",
                });
            } else {
                await createAsset({
                    categoryId: activeCategory.id,
                    typeId: activeType.id,
                    data,
                }).unwrap();
                setSnackbar({
                    open: true,
                    message: "Asset created successfully",
                    color: "success",
                });
            }

            setOpenAdd(false);
            setIsEdit(false);
            setSelectedAsset(null);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error?.data?.message || `Failed to ${isEdit ? "update" : "create"} asset`,
                color: "error",
            });
        }
    };

    const handleConfirmDelete = async () => {
        if (!activeType?.id || !selectedAsset?.asset?.id) return;

        try {
            await deleteAsset({ typeId: activeType.id, listId: selectedAsset.asset.id }).unwrap();
            setSnackbar({ open: true, message: "Asset deleted successfully", color: "success" });
            setOpenConfirm(false);
            setSelectedAsset(null);
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.data?.message || "Failed to delete asset", color: "error" });
        }
    };

    const columns: StandardTableColumn[] = [
        {
            id: "assetName",
            label: "Asset Name",
            render: (row: any) => (
                <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    justifyContent={"space-between"}

                    sx={{
                        flex: 1,
                        width: "100%",
                    }}
                >
                    <Typography
                        variant="body2"
                    >
                        {row.assetName}
                    </Typography>

                    <Badge
                        badgeContent={row?.asset?.attachments?.length || 0}
                        color="error"
                        variant="standard"
                        sx={{
                            "& .MuiBadge-badge": {
                                fontSize: "0.65rem",
                                height: 12,
                                minWidth: 12,
                                color: "white",
                                padding: "0 2px",
                                cursor: "pointer",
                            },
                        }}
                        onClick={() => {
                            setSelectedAsset(row);
                            setOpenAttachments(true);
                        }}
                    >
                        <AttachFileIcon sx={{ fontSize: "1rem", cursor: "pointer", color: "primary.main" }} />
                    </Badge>
                </Stack>
            ),
        },
        {
            id: "id",
            label: "Asset ID",
        },
        {
            id: "location",
            label: "Location",
        },
        {
            id: "conditionName",
            label: "Condition",
            align: 'center',
        },
        {
            id: "assetStatus",
            label: "Status",
            align: 'center',
            render(row) {
                switch (row.assetStatus) {

                    case "assigned":
                        return <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip label="Assigned" color="info" size="xs" sx={{ minWidth: 70 }} />
                        </Box>;

                    case "not_available":
                        return <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip label="Not Available" color="error" size="xs" sx={{ minWidth: 100 }} />
                        </Box>;

                    // case "recovered":
                    //     return <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    //         <Chip label="Recovered" color="primary" size="xs" sx={{ minWidth: 70 }} />
                    //     </Box>;

                    case "available":
                    default:
                        return <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip label="Available" color="success" size="xs" sx={{ minWidth: 70 }} />
                        </Box>;
                }
            },
        },
        {
            id: "isAcknowledgementRequested",
            label: "Acknowledgement",
            align: 'center',
            render(row) {
                return <Typography variant="body2">No</Typography>
            },
        },
        {
            id: "assignedTo",
            label: "Assigned To",
            align: 'center',
        },
        {
            id: "warrantyExpiryStatus",
            label: "Warranty Expiry Status",
            align: 'center',
        },
        {
            id: "warrantyExpiryDate",
            label: "Warranty Expiry Date",
            align: 'center',
            render(row) {
                return <Typography>{dayjs(row?.warrantyExpiryDate).format("MMM DD, YYYY")}</Typography>
            },
        },
        {
            id: "actions",
            label: "Actions",
            align: 'center',
            render: (row: any) => (
                <PrimaryIconButton
                    variant="outlined"
                    size="small"
                    icon={<MoreVertIcon fontSize="small" titleAccess="Actions" />}
                    onClick={(e) => handleRowMenuOpen(e, row)}
                    sx={{ mr: 1 }}
                />
            ),
        },
    ];

    const handleApply = (filters: any) => {
        const newFilters: any = {};
        if (filters.condition?.length) {
            newFilters.assetConditionId = filters.condition;
        }

        if (filters.status?.length) {
            newFilters.assetStatus = filters.status;
        }
        if (filters.expiresOn) {
            newFilters.warrantyExpiresOn = filters.expiresOn.format("YYYY-MM-DD");
        }
        setApiFilters(newFilters);
    };

    const handleAssign = async (form: any) => {
        if (!activeType?.id || !selectedAsset?.asset?.id) return;

        const payload: any = {
            ...form,
            assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
            assetConditionId: form.assetConditionId ? Number(form.assetConditionId) : undefined,
        };


        try {
            await assignAsset({
                typeId: activeType.id,
                listId: selectedAsset.asset.id,
                data: payload,
            }).unwrap();
            setSnackbar({ open: true, message: "Asset assigned successfully", color: "success" });
            setOpenAssign(false);
            setSelectedAsset(null);
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.data?.message || "Failed to assign asset", color: "error" });
        }
    }

    const handleMarkUnavailable = async (data: MarkUnavailableForm) => {
        if (!activeType?.id || !selectedAsset?.asset?.id) return;

        try {
            await markUnavailable({ typeId: activeType.id, listId: selectedAsset.asset.id, data }).unwrap();
            setSnackbar({ open: true, message: "Asset marked unavailable successfully", color: "success" });
            setOpenUnavailable(false);
            setSelectedAsset(null);
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.data?.message || "Failed to mark unavailable", color: "error" });
        }
    }

    const handleRecover = async (data: any) => {
        if (!activeType?.id || !selectedAsset?.asset?.id) return;
        const payload = {
            ...data,
            recoveredOn: data.recoveredOn
                ? dayjs(data.recoveredOn).format("YYYY-MM-DD")
                : undefined,
        };
        try {
            await recoverAsset({
                typeId: activeType.id,
                listId: selectedAsset.asset.id,
                data: payload,
            }).unwrap();
            setSnackbar({ open: true, message: "Asset recovered successfully", color: "success" });
            setOpenRecover(false);
            setSelectedAsset(null);
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.data?.message || "Failed to recover asset", color: "error" });
        }
    }

    return (
        <>
            <Box
                display="flex"
                flexDirection="column"
                // gap={1}
                sx={{
                    height: "100%",
                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        backgroundColor: "background.paper",

                    }}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="h6">
                        Assets {activeType?.typeName ? `- ${activeType.typeName}` : ""}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems='center' p={1}>
                        <Badge
                            badgeContent={Object.keys(apiFilters).length > 0 ? Object.keys(apiFilters).length : 0}
                            color={Object.keys(apiFilters).length > 0 ? "error" : "default"}
                        >
                            <PrimaryIconButton
                                variant="outlined"
                                icon={<FilterListOutlinedIcon />}
                                onClick={() => { setOpenFilter(true) }}
                                title="Filter"
                            />
                        </Badge>

                        <PrimaryIconButton
                            variant="outlined"
                            icon={<RestartAltIcon />}
                            disabled={Object.keys(apiFilters).length === 0}
                            onClick={() => { setApiFilters({}); setFilterKey(k => k + 1); }}
                            title="Clear Filters"
                        />


                        <Tooltip title="Add Asset">
                            <PrimaryIconButton
                                icon={<AddIcon />}
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setIsEdit(false);
                                    setSelectedAsset(null);
                                    setOpenAdd(true);
                                }}
                            />
                        </Tooltip>

                        <Box minWidth="220px">
                            <SearchBoxAtom
                                data={tableRows}
                                searchKeys={[
                                    "assetName",
                                    "assetStatus",
                                    "location",
                                    "conditionName",
                                    "assignedTo",
                                    "warrantyExpiryDate",
                                    "warrantyExpiryStatus"
                                ]}
                                placeholder="Search asset..."
                                onFilteredData={handleFilteredData}
                            />
                        </Box>
                    </Stack>
                </Box>

                {/* TABLE SCROLL AREA */}
                <Box
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        minHeight: 0,
                    }}
                >
                    <StandardTable
                        rows={isSearching ? filteredAssets : tableRows}
                        columns={columns}
                        loading={loading}
                        sticky
                        sx={{
                            height: "100%",
                        }}
                    />
                </Box>
            </Box>

            <FilterModalOrganization
                key={filterKey}
                onSave={handleApply}
                open={openFilter}
                appliedFilters={apiFilters}
                onClose={() => setOpenFilter(false)}
            />
            {activeType && activeCategory && (
                <AddAssetModal
                    open={openAdd}
                    assetType={activeType}
                    assetCategory={activeCategory}
                    isEdit={isEdit}
                    editRow={selectedAsset?.asset}
                    onClose={() => {
                        setOpenAdd(false);
                        setIsEdit(false);
                        setSelectedAsset(null);
                    }}
                    onSave={handleSaveAsset}
                />
            )}
            <AssignAssetModal
                open={openAssign}
                onClose={() => {
                    setOpenAssign(false);
                    setSelectedAsset(null);
                }}
                activeType={activeType}
                asset={selectedAsset}
                onAssign={handleAssign}
            />

            <RecoverAssetModal
                open={openRecover}
                onClose={() => {
                    setOpenRecover(false);
                    setSelectedAsset(null);
                }}
                isLoading={isRecoveringAsset}
                activeType={activeType}
                activeCategory={activeCategory}
                asset={selectedAsset}
                onRecover={handleRecover}
            />

            <MarkUnavailableModal
                open={openUnavailableModal}
                onClose={() => {
                    setOpenUnavailable(false)
                    setSelectedAsset(null)
                }}
                onSave={handleMarkUnavailable}
                assetList={selectedAsset}
                activeType={activeType}
                activeCategory={activeCategory}
            />

            <AssetDetailsModal
                open={openDetails}
                asset={selectedAsset}
                activeType={activeType}
                onClose={() => setOpenDetails(false)}
            />

            <AssetAttachmentsModal
                open={openAttachments}
                onClose={() => { setOpenAttachments(false); setSelectedAsset(null); }}
                asset={selectedAsset?.asset}
                activeType={activeType}
            />

            {/* Row Actions Menu */}
            <MenuAtom
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onCloseAll={handleRowMenuClose}
                items={[
                    {
                        label: "Edit",
                        icon: <EditIcon fontSize="small" />,
                        onClick: handleEditTrigger,
                        disabled:
                            selectedAsset?.asset?.assetStatus === "assigned"
                    },
                    {
                        label: "Assign",
                        icon: <PersonAddIcon fontSize="small" />,
                        onClick: handleAssignTrigger,
                        disabled:
                            selectedAsset?.asset?.assetStatus === "assigned" ||
                            selectedAsset?.asset?.assetStatus === "not_available",
                    },
                    {
                        label: "Recover Asset",
                        icon: <RestoreIcon fontSize="small" />,
                        onClick: handleRecoverTrigger,
                        disabled:
                            selectedAsset?.asset?.assetStatus === "available" ||
                            selectedAsset?.asset?.assetStatus === "not_available",
                    },
                    {
                        label: "Mark Unavailable",
                        icon: <BlockIcon fontSize="small" />,
                        onClick: handleMarkUnavailableTrigger,
                        disabled:
                            selectedAsset?.asset?.assetStatus === "assigned" ||
                            selectedAsset?.asset?.assetStatus === "not_available",
                    },
                    {
                        label: "Audit History",
                        icon: <AssignmentTurnedInTwoTone fontSize="small" />,
                        onClick: handleView
                    },
                    {
                        label: "Delete",
                        icon: <DeleteIcon fontSize="small" color="error" />,
                        onClick: handleDeleteTrigger,
                    },
                ]}
            />

            <ConfirmDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Asset"
                confirmColor="error"
                confirmText="Delete"
                message="Are you sure you want to delete this asset?"
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                />
            )}
        </>

    );
}