import {
  Add,
  DeleteOutline,
  EditOutlined,
} from "@mui/icons-material";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";

import {
  Box,
  Divider,
  IconButton,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from "react";

import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";

import { TextFieldElement } from "../../../../../../components/atom/text-field";

import { ModalElement } from "../../../../../../components/dialogs/modal-element";

import { StandardTable } from "../../../../../../components/tables/standard-table";


import TipTapEditor from "../../../../home/ClockInOut/components/TiptapEditor";
import { useSnackbar } from "../../../../../../context/SnackbarContext";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useGetCannedResponsesQuery, useCreateCannedResponseMutation, useUpdateCannedResponseMutation, useDeleteCannedResponseMutation, useToggleCannedResponseActiveMutation, useToggleCannedResponseInternalMutation } from "../../api/cannedResponses.api";

export type CannedResponsesRef = { openAddModal: () => void };

export default forwardRef<CannedResponsesRef, { searchQuery?: string }>(function CannedResponses(
  { searchQuery = "" },
  ref,
) {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color?: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    color: "info",
  });
  const showSnackbar = (
    message: string,
    color: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setSnackbar({
      open: true,
      message,
      color,
    });
  };
  const [searchText, setSearchText] = useState("");
  const effectiveSearch = searchQuery || searchText;

  const [modalOpen, setModalOpen] = useState(false);

  useImperativeHandle(ref, () => ({ openAddModal: () => setModalOpen(true) }));

  const [editingId, setEditingId] = useState<number | null>(
    null,
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [isActive, setIsActive] = useState(true);

  const [isInternal, setIsInternal] = useState(false);

  const { data, isLoading } =
    useGetCannedResponsesQuery();

  const [createCannedResponse, { isLoading: isCreating }] =
    useCreateCannedResponseMutation();

  const [updateCannedResponse, { isLoading: isUpdating }] =
    useUpdateCannedResponseMutation();

  const [deleteCannedResponse] =
    useDeleteCannedResponseMutation();

  const [toggleActive] =
    useToggleCannedResponseActiveMutation();

  const [toggleInternal] =
    useToggleCannedResponseInternalMutation();

  const resetForm = () => {
    setEditingId(null);

    setTitle("");
    setContent("");

    setIsActive(true);
    setIsInternal(false);
  };

  useEffect(() => {
    if (!modalOpen) {
      resetForm();
    }
  }, [modalOpen]);

  const filteredResponses = useMemo(() => {
    return (
      data?.data?.filter((item) =>
        item.title
          .toLowerCase()
          .includes(effectiveSearch.toLowerCase()),
      ) ?? []
    );
  }, [data, effectiveSearch]);

  const handleSave = async () => {
    try {
      const payload = {
        title,
        content,
        isActive,
        isInternal,
      };

      if (editingId) {
        await updateCannedResponse({
          id: editingId,
          body: payload,
        }).unwrap();
        showSnackbar("Canned response updated successfully", "success");
      } else {
        await createCannedResponse(payload).unwrap();
        showSnackbar("Canned response created successfully", "success");
      }

      setModalOpen(false);
    } catch (error: any) {
      showSnackbar(error.data?.message || "Failed to save canned response", "error");
      console.error(error);
    }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);

    setTitle(row.title);
    setContent(row.content);

    setIsActive(row.isActive);
    setIsInternal(row.isInternal);

    setModalOpen(true);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const handleDelete = async (id: number) => {
    console.log("here", id)
    setConfirmDeleteId(id);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (confirmDeleteId == null) return;
    try {
      await deleteCannedResponse(confirmDeleteId).unwrap();
      showSnackbar("Canned response deleted successfully", "success");
    } catch (error: any) {
      showSnackbar(error.data?.message || "Failed to delete canned response", "error");
      console.error(error);
    } finally {
      setConfirmDeleteId(null);
      setDeleteModalOpen(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "title",
        label: "Title",
        render: (row: any) => (
          <Typography fontWeight={600}>
            {row.title}
          </Typography>
        ),
      },

      {
        id: "content",
        label: "Preview",
        render: (row: any) => (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
            dangerouslySetInnerHTML={{
              __html: row.content,
            }}
          />
        ),
      },

      {
        id: "status",
        label: "Status",
        width: 140,
        render: (row: any) => (
          <Switch
            checked={row.isActive}
            onChange={async () => {
              try {
                await toggleActive(row.id).unwrap();
                showSnackbar("Status updated", "success");
              } catch (error: any) {
                showSnackbar(error.data?.message || "Failed to update status", "error");
              }
            }}
          />
        ),
      },

      {
        id: "internal",
        label: "Internal",
        width: 140,
        render: (row: any) => (
          <Switch
            checked={row.isInternal}
            onChange={async () => {
              try {
                await toggleInternal(row.id).unwrap();
                showSnackbar("Internal status updated", "success");
              } catch (error: any) {
                showSnackbar(error.data?.message || "Failed to update internal status", "error");
              }
            }}
          />
        ),
      },

      {
        id: "actions",
        label: "Actions",
        align: "right" as const,
        width: 120,
        render: (row: any) => (
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
          >
            <IconButton
              size="small"
              onClick={() => handleEdit(row)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(row.id)}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>

          </Stack>
        ),
      },
    ],
    [toggleActive, toggleInternal],
  );

  return (
    <Box width={"100%"} height={"100%"}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <StandardTable
          columns={columns}
          rows={filteredResponses}
          loading={isLoading}
          emptyMessage="No canned responses found"
        />
      </Paper>
      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Canned Response"
        message="Are you sure you want to delete this canned response?"
        onClose={() => {
          setConfirmDeleteId(null);
          setDeleteModalOpen(false);
        }}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmColor="error"
      />
      <ModalElement
        open={modalOpen}
        title={
          editingId
            ? "Edit Canned Response"
            : "Add Canned Response"
        }
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        height="85vh"
      >
        <Box
          display={"flex"}
          flexDirection={"column"}
          gap={2}
          width={800}
          maxWidth={"100%"}
        >
          <TextFieldElement
            label="Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            fullWidth
            required
          />

          <Divider />

          <Box>
            <Typography
              fontWeight={600}
              mb={1}
            >
              Response Content
            </Typography>

            <TipTapEditor
              content={content}
              onChange={setContent}
            />
          </Box>

          <Stack
            direction="row"
            spacing={3}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Typography>
                Active
              </Typography>

              <Switch
                checked={isActive}
                onChange={(e) =>
                  setIsActive(
                    e.target.checked,
                  )
                }
              />
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Typography>
                Internal
              </Typography>

              <Switch
                checked={isInternal}
                onChange={(e) =>
                  setIsInternal(
                    e.target.checked,
                  )
                }
              />
            </Stack>
          </Stack>

          <Box
            display={"flex"}
            justifyContent={"flex-end"}
            mt={1}
          >
            <PrimaryButton
              onClick={handleSave}
              loading={
                isCreating || isUpdating
              }
              disabled={
                !title.trim() ||
                !content.trim()
              }
            >
              Save
            </PrimaryButton>
          </Box>

        </Box>
      </ModalElement>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        />
      )}
    </Box>

  );
});