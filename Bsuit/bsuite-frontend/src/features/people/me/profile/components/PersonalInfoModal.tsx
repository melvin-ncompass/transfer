import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../components/atom/date-picker/DatePicker";
import { AutocompleteElement } from "../../../../../components/atom/autocomplete"; // Import Autocomplete
import { Country, State, City } from "country-state-city"; // Import Country
import { PhoneInputAtom } from "../../../../../components/phoneInput/PhoneInputAtom";

import { useUpdatePersonalInfoMutation } from "../api/profile.api";
import type { IPersonalInformation } from "../types/profile.types";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { buildModalSaveDisabledTooltip } from "../../../../../utils/modalSaveDisabled";

interface Props {
    open: boolean;
    onClose: () => void;
    data: IPersonalInformation;
    employeeId: string;
    showMessage: (message: string, color: "success" | "error") => void;
}

const BLOOD_GROUP_OPTIONS = [
    { label: "A+", value: "A+" }, { label: "A-", value: "A-" },
    { label: "B+", value: "B+" }, { label: "B-", value: "B-" },
    { label: "AB+", value: "AB+" }, { label: "AB-", value: "AB-" },
    { label: "O+", value: "O+" }, { label: "O-", value: "O-" },
];

const MARITAL_STATUS_OPTIONS = [
    { label: "Single", value: "single" },
    { label: "Married", value: "married" },
];

// Country options: label = full name (shown in UI), value = ISO code (sent to API)
const countryOptions = Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode, // ISO code sent to API payload
}));

// Reverse lookup: country name → isoCode (for initializing from API data that returns name)
const countryNameToIso = new Map(
    Country.getAllCountries().map((c) => [c.name.toLowerCase(), c.isoCode])
);

function Field({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Box>
            <Typography variant="subtitle2" mb={1}>
                {required ? `${label} *` : label}
            </Typography>
            {children}
        </Box>
    );
}

interface FormState {
    nameAsPerPan: string;
    panNumber: string;
    nameAsPerAadhar: string;
    aadharNumber: string;
    personalEmail: string;
    phoneNumber: string;
    emergencyContact: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    bloodGroup: string;
    maritalStatus: string;
    fatherName: string;
}

// ── Input formatters (same pattern as AddEmployee) ──────────────────────────
/** PAN: 5 letters + 4 digits + 1 letter. Invalid chars per segment simply don't register. */
function formatPANNumber(input: string): string {
    const raw = input.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const part1 = raw.slice(0, 5).replace(/[^a-zA-Z]/g, "").slice(0, 5);
    const part2 = raw.slice(5, 9).replace(/[^0-9]/g, "").slice(0, 4);
    const part3 = raw.slice(9, 10).replace(/[^a-zA-Z]/g, "").slice(0, 1);
    return (part1 + part2 + part3).toUpperCase();
}

// ── Validation ─────────────────────────────────────────────────────────────
const PAN_REGEX     = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAR_REGEX  = /^\d{12}$/;
const MOBILE_REGEX  = /^\d{6,15}$/;
const EMAIL_REGEX   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_REGEX = /^\d{6}$/;

function validatePersonalField(field: string, value: string): string {
    switch (field) {
        case "panNumber":
            if (value && !PAN_REGEX.test(value))
                return "Invalid PAN — format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
            break;
        case "aadharNumber":
            if (value && !AADHAR_REGEX.test(value))
                return "Aadhar must be exactly 12 digits";
            break;
        case "phoneNumber":
            if (!value) return "Mobile number is required";
            if (!MOBILE_REGEX.test(value)) return "Mobile number must be 6 to 15 digits";
            break;
        case "emergencyContact":
            if (value && !MOBILE_REGEX.test(value))
                return "Emergency contact must be 6 to 15 digits";
            break;
        case "personalEmail":
            if (value && !EMAIL_REGEX.test(value))
                return "Invalid email address";
            break;
        case "pincode":
            if (value && !PINCODE_REGEX.test(value))
                return "Pincode must be exactly 6 digits";
            break;
    }
    return "";
}

const VALIDATED_FIELDS  = new Set(["panNumber", "aadharNumber", "phoneNumber", "emergencyContact", "personalEmail", "pincode"]);
const DIGIT_ONLY_FIELDS = new Set(["aadharNumber", "emergencyContact", "pincode"]);

