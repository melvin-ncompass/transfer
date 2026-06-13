import {
  Box,
  Stack,
  InputAdornment,
  Typography,
  Card,
  Divider,
  IconButton,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { useGetEarningsQuery } from "../../Earnings/api/earnings.api";
import { useGetDeductionsQuery } from "../../Deductions/api/deductions.api";
import {
  useCreateSalaryTemplateMutation,
  useGetSalaryTemplateByIdQuery,
  useUpdateSalaryTemplateMutation,
  type SalaryTemplateRequest,
} from "../api/salaryTemplate.api";
import {
  EarningRepeater,
  DeductionsRepeater,
  type EarningItem,
  type DeductionItem,
} from "./SalaryTemplateRepeaters";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import {
  formatNumberByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../../../utils/numberFormatter";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { AnalyticsBarLoader } from "../../../../../../components/atom/circular-progress/AnimatedBarChart";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useSnackbar } from "../../../../../../context/SnackbarContext";

interface EditSalaryTemplateModalProps {
  //   data?: any;
  duplicate?: boolean;
  onSuccess?: (data: string) => void;
  onError?: (data: string) => void;
  setCurrentTab?: (tab: number) => void;
}

function EditSalaryTemplateModal({
  // Track if fixed allowance is negative
  duplicate = window.location.pathname.includes("duplicate"),
  onSuccess,
  onError,
  setCurrentTab,
}: EditSalaryTemplateModalProps) {
  const tabParam = useParams();
  const navigate = useNavigate();

  const [fixedAllowanceNegative, setFixedAllowanceNegative] = useState(false);
  const [data, setData] = useState<any>();
  const { data: salaryData, isLoading } = useGetSalaryTemplateByIdQuery(
    tabParam?.id!.toString(),
    { skip: !tabParam },
  );

  // API queries
  const { data: earningsData = [] } = useGetEarningsQuery();
  const { data: deductionsData = [] } = useGetDeductionsQuery();

  const earningOptions = earningsData
    .filter((e) => e.isActive)
    .map((e) => ({ label: e.earningName, value: String(e.id) }));

  const deductionOptions = deductionsData
    .filter((d) => d.isActive)
    .map((d) => ({ label: d.deductionName, value: String(d.id) }));
  const { showSnackbar } = useSnackbar();
  const [createTemplate] = useCreateSalaryTemplateMutation();
  const [updateTemplate] = useUpdateSalaryTemplateMutation();
  const { data: headerData } = useGetHeaderDataQuery();
  const currency = headerData?.data.reportingCurrency?.split(" - ")[0];
  const commaseperation =
    headerData?.data.commaSeparation === "IN" ? "IN" : "US";

  // Form state
  const [templateName, setTemplateName] = useState(
    window.location.pathname.includes("duplicate")
      ? ""
      : data?.templateName || "",
  );
  const [templateDescription, setTemplateDescription] = useState(
    data?.description || "",
  );
  const [annualGross, setAnnualGross] = useState<number>(
    Number(data?.annualGross) || 0,
  );

  const originalRef = useRef<{
    templateName: string;
    templateDescription: string;
    annualGross: number;
    earningItems: EarningItem[];
    deductionItems: DeductionItem[];
  } | null>(null);

  // Monthly gross
  const monthlyGross = useMemo(() => annualGross / 12, [annualGross]);

  // FIX 1 (part A): Fixed Allowance id resolved early so it can be used in mappedEarnings
  // Note: earningsData may be empty on first render; the useEffect handles the real init.
  // This memo is only used as the initial useState value before salaryData loads.
  const fixedAllowanceId =
    earningsData.find((earning) => earning.earningName === "Fixed Allowance")
      ?.id !== undefined
      ? Number(
          earningsData.find(
            (earning) => earning.earningName === "Fixed Allowance",
          )?.id,
        )
      : undefined;

  // Helper: given a raw earnings array from API, ensure a Fixed Allowance row is present.
  // If the template doesn't include FA, we insert a static row with monthlyAmount = 0
  // so that the fixedAllowanceValue memo can display and track it correctly.
  const ensureFixedAllowanceRow = (
    earnings: EarningItem[],
    faId: number | undefined,
  ): EarningItem[] => {
    if (faId === undefined) return earnings;
    const alreadyHasFA = earnings.some(
      (item) => Number(item.earningComponent) === faId,
    );
    if (alreadyHasFA) return earnings;
    return [
      ...earnings,
      {
        earningComponent: String(faId),
        calculationType: "--",
        monthlyAmount: 0,
        annualAmount: 0,
      },
    ];
  };

  // Initial mapped earnings & deductions
  const mappedEarnings: EarningItem[] = useMemo(() => {
    if (!data?.earnings)
      return [
        {
          earningComponent: null,
          calculationType: "--",
          monthlyAmount: 0,
          annualAmount: 0,
        },
      ];

    const earnings = data.earnings.map((e: any) => ({
      earningComponent: String(e.earning.id),
      calculationType: e.earning.calculationType || "--",
      monthlyAmount: Number(e.monthlyAmount || 0),
      annualAmount: Number(e.monthlyAmount || 0) * 12,
    }));

    // FIX 1 (part B): ensure FA row exists even if template didn't have it
    return ensureFixedAllowanceRow(earnings, fixedAllowanceId);
  }, [data, earningsData]);

  const mappedDeductions: DeductionItem[] = useMemo(() => {
    if (!data?.deductions)
      return [];
    return data.deductions.map((d: any) => ({
      deductionComponent: String(d.deduction.id),
      calculationType: d.deduction.calculationType || "--",
      monthlyAmount: Number(d.monthlyAmount || 0),
      annualAmount: Number(d.monthlyAmount || 0) * 12,
    }));
  }, [data]);

  const [earningItems, setEarningItems] =
    useState<EarningItem[]>(mappedEarnings);
  const [deductionItems, setDeductionItems] =
    useState<DeductionItem[]>(mappedDeductions);

  // Fixed Allowance logic (same as SalaryTemplateModal)
  const fixedAllowanceValue = useMemo(() => {
    if (fixedAllowanceId === undefined) return 0;
    console.log(earningItems);
    const otherEarningsSum = earningItems
      .filter((item) => Number(item.earningComponent) !== fixedAllowanceId)
      .reduce((acc, item) => acc + item.monthlyAmount, 0);

    const deductionsSum = deductionItems.reduce(
      (acc, item) => acc + item.monthlyAmount,
      0,
    );

    const monthlyGross = Math.round(annualGross / 12);
    const val = monthlyGross - otherEarningsSum;
    console.log(annualGross / 12, Math.round(annualGross / 12));
    setFixedAllowanceNegative(val < 0);
    return val;
  }, [annualGross, earningItems, deductionItems, fixedAllowanceId]);

  const displayItems = earningItems.map((item) =>
    Number(item.earningComponent) === fixedAllowanceId
      ? {
          ...item,
          monthlyAmount: fixedAllowanceValue,
          annualAmount: fixedAllowanceValue * 12,
        }
      : item,
  );

  // Fixed allowance value from earningItems
  const fixedAllowance =
    earningItems.find(
      (item) => Number(item.earningComponent) === fixedAllowanceId,
    )?.monthlyAmount || 0;

  // HRA without basic check
  const isHraWithoutBasic = useMemo(() => {
    const hasHra = earningItems.some((i) => {
      const e = earningsData.find((e) => String(e.id) === i.earningComponent);
      return e?.earningName === "House and Rent Allowance";
    });
    const hasBasic = earningItems.some((i) => {
      const e = earningsData.find((e) => String(e.id) === i.earningComponent);
      return e?.earningName === "Basic Pay";
    });
    return hasHra && !hasBasic;
  }, [earningItems, earningsData]);

  const hasIncompleteRows = useMemo(() => {
    const isActiveEarningRow = (item: EarningItem) =>
      item.earningComponent !== null || item.monthlyAmount > 0;

    const isActiveDeductionRow = (item: DeductionItem) =>
      item.deductionComponent !== null || item.monthlyAmount > 0;

    const incompleteEarnings = earningItems.some(
      (item) =>
        isActiveEarningRow(item) &&
        (item.earningComponent === null ||
          item.earningComponent === "" ||
          // FIX 1 (part C): FA row is allowed to have 0 — it's computed, not user-entered
          (item.monthlyAmount <= 0 &&
            Number(item.earningComponent) !== fixedAllowanceId)),
    );

    const incompleteDeductions = deductionItems.some(
      (item) =>
        isActiveDeductionRow(item) &&
        (item.deductionComponent === null ||
          item.deductionComponent === "" ||
          item.monthlyAmount <= 0),
    );

    return incompleteEarnings || incompleteDeductions;
  }, [earningItems, deductionItems, fixedAllowanceId]);

  const trimmedTemplateName = templateName.trim();
  const trimmedTemplateDescription = templateDescription.trim();
  const hasValidName =
    trimmedTemplateName.length > 0 && trimmedTemplateName.length <= 256;
  const hasValidDescription = trimmedTemplateDescription.length <= 256;
  const hasValidGross = annualGross > 0;
  const hasRows =
    displayItems.some((item) => item.earningComponent !== null) ||
    deductionItems.some((item) => item.deductionComponent !== null);
  const isFormValid =
    hasValidName &&
    hasValidDescription &&
    hasValidGross &&
    !fixedAllowanceNegative &&
    !isHraWithoutBasic &&
    !hasIncompleteRows &&
    hasRows;

  const hasChanges = useMemo(() => {
    const orig = originalRef.current;
    if (!orig) return false; // data not loaded yet

    // Text field changes
    if (templateName !== orig.templateName) return true;
    if (templateDescription !== orig.templateDescription) return true;
    if (annualGross !== orig.annualGross) return true;

    const validEarnings = earningItems.filter(
      (i) => i.earningComponent !== null,
    );
    const origValidEarnings = orig.earningItems.filter(
      (i) => i.earningComponent !== null,
    );
    if (validEarnings.length !== origValidEarnings.length) return true;
    const earningsChanged = validEarnings.some((item, idx) => {
      const o = origValidEarnings[idx];
      return (
        item.earningComponent !== o.earningComponent ||
        item.monthlyAmount !== o.monthlyAmount
      );
    });
    if (earningsChanged) return true;

    const validDeductions = deductionItems.filter(
      (i) => i.deductionComponent !== null,
    );
    const origValidDeductions = orig.deductionItems.filter(
      (i) => i.deductionComponent !== null,
    );
    if (validDeductions.length !== origValidDeductions.length) return true;
    const deductionsChanged = validDeductions.some((item, idx) => {
      const o = origValidDeductions[idx];
      return (
        item.deductionComponent !== o.deductionComponent ||
        item.monthlyAmount !== o.monthlyAmount
      );
    });
    if (deductionsChanged) return true;

    return false;
  }, [templateName, templateDescription, annualGross, earningItems, deductionItems]);

  // ------------------- Payload Submit -------------------
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isButtonDisabled = duplicate
    ? !isFormValid || isSubmitting
    : !hasChanges || !isFormValid || isSubmitting;

  // FIX 2: Added missing `!hasValidDescription` tooltip case
  const tooltipMessage = isSubmitting
    ? "Saving..."
    : !hasValidName
      ? trimmedTemplateName.length === 0
        ? "Template Name is required"
        : "Template Name must be at most 256 characters"
      : !hasValidDescription
        ? "Template Description must be at most 256 characters"
        : !hasValidGross
          ? "Gross must be greater than zero"
          : !hasRows
            ? "At least one earning or deduction row is required"
            : fixedAllowanceNegative
              ? "Fixed Allowance cannot be negative"
              : isHraWithoutBasic
                ? "HRA without Basic Pay is not allowed"
                : hasIncompleteRows
                  ? "All rows must have a component and monthly amount greater than zero"
                  : !duplicate && !hasChanges // ← only check hasChanges for edit mode
                    ? "No changes to save"
                    : "";

  const handleSubmit = async () => {
    if (!trimmedTemplateName) {
      showSnack("Template Name is required", "error");
      return;
    }

    if (!hasValidName) {
      showSnack("Template Name must be at most 256 characters", "error");
      return;
    }

    if (!hasValidDescription) {
      showSnack("Template Description must be at most 256 characters", "error");
      return;
    }

    if (!hasValidGross) {
      showSnack("Gross must be greater than zero", "error");
      return;
    }

    if (!hasRows) {
      showSnack("At least one earning or deduction row is required", "error");
      return;
    }

    if (fixedAllowanceNegative) {
      showSnack("Fixed Allowance cannot be negative", "error");
      return;
    }

    const earningsToSend = displayItems.filter(
      (item) =>
        !(
          Number(item.earningComponent) === fixedAllowanceId &&
          item.monthlyAmount === 0
        ),
    );
    const payload: SalaryTemplateRequest = {
      templateName: trimmedTemplateName,
      description: trimmedTemplateDescription,
      monthlyGross: Math.round(monthlyGross).toString(),
      annualGross: Math.round(annualGross).toString(),
      earnings: earningsToSend.map((item, index) => ({
        earningId: Number(item.earningComponent!),
        monthlyAmount: String(item.monthlyAmount),
        payslipOrder: index + 1,
      })),
      deductions: deductionItems.map((item, index) => ({
        deductionId: Number(item.deductionComponent!),
        monthlyAmount: String(item.monthlyAmount),
        payslipOrder: index + 1,
      })),
    };

    setIsSubmitting(true);
    try {
      if (data && !duplicate) {
        await updateTemplate({ id: data.id, data: payload }).unwrap();
        showSnackbar("Template updated successfully", "success");
      } else {
        await createTemplate(payload).unwrap();
        showSnackbar("Template created successfully", "success");
      }
      setTemplateDescription("");
      setTemplateName("");
      setEarningItems([
        {
          earningComponent: null,
          calculationType: "--",
          monthlyAmount: 0,
          annualAmount: 0,
        },
      ]);
      setDeductionItems([]);
      setCurrentTab && setCurrentTab(72);
      navigate(-1);
    } catch (error: any) {
      const message =
        error?.data?.message ?? error?.message ?? "Failed to save template";
      showSnack(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!salaryData?.data) return;
    if (originalRef.current) return;
    const d = salaryData.data;
    setData(d);

    const name = window.location.pathname.includes("duplicate")
      ? ""
      : d.templateName || "";
    const desc = window.location.pathname.includes("duplicate")
      ? ""
      : d.description || "";
    const gross = Number(d.annualGross) || 0;

    const rawEarnings: EarningItem[] = d.earnings?.length
      ? d.earnings.map((e: any) => ({
          earningComponent: String(e.earning.id),
          calculationType: e.earning.calculationType || "--",
          monthlyAmount: Number(e.monthlyAmount || 0),
          annualAmount: Number(e.monthlyAmount || 0) * 12,
        }))
      : [
          {
            earningComponent: null,
            calculationType: "--",
            monthlyAmount: 0,
            annualAmount: 0,
          },
        ];

    // FIX 1 (part D): ensure FA row is present when loading from API in the effect too
    const earnings = ensureFixedAllowanceRow(rawEarnings, fixedAllowanceId);

    const deductions: DeductionItem[] = d.deductions?.length
      ? d.deductions.map((ded: any) => ({
          deductionComponent: String(ded.deduction.id),
          calculationType: ded.deduction.calculationType || "--",
          monthlyAmount: Number(ded.monthlyAmount || 0),
          annualAmount: Number(ded.monthlyAmount || 0) * 12,
        }))
      : [];

    setTemplateName(name);
    setTemplateDescription(desc);
    setAnnualGross(gross);
    setEarningItems(earnings);
    setDeductionItems(deductions);

    if (!originalRef.current) {
      originalRef.current = {
        templateName: name,
        templateDescription: desc,
        annualGross: gross,
        earningItems: earnings,
        deductionItems: deductions,
      };
    }
  }, [salaryData]);

  const salaryGrid = {
    width: "100%",
    display: "grid",
    gap: 1,
    p: 1,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "40px 1fr",
      md: "5% 25% 19% 16% 15% 5% 5%",
    },
    alignItems: "center",
  };

  return !isLoading ? (
    <Card
      elevation={2}
      sx={{
        pb: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        maxHeight: "100%",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Header + Form */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() => {
              setCurrentTab && setCurrentTab(72);
              navigate(-1);
            }}
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
              {window.location.pathname.includes("duplicate")
                ? "Duplicate"
                : "Edit"}{" "}
              Salary Template
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ flexShrink: 0, p: 2 }}>
        {/* Form Inputs */}
        <Stack gap={2} mt={2} direction="row" alignItems="center">
          <TextFieldElement
            label="Template Name"
            sx={{ width: "40%" }}
            required
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <TextFieldElement
            label="Template Description"
            sx={{ width: "40%" }}
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />
          <TextFieldElement
            label="Annual Gross"
            value={formatNumberForTyping(String(annualGross), commaseperation)}
            required
            onChange={(e) => {
              const raw = parseNumberForTyping(e.target.value);
              setAnnualGross(Number(raw));
            }}
            slotProps={{
              htmlInput: { style: { textAlign: "right" } },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ width: 24, height: 24 }}>{currency}</Box>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      </Box>

      {/* Repeaters (grow dynamically) */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          gap: 1,
          mt: 2,
          alignItems: "stretch",
          overflow: "hidden",
        }}
      >
        <Box
          width="49%"
          sx={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Box sx={{ flex: 1, overflow: "auto", mt: 1 }}>
            <EarningRepeater
              items={displayItems}
              setItems={setEarningItems}
              earningsData={earningsData}
              annualGross={annualGross}
              width="100%"
              height="100%"
              fixedAllowance={fixedAllowanceId}
            />
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box
          width="49%"
          sx={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Box sx={{ flex: 1, overflow: "auto", mt: 1 }}>
            <DeductionsRepeater
              items={deductionItems}
              setItems={setDeductionItems}
              deductionsData={deductionsData}
              width="100%"
              height="100%"
            />
          </Box>
        </Box>
      </Box>

      {/* Bottom Gross + Save */}
      <Box
        sx={{
          flexShrink: 0,
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid",
          borderColor: "divider",
          pt: 1.5,
        }}
      >
        <Box sx={salaryGrid}>
          <div />
          <Typography variant="h6">Gross</Typography>
          <div />
          <Typography sx={{ textAlign: "right" }}>
            Monthly Amount : {"  "}
            {
              formatNumberByCommaSeparation(
                Math.round(monthlyGross),
                commaseperation,
              ).split(".")[0]
            }
          </Typography>
          <Typography sx={{ textAlign: "right" }}>
            Annual Amount : {"  "}
            {
              formatNumberByCommaSeparation(
                Math.round(annualGross),
                commaseperation,
              ).split(".")[0]
            }
          </Typography>
          <div />
        </Box>

        <Tooltip title={tooltipMessage} disableHoverListener={!tooltipMessage}>
          <span>
            <PrimaryButton disabled={isButtonDisabled} onClick={handleSubmit}>
              Save
            </PrimaryButton>
          </span>
        </Tooltip>
      </Box>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={3000}
        />
      )}
    </Card>
  ) : (
    <Card
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        maxHeight: "100%",
        height: "100%",
        width: "100%",
      }}
    >
      <AnalyticsBarLoader />
    </Card>
  );
}

export default EditSalaryTemplateModal;