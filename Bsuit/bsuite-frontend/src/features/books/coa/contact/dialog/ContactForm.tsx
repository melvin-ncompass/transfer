import { useState, useEffect, useMemo } from "react";
import { Box, Stack, FormControlLabel, Alert } from "@mui/material";
import "react-phone-input-2/lib/style.css";
import { State, City } from "country-state-city";
import { getData as getCountryNames } from "country-list";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Checkbox } from "../../../../../components/atom/check-box";
import { RadioButton } from "../../../../../components/atom/radio-button";
import type { IContactRegister, IFormType } from "../types/contact.types";
import {
  formatPANNumber,
  formatTdsPrefillForForm,
  getContactFormErrors,
  getContactSubmitErrorMessage,
} from "../utils/contactValidation";
import { PhoneInputAtom } from "../../../../../components/phoneInput/PhoneInputAtom";
import { Tooltip } from "../../../../../components/atom/tooltip";

const API_FORM_KEYS = [
  "name",
  "middleName",
  "lastName",
  "email",
  "phoneNumber",
  "dialCode",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "country",
  "pincode",
  "pan",
  "gstin",
  "economicTerritory",
  "tdsPrefillValue",
  "isOrganization",
] as const satisfies readonly (keyof IFormType)[];

function toApiFormValue(
  key: (typeof API_FORM_KEYS)[number],
  value: IFormType[(typeof API_FORM_KEYS)[number]],
): unknown {
  if (key === "isOrganization") return value;
  if (key === "tdsPrefillValue") {
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : Number(trimmed);
  }
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : value;
}

function buildContactSubmitPayload(
  form: IFormType,
  initialForm: IFormType | null,
): Record<string, unknown> {
  if (!initialForm) {
    const cleanedForm: Record<string, unknown> = {};
    for (const key of API_FORM_KEYS) {
      const value = form[key];
      if (value === "" || value === null || value === undefined) continue;
      if (key === "isOrganization" && !value) continue;
      cleanedForm[key] =
        key === "tdsPrefillValue" ? Number(value) : value;
    }
    return cleanedForm;
  }

  const payload: Record<string, unknown> = {};
  for (const key of API_FORM_KEYS) {
    const current = form[key];
    const initial = initialForm[key];

    if (key === "isOrganization") {
      if (current !== initial) payload[key] = current;
      continue;
    }

    const currentStr = String(current ?? "").trim();
    const initialStr = String(initial ?? "").trim();
    if (currentStr === initialStr) continue;

    payload[key] = toApiFormValue(key, current);
  }
  return payload;
}

