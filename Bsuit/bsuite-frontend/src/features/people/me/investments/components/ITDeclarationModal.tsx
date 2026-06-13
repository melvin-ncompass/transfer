import { useState, useEffect, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Button,
  Card,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import { RepeaterElement } from "../../../../../components/atom/form-repeater";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../components/atom/button";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { MonthYearPickerElement } from "../../../../../components/atom/date-picker";
import { Grid } from "@mui/system";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import {
  useGetDeclarationQuery,
  useCreateDeclarationMutation,
  useUpdateDeclarationMutation,
  useGetDeclaredDataForFYQuery,
  isRawSectionContainingPrincipal80CSubsection,
  isPrincipalRepaymentHomeLoanSubsection,
  shouldHideDeclared80CInvestmentExemption,
  type RawTaxExemptionSection,
  type RawTaxExemptionSubsection,
  type CreateITDeclarationDto,
  type RentedHouseDetailDto,
  type SelfOccupiedPropertyDto,
  type LetOutPropertyDto,
  type ExemptionDetailDto,
  type DeclaredDataForFY,
  formatFinancialYearLabel,
  useGetFinancialYearQuery,
} from "../api/itDeclaration.api";
import {
  formatNumberForTyping,
  parseNumberByCommaSeparation,
  parseNumberForTyping,
} from "../../../../../utils/numberFormatter";
import { useSnackbar } from "../../../../../context/SnackbarContext";

const COMMA_SEPARATION: "US" | "IN" = "IN";

/* ---------------------------------- */
/* TYPES */
/* ---------------------------------- */

interface RentItem {
  from: string;
  to: string;
  amount: number | "";
  amountInput: string; // raw input while typing (for comma-separation display)
  metro: string;
  landlordName: string;
  landlordPan: string;
}

interface LetOutProperty {
  annualRent: number | "";
  annualRentInput: string;
  municipalTax: number | "";
  municipalTaxInput: string;
  repayingLoan: boolean;
  principalPaid: number | "";
  principalPaidInput: string;
  interestOnLoan: number | "";
  interestOnLoanInput: string;
  lenderName: string;
  lenderPan: string;
}

interface PreviousEmployment {
  incomeAfterExemption: number | "";
  incomeAfterExemptionInput: string;
  incomeTaxPaid: number | "";
  incomeTaxPaidInput: string;
  pfPaid: number | "";
  pfPaidInput: string;
  ptPaid: number | "";
  ptPaidInput: string;
}

interface ExemptionOptionDisplay {
  label: string;
  value: string;
  maxLimit: string;
  componentMapping?: string | null;
}

interface MappedExemptionSection {
  id: string;
  title: string;
  maxLimit: string;
  options: ExemptionOptionDisplay[];
}

interface ExemptionRow {
  optionId: string;
  amount: string;
  amountInput: string;
}

function pick80CPrincipalSubsection(
  section: RawTaxExemptionSection,
): RawTaxExemptionSubsection | undefined {
  const subs = section.subsections ?? [];
  if (subs.length === 0) return undefined;
  const nameMatch = subs.find((s) => isPrincipalRepaymentHomeLoanSubsection(s));
  return nameMatch ?? subs[0];
}

/** Indian PAN format: 5 letters, 4 digits, 1 letter (e.g. AAAAA9090A) */
const PAN_REGEX = /^[A-Za-z]{5}\d{4}[A-Za-z]$/;
const PAN_MAX_LEN = 10;

function formatPANNumber(input: string): string {
  const raw = input.replace(/[^a-zA-Z0-9]/g, "").slice(0, PAN_MAX_LEN);
  const part1 = raw.slice(0, 5).replace(/[^a-zA-Z]/g, "").slice(0, 5);
  const part2 = raw.slice(5, 9).replace(/[^0-9]/g, "").slice(0, 4);
  const part3 = raw.slice(9, 10).replace(/[^a-zA-Z]/g, "").slice(0, 1);
  return (part1 + part2 + part3).toUpperCase();
}

const SectionDivider = () => (
  <Divider sx={{ borderBottomWidth: 2, borderColor: "grey.300" }} />
);

const RENT_METRO_OPTIONS = [
  { label: "Non Metro", value: "non_metro" },
  { label: "Metro", value: "metro" },
];

/**
 * Two ranges [from1, to1] and [from2, to2] (YYYY-MM) overlap iff from1 <= to2 && from2 <= to1.
 */
function rentPeriodsOverlap(
  from1: string,
  to1: string,
  from2: string,
  to2: string,
): boolean {
  return from1 <= to2 && from2 <= to1;
}

/**
 * Returns error message if the row at currentIndex has invalid or overlapping rental period.
 */
function getRentPeriodOverlapError(
  items: RentItem[],
  currentIndex: number,
): string | null {
  const item = items[currentIndex];
  if (!item?.from || !item?.to) return null;

  const from = item.from;
  const to = item.to;
  if (from > to) {
    return "From month must be before or equal to To month.";
  }

  for (let i = 0; i < items.length; i++) {
    if (i === currentIndex) continue;
    const other = items[i];
    if (!other?.from || !other?.to) continue;
    if (rentPeriodsOverlap(from, to, other.from, other.to)) {
      return "This rental period overlaps with another row.";
    }
  }
  return null;
}

/* ---------------------------------- */
/* COMPONENT */
/* ---------------------------------- */

/**
 * Parse financial year string (e.g. "2024-2025" or "2024-25") to startYear and endYear.
 */
function parseFinancialYearToStartEnd(financialYear: string): { startYear: string; endYear: string } | null {
  if (!financialYear?.trim()) return null;
  const parts = financialYear.trim().split("-").map((p) => p.trim());
  if (parts.length < 2) return null;
  const startYear = parts[0];
  const endPart = parts[1];
  const endYear = endPart.length === 2 ? `20${endPart}` : endPart;
  return startYear && endYear ? { startYear, endYear } : null;
}

export default function ITDeclarationModal({ setcurrentTab }: { setcurrentTab?: (tab: number) => void }) {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const locationState = location.state as { financialYear?: string; isEdit?: boolean } | null;
  const selectedFinancialYear = locationState?.financialYear ?? "";
  const isEditMode = Boolean(locationState?.isEdit);

  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const employeeId = String(employeeInfo?.data?.employeeId ?? "");
  const { data: financialYearData } = useGetFinancialYearQuery(employeeId);
  const currentFinancialYear = financialYearData?.currentFinancialYear;
  const selectedFinancialYearLabel = formatFinancialYearLabel(
    selectedFinancialYear,
    currentFinancialYear?.financialYear === selectedFinancialYear
      ? currentFinancialYear
      : null,
  );
  const fyStart = currentFinancialYear?.financialYearStart
    ? dayjs(currentFinancialYear.financialYearStart)
    : null;

  const fyEnd = currentFinancialYear?.financialYearEnd
    ? dayjs(currentFinancialYear.financialYearEnd)
    : null;
  const numericEmployeeId = employeeId ? Number(employeeId) : null;
  const startEnd = parseFinancialYearToStartEnd(selectedFinancialYear);

  const { data: declaredDataForFY } = useGetDeclaredDataForFYQuery(
    { employeeId: numericEmployeeId!, financialYear: selectedFinancialYear },
    { skip: !isEditMode || !numericEmployeeId || !selectedFinancialYear }
  );

  const { data: declarationData, isLoading: isLoadingDeclaration } = useGetDeclarationQuery(
    {
      employeeId: numericEmployeeId!,
      startYear: startEnd?.startYear ?? "",
      endYear: startEnd?.endYear ?? "",
    },
    {
      skip: !numericEmployeeId || !startEnd?.startYear || !startEnd?.endYear,
    }
  );

  /**
   * Hide the rent (HRA) section entirely when the active income-tax config has HRA disabled.
   * Only `false` hides it; `undefined` (still loading) keeps the section visible to avoid flicker.
   */
  const isHraEnabled = declarationData?.isHraEnabled !== false;
  /* ------------------ RENT STATE ------------------ */
  const [isRented, setIsRented] = useState(true);
  const [rentPeriodSnackbar, setRentPeriodSnackbar] = useState({
    open: false,
    message: "",
  });
  const [rentDetails, setRentDetails] = useState<RentItem[]>([
    {
      from: "",
      to: "",
      amount: "",
      amountInput: "",
      metro: "",
      landlordName: "",
      landlordPan: "",
    },
  ]);

  /* ------------------ HOME LOAN ------------------ */
  const [hasHomeLoan, setHasHomeLoan] = useState(true);
  const [homeLoanPrincipal, setHomeLoanPrincipal] = useState<number | "">("");
  const [homeLoanPrincipalInput, setHomeLoanPrincipalInput] = useState("");
  const [homeLoanInterest, setHomeLoanInterest] = useState<number | "">("");
  const [homeLoanInterestInput, setHomeLoanInterestInput] = useState("");
  const [homeLoanLenderName, setHomeLoanLenderName] = useState("");
  const [homeLoanLenderPan, setHomeLoanLenderPan] = useState("");

  /* ------------------ LET OUT ------------------ */
  const [hasLetOut, setHasLetOut] = useState(true);
  const [letOutProperties, setLetOutProperties] = useState<LetOutProperty[]>([
    {
      annualRent: "",
      annualRentInput: "",
      municipalTax: "",
      municipalTaxInput: "",
      repayingLoan: false,
      principalPaid: "",
      principalPaidInput: "",
      interestOnLoan: "",
      interestOnLoanInput: "",
      lenderName: "",
      lenderPan: "",
    },
  ]);

  /* ------------------ PREVIOUS EMPLOYMENT ------------------ */
  const [previousEmployment, setPreviousEmployment] =
    useState<PreviousEmployment>({
      incomeAfterExemption: "",
      incomeAfterExemptionInput: "",
      incomeTaxPaid: "",
      incomeTaxPaidInput: "",
      pfPaid: "",
      pfPaidInput: "",
      ptPaid: "",
      ptPaidInput: "",
    });

  const [exemptionData, setExemptionData] = useState<
    Record<string, ExemptionRow[]>
  >({});

  // Force-disable rent when HRA is turned off on the tax config so save/validation skip it.
  useEffect(() => {
    if (declarationData?.isHraEnabled === false && isRented) {
      setIsRented(false);
    }
  }, [declarationData?.isHraEnabled, isRented]);

  const prefillFromDeclaredDataRan = useRef(false);
  useEffect(() => {
    prefillFromDeclaredDataRan.current = false;
  }, [selectedFinancialYear, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !declaredDataForFY || prefillFromDeclaredDataRan.current) return;
    prefillFromDeclaredDataRan.current = true;

    const d = declaredDataForFY as DeclaredDataForFY;

    // Don't turn rent back on during prefill if the active tax config has HRA disabled.
    const hasRent = Boolean(d.rentedHouseDetails?.length);
    setIsRented(declarationData?.isHraEnabled === false ? false : hasRent);
    if (hasRent) {
      setRentDetails(
        d.rentedHouseDetails!.map((r) => ({
          from: r.rentalPeriodFrom.slice(0, 7),
          to: r.rentalPeriodTo.slice(0, 7),
          amount: r.rentAmount,
          amountInput: "",
          metro: r.metroNonMetro || "non_metro",
          landlordName: r.landlordName ?? "",
          landlordPan: r.landlordPanNumber ?? "",
        })),
      );
    } else {
      setRentDetails([
        {
          from: "",
          to: "",
          amount: "",
          amountInput: "",
          metro: "",
          landlordName: "",
          landlordPan: "",
        },
      ]);
    }

    const hasSelfOccupied = Boolean(d.selfOccupiedProperty);
    setHasHomeLoan(hasSelfOccupied);
    if (hasSelfOccupied && d.selfOccupiedProperty) {
      const p = d.selfOccupiedProperty;
      setHomeLoanPrincipal(p.principalPaidOnLoan);
      setHomeLoanPrincipalInput("");
      setHomeLoanInterest(p.interestPaidOnLoan);
      setHomeLoanInterestInput("");
      setHomeLoanLenderName(p.lenderName ?? "");
      setHomeLoanLenderPan(p.lenderPan ?? "");
    } else {
      setHomeLoanPrincipal("");
      setHomeLoanPrincipalInput("");
      setHomeLoanInterest("");
      setHomeLoanInterestInput("");
      setHomeLoanLenderName("");
      setHomeLoanLenderPan("");
    }

    const hasLetOutData = Boolean(d.letOutProperties?.length);
    setHasLetOut(hasLetOutData);
    if (hasLetOutData) {
      setLetOutProperties(
        d.letOutProperties!.map((p) => ({
          annualRent: p.annualRentReceived,
          annualRentInput: "",
          municipalTax: p.municipalTaxPaid,
          municipalTaxInput: "",
          repayingLoan: p.isRepayingHomeLoan ?? false,
          principalPaid: p.principalForLetOut ?? "",
          principalPaidInput: "",
          interestOnLoan: p.interestPaidOnLetOut ?? "",
          interestOnLoanInput: "",
          lenderName: p.lenderName ?? "",
          lenderPan: p.lenderPan ?? "",
        })),
      );
    } else {
      setLetOutProperties([
        {
          annualRent: "",
          annualRentInput: "",
          municipalTax: "",
          municipalTaxInput: "",
          repayingLoan: false,
          principalPaid: "",
          principalPaidInput: "",
          interestOnLoan: "",
          interestOnLoanInput: "",
          lenderName: "",
          lenderPan: "",
        },
      ]);
    }

    if (d.exemptionDetails?.length) {
      const bySection: Record<string, ExemptionRow[]> = {};
      d.exemptionDetails.forEach((ex) => {
        if (shouldHideDeclared80CInvestmentExemption(ex)) return;
        const key = ex.sectionCode;
        if (!bySection[key]) bySection[key] = [];
        bySection[key].push({
          optionId: ex.subSectionCode,
          amount: String(ex.declaredAmount),
          amountInput: "",
        });
      });
      setExemptionData(bySection);
    }
  }, [isEditMode, declaredDataForFY]);

  const rawTaxExemption = declarationData?.taxExemption;
  const isRawSection = (s: unknown): s is RawTaxExemptionSection =>
    s != null &&
    typeof (s as RawTaxExemptionSection).sectionName === "string" &&
    Array.isArray((s as RawTaxExemptionSection).subsections);
  const rawSections: RawTaxExemptionSection[] =
    Array.isArray(rawTaxExemption) && rawTaxExemption.every(isRawSection)
      ? rawTaxExemption
      : [];

  const mappedSections: MappedExemptionSection[] = rawSections
    .map((section) => ({
      id: section.code,
      title: section.sectionName,
      maxLimit: section.maxLimit,
      options: (section.subsections ?? [])
        .filter((sub) => !isPrincipalRepaymentHomeLoanSubsection(sub))
        .map((sub) => ({
          label: sub.exemptionName,
          value: sub.code,
          maxLimit: sub.maxLimit,
          componentMapping: sub.componentMapping ?? null,
        })),
    }))
    .filter((section) => section.options.length > 0);

  const [createDeclaration, { isLoading: isSubmittingCreate }] = useCreateDeclarationMutation();
  const [updateDeclaration, { isLoading: isSubmittingUpdate }] = useUpdateDeclarationMutation();
  const isSubmitting = isSubmittingCreate || isSubmittingUpdate;
  const [submitSnackbar, setSubmitSnackbar] = useState<{ open: boolean; message: string; color: "success" | "error" }>({
    open: false,
    message: "",
    color: "success",
  });

  function buildPayload(): CreateITDeclarationDto | null {
    if (!numericEmployeeId || !selectedFinancialYear) return null;

    const rentedHouseDetails: RentedHouseDetailDto[] = isRented
      ? rentDetails
        .filter((r) => r.from && r.to && r.amount !== "" && Number(r.amount) >= 0)
        .map((r) => ({
          rentalPeriodFrom: dayjs(`${r.from}-01`).format("YYYY-MM-DD"),
          rentalPeriodTo: dayjs(`${r.to}-01`).endOf("month").format("YYYY-MM-DD"),
          rentAmount: Number(r.amount),
          metroNonMetro: r.metro || "non_metro",
          landlordName: r.landlordName.trim(),
          landlordPanNumber: r.landlordPan.trim(),
        }))
      : [];

    const selfOccupiedProperty: SelfOccupiedPropertyDto | undefined =
      hasHomeLoan &&
        homeLoanPrincipal !== "" &&
        homeLoanInterest !== "" &&
        Number(homeLoanPrincipal) >= 0 &&
        Number(homeLoanInterest) >= 0
        ? {
          principalPaidOnLoan: Number(homeLoanPrincipal),
          interestPaidOnLoan: Number(homeLoanInterest),
          lenderName: homeLoanLenderName.trim(),
          lenderPan: homeLoanLenderPan.trim(),
        }
        : undefined;

    const letOutPropertiesPayload: LetOutPropertyDto[] = hasLetOut
      ? letOutProperties
        .filter(
          (p) =>
            p.annualRent !== "" &&
            p.municipalTax !== "" &&
            Number(p.annualRent) >= 0 &&
            Number(p.municipalTax) >= 0
        )
        .map((p) => {
          const annualRentReceived = Number(p.annualRent);
          const municipalTaxPaid = Number(p.municipalTax);
          const netAnnualValue = annualRentReceived - municipalTaxPaid;
          const standardDeduction = Math.round(netAnnualValue * 0.3);
          const interest = Number(p.interestOnLoan || 0);
          const netIncomeLoss =
            netAnnualValue - standardDeduction - (p.repayingLoan ? interest : 0);
          return {
            annualRentReceived,
            municipalTaxPaid,
            netAnnualValue,
            standardDeduction,
            netIncomeLoss,
            isRepayingHomeLoan: p.repayingLoan,
            ...(p.repayingLoan
              ? {
                interestPaidOnLetOut: interest,
                principalForLetOut: Number(p.principalPaid || 0),
                lenderName: p.lenderName.trim(),
                lenderPan: p.lenderPan.trim(),
              }
              : {}),
          };
        })
      : [];

    const exemptionDetails: ExemptionDetailDto[] = [];
    mappedSections.forEach((section) => {
      const rows = exemptionData[section.id] || [];
      rows.forEach((row) => {
        if (!row.optionId || !row.amount || Number(row.amount) <= 0) return;
        const option = section.options.find((o) => o.value === row.optionId);
        if (!option) return;
        exemptionDetails.push({
          sectionCode: section.id,
          sectionName: section.title,
          sectionMaxLimit: Number(section.maxLimit),
          subSectionCode: row.optionId,
          subSectionName: option.label,
          subSectionMaxLimit: Number(option.maxLimit),
          componentMapping: option.componentMapping ?? null,
          declaredAmount: Number(row.amount),
        });
      });
    });

    let principal80CTotal = 0;
    if (hasHomeLoan && homeLoanPrincipal !== "" && homeLoanPrincipal !== undefined) {
      const p = Number(homeLoanPrincipal);
      if (!Number.isNaN(p) && p > 0) principal80CTotal += p;
    }
    letOutProperties.forEach((p) => {
      if (p.principalPaid === "" || p.principalPaid === undefined) return;
      const pr = Number(p.principalPaid);
      if (!Number.isNaN(pr) && pr > 0) principal80CTotal += pr;
    });

    const raw80CSection = rawSections.find(isRawSectionContainingPrincipal80CSubsection);
    if (principal80CTotal > 0 && raw80CSection) {
      const sub = pick80CPrincipalSubsection(raw80CSection);
      if (sub) {
        exemptionDetails.push({
          sectionCode: raw80CSection.code,
          sectionName: raw80CSection.sectionName,
          sectionMaxLimit: Number(raw80CSection.maxLimit),
          subSectionCode: sub.code,
          subSectionName: sub.exemptionName,
          subSectionMaxLimit: Number(sub.maxLimit),
          componentMapping: sub.componentMapping ?? null,
          declaredAmount: principal80CTotal,
        });
      }
    }

    return {
      employeeId: numericEmployeeId,
      financialYear: selectedFinancialYear,
      ...(rentedHouseDetails.length > 0 ? { rentedHouseDetails } : {}),
      ...(selfOccupiedProperty ? { selfOccupiedProperty } : {}),
      ...(letOutPropertiesPayload.length > 0 ? { letOutProperties: letOutPropertiesPayload } : {}),
      ...(exemptionDetails.length > 0 ? { exemptionDetails } : {}),
    };
  }

  /* ------------------ VALIDATION (required fields when section is on) ------------------ */
  const validationErrors = ((): string[] => {
    const errs: string[] = [];
    if (isRented) {
      rentDetails.forEach((item, idx) => {
        const row = idx + 1;
        if (!item.from?.trim()) errs.push(`• Rent (row ${row}): Rental period "From" is required`);
        if (!item.to?.trim()) errs.push(`• Rent (row ${row}): Rental period "To" is required`);
        if (item.from) {
          const fromDate = dayjs(item.from, "YYYY-MM");
          if (fromDate.isBefore(fyStart)) {
            errs.push(`• Rent (row ${row}): "From" must be within financial year`);
          }
        }

        if (item.to) {
          const toDate = dayjs(item.to, "YYYY-MM");
          if (toDate.isAfter(fyEnd)) {
            errs.push(`• Rent (row ${row}): "To" must be within financial year`);
          }
        }
        if (item.amount === "" || item.amount === undefined) errs.push(`• Rent (row ${row}): Amount is required`);
        if (!item.metro?.trim()) errs.push(`• Rent (row ${row}): Non Metro / Metro is required`);
        if (!item.landlordName?.trim()) errs.push(`• Rent (row ${row}): Landlord name is required`);
        if (!item.landlordPan?.trim()) errs.push(`• Rent (row ${row}): Landlord PAN is required`);
        const overlapErr = getRentPeriodOverlapError(rentDetails, idx);
        if (overlapErr) errs.push(`• Rent (row ${row}): ${overlapErr}`);
      });
    }
    if (hasHomeLoan) {
      if (homeLoanPrincipal === "" || homeLoanPrincipal === undefined) errs.push("• Home loan: Principal paid is required");
      if (homeLoanInterest === "" || homeLoanInterest === undefined) errs.push("• Home loan: Interest paid is required");
      if (!homeLoanLenderName?.trim()) errs.push("• Home loan: Name of the lender is required");
      if (!homeLoanLenderPan?.trim()) errs.push("• Home loan: Lender PAN is required");
    }
    if (hasLetOut) {
      letOutProperties.forEach((item, idx) => {
        const row = idx + 1;
        if (item.annualRent === "" || item.annualRent === undefined) errs.push(`• Let-out (row ${row}): Annual rent received is required`);
        if (item.municipalTax === "" || item.municipalTax === undefined) errs.push(`• Let-out (row ${row}): Municipal taxes paid is required`);
        if (item.repayingLoan) {
          if (item.principalPaid === "" || item.principalPaid === undefined) errs.push(`• Let-out (row ${row}): Principal paid on home loan is required`);
          if (item.interestOnLoan === "" || item.interestOnLoan === undefined) errs.push(`• Let-out (row ${row}): Interest paid on home loan is required`);
          if (!item.lenderName?.trim()) errs.push(`• Let-out (row ${row}): Name of the lender is required`);
          if (!item.lenderPan?.trim()) errs.push(`• Let-out (row ${row}): Lender PAN is required`);
        }
      });
    }
    return errs;
  })();

  const isSubmitDisabled = validationErrors.length > 0;

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload) {
      setSubmitSnackbar({
        open: true,
        message: "Missing employee or financial year. Cannot submit.",
        color: "error",
      });
      return;
    }
    try {
      if (isEditMode && declaredDataForFY?.id) {
        await updateDeclaration({ id: declaredDataForFY.id, body: payload }).unwrap();
        showSnackbar("IT declaration updated successfully.", "success");
        // setSubmitSnackbar({ open: true, message: "IT declaration updated successfully.", color: "success" });
      } else {
        await createDeclaration(payload).unwrap();
        showSnackbar("IT declaration created successfully.", "success");
        // setSubmitSnackbar({ open: true, message: "IT declaration created successfully.", color: "success" });
      }
      if (setcurrentTab) setcurrentTab(3);
      else navigate("/people/home?tab=3", { replace: true });
    } catch (e: unknown) {
      const err = e as any;
      const message = err?.data?.message ?? err?.error ?? err?.message
        ?? (isEditMode ? "Failed to update declaration." : "Failed to create declaration.");
      showSnackbar(message, "error");
      // setSubmitSnackbar({ open: true, message, color: "error" });
    }
  }

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  return (
    <Card
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        overflow: "scroll",
        maxHeight: "100%",
        // minHeight: 400,
        height: "100%",
        width: "100%",
      }}
    >
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
            onClick={() => (setcurrentTab ? setcurrentTab(3) : navigate("/people/home?tab=3", { replace: true }))}
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
              {isEditMode ? "Edit IT Declaration" : "Add IT Declaration"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedFinancialYear
                ? isEditMode
                  ? `Edit IT declaration for ${selectedFinancialYearLabel}`
                  : `Create a new IT declaration for ${selectedFinancialYearLabel}`
                : isEditMode
                  ? "Edit IT declaration"
                  : "Create a new IT declaration"}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box p={3} width="100%">
        <Stack spacing={4}>
          {/* ====================================================== */}
          {/* RENT SECTION (only when current tax config has HRA enabled) */}
          {/* ====================================================== */}
          {isHraEnabled && (
          <>
          <Box>
            <ToggleSwitch
              label="Is the employee staying in a rented house?"
              checked={isRented}
              onChange={(e) => setIsRented(e.target.checked)}
              size="medium"
            />

            {isRented && (
              <Box mt={2}>
                <RepeaterElement<RentItem>
                  label="Rent Details"
                  items={rentDetails}
                  setItems={setRentDetails}
                  gap={2}
                  separateItems
                  minItems={1}
                  initialItem={{
                    from: "",
                    to: "",
                    amount: "",
                    amountInput: "",
                    metro: "",
                    landlordName: "",
                    landlordPan: "",
                  }}
                  renderItem={(item, index, handleChange) => {
                    const landlordPanError =
                      item.landlordPan.length > 0 && !PAN_REGEX.test(item.landlordPan);
                    const tryRentPeriodChange = (
                      field: "from" | "to",
                      value: string,
                    ) => {
                      const nextItems = rentDetails.map((r, i) =>
                        i === index ? { ...r, [field]: value } : r,
                      );
                      const err = getRentPeriodOverlapError(nextItems, index);
                      if (err) {
                        setRentPeriodSnackbar({ open: true, message: err });
                        return;
                      }
                      handleChange(field, value);
                    };
                    return (
                      <Grid container spacing={2} width={"100%"}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <MonthYearPickerElement
                            label="Rental Period - From"
                            value={item.from ? dayjs(item.from, "YYYY-MM") : null}
                            onChange={(v) =>
                              tryRentPeriodChange("from", v ? v.format("YYYY-MM") : "")
                            }
                            min={fyStart}
                            max={fyEnd}
                            width="100%"
                            required
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <MonthYearPickerElement
                            label="Rental Period - To"
                            value={item.to ? dayjs(item.to, "YYYY-MM") : null}
                            onChange={(v) =>
                              tryRentPeriodChange("to", v ? v.format("YYYY-MM") : "")
                            }
                            min={item.from ? dayjs(item.from, "YYYY-MM") : fyStart}
                            max={fyEnd}
                            width="100%"
                            required
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <TextFieldElement
                            label="Amount"
                            type="text"
                            value={formatNumberForTyping(
                              item.amountInput !== ""
                                ? item.amountInput
                                : item.amount === ""
                                  ? ""
                                  : String(item.amount),
                              COMMA_SEPARATION,
                            )}
                            onChange={(e) => {
                              const raw = parseNumberForTyping(e.target.value);

                              if (raw === "") {
                                handleChange("amountInput", "");
                                handleChange("amount", "");
                              } else {
                                handleChange("amountInput", raw);
                              }
                            }}
                            onBlur={() => {
                              const raw =
                                item.amountInput !== ""
                                  ? item.amountInput
                                  : item.amount === ""
                                    ? ""
                                    : String(item.amount);
                              const parsed =
                                raw === ""
                                  ? ""
                                  : parseNumberByCommaSeparation(
                                    raw,
                                    COMMA_SEPARATION,
                                  );
                              handleChange("amount", raw === "" ? "" : parsed);
                            }}
                            fullWidth
                            required
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <SingleSelectElement
                            label="Non Metro / Metro"
                            value={item.metro}
                            options={RENT_METRO_OPTIONS}
                            onChange={(value) => handleChange("metro", value ?? "")}
                            fullWidth
                            required
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <TextFieldElement
                            label="Landlord Name"
                            value={item.landlordName}
                            onChange={(e) =>
                              handleChange("landlordName", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <TextFieldElement
                            label="Landlord PAN"
                            value={item.landlordPan}
                            onChange={(e) =>
                              handleChange("landlordPan", formatPANNumber(e.target.value))
                            }
                            placeholder="AAAAA1234A"
                            fullWidth
                            required
                          />
                        </Grid>
                      </Grid>
                    );
                  }}
                />
              </Box>
            )}
          </Box>
          <SectionDivider />
          </>
          )}

          {/* ====================================================== */}
          {/* HOME LOAN SECTION */}
          {/* ====================================================== */}
          <Box>
            <ToggleSwitch
              label="Is the employee repaying home loan for a self occupied house property?"
              checked={hasHomeLoan}
              onChange={(e) => setHasHomeLoan(e.target.checked)}
            />

            {hasHomeLoan && (
              <Grid container spacing={2} mt={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextFieldElement
                    label="Principal Paid on Home Loan"
                    type="text"
                    value={formatNumberForTyping(
                      homeLoanPrincipalInput !== ""
                        ? homeLoanPrincipalInput
                        : homeLoanPrincipal === ""
                          ? ""
                          : String(homeLoanPrincipal),
                      COMMA_SEPARATION,
                    )}
                    onChange={(e) => {
                      const raw = parseNumberForTyping(e.target.value);
                      setHomeLoanPrincipalInput(raw);
                      if (raw === "") setHomeLoanPrincipal("");
                    }}
                    onBlur={() => {
                      const raw =
                        homeLoanPrincipalInput !== ""
                          ? homeLoanPrincipalInput
                          : homeLoanPrincipal === ""
                            ? ""
                            : String(homeLoanPrincipal);
                      const parsed =
                        raw === ""
                          ? ""
                          : parseNumberByCommaSeparation(
                            raw,
                            COMMA_SEPARATION,
                          );
                      setHomeLoanPrincipal(raw === "" ? "" : parsed);
                    }}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextFieldElement
                    label="Interest Paid on Home Loan"
                    type="text"
                    value={formatNumberForTyping(
                      homeLoanInterestInput !== ""
                        ? homeLoanInterestInput
                        : homeLoanInterest === ""
                          ? ""
                          : String(homeLoanInterest),
                      COMMA_SEPARATION,
                    )}
                    onChange={(e) => {
                      const raw = parseNumberForTyping(e.target.value);
                      setHomeLoanInterestInput(raw);
                      if (raw === "") setHomeLoanInterest("");
                    }}
                    onBlur={() => {
                      const raw =
                        homeLoanInterestInput !== ""
                          ? homeLoanInterestInput
                          : homeLoanInterest === ""
                            ? ""
                            : String(homeLoanInterest);
                      const parsed =
                        raw === ""
                          ? ""
                          : parseNumberByCommaSeparation(
                            raw,
                            COMMA_SEPARATION,
                          );
                      setHomeLoanInterest(raw === "" ? "" : parsed);
                    }}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextFieldElement
                    label="Name of the Lender"
                    value={homeLoanLenderName}
                    onChange={(e) =>
                      setHomeLoanLenderName(e.target.value)
                    }
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextFieldElement
                    label="Lender PAN"
                    value={homeLoanLenderPan}
                    onChange={(e) =>
                      setHomeLoanLenderPan(formatPANNumber(e.target.value))
                    }
                    placeholder="AAAAA1234A"
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          <SectionDivider />

          {/* ====================================================== */}
          {/* LET OUT PROPERTY SECTION */}
          {/* ====================================================== */}
          <Box>
            <ToggleSwitch
              label="Is the employee receiving rental income from let out property?"
              checked={hasLetOut}
              onChange={(e) => setHasLetOut(e.target.checked)}
            />

            {hasLetOut && (
              <Box mt={2}>
                <RepeaterElement<LetOutProperty>
                  label="Letout Property"
                  items={letOutProperties}
                  setItems={setLetOutProperties}
                  gap={2}
                  separateItems
                  minItems={1}
                  initialItem={{
                    annualRent: "",
                    annualRentInput: "",
                    municipalTax: "",
                    municipalTaxInput: "",
                    repayingLoan: false,
                    principalPaid: "",
                    principalPaidInput: "",
                    interestOnLoan: "",
                    interestOnLoanInput: "",
                    lenderName: "",
                    lenderPan: "",
                  }}
                  renderItem={(item, _index, handleChange) => {
                    const annualRent = Number(item.annualRent || 0);
                    const municipalTax = Number(item.municipalTax || 0);
                    const netAnnualValue = annualRent - municipalTax;
                    const standardDeduction = netAnnualValue * 0.3;
                    const interest = Number(item.interestOnLoan || 0);

                    const netIncome =
                      netAnnualValue -
                      standardDeduction -
                      (item.repayingLoan ? interest : 0);

                    const lenderPanError =
                      item.lenderPan.length > 0 &&
                      !PAN_REGEX.test(item.lenderPan);

                    return (
                      <Stack spacing={2.5} width="100%" divider={<Divider flexItem />}>
                        {/* Rental income */}
                        <Box
                          sx={{
                            bgcolor: "background.paper",
                            borderRadius: 1,
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ mb: 1.5 }}
                          >
                            Rental income
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <TextFieldElement
                                label="Annual Rent Received"
                                type="text"
                                value={formatNumberForTyping(
                                  item.annualRentInput !== ""
                                    ? item.annualRentInput
                                    : item.annualRent === ""
                                      ? ""
                                      : String(item.annualRent),
                                  COMMA_SEPARATION,
                                )}
                                onChange={(e) => {
                                  const raw = parseNumberForTyping(e.target.value);
                                  handleChange("annualRentInput", raw);
                                  if (raw === "") handleChange("annualRent", "");
                                }}
                                onBlur={() => {
                                  if (item.annualRentInput === "") {
                                    handleChange("annualRent", "");
                                    return;
                                  }
                                  const parsed = parseNumberByCommaSeparation(
                                    item.annualRentInput,
                                    COMMA_SEPARATION,
                                  );
                                  handleChange("annualRent", parsed);
                                }}
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <TextFieldElement
                                label="Municipal Taxes Paid"
                                type="text"
                                value={formatNumberForTyping(
                                  item.municipalTaxInput !== ""
                                    ? item.municipalTaxInput
                                    : item.municipalTax === ""
                                      ? ""
                                      : String(item.municipalTax),
                                  COMMA_SEPARATION,
                                )}
                                onChange={(e) => {
                                  const raw = parseNumberForTyping(e.target.value);
                                  handleChange("municipalTaxInput", raw);
                                  if (raw === "") handleChange("municipalTax", "");
                                }}
                                onBlur={() => {
                                  if (item.municipalTaxInput === "") {
                                    handleChange("municipalTax", "");
                                    return;
                                  }
                                  const parsed = parseNumberByCommaSeparation(
                                    item.municipalTaxInput,
                                    COMMA_SEPARATION,
                                  );
                                  handleChange("municipalTax", parsed);
                                }}
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <TextFieldElement
                                label="Net Annual Value"
                                value={netAnnualValue}
                                disabled
                                fullWidth
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <TextFieldElement
                                label="Standard Deduction (@ 30% of Net Annual Value)"
                                value={standardDeduction}
                                disabled
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Repaying home loan toggle */}
                        <Box >
                          <ToggleSwitch
                            label="Repaying Home Loan for This Property"
                            checked={item.repayingLoan}
                            onChange={(e) =>
                              handleChange("repayingLoan", e.target.checked)
                            }
                            size="small"
                          />
                        </Box>

                        {/* Home loan details (when enabled) */}
                        {item.repayingLoan && (
                          <Box
                            sx={{
                              bgcolor: "background.paper",
                              borderRadius: 1,
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              fontWeight={600}
                              sx={{ mb: 2 }}
                            >
                              Home loan details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextFieldElement
                                  label="Principal Paid on Home Loan for Let Out Property"
                                  type="text"
                                  value={formatNumberForTyping(
                                    item.principalPaidInput !== ""
                                      ? item.principalPaidInput
                                      : item.principalPaid === ""
                                        ? ""
                                        : String(item.principalPaid),
                                    COMMA_SEPARATION,
                                  )}
                                  onChange={(e) =>
                                    handleChange(
                                      "principalPaidInput",
                                      parseNumberForTyping(e.target.value),
                                    )
                                  }
                                  onBlur={() => {
                                    const raw =
                                      item.principalPaidInput !== ""
                                        ? item.principalPaidInput
                                        : item.principalPaid === ""
                                          ? ""
                                          : String(item.principalPaid);
                                    const parsed =
                                      raw === ""
                                        ? ""
                                        : parseNumberByCommaSeparation(
                                          raw,
                                          COMMA_SEPARATION,
                                        );
                                    handleChange(
                                      "principalPaid",
                                      raw === "" ? "" : parsed,
                                    );
                                  }}
                                  fullWidth
                                  required
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextFieldElement
                                  label="Interest Paid on Home Loan"
                                  type="text"
                                  value={formatNumberForTyping(
                                    item.interestOnLoanInput !== ""
                                      ? item.interestOnLoanInput
                                      : item.interestOnLoan === ""
                                        ? ""
                                        : String(item.interestOnLoan),
                                    COMMA_SEPARATION,
                                  )}
                                  onChange={(e) =>
                                    handleChange(
                                      "interestOnLoanInput",
                                      parseNumberForTyping(e.target.value),
                                    )
                                  }
                                  onBlur={() => {
                                    const raw =
                                      item.interestOnLoanInput !== ""
                                        ? item.interestOnLoanInput
                                        : item.interestOnLoan === ""
                                          ? ""
                                          : String(item.interestOnLoan);
                                    const parsed =
                                      raw === ""
                                        ? ""
                                        : parseNumberByCommaSeparation(
                                          raw,
                                          COMMA_SEPARATION,
                                        );
                                    handleChange(
                                      "interestOnLoan",
                                      raw === "" ? "" : parsed,
                                    );
                                  }}
                                  fullWidth
                                  required
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextFieldElement
                                  label="Name of the Lender"
                                  value={item.lenderName}
                                  onChange={(e) =>
                                    handleChange("lenderName", e.target.value)
                                  }
                                  fullWidth
                                  required
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextFieldElement
                                  label="Lender PAN"
                                  value={item.lenderPan}
                                  onChange={(e) =>
                                    handleChange(
                                      "lenderPan",
                                      formatPANNumber(e.target.value),
                                    )
                                  }
                                  placeholder="AAAAA1234A"
                                  fullWidth
                                  required
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        )}

                        {/* Net income / loss (always visible) */}
                        <Box
                          sx={{
                            bgcolor: "background.paper",
                            borderRadius: 1,
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <TextFieldElement
                            label="Net Income / Loss from House Property"
                            value={netIncome}
                            disabled
                            fullWidth
                          />
                        </Box>
                      </Stack>
                    );
                  }}
                />
              </Box>
            )}
          </Box>
          <SectionDivider />
          {/* ========================Previous Employment Code is commented beneath pste it here once backend is done============================= */}
          {(() => {
            const showBlock = (isLoadingDeclaration && startEnd) || mappedSections.length > 0;
            if (!showBlock) return null;
            return (
              <>
                {isLoadingDeclaration && startEnd ? (
                  <Box py={3} display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary">
                      Loading exemption sections…
                    </Typography>
                  </Box>
                ) : (
                  mappedSections.map((section) => {
                    const sectionItems = exemptionData[section.id] || [];

                    return (
                      <Box key={section.id} mt={4}>
                        <RepeaterElement<ExemptionRow>
                          items={sectionItems}
                          label={`${section.title} · Max limit: ${Number(section.maxLimit).toLocaleString()}`}
                          minItems={0}
                          gap={2}
                          initialItem={{ optionId: "", amount: "", amountInput: "" }}
                          setItems={(items) =>
                            setExemptionData((prev) => {
                              const resolvedItems =
                                typeof items === "function"
                                  ? items(prev[section.id] || [])
                                  : items;

                              return {
                                ...prev,
                                [section.id]: resolvedItems,
                              };
                            })
                          }
                          renderItem={(item, index, handleChange) => {
                            const selectedOption = section.options.find((o) => o.value === item.optionId);
                            const maxLimitNum = selectedOption ? Number(selectedOption.maxLimit) : undefined;
                            const optionIdsTakenByOtherRows = new Set(
                              sectionItems
                                .filter((_, i) => i !== index)
                                .map((r) => r.optionId)
                                .filter(Boolean),
                            );
                            const exemptionSelectOptions = section.options
                              .filter(
                                (o) =>
                                  !optionIdsTakenByOtherRows.has(o.value) ||
                                  o.value === item.optionId,
                              )
                              .map((o) => ({ label: o.label, value: o.value }));
                            return (
                              <Box
                                width="60%"
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(0, 1fr) minmax(100px, 30%) 172px",
                                  columnGap: 2,
                                  alignItems: "start",
                                }}
                              >
                                <SingleSelectElement
                                  label="Select Exemption"
                                  value={item.optionId}
                                  options={exemptionSelectOptions}
                                  onChange={(value) => handleChange("optionId", value)}
                                  sx={{ width: "100%", minWidth: 0 }}
                                />
                                <TextFieldElement
                                  label="Amount"
                                  value={formatNumberForTyping(
                                    item.amountInput !== ""
                                      ? item.amountInput
                                      : item.amount === ""
                                        ? ""
                                        : item.amount,
                                    COMMA_SEPARATION
                                  )}
                                  onChange={(e) =>
                                    handleChange("amountInput", parseNumberForTyping(e.target.value))
                                  }
                                  onBlur={() => {
                                    const raw =
                                      item.amountInput !== ""
                                        ? item.amountInput
                                        : item.amount === ""
                                          ? ""
                                          : item.amount;
                                    const parsed = parseNumberByCommaSeparation(raw, COMMA_SEPARATION);
                                    setExemptionData((prev) => {
                                      const sectionItems = prev[section.id] || [];
                                      if (raw === "" || isNaN(parsed)) {
                                        return {
                                          ...prev,
                                          [section.id]: sectionItems.map((r, i) =>
                                            i === index ? { ...r, amount: "", amountInput: "" } : r
                                          ),
                                        };
                                      }
                                      const capped =
                                        maxLimitNum != null && parsed > maxLimitNum ? maxLimitNum : parsed;
                                      const valueStr = String(capped);
                                      return {
                                        ...prev,
                                        [section.id]: sectionItems.map((r, i) =>
                                          i === index ? { ...r, amount: valueStr, amountInput: "" } : r
                                        ),
                                      };
                                    });
                                  }}
                                  sx={{ width: "100%", minWidth: 0 }}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-end",
                                    alignSelf: "end",
                                    minHeight: 40,
                                    pb: 0.5,
                                  }}
                                >
                                  {selectedOption ? (
                                    <Chip
                                      size="small"
                                      label={`Max limit: ${Number(selectedOption.maxLimit).toLocaleString()}`}
                                      sx={{
                                        fontWeight: 600,
                                        bgcolor: "grey.100",
                                        color: "text.secondary",
                                        "& .MuiChip-label": { fontSize: "0.75rem" },
                                      }}
                                    />
                                  ) : null}
                                </Box>
                              </Box>
                            );
                          }}
                        />
                      </Box>
                    );
                  })
                )}
              </>
            );
          })()}

          {/* ====================================================== */}
          {/* ACTION BUTTONS */}
          {/* ====================================================== */}
          <Stack direction="row" justifyContent="flex-end" gap={2}>
            {/* <Button variant="outlined">Compare Tax Regimes</Button> */}
            <Tooltip
              title={
                isSubmitDisabled && validationErrors.length > 0 ? (
                  <Stack spacing={0.5}>
                    {validationErrors.map((err, i) => (
                      <Typography variant="inherit" key={i} display="block">
                        {err}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  ""
                )
              }
              disableHoverListener={!isSubmitDisabled}
            >
              <Box component="span" sx={{ display: "inline-block" }}>
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSubmitDisabled}
                >
                  {isSubmitting ? "Submitting…" : "Submit"}
                </PrimaryButton>
              </Box>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
      {rentPeriodSnackbar.open && (
        <Snackbar
          message={rentPeriodSnackbar.message}
          color="error"
          onClose={() =>
            setRentPeriodSnackbar((s) => ({ ...s, open: false }))
          }
        />
      )}
      {submitSnackbar.open && (
        <Snackbar
          message={submitSnackbar.message}
          color={submitSnackbar.color}
          onClose={() => setSubmitSnackbar((s) => ({ ...s, open: false }))}
        />
      )}
    </Card>
  );
}

{/* <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Previous Employment
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextFieldElement
                  label="Income After Exemption"
                  type="text"
                  value={formatNumberForTyping(
                    previousEmployment.incomeAfterExemptionInput !== ""
                      ? previousEmployment.incomeAfterExemptionInput
                      : previousEmployment.incomeAfterExemption === ""
                        ? ""
                        : String(previousEmployment.incomeAfterExemption),
                    COMMA_SEPARATION,
                  )}
                  onChange={(e) =>
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      incomeAfterExemptionInput: parseNumberForTyping(
                        e.target.value,
                      ),
                    }))
                  }
                  onBlur={() => {
                    if (
                      previousEmployment.incomeAfterExemptionInput === ""
                    ) {
                      setPreviousEmployment((prev) => ({
                        ...prev,
                        incomeAfterExemption: "",
                      }));
                      return;
                    }
                    const parsed = parseNumberByCommaSeparation(
                      previousEmployment.incomeAfterExemptionInput,
                      COMMA_SEPARATION,
                    );
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      incomeAfterExemption: parsed,
                    }));
                  }}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextFieldElement
                  label="Income Tax Paid"
                  type="text"
                  value={formatNumberForTyping(
                    previousEmployment.incomeTaxPaidInput !== ""
                      ? previousEmployment.incomeTaxPaidInput
                      : previousEmployment.incomeTaxPaid === ""
                        ? ""
                        : String(previousEmployment.incomeTaxPaid),
                    COMMA_SEPARATION,
                  )}
                  onChange={(e) =>
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      incomeTaxPaidInput: parseNumberForTyping(e.target.value),
                    }))
                  }
                  onBlur={() => {
                    if (previousEmployment.incomeTaxPaidInput === "") {
                      setPreviousEmployment((prev) => ({
                        ...prev,
                        incomeTaxPaid: "",
                      }));
                      return;
                    }
                    const parsed = parseNumberByCommaSeparation(
                      previousEmployment.incomeTaxPaidInput,
                      COMMA_SEPARATION,
                    );
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      incomeTaxPaid: parsed,
                    }));
                  }}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextFieldElement
                  label="PF Paid"
                  type="text"
                  value={formatNumberForTyping(
                    previousEmployment.pfPaidInput !== ""
                      ? previousEmployment.pfPaidInput
                      : previousEmployment.pfPaid === ""
                        ? ""
                        : String(previousEmployment.pfPaid),
                    COMMA_SEPARATION,
                  )}
                  onChange={(e) =>
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      pfPaidInput: parseNumberForTyping(e.target.value),
                    }))
                  }
                  onBlur={() => {
                    if (previousEmployment.pfPaidInput === "") {
                      setPreviousEmployment((prev) => ({
                        ...prev,
                        pfPaid: "",
                      }));
                      return;
                    }
                    const parsed = parseNumberByCommaSeparation(
                      previousEmployment.pfPaidInput,
                      COMMA_SEPARATION,
                    );
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      pfPaid: parsed,
                    }));
                  }}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextFieldElement
                  label="PT Paid"
                  type="text"
                  value={formatNumberForTyping(
                    previousEmployment.ptPaidInput !== ""
                      ? previousEmployment.ptPaidInput
                      : previousEmployment.ptPaid === ""
                        ? ""
                        : String(previousEmployment.ptPaid),
                    COMMA_SEPARATION,
                  )}
                  onChange={(e) =>
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      ptPaidInput: parseNumberForTyping(e.target.value),
                    }))
                  }
                  onBlur={() => {
                    if (previousEmployment.ptPaidInput === "") {
                      setPreviousEmployment((prev) => ({
                        ...prev,
                        ptPaid: "",
                      }));
                      return;
                    }
                    const parsed = parseNumberByCommaSeparation(
                      previousEmployment.ptPaidInput,
                      COMMA_SEPARATION,
                    );
                    setPreviousEmployment((prev) => ({
                      ...prev,
                      ptPaid: parsed,
                    }));
                  }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box> */}