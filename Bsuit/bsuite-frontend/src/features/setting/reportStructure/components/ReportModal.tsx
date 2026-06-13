import { useMemo, useEffect, useState } from "react";
import { Box, FormHelperText, Grid, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { ToggleSwitch } from "../../../../components/atom/toggle-switch";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextAreaField } from "../../../../components/atom/text-area-field";
import { Checkbox } from "../../../../components/atom/check-box";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import {
  setReportingCurrency,
  setFiscalStartMonth,
  setFiscalStartDay,
  setFiscalEndMonth,
  setFiscalEndDay,
  setCommaSep,
  setEnableFx,
  toggleShowCompanyName,
  toggleShowHeaderImage,
  toggleShowPageNumber,
  toggleShowGeneratedBy,
  toggleShowGeneratedDate,
  toggleShowGeneratedTime,
  setShowCompanyName,
  setShowHeaderImage,
  setShowPageNumber,
  setShowGeneratedBy,
  setShowGeneratedDate,
  setShowGeneratedTime,
  setFooterContent,
  reset,
} from "../slice/reportStructureSlice";
import {
  useGetReportStructureQuery,
  useUpdateReportStructureMutation,
} from "../api/report.api";
import type { IReportStructureUpdateRequest } from "../types/structure.types";
import { Snackbar } from "../../../../components/atom/snackbar"; // Import Snackbar
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";

// Month list for easier mapping
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

type Month = (typeof months)[number];

// Helper function to clean up footer content
const cleanFooterContent = (content: string): string => {
  return content
    .replace(/\s+/g, " ")  // Replace multiple spaces with a single space
    .trim();  // Remove leading and trailing spaces
};

// Helper function to calculate max days in a month
function getMaxDaysForMonth(month: string | number) {
  const m = String(month).toLowerCase();
  if (["april", "june", "september", "november"].includes(m)) return 30;
  if (m === "february") return 28;
  return 31;
}
// Helper function to compute the fiscal year end date from fiscal start date.
function computeFiscalEndFromStart(
  startMonth: Month | string,
  startDay: string | number
) {
  const startMonthIndex = months.indexOf(String(startMonth) as Month);
  const day = Math.max(1, Math.min(31, Number(startDay) || 1));

  const startDate = new Date(2000, Math.max(0, startMonthIndex), day);
  const nextYearSame = new Date(
    startDate.getFullYear() + 1,
    startDate.getMonth(),
    startDate.getDate()
  );
  nextYearSame.setDate(nextYearSame.getDate() - 1);

  return {
    month: months[nextYearSame.getMonth()],
    day: String(nextYearSame.getDate()),
  };
}

interface IReportStructureDialogProps {
  handleClose: () => void;
  setSnackbar: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      color: "success" | "error";
    }>
  >;
}


