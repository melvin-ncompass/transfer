import {
  Box,
  Button,
  Card,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import UploadCSV from "./components/UploadCSV";
import MapColumns from "./components/MapColumns";
import ValidationScreen from "./components/ValidationPage";
// import DuplicatesPage from "./components/DuplicatesPage";
import {
  useBulkCreateStatementsMutation,
  useExtractColumnsMutation,
  useProcessCsvMutation,
} from "./api/bankAccStatementImport.api";
import { useGetUncategorizedRowsQuery } from "../../home/api/uncategorized.api";
import { mapRawDataToSystem } from "./utils/mapRawDataToSystem";
import { validateCSVData } from "./utils/validation";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../../../../components/atom/button";
import {
  useAppDispatch,
  useAppSelector,
  type RootState,
} from "../../../../../../store/store";
import { currencyData } from "../../../../../company/utils/currency";
import {
  setColumnMapping,
  setValidationResults,
  setExtractedCandidates,
  setProcessed,
  setUploadedFile,
  setAccountId,
  setSelectedDateFormat,
} from "./CSVSlice";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { formatDateShort } from "../../../../../../utils/numberFormatter";

function BankAccountStatementImportView() {
  const dispatch = useAppDispatch();
  const [extractColumns] = useExtractColumnsMutation();
  const [columnMapping, setLocalMapping] = useState<Record<string, string>>({});
  const [bulkCreateStatements] = useBulkCreateStatementsMutation();
  const [activeStep, setActiveStep] = useState(0);
  const [triggerValidation, setTriggerValidation] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(true);
  const navigate = useNavigate();
  const steps = ["Upload CSV", "Map Columns", "Preview & Edit"];
  const valErrors = useAppSelector(
    (state) => state.bankAccStatementImport.validationResults,
  );
  useEffect(() => {
    setHasValidationErrors(valErrors?.length! > 0);
  }, [valErrors]);
  const currencyOptions = useMemo(() => {
    return currencyData.map((item: any) => ({
      label: `${item.symbol} - ${item.cc} - ${item.name}`,
      value: `${item.symbol} - ${item.cc}`,
    }));
  }, []);
  const [errors, setErrors] = useState("");
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
    <MapColumns update={setLocalMapping} />,
    <ValidationScreen />,
    // <DuplicatesPage />,
  ];

  const {
    rawData,
    uploadedFile,
    validationResults,
    dateFormat,
    accountId,
    processed,
  } = useAppSelector((state: RootState) => state.bankAccStatementImport);

  const [validateCsv] = useProcessCsvMutation();

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!accountId) {
        setErrors("Please select an account");
        return;
      }
      const fd = new FormData();
      fd.append("file", uploadedFile as Blob);

      fd.append("userDateFormat", dateFormat);
      try {
        const res = await extractColumns(fd).unwrap();
        // normalize response: server may return arrays under various keys
        const payload = res && res.data ? res.data : res;

        const dateCandidates =
          payload?.date || payload?.dates || payload?.dateColumns || [];
        const descriptionCandidates =
          payload?.description ||
          payload?.descriptions ||
          payload?.textColumns ||
          [];
        const debitCandidates =
          payload?.debit || payload?.debits || payload?.numericColumns || [];
        const creditCandidates =
          payload?.credit || payload?.credits || payload?.numericColumns || [];

        dispatch(
          setExtractedCandidates({
            dateCandidates,
            descriptionCandidates,
            debitCandidates,
            creditCandidates,
          }),
        );
        // If server returned processed rows (res.data), store them as mapped data
        // const serverRows = Array.isArray(payload) ? payload : (payload?.data && Array.isArray(payload.data) ? payload.data : []);
        // if (serverRows && serverRows.length > 0) {
        //   dispatch(setMappedData(serverRows as any));
        // }
        setActiveStep(1);
      } catch (err: any) {
        console.error("extractColumns failed", err);
        if (
          err.data.message ==
          "Could not identify the statement table structure."
        ) {
          setErrors("Check Date Format and Selected Account");
        } else {
          setErrors(err.data.message);
        }
      }
      return;
    }
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
          date: "dateKey",
          description: "descriptionKey",
          debit: "debitKey",
          credit: "creditKey",
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
          const formattedData = res.data.map((item: any) => ({
            ...item,
            transactionDate: formatDateShort(item.transactionDate),
          }));

          dispatch(setProcessed(formattedData));

          // Normalize server response into ValidationResult[]
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
      const res = await bulkCreateStatements({
        id: accountId!,
        data: processed,
      }).unwrap();

      setActiveStep((prev) => prev + 1);

      return;
    }
    if (activeStep === steps.length - 1) {
      navigate(-1);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleNavigateToTransact = () => {
    dispatch(setUploadedFile(null));
    dispatch(setExtractedCandidates({ dateCandidates: [], descriptionCandidates: [], debitCandidates: [], creditCandidates: [] }));
    dispatch(setColumnMapping({}));
    dispatch(setValidationResults([]));
    dispatch(setProcessed([]));
    dispatch(setAccountId(undefined));
    dispatch(setSelectedDateFormat(""));
    navigate("/books/transact/home?tab=uncategorized");
  };
  const handleReset = () => setActiveStep(0);

  return (
    <>
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 20vh)",
          padding: 2,
          borderRadius: "4px",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={handleNavigateToTransact}
            sx={{ textTransform: "none" }}
          ></Button>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Bank Statement Import
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
            overflow: "scroll",
            display: "flex",
            justifyContent: "center",
            minHeight: 0,
            alignItems: "stretch",
            width: "100%",
            // alignItems: "center", 
          }}
        >
          {activeStep === steps.length ? (
            <Box>
              <Typography sx={{ mt: 2, mb: 1 }}>
                All steps completed — you’re finished!
              </Typography>
              {/* <Button onClick={handleReset}>Reset</Button> */}
              <PrimaryButton onClick={handleNavigateToTransact}>
                Go to Uncategorized Transactions
              </PrimaryButton>
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
              title={
                !uploadedFile ?
                  "Please upload a file to proceed" :
                  !dateFormat ? "Please select a date format" :
                    !accountId ? "Please select an account" : ""}
            >
              <PrimaryButton onClick={handleNext} disabled={!uploadedFile || !dateFormat || !accountId}>
                {activeStep === 2
                  ? hasValidationErrors
                    ? "Validate"
                    : "Finish"
                  : activeStep === steps.length - 1
                    ? "Finish"
                    : "Next"}
              </PrimaryButton>
            </Tooltip>
          </Box>
        )}
        {errors && (
          <Snackbar
            color="error"
            onClose={() => setErrors("")}
            message={errors}
          />
        )}
      </Card>
    </>
  );
}

export default BankAccountStatementImportView;
