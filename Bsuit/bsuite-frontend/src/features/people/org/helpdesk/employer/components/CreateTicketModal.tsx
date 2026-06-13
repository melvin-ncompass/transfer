import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import { useGetAllCategoriesQuery } from "../../api/category.api";
import { useCreateTicketMutation } from "../../api/ticket.api";
import type { Ticket, CreateTicketPayload } from "../../api/ticket.types";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";

export interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

function getPersonId(person: Ticket["requester"] | Ticket["assignee"]) {
  return person?.id ? String(person.id) : "";
}

function CreateTicketModal({
  open,
  onClose,
  ticket,
  onSuccess,
  onError,
}: CreateTicketModalProps) {
  const isEditMode = Boolean(ticket?.id);

  const [ticketNumber, setTicketNumber] = useState("");
  const [requesterId, setRequesterId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { data: employeesData } = useGetEmployeesQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();

  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();

  const isSaving = isCreating;

  const employeeOptions = useMemo(
    () =>
      employeesData?.data?.map((employee) => ({
        label:
          employee.name ||
          employee.contact?.name ||
          employee.nameAsPerPan ||
          "Unnamed Employee",
        value: String(employee.id),
      })) ?? [],
    [employeesData],
  );

  const categoryOptions = useMemo(
    () =>
      categoriesData?.data?.map((category) => ({
        label: category.categoryName,
        value: String(category.id),
      })) ?? [],
    [categoriesData],
  );

  const resetForm = () => {
    setTicketNumber("");
    setRequesterId("");
    setSubject("");
    setDescription("");
    setCategoryId("");
    setIsConfidential(false);
    setValidationError("");
  };

  useEffect(() => {
    if (!open) return;

    if (ticket) {
      setTicketNumber(ticket.ticketNumber ?? "");
      setRequesterId(getPersonId(ticket.requester));
      setSubject(ticket.subject ?? "");
      setDescription(ticket.description ?? "");
      setCategoryId(ticket.category?.id ? String(ticket.category.id) : "");
      setIsConfidential(Boolean(ticket.isConfidential));
      setValidationError("");
      return;
    }

    resetForm();
  }, [open, ticket]);

  const validateForm = () => {
    setValidationError("");

    if (isEditMode && !ticketNumber.trim()) {
      setValidationError("Ticket number is missing");
      return false;
    }

    if (!requesterId) {
      setValidationError("Requester is required");
      return false;
    }

    if (!subject.trim()) {
      setValidationError("Subject is required");
      return false;
    }

    if (!categoryId) {
      setValidationError("Category is required");
      return false;
    }

    return true;
  };

  const buildCreatePayload = (): CreateTicketPayload => {
    const selectedCategory = categoriesData?.data?.find(
      (category) => String(category.id) === categoryId,
    );
    const resolvedPriorityId = selectedCategory?.defaultPriority?.id ?? 1;

    return {
      requesterId: Number(requesterId),
      subject: subject.trim(),
      description: description.trim(),
      categoryId: Number(categoryId),
      priorityId: resolvedPriorityId,
      isConfidential,
    };
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const response = await createTicket(buildCreatePayload()).unwrap();

      onSuccess?.(
        response.message ?? "Ticket created successfully",
      );

      resetForm();
      onClose();
    } catch (error) {
      onError?.(
        getBackendMessage(
          error,
          "Failed to create ticket",
        ),
      );
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit Ticket" : "Create Ticket"}
      maxWidth="md"
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {isEditMode && (
          <TextFieldElement
            label="Ticket Number"
            value={ticketNumber}
            disabled
          />
        )}

        <SingleSelectElement
          label="Requester"
          value={requesterId}
          onChange={setRequesterId}
          options={employeeOptions}
          required
          width="100%"
        />

        <TextFieldElement
          label="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />

        <TextFieldElement
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          multiline
          rows={3}
        />

        <SingleSelectElement
          label="Category"
          value={categoryId}
          onChange={setCategoryId}
          options={categoryOptions}
          required
          width="100%"
        />

        <Checkbox
          label="Confidential"
          checked={isConfidential}
          onChange={() => setIsConfidential(!isConfidential)}
        />

        {validationError && (
          <Typography color="error" variant="body2">
            {validationError}
          </Typography>
        )}

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <PrimaryButton
            variant="outlined"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </PrimaryButton>

          <PrimaryButton onClick={handleSave} disabled={isSaving}>
            Save
          </PrimaryButton>
        </Box>
      </Stack>
    </ModalElement>
  );
}

export default CreateTicketModal;
