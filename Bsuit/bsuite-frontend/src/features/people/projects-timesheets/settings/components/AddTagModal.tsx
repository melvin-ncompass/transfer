import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import type { ProjectTagResponse } from "../types/projectSettings.types";

interface AddTagModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editData?: ProjectTagResponse | null;
  loading?: boolean;
}

export function AddTagModal({
  open,
  onClose,
  onSave,
  editData = null,
  loading = false,
}: AddTagModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const isEditMode = Boolean(editData);

  useEffect(() => {
    if (open) {
      setName(editData?.tagName ?? "");
      setError("");
    }
  }, [open, editData]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Tag name is required");
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
      title={isEditMode ? "Edit Tag" : "Add Tags"}
      onClick={handleSave}
      maxWidth="xs"
      disabled={!name.trim() || (isEditMode && name.trim() === editData?.tagName) || loading}
    >
      <Box sx={{ mt: 1 }}>
        <TextFieldElement
          name="tag"
          label="Tag"
          required
          fullWidth
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          placeholder="Tag name"
          error={!!error}
          helperText={error}
        />
      </Box>
    </ModalElement>
  );
}
