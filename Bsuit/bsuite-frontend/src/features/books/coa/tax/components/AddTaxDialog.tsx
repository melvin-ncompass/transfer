import React, { useEffect, useMemo } from "react";
import { Box, Divider } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { TextAreaField } from "../../../../../components/atom/text-area-field/TextAreaField";
import { PrimaryButton } from "../../../../../components/atom/button";

interface AddTaxDialogProps {
  data?: Partial<{
    taxName: string;
    abbreviation: string;
    taxRate: string;
    taxNumber: string;
    description: string;
  }>;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
}

export default function AddTaxDialog({ data, open, onClose, onSubmit }: AddTaxDialogProps) {
  const [formData, setFormData] = React.useState({
    taxName: "",
    abbreviation: "",
    taxRate: "",
    taxNumber: "",
    description: "",
  });

  const [errors, setErrors] = React.useState({
    taxName: "",
    abbreviation: "",
    taxRate: "",
    taxNumber: "",
  });
  const initialFormData = useMemo(() => {
    return {
      taxName: data?.taxName ?? "",
      abbreviation: data?.abbreviation ?? "",
      taxRate: data?.taxRate ?? "",
      taxNumber: data?.taxNumber ?? "",
      description: data?.description ?? "",
    };
  }, [data]);
  // Validate a single field live
  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "taxName":
        if (!value.trim()) error = "Tax name is required";
        else if (value.length < 3)
          error = "Tax name must be at least 3 characters";
        break;

      case "abbreviation":
        if (!value.trim()) error = "Abbreviation is required";
        else if (value.length > 20) error = "Max 20 characters allowed";
        else if (value.length < 2)
          error = "Abbreviation must be at least 2 characters";
        break;

      case "taxRate":
        if (!value) error = "Tax rate is required";
        else if (Number(value) <= 0 || Number(value) > 100)
          error = "Tax rate must be between 0 and 100";
        break;

      case "taxNumber":
        if (value && !/^\d+$/.test(value)) error = "Tax number must be numeric";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle input change with live validation
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Allow only numbers for taxRate and taxNumber
    if (name === "taxRate" && value && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    if (name === "taxNumber" && value && !/^\d+$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Prefill form when editing
  useEffect(() => {
    if (data) {
      setFormData({
        taxName: data.taxName || "",
        abbreviation: data.abbreviation || "",
        taxRate: data.taxRate || "",
        taxNumber: data.taxNumber || "",
        description: data.description || "",
      });
    }
    else if (open) {
      setFormData({
        taxName: "",
        abbreviation: "",
        taxRate: "",
        taxNumber: "",
        description: "",
      });
      setErrors({
        taxName: "",
        abbreviation: "",
        taxRate: "",
        taxNumber: "",
      });
    }
  }, [data, open]);

  // Check if form is valid (no errors + required fields filled)
  const isFormValid =
    formData.taxName.trim() !== "" &&
    formData.abbreviation.trim() !== "" &&
    formData.taxRate !== "" &&
    errors.taxName === "" &&
    errors.abbreviation === "" &&
    errors.taxRate === "" &&
    errors.taxNumber === "";

  const isDirty = useMemo(() => {
    return Object.keys(initialFormData).some(
      (key) =>
        String((formData as any)[key] ?? "") !==
        String((initialFormData as any)[key] ?? "")
    );
  }, [formData, initialFormData]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      await Promise.resolve(onSubmit(formData));
      setFormData({
        taxName: "",
        abbreviation: "",
        taxRate: "",
        taxNumber: "",
        description: "",
      });
      setErrors({
        taxName: "",
        abbreviation: "",
        taxRate: "",
        taxNumber: "",
      });
      onClose();
    } catch {
      // Error toast handled by parent; keep dialog open so user can fix and retry
    }
  };

  const handleClose = () => {
    // Reset form on modal close
    setFormData({
      taxName: "",
      abbreviation: "",
      taxRate: "",
      taxNumber: "",
      description: "",
    });
    setErrors({
      taxName: "",
      abbreviation: "",
      taxRate: "",
      taxNumber: "",
    });
    onClose();
  };

  return (
    <ModalElement
      open={open}
      onClose={handleClose}
      title={data ? "Edit Tax" : "Add Tax"}
      maxWidth="sm"
    >
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Row 1 */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextFieldElement
            name="taxName"
            required
            label="Tax Name"
            value={formData.taxName}
            onChange={handleInput}
            error={!!errors.taxName}
            helperText={errors.taxName}
            fullWidth
          />

          <TextFieldElement
            name="abbreviation"
            required
            label="Abbreviation"
            value={formData.abbreviation}
            onChange={handleInput}
            error={!!errors.abbreviation}
            helperText={errors.abbreviation}
            fullWidth
          />
        </Box>

        {/* Row 2 */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextFieldElement
            name="taxRate"
            required
            label="Tax Rate"
            type="number"
            value={formData.taxRate}
            onChange={handleInput}
            error={!!errors.taxRate}
            helperText={errors.taxRate}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <Box sx={{ color: "grey.600", fontWeight: 600, pr: 1 }}>%</Box>
                ),
              },
            }}
          />

          <TextFieldElement
            name="taxNumber"
            label="Tax Number"
            value={formData.taxNumber}
            onChange={handleInput}
            error={!!errors.taxNumber}
            helperText={errors.taxNumber}
            fullWidth
          />
        </Box>

        {/* Description */}
        <TextAreaField
          label="Description"
          rows={4}
          sx={{ width: "100%" }}
          value={formData.description}
          onChange={(value: string) => setFormData((prev) => ({ ...prev, description: value }))}
        />

        {/* Footer Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <PrimaryButton variant="contained" onClick={handleSubmit} disabled={!isFormValid}>
            Save
          </PrimaryButton>
        </Box>
      </Box>
    </ModalElement>
  );
}