export default function AddContactForm({
  onSubmit,
  selectedContact,
}: {
  onSubmit: (data: any) => Promise<void>;
  selectedContact?: IContactRegister | null;
}) {
  // ---------- Form State ----------
  const [form, setForm] = useState<IFormType>({
    name: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dialCode: "91",
    countryCode: "in",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    pan: "",
    gstin: "",
    economicTerritory: "",
    tdsPrefillValue: "",
    isOrganization: false,
  });
  //initial snapshot for edit comparison
  const [initialForm, setInitialForm] = useState<IFormType | null>(null);

  //---------- Country / State / City  State hooks ----------
  const countryOptions = getCountryNames().map((c) => ({
    label: `${c.name} (${c.code})`,
    value: c.code,
  }));
  const [stateOptions, setStateOptions] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---------- Load States When Country Changes ----------
  useEffect(() => {
    if (!form.country) return setStateOptions([]);
    const states = State.getStatesOfCountry(form.country);
    setStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
  }, [form.country]);

  //---------- Load Cities When State Changes ----------
  useEffect(() => {
    if (!form.country || !form.state) return setCityOptions([]);
    const cities = City.getCitiesOfState(form.country, form.state);
    setCityOptions(cities.map((c) => ({ label: c.name, value: c.name })));
  }, [form.state]);

  // ---------- Update Form Field Helper ----------
  const update = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError(null);
  };

  // ---------- Handle Economic Territory Radio Button ----------
  const handleOrganizationRadio = (e: any) => {
    update("economicTerritory", e.target.value);
  };

  // ---------- Prefill (EDIT MODE) ----------
  useEffect(() => {
    if (selectedContact) {
      const prefilledForm: IFormType = {
        name: selectedContact.name || "",
        middleName: selectedContact.middleName || "",
        lastName: selectedContact.lastName || "",
        email: selectedContact.email || "",
        phoneNumber: selectedContact.phoneNumber || "",
        dialCode: selectedContact.dialCode || "91",
        addressLine1: selectedContact.addressLine1 || "",
        addressLine2: selectedContact.addressLine2 || "",
        city: selectedContact.city || "",
        state: selectedContact.state || "",
        country: selectedContact.country || "",
        pincode: selectedContact.pincode || "",
        pan: selectedContact.pan || "",
        gstin: selectedContact.gstin || "",
        economicTerritory: selectedContact.economicTerritory || "",
        tdsPrefillValue: formatTdsPrefillForForm(selectedContact.tdsPrefillValue),
        isOrganization: selectedContact.isOrganization || false,
      };

      setForm(prefilledForm);
      setInitialForm(prefilledForm); //snapshot
    } else {
      setInitialForm(null);
    }
  }, [selectedContact]);

  const isChanged = useMemo(() => {
    if (!initialForm) return true; // add mode

    return Object.keys(initialForm).some((key) => {
      const k = key as keyof IFormType;
      return String(form[k]).trim() !== String(initialForm[k]).trim();
    });
  }, [form, initialForm]);

  const formErrors = useMemo(() => getContactFormErrors(form), [form]);
  const hasValidationErrors = Object.keys(formErrors).length > 0;

  const isSaveDisabled =
    loading || (!!selectedContact && !isChanged) || hasValidationErrors;

  const saveTooltipTitle = useMemo(() => {
    if (loading) return "Please wait while the contact is being saved";
    if (selectedContact && !isChanged) return "No changes to save";
    if (hasValidationErrors) {
      const messages = Object.values(formErrors);
      if (messages.length === 1) return messages[0];
      return (
        <Box component="span" sx={{ display: "block" }}>
          Fix validation errors:
          {messages.map((message, index) => (
            <Box key={index} component="span" sx={{ display: "block" }}>
              • {message}
            </Box>
          ))}
        </Box>
      );
    }
    return "";
  }, [loading, selectedContact, isChanged, hasValidationErrors, formErrors]);

  const handleSubmit = async () => {
    if (hasValidationErrors) return;

    setLoading(true);
    setSubmitError(null);
    try {
      await onSubmit(buildContactSubmitPayload(form, initialForm));
    } catch (err: unknown) {
      setSubmitError(getContactSubmitErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* NAME */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="20px">
        <TextFieldElement
          fullWidth
          required
          label="Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={!!formErrors.name}
          helperText={formErrors.name}
        />
        <TextFieldElement
          fullWidth
          label="Middle Name"
          value={form.middleName}
          onChange={(e) => update("middleName", e.target.value)}
          error={!!formErrors.middleName}
          helperText={formErrors.middleName}
        />
        <TextFieldElement
          fullWidth
          label="Last Name"
          value={form.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          error={!!formErrors.lastName}
          helperText={formErrors.lastName}
        />
      </Box>

      {/* EMAIL & PHONE */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="20px">
        <TextFieldElement
          fullWidth
          label="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={!!formErrors.email}
          helperText={formErrors.email}
        />
        <Box>
          <PhoneInputAtom
            country={form.countryCode || "in"}
            value={form.phoneNumber}
            onChange={(value, data) => {
              update("phoneNumber", value);
              update("dialCode", value ? (data?.dialCode ?? "") : "");
            }}
          />
          {/* Only show the error if the phone number field has been modified */}
          {form.phoneNumber.trim() && formErrors.phoneNumber && (
            <p style={{ color: "red", fontSize: 12 }}>{formErrors.phoneNumber}</p>
          )}
        </Box>
      </Box>

      {/* ADDRESS */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="20px">
        <TextFieldElement
          fullWidth
          label="Address Line 1"
          value={form.addressLine1}
          onChange={(e) => update("addressLine1", e.target.value)}
          error={!!formErrors.addressLine1}
          helperText={formErrors.addressLine1}
        />
        <TextFieldElement
          fullWidth
          label="Address Line 2"
          value={form.addressLine2}
          onChange={(e) => update("addressLine2", e.target.value)}
          error={!!formErrors.addressLine2}
          helperText={formErrors.addressLine2}
        />
      </Box>

      {/* COUNTRY & STATE */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="20px">
        <SingleSelectElement
          width="100%"
          label="Country"
          options={countryOptions}
          value={form.country}
          onChange={(v) => {
            update("country", v);
            update("state", "");
            update("city", "");
          }}
          error={!!formErrors.country}
          helperText={formErrors.country}
        />
        <SingleSelectElement
          width="100%"
          label="State"
          options={stateOptions}
          value={form.state}
          onChange={(v) => {
            update("state", v);
            update("city", "");
          }}
          error={!!formErrors.state}
          helperText={formErrors.state}
        />
      </Box>

      {/* CITY & PIN */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="20px">
        <SingleSelectElement
          width="100%"
          label="City"
          options={cityOptions}
          value={form.city}
          onChange={(v) => update("city", v)}
          error={!!formErrors.city}
          helperText={formErrors.city}
        />
        <TextFieldElement
          fullWidth
          label="PIN / ZIP"
          value={form.pincode}
          onChange={(e) => update("pincode", e.target.value)}
          error={!!formErrors.pincode}
          helperText={formErrors.pincode}
        />
      </Box>

      {/* PAN & GST */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="20px">
        <TextFieldElement
          fullWidth
          label="PAN"
          value={form.pan}
          onChange={(e) => update("pan", formatPANNumber(e.target.value))}
          error={!!formErrors.pan}
          helperText={formErrors.pan || "5 letters · 4 digits · 1 letter (e.g. ASDFG0000A)"}
        />
        <TextFieldElement
          fullWidth
          label="GSTIN"
          value={form.gstin}
          onChange={(e) => update("gstin", e.target.value)}
          error={!!formErrors.gstin}
          helperText={formErrors.gstin}
        />
      </Box>

      {/* TDS & ORGANIZATION */}
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="20px">
        <TextFieldElement
          fullWidth
          label="Default TDS (%)"
          value={form.tdsPrefillValue}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.]/g, "");
            const valid =
              cleaned.split(".").length > 2
                ? cleaned.replace(/\.(?=.*\.)/g, "")
                : cleaned;
            if (valid.trim() !== "" && Number(valid) > 100) return;
            update("tdsPrefillValue", valid);
          }}
          error={!!formErrors.tdsPrefillValue}
          helperText={formErrors.tdsPrefillValue}
        />
        <Box>
          <FormControlLabel
            sx={{ margin: 0 }}
            control={
              <Checkbox
                checked={form.isOrganization}
                onChange={(e) => {
                  const checked = e.target.checked;
                  update("isOrganization", checked);

                  // If unchecked -> remove radio value
                  if (!checked) {
                    update("economicTerritory", "");
                  }
                }}
              />
            }
            label="Is an Organization?"
          />

          {form.isOrganization && (
            <Box sx={{ marginLeft: "20px" }}>
              <RadioButton
                label="Domestic Tariff Zone"
                name="economic_territory"
                value="DTZ"
                checked={form.economicTerritory === "DTZ"}
                onChange={handleOrganizationRadio}
              />
              <RadioButton
                label="Special Economic Zone"
                name="economic_territory"
                value="SEZ"
                checked={form.economicTerritory === "SEZ"}
                onChange={handleOrganizationRadio}
              />

              {formErrors.economicTerritory && (
                <p style={{ color: "red", fontSize: 12, marginTop: 5 }}>
                  {formErrors.economicTerritory}
                </p>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* SAVE BUTTON */}
      {submitError ? (
        <Alert severity="error" sx={{ alignSelf: "stretch" }}>
          {submitError}
        </Alert>
      ) : null}
      <Box sx={{ alignSelf: "flex-end" }}>
        <Tooltip
          title={saveTooltipTitle}
          placement="top"
          maxWidth={hasValidationErrors ? 320 : 220}
        >
          <PrimaryButton onClick={handleSubmit} disabled={isSaveDisabled}>
            {loading ? "Saving..." : "Save"}
          </PrimaryButton>
        </Tooltip>
      </Box>
    </Stack>
  );
}
