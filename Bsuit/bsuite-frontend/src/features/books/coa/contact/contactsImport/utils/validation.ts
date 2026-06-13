import type { ValidationError, ValidationResult } from "../types/ValidationTypes";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register English locale
countries.registerLocale(enLocale);

export function validateCSVData(data: Record<string, string | number>[]): ValidationResult[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const gstinRegex = /^[A-Z0-9]{15}$/i;
  const economicTerritories = ["SEZ", "DTZ"];

  return data
    .map((row, index) => {
      const errors: ValidationError[] = [];

      // Name required
      if (!row["Name"] || row["Name"].toString().trim() === "") {
        errors.push({ field: "Name", reason: "Name is required" });
      }

      // Email valid
      if (!row["Email"] || !emailRegex.test(row["Email"].toString())) {
        errors.push({ field: "Email", reason: "Email should be a valid format" });
      }

      // PAN format
      if (!row["PAN Number"] || !panRegex.test(row["PAN Number"].toString())) {
        errors.push({
          field: "PAN Number",
          reason: "PAN should have 5 capital letters, 4 numbers, 1 capital letter (Eg: ASDFG1234S)",
        });
      }

      // Country code using i18n-iso-countries
      const countryCode = row["Country"]?.toString().toUpperCase();
      if (!countryCode || !countries.isValid(countryCode)) {
        errors.push({ field: "Country", reason: "Invalid country code" });
      }

      // GSTIN
      if (!row["GSTIN"] || !gstinRegex.test(row["GSTIN"].toString())) {
        errors.push({
          field: "GSTIN",
          reason: "GSTIN should be 15 character alphanumeric",
        });
      }

      // Economic territory
      if (!row["economic territory"] || !economicTerritories.includes(row["economic territory"].toString())) {
        errors.push({
          field: "economic territory",
          reason: "Economic territory should be one of ['SEZ','DTZ']",
        });
      }

      // TDS Prefill
      const tds = Number(row["tds_prefill_val"]);
      if (isNaN(tds) || tds <= 0 || tds >= 100) {
        errors.push({
          field: "tds_prefill_val",
          reason: "tds_prefill_value (Default TDS) should be 0 < x < 100",
        });
      }

      return { rowIndex: index, errors };
    })
    .filter((r) => r.errors.length > 0);
}
