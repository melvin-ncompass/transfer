import { useMemo, useState } from "react";
import { ArrowBack, ArrowDownward, ArrowUpward, Delete, Edit } from "@mui/icons-material";
import {
  Box, Card, Divider, Grid, IconButton, Stack, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { RadioButton } from "../../../../../../components/atom/radio-button";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import { MonthYearPickerElement } from "../../../../../../components/atom/date-picker";
import { PrimaryButton } from "../../../../../../components/atom/button";
import {
  useCreateRevisedSalaryTemplateMutation,
  useDeleteRevisedSalaryTemplateMutation,
  useGetRevisedSalaryTemplateByIdQuery,
  useGetRevisedSalaryTemplatesQuery,
  useUpdateRevisedSalaryTemplateMutation,
  type RevisedSalaryTemplateRequest,
} from "../api/revision.api";
import type { Dayjs } from "dayjs";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { useGetPayScheduleQuery } from "../../../../salary/payrun/settings/PaySchedule/api/payschedule.api";
import { formatNumberByCommaSeparation } from "../../../../../../utils/numberFormatter";
import dayjs from "dayjs";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { useSnackbar } from "../../../../../../context/SnackbarContext";
import { useGetEarningsQuery } from "../../../../salary/structure/Earnings/api/earnings.api";
import { useGetDeductionsQuery } from "../../../../salary/structure/Deductions/api/deductions.api";
import {
  type EarningItem,
  type DeductionItem,
  EarningRepeater,
  DeductionsRepeater,
} from "../../../../salary/structure/SalaryTemplate/components/SalaryTemplateRepeaters";
import { useGetNextPayableQuery } from "../../../../salary/payrun/runpayroll/api/payrun.api";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const getChangeMeta = (current?: number, previous?: number) => {
  if (!current || !previous) return null;
  const diff = current - previous;
  const percent = Math.abs((diff / previous) * 100);
  return {
    percent: percent.toFixed(1),
    isIncrease: diff > 0,
    isDecrease: diff < 0,
  };
};

function SalaryRevision() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const boxHeight = "calc(45vh - 56px)";

  const [revisionType, setRevisionType] = useState<"percent" | "amount">("percent");
  const [revisionValue, setRevisionValue] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(null);
  const [payoutDate, setPayoutDate] = useState<Dayjs | null>(null);
  const [payoutManuallyChanged, setPayoutManuallyChanged] = useState(false);

  // Inline earning/deduction state (no modals, no overrides — matches EditSalaryRevision)
  const [earningItems, setEarningItems] = useState<EarningItem[]>([
    { earningComponent: null, calculationType: "--", monthlyAmount: 0, annualAmount: 0 },
  ]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([
    { deductionComponent: null, calculationType: "--", monthlyAmount: 0, annualAmount: 0 },
  ]);

  // Tracks whether inline items have been seeded from source data
  const [itemsSeeded, setItemsSeeded] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // -----------------------------------------
  // Queries & mutations
  // -----------------------------------------
  const { data: headerData } = useGetHeaderDataQuery();
  const { data: earningsData = [] } = useGetEarningsQuery();
  const { data: deductionsData = [] } = useGetDeductionsQuery();

  const { data: historyData, isLoading: historyLoading } =
    useGetRevisedSalaryTemplatesQuery(id ?? "", { skip: !id });
  const { data: nextPayableData } = useGetNextPayableQuery();

  const nextPayableMonth = nextPayableData?.payableDate
    ? dayjs(nextPayableData.payableDate).add(1, "month").startOf("month")
    : null;

  const latestHistoryItem = historyData?.data?.[0];
  const isRevised = !!latestHistoryItem?.revisedAnnualGross;

  const latestTemplateId = isRevised ? String(latestHistoryItem?.id) : undefined;
  const { data: latestDetailData, isLoading: latestDetailLoading } =
    useGetRevisedSalaryTemplateByIdQuery(
      { employeeId: id ?? "", templateId: latestTemplateId ?? "" },
      { skip: !id || !latestTemplateId }
    );

  const [createRevision, { isLoading: saving }] = useCreateRevisedSalaryTemplateMutation();
  const [updateRevision, { isLoading: updating }] = useUpdateRevisedSalaryTemplateMutation();
  const [deleteRevision, { isLoading: deleting }] = useDeleteRevisedSalaryTemplateMutation();

  const { data: payScheduleResponse } = useGetPayScheduleQuery(undefined, { skip: !open });

  const commaSeparation = (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

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
  // Derived data
  // -----------------------------------------
  const baseRecord = historyData?.data?.find((item: any) => item.initialTemplate);
  const templateName = baseRecord?.initialTemplate?.templateName ?? "—";
  const employeeInfo = historyData?.data?.[historyData?.data?.length - 1];
  const employeeId = employeeInfo?.employee?.employeeId || null;
  const firstPayrollFrom = (payScheduleResponse as any)?.data?.firstPayrollFrom
    ? dayjs((payScheduleResponse as any).data.firstPayrollFrom)
    : null;

  const previousGross = isRevised
    ? latestHistoryItem?.revisedAnnualGross
    : baseRecord?.annualGross ?? "—";

  const isLoading = historyLoading || latestDetailLoading;

  const fixedAllowanceId = (earningsData as any[]).find(
    (e) => e.earningName === "Fixed Allowance"
  )?.id;

  // -----------------------------------------
  // Seed inline items once source data is ready
  // -----------------------------------------
  const earningSource: any[] = isRevised
    ? latestDetailData?.data?.components?.filter((c: any) => c.earning) ?? []
    : baseRecord?.employeeEarnings ?? [];

  const deductionSource: any[] = isRevised
    ? latestDetailData?.data?.components?.filter((c: any) => c.deduction) ?? []
    : baseRecord?.employeeDeductions ?? [];

  const hasDeductions =
    deductionSource.length > 0 ||
    deductionItems.some((item) => !!item.deductionComponent);

  // Seed items from source when data arrives (only once, not on re-renders)
  useMemo(() => {
    if (itemsSeeded) return;
    if (!earningSource.length && !deductionSource.length) return;

    if (earningSource.length) {
      let seeded = earningSource.map((c: any) => ({
        earningComponent: String(c.earning?.id),
        calculationType: c.earning?.calculationType ?? "--",
        monthlyAmount: Number(c.monthlyAmount ?? 0),
        annualAmount: Number(c.monthlyAmount ?? 0) * 12,
      }));
      // Fixed Allowance first
      seeded = [
        ...seeded.filter((e) => Number(e.earningComponent) === Number(fixedAllowanceId)),
        ...seeded.filter((e) => Number(e.earningComponent) !== Number(fixedAllowanceId)),
      ];
      setEarningItems(seeded);
    }

    if (deductionSource.length) {
      const seeded = deductionSource.map((c: any) => ({
        deductionComponent: String(c.deduction?.id),
        calculationType: c.deduction?.calculationType ?? "--",
        monthlyAmount: Number(c.monthlyAmount ?? 0),
        annualAmount: Number(c.monthlyAmount ?? 0) * 12,
      }));
      setDeductionItems(seeded);
    }

    setItemsSeeded(true);
  }, [earningSource, deductionSource, fixedAllowanceId, itemsSeeded]);

  // -----------------------------------------
  // Gross calculations (same logic as before)
  // -----------------------------------------
  const baseGross =
    previousGross !== "—" ? parseFloat(String(previousGross)) : 0;

  const isPercentInvalid = revisionType === "percent" && parseFloat(revisionValue) > 100;

  const newAnnualGross =
    revisionValue && !isPercentInvalid
      ? revisionType === "percent"
        ? baseGross * (1 + parseFloat(revisionValue) / 100)
        : parseFloat(revisionValue)
      : baseGross;

  const newMonthlyGross = newAnnualGross / 12;
  const revisedAnnualGrossDisplay = newAnnualGross.toFixed(2);
  const revisedMonthlyGrossDisplay = newMonthlyGross.toFixed(2);

  // Fixed Allowance = monthlyGross - sum of all other earnings (matches EditSalaryRevision)
  const fixedAllowanceValue = useMemo(() => {
    if (!fixedAllowanceId) return 0;
    const otherSum = earningItems
      .filter((item) => Number(item.earningComponent) !== Number(fixedAllowanceId))
      .reduce((acc, item) => acc + item.monthlyAmount, 0);
    return Math.max(0, Math.round(newMonthlyGross) - otherSum);
  }, [newAnnualGross, baseGross, earningItems, fixedAllowanceId]);

  const totalOtherEarnings = earningItems
    .filter((item) => Number(item.earningComponent) !== Number(fixedAllowanceId))
    .reduce((acc, item) => acc + item.monthlyAmount, 0);

  const isGrossLowerThanComponents =
    Math.round(newMonthlyGross) < totalOtherEarnings;

  const displayEarningItems: EarningItem[] = useMemo(
    () =>
      earningItems.map((item) =>
        Number(item.earningComponent) === Number(fixedAllowanceId)
          ? { ...item, monthlyAmount: fixedAllowanceValue, annualAmount: fixedAllowanceValue * 12 }
          : item
      ),
    [earningItems, fixedAllowanceId, fixedAllowanceValue]
  );

  // -----------------------------------------
  // Validation
  // -----------------------------------------
  const missingFields: string[] = [];
  if (!revisionValue.trim()) missingFields.push(revisionType === "amount" ? "New Gross" : "Percentage");
  if (!effectiveDate) missingFields.push("Effective Date");
  if (!payoutDate) missingFields.push("Payout Month");

  const canSave =
    missingFields.length === 0 &&
    !isGrossLowerThanComponents;
  const tooltipTitle = !canSave ? (
    <Box>
      <Typography variant="caption">Required fields:</Typography>
      <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px" }}>
        {missingFields.map((field) => (
          <li key={field}>
            <Typography variant="caption">{field}</Typography>
          </li>
        ))}
      </ul>
    </Box>
  ) : "";

  // -----------------------------------------
  // History rows
  // -----------------------------------------
  const historyRows = useMemo(() => {
    const list = historyData?.data ?? [];
    const revisions = list.filter((item: any) => !item.initialTemplate);
    const earliestRevision = revisions.reduce((earliest: any, item: any) => {
      if (!earliest) return item;
      return dayjs(item.payoutDate).isBefore(dayjs(earliest.payoutDate)) ? item : earliest;
    }, null);

    return list.map((item: any, index: number) => {
      const isBase = !!item.initialTemplate;
      const basePayout = earliestRevision
        ? dayjs(earliestRevision.payoutDate).subtract(1, "month")
        : dayjs(item.employee?.dateOfJoining);
      const gross = isBase ? item.annualGross : item.revisedAnnualGross;
      const prevItem = list[index + 1];
      const previousGrossValue = prevItem ? prevItem.revisedAnnualGross ?? prevItem.annualGross : null;
      const change = getChangeMeta(gross, previousGrossValue);

      return {
        effectiveDate: isBase
          ? dayjs(item.employee?.dateOfJoining).format("MMM D, YYYY")
          : dayjs(item.effectiveDate).format("MMM D, YYYY"),
        payoutDate: isBase
          ? basePayout.format("MMM D, YYYY")
          : dayjs(item.payoutDate).format("MMM D, YYYY"),
        previousGross: isBase
          ? "-"
          : `${formatCurrency(item.previousAnnualGross ?? 0)}`,
        // : `₹${formatNumberByCommaSeparation(item.previousAnnualGross, commaSeparation).split(".")[0]}`,
        revisedGross: (
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
            {change && !isBase && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {change.isIncrease && <ArrowUpward sx={{ fontSize: 16, color: "success.main" }} />}
                {change.isDecrease && <ArrowDownward sx={{ fontSize: 16, color: "error.main" }} />}
                <Typography
                  variant="caption"
                  sx={{
                    color: change.isIncrease ? "success.main" : change.isDecrease ? "error.main" : "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  {change.percent}%
                </Typography>
              </Stack>
            )}
            <Typography>
              {formatCurrency(gross)}
            </Typography>
          </Stack>
        ),
        edit: (
          <Tooltip title={isBase ? "Base template cannot be edited" : ""} placement="top-start" disableHoverListener={!isBase}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/people/salary-template/revise/edit/${id}/${item.id}`)}
              disabled={isBase}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
        delete: (
          <Tooltip title={isBase ? "Base template cannot be deleted" : ""} placement="top-start" disableHoverListener={!isBase}>
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteConfirm(String(item.id))}
              disabled={isBase}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      };
    });
  }, [historyData]);

  // -----------------------------------------
  // Save
  // -----------------------------------------
  const handleSave = async () => {
    if (!id || !canSave) return;

    const annualGross =
      revisionType === "percent"
        ? (baseGross * (1 + Number(revisionValue) / 100)).toFixed(2)
        : revisionValue;

    const monthlyGross = (parseFloat(annualGross) / 12).toFixed(2);

    const earnings = displayEarningItems
      .filter((e) => !!e.earningComponent)
      .map((e, idx) => ({
        earningId: Number(e.earningComponent),
        monthlyAmount: String(Math.round(e.monthlyAmount)),
        payslipOrder: idx + 1,
      }));

    const deductions = deductionItems
      .filter((d) => !!d.deductionComponent)
      .map((d, idx) => ({
        deductionId: Number(d.deductionComponent),
        monthlyAmount: String(Math.round(d.monthlyAmount)),
        payslipOrder: idx + 1,
      }));

    const payload: RevisedSalaryTemplateRequest = {
      revisionType: revisionType === "percent" ? "percentage" : "amount",
      effectiveDate: effectiveDate ? effectiveDate.format("YYYY-MM-DD") : "",
      payoutDate: payoutDate ? payoutDate.format("YYYY-MM-DD") : "",
      revisedAnnualGross: annualGross,
      revisedMonthlyGross: monthlyGross,
      ...(revisionType === "percent" ? { reviseGrossPercent: revisionValue } : {}),
      earnings,
      deductions,
    };

    try {
      const res = await createRevision({ employeeId: id, data: payload }).unwrap();
      showSnackbar(res?.message ?? "Revision created successfully!", "success");
      setRevisionValue("");
      setEffectiveDate(null);
      setPayoutDate(null);
      setPayoutManuallyChanged(false);
      setItemsSeeded(false); // allow re-seed on next render
      navigate(`/people/directory/employee/${id}?Etab=3`);
    } catch (err: any) {
      showSnackbar(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to save revision.", "error");
    }
  };

  const handleDelete = async () => {
    if (!id || !deleteConfirm) return;
    try {
      const res = await deleteRevision({ employeeId: id, templateId: deleteConfirm }).unwrap();
      showSnackbar(res?.message ?? "Revision deleted successfully!", "success");
    } catch (err: any) {
      showSnackbar(err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete revision.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // -----------------------------------------
  // History table columns
  // -----------------------------------------
  const historyColumns: StandardTableColumn[] = [
    { id: "effectiveDate", label: "Effective Date" },
    { id: "payoutDate", label: "Payout Date" },
    { id: "previousGross", label: "Previous Gross", align: "right" },
    { id: "revisedGross", label: "Revised Gross", align: "right" },
    { id: "edit", label: "", align: "center" },
    { id: "delete", label: "", align: "center" },
  ];

  return (
    <>
      {/* Delete confirmation dialog */}
      <ModalElement
        open={!!deleteConfirm}
        title="Delete Revision"
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
      >
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete this salary revision? This action cannot be undone.
        </Typography>
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <PrimaryButton variant="outlined" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
            Cancel
          </PrimaryButton>
          <PrimaryButton color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </PrimaryButton>
        </Box>
      </ModalElement>

      {/* ── Main card ───────────────────────────────────────────────────────── */}
      <Card
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "100%",
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
              onClick={() => navigate(`/people/directory/employee/${id}?tab=3&Etab=3`)}
              size="small"
              sx={{ bgcolor: "white", border: "1px solid", borderColor: "grey.300", "&:hover": { bgcolor: "grey.100" } }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight={600}>Salary Revision</Typography>
              <Typography variant="caption" color="text.secondary">Emp Id: {employeeId ?? "—"}</Typography>
            </Box>
          </Stack>
        </Box>

        <Box overflow="scroll" p={2.5}>
          {/* Template data */}
          <Box width="100%" p={1}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Stack>
                  <Typography variant="subtitle2">Template Name</Typography>
                  <Typography variant="body1">{isLoading ? "Loading…" : templateName}</Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Stack direction="column" alignItems="flex-end">
                  <Typography variant="subtitle2">Previous Gross</Typography>
                  <Typography variant="body1">
                    {isLoading
                      ? "Loading…"
                      : `${formatCurrency(previousGross)}`}
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Stack direction="column" alignItems="flex-end">
                  <Typography variant="subtitle2">
                    {isRevised ? "Previous Monthly Salary" : "Monthly Salary"}
                  </Typography>
                  <Typography variant="body1">
                    {isLoading
                      ? "Loading…"
                      : `${formatCurrency(previousGross !== "—" ? Number(previousGross) / 12 : 0)}`}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

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
                onChange={(e) => {
                  setRevisionType(e.target.value as "percent" | "amount");
                  setRevisionValue("");
                }}
              />
              <RadioButton
                label="Revise with a new Gross Value"
                value="amount"
                checked={revisionType === "amount"}
                onChange={(e) => {
                  setRevisionType(e.target.value as "percent" | "amount");
                  setRevisionValue("");
                }}
              />
            </Stack>
            <TextFieldElement
              label={revisionType === "amount" ? "New Gross" : "Enter Percentage"}
              value={
                revisionType === "amount"
                  ? revisionValue
                    ? formatCurrency(revisionValue)
                    : ""
                  : revisionValue
              }
              onChange={(e) => {
                if (revisionType === "amount") {
                  const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                  setRevisionValue(raw);
                } else {
                  setRevisionValue(e.target.value);
                }
              }}
              error={
                (revisionType === "percent" && parseFloat(revisionValue) > 100) ||
                isGrossLowerThanComponents
              }
              helperText={
                revisionType === "percent" && parseFloat(revisionValue) > 100
                  ? "Gross by Percent cannot exceed 100"
                  : isGrossLowerThanComponents
                    ? "Revised gross cannot be lower than total fixed Allowance"
                    : ""
              }
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Stack>

          {revisionValue && (
            <Box px={1} pb={1}>
              <Typography variant="caption" color="text.secondary">
                Revised Annual Gross: 
                {formatCurrency(revisedAnnualGrossDisplay)}
                &nbsp;|&nbsp; Monthly: 
                {formatCurrency(revisedMonthlyGrossDisplay)}
              </Typography>
            </Box>
          )}

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
                items={displayEarningItems}
                setItems={setEarningItems}
                earningsData={earningsData}
                fixedAllowance={Number(fixedAllowanceId)}
                annualGross={newAnnualGross || baseGross}
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
          <Box p={1} mt={1}>
            <Typography variant="subtitle2" mb={1}>Payout Preferences</Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 5 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Stack direction="column" spacing={0.5}>
                <Typography variant="body2">Revised Salary Effective From</Typography>
                <MonthYearPickerElement
                  width={250}
                  value={effectiveDate}
                  onChange={(val: Dayjs | null) => {
                    setEffectiveDate(val);
                    if (!payoutManuallyChanged) setPayoutDate(val);
                  }}
                  min={nextPayableMonth ?? firstPayrollFrom}
                />
              </Stack>
              <Stack direction="column" spacing={0.5}>
                <Typography variant="body2">Payout Month</Typography>
                <MonthYearPickerElement
                  width={250}
                  value={payoutDate}
                  onChange={(val: Dayjs | null) => {
                    setPayoutDate(val);
                    setPayoutManuallyChanged(true);
                  }}
                  min={nextPayableMonth ?? firstPayrollFrom}
                />
              </Stack>
            </Stack>
          </Box>

          {/* Save */}
          <Box width="100%" display="flex" justifyContent="end" alignItems="center" p={1}>
            <Tooltip title={tooltipTitle} placement="top">
              <PrimaryButton
                onClick={handleSave}
                disabled={
                  saving || updating || !canSave ||
                  isPercentInvalid
                }
              >
                {saving || updating ? "Saving…" : "Save"}
              </PrimaryButton>
            </Tooltip>
          </Box>

          {/* Revision History */}
          {isRevised && (
            <>
              <Typography variant="subtitle2" p={1}>Revision History</Typography>
              <Box p={1} width="100%" overflow="scroll">
                <StandardTable
                  columns={historyColumns}
                  rows={historyLoading ? [] : historyRows}
                />
              </Box>
            </>
          )}
        </Box>
      </Card>
    </>
  );
}

export default SalaryRevision;