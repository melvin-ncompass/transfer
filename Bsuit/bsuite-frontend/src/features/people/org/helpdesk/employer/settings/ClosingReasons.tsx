import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from "react";

import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";

import { TextFieldElement } from "../../../../../../components/atom/text-field";

import { ModalElement } from "../../../../../../components/dialogs/modal-element";

import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { useGetAllClosingReasonsQuery, useCreateClosingReasonMutation, useUpdateClosingReasonMutation, useDeleteClosingReasonMutation } from "../../api/closure.api";



export type ClosingReasonsRef = { openAddModal: () => void };

export default forwardRef<ClosingReasonsRef, { searchQuery?: string }>(function ClosingReasons(
  { searchQuery = "" },
  ref,
) {
  const [searchText, setSearchText] = useState("");
  const effectiveSearch = searchQuery || searchText;

  const [modalOpen, setModalOpen] = useState(false);

  useImperativeHandle(ref, () => ({ openAddModal: () => { resetForm(); setModalOpen(true); } }));

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingReason, setEditingReason] = useState<any | null>(
    null,
  );

  const [deletingReason, setDeletingReason] = useState<any | null>(
    null,
  );

  const [reason, setReason] = useState("");

  const [description, setDescription] = useState("");

  const [isActive, setIsActive] = useState(true);

  const isEditMode = Boolean(editingReason);

  const { data, isLoading } = useGetAllClosingReasonsQuery();

  const [createClosingReason, { isLoading: isCreating }] =
    useCreateClosingReasonMutation();

  const [updateClosingReason, { isLoading: isUpdating }] =
    useUpdateClosingReasonMutation();

  const [deleteClosingReason, { isLoading: isDeleting }] =
    useDeleteClosingReasonMutation();

  const payload = useMemo(() => {
    return {
      reason,
      description,
      isActive,
    };
  }, [reason, description, isActive]);

  const resetForm = () => {
    setReason("");
    setDescription("");
    setIsActive(true);
    setEditingReason(null);
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode) {
        await updateClosingReason({
          id: editingReason.id,
          body: payload,
        }).unwrap();
      } else {
        await createClosingReason(payload).unwrap();
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (item: any) => {
    setEditingReason(item);

    setReason(item.reason ?? "");
    setDescription(item.description ?? "");
    setIsActive(item.isActive ?? true);

    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteClosingReason(id).unwrap();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!modalOpen) {
      resetForm();
    }
  }, [modalOpen]);

  const filteredReasons =
    data?.data?.filter((item: any) =>
      item.reason
        ?.toLowerCase()
        .includes(effectiveSearch.toLowerCase()),
    ) ?? [];

  return (
    <Box width={"100%"} height={"100%"}>

      <Stack spacing={2}>
        {!isLoading &&
          filteredReasons.map((item: any) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
              }}
            >
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                gap={2}
              >
                <Box>
                  <Typography fontWeight={600}>
                    {item.reason}
                  </Typography>

                  {!!item.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mt={0.5}
                    >
                      {item.description}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    color={
                      item.isActive
                        ? "success.main"
                        : "error.main"
                    }
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </Typography>
                </Box>

                <Box display={"flex"} gap={1}>
                  <PrimaryIconButton
                    icon={<Edit />}
                    variant="outlined"
                    onClick={() => openEditModal(item)}
                  />

                  <PrimaryIconButton
                    icon={<Delete />}
                    variant="outlined"
                    color="error"
                    loading={isDeleting}
                    onClick={() => {
                      setDeletingReason(item);
                      setDeleteModalOpen(true);
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          ))}
      </Stack>

      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete(deletingReason.id);

          setDeleteModalOpen(false);
          setDeletingReason(null);
        }}
        confirmColor="error"
        message="Are you sure you want to delete this closing reason?"
      />

      <ModalElement
        open={modalOpen}
        title={
          isEditMode
            ? "Edit Closing Reason"
            : "Add Closing Reason"
        }
        onClose={() => setModalOpen(false)}
      >
        <Box
          display={"flex"}
          flexDirection={"column"}
          gap={2}
          width={500}
          maxWidth={"100%"}
        >
          <TextFieldElement
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
          />

          <TextFieldElement
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) =>
                  setIsActive(e.target.checked)
                }
              />
            }
            label={isActive ? "Active" : "Inactive"}
          />

          <Box
            display={"flex"}
            justifyContent={"flex-end"}
            mt={1}
          >
            <PrimaryButton
              onClick={handleSubmit}
              loading={isCreating || isUpdating}
              disabled={!reason.trim()}
            >
              {isEditMode ? "Update" : "Save"}
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>
    </Box>
  );
});