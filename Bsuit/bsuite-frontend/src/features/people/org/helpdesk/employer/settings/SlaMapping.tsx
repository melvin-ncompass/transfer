import { Add, Delete, Edit } from "@mui/icons-material";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";

import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";

import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import { useGetAllCategoriesQuery, useGetAllPrioritiesQuery } from "../../api/category.api";
import { type SLACategoryMapping, useGetAllSLAMappingsQuery, useCreateSlaMappingMutation, useUpdateSlaMappingMutation, useDeleteSlaMappingMutation } from "../../api/slaMapping.api";


function SlaMapping() {
  const [searchText, setSearchText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingMapping, setEditingMapping] = useState<SLACategoryMapping | null>(null);
  const [deletingMapping, setDeletingMapping] = useState<SLACategoryMapping | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [resolutionTime, setResolutionTime] = useState("");

  const [validationError, setValidationError] = useState("");

  const isEditMode = Boolean(editingMapping);

  // ============================================================================
  // API QUERIES
  // ============================================================================

  const { data: mappingsData, isLoading } = useGetAllSLAMappingsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: prioritiesData } = useGetAllPrioritiesQuery();

  const [createSlaMapping, { isLoading: isCreating }] = useCreateSlaMappingMutation();
  const [updateSlaMapping, { isLoading: isUpdating }] = useUpdateSlaMappingMutation();
  const [deleteSlaMapping, { isLoading: isDeleting }] = useDeleteSlaMappingMutation();

  // ============================================================================
  // OPTIONS
  // ============================================================================

  const categoryOptions = useMemo(() => {
    return (
      categoriesData?.data?.map((cat: any) => ({
        label: cat.categoryName,
        value: String(cat.id),
      })) ?? []
    );
  }, [categoriesData]);

  const priorityOptions = useMemo(() => {
    return (
      prioritiesData?.data?.map((pri: any) => ({
        label: pri.name,
        value: String(pri.id),
      })) ?? []
    );
  }, [prioritiesData]);

  // ============================================================================
  // FORM RESET
  // ============================================================================

  const resetForm = () => {
    setCategoryId("");
    setPriorityId("");
    setResponseTime("");
    setResolutionTime("");
    setValidationError("");
    setEditingMapping(null);
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = () => {
    setValidationError("");

    if (!categoryId) {
      setValidationError("Category is required");
      return false;
    }

    if (!priorityId) {
      setValidationError("Priority is required");
      return false;
    }

    const respTime = Number(responseTime);
    if (!responseTime || respTime <= 0) {
      setValidationError("Response time must be greater than 0");
      return false;
    }

    const resTime = Number(resolutionTime);
    if (!resolutionTime || resTime <= 0) {
      setValidationError("Resolution time must be greater than 0");
      return false;
    }

    // Check for duplicates (excluding current editing item)
    const isDuplicate = mappingsData?.data?.some(
      (m) =>
        m.category.id === Number(categoryId) &&
        m.priority.id === Number(priorityId) &&
        m.id !== editingMapping?.id
    );

    if (isDuplicate) {
      setValidationError(
        "SLA mapping already exists for this category and priority"
      );
      return false;
    }

    return true;
  };

  // ============================================================================
  // SAVE (CREATE)
  // ============================================================================

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        categoryId: Number(categoryId),
        priorityId: Number(priorityId),
        defaultResponseTimeMinutes: Number(responseTime),
        defaultResolutionTimeMinutes: Number(resolutionTime),
      };

      if (isEditMode && editingMapping) {
        await updateSlaMapping({
          id: editingMapping.id,
          body: payload,
        }).unwrap();
      } else {
        await createSlaMapping(payload).unwrap();
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      setValidationError("Failed to save SLA mapping");
    }
  };

  // ============================================================================
  // EDIT
  // ============================================================================

  const openEditModal = (mapping: SLACategoryMapping) => {
    setEditingMapping(mapping);
    setCategoryId(String(mapping.category.id));
    setPriorityId(String(mapping.priority.id));
    setResponseTime(String(mapping.defaultResponseTimeMinutes));
    setResolutionTime(String(mapping.defaultResolutionTimeMinutes));
    setModalOpen(true);
  };

  // ============================================================================
  // DELETE
  // ============================================================================

  const handleDelete = async () => {
    if (!deletingMapping) return;
    try {
      await deleteSlaMapping(deletingMapping.id).unwrap();
      setDeleteModalOpen(false);
      setDeletingMapping(null);
    } catch (error) {
      console.error(error);
    }
  };

  // ============================================================================
  // FILTER
  // ============================================================================

  const filteredMappings = useMemo(() => {
    return (
      mappingsData?.data?.filter(
        (item) =>
          item.category.categoryName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.priority.name?.toLowerCase().includes(searchText.toLowerCase())
      ) ?? []
    );
  }, [mappingsData, searchText]);

  const slaMappingColumns = useMemo<StandardTableColumn[]>(
    () => [
      {
        id: "category",
        label: "Category",
        render: (mapping: SLACategoryMapping) => mapping.category.categoryName,
      },
      {
        id: "priority",
        label: "Priority",
        render: (mapping: SLACategoryMapping) => mapping.priority.name,
      },
      {
        id: "defaultResponseTimeMinutes",
        label: "Response Time (mins)",
        align: "right",
        render: (mapping: SLACategoryMapping) => mapping.defaultResponseTimeMinutes,
      },
      {
        id: "defaultResolutionTimeMinutes",
        label: "Resolution Time (mins)",
        align: "right",
        render: (mapping: SLACategoryMapping) => mapping.defaultResolutionTimeMinutes,
      },
      {
        id: "actions",
        label: "Actions",
        headerAlign: "center",
        align: "center",
        render: (mapping: SLACategoryMapping) => (
          <Box display={"flex"} justifyContent={"center"} gap={1}>
            <PrimaryIconButton
              icon={<Edit />}
              variant="outlined"
              size="small"
              onClick={() => openEditModal(mapping)}
            />
            <PrimaryIconButton
              icon={<Delete />}
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                setDeletingMapping(mapping);
                setDeleteModalOpen(true);
              }}
            />
          </Box>
        ),
      },
    ],
    [openEditModal]
  );

  return (
    <Box width={"100%"} height={"100%"}>
      {/* ============================================================================
          HEADER
      ============================================================================ */}
      <Box
        width={"100%"}
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        gap={2}
        mb={2}
      >
        <TextFieldElement
          label="Search SLA Mappings"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          fullWidth
        />

        <PrimaryIconButton
          icon={<Add />}
          variant="outlined"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
        />
      </Box>

      {/* ============================================================================
          TABLE
      ============================================================================ */}
      <StandardTable
        columns={slaMappingColumns}
        rows={filteredMappings}
        loading={isLoading}
        emptyMessage="No SLA mappings found"
        nowrapCells
      />

      {/* ============================================================================
          DELETE CONFIRM DIALOG
      ============================================================================ */}
      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        confirmColor="error"
        title="Delete SLA Mapping"
        message={
          <>
            Are you sure you want to delete the SLA mapping for{" "}
            <strong>
              {deletingMapping?.category.categoryName} -{" "}
              {deletingMapping?.priority.name}
            </strong>
            ?
          </>
        }
      />

      {/* ============================================================================
          CREATE / EDIT MODAL
      ============================================================================ */}
      <ModalElement
        open={modalOpen}
        title={isEditMode ? "Edit SLA Mapping" : "Add SLA Mapping"}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        maxWidth="sm"
      >
        <Box display={"flex"} flexDirection={"column"} gap={2} width={500} maxWidth={"100%"}>
          {/* Category */}
          <SingleSelectElement
            label="Category *"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            disabled={isEditMode}
          />

          {/* Priority */}
          <SingleSelectElement
            label="Priority *"
            value={priorityId}
            onChange={setPriorityId}
            options={priorityOptions}
            disabled={isEditMode}
          />

          {/* Response Time */}
          <TextFieldElement
            label="Response Time (minutes) *"
            type="number"
            value={responseTime}
            onChange={(e) => setResponseTime(e.target.value)}
          //  inputProps={{ min: 1 }}
          />

          {/* Resolution Time */}
          <TextFieldElement
            label="Resolution Time (minutes) *"
            type="number"
            value={resolutionTime}
            onChange={(e) => setResolutionTime(e.target.value)}
            //  inputProps={{ min: 1 }}
          />

          {/* Validation Error */}
          {validationError && (
            <Typography color="error" variant="body2">
              {validationError}
            </Typography>
          )}

          {/* Buttons */}
          <Box display={"flex"} justifyContent={"flex-end"} gap={1} mt={2}>
            <PrimaryButton
              variant="outlined"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton
              onClick={handleSubmit}
              loading={isCreating || isUpdating}
            >
              {isEditMode ? "Update" : "Save"}
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>
    </Box>
  );
}

export default SlaMapping;
