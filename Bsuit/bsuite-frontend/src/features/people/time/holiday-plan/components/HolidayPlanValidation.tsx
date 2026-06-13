import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
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
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import {
  useGetHolidayPlansQuery,
  useValidateHolidayPlanMutation,
  type IHolidayPlanUploadItem,
  type IHolidayPlanValidateError,
} from "../api/holidayPlan.api";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import dayjs from "dayjs";
import { Country } from "country-state-city"
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";

enum Status {
  valid = "valid",
  validated = "validated",
  invalid = "invalid",
}

export interface EditableRow extends IHolidayPlanUploadItem {
  _status?: Status;
  _edited?: Record<string, boolean>;
}

interface ValidationResult {
  rowIndex: number;
  errors: { field: string; reason: string }[];
}
export interface HolidayPlanValidationViewRef {
  validate: () => Promise<void>;
}

interface HolidayPlanValidationViewProps {
  uploadedData: IHolidayPlanUploadItem[];
  initialErrors?: IHolidayPlanValidateError[];
  onValidationComplete?: (results: ValidationResult[]) => void;
  onDataUpdate?: (data: IHolidayPlanUploadItem[]) => void;
  onEditStateChange?: (hasEdits: boolean) => void;
}

const HolidayPlanValidationView = forwardRef<HolidayPlanValidationViewRef, HolidayPlanValidationViewProps>(({
  uploadedData,
  initialErrors,
  onValidationComplete,
  onDataUpdate,
  onEditStateChange,
}, ref) => {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validateHolidayPlan] = useValidateHolidayPlanMutation();
  const [validatedCount, setValidatedCount] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [hasEdits, setHasEdits] = useState<boolean>(false);

  const { data: existingPlans = [] } = useGetHolidayPlansQuery();
  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        label: country.name,
        value: country.isoCode,
      })),
    []
  );

  // Initialize rows from uploaded data with initial errors if any
  useEffect(() => {
    if (!uploadedData || uploadedData.length === 0) return;

    // Map initial errors if they exist
    let initialResults: ValidationResult[] = [];
    if (initialErrors && initialErrors.length > 0) {
      initialResults = mapServerToValidationResults(initialErrors);
      setValidationResults(initialResults);
    }

    const enriched: EditableRow[] = uploadedData.map((item, index) => ({
      ...item,
      _status: initialResults.some((r) => r.rowIndex === index)
        ? Status.invalid
        : Status.valid,
      _edited: {},
    }));

    setRows(enriched);

    // Set initial counts if there were errors from upload
    if (initialResults.length > 0) {
      setErrorCount(initialResults.length);
      setValidatedCount(uploadedData.length - initialResults.length);
    }
  }, [uploadedData, initialErrors]);

  // Map server validation errors to ValidationResult format
  const mapServerToValidationResults = (
    serverErrors: IHolidayPlanValidateError[]
  ): ValidationResult[] => {
    if (!Array.isArray(serverErrors)) return [];

    return serverErrors
      .map((item) => {
        // Server returns rowNumber starting from 2 (accounting for header)
        // Map to 0-based index
        // const rowIndex = Math.max(0, item.rowNumber - 2);
        const rowIndex = item.rowNumber - 1;
        const errors: { field: string; reason: string }[] = [];

        // Process each field's validation error
        Object.entries(item.data).forEach(([field, fieldData]) => {
          if (fieldData.error && String(fieldData.error).trim() !== "") {
            errors.push({
              field,
              reason: String(fieldData.error),
            });
          }
        });

        return { rowIndex, errors };
      })
      .filter((r) => r.errors.length > 0);
  };

  // Handle field edits
  const handleEdit = (
    rowIndex: number,
    field: keyof IHolidayPlanUploadItem,
    value: string
  ) => {
    setRows((prev) => {
      const updated = [...prev];

      updated[rowIndex] = {
        ...updated[rowIndex],
        [field]: value,
        _edited: {
          ...updated[rowIndex]._edited,
          [field]: true,
        },
      };

      if (onDataUpdate) {
        const cleanRows: IHolidayPlanUploadItem[] = updated.map((r) => ({
          planName: String(r.planName ?? ""),
          country: String(r.country ?? ""),
          date: String(r.date ?? ""),
          description: String(r.description ?? ""),
        }));

        onDataUpdate(cleanRows);
      }

      return updated;
    });

    setHasEdits(true);

    if (onEditStateChange) {
      onEditStateChange(true);
    }
  };

  const handleValidate = async () => {
    if (rows.length === 0) return;

    // Sanitize rows for API submission
    const cleanRows: IHolidayPlanUploadItem[] = rows.map((r) => ({
      planName: String(r.planName ?? ""),
      country: String(r.country ?? ""),
      date: String(r.date ?? ""),
      description: String(r.description ?? ""),
    }));

    try {
      const serverErrors = await validateHolidayPlan({
        data: cleanRows,
      }).unwrap();

      // Map server errors to validation results
      const results = mapServerToValidationResults(serverErrors);

      const existingPlanNames = new Set(
        existingPlans.map((p) => p.planName.trim().toLowerCase())
      );

      cleanRows.forEach((row, index) => {
        const planName = row.planName?.trim().toLowerCase();

        if (!planName) return;

        if (existingPlanNames.has(planName)) {
          const existingRow = results.find((r) => r.rowIndex === index);

          if (existingRow) {
            const alreadyExists = existingRow.errors.some(
              (e) => e.field === "planName"
            );

            if (!alreadyExists) {
              existingRow.errors.push({
                field: "planName",
                reason: "Holiday plan name already exists",
              });
            }
          } else {
            results.push({
              rowIndex: index,
              errors: [
                {
                  field: "planName",
                  reason: "Holiday plan name already exists",
                },
              ],
            });
          }
        }
      });

      // Update counts
      const errorsFound = results.length;
      const validCount = cleanRows.length - errorsFound;

      setValidatedCount(validCount);
      setErrorCount(errorsFound);
      setValidationResults(results);
      setHasEdits(false); // Reset edit flag after validation

      // Update row statuses
      const enriched = rows.map((r, i) => ({
        ...r,
        _status: results.some((res) => res.rowIndex === i)
          ? Status.invalid
          : Status.validated,
        _edited: {},
      }));

      setRows(enriched);

      if (onValidationComplete) {
        onValidationComplete(results);
      }
      if (onDataUpdate) {
        onDataUpdate(cleanRows);
      }
      if (onEditStateChange) {
        onEditStateChange(false);
      }
      setHasEdits(false);
    } catch (err) {
      console.error("Holiday plan validation failed", err);

      // On error, mark all as valid and notify parent
      const enriched = rows.map((r) => ({
        ...r,
        _status: Status.valid,
      }));
      setRows(enriched);

      if (onValidationComplete) {
        onValidationComplete([]);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    validate: handleValidate,
  }));

  // Get error message for a specific field
  const getFieldError = (rowIndex: number, field: string): string | undefined => {
    const rowErr = validationResults.find((r) => r.rowIndex === rowIndex);
    return rowErr?.errors.find((e) => e.field === field)?.reason;
  };

  // Check if field has error
  const hasFieldError = (rowIndex: number, field: string): boolean => {
    return !!getFieldError(rowIndex, field);
  };

  if (rows.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 320,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data uploaded yet. Please complete Step 1 first.
        </Typography>
      </Box>
    );
  }

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
      <Typography variant="h6" sx={{ mb: 2 }}>
        Preview & Edit Holiday Plans —{" "}
        {validatedCount !== null ? (
          <span>
            <strong style={{ color: "#2e7d32" }}>Valid: {validatedCount}</strong>
            {`  •  `}
            <span style={{ color: "#d32f2f" }}>Errors: {errorCount}</span>
            {`  •  Total: ${rows.length}`}
          </span>
        ) : (
          <span>Total: {rows.length} records</span>
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
          borderRadius: 1,
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: "#f5f8fa",
                  border: "1px solid #ddd",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  fontWeight: 600,
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "#f5f8fa",
                  border: "1px solid #ddd",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  fontWeight: 600,
                }}
              >
                Plan Name
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "#f5f8fa",
                  border: "1px solid #ddd",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  fontWeight: 600,
                }}
              >
                Country
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "#f5f8fa",
                  border: "1px solid #ddd",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  fontWeight: 600,
                }}
              >
                Date
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: "#f5f8fa",
                  border: "1px solid #ddd",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  fontWeight: 600,
                }}
              >
                Description
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} hover>
                <TableCell
                  sx={{
                    minWidth: "80px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {row._status === Status.invalid ? (
                    <Tooltip title="Has validation errors">
                      <ErrorIcon color="error" />
                    </Tooltip>
                  ) : row._status === Status.validated ? (
                    <Tooltip title="Validated successfully">
                      <CheckCircleIcon color="success" />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Not yet validated">
                      <CheckCircleIcon color="disabled" />
                    </Tooltip>
                  )}
                </TableCell>

                {/* Plan Name */}
                <TableCell sx={{ border: "1px solid #ddd" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row._edited?.planName && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "warning.main",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Tooltip
                      title={getFieldError(i, "planName") || ""}
                      arrow
                      placement="top"
                    >
                      <TextField
                        value={row.planName}
                        onChange={(e) => handleEdit(i, "planName", e.target.value)}
                        error={hasFieldError(i, "planName")}
                        helperText={getFieldError(i, "planName")}
                        size="small"
                        fullWidth
                        sx={{ minWidth: 150 }}
                      />
                    </Tooltip>
                  </Box>
                </TableCell>

                {/* Country */}
                <TableCell sx={{ border: "1px solid #ddd" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row._edited?.country && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "warning.main",
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <Box sx={{ minWidth: 220, width: "100%" }}>
                      <SingleSelectElement
                        label=""
                        value={row.country || ""}
                        onChange={(value) => handleEdit(i, "country", value)}
                        options={countryOptions}
                        error={hasFieldError(i, "country")}
                        helperText={getFieldError(i, "country")}
                        placeholder="Search country..."
                        fullWidth
                      />
                    </Box>
                  </Box>
                </TableCell>

                {/* Date */}
                <TableCell sx={{ border: "1px solid #ddd" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row._edited?.date && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "warning.main",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Tooltip
                      title={getFieldError(i, "date") || ""}
                      arrow
                      placement="top"
                    >
                      <Box sx={{ width: '100%' }}>
                        <DatePickerElement
                          label=""
                          value={row.date ? dayjs(row.date) : null}
                          onChange={(newValue) => {
                            handleEdit(
                              i,
                              "date",
                              newValue ? newValue.format("YYYY-MM-DD") : ""
                            );
                          }}
                          error={hasFieldError(i, "date")}
                          helperText={getFieldError(i, "date")}
                          width="100%"
                          format="MMM DD, YYYY"
                        />
                      </Box>
                    </Tooltip>
                  </Box>
                </TableCell>

                {/* Description */}
                <TableCell sx={{ border: "1px solid #ddd" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row._edited?.description && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "warning.main",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Tooltip
                      title={getFieldError(i, "description") || ""}
                      arrow
                      placement="top"
                    >
                      <TextField
                        value={row.description}
                        onChange={(e) => handleEdit(i, "description", e.target.value)}
                        error={hasFieldError(i, "description")}
                        helperText={getFieldError(i, "description")}
                        size="small"
                        fullWidth
                        sx={{ minWidth: 200 }}
                      />
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

export default HolidayPlanValidationView;