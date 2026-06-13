import { useState } from "react";
import { Box, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import { AddTagModal } from "./AddTagModal";
import type { ProjectTagResponse } from "../types/projectSettings.types";
import {
  useGetProjectTagsQuery,
  useCreateProjectTagMutation,
  useUpdateProjectTagMutation,
  useDeleteProjectTagMutation,
} from "../api/projectSettings.api";

interface TagsSectionProps {
  onSnackbar: (message: string, severity: "success" | "error") => void;
}

export function TagsSection({ onSnackbar }: TagsSectionProps) {
  const { data: tags, isLoading } = useGetProjectTagsQuery();
  const [createTag, { isLoading: isCreating }] = useCreateProjectTagMutation();
  const [updateTag, { isLoading: isUpdating }] = useUpdateProjectTagMutation();
  const [deleteTag] = useDeleteProjectTagMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<ProjectTagResponse | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProjectTagResponse | null>(null);

  const handleSave = async (name: string) => {
    try {
      if (editData) {
        await updateTag({ id: editData.id, body: { tagName: name } }).unwrap();
        onSnackbar("Tag updated successfully!", "success");
        setIsModalOpen(false);
      } else {
        await createTag({ tagName: name }).unwrap();
        onSnackbar("Tag added successfully!", "success");
        setIsModalOpen(false);
      }
    } catch (error: any) {
      onSnackbar(
        error?.data?.message || (editData ? "Failed to update tag." : "Failed to add tag."),
        "error"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      try {
        await deleteTag(selectedItem.id).unwrap();
        onSnackbar("Tag deleted successfully!", "success");
      } catch (error: any) {
        onSnackbar(error?.data?.message || "Failed to delete tag.", "error");
      }
    }
    setIsConfirmOpen(false);
    setSelectedItem(null);
  };

  const columns = [
    {
      id: "name",
      label: "Tag",
      render: (row: ProjectTagResponse) => (
        <Typography variant="body2">{row.tagName}</Typography>
      ),
    },
    {
      id: "edit",
      label: "Edit",
      width: 80,
      headerAlign: "center" as const,
      align: "center" as const,
      render: (row: ProjectTagResponse) => (
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
      render: (row: ProjectTagResponse) => (
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
          Tags
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
          rows={tags ?? []}
          loading={false}
          sticky
          emptyMessage="No tags added yet"
        />
      )}

      <AddTagModal
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
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
}
