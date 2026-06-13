import { useState, useMemo } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import MenuAtom from "../../../../../../../components/menuatom/MenuAtom";
import { Chip } from "../../../../../../../components/atom/chips";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import BlockIcon from "@mui/icons-material/Block";
import AssignmentTurnedInTwoTone from "@mui/icons-material/AssignmentTurnedInTwoTone";

import { useGetEmployeeAssetsQuery } from "../../api/exit.api";
import { useUpdateAssetMutation } from "../../../../asset/asset-list/api/assetList.api";
import { useGetAssetCategoriesQuery } from "../../../../asset/asset-category/api/assetCategory.api";
import { useMarkAssetUnavailableMutation } from "../../../../asset/asset-list/api/assetListMarkUnavailable.api";
import { useRecoverAssetMutation } from "../../../../asset/asset-list/api/assetRecover.api";
import { useSnackbar } from "../../../../../../../context/SnackbarContext";

import { AddAssetModal } from "../../../../asset/asset-list/components/AddAssetForm";
import { RecoverAssetModal } from "../../../../asset/asset-list/components/RecoverAssetModal";
import { MarkUnavailableModal } from "../../../../asset/asset-list/components/MarkUnavailableModal";
import { AssetDetailsModal } from "../../../../asset/asset-list/components/AssetAuditModal";
import dayjs from "dayjs";

import type { StandardTableColumn } from "../../../../../../../types/types";

interface AssetsTabProps {
  employeeId: number;
}

