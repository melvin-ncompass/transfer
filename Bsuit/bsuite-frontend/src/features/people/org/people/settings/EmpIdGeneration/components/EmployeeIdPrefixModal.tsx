import { useState, useEffect, useMemo } from "react";
import {
  Stack,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Divider,
  Alert,
} from "@mui/material";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import {
  useCreateEmployeeIdPrefixMutation,
  useUpdateEmployeeIdPrefixMutation,
} from "../api/empidgen.api";
import type { EmployeeIdPrefixResponse } from "../types/empidgen.types";

interface EmployeeIdPrefixModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  mode: "create" | "edit";
  /** Prefill for edit mode – from parent (EmployeeIdPrefix), no GET in modal. */
  initialData?: EmployeeIdPrefixResponse;
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as { data?: { message?: string }; message?: string };
    if (typeof o.data?.message === "string") return o.data.message;
    if (typeof o.message === "string") return o.message;
  }
  return "Something went wrong. Please try again.";
}

export function EmployeeIdPrefixModal({
  open,
  onClose,
  onSuccess,
  onError,
  mode,
  initialData = undefined,
}: EmployeeIdPrefixModalProps) {
  const [permanent, setPermanent] = useState("");
  const [intern, setIntern] = useState("");
  const [applySame, setApplySame] = useState(false);

  const [create, { isLoading: isCreatePending }] = useCreateEmployeeIdPrefixMutation();
  const [update, { isLoading: isUpdatePending }] = useUpdateEmployeeIdPrefixMutation();

  const prefixData = useMemo(() => {
    const source = initialData ?? undefined;
    const apiData = Array.isArray(source?.data) ? source.data : [];
    return apiData.reduce<Record<string, string>>((acc, curr: any) => {
      if (curr.seriesName === "permanent") acc.seriesPrefixPermanent = curr.seriesPrefix ?? "";
      if (curr.seriesName === "intern") acc.seriesPrefixIntern = curr.seriesPrefix ?? "";
      return acc;
    }, {});
  }, [initialData]);

  const isSavePending = isCreatePending || isUpdatePending;

  // Prefill form when modal opens in edit mode (from initialData)
  useEffect(() => {
    if (!open) {
      setPermanent("");
      setIntern("");
      setApplySame(false);
      return;
    }

    if (mode === "edit" && Object.keys(prefixData).length > 0) {
      setPermanent(prefixData.seriesPrefixPermanent ?? "");
      setIntern(prefixData.seriesPrefixIntern ?? "");
      setApplySame(
        (prefixData.seriesPrefixPermanent ?? "") ===
          (prefixData.seriesPrefixIntern ?? "")
      );
    } else if (mode === "create") {
      setPermanent("");
      setIntern("");
      setApplySame(false);
    }
  }, [open, mode, prefixData]);

  // ✅ Keep intern synced if “Use same prefix” checked
  useEffect(() => {
    if (applySame && permanent !== intern) {
      setIntern(permanent);
    }
  }, [permanent, applySame]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setApplySame(checked);
    if (checked) setIntern(permanent);
  };

  const handlePermanentChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9:_-]/g, "");
    setPermanent(sanitized);
    if (applySame) setIntern(sanitized);
  };

  const handleInternChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9:_-]/g, "");
    if (applySame) {
      setPermanent(sanitized);
      setIntern(sanitized);
    } else {
      setIntern(sanitized);
    }
  };

  // ✅ Create or Update
  const handleSave = async () => {
    if (!permanent.trim() || !intern.trim()) return;

    const payload = {
      seriesPrefixPermanent: permanent.trim(),
      seriesPrefixIntern: intern.trim(),
    };

    try {
      const result =
        mode === "edit"
          ? await update(payload).unwrap()
          : await create(payload).unwrap();

      onSuccess?.(result?.message ?? "Saved successfully.");
      onClose();
    } catch (err) {
      onError?.(getErrorMessage(err));
    }
  };

  const isValid = permanent.trim().length > 0 && intern.trim().length > 0;

  return (
    <ModalElement
      open={open}
      title={mode === "edit" ? "Edit ID Prefixes" : "Configure ID Prefixes"}
      onClose={onClose}
      onClick={handleSave}
      maxWidth="sm"
      height="auto"
      disabled={!isValid || isSavePending}
    >
      <Stack spacing={3} sx={{ py: 2 }}>
        <>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                Set up prefixes that will be used to automatically generate unique employee IDs.
              </Typography>
            </Alert>

            {/* Permanent Employee Section */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Permanent Employees
              </Typography>
              <TextFieldElement
                label="ID Prefix"
                name="permanent"
                placeholder="e.g., EMP or PERM"
                value={permanent}
                onChange={(e) => handlePermanentChange(e.target.value)}
                fullWidth
                required
                helperText="This prefix will be used for full-time employee IDs (e.g., EMP-001)"
              />
            </Box>

            {/* Divider with Checkbox */}
            <Box sx={{ position: "relative" }}>
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: "background.paper",
                  px: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applySame}
                      onChange={handleCheckboxChange}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Use same prefix for interns
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            </Box>

            {/* Intern Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Interns
              </Typography>
              <TextFieldElement
                label="ID Prefix"
                name="intern"
                placeholder="e.g., INT or INTERN"
                value={intern}
                onChange={(e) => handleInternChange(e.target.value)}
                fullWidth
                required
                disabled={applySame}
                helperText={
                  applySame
                    ? "Automatically synced with permanent employee prefix"
                    : "This prefix will be used for intern IDs (e.g., INT-001)"
                }
              />
            </Box>
        </>
      </Stack>
    </ModalElement>
  );
}
