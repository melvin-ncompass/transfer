import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useAppSelector, useAppDispatch } from "../../../../../../store/store";
import type { ValidationResult } from "../types/ValidationTypes";
import { mapRawDataToSystem } from "../utils/mapRawDataToSystem";
import { validateCSVData } from "../utils/validation";
import { useBulkCreateAccountsMutation } from "../api/accountsImport.api";
import { setValidationResults, setServerDuplicates, setMappedData, setHasEdits } from "../CSVSlice";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { currencyData } from "../../../../../company/utils/currency";

enum status {
  valid = "valid",
  created = "created",
  invalid = "invalid",
}

export interface EditableRow {
  [key: string]: string | boolean | undefined | Record<string, boolean>;
  _status?: status;
  _edited?: Record<string, boolean>;
}

const sanitizeForValidation = (
  rows: EditableRow[]
): Record<string, string>[] => {
  return rows.map((r) => {
    const copy: Record<string, string> = {};
    Object.keys(r)
      .filter((key) => !key.startsWith("_"))
      .forEach((key) => {
        copy[key] = String(r[key] ?? "");
      });
    return copy;
  });
};

interface ValidationScreenProps {
  triggerValidation?: boolean;
  onValidationResults?: (results: ValidationResult[]) => void;
}

export default function ValidationScreen({
  triggerValidation,
  onValidationResults,
}: ValidationScreenProps) {
  const { rawData, columnMapping } = useAppSelector((state) => state.accImport);
  const storedValidation = useAppSelector(
    (state) => state.accImport.validationResults as any
  );
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [validationResults, setLocalValidation] = useState<ValidationResult[]>(
    []
  );
  const dispatch = useAppDispatch();
  const [bulkCreate] = useBulkCreateAccountsMutation();
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());

  const currencyOptions = useMemo(() => {
    return currencyData.map((item: any) => ({
      label: `${item.symbol} - ${item.cc} - ${item.name}`,
      value: `${item.symbol} - ${item.cc}`,
    }));
  }, []);

  // Find best matching currency option value for a given input.
  // Logic: prefer exact matches against option.value or option.label, then
  // match by symbol, country code, or currency name (includes), case-insensitive.
  const findBestCurrencyOption = (input?: string): string | undefined => {
    if (!input) return undefined;
    const s = String(input).trim().toLowerCase();
    if (!s) return undefined;

    // exact match against value or label
    for (const opt of currencyOptions) {
      if (String(opt.value).toLowerCase() === s) return opt.value;
      if (String(opt.label).toLowerCase() === s) return opt.value;
    }

    // match if input equals symbol, country code or appears in name
    for (const opt of currencyOptions) {
      const label = String(opt.label).toLowerCase();
      const value = String(opt.value).toLowerCase();
      const parts = label.split(" - ");
      const symbol = parts[0] || "";
      const cc = parts[1] || "";
      const name = parts.slice(2).join(" - ") || "";

      if (s === symbol || s === cc || s === name) return opt.value;
      if (label.includes(s) || value.includes(s) || name.includes(s)) return opt.value;
    }

    // fallback: try prefix match on value or label
    for (const opt of currencyOptions) {
      if (String(opt.value).toLowerCase().startsWith(s)) return opt.value;
      if (String(opt.label).toLowerCase().startsWith(s)) return opt.value;
    }

    return undefined;
  };

  // api -> display mapping (used by multiple effects)
  // const apiToDisplay: Record<string, string> = {
  //   name: "Name",
  //   middleName: "Middle Name",
  //   lastName: "Last Name",
  //   email: "Email",
  //   phoneNumber: "Phone",
  //   dialCode: "Dial Code",
  //   addressLine1: "Address Line1",
  //   addressLine2: "Address Line2",
  //   city: "City",
  //   state: "State",
  //   pincode: "pincode",
  //   country: "Country",
  //   // isOrganization: "is_archived",
  //   gstin: "GSTIN",
  //   economicTerritory: "economic territory",
  //   pan: "PAN Number",
  //   tdsPrefillValue: "tds_prefill_val",
  // };

  function mapServerToValidationResults(serverArr: any[]): ValidationResult[] {
    if (!Array.isArray(serverArr)) return [];
    return serverArr.map((item) => {
      const rowNumber = Number(item.rowNumber ?? item.rowIndex ?? NaN);
      // assume CSV header occupies 1 row; first data row has rowNumber === 2 -> map to index 0
      const rowIndex = Number.isFinite(rowNumber) ? Math.max(0, rowNumber - 2) : 0;

      const hasError = Boolean(item.hasError);
      const errors: { field: string; reason: string }[] = [];

      const dataObj = item.data ?? item;
      // iterate fields in returned data
      Object.entries(dataObj).forEach(([apiKey, valAny]) => {
        const val = valAny as any;
        const err = val?.error ?? "";
        if (err && String(err).trim() !== "") {
          const displayField = apiKey;
          errors.push({ field: displayField, reason: String(err) });
        }
      });

      return { rowIndex, errors, hasError };
    });
  }

  useEffect(() => {
    if (!rawData || !columnMapping) return;

    const mappedData = mapRawDataToSystem(rawData, columnMapping);
    let results: ValidationResult[] = [];

    // If store has a validation payload that looks like server response (has rowNumber or data fields), map it
    if (
      storedValidation &&
      Array.isArray(storedValidation) &&
      storedValidation.length > 0
    ) {
      const first = storedValidation[0];
      if (
        first &&
        (first.rowNumber !== undefined || first.data !== undefined)
      ) {
        results = mapServerToValidationResults(storedValidation as any[]);
        // normalize and save mapped results back to store for consistent downstream usage
        dispatch(setValidationResults(results));
      } else {
        // assume it's already in ValidationResult[] format
        results = storedValidation as ValidationResult[];
      }
    } else {
      // fallback to client-side validation
      results = validateCSVData(mappedData);
      dispatch(setValidationResults(results));
    }

    const enriched: EditableRow[] = mappedData.map((r, i) => {
      const copy: any = { ...r };
      // prefill accountCurrency with best matching option value (if possible)
      if (copy.accountCurrency) {
        const best = findBestCurrencyOption(String(copy.accountCurrency));
        if (best) copy.accountCurrency = best;
      }

      const rowRes = results.find((res) => res.rowIndex === i);
      const isInvalid = rowRes
        ? (rowRes.hasError === true ? true : (rowRes.errors && rowRes.errors.length > 0))
        : false;

      return {
        ...copy,
        _status: isInvalid ? status.invalid : status.valid,
        _edited: {},
      };
    });

    setRows(enriched);
    setLocalValidation(results);
  }, [rawData, columnMapping, dispatch]);

  // persist latest edited rows (sanitized) so duplicates page can access them
  useEffect(() => {
    if (!rows || rows.length === 0) return;
    const sanitized = sanitizeForValidation(rows);
    dispatch(setMappedData(sanitized));
  }, [rows, dispatch]);

  useEffect(() => {
    if (!triggerValidation) return;
    (async () => {
      const cleanRows = sanitizeForValidation(rows);

      // build mapping display->api key (inverse of apiToDisplay)
      const displayToApiKey: Record<string, string> = {
        "Account Name": "accountName",
        "Account Type": "accountType",
        "Account Code": "accountCode",
        "Account Currency": "accountCurrency",
        Notes: "notes",
        "Group Name": "groupName",
        "Parent Account": "parentAccount",
      };

      // transform rows into API payload array
      const payload = cleanRows.map((r) => {
        const obj: Record<string, any> = {};
        Object.entries(r).forEach(([displayKey, val]) => {
          const value = String(val ?? "");
          const apiKey = displayToApiKey[displayKey] ?? displayKey;

          // coerce types for known fields
          if (apiKey === "isOrganization") {
            const v = value.toLowerCase();
            if (v === "true" || v === "1") obj[apiKey] = true;
            else if (v === "false" || v === "0") obj[apiKey] = false;
            else obj[apiKey] = value; // pass through if ambiguous
          } else if (apiKey === "tdsPrefillValue") {
            const n = Number(value);
            obj[apiKey] = Number.isFinite(n) ? n : value;
          } else {
            obj[apiKey] = value;
          }
        });
        return obj;
      });

      try {
        const res = await bulkCreate(payload).unwrap();
        // response expected to contain duplicates[] and errors[] arrays
        const duplicates = Array.isArray(res?.data?.data.duplicates) ? res.data.data.duplicates : [];
        const errorsArr = Array.isArray(res?.data?.data.errors) ? res.data?.data.errors : [];

        // save server duplicates into slice for duplicates resolution step
        dispatch(setServerDuplicates(duplicates));

        // helper to find row index by matching fields (email, phoneNumber, pan, name)
        function findRowIndexByData(itemData: any) {
          const candidates = ["email", "phoneNumber", "pan", "name"];
          for (let i = 0; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            for (const key of candidates) {
              const displayKey =
                Object.keys(displayToApiKey).find(
                  (k) => displayToApiKey[k] === key
                ) ?? key;
              const rowVal = String(row[displayKey] ?? "").toLowerCase();
              const itemVal = String(
                itemData?.[key]?.value ?? itemData?.[displayKey]?.value ?? ""
              ).toLowerCase();
              if (itemVal && rowVal && rowVal === itemVal) return i;
            }
          }
          return -1;
        }

        const apiToDisplay: Record<string, string> = {
          name: "Name",
          middleName: "Middle Name",
          lastName: "Last Name",
          email: "Email",
          phoneNumber: "Phone",
          dialCode: "Dial Code",
          addressLine1: "Address Line1",
          addressLine2: "Address Line2",
          city: "City",
          state: "State",
          pincode: "pincode",
          country: "Country",
          // isOrganization: "is_archived",
          gstin: "GSTIN",
          economicTerritory: "economic territory",
          pan: "PAN Number",
          tdsPrefillValue: "tds_prefill_val",
        };

        const combined: Record<number, { field: string; reason: string }[]> = {};

        // collect indices for duplicates so we can mark those rows invalid
        const dupIndices = new Set<number>();
        duplicates.forEach((item: any) => {
          const dataObj = item.data ?? item;
          const idx = findRowIndexByData(dataObj);
          if (idx !== -1) dupIndices.add(idx);
        });

        function processErrors(list: any[]) {
          list.forEach((item: any) => {
            // Case 1: item is returned in { data: { field: { value, error } } } format
            const dataObj = item.data ?? item;
            let idx = findRowIndexByData(dataObj);

            // Case 2: bulk_create may return errors as { row: {...fields}, error: "..." }
            if (idx === -1 && item.row) {
              // try to match by row object (compare values)
              const itemRow = item.row as Record<string, any>;
              idx = (function findRowIndexByRowObject(rowObj: Record<string, any>) {
                for (let i = 0; i < cleanRows.length; i++) {
                  const local = cleanRows[i];
                  let allMatch = true;
                  for (const [k, v] of Object.entries(rowObj)) {
                    const localVal = String(local[k] ?? local[apiToDisplay[k] ?? k] ?? "").toLowerCase();
                    const itemVal = String(v ?? "").toLowerCase();
                    if (itemVal && localVal !== itemVal) {
                      allMatch = false;
                      break;
                    }
                  }
                  if (allMatch) return i;
                }
                return -1;
              })(itemRow);
            }

            if (idx === -1) return;

            // If item contains a per-field structure with .error fields
            if (item.data) {
              Object.entries(dataObj).forEach(([apiKey, valAny]) => {
                const err = (valAny as any)?.error ?? "";
                if (err && String(err).trim() !== "") {
                  const displayField = apiToDisplay[apiKey] ?? apiKey;
                  if (!combined[idx]) combined[idx] = [];
                  combined[idx].push({ field: displayField, reason: String(err) });
                }
              });
            } else if (item.error && item.row) {
              // Row-level error string: try to infer field from message
              const msg = String(item.error || item.err || "").trim();
              const knownFields = ["accountType", "accountCode", "accountName", "accountCurrency", "notes", "groupName", "parentAccount"];
              let inferredField = knownFields.find((f) => msg.toLowerCase().includes(f.toLowerCase()) || msg.toLowerCase().includes(f.replace(/([A-Z])/g, " $1").toLowerCase()));
              if (!inferredField) {
                // fallback: look for keywords
                if (msg.toLowerCase().includes("account type")) inferredField = "accountType";
                else inferredField = Object.keys(item.row)[0] ?? "accountName";
              }
              const displayField = apiToDisplay[inferredField] ?? inferredField;
              if (!combined[idx]) combined[idx] = [];
              combined[idx].push({ field: displayField, reason: msg });
            }
          });
        }

        processErrors(errorsArr);

        const results: ValidationResult[] = Object.entries(combined).map(
          ([k, errors]) => ({
            rowIndex: Number(k),
            errors: errors.map((e) => ({ field: e.field, reason: e.reason })),
            hasError: true,
          })
        );

        // update counts
        const problemsCount = Object.keys(combined).length + dupIndices.size;
        const totalSent = cleanRows.length;
        const createdFromServer = Number.isFinite(Number(res?.createdContacts))
          ? Number(res.createdContacts)
          : Math.max(0, totalSent - problemsCount);
        setCreatedCount(createdFromServer);
        setDuplicateCount(duplicates.length);
        setErrorCount(errorsArr.length);

        // update UI/store
        dispatch(setValidationResults(results));
        setLocalValidation(results);
        dispatch(setHasEdits(false));

        const enriched = cleanRows.map((r, i) => ({
          ...r,
          _status: results.some((res) => res.rowIndex === i) || dupIndices.has(i)
            ? status.invalid
            : status.created,
        }));

        // store duplicate indices locally so UI effects can consider them
        setDuplicateIndices(new Set([...dupIndices]));

        setRows(enriched as any);
        if (onValidationResults) onValidationResults(results);

      } catch (err) {
        console.error("bulk_create failed", err);
        // fallback to client-side validation if API fails
        const results = validateCSVData(cleanRows);
        const enriched = rows.map((r, i) => ({
          ...r,
          _status: results.some((res) => res.rowIndex === i)
            ? status.invalid
            : status.valid,
        }));

        setRows(enriched);
        setLocalValidation(results);
        dispatch(setValidationResults(results));
        if (onValidationResults) onValidationResults(results);
      }
    })();
  }, [triggerValidation]);

  // Apply server validation results (storedValidation) to existing `rows` without
  // overwriting edited field values. This only updates statuses/errors.
  useEffect(() => {
    if (!storedValidation || rows.length === 0) return;

    // If storedValidation is server-format (has rowNumber/data), map it, otherwise assume it's already ValidationResult[]
    let results: ValidationResult[] = [];
    const first = Array.isArray(storedValidation) && storedValidation[0];
    if (first && (first.rowNumber !== undefined || first.data !== undefined)) {
      results = mapServerToValidationResults(storedValidation as any[]);
    } else if (Array.isArray(storedValidation)) {
      results = storedValidation as ValidationResult[];
    }

    // Update local validationResults and store
    setLocalValidation(results);
    dispatch(setValidationResults(results));

    // Update row _status only; preserve field values
    setRows((prevRows) =>
      prevRows.map((r, i) => {
        const rowRes = results.find((res) => res.rowIndex === i);
        const isInvalid = duplicateIndices.has(i) || (rowRes ? (rowRes.hasError === true ? true : (rowRes.errors && rowRes.errors.length > 0)) : false);
        return {
          ...r,
          _status: isInvalid ? status.invalid : (r._status === status.invalid ? status.invalid : status.created),
        };
      })
    );
  }, [storedValidation, duplicateIndices]);

  const handleEdit = (
    rowIndex: number,
    field: string,
    value: string | boolean
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex][field] = value;
      if (!updated[rowIndex]._edited) updated[rowIndex]._edited = {};
      updated[rowIndex]._edited![field] = true;
      return updated;
    });
    dispatch(setHasEdits(true));
  };

  const getFieldError = (rowIndex: number, field: string) => {
    const rowErr = validationResults.find((r) => r.rowIndex === rowIndex);
    return rowErr?.errors.some((e) => e.field === field);
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {rows.length === 0 ? (
        <Typography sx={{ padding: 2 }}>
          No data found for validation.
        </Typography>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preview & Edit{" "}
            {createdCount !== null && (
              <span>
                <strong style={{ color: "#2e7d32" }}>Created: {rows.length - duplicateCount - errorCount}</strong>
                {`  •  `}
                <span style={{ color: "#d32f2f" }}>Errors: {errorCount}</span>
                {`  •  `}
                <span>Duplicates: {duplicateCount}</span>
                {`  •  Total: ${rows.length}`}
              </span>
            )}
          </Typography>

          <TableContainer
            sx={{
              width: "100%",
              maxWidth: "100%",
              flex: 1,
              minHeight: 0,
              overflowX: "auto",
              overflowY: "auto",
              border: "1px solid #ccc",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: "#f5f8fa",
                      border: "1px solid grey",
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    Status
                  </TableCell>
                  {Object.keys(rows[0])
                    .filter((key) => !key.startsWith("_"))
                    .map((key) => (
                      <TableCell
                        key={key}
                        sx={{
                          backgroundColor: "#f5f8fa",
                          border: "1px solid grey",
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        {key}
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell
                      sx={{ minWidth: "100px", border: "1px solid grey" }}
                    >
                      {row._status === status.invalid ? (
                        <ErrorIcon color="error" />
                      ) : row._status === status.created ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CheckCircleIcon color="disabled" />
                      )}
                    </TableCell>

                    {Object.keys(row)
                      .filter((key) => !key.startsWith("_"))
                      .map((key) => {
                        const isError = getFieldError(i, key);
                        const isEdited = row._edited?.[key];
                        const errorMessage = validationResults
                          .find((r) => r.rowIndex === i)
                          ?.errors.find((e) => e.field === key)?.reason;

                        return (
                          <TableCell
                            key={key}
                            sx={{
                              border: "1px solid grey",
                              borderLeft: "none",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {isEdited && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor: "gold",
                                  }}
                                />
                              )}
                              {key === "accountCurrency" ? (
                                <SingleSelectElement
                                  label=""
                                  value={String(row[key] ?? "")}
                                  onChange={(val) => handleEdit(i, key, val)}
                                  options={currencyOptions}
                                  // fullWidth={false}
                                  width="150px"
                                  error={isError}
                                  helperText={isError ? errorMessage || "" : ""}
                                  clearable={false}
                                />
                              ) : String(key).toLowerCase().startsWith("is") ? (
                                <Box>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={Boolean(row[key])}
                                        onChange={(e) =>
                                          handleEdit(i, key, e.target.checked)
                                        }
                                      />
                                    }
                                    label=""
                                  />
                                  {isError && (
                                    <FormHelperText error>
                                      {errorMessage}
                                    </FormHelperText>
                                  )}
                                </Box>
                              ) : (
                                <Tooltip title={isError ? errorMessage || "" : ""} arrow>
                                  <TextFieldElement
                                    label=""
                                    value={String(row[key] ?? "")}
                                    onChange={(e) => handleEdit(i, key, e.target.value)}
                                    error={isError}
                                    helperText={isError ? errorMessage || "" : ""}
                                    placeholder={key}
                                    fullWidth={false}
                                    width="150px"
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
