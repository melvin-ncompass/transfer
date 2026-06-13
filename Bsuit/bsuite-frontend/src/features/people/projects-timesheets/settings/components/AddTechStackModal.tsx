import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import type { TechStackResponse } from "../types/projectSettings.types";

interface AddTechStackModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editData?: TechStackResponse | null;
  loading?: boolean;
}

export function AddTechStackModal({
  open,
  onClose,
  onSave,
  editData = null,
  loading = false,
}: AddTechStackModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const isEditMode = Boolean(editData);

  useEffect(() => {
    if (open) {
      setName(editData?.techStackName ?? "");
      setError("");
    }
  }, [open, editData]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Tech stack name is required");
      return;
    }
    onSave(name.trim());
    // handleClose();
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Edit Tech Stack" : "Add Tech Stack"}
      onClick={handleSave}
      maxWidth="xs"
      disabled={!name.trim() || (isEditMode && name.trim() === editData?.techStackName) || loading}
    >
      <Box sx={{ mt: 1 }}>
        <TextFieldElement
          name="techStack"
          label="Tech Stack"
          required
          fullWidth
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          placeholder="Tech stack name"
          error={!!error}
          helperText={error}
        />
      </Box>
    </ModalElement>
  );
}
