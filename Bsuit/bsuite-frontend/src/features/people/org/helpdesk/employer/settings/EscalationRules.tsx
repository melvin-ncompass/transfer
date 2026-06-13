import { Add, Delete, Edit } from "@mui/icons-material";
import { Box, Typography, Chip } from "@mui/material";
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


import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import { useGetAllCategoriesQuery, useGetAllPrioritiesQuery } from "../../api/category.api";
import { type EscalationRule, useGetAllEscalationRulesQuery, useCreateEscalationRuleMutation, useUpdateEscalationRuleMutation, useDeleteEscalationRuleMutation } from "../../api/escalationRules.api";

function EscalationRules() {
  const [searchText, setSearchText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<EscalationRule | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [level, setLevel] = useState("");
  const [escalateToEmployeeId, setEscalateToEmployeeId] = useState("");
  const [timeBreachType, setTimeBreachType] = useState("");
  const [triggerAfterMinutes, setTriggerAfterMinutes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [validationError, setValidationError] = useState("");

  const isEditMode = Boolean(editingRule);

  // ============================================================================
  // API QUERIES
  // ============================================================================

  const { data: rulesData, isLoading } = useGetAllEscalationRulesQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: prioritiesData } = useGetAllPrioritiesQuery();
  const { data: employeesData } = useGetEmployeesQuery();

  const [createEscalationRule, { isLoading: isCreating }] =
    useCreateEscalationRuleMutation();
  const [updateEscalationRule, { isLoading: isUpdating }] =
    useUpdateEscalationRuleMutation();
  const [deleteEscalationRule, { isLoading: isDeleting }] =
    useDeleteEscalationRuleMutation();

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
      prioritiesData?.data?.map((priority: any) => ({
        label: priority.name,
        value: String(priority.id),
      })) ?? []
    );
  }, [prioritiesData]);

  const employeeOptions = useMemo(() => {
    return (
      employeesData?.data?.map((employee: any) => ({
        label:
          employee.name ||
          employee.contact?.name ||
          `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
          "Unnamed Employee",
        value: String(employee.id),
      })) ?? []
    );
  }, [employeesData]);

  const timeBreachTypeOptions = [
    { label: "Response", value: "response" },
    { label: "Resolution", value: "resolution" },
  ];

  // ============================================================================
  // FORM RESET
  // ============================================================================

  const resetForm = () => {
    setCategoryId("");
    setPriorityId("");
    setLevel("");
    setEscalateToEmployeeId("");
    setTimeBreachType("");
    setTriggerAfterMinutes("");
    setIsActive(true);
    setValidationError("");
    setEditingRule(null);
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

    if (!timeBreachType) {
      setValidationError("Time breach type is required");
      return false;
    }

    const levelNumber = Number(level);
    if (!level || levelNumber <= 0 || !Number.isInteger(levelNumber)) {
      setValidationError("Level must be a positive integer");
      return false;
    }

    if (!escalateToEmployeeId) {
      setValidationError("Escalation employee is required");
      return false;
    }

    const triggerMinutes = Number(triggerAfterMinutes);
    if (!triggerAfterMinutes || triggerMinutes <= 0) {
      setValidationError("Trigger time must be greater than 0");
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
        level: Number(level),
        escalateToEmployeeId: Number(escalateToEmployeeId),
        timeBreachType: timeBreachType as "response" | "resolution",
        triggerAfterMinutes: Number(triggerAfterMinutes),
        isActive,
      };

      if (isEditMode && editingRule) {
        await updateEscalationRule({
          id: editingRule.id,
          body: payload,
        }).unwrap();
      } else {
        await createEscalationRule(payload).unwrap();
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      setValidationError("Failed to save escalation rule");
    }
  };

  // ============================================================================
  // EDIT
  // ============================================================================

  const openEditModal = (rule: EscalationRule) => {
    setEditingRule(rule);
    setCategoryId(String(rule.categoryId ?? rule.category?.id ?? ""));
    setPriorityId(String(rule.priorityId ?? rule.priority?.id ?? ""));
    setLevel(String(rule.level ?? ""));
    setEscalateToEmployeeId(
      String(rule.escalateToEmployeeId ?? rule.escalateToEmployee?.id ?? "")
    );
    setTimeBreachType(rule.timeBreachType ?? "");
    setTriggerAfterMinutes(String(rule.triggerAfterMinutes ?? ""));
    setIsActive(rule.isActive ?? true);
    setModalOpen(true);
  };

  // ============================================================================
  // DELETE
  // ============================================================================

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      await deleteEscalationRule(deletingRule.id).unwrap();
      setDeleteModalOpen(false);
      setDeletingRule(null);
    } catch (error) {
      console.error(error);
    }
  };

  // ============================================================================
  // FILTER
  // ============================================================================

  const filteredRules = useMemo(() => {
    return (
      rulesData?.data?.filter(
        (item) =>
          item.category?.categoryName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          item.timeBreachType
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      ) ?? []
    );
  }, [rulesData, searchText]);

  const escalationRuleColumns = useMemo<StandardTableColumn[]>(
    () => [
      {
        id: "category",
        label: "Category",
        render: (rule: EscalationRule) => rule.category?.categoryName || "—",
      },
      {
        id: "priority",
        label: "Priority",
        render: (rule: EscalationRule) => rule.priority?.name || rule.priorityId || "—",
      },
      {
        id: "timeBreachType",
        label: "Time Breach Type",
        render: (rule: EscalationRule) => getTimeBreachTypeLabel(rule.timeBreachType ?? ""),
      },
      {
        id: "triggerAfterMinutes",
        label: "Trigger After (mins)",
        align: "right",
        render: (rule: EscalationRule) => rule.triggerAfterMinutes,
      },
      {
        id: "status",
        label: "Status",
        render: (rule: EscalationRule) => (
          <Chip
            label={rule.isActive ? "Active" : "Inactive"}
            color={rule.isActive ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        id: "escalateTo",
        label: "Escalate To",
        render: (rule: EscalationRule) =>
          rule.escalateToEmployee?.name || rule.escalateToEmployeeId || "—",
      },
      {
        id: "actions",
        label: "Actions",
        headerAlign: "center",
        align: "center",
        render: (rule: EscalationRule) => (
          <Box display={"flex"} justifyContent={"center"} gap={1}>
            <PrimaryIconButton
              icon={<Edit />}
              variant="outlined"
              size="small"
              onClick={() => openEditModal(rule)}
            />
            <PrimaryIconButton
              icon={<Delete />}
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                setDeletingRule(rule);
                setDeleteModalOpen(true);
              }}
            />
          </Box>
        ),
      },
    ],
    [openEditModal, setDeleteModalOpen, setDeletingRule]
  );

  // ============================================================================
  // GET ESCALATION TYPE LABEL
  // ============================================================================

  const getTimeBreachTypeLabel = (type: string) => {
    return type === "response" ? "Response" : "Resolution";
  };

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
          label="Search Escalation Rules"
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
        columns={escalationRuleColumns}
        rows={filteredRules}
        loading={isLoading}
        emptyMessage="No escalation rules found"
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
        title="Delete Escalation Rule"
        message={
          <>
            Are you sure you want to delete the escalation rule for{" "}
            <strong>{deletingRule?.category?.categoryName}</strong>?
          </>
        }
      />

      {/* ============================================================================
          CREATE / EDIT MODAL
      ============================================================================ */}
      <ModalElement
        open={modalOpen}
        title={isEditMode ? "Edit Escalation Rule" : "Add Escalation Rule"}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        maxWidth="sm"
      >
        <Box
          display={"flex"}
          flexDirection={"column"}
          gap={2}
          width={500}
          maxWidth={"100%"}
        >
          {/* Category */}
          <SingleSelectElement
            label="Category *"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            disabled={isEditMode}
          />

          <SingleSelectElement
            label="Priority *"
            value={priorityId}
            onChange={setPriorityId}
            options={priorityOptions}
          />

          <TextFieldElement
            label="Level *"
            type="number"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            //inputProps={{ min: 1 }}
          />

          <SingleSelectElement
            label="Escalate To Employee *"
            value={escalateToEmployeeId}
            onChange={setEscalateToEmployeeId}
            options={employeeOptions}
          />

          {/* Time Breach Type */}
          <SingleSelectElement
            label="Time Breach Type *"
            value={timeBreachType}
            onChange={setTimeBreachType}
            options={timeBreachTypeOptions}
          />

          {/* Trigger After */}
          <TextFieldElement
            label="Trigger After (minutes) *"
            type="number"
            value={triggerAfterMinutes}
            onChange={(e) => setTriggerAfterMinutes(e.target.value)}
          //  inputProps={{ min: 1 }}
          />

          {/* Active Toggle */}
          <Box display="flex" alignItems="center" gap={2}>
            <Typography>Active:</Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: isActive ? "#4caf50" : "#e0e0e0",
                borderRadius: 1,
                px: 1,
                py: 0.5,
                cursor: "pointer",
              }}
              onClick={() => setIsActive(!isActive)}
            >
              <Typography
                variant="body2"
                sx={{
                  color: isActive ? "white" : "text.primary",
                  fontWeight: 500,
                }}
              >
                {isActive ? "Yes" : "No"}
              </Typography>
            </Box>
          </Box>

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

export default EscalationRules;
