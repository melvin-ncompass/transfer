import type { IFormType } from "../types/contact.types";

/** PAN: 5 letters + 4 digits + 1 letter (e.g. ASDFG0000A) */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function formatPANNumber(input: string): string {
  const raw = input.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const part1 = raw.slice(0, 5).replace(/[^a-zA-Z]/g, "").slice(0, 5);
  const part2 = raw.slice(5, 9).replace(/[^0-9]/g, "").slice(0, 4);
  const part3 = raw.slice(9, 10).replace(/[^a-zA-Z]/g, "").slice(0, 1);
  return (part1 + part2 + part3).toUpperCase();
}

/** Treat null/0 as empty — backend uses null when TDS is unset. */
export function formatTdsPrefillForForm(value?: number | null): string {
  if (value == null || Number(value) === 0) return "";
  return String(value);
}

export function getContactSubmitErrorMessage(err: unknown): string {
  const e = err as {
    data?: { message?: string };
    error?: string;
    message?: string;
  };
  return (
    e?.data?.message ??
    e?.error ??
    e?.message ??
    "Failed to save contact."
  );
}

export type ContactFormErrors = Partial<Record<keyof IFormType, string>>;

export function getContactFormErrors(form: IFormType): ContactFormErrors {
  const errors: ContactFormErrors = {};

  // ---------- Phone flag validation (FIRST) ----------
  if (form.phoneNumber.trim() && !form.dialCode) {
    errors.phoneNumber = "Please select country flag before submitting";
  }

  // ---------- Name ----------
  if (!form.name.trim()) {
    errors.name = "Required";
  } else if (form.name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  } else if (form.name.trim().length > 100) {
    errors.name = "Name must not exceed 100 characters";
  }

  // ---------- Middle Name ----------
  if (form.middleName.trim()) {
    if (form.middleName.trim().length < 3) {
      errors.middleName = "Middle Name too short";
    } else if (form.middleName.trim().length > 100) {
      errors.middleName = "Middle Name must not exceed 100 characters";
    }
  }

  // ---------- Last Name ----------
  if (form.lastName.trim()) {
    if (form.lastName.trim().length < 3) {
      errors.lastName = "Last Name too short";
    } else if (form.lastName.trim().length > 100) {
      errors.lastName = "Last Name must not exceed 100 characters";
    }
  }

  // ---------- Email ----------
  if (form.email.trim()) {
    if (form.email.length > 254) {
      errors.email = "Email must not exceed 254 characters";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email";
    }
  }

  // ---------- Phone Number ----------
  if (form.phoneNumber.trim()) {
    const digitsOnly = form.phoneNumber.replace(/\D/g, "");

    if (!/^\d{6,15}$/.test(digitsOnly)) {
      errors.phoneNumber = "Invalid phone number";
    } else if (form.dialCode) {
      const normalizedDialCode = form.dialCode.replace("+", "");
      if (!digitsOnly.startsWith(normalizedDialCode)) {
        errors.phoneNumber = `Phone number does not match selected country code (+${normalizedDialCode})`;
      }
    }
  }

  // ---------- Address ----------
  if (form.addressLine1.trim() && form.addressLine1.trim().length < 3) {
    errors.addressLine1 = "Address too short";
  }

  if (form.addressLine2.trim() && form.addressLine2.trim().length < 3) {
    errors.addressLine2 = "Address too short";
  }

  // ---------- Location (OPTIONAL & FIXED) ----------
  // Country is OPTIONAL
  // State requires country
  // City requires state

  if (!form.country && form.state) {
    errors.state = "Select country first";
  }

  if (!form.state && form.city) {
    errors.city = "Select state first";
  }

  // ---------- Pincode ----------
  if (form.pincode.trim() && !/^[0-9]{4,10}$/.test(form.pincode)) {
    errors.pincode = "Invalid postal code";
  }

  // ---------- PAN ----------
  const pan = form.pan.trim();
  if (pan && !PAN_REGEX.test(pan)) {
    errors.pan =
      "Invalid PAN — use 5 letters, 4 digits, then 1 letter (e.g. ASDFG0000A)";
  }

  // ---------- GSTIN ----------
  if (form.gstin.trim() && !/^[A-Za-z0-9]{15}$/.test(form.gstin)) {
    errors.gstin = "GSTIN must be 15 characters alphanumeric (uppercase only)";
  }

  // ---------- TDS ----------
  if (form.tdsPrefillValue.trim()) {
    const v = form.tdsPrefillValue.trim();

    if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) {
      errors.tdsPrefillValue = "Enter a valid percentage (max 2 decimal places)";
    } else {
      const num = Number(v);
      if (num <= 0 || num > 100) {
        errors.tdsPrefillValue = "Must be greater than 0 and at most 100";
      }
    }
  }

  // ---------- Organization ----------
  if (form.isOrganization && !form.economicTerritory) {
    errors.economicTerritory = "Please select one option";
  }

  return errors;
}
