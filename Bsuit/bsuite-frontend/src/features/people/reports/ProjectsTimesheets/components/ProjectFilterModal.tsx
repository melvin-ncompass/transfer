import { useState, useEffect, useMemo } from "react";
import { Stack, Box, FormControlLabel, Checkbox } from "@mui/material";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useGetTechStacksQuery } from "../../../projects-timesheets/settings/api/projectSettings.api";
import type { TechStackResponse } from "../../../projects-timesheets/settings/types/projectSettings.types";

interface ProjectFilterModalProps {
  open: boolean;
  onClose: () => void;
  initialValues: {
    techStackId: number | null;
    isBillable: boolean;
  };
  onApply: (filters: {
    techStackId: number | null;
    isBillable: boolean;
  }) => void;
}

export function ProjectFilterModal({
  open,
  onClose,
  initialValues,
  onApply,
}: ProjectFilterModalProps) {
  // State
  const [techStackId, setTechStackId] = useState<string>("");
  const [isBillable, setIsBillable] = useState<boolean>(false);

  // Queries
  const { data: techData } = useGetTechStacksQuery();

  // Options
  const techOptions = useMemo(() => {
    return (
      techData?.map((t: TechStackResponse) => ({
        label: t.techStackName,
        value: String(t.id),
      })) ?? []
    );
  }, [techData]);

  // Sync on open
  useEffect(() => {
    if (open && initialValues) {
      setTechStackId(initialValues.techStackId ? String(initialValues.techStackId) : "");
      setIsBillable(initialValues.isBillable);
    }
  }, [open, initialValues]);

  const hasChanges = useMemo(() => {
    const currentTechStackId = techStackId ? Number(techStackId) : null;
    return (
      currentTechStackId !== initialValues.techStackId ||
      isBillable !== initialValues.isBillable
    );
  }, [techStackId, isBillable, initialValues]);

  const handleApply = () => {
    onApply({
      techStackId: techStackId ? Number(techStackId) : null,
      isBillable,
    });
    onClose();
  };

  return (
    <ModalElement
      open={open}
      title="Filters"
      onClose={onClose}
      height={320}
      maxWidth="sm"
      hideCloseButton={false}
      sx={{
        "& .MuiDialog-paper": {
          width: { xs: "98vw", sm: 440 },
          margin: 2,
        },
      }}
    >
      <Stack spacing={2.5} width="100%" sx={{ pt: 1 }}>
        <SingleSelectElement
          label="Tech stack"
          options={techOptions}
          value={techStackId}
          onChange={setTechStackId}
          width="100%"
          placeholder="Select an option"
          clearable
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              color="primary"
            />
          }
          label="Only Billable"
          sx={{ userSelect: "none" }}
        />
      </Stack>
      
      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton onClick={handleApply} disabled={!hasChanges}>
          Update
        </PrimaryButton>
      </Box>
    </ModalElement>
  );
}
