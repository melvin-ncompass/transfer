import { ArrowBack } from "@mui/icons-material";
import {
  Box,
  Card,
  IconButton,
  Stack,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { RadioButton } from "../../../../../../components/atom/radio-button";
import { useEffect, useState, useRef, useMemo } from "react";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { MonthYearPickerElement } from "../../../../../../components/atom/date-picker";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { useGetDeductionsQuery } from "../../../../salary/structure/Deductions/api/deductions.api";
import { useGetEarningsQuery } from "../../../../salary/structure/Earnings/api/earnings.api";
import {
  type EarningItem,
  type DeductionItem,
  EarningRepeater,
  DeductionsRepeater,
} from "../../../../salary/structure/SalaryTemplate/components/SalaryTemplateRepeaters";
import { Grid } from "@mui/system";
import {
  useGetRevisedSalaryTemplateByIdQuery,
  useGetRevisedSalaryTemplatesQuery,
  useUpdateRevisedSalaryTemplateMutation,
} from "../api/revision.api";
import dayjs, { type Dayjs } from "dayjs";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { useGetPayScheduleQuery } from "../../../../salary/payrun/settings/PaySchedule/api/payschedule.api";
import { formatNumberByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { useSnackbar } from "../../../../../../context/SnackbarContext";

function EditSalaryRevision() {
  const navigate = useNavigate();
  const { id, templateId } = useParams();
  const theme = useTheme();
  const boxHeight = "calc(45vh - 56px)";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { showSnackbar } = useSnackbar();
  const { data: headerData } = useGetHeaderDataQuery();
  const { data: earningsData = [] } = useGetEarningsQuery();
  const { data: deductionsData = [] } = useGetDeductionsQuery();

  const { data: historyData, isLoading: isHistoryLoading } = useGetRevisedSalaryTemplatesQuery(id ?? "", { skip: !id });

  const { data: revisedByIdData, isLoading: isRevisionLoading } = useGetRevisedSalaryTemplateByIdQuery(
    { employeeId: id!, templateId: templateId! },
    { skip: !id || !templateId }
  );

  const template = revisedByIdData?.data;
  const isRevised = !!template?.revisedAnnualGross;
  const isLoading = isHistoryLoading || isRevisionLoading;

  const [updateRevision, { isLoading: isSaving }] = useUpdateRevisedSalaryTemplateMutation();

  const { data: payScheduleResponse } = useGetPayScheduleQuery(undefined, { skip: !open });

  const currentRevision = historyData?.data?.find(
    (item: any) => String(item.id) === templateId
  );
  const baseRecord = historyData?.data?.find((item: any) => item.initialTemplate);
  const templateName = baseRecord?.initialTemplate?.templateName ?? "—";
  const employeeInfo = historyData?.data?.[historyData.data.length - 1];
  const employeeId = employeeInfo?.employee?.employeeId || null;
  const firstPayrollFrom = (payScheduleResponse as any)?.data?.firstPayrollFrom
    ? dayjs((payScheduleResponse as any).data.firstPayrollFrom)
    : null;
  const fixedAllowanceId = earningsData.find(
    (e) => e.earningName === "Fixed Allowance"
  )?.id;

  // -----------------------------------------
  // Form state
  // -----------------------------------------
  const [revisionType, setRevisionType] = useState<"percent" | "amount">("percent");
  const [grossValue, setGrossValue] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(null);
  const [payoutDate, setPayoutDate] = useState<Dayjs | null>(null);
  const [earningItems, setEarningItems] = useState<EarningItem[]>([
    { earningComponent: null, calculationType: "--", monthlyAmount: 0, annualAmount: 0 },
  ]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([
    { deductionComponent: null, calculationType: "--", monthlyAmount: 0, annualAmount: 0 },
  ]);
  const hasDeductions = deductionItems.some((item) => !!item.deductionComponent);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  // -----------------------------------------
  // Dirty state tracking
  // -----------------------------------------
  const initialSnapshot = useRef<string>("");

  const getCurrentSnapshot = () =>
    JSON.stringify({
      revisionType,
      grossValue,
      effectiveDate: effectiveDate?.format("YYYY-MM-DD") ?? "",
      payoutDate: payoutDate?.format("YYYY-MM-DD") ?? "",
      earningItems,
      deductionItems,
    });

  const isDirty = initialSnapshot.current !== "" && getCurrentSnapshot() !== initialSnapshot.current;
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const formatCurrency = (value: number | string) => {
    const num = Number(value || 0);
    const abs = Math.abs(num);

    const formatted = formatNumberByCommaSeparation(
      abs,
      commaSeparation
    ).split(".")[0];

    return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  // -----------------------------------------
  // Prefill
  // -----------------------------------------
  useEffect(() => {
    if (!template) return;

    const type = template.revisionType === "amount" ? "amount" : "percent";
    const value =
      template.revisionType === "amount"
        ? template.revisedAnnualGross ?? ""
        : template.reviseGrossPercent ?? "";
    const effDate = template.effectiveDate ? dayjs(template.effectiveDate) : null;
    const payDate = template.payoutDate ? dayjs(template.payoutDate) : null;

    setRevisionType(type);
    setGrossValue(value);
    if (effDate) setEffectiveDate(effDate);
    if (payDate) setPayoutDate(payDate);

    let earnings: EarningItem[] = [
      { earningComponent: null, calculationType: "--", monthlyAmount: 0, annualAmount: 0 },
    ];
    let deductions: DeductionItem[] = [
      { deductionComponent: null, calculationType: "--", monthlyAmount: 0, annualAmount: 0 },
    ];

    if (template.components?.length) {
      const mappedEarnings = template.components
        .filter((c: any) => c.compType === "earning" && !!c.earning)
        .map((c: any) => ({
          earningComponent: String(c.earning.id),
          calculationType: c.earning.calculationType ?? "--",
          monthlyAmount: Number(c.monthlyAmount),
          annualAmount: Number(c.monthlyAmount) * 12,
        }));
      if (mappedEarnings.length) earnings = mappedEarnings;

      const mappedDeductions = template.components
        .filter((c: any) => c.compType === "deduction" && !!c.deduction)
        .map((c: any) => ({
          deductionComponent: String(c.deduction.id),
          calculationType: c.deduction.calculationType ?? "--",
          monthlyAmount: Number(c.monthlyAmount),
          annualAmount: Number(c.monthlyAmount) * 12,
        }));
      if (mappedDeductions.length) deductions = mappedDeductions;
    } else {
      const baseRec = historyData?.data?.find((item: any) => item.initialTemplate);

      if (baseRec?.employeeEarnings?.length) {
        earnings = baseRec.employeeEarnings.map((e: any) => ({
          earningComponent: String(e.earning.id),
          calculationType: e.earning.calculationType ?? "--",
          monthlyAmount: Number(e.monthlyAmount),
          annualAmount: Number(e.monthlyAmount) * 12,
        }));
      }

      if (baseRec?.employeeDeductions?.length) {
        deductions = baseRec.employeeDeductions.map((d: any) => ({
          deductionComponent: String(d.deduction.id),
          calculationType: d.deduction.calculationType ?? "--",
          monthlyAmount: Number(d.monthlyAmount),
          annualAmount: Number(d.monthlyAmount) * 12,
        }));
      }
    }
    earnings = [
      ...earnings.filter((e) => Number(e.earningComponent) === Number(fixedAllowanceId)),
      ...earnings.filter((e) => Number(e.earningComponent) !== Number(fixedAllowanceId)),
    ];

    setEarningItems(earnings);
    setDeductionItems(deductions);

    setTimeout(() => {
      initialSnapshot.current = JSON.stringify({
        revisionType: type,
        grossValue: value,
        effectiveDate: effDate?.format("YYYY-MM-DD") ?? "",
        payoutDate: payDate?.format("YYYY-MM-DD") ?? "",
        earningItems: earnings,
        deductionItems: deductions,
      });
    }, 0);
  }, [template, historyData, fixedAllowanceId]);

  // -----------------------------------------
  // Derived values
  // -----------------------------------------
  const previousAnnualGross = currentRevision?.previousAnnualGross
    ?? baseRecord?.annualGross;

  const previousMonthlyGross = previousAnnualGross
    ? (Number(previousAnnualGross) / 12).toFixed(2)
    : baseRecord?.monthlyGross;

  const revisedAnnualGross =
    revisionType === "percent"
      ? (Number(previousAnnualGross ?? 0) * (1 + Number(grossValue) / 100)).toFixed(2)
      : grossValue;

  const revisedMonthlyGross = (Number(revisedAnnualGross) / 12).toFixed(2);

  const baseAnnualGross = Number(previousAnnualGross ?? 0);

  const newAnnualGross =
    revisionType === "percent"
      ? baseAnnualGross * (1 + Number(grossValue) / 100)
      : Number(grossValue);

  const fixedAllowanceValue = useMemo(() => {
    if (!fixedAllowanceId) return 0;

    const newMonthlyGross = newAnnualGross ? newAnnualGross / 12 : baseAnnualGross / 12;

    const otherEarningsSum = earningItems
      .filter((item) => Number(item.earningComponent) !== Number(fixedAllowanceId))
      .reduce((acc, item) => acc + item.monthlyAmount, 0);

    return Math.max(0, Math.round(newMonthlyGross) - otherEarningsSum);
  }, [newAnnualGross, baseAnnualGross, earningItems, fixedAllowanceId]);

  const totalOtherEarnings = earningItems
    .filter((item) => Number(item.earningComponent) !== Number(fixedAllowanceId))
    .reduce((acc, item) => acc + item.monthlyAmount, 0);

  const isGrossLowerThanComponents =
    Math.round(Number(revisedMonthlyGross)) < totalOtherEarnings;

  const displayItems = useMemo(() => earningItems.map((item) =>
    Number(item.earningComponent) === Number(fixedAllowanceId)
      ? {
        ...item,
        monthlyAmount: fixedAllowanceValue,
        annualAmount: fixedAllowanceValue * 12,
      }
      : item,
  ), [earningItems, fixedAllowanceId, fixedAllowanceValue]);
  // -----------------------------------------
  // Save
  // -----------------------------------------
  const handleSave = async () => {
    if (!id || !templateId) return;

    const earnings = displayItems
      .filter((e) => !!e.earningComponent)
      .map((e, idx) => ({
        earningId: Number(e.earningComponent),
        monthlyAmount: String(e.monthlyAmount),
        payslipOrder: idx + 1,
      }));

    const deductions = deductionItems
      .filter((d) => !!d.deductionComponent)
      .map((d, idx) => ({
        deductionId: Number(d.deductionComponent),
        monthlyAmount: String(d.monthlyAmount),
        payslipOrder: idx + 1,
      }));

    const payload = {
      revisionType: revisionType === "percent" ? "percentage" as const : "amount" as const,
      revisedAnnualGross,
      revisedMonthlyGross,
      ...(revisionType === "percent" && { reviseGrossPercent: grossValue }),
      effectiveDate: effectiveDate?.format("YYYY-MM-DD") ?? "",
      payoutDate: payoutDate?.format("YYYY-MM-DD") ?? "",
      earnings,
      deductions,
    };

    try {
      const res = await updateRevision({
        employeeId: id,
        templateId: String(templateId),
        data: payload,
      }).unwrap();
      showSnackbar(res?.message ?? "Salary revised successfully!", "success");

      // Update snapshot so save becomes inactive again after successful save
      initialSnapshot.current = getCurrentSnapshot();
      navigate(-1);
    } catch (err: any) {
      showSnackbar(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to update revision.", "error");
    }
  };

  if (isLoading) return <Box p={3}><Typography>Loading...</Typography></Box>;

  return (
    <>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />
      )}

      <Card
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
            p: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                bgcolor: "white",
                border: "1px solid",
                borderColor: "grey.300",
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Edit Salary Revision
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Emp Id: {employeeId}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box overflow="scroll" p={2.5}>
          <Box>
            {/* Template data */}
            <Box width="100%" p={1}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack>
                    <Typography variant="subtitle2">Template Name</Typography>
                    <Typography variant="body1">{templateName}</Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack direction='column' alignItems='flex-end'>
                    <Typography variant="subtitle2">Previous Gross</Typography>
                    <Typography variant="body1">
                      {formatCurrency(previousAnnualGross)}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack direction='column' alignItems='flex-end'>
                    <Typography variant="subtitle2">
                      {isRevised ? "Previous Monthly Salary" : "Monthly Salary"}
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(previousMonthlyGross)}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {/* Revision type */}
            <Stack
              direction={{ sm: "column", md: "row" }}
              spacing={2}
              alignItems={{ sm: "flex-start", md: "center" }}
              p={1}
              gap={1}
            >
              <Typography variant="subtitle2">Select Revision Type</Typography>
              <Stack direction="row" spacing={2}>
                <RadioButton
                  label="Revise Gross by Percentage"
                  value="percent"
                  checked={revisionType === "percent"}
                  onChange={(e) => setRevisionType(e.target.value as "percent" | "amount")}
                />
                <RadioButton
                  label="Revise with a new Gross Value"
                  value="amount"
                  checked={revisionType === "amount"}
                  onChange={(e) => setRevisionType(e.target.value as "percent" | "amount")}
                />
              </Stack>

              <TextFieldElement
                label={revisionType === "amount" ? "New Gross" : "Enter Percentage"}
                value={
                  revisionType === "amount"
                    ? grossValue
                      ? formatCurrency(grossValue)
                      : ""
                    : grossValue
                }
                onChange={(e) => {
                  let raw = "";
                  if (revisionType === "amount") {
                    raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                  } else {
                    raw = e.target.value;
                  }
                  setGrossValue(raw);
                }}
                error={
                  (revisionType === "percent" && parseFloat(grossValue) > 100) ||
                  isGrossLowerThanComponents
                }
                helperText={
                  revisionType === "percent" && parseFloat(grossValue) > 100
                    ? "Gross by Percent cannot exceed 100"
                    : isGrossLowerThanComponents
                      ? "Revised gross cannot be lower than total fixed earning components"
                      : ""
                }
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Stack>

            {/* Revised preview */}
            {grossValue && (
              <Box px={1} pb={1}>
                <Typography variant="caption" color="text.secondary">
                  Revised Annual Gross: {formatCurrency(revisedAnnualGross)}
                  &nbsp;|&nbsp;
                  Monthly: {formatCurrency(revisedMonthlyGross)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Earnings & Deductions */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              px: 1,
              overflow: "hidden",
            }}
          >
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: boxHeight }}>
              <EarningRepeater
                items={displayItems}
                setItems={setEarningItems}
                earningsData={earningsData}
                fixedAllowance={Number(fixedAllowanceId)}
                annualGross={newAnnualGross || baseAnnualGross}
                width="100%"
                height="100%"
              />
            </Box>

            {hasDeductions && (
              <>
                <Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />

                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: boxHeight }}>
                  <DeductionsRepeater
                    items={deductionItems}
                    setItems={setDeductionItems}
                    deductionsData={deductionsData}
                    width="100%"
                    height="100%"
                  />
                </Box>
              </>
            )}
          </Box>

          {/* Payout Preferences */}
          <Box p={1}>
            <Typography variant="subtitle2" mb={1}>Payout Preferences</Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 5 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Stack direction="column" spacing={0.5}>
                <Typography variant="body2">Revised Salary Effective From</Typography>
                <MonthYearPickerElement
                  width={200}
                  value={effectiveDate}
                  onChange={setEffectiveDate}
                  min={firstPayrollFrom}
                />
              </Stack>
              <Stack direction="column" spacing={0.5}>
                <Typography variant="body2">Payout Month</Typography>
                <MonthYearPickerElement
                  width={200}
                  value={payoutDate}
                  onChange={setPayoutDate}
                  min={firstPayrollFrom}
                />
              </Stack>
            </Stack>
          </Box>

          {/* Save */}
          <Box display="flex" justifyContent="end" p={1}>
            <Tooltip title={!isDirty ? "No changes to save" : ""} placement="top-start">
              <PrimaryButton
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !isDirty ||
                  isGrossLowerThanComponents
                }
              >
                {isSaving ? "Saving..." : "Save"}
              </PrimaryButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>
    </>
  );
}

export default EditSalaryRevision;