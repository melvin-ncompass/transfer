import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
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
import { useBulkCreateMutation } from "../api/contactsImport.api";
import {
  setValidationResults,
  setServerDuplicates,
  setMappedData,
  setHasContactEdits,
} from "../CSVSlice";
import { TextFieldElement } from "../../../../../../components/atom/text-field";

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
  const { rawData, columnMapping } = useAppSelector((state) => state.file);
  const storedValidation = useAppSelector(
    (state) => state.file.validationResults as any
  );
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [validationResults, setLocalValidation] = useState<ValidationResult[]>(
    []
  );
  const dispatch = useAppDispatch();
  const [bulkCreate] = useBulkCreateMutation();
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(
    new Set()
  );

  // api -> display mapping (used by multiple effects)

  function mapServerToValidationResults(serverArr: any[]): ValidationResult[] {
    if (!Array.isArray(serverArr)) return [];
    return serverArr
      .map((item) => {
        const rowNumber = Number(item.rowNumber ?? item.rowIndex ?? NaN);
        // assume CSV header occupies 1 row; first data row has rowNumber === 2 -> map to index 0
        const rowIndex = Number.isFinite(rowNumber)
          ? Math.max(0, rowNumber - 2)
          : 0;

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

        return { rowIndex, errors };
      })
      .filter((r) => r.errors.length > 0);
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

    const enriched: EditableRow[] = mappedData.map((r, i) => ({
      ...r,
      _status: results.some((res) => res.rowIndex === i)
        ? status.invalid
        : status.valid,
      _edited: {},
    }));

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
        Name: "name",
        "Middle Name": "middleName",
        "Last Name": "lastName",
        Email: "email",
        Phone: "phoneNumber",
        "Dial Code": "dialCode",
        "Address Line1": "addressLine1",
        "Address Line2": "addressLine2",
        City: "city",
        State: "state",
        pincode: "pincode",
        Country: "country",
        // is_archived: "isOrganization",
        GSTIN: "gstin",
        "economic territory": "economicTerritory",
        "PAN Number": "pan",
        tds_prefill_val: "tdsPrefillValue",
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
          const candidates = ["email", "phoneNumber", "pan", "name", "middleName"];
          for (let i = 0; i < cleanRows.length; i++) {
            const row = cleanRows[i];
            for (const key of candidates) {
              const displayKey = key;
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

        const combined: Record<number, { field: string; reason: string }[]> =
          {};

        // collect indices for duplicates so we can mark those rows invalid
        const dupIndices = new Set<number>();
        duplicates.forEach((item: any) => {
          const dataObj = item.data ?? item;
          const idx = findRowIndexByData(dataObj);
          if (idx !== -1) dupIndices.add(idx);
        });

        function processErrors(list: any[]) {
          list.forEach((item: any) => {
            const dataObj = item.data ?? item;
            const idx = findRowIndexByData(dataObj);
            if (idx === -1) return;

            Object.entries(dataObj).forEach(([apiKey, valAny]) => {
              const err = (valAny as any)?.error ?? "";
              if (err && String(err).trim() !== "") {
                const displayField = apiKey;
                if (!combined[idx]) combined[idx] = [];
                combined[idx].push({
                  field: displayField,
                  reason: String(err),
                });
              }
            });
          });
        }

        processErrors(errorsArr);

        const results: ValidationResult[] = Object.entries(combined).map(
          ([k, errors]) => ({
            rowIndex: Number(k),
            errors: errors.map((e) => ({ field: e.field, reason: e.reason })),
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
        dispatch(setHasContactEdits(false));

        const enriched = cleanRows.map((r, i) => ({
          ...r,
          _status:
            results.some((res) => res.rowIndex === i) || dupIndices.has(i)
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
      prevRows.map((r, i) => ({
        ...r,
        _status:
          results.some((res) => res.rowIndex === i) || duplicateIndices.has(i)
            ? status.invalid
            : r._status === status.invalid
              ? status.invalid
              : status.created,
      }))
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
    dispatch(setHasContactEdits(false));
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
            Preview & Edit —{" "}
            {createdCount !== null ? (
              <span>
                <strong style={{ color: "#2e7d32" }}>
                  Created: {rows.length - duplicateCount - errorCount}
                </strong>
                {`  •  `}
                <span style={{ color: "#d32f2f" }}>Errors: {errorCount}</span>
                {`  •  `}
                <span>Duplicates: {duplicateCount}</span>
                {`  •  Total: ${rows.length}`}
              </span>
            ) : (
              <span>
                <span style={{ color: "#d32f2f" }}>
                  {rows.filter((r) => r._status === status.invalid).length}
                </span>{" "}
                / {rows.length} have errors
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
                              {String(key).toLowerCase().startsWith("is") ? (
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
                                <Tooltip
                                  title={isError ? errorMessage || "" : ""}
                                  arrow
                                >
                                  <TextFieldElement
                                    label=""
                                    value={String(row[key] ?? "")}
                                    onChange={(e) =>
                                      handleEdit(i, key, e.target.value)
                                    }
                                    error={isError}
                                    helperText={
                                      isError ? errorMessage || "" : ""
                                    }
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
