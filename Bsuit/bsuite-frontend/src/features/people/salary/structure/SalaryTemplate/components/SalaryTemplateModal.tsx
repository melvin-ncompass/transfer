import {
  Box,
  Stack,
  InputAdornment,
  Typography,
  Card,
  Divider,
  IconButton,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { useGetEarningsQuery } from "../../Earnings/api/earnings.api";
import { useGetDeductionsQuery } from "../../Deductions/api/deductions.api";
import {
  useCreateSalaryTemplateMutation,
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
import { useNavigate } from "react-router-dom";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useSnackbar } from "../../../../../../context/SnackbarContext";

// ---------
// Interface
// ---------
interface SalaryTemplateModalProps {
  data?: any;
  duplicate?: boolean;
  onSuccess?: (data: string) => void;
  onError?: (data: string) => void;
  setCurrentTab?: (tab: number) => void;
}

function SalaryTemplateModal({
  data,
  duplicate = false,
  onSuccess,
  onError,
  setCurrentTab,
}: SalaryTemplateModalProps) {
  // -----
  // Hooks
  // -----
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  // API queries
  const { data: earningsData = [] } = useGetEarningsQuery();
  const { data: deductionsData = [] } = useGetDeductionsQuery();
  const [createTemplate] = useCreateSalaryTemplateMutation();
  const [updateTemplate] = useUpdateSalaryTemplateMutation();
  const { data: headerData } = useGetHeaderDataQuery();

  const currency = headerData?.data.reportingCurrency?.split(" - ")[0];
  const commaseperation =
    headerData?.data.commaSeparation === "IN" ? "IN" : "US";
  // ---------------
  // State Variables and Memoized variables
  // ---------------
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  // Form state
  const [templateName, setTemplateName] = useState(
    duplicate ? "" : (data?.templateName || "")
  );  
  const [templateDescription, setTemplateDescription] = useState(
    data?.description || "",
  );
  const [annualGross, setAnnualGross] = useState<number>(
    Number(data?.annualGross) || 0,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monthly gross
  const monthlyGross = useMemo(
    () => Math.round(annualGross / 12),
    [annualGross],
  );

  // Initial mapped earnings & deductions
  const fixedAllowanceId =
    earningsData.find((earning) => earning.earningName === "Fixed Allowance")
      ?.id !== undefined
      ? Number(
        earningsData.find(
          (earning) => earning.earningName === "Fixed Allowance",
        )?.id,
      )
      : undefined;
  const mappedEarnings: EarningItem[] = useMemo(() => {
    if (fixedAllowanceId === undefined) return [];

    // If editing existing data
    if (data?.earnings?.length) {
      const items = data.earnings.map((e: any) => ({
        earningComponent: String(e.earning.id),
        calculationType: e.earning.calculationType || "--",
        monthlyAmount: Number(e.monthlyAmount || 0),
        annualAmount: Number(e.monthlyAmount || 0) * 12,
      }));

      // Ensure Fixed Allowance exists
      if (
        !items.some((i: any) => Number(i.earningComponent) === fixedAllowanceId)
      ) {
        items.unshift({
          earningComponent: fixedAllowanceId.toString(),
          calculationType: "amount",
          monthlyAmount: 0,
          annualAmount: 0,
        });
      }

      return items;
    }

    return [
      {
        earningComponent: fixedAllowanceId.toString(),
        calculationType: "amount",
        monthlyAmount: 0,
        annualAmount: 0,
      },
    ];
  }, [data, fixedAllowanceId]);

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

  // Track if fixed allowance is negative
  const [fixedAllowanceNegative, setFixedAllowanceNegative] = useState(false);

  // Robust recalculation of Fixed Allowance whenever annualGross, earningItems, or deductionItems change
  const fixedAllowanceValue = useMemo(() => {
    if (fixedAllowanceId === undefined) return 0;

    const otherEarningsSum = earningItems
      .filter((item) => Number(item.earningComponent) !== fixedAllowanceId)
      .reduce((acc, item) => acc + item.monthlyAmount, 0);

    const deductionsSum = deductionItems.reduce(
      (acc, item) => acc + item.monthlyAmount,
      0,
    );

    const monthlyGross = Math.round(annualGross / 12);
    const val = monthlyGross - otherEarningsSum;
    setFixedAllowanceNegative(val < 0);
    console.log(fixedAllowanceId)
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
  const missingParentInfo = useMemo(() => {
    if (!earningsData?.length) return [];

    return earningItems
      .map((item) => {
        const earning = earningsData.find(
          (e) => String(e.id) === item.earningComponent,
        );

        if (
          !earning ||
          earning.calculationType !== "percentage" ||
          !earning.percentageOf ||
          earning.percentageOf === "gross"
        ) {
          return null;
        }

        const parentId = String(earning.percentageOf);

        const parentExists = earningItems.some(
          (i) => i.earningComponent === parentId,
        );

        if (parentExists) return null;

        const parent = earningsData.find((e) => String(e.id) === parentId);

        return {
          child: earning.earningName,
          parent: parent?.earningName || "Parent component",
        };
      })
      .filter(Boolean);
  }, [earningItems, earningsData]);

  const trimmedTemplateName = templateName.trim();
  const trimmedTemplateDescription = templateDescription.trim();
  const hasValidName = trimmedTemplateName.length > 0 && trimmedTemplateName.length <= 256;
  const hasValidDescription = trimmedTemplateDescription.length <= 256;
  const hasValidGross = annualGross > 0;
  const hasRows =
    displayItems.some((item) => item.earningComponent !== null) ||
    deductionItems.some((item) => item.deductionComponent !== null);
  const hasIncompleteRows = useMemo(() => {
    const isActiveEarningRow = (item: EarningItem) =>
      item.earningComponent !== null 

    const isActiveDeductionRow = (item: DeductionItem) =>
      item.deductionComponent !== null 

    const incompleteEarnings = displayItems.some(  // ← change earningItems → displayItems
      (item) =>
        isActiveEarningRow(item) &&
        (item.earningComponent === null ||
          item.earningComponent === "" ),
    );

    const incompleteDeductions = deductionItems.some(
      (item) =>
        isActiveDeductionRow(item) &&
        (item.deductionComponent === null ||
          item.deductionComponent === "" ),
    );

    return incompleteEarnings || incompleteDeductions;
  }, [displayItems, deductionItems]);  // ← update dependency too

  const isChildWithoutParent = missingParentInfo.length > 0;
  const isFormValid =
    hasValidName &&
    hasValidDescription &&
    hasValidGross &&
    !fixedAllowanceNegative &&
    !isChildWithoutParent &&
    !hasIncompleteRows &&
    hasRows;
  // ------------------- Payload Submit -------------------
  const handleSubmit = async () => {
    if (!trimmedTemplateName) {
      showSnackbar("Template Name is required", "error");
      return;
    }

    if (!hasValidName) {
      showSnackbar("Template Name must be at most 256 characters", "error");
      return;
    }

    if (!hasValidDescription) {
      showSnackbar("Template Description must be at most 256 characters", "error");
      return;
    }

    if (!hasValidGross) {
      showSnackbar("Gross must be greater than zero", "error");
      return;
    }

    if (!hasRows) {
      showSnackbar("At least one earning or deduction row is required", "error");
      return;
    }

    if (fixedAllowanceNegative) {
      showSnackbar("Fixed Allowance cannot be negative", "error");
      return;
    }

    const earningsToSend = displayItems.filter(
      (item) =>
        !(Number(item.earningComponent) === fixedAllowanceId && item.monthlyAmount === 0)
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
      setTimeout(() => navigate(-1), 100);
    } catch (error: any) {
      const message = error?.data?.message ?? error?.message ?? "Failed to save template";
      showSnackbar(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const tooltipMessage = isSubmitting
    ? "Saving..."
    : !hasValidName
      ? trimmedTemplateName.length === 0
        ? "Template Name is required"
        : "Template Name must be at most 256 characters"
      : !hasValidDescription
        ? trimmedTemplateDescription.length === 0
          ? "Template Description is required"
          : "Template Description must be at most 256 characters"
      : !hasValidGross
        ? "Gross must be greater than zero"
        : !hasRows
          ? "At least one earning or deduction row is required"
          : fixedAllowanceNegative
            ? "Fixed Allowance cannot be negative"
            : isChildWithoutParent
              ? missingParentInfo
                .map((i) => `${i!.child} requires ${i!.parent}`)
                .join(", ")
              : hasIncompleteRows
                ? "All rows must have a component and monthly amount greater than zero"
                : "";

  useEffect(() => {
    if (earningItems.length === 0) {
      setEarningItems(mappedEarnings);
    }
  }, [mappedEarnings]);
  return (
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
              Add Salary Template
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create a new salary template
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ flexShrink: 0, p: 2 }}>
        {/* Header */}

        {/* Form Inputs */}
        <Stack gap={2} mt={2} direction="row" alignItems="center" px={1}>
          <TextFieldElement
            label="Template Name"
            sx={{ width: "40%" }}
            value={templateName}
            required
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
            onChange={(e) => {
              const raw = parseNumberForTyping(e.target.value);
              setAnnualGross(Number(raw));
            }}
            required
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
          px: 1,
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

      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid",
          borderColor: "divider",
          px: 1,
        }}
      >
        <div />
      </Box>
      {/* Bottom Gross + Save */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid",
          borderColor: "divider",
          pt: 1.5,
          px: 1,
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
              )
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

        <Tooltip title={tooltipMessage}>
          <span>
            <PrimaryButton
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
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
  );
}

export default SalaryTemplateModal;
