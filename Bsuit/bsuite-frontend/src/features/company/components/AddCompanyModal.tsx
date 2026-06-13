import { Stack, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useCompanyRegisteringMutation } from "../api/company.api";
import { currencyData } from "../utils/currency";
import { PrimaryButton } from "../../../components/atom/button";
import { ModalElement } from "../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../components/atom/text-field";
import { SingleSelectElement } from "../../../components/atom/select-field/SingleSelect";
import type { ICurrencyItem } from "../types/company.types";
import { validateSave } from "../utils/validateSave";

interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddCompanyModal({
  open,
  onClose,
  onSuccess,
}: AddCompanyModalProps) {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [companyName, setCompanyName] = useState("");
  const [companyShortName, setCompanyShortName] = useState("");
  const [isShortNameEdited, setIsShortNameEdited] = useState(false);
  const [reportingCurrency, setReportingCurrency] = useState("");

  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [companyRegistering] = useCompanyRegisteringMutation();
  const [errors, setErrors] = useState<{
    companyName?: string;
    companyShortName?: string;
    currency?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateFrontEnd = () => {
    const trimmedCompanyName = companyName.trim();
    const trimmedShortName = companyShortName.trim();
    const newErrors: typeof errors = {};

    // Company name
    if (!trimmedCompanyName) {
      newErrors.companyName = "Company name cannot be empty or spaces only";
    } else if (
      trimmedCompanyName.length < 3 ||
      trimmedCompanyName.length > 100
    ) {
      newErrors.companyName =
        "Company name must be between 3 and 100 characters";
    }

    // Company short name
    if (!trimmedShortName) {
      newErrors.companyShortName =
        "Company short name cannot be empty or spaces only";
    } else if (trimmedShortName.length < 1 || trimmedShortName.length > 20) {
      newErrors.companyShortName =
        "Company short name must be between 1 and 20 characters";
    }

    // Currency
    if (!reportingCurrency) {
      newErrors.currency = "Currency is required";
    }

    setErrors(newErrors);

    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleCompanyNameChange = (value: string) => {
    const trimmedStart = value.replace(/^\s+/, "");
    setCompanyName(trimmedStart);

    const firstWord = trimmedStart.trim().split(" ")[0] || "";
    if (!isShortNameEdited) setCompanyShortName(firstWord);

    if (errors.companyName) {
      setErrors((prev) => ({ ...prev, companyName: undefined }));
    }
  };

  const handleCompanyShortNameChange = (value: string) => {
    setIsShortNameEdited(true);
    setCompanyShortName(value);

    if (errors.companyShortName) {
      setErrors((prev) => ({ ...prev, companyShortName: undefined }));
    }
  };

  const handleCurrencyChange = (value: string) => {
    setReportingCurrency(value);

    if (errors.currency)
      setErrors((prev) => ({ ...prev, currency: undefined }));
  };

  const handleSubmit = async () => {
    if (!validateFrontEnd() || isSaving) return;

    setIsSaving(true);

    try {
      await companyRegistering({
        companyName: companyName.trim(),
        companyShortName: companyShortName.trim(),
        reportingCurrency,
      }).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        companyName: err?.data?.message || "Something went wrong!",
      }));
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const formatted = currencyData.map((item: ICurrencyItem) => ({
      label: `${item.symbol} - ${item.cc} - ${item.name}`,
      value: `${item.symbol} - ${item.cc}`,
    }));
    setCurrencyOptions(formatted);
  }, []);

  useEffect(() => {
    if (!open) {
      setCompanyName("");
      setCompanyShortName("");
      setReportingCurrency("");
      setErrors({});
      setIsSaving(false);
      setIsShortNameEdited(false);
    }
  }, [open]);
  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title="Add New Company"
      maxWidth="sm"
    >
      <Stack spacing={2}>
        <TextFieldElement
          fullWidth
          required
          label="Company Name"
          value={companyName}
          onChange={(e) => handleCompanyNameChange(e.target.value)}
          error={!!errors.companyName}
          helperText={errors.companyName}
        />

        <TextFieldElement
          fullWidth
          required
          label="Company Short Name"
          value={companyShortName}
          onChange={(e) => handleCompanyShortNameChange(e.target.value)}
          error={!!errors.companyShortName}
          helperText={errors.companyShortName}
        />

        <SingleSelectElement
          width="100%"
          menuHeight={300}
          required
          label="Currency"
          options={currencyOptions}
          value={reportingCurrency}
          onChange={handleCurrencyChange}
          error={!!errors.currency}
          helperText={errors.currency}
        />

        <PrimaryButton
          fullWidth={isSm}
          sx={{ alignSelf: isSm ? "stretch" : "flex-end", mt: 2 }}
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </PrimaryButton>
      </Stack>
    </ModalElement>
  );
}
