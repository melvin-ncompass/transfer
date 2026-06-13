import {
  Box,
  Button,
  Card,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import UploadCSV from "./components/UploadCSV";
import MapColumns from "./components/MapColumns";
import ValidationScreen from "./components/ValidationPage";
import DuplicatesPage from "./components/DuplicatesPage";
import { PrimaryButton } from "../../../../../components/atom/button";
import {
  setColumnMapping,
  setUploadedFile,
  setValidationResults,
} from "./CSVSlice";
import { useAppDispatch, useAppSelector } from "../../../../../store/store";
import { useValidateCsvMutation } from "./api/contactsImport.api";
import { mapRawDataToSystem } from "./utils/mapRawDataToSystem";
import { validateCSVData } from "./utils/validation";
import { useNavigate } from "react-router-dom";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { Tooltip } from "../../../../../components/atom/tooltip";

function ContactsImportView() {
  const dispatch = useAppDispatch();
  const [columnMapping, setLocalMapping] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [triggerValidation, setTriggerValidation] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(true);
  const [missingRequired, setMissingRequired] = useState(false);
  const navigate = useNavigate();
  const valErrors = useAppSelector((state) => state.file.validationResults);
  const steps = ["Upload CSV", "Map Columns", "Preview & Edit", "Duplicates"];
  useEffect(() => {
    setHasValidationErrors(valErrors?.length! > 0);
  }, [valErrors]);

  useEffect(() => {
    return () => {
      dispatch(setColumnMapping({}));
      dispatch(setValidationResults([]));
    };
  }, []);

  const content = [
    <UploadCSV />,
    <MapColumns update={setLocalMapping} setMissing={setMissingRequired} />,
    <ValidationScreen
      triggerValidation={triggerValidation}
      onValidationResults={(results) => {
        setHasValidationErrors(results.length > 0);
        setTriggerValidation(false);
        if (results.length === 0) {
          setActiveStep((prev) => prev + 1);
        }
      }}
    />,
    <DuplicatesPage />,
  ];

  const { rawData, uploadedFile } = useAppSelector((state) => state.file);
  const [validateCsv] = useValidateCsvMutation();

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
          form.append(apiKey, csvCol);
        });

        try {
          const res = await validateCsv(form).unwrap();
          const results: any[] = Array.isArray(res) ? res : (res?.data ?? []);
          dispatch(setValidationResults(results));
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
      setTriggerValidation(true);
      return;
    }
    if (activeStep === steps.length - 1) {
      navigate(-1);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleNavigateToContacts = () => {
    navigate("/books/coa/home?tab=contacts");
    dispatch(setUploadedFile(null));
  };

  const handleBack = () => {
    if (activeStep == 1) {
      dispatch(setUploadedFile(null));
      dispatch(setColumnMapping({}));
      setMissingRequired(false);
    }
    setActiveStep((prev) => prev - 1);
  };
  const handleReset = () => setActiveStep(0);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 140px)",
        padding: 2,
        borderRadius: "4px",
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
          onClick={handleNavigateToContacts}
          sx={{ textTransform: "none" }}
        ></Button>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Contacts Import
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          minHeight: 0,
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
            <PrimaryButton
              onClick={handleNext}
              disabled={!uploadedFile || missingRequired}
            >
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
    </Card>
  );
}

export default ContactsImportView;
