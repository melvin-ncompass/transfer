import React, { useState } from "react";
import { Box } from "@mui/material";
import { TextFieldElement } from "../../../../../components/atom/text-field/TextField";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import {
  MAX_BILLABLE_HOURS_PER_DAY,
  type ProjectParams,
} from "../types/project.types";
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip } from "../../../../../components/atom/tooltip";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: ProjectParams) => void;
  loading?: boolean;
}

export function AddProjectModal({
  open,
  onClose,
  onSave,
  loading = false,
}: AddProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [billableHoursPerDay, setBillableHoursPerDay] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!projectName.trim()) newErrors.projectName = "Project Name is required";
    if (!billableHoursPerDay.trim()) {
      newErrors.billableHoursPerDay = "Billable hrs/day is required";
    } else {
      const n = Number(billableHoursPerDay);
      if (isNaN(n) || n <= 0) {
        newErrors.billableHoursPerDay = "Must be a valid positive number";
      } else if (n > MAX_BILLABLE_HOURS_PER_DAY) {
        newErrors.billableHoursPerDay = `Cannot exceed ${MAX_BILLABLE_HOURS_PER_DAY} hours per day`;
      }
    }
    return newErrors;
  };

  const handleSave = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave({ projectName: projectName.trim(), billableHoursPerDay: Number(billableHoursPerDay) });
    // handleClose();
  };

  const handleClose = () => {
    setProjectName("");
    setBillableHoursPerDay("");
    setErrors({});
    onClose();
  };

  const isDisabled = !projectName.trim() || !billableHoursPerDay.trim();

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title="Add Project"
      onClick={handleSave}
      maxWidth="sm"
      disabled={isDisabled || loading}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          mt: 1,
        }}
      >
        <TextFieldElement
          name="projectName"
          label="Project Name"
          required
          fullWidth
          value={projectName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setProjectName(e.target.value);
            if (errors.projectName) setErrors({ ...errors, projectName: "" });
          }}
          placeholder="Enter Project Name"
          error={!!errors.projectName}
          helperText={errors.projectName}
        />

          <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1}}>
        <TextFieldElement
          name="billableHoursPerDay"
          label="Billable hrs/day"
          required
          fullWidth
          type="number"
          value={billableHoursPerDay}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            let v = e.target.value;
            if (v !== "" && v !== ".") {
              const n = Number(v);
              if (!Number.isNaN(n) && n > MAX_BILLABLE_HOURS_PER_DAY) {
                v = String(MAX_BILLABLE_HOURS_PER_DAY);
              }
            }
            setBillableHoursPerDay(v);
            if (errors.billableHoursPerDay) setErrors({ ...errors, billableHoursPerDay: "" });
          }}
          placeholder="e.g. 8"
          error={!!errors.billableHoursPerDay}
          helperText={errors.billableHoursPerDay}
        />
      <Tooltip title="Billable hrs is restricted to 24">
        <InfoIcon color="info" />
      </Tooltip>
      </Box>
      </Box>
    </ModalElement>
  );
}
