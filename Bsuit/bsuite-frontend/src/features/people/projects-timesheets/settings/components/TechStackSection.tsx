import { useState } from "react";
import { Box, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { AddTechStackModal } from "./AddTechStackModal";
import type { TechStackResponse } from "../types/projectSettings.types";
import {
  useGetTechStacksQuery,
  useCreateTechStackMutation,
  useUpdateTechStackMutation,
  useDeleteTechStackMutation,
} from "../api/projectSettings.api";

interface TechStackSectionProps {
  onSnackbar: (message: string, severity: "success" | "error") => void;
}

export function TechStackSection({ onSnackbar }: TechStackSectionProps) {
  const { data: techStacks, isLoading } = useGetTechStacksQuery();
  const [createTechStack, { isLoading: isCreating }] = useCreateTechStackMutation();
  const [updateTechStack, { isLoading: isUpdating }] = useUpdateTechStackMutation();
  const [deleteTechStack] = useDeleteTechStackMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<TechStackResponse | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TechStackResponse | null>(null);

  const handleSave = async (name: string) => {
    try {
      if (editData) {
        await updateTechStack({ id: editData.id, body: { techStackName: name } }).unwrap();
        onSnackbar("Tech stack updated successfully!", "success");
        setIsModalOpen(false)
      } else {
        await createTechStack({ techStackName: name }).unwrap();
        onSnackbar("Tech stack added successfully!", "success");
        setIsModalOpen(false)
      }
    } catch (error: any) {
      onSnackbar(
        error?.data?.message || (editData ? "Failed to update tech stack." : "Failed to add tech stack."),
        "error"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      try {
        await deleteTechStack(selectedItem.id).unwrap();
        onSnackbar("Tech stack deleted successfully!", "success");
      } catch (error: any) {
        onSnackbar(error?.data?.message || "Failed to delete tech stack.", "error");
      }
    }
    setIsConfirmOpen(false);
    setSelectedItem(null);
  };

  const columns = [
    {
      id: "name",
      label: "Tech stack",
      render: (row: TechStackResponse) => (
        <Typography variant="body2">{row.techStackName}</Typography>
      ),
    },
    {
      id: "edit",
      label: "Edit",
      width: 80,
      headerAlign: "center" as const,
      align: "center" as const,
      render: (row: TechStackResponse) => (
        <IconButton
          size="small"
          onClick={() => {
            setEditData(row);
            setIsModalOpen(true);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
    {
      id: "delete",
      label: "Delete",
      width: 80,
      headerAlign: "center" as const,
      align: "center" as const,
      render: (row: TechStackResponse) => (
        <IconButton
          size="small"
          onClick={() => {
            setSelectedItem(row);
            setIsConfirmOpen(true);
          }}
        >
          <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Tech Stack
        </Typography>
        <PrimaryIconButton
          icon={<AddIcon />}
          variant="outlined"
          onClick={() => {
            setEditData(null);
            setIsModalOpen(true);
          }}
          title="Add"
        />
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <StandardTable
          columns={columns}
          rows={techStacks ?? []}
          loading={false}
          sticky
          emptyMessage="No tech stacks added yet"
        />
      )}

      <AddTechStackModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        onSave={handleSave}
        editData={editData}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        title="Delete Tech Stack"
        message="Are you sure you want to delete this tech stack? This action cannot be undone."
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
}
