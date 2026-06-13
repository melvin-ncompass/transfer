import { useEffect, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../components/atom/button";
import { useAddGroupMutation, useUpdateGroupMutation } from "../api/groups.api";
import { Snackbar } from "../../../../../components/atom/snackbar";
// import { group } from "console";

interface GroupFormProps {
  onSuccess?: (updatedGroup: {
    id: string | number;
    groupName: string;
    groupType: string;
  }) => void;
  editData?: { id: string | number; groupName: string; groupType: string };
  initialGroupType?: string; // optional prefill for new group type
}

const buildFormData = (
  editData?: { id: string | number; groupName: string; groupType: string },
  initialGroupType?: string
) => ({
  id: editData?.id || "",
  groupName: editData?.groupName || "",
  groupType: editData?.groupType || initialGroupType || "",
});

export function GroupForm({
  onSuccess,
  editData,
  initialGroupType,
}: GroupFormProps) {
  const [addGroup] = useAddGroupMutation();
  const [updateGroup] = useUpdateGroupMutation();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "info" as "success" | "error" | "info" | "warning",
  });

  const [initialFormData, setInitialFormData] = useState(() =>
    buildFormData(editData, initialGroupType)
  );
  const [formData, setFormData] = useState(() =>
    buildFormData(editData, initialGroupType)
  );
  useEffect(() => {
    const initial = buildFormData(editData, initialGroupType);
    setInitialFormData(initial);
    setFormData(initial);
  }, [editData, initialGroupType]);

  /* ⭐ CHANGE: detect changes */
  const isDirty = useMemo(() => {
    return Object.keys(initialFormData).some(
      (key) =>
        String((formData as any)[key] ?? "") !==
        String((initialFormData as any)[key] ?? "")
    );
  }, [formData, initialFormData]);

  useEffect(() => {
    if (!editData && initialGroupType) {
      setFormData((prev) => ({ ...prev, groupType: initialGroupType }));
    }
  }, [initialGroupType, editData]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // clear specific error on change
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.groupName.trim())
      newErrors.groupName = "Group Name is required.";
    if (!formData.groupType)
      newErrors.groupType = "Please select a Group Type.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editData) {
      try {
        const res = await updateGroup({
          id: editData.id,
          groupName: formData.groupName,
          groupType: formData.groupType,
        }).unwrap();
        if (onSuccess) onSuccess(res.data);

      } catch (err: any) {
        console.error("Failed to update group:", err);
        setSnackbar({
          open: true,
          message: err?.data?.message ?? "Failed to update group.",
          color: "error",
        });
      }
    } else {
      try {
        const res = await addGroup({
          groupName: formData.groupName,
          groupType: formData.groupType,
        }).unwrap();
        setFormData({ id: "", groupName: "", groupType: "" });
        setErrors({});

        if (onSuccess) onSuccess(res.data);
      } catch (err: any) {
        setSnackbar({
          open: true,
          message: err?.data?.message ?? "Failed to add group.",
          color: "error",
        });
      }
    }
  };

  const groupTypeOptions = [
    { label: "Asset", value: "Asset" },
    { label: "Liability", value: "Liability" },
    { label: "Income", value: "Income" },
    { label: "Expense", value: "Expense" },
  ];

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 1 }}>
        <Stack spacing={2}>
          <TextFieldElement
            label="Group Name"
            value={formData.groupName}
            onChange={(e) => handleChange("groupName", e.target.value)}
            required
            fullWidth
            error={!!errors.groupName}
            helperText={errors.groupName}
          />

          <SingleSelectElement
            disabled={!!editData}
            label="Group Type"
            value={formData.groupType}
            onChange={(val) => handleChange("groupType", val)}
            options={groupTypeOptions}
            required
            width="100%"
            error={!!errors.groupType}
            helperText={errors.groupType}
          />

          <Box display="flex" justifyContent="flex-end" pt={2}>
            <PrimaryButton
              type="submit"
              aria-label="submit"
              disabled={!!editData && !isDirty}
            >
              Save
            </PrimaryButton>
          </Box>
        </Stack>
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