export default function PersonalInfoModal({ open, onClose, data, employeeId, showMessage }: Props) {
    const [form, setForm] = useState<FormState>({
        nameAsPerPan: "", panNumber: "", nameAsPerAadhar: "", aadharNumber: "",
        personalEmail: "", phoneNumber: "", emergencyContact: "",
        addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "",
        bloodGroup: "", maritalStatus: "", fatherName: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [stateOptions, setStateOptions] = useState<{ label: string; value: string }[]>([]);
    const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
    const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(null);
    const [updatePersonalInfo, { isLoading }] = useUpdatePersonalInfoMutation();

    const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

    useEffect(() => {
        if (open) {
            const countryIso = (() => {
                const raw = data.country ?? "";
                if (raw.length <= 3 && raw === raw.toUpperCase()) return raw;
                return countryNameToIso.get(raw.toLowerCase()) ?? raw;
            })();
            setErrors({});
            setForm({
                nameAsPerPan: data.nameAsPerPan ?? "",
                panNumber: data.panNumber || data.pan || data.panNo || "",
                nameAsPerAadhar: data.nameAsPerAadhar ?? "",
                aadharNumber: data.aadharNumber || data.aadhar || data.aadharNo || "",
                personalEmail: data.personalEmail ?? "",
                phoneNumber: data.phoneNumber || data.mobileNo || "",
                emergencyContact: data.emergencyContact ?? "",
                addressLine1: data.addressLine1 || data.address || "",
                addressLine2: data.addressLine2 ?? "",
                city: data.city ?? "",
                state: data.state ?? "",
                pincode: data.pincode ?? "",
                country: countryIso,
                bloodGroup: data.bloodGroup ?? "",
                maritalStatus: data.maritalStatus?.toLowerCase() ?? "",
                fatherName: data.fatherName ?? "",
            });
            setDateOfBirth(data.dateOfBirth ? dayjs(data.dateOfBirth) : null);
        }
    }, [open, data]);

    useEffect(() => {
        if (!form.country) {
            setStateOptions([]);
            return;
        }
        const states = State.getStatesOfCountry(form.country);
        setStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
    }, [form.country]);

    useEffect(() => {
        if (!form.country || !form.state) {
            setCityOptions([]);
            return;
        }
        const cities = City.getCitiesOfState(form.country, form.state);
        setCityOptions(cities.map((c) => ({ label: c.name, value: c.name })));
    }, [form.country, form.state]);

    const hasChanges = useMemo(() => {
        const d = (v: Dayjs | null) => (v ? dayjs(v).format("YYYY-MM-DD") : "");
        const s = (v: unknown) => String(v ?? "").trim();

        // Backend may return pan/aadhar under different field names — compare against whichever is set
        const dataPan = s(data.panNumber || data.pan || data.panNo);
        const dataAadhar = s(data.aadharNumber || data.aadhar || data.aadharNo);
        const dataPhone = s(data.phoneNumber || data.mobileNo);
        const dataCountryIso = (() => {
            const raw = data.country ?? "";
            if (raw.length <= 3 && raw === raw.toUpperCase()) return raw;
            return countryNameToIso.get(raw.toLowerCase()) ?? raw;
        })();

        if (s(form.nameAsPerPan) !== s(data.nameAsPerPan)) return true;
        if (s(form.panNumber) !== dataPan) return true;
        if (s(form.nameAsPerAadhar) !== s(data.nameAsPerAadhar)) return true;
        if (s(form.aadharNumber) !== dataAadhar) return true;
        if (s(form.personalEmail) !== s(data.personalEmail)) return true;
        if (s(form.phoneNumber) !== dataPhone) return true;
        if (s(form.emergencyContact) !== s(data.emergencyContact)) return true;
        if (s(form.addressLine1) !== s(data.addressLine1 || data.address)) return true;
        if (s(form.addressLine2) !== s(data.addressLine2)) return true;
        if (s(form.city) !== s(data.city)) return true;
        if (s(form.state) !== s(data.state)) return true;
        if (s(form.pincode) !== s(data.pincode)) return true;
        if (s(form.country) !== s(dataCountryIso)) return true;
        if (s(form.bloodGroup) !== s(data.bloodGroup)) return true;
        if (s(form.maritalStatus) !== s(data.maritalStatus?.toLowerCase())) return true;
        if (s(form.fatherName) !== s(data.fatherName)) return true;
        if (d(dateOfBirth) !== d(data.dateOfBirth ? dayjs(data.dateOfBirth) : null)) return true;

        return false;
    }, [form, dateOfBirth, data]);

    const set = useCallback(
        (field: keyof FormState) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                let value = e.target.value;
                // PAN: segment-wise formatter — letters/digits don't bleed into wrong positions
                if (field === "panNumber") value = formatPANNumber(value);
                // Digits-only fields: strip non-digits (invalid chars simply don't register)
                else if (DIGIT_ONLY_FIELDS.has(field)) value = value.replace(/\D/g, "");
                setForm((prev) => ({ ...prev, [field]: value }));
                // Live validation
                if (VALIDATED_FIELDS.has(field))
                    setErrors((prev) => ({ ...prev, [field]: validatePersonalField(field, value) }));
            },
        []
    );

    const setSelect = useCallback(
        (field: keyof FormState) => (value: string) =>
            setForm((prev) => ({ ...prev, [field]: value })),
        []
    );

    const setPhone = useCallback((value: string) => {
        const digits = value.replace(/\D/g, "");
        setForm((prev) => ({ ...prev, phoneNumber: digits }));
        setErrors((prev) => ({ ...prev, phoneNumber: validatePersonalField("phoneNumber", digits) }));
    }, []);

    const handleSave = useCallback(async () => {
        // Full validation before submit
        const fieldsToCheck = ["panNumber", "aadharNumber", "phoneNumber", "emergencyContact", "personalEmail", "pincode"] as const;
        const newErrors: Partial<Record<keyof FormState, string>> = {};
        for (const f of fieldsToCheck)
            newErrors[f] = validatePersonalField(f, form[f]);
        setErrors(newErrors);
        const firstError = fieldsToCheck.map(f => newErrors[f]).find(Boolean);
        if (firstError) { showMessage(firstError, "error"); return; }

        try {
            const toNull = (value: string) => {
                const trimmed = value.trim();
                return trimmed === "" ? null : trimmed;
            };
            await updatePersonalInfo({
                id: employeeId,
                body: {
                    panNumber: toNull(form.panNumber),
                    mobileNo: toNull(form.phoneNumber),
                    dateOfBirth: dateOfBirth ? dayjs(dateOfBirth).format("YYYY-MM-DD") : null,
                    nameAsPerPan: toNull(form.nameAsPerPan),
                    nameAsPerAadhar: toNull(form.nameAsPerAadhar),
                    aadharNumber: toNull(form.aadharNumber),
                    personalEmail: toNull(form.personalEmail),
                    emergencyContact: toNull(form.emergencyContact),
                    addressLine1: toNull(form.addressLine1),
                    addressLine2: toNull(form.addressLine2),
                    city: toNull(form.city),
                    state: toNull(form.state),
                    pincode: toNull(form.pincode),
                    country: toNull(form.country),
                    bloodGroup: toNull(form.bloodGroup),
                    maritalStatus: toNull(form.maritalStatus),
                    fatherName: toNull(form.fatherName),
                },
            }).unwrap();
            showMessage("Personal information updated successfully.", "success");
            onClose();
        } catch (error: any) {
            showMessage(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to update personal information.", "error");
        }
    }, [form, dateOfBirth, employeeId, updatePersonalInfo, onClose, showMessage]);

    const isSaveDisabled = isLoading || !hasChanges || hasErrors;
    const saveDisabledTooltip = useMemo(() => {
        const validationMessages = Object.values(errors).filter(Boolean) as string[];
        return buildModalSaveDisabledTooltip([
            isLoading && "Save is in progress.",
            !hasChanges && "Make a change before saving.",
            ...(hasErrors
                ? validationMessages.length > 0
                    ? validationMessages
                    : ["Fix validation errors before saving."]
                : []),
        ]);
    }, [isLoading, hasChanges, hasErrors, errors]);

    return (
        <ModalElement
            open={open}
            onClose={onClose}
            title="Edit Personal Information"
            maxWidth="md"
            onClick={handleSave}
            disabled={isSaveDisabled}
            disabledActionTooltip={saveDisabledTooltip}
        >
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {/* PAN */}
                <Field label="Name as per PAN">
                    <TextFieldElement label="" fullWidth value={form.nameAsPerPan} onChange={set("nameAsPerPan")} />
                </Field>
                <Field label="PAN Number">
                    <TextFieldElement
                        label="" fullWidth value={form.panNumber} onChange={set("panNumber")}
                        placeholder="ABCDE1234F"
                        slotProps={{ htmlInput: { maxLength: 10 } }}
                        error={!!errors.panNumber} helperText={errors.panNumber || "5 letters · 4 digits · 1 letter"}
                    />
                </Field>

                {/* Aadhar */}
                <Field label="Name as per Aadhar">
                    <TextFieldElement label="" fullWidth value={form.nameAsPerAadhar} onChange={set("nameAsPerAadhar")} />
                </Field>
                <Field label="Aadhar Number">
                    <TextFieldElement
                        label="" fullWidth value={form.aadharNumber} onChange={set("aadharNumber")}
                        placeholder="12-digit number"
                        slotProps={{ htmlInput: { maxLength: 12, inputMode: "numeric" } }}
                        error={!!errors.aadharNumber} helperText={errors.aadharNumber}
                    />
                </Field>

                {/* Contact */}
                <Field label="Personal Email">
                    <TextFieldElement
                        label="" fullWidth value={form.personalEmail} onChange={set("personalEmail")}
                        type="email"
                        error={!!errors.personalEmail} helperText={errors.personalEmail}
                    />
                </Field>
                <Field label="Date of Birth" required>
                    <DatePickerElement label="" value={dateOfBirth} onChange={setDateOfBirth} width="100%" />
                </Field>
                <Field label="Mobile Number" required>
                    <Box>
                        <PhoneInputAtom
                            label=""
                            country={form.country?.toLowerCase() || "in"}
                            value={form.phoneNumber}
                            onChange={(value) => setPhone(value)}
                        />
                        {!!errors.phoneNumber && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                                {errors.phoneNumber}
                            </Typography>
                        )}
                    </Box>
                </Field>
                <Field label="Emergency Contact">
                    <TextFieldElement
                        label="" fullWidth value={form.emergencyContact} onChange={set("emergencyContact")}
                        placeholder="10-digit number"
                        slotProps={{ htmlInput: { maxLength: 10, inputMode: "numeric" } }}
                        error={!!errors.emergencyContact} helperText={errors.emergencyContact}
                    />
                </Field>

                {/* Address */}
                <Field label="Address Line 1">
                    <TextFieldElement label="" fullWidth value={form.addressLine1} onChange={set("addressLine1")} />
                </Field>
                <Field label="Address Line 2">
                    <TextFieldElement label="" fullWidth value={form.addressLine2} onChange={set("addressLine2")} />
                </Field>
                <Field label="Country">
                    <AutocompleteElement
                        options={countryOptions}
                        value={countryOptions.find(c => c.value === form.country) || null}
                        matchId={true}
                        onChange={(_, val) =>
                            setForm(prev => ({ ...prev, country: val?.value || "", state: "", city: "" }))
                        }
                        placeholder="Select Country"
                        width="100%"
                    />
                    {/* form.country holds the ISO code; displayed as country name via option label */}
                </Field>
                <Field label="State">
                    <SingleSelectElement
                        label=""
                        options={stateOptions}
                        value={form.state}
                        onChange={(value) =>
                            setForm((prev) => ({ ...prev, state: value, city: "" }))
                        }
                        clearable={true}
                        fullWidth
                    />
                </Field>
                <Field label="City">
                    <SingleSelectElement
                        label=""
                        options={cityOptions}
                        value={form.city}
                        onChange={setSelect("city")}
                        clearable={true}
                        fullWidth
                    />
                </Field>
                <Field label="Pincode">
                    <TextFieldElement
                        label="" fullWidth value={form.pincode} onChange={set("pincode")}
                        placeholder="6-digit code"
                        slotProps={{ htmlInput: { maxLength: 6, inputMode: "numeric" } }}
                        error={!!errors.pincode} helperText={errors.pincode}
                    />
                </Field>

                {/* Others */}
                <Field label="Blood Group">
                    <SingleSelectElement label="" options={BLOOD_GROUP_OPTIONS} value={form.bloodGroup} onChange={setSelect("bloodGroup")} clearable={true} fullWidth />
                </Field>
                <Field label="Marital Status">
                    <SingleSelectElement label="" options={MARITAL_STATUS_OPTIONS} value={form.maritalStatus} onChange={setSelect("maritalStatus")} clearable={true} fullWidth />
                </Field>
                <Box sx={{ gridColumn: "1 / -1" }}>
                    <Field label="Father's Name">
                        <TextFieldElement label="" fullWidth value={form.fatherName} onChange={set("fatherName")} />
                    </Field>
                </Box>
            </Box>
        </ModalElement >
    );
}
