import {
  Box,
  Button,
  Card,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import UploadCSV from "./components/UploadCSV";
import MapColumns from "./components/MapColumns";
import ValidationScreen from "./components/ValidationPage";
import DuplicatesPage from "./components/DuplicatesPage";

import { useValidateCsvforAccountsMutation } from "./api/accountsImport.api";
import { mapRawDataToSystem } from "./utils/mapRawDataToSystem";
import { validateCSVData } from "./utils/validation";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../../../components/atom/button";
import {
  useAppDispatch,
  useAppSelector,
  type RootState,
} from "../../../../../store/store";
import { currencyData } from "../../../../company/utils/currency";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { setColumnMapping, setUploadedFiles, setValidationResults } from "./CSVSlice";

function AccountImportView() {
  const dispatch = useAppDispatch();
  const [columnMapping, setLocalMapping] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [triggerValidation, setTriggerValidation] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(true);
  const navigate = useNavigate();
  const steps = ["Upload CSV", "Map Columns", "Preview & Edit", "Duplicates"];
  const valErrors = useAppSelector(
    (state) => state.accImport.validationResults,
  );
  const [missingRequired, setMissingRequired] = useState(false);
  const currencyOptions = useMemo(() => {
    return currencyData.map((item: any) => ({
      label: `${item.symbol} - ${item.cc} - ${item.name}`,
      value: `${item.symbol} - ${item.cc}`,
    }));
  }, []);

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
      if (label.includes(s) || value.includes(s) || name.includes(s))
        return opt.value;
    }

    // fallback: try prefix match on value or label
    for (const opt of currencyOptions) {
      if (String(opt.value).toLowerCase().startsWith(s)) return opt.value;
      if (String(opt.label).toLowerCase().startsWith(s)) return opt.value;
    }

    return undefined;
  };

  const content = [
    <UploadCSV />,
    <MapColumns update={setLocalMapping} setMissing={setMissingRequired} />,
    <ValidationScreen
      triggerValidation={triggerValidation}
      onValidationResults={(results) => {
        const has =
          Array.isArray(results) &&
          results.some(
            (v: any) =>
              v.hasError === true || (v.errors && v.errors.length > 0),
          );
        setHasValidationErrors(Boolean(has));
        setTriggerValidation(false);
      }}
    />,
    <DuplicatesPage />,
  ];

  const { rawData, uploadedFile, hasEdits } = useAppSelector(
    (state: RootState) => state.accImport,
  );

  const [validateCsv] = useValidateCsvforAccountsMutation();

  const handleNext = async () => {
    if (activeStep === 1) {
      dispatch(setColumnMapping(columnMapping));

      // Prefer server validation when file + mapping available
      if (
        uploadedFile &&
        columnMapping &&
        Object.keys(columnMapping).length > 0
      ) {
        const form = new FormData();
        form.append("file", uploadedFile);
        // Map display/system labels to backend API keys (see Postman keys)
        const displayToApiKey: Record<string, string> = {
          Name: "accountName",
          "Account Name": "accountName",
          "Account Type": "accountType",
          "Account Code": "accountCode",
          "Account Currency": "accountCurrency",
          Notes: "notes",
          "Group Name": "groupName",
          "Parent Account": "parentAccount",
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
          is_archived: "isArchived",
          GSTIN: "gstin",
          "economic territory": "economicTerritory",
          "PAN Number": "pan",
          tds_prefill_val: "tdsPrefillValue",
        };

        // append mapping entries as separate form fields (apiKey -> csvColumn)
        Object.entries(columnMapping).forEach(([displayKey, csvCol]) => {
          if (!csvCol) return;
          const apiKey = displayToApiKey[displayKey] ?? displayKey;
          // if (apiKey == "accountCurrency") {
          //   const bestCurrency = findBestCurrencyOption(csvCol);
          //   if (bestCurrency) {
          //     form.append("accountCurrency", bestCurrency);
          //   }
          // }

          form.append(apiKey, csvCol);
        });

        try {
          const res = await validateCsv(form).unwrap();

          // Normalize server response into ValidationResult[]
          const serverArr: any[] = Array.isArray(res) ? res : (res?.data ?? []);

          const mappedResults = (serverArr ?? []).map((item: any) => {
            const rowNumber = Number(item.rowNumber ?? item.rowIndex ?? NaN);
            const rowIndex = Number.isFinite(rowNumber)
              ? Math.max(0, rowNumber - 2)
              : 0;

            const hasError = Boolean(item.hasError);
            const errors: { field: string; reason: string }[] = [];
            const dataObj = item.data ?? item;

            Object.entries(dataObj).forEach(([apiKey, valAny]) => {
              const val = valAny as any;
              const err = val?.error ?? "";
              if (err && String(err).trim() !== "") {
                errors.push({ field: apiKey, reason: String(err) });
              }
            });

            return { rowIndex, errors, hasError };
          });

          dispatch(setValidationResults(mappedResults));
        } catch (err) {
          console.error(
            "validateCsv API failed, falling back to client validation",
            err,
          );
          const mapped = mapRawDataToSystem(rawData, columnMapping);
          const results = validateCSVData(mapped);
          dispatch(setValidationResults(results));
        }
      } else {
        // fallback: client-side validation using current rawData + mapping
        const mapped = mapRawDataToSystem(rawData, columnMapping);
        const results = validateCSVData(mapped);
        dispatch(setValidationResults(results));
      }

      setActiveStep((prev) => prev + 1);
      return;
    }

    if (activeStep === 2) {
      if (hasValidationErrors || hasEdits) {
        setTriggerValidation(true);
      } else {
        setActiveStep((prev) => prev + 1);
      }
      return;
    }
    if (activeStep === steps.length - 1) {
      navigate(-1);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleNavigateToAccounts = () => {
    navigate("/books/coa/home");
    dispatch(setUploadedFiles(null));
  };

  const handleBack = () => {
    if (activeStep == 1) {
      dispatch(setUploadedFiles(null));
      dispatch(setColumnMapping({}));
      setMissingRequired(false);
    }
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => setActiveStep(0);

  useEffect(() => {
    const has =
      Array.isArray(valErrors) &&
      valErrors.some(
        (v: any) => v.hasError === true || (v.errors && v.errors.length > 0),
      );
    setHasValidationErrors(Boolean(has));
  }, [valErrors]);

  useEffect(() => {
    return () => {
      dispatch(setColumnMapping({}));
      dispatch(setValidationResults([]));
    };
  }, []);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 140px)",
        padding: 2,
        borderRadius: "4px",
        // border:"2px solid red"
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={handleNavigateToAccounts}
          sx={{ textTransform: "none" }}
        ></Button>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Accounts Import
        </Typography>
      </Box>
      {/* Stepper */}
      <Box sx={{ flex: "0 0 auto", mb: "20px" }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flex: "1 1 auto",
          // overflow: "auto",
          overflow: "hidden",
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {activeStep === steps.length ? (
          <Box>
            <Typography sx={{ mt: 2, mb: 1 }}>
              All steps completed — you’re finished!
            </Typography>
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        ) : (
          content[activeStep]
        )}
      </Box>

      {/* Bottom actions */}
      {activeStep < steps.length && (
        <Box
          sx={{
            flex: "0 0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 1,
            height: "8vh",
          }}
        >
          <PrimaryButton disabled={activeStep === 0} onClick={handleBack}>
            Back
          </PrimaryButton>
          <Tooltip
            title={!uploadedFile ? "Please upload a file to proceed" : ""}
          >
            <PrimaryButton onClick={handleNext} disabled={!uploadedFile || missingRequired}>
              {activeStep === 2
                ? hasValidationErrors || hasEdits
                  ? "Validate"
                  : "Finish"
                : activeStep === steps.length - 1
                  ? "Finish"
                  : "Next"}
            </PrimaryButton>
          </Tooltip>
        </Box>
      )}
    </Card>
  );
}

export default AccountImportView;
