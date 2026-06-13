import { Stack } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { useEditCompanyMutation } from "../api/company.api";
import { PrimaryButton } from "../../../components/atom/button";
import { ModalElement } from "../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../components/atom/text-field";
import { Snackbar } from "../../../components/atom/snackbar";
import { validateEdit } from "../utils/validateEdit";

interface EditCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  company?: {
    id: number;
    companyName: string;
    companyShortName: string;
    reportingCurrency?: string;
  };
}

export default function EditCompanyModal({
  open,
  onClose,
  onSuccess,
  company,
}: EditCompanyModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyShortName, setCompanyShortName] = useState("");
  const [isShortNameEdited, setIsShortNameEdited] = useState(false);

  const [editCompany] = useEditCompanyMutation();

  const [errors, setErrors] = useState<{
    companyName?: string;
    companyShortName?: string;
  }>({});

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  const [isSaving, setIsSaving] = useState(false);

  // ---------- Helpers ----------
  const extractFirstWord = (value: string) => {
    if (!value.trim()) return "";
    return value.trim().split(" ")[0];
  };

  // ---------- Init ----------
  useEffect(() => {
    if (company && open) {
      setCompanyName(company.companyName || "");
      setCompanyShortName(company.companyShortName || "");
      setIsShortNameEdited(false); // allow auto-fill if user edits
      setErrors({});
      setIsSaving(false);
    } else if (!open) {
      setCompanyName("");
      setCompanyShortName("");
      setIsShortNameEdited(false);
      setErrors({});
      setIsSaving(false);
    }
  }, [company, open]);

  // ---------- Company Name ----------
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanyName(value);

    if (isShortNameEdited && companyShortName !== extractFirstWord(value)) {
      setCompanyShortName(extractFirstWord(value));
      setIsShortNameEdited(false);
    } else if (!isShortNameEdited) {
      setCompanyShortName(extractFirstWord(value));
    }

    if (errors.companyName) {
      setErrors((prev) => ({ ...prev, companyName: undefined }));
    }
  };

  // ---------- Short Name ----------
  const handleCompanyShortNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCompanyShortName(e.target.value);
    setIsShortNameEdited(true);

    if (errors.companyShortName) {
      setErrors((prev) => ({ ...prev, companyShortName: undefined }));
    }
  };

  // ---------- Validation ----------

  // ---------- Detect if anything changed ----------
  const isChanged = useMemo(() => {
    if (!company) return false;
    return (
      companyName !== company.companyName ||
      companyShortName !== company.companyShortName
    );
  }, [company, companyName, companyShortName]);

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (
      !validateEdit({ companyName, companyShortName, setErrors }) ||
      isSaving ||
      !company ||
      !isChanged
    )
      return;

    setIsSaving(true);
    try {
      await editCompany({
        id: company.id,
        updateData: {
          companyName,
          companyShortName,
        },
      }).unwrap();

      setSnackbar({
        open: true,
        message: "Company updated successfully!",
        color: "success",
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message || "Failed to update company!",
        color: "error",
      });
      setIsSaving(false);
    }
  };

  return (
    <>
      <ModalElement
        open={open}
        onClose={onClose}
        title="Edit Company"
        maxWidth="sm"
      >
        <Stack spacing={2}>
          <TextFieldElement
            fullWidth
            required
            label="Company Name"
            value={companyName}
            onChange={handleCompanyNameChange}
            error={!!errors.companyName}
            helperText={errors.companyName}
          />

          <TextFieldElement
            fullWidth
            required
            label="Company Short Name"
            value={companyShortName}
            onChange={handleCompanyShortNameChange}
            error={!!errors.companyShortName}
            helperText={errors.companyShortName}
          />

          <Stack direction="row" justifyContent="flex-end">
            <PrimaryButton
              onClick={handleSubmit}
              disabled={isSaving || !isChanged}
              loading={isSaving}
            >
              Save
            </PrimaryButton>
          </Stack>
        </Stack>
      </ModalElement>

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