export const AssetsTab = ({ employeeId }: AssetsTabProps) => {
  const { showSnackbar } = useSnackbar();

  // Queries
  const { data: employeeAssets, isLoading: isAssetsLoading } = useGetEmployeeAssetsQuery(employeeId);
  const { data: categories } = useGetAssetCategoriesQuery();

  // Mutations
  const [updateAsset] = useUpdateAssetMutation();
  const [markUnavailable] = useMarkAssetUnavailableMutation();
  const [recoverAsset, { isLoading: isRecoveringAsset }] = useRecoverAssetMutation();

  // State
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [openRecover, setOpenRecover] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openUnavailable, setOpenUnavailable] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  // Find category for asset type
  const getCategoryForType = (typeId?: number) => {
    if (!typeId || !categories) return null;
    return categories.find((cat) => cat.assetTypes?.some((t) => t.id === typeId)) || null;
  };

  // Map selected row to format expected by asset components
  const mappedAssetForModal = useMemo(() => {
    if (!selectedRow) return null;
    return {
      id: selectedRow.asset?.assetId || "",
      assetName: selectedRow.asset?.assetName || "",
      location: selectedRow.asset?.location || "",
      conditionName: selectedRow.asset?.assetCondition?.conditionName || "-",
      asset: {
        ...selectedRow.asset,
        assignments: [selectedRow],
      },
    };
  }, [selectedRow]);

  const activeType = selectedRow?.asset?.assetType || null;
  const activeCategory = useMemo(() => {
    if (!selectedRow?.asset?.assetType?.id) return null;
    return getCategoryForType(selectedRow.asset.assetType.id);
  }, [selectedRow, categories]);

  // Actions trigger handlers
  const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleRowMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleRecoverTrigger = () => {
    handleRowMenuClose();
    setOpenRecover(true);
  };

  const handleEditTrigger = () => {
    handleRowMenuClose();
    setOpenEdit(true);
  };

  const handleMarkUnavailableTrigger = () => {
    handleRowMenuClose();
    setOpenUnavailable(true);
  };

  const handleView = () => {
    handleRowMenuClose();
    setOpenDetails(true);
  };

  // Form submit handlers
  const handleRecover = async (data: any) => {
    const typeId = selectedRow?.asset?.assetType?.id;
    const listId = selectedRow?.asset?.id;

    if (!typeId || !listId) {
      showSnackbar("Asset configuration details missing", "error");
      return;
    }

    const payload = {
      ...data,
      recoveredOn: data.recoveredOn ? dayjs(data.recoveredOn).format("YYYY-MM-DD") : undefined,
    };

    try {
      await recoverAsset({
        typeId,
        listId,
        data: payload,
      }).unwrap();
      showSnackbar("Asset recovered successfully", "success");
      setOpenRecover(false);
      setSelectedRow(null);
    } catch (error: any) {
      showSnackbar(error?.data?.message || "Failed to recover asset", "error");
    }
  };

  const handleMarkUnavailable = async (data: any) => {
    const typeId = selectedRow?.asset?.assetType?.id;
    const listId = selectedRow?.asset?.id;

    if (!typeId || !listId) {
      showSnackbar("Asset configuration details missing", "error");
      return;
    }

    try {
      await markUnavailable({
        typeId,
        listId,
        data,
      }).unwrap();
      showSnackbar("Asset marked unavailable successfully", "success");
      setOpenUnavailable(false);
      setSelectedRow(null);
    } catch (error: any) {
      showSnackbar(error?.data?.message || "Failed to mark unavailable", "error");
    }
  };

  const handleSaveAsset = async (formData: FormData) => {
    const typeId = selectedRow?.asset?.assetType?.id;
    const listId = selectedRow?.asset?.id;
    const category = getCategoryForType(typeId);

    if (!category?.id || !typeId || !listId) {
      showSnackbar("Failed to find asset category configuration", "error");
      return;
    }

    try {
      await updateAsset({
        categoryId: category.id,
        typeId,
        listId,
        data: formData,
      }).unwrap();
      showSnackbar("Asset updated successfully", "success");
      setOpenEdit(false);
      setSelectedRow(null);
    } catch (error: any) {
      showSnackbar(error?.data?.message || "Failed to update asset", "error");
    }
  };

  const columns: StandardTableColumn[] = [
    {
      id: "assetName",
      label: "Asset Name",
      render: (row: any) => (
        <Typography variant="body2" fontWeight={500}>
          {row.asset?.assetName || "-"}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Status",
      align: "center",
      render: (row: any) => {
        const status = row.asset?.assetStatus;
        switch (status) {
          case "assigned":
            return (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Chip label="Assigned" color="info" size="xs" sx={{ minWidth: 70 }} />
              </Box>
            );
          case "not_available":
            return (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Chip label="Not Available" color="error" size="xs" sx={{ minWidth: 100 }} />
              </Box>
            );
          case "available":
          default:
            return (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Chip label="Available" color="success" size="xs" sx={{ minWidth: 70 }} />
              </Box>
            );
        }
      },
    },
    {
      id: "condition",
      label: "Condition",
      align: "center",
      render: (row: any) => (
        <Typography variant="body2">
          {row.asset?.assetCondition?.conditionName || "-"}
        </Typography>
      ),
    },
    {
      id: "assignedOn",
      label: "Assigned On",
      align: "center",
      render: (row: any) => (
        <Typography variant="body2">
          {row.assignedOn ? dayjs(row.assignedOn).format("MMM DD, YYYY") : "-"}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "Asset Action",
      align: "center",
      render: (row: any) => (
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
    <Box sx={{ p: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Recover assets</Typography>
      </Box>

      <Box sx={{ flex: 1 }}>
        {isAssetsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <StandardTable
            columns={columns}
            rows={employeeAssets ?? []}
            emptyMessage="No assets assigned to this employee"
          />
        )}
      </Box>

      {/* Action Menu */}
      <MenuAtom
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onCloseAll={handleRowMenuClose}
        items={[
          {
            label: "Recover Asset",
            icon: <RestoreIcon fontSize="small" />,
            onClick: handleRecoverTrigger,
            disabled: selectedRow?.asset?.assetStatus !== "assigned",
          },
          // {
          //   label: "Edit Details",
          //   icon: <EditIcon fontSize="small" />,
          //   onClick: handleEditTrigger,
          //   disabled:
          //     selectedRow?.asset?.assetStatus === "assigned"
          // },
          // {
          //   label: "Mark Unavailable",
          //   icon: <BlockIcon fontSize="small" />,
          //   onClick: handleMarkUnavailableTrigger,
          //   disabled: selectedRow?.asset?.assetStatus !== "available"
          // },
          {
            label: "View Details",
            icon: <AssignmentTurnedInTwoTone fontSize="small" />,
            onClick: handleView,
          },
        ]}
      />

      {/* Modals */}
      {openRecover && mappedAssetForModal && (
        <RecoverAssetModal
          open={openRecover}
          onClose={() => {
            setOpenRecover(false);
            setSelectedRow(null);
          }}
          isLoading={isRecoveringAsset}
          activeType={activeType}
          activeCategory={activeCategory}
          asset={mappedAssetForModal}
          onRecover={handleRecover}
        />
      )}

      {openEdit && mappedAssetForModal && activeType && activeCategory && (
        <AddAssetModal
          open={openEdit}
          onClose={() => {
            setOpenEdit(false);
            setSelectedRow(null);
          }}
          isEdit={true}
          editRow={mappedAssetForModal.asset}
          assetType={activeType}
          assetCategory={activeCategory}
          onSave={handleSaveAsset}
        />
      )}

      {openUnavailable && mappedAssetForModal && (
        <MarkUnavailableModal
          open={openUnavailable}
          onClose={() => {
            setOpenUnavailable(false);
            setSelectedRow(null);
          }}
          assetList={mappedAssetForModal}
          activeType={activeType}
          activeCategory={activeCategory}
          onSave={handleMarkUnavailable}
        />
      )}

      {openDetails && mappedAssetForModal && (
        <AssetDetailsModal
          open={openDetails}
          onClose={() => {
            setOpenDetails(false);
            setSelectedRow(null);
          }}
          asset={mappedAssetForModal}
          activeType={activeType}
          hideHistory={true}
        />
      )}
    </Box>
  );
};