export default function ReportStructureDialog({
  handleClose,
   setSnackbar
}: IReportStructureDialogProps) {
  const dispatch = useAppDispatch();
  const rs = useAppSelector((s) => s.report);

  const [localFooter, setLocalFooter] = useState("");
  
 

  // Destructuring slice state for readability
  const {
    reportingCurrency,
    fiscalStartDay,
    fiscalStartMonth,
    fiscalEndDay,
    fiscalEndMonth,
    commaSep,
    enableFx,
    showCompanyName,
    showHeaderImage,
    showPageNumber,
    showGeneratedBy,
    showGeneratedDate,
    showGeneratedTime,
    footerContent,
    footerMax,
  } = rs;

  // Dynamically calculate max days for the start and end months
  const startMonthMax = useMemo(
    () => getMaxDaysForMonth(fiscalStartMonth),
    [fiscalStartMonth]
  );
  const endMonthMax = useMemo(
    () => getMaxDaysForMonth(fiscalEndMonth),
    [fiscalEndMonth]
  );

  // Generating options for the day selectors based on the max days of selected month
  const startDayOptions = useMemo(
    () =>
      Array.from({ length: startMonthMax }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    [startMonthMax]
  );

  const endDayOptions = useMemo(
    () =>
      Array.from({ length: endMonthMax }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1),
      })),
    [endMonthMax]
  );

  // API hooks to fetch report structure data and update report structure
  const { data, isLoading } = useGetReportStructureQuery();
  const [updateReportStructure] = useUpdateReportStructureMutation();

  // Effect hook to update start day if it exceeds the maximum days of the selected start month
  useEffect(() => {
    if (Number(fiscalStartDay) > startMonthMax) {
      dispatch(setFiscalStartDay(String(startMonthMax)));
    }
  }, [startMonthMax, dispatch]);

  // Effect hook to update end day if it exceeds the maximum days of the selected end month
  useEffect(() => {
    if (Number(fiscalEndDay) > endMonthMax) {
      dispatch(setFiscalEndDay(String(endMonthMax)));
    }
  }, [endMonthMax, dispatch]);

  // Effect hook to automatically update the fiscal year end month and day when fiscal year start month or day is changed
  useEffect(() => {
    if (fiscalStartMonth) {
      const { month: newEndMonth, day: newEndDay } = computeFiscalEndFromStart(
        fiscalStartMonth,
        fiscalStartDay
      );

      // Update fiscal end month and day if necessary
      if (String(fiscalEndMonth) !== String(newEndMonth)) {
        dispatch(setFiscalEndMonth(newEndMonth));
      }
      if (String(fiscalEndDay) !== String(newEndDay)) {
        dispatch(setFiscalEndDay(newEndDay));
      }
    }
  }, [
    fiscalStartMonth,
    fiscalStartDay,
    fiscalEndMonth,
    fiscalEndDay,
    dispatch,
  ]);

  // Options for the month select fields
  const monthOptions = months.map((m) => ({ label: m, value: m }));

  // Options for comma separation (Indian vs US numbering system)
  const commaOptionsObj = [
    { label: "Indian Numbering System", value: "IN" },
    { label: "US Numbering System", value: "US" },
  ];

  // Effect hook to fetch and prepopulate the form with data from the API
  useEffect(() => {
    if (data) {
      const {
        fiscalYearStartDate,
        fiscalYearStartMonth,
        fiscalYearEndDate,
        fiscalYearEndMonth,
        enableFxCorrection,
        isCompanyName,
        isHeaderImage,
        isPageNumber,
        isGeneratedBy,
        isGeneratedDate,
        isGeneratedTime,
        footerContent,
        reportingCurrency,
        commaSeparation,
      } = data?.data;

      // Dispatch actions to set form data based on API response
      dispatch(setFiscalStartDay(fiscalYearStartDate || "1"));
      dispatch(setFiscalStartMonth(fiscalYearStartMonth as Month));
      dispatch(setFiscalEndDay(fiscalYearEndDate || "31"));
      dispatch(setFiscalEndMonth(fiscalYearEndMonth as Month));
      dispatch(setEnableFx(enableFxCorrection || false));

      dispatch(setShowCompanyName(!!isCompanyName));
      dispatch(setShowHeaderImage(!!isHeaderImage));
      dispatch(setShowPageNumber(!!isPageNumber));
      dispatch(setShowGeneratedBy(!!isGeneratedBy));
      dispatch(setShowGeneratedDate(!!isGeneratedDate));
      dispatch(setShowGeneratedTime(!!isGeneratedTime));

      dispatch(setFooterContent(footerContent || ""));

      // Safely handle comma separation value
      const commaValues = ["IN", "US"] as const;
      dispatch(
        setCommaSep(
          commaValues.includes(commaSeparation as any)
            ? (commaSeparation as "IN" | "US")
            : "US"
        )
      );
      const initialFooter = footerContent || "";
      setLocalFooter(initialFooter);   // <-- changed
      dispatch(setFooterContent(initialFooter));
      dispatch(setReportingCurrency(reportingCurrency || "₹ - INR"));
    }
  }, [data, dispatch]);

  // Snackbar state management
 const handleSave = async () => {
  const finalFooter = cleanFooterContent(localFooter);

  const payload: IReportStructureUpdateRequest = {
    fiscalYearStartDate: Number(fiscalStartDay) || null,
    fiscalYearStartMonth: fiscalStartMonth || null,
    fiscalYearEndDate: Number(fiscalEndDay) || null,
    fiscalYearEndMonth: fiscalEndMonth || null,
    enableFxCorrection: enableFx,
    isCompanyName: showCompanyName,
    isHeaderImage: showHeaderImage,
    isPageNumber: showPageNumber,
    isGeneratedBy: showGeneratedBy,
    isGeneratedDate: showGeneratedDate,
    isGeneratedTime: showGeneratedTime,
    footerContent: finalFooter,
    commaSeparation: commaSep,
  };

  try {
    await updateReportStructure(payload).unwrap();

    // sync redux AFTER success (optional but good)
    dispatch(setFooterContent(finalFooter));

    setSnackbar({
      open: true,
      message: "Report structure saved successfully!",
      color: "success",
    });

    handleClose();
  } catch (err: any) {
    setSnackbar({
      open: true,
      message: err?.data?.message || "Failed to save report structure.",
      color: "error",
    });
  }
};

 
  // VALIDATION (LOCAL)
 
  const cleanedFooter = cleanFooterContent(localFooter); // clean only for validation
  const isFooterValid = cleanedFooter.length <= footerMax;
  if (isLoading) return <CustomCircularProgress />;

  return (
    <Box px={"10px"}>
      <Grid container spacing={3} sx={{ mt: 1 }} width={"100%"}>
        {/* Reporting Currency (Disabled TextField) */}
        <Grid size={{ xs: 12 }} display={"flex"} alignItems={"center"}>
          <Typography
            variant="body2"
            display="flex"
            alignItems="center"
            flex={1}
          >
            Reporting Currency&nbsp;
            <Tooltip title="Reporting Currency is non-editable">
              <InfoOutlinedIcon fontSize="small" />
            </Tooltip>
          </Typography>
          <TextFieldElement
            sx={{ flex: 2 }}
            label=""
            value={reportingCurrency}
            disabled
            fullWidth
          />
        </Grid>

        {/* Fiscal Year Start and End */}
        <Grid size={{ xs: 12 }} display={"flex"} alignItems={"center"}>
          <Typography variant="body1" flex={1}>
            Fiscal Year
          </Typography>
          <Box display="flex" gap={10} mt={1} flexWrap="wrap" flex={2}>
            {/* Start Date and Month */}
            <Box display={"flex"} alignItems={"center"} gap={5}>
              <Typography variant="subtitle2">Start</Typography>
              <Box display="flex" gap={1} alignItems="center">
                <SingleSelectElement
                  label="Date"
                  value={String(fiscalStartDay)}
                  onChange={(val) => dispatch(setFiscalStartDay(String(val)))}
                  options={startDayOptions}
                  width="90px"
                />
                <SingleSelectElement
                  label="Month"
                  value={fiscalStartMonth}
                  onChange={(val) =>
                    dispatch(setFiscalStartMonth(val as Month))
                  }
                  options={monthOptions}
                  width="140px"
                />
              </Box>
            </Box>

            {/* End Date and Month */}
            <Box display={"flex"} alignItems={"center"} gap={5}>
              <Typography variant="subtitle2">End</Typography>
              <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                <SingleSelectElement
                  label="Date"
                  value={String(fiscalEndDay)}
                  onChange={(val) => dispatch(setFiscalEndDay(String(val)))}
                  options={endDayOptions}
                  width="90px"
                  disabled
                />
                <SingleSelectElement
                  label="Month"
                  value={fiscalEndMonth}
                  onChange={(val) => dispatch(setFiscalEndMonth(val as Month))}
                  options={monthOptions}
                  width="140px"
                  disabled
                />
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Comma Separation System */}
        <Grid size={{ xs: 12 }} display={"flex"} alignItems={"center"}>
          <Typography variant="body2" flex={1}>
            Comma Separation
          </Typography>
          <SingleSelectElement
            label=""
            value={commaSep ?? ""}
            onChange={(val) => dispatch(setCommaSep(val as any))}
            options={commaOptionsObj}
            width="100%"
            sx={{ mt: 1, flex: 2 }}
          />
        </Grid>

        {/* Enable FX Correction */}
        <Grid size={{ xs: 12, md: 6 }} display="flex" alignItems="center">
          <Typography mr={"50px"}>Enable FX Correction in Reports</Typography>
          <ToggleSwitch
            label=""
            checked={enableFx}
            onChange={() => dispatch(setEnableFx(!enableFx))}
          />
        </Grid>

        {/* Header Customization */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="body1"> Header Customization </Typography>
          <Box display="flex" gap={2} mt={1}>
            <Checkbox
              label="Show Company Name"
              checked={showCompanyName}
              onChange={() => dispatch(toggleShowCompanyName())}
            />
            <Checkbox
              label="Show Header Image"
              checked={showHeaderImage}
              onChange={() => dispatch(toggleShowHeaderImage())}
            />
          </Box>
        </Grid>

        {/* Footer Customization */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="body1"> Footer Customization </Typography>
          <Box display="flex" gap={2} mt={1} flexWrap="wrap">
            <Checkbox
              label="Show Page Number"
              checked={showPageNumber}
              onChange={() => dispatch(toggleShowPageNumber())}
            />
            <Checkbox
              label="Show Generated By"
              checked={showGeneratedBy}
              onChange={() => dispatch(toggleShowGeneratedBy())}
            />
            <Checkbox
              label="Show Generated Date"
              checked={showGeneratedDate}
              onChange={() => dispatch(toggleShowGeneratedDate())}
            />
            <Checkbox
              label="Show Generated Time"
              checked={showGeneratedTime}
              onChange={() => dispatch(toggleShowGeneratedTime())}
            />
          </Box>

          {/* Footer Content */}
          <Typography variant="body2">Footer Content</Typography>
          <TextAreaField
            
            label="Footer content"
            value={localFooter} // <-- changed
            onChange={(v: string) => {setLocalFooter(v)}} // <-- changed
            rows={2}
            maxLength={footerMax}
            sx={{
              mt: 1,
              width: "100%",
              borderColor: !isFooterValid ? "red" : "inherit",
            }}
          />

          {!isFooterValid && (
            <FormHelperText error>
              Max {footerMax} characters allowed.
            </FormHelperText>
          )}

          <Typography
            variant="caption"
            color={!isFooterValid ? "error" : "textSecondary"}
          >
            {cleanedFooter.length} / {footerMax} characters
          </Typography>
        </Grid>
      </Grid>

      {/* Save Button */}
        <Box display={"flex"} justifyContent={"end"} gap={2}>
        <PrimaryButton variant="contained" onClick={handleSave}   disabled={!isFooterValid}>
          Save
        </PrimaryButton>
      </Box>

    </Box>
  );
}
