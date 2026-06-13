import { Fragment, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import dayjs from "dayjs";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { useGetTdsSheetQuery } from "../api/payrun.api";

import type { TdsSheetResponse } from "../api/payrun.api";
import { useGetImagesQuery } from "../../../../../setting/companyDetails/api/companyBranding.api";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);

function inferNewTaxRegime(d: TdsSheetResponse): boolean {
  if (typeof d.isNewTaxRegime === "boolean") return d.isNewTaxRegime;
  const t = `${d.taxConfigName ?? ""} ${d.configName ?? ""}`.toLowerCase();
  return t.includes("new tax") || t.includes("new regime");
}

function buildHraRows(
  hraMonthlyData: TdsSheetResponse["hraMonthlyData"],
): { monthLabel: string; key: string }[] {
  if (!hraMonthlyData) return [];
  return Object.keys(hraMonthlyData)
    .sort()
    .map((key) => ({
      key,
      monthLabel: dayjs(`${key}-01`).isValid()
        ? dayjs(`${key}-01`).format("MMM YYYY")
        : key,
    }));
}

const sheetStyles = {
  fontFamily: "Arial, sans-serif",
  margin: 0,
  padding: 0,
  minHeight: "100%",
  "& .content": {
    p: "20px",
    minHeight: "calc(100vh - 80px)",
    boxSizing: "border-box",
  },
  "& .note": { fontSize: "9pt" },
  "& table": {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ccc",
  },
  "& table th, & table td": {
    p: "8px",
    textAlign: "left",
  },
  "& table th": {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ccc",
  },
  "& table td": {
    borderRight: "1px solid #ccc",
  },
  "& table.employee-table": { border: "none" },
  "& table.employee-table th, & table.employee-table td": {
    border: "none",
    p: "8px",
    textAlign: "left",
  },
  "& table.employee-table th": { backgroundColor: "transparent", fontWeight: 700 },
  "& .secondary": { background: "rgb(206, 205, 208)" },
  "& .bold": { fontWeight: 700 },
  "& .container": {
    display: "flex",
    justifyContent: "space-between",
  },
  "& .rounded-border": {
    border: "1px solid gray",
    borderRadius: "10px",
    p: "10px",
  },
  "& .left-column": { flex: 1, textAlign: "left" },
  "& .right-column": { flex: 1, textAlign: "right" },
  "& .no_margin_space": { m: 0 },
  "& .no_wrap_style": { whiteSpace: "nowrap" },
  "& .text-end": { textAlign: "right" },
} as const;

export function TdsSheetModal({
  open,
  onClose,
  payrunId,
  employeeId,
  employeeName,
  payPeriodLabel,
  onDownload,
  isDownloading,
  downloadingEmployeeId,
}: {
  open: boolean;
  onClose: () => void;
  payrunId: number;
  employeeId: number;
  employeeName?: string;
  /** e.g. "March 2026" — shown as the pay month in the sheet heading. */
  payPeriodLabel?: string;
  onDownload: () => void;
  isDownloading: boolean;
  downloadingEmployeeId: number | null;
}) {
  const { data: headerData } = useGetHeaderDataQuery(undefined, { skip: !open });
  const { data: imagesData } = useGetImagesQuery();
  const currencySymbol =
    headerData?.data?.reportingCurrency?.split(" - ")[0]?.trim() ?? "";
  const headerUrl =imagesData?.data?.headerUrl?.trim() || undefined;
  // const headerUrl2=imagesData?.data?.headerUrl?.trim() || undefined;

  const { data, isLoading, isError } = useGetTdsSheetQuery(
    { payrunId, employeeId },
    { skip: !open },
  );

  const d = data as TdsSheetResponse | undefined;

  const grossEarnings = useMemo(() => {
    const earnings = d?.aggregatedEarnings ?? {};
    return Object.entries(earnings).map(([earningName, row]) => ({
      earningName,
      actual: row.actual,
      projection: row.projection,
      gross: row.gross,
    }));
  }, [d]);

  const chapterSixSections = d?.exemptionDetails ?? [];

  const hraRowMeta = useMemo(() => buildHraRows(d?.hraMonthlyData), [d]);

  const hasHraRows = hraRowMeta.length > 0;
  const isNewTaxRegime = d ? inferNewTaxRegime(d) : false;

  const preTaxLines = d?.preTaxEarningLines ?? [];
  const totalPreTax = d?.totalPreTax ?? 0;

  const prevEmp = d?.prevEmploymentData;
  const prevEmpIncomeAfterExemptions = prevEmp?.prevEarnings ?? 0;
  const prevEmpPtPaid = prevEmp?.ptPaid ?? 0;
  const taxableIncomePrevEmp = d?.taxableIncomeFromPrevEmp ?? 0;
  const prevEmploymentTaxPaid =
    d?.prevEmploymentTaxPaid ?? prevEmp?.previouslyPaid ?? 0;

  const loanSelf = d?.loanOnSelfOccupiedProperty ?? 0;
  const incomeLossLetOut = d?.incomeLossForLetOut ?? 0;
  const incomeLossProperty = d?.incomeLossForProperty ?? 0;
  const incomeLossPropertySignPrefix = "";

  const taxPaidForPrevMonths = d?.taxPaidForPrevMonths ?? 0;
  const hraAmount = d?.hraAmount ?? 0;

  const taxOnSlabIncome = d?.taxOnSlabIncome ?? 0;
  const appliedRebateAmount = d?.appliedRebateAmount ?? 0;
  const reliefAmount = d?.reliefAmount ?? 0;
  const taxAfterRebateRelief = d?.taxAfterRebateRelief ?? 0;
  const totalSurchargeAmount = d?.totalSurchargeAmount ?? 0;
  const cessAmount = d?.cessAmount ?? 0;

  const oldRegimeLoanNote = `${currencySymbol}${fmt(200000)}`;
  const cessSurchargeNote =
    totalSurchargeAmount > 0 ? "(on surcharge + tax)" : "";

  const formattedFirstPayPeriod = payPeriodLabel ?? "—";
  const displayName = employeeName ?? d?.employeeName ?? "";
  const taxRegimeDisplayName = d?.taxConfigName ?? d?.configName ?? "—";

  const isDownloadingThis = isDownloading && downloadingEmployeeId === employeeId;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100vw", md: "min(960px, 100vw)" },
            maxWidth: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Box sx={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
            TDS Sheet
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            px: 0,
            py: 0,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {isLoading && (
            <Box>
              {[...Array(14)].map((_, i) => (
                <Skeleton key={i} height={26} sx={{ mb: 1.1, borderRadius: 1 }} />
              ))}
            </Box>
          )}

          {isError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load TDS sheet.
            </Alert>
          )}

          {d && (
            <Box sx={sheetStyles}>
              {headerUrl ? (
                <div style={{ padding: "20px 20px 0 20px" }}>
                  <img
                    src={headerUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : null}
              <div className="content">
                <hr />
                <h2>TDS Sheet for the Month of {formattedFirstPayPeriod}</h2>
                <table className="employee-table" style={{ marginBottom: 10 }}>
                  <tbody>
                    <tr>
                      <td>Employee Name</td>
                      <td>PAN</td>
                      <td>Tax Regime</td>
                    </tr>
                    <tr>
                      <th>{displayName}</th>
                      <th>{d.panNumber}</th>
                      <th>{taxRegimeDisplayName}</th>
                    </tr>
                  </tbody>
                </table>
                <hr />
                <p style={{ fontWeight: "bold" }}>
                  Details of salary paid and any other income and tax deducted
                </p>
                <table>
                  <tbody>
                    <tr>
                      <th>Particulars</th>
                      <th className="text-end">Actual</th>
                      <th className="text-end">Projection</th>
                      <th className="text-end">Total</th>
                    </tr>
                    <tr>
                      <td className="bold">1) Gross Earnings</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    {grossEarnings.map((row) => (
                      <tr key={row.earningName}>
                        <td>{row.earningName}</td>
                        <td className="text-end">
                          {currencySymbol}
                          <span className="balance_amt">{fmt(row.actual)}</span>
                        </td>
                        <td className="text-end">
                          {currencySymbol}
                          <span className="balance_amt">{fmt(row.projection)}</span>
                        </td>
                        <td className="text-end">
                          {currencySymbol}
                          <span className="balance_amt">{fmt(row.gross)}</span>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="bold">Total Income</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.totalEarnings)}</span>
                      </td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">2) Allowance to the extent exempt under Section 10</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>House Rent Allowance</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(hraAmount)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td className="bold">
                        Total of Allowance to the extent exempt under Section 10
                      </td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(hraAmount)}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>3) Total After Exemption (1-2)</th>
                      <th />
                      <th />
                      <th className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.totalAfterExemptions)}</span>
                      </th>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">4) Taxable Income under Previous employment</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>i) Income After Exemptions</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(prevEmpIncomeAfterExemptions)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>ii) Less: Professional Tax</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(prevEmpPtPaid)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td className="bold">Total taxable income under Previous employment</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(taxableIncomePrevEmp)}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>5) Gross Total (3+4)</th>
                      <th />
                      <th />
                      <th className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.grossTotal)}</span>
                      </th>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">6) Under Section 16</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>a) Standard Deduction</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.standardDeduction)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td className="bold">Total Under Section 16</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.section16Total)}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>7) Income Chargeable Under the Head Salaries (5-6)</th>
                      <th />
                      <th />
                      <th className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.incomeUnderHeadSalaries)}</span>
                      </th>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">8) Deductions under Chapter VI-A</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    {chapterSixSections.map((section, sIdx) => (
                      <Fragment key={`ch6-${section.sectionName ?? sIdx}`}>
                        <tr>
                          <td className="bold">{section.sectionName ?? "Section"}</td>
                          <td />
                          <td />
                          <td />
                        </tr>
                        {(section.subsections ?? []).map((sub, i) => (
                          <tr key={`${sIdx}-${i}-${sub.label ?? ""}`}>
                            <td style={{ width: "100%" }}>
                              <span style={{ float: "left" }}>
                                {/* {sub.subsectionCode ?? sub.index ?? i + 1}){" "} */}
                                {sub.label ?? "—"}
                              </span>
                              <span style={{ float: "right" }}>
                                {/* {currencySymbol} */}
                                {/* <span className="balance_amt">
                                  {(sub.givenAmount ?? 0) === 0 ? "" : fmt(sub.givenAmount ?? 0)}
                                </span> */}
                              </span>
                            </td>
                            <td className="text-end">
                              {currencySymbol}
                              <span className="balance_amt">
                                {fmt(sub.consideredAmount ?? 0)}
                              </span>
                            </td>
                            <td />
                            <td />
                          </tr>
                        ))}
                        <tr>
                          <td className="bold">Section Total</td>
                          <td />
                          <td />
                          <td className="bold text-end">
                            {currencySymbol}
                            <span className="balance_amt">{fmt(section.sectionTotal ?? 0)}</span>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                    <tr>
                      <td className="bold">Total of Deductions under Chapter VI-A</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.totalDeclaredExemptions)}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>9) Pre-tax Benefit</th>
                      <th />
                      <th />
                      <th className="text-end" />
                    </tr>
                    {preTaxLines.map((line) => (
                      <tr key={line.earningName}>
                        <td>{line.earningName}</td>
                        <td />
                        <td />
                        <td className="text-end">
                          {currencySymbol}
                          <span className="balance_amt">{fmt(line.amount)}</span>
                        </td>
                      </tr>
                    ))}
                    {preTaxLines.length === 0 ? (
                      <tr>
                        {/* <td colSpan={4} style={{ fontStyle: "italic", color: "#666" }}>
                          
                        </td> */}
                        
                      </tr>
                    ) : null}
                    <tr>
                      <td className="bold">Total Pre-Tax Benefit</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(totalPreTax)}</span>
                      </td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <th>10) Total Income (7-8-9)</th>
                      <th />
                      <th />
                      <th className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.totalIncome)}</span>
                      </th>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">11) Any other income reported by the employee</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>Interest Paid on Home Loan</td>
                      <td className="text-end">
                        {currencySymbol}<span className="balance_amt">{loanSelf !== 0 ? "-" : ""}{fmt(loanSelf)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>Let Out Property</td>
                      <td className="text-end no_wrap_style">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(incomeLossLetOut)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td className="bold">Total Income From Other Sources</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        {incomeLossPropertySignPrefix}
                        <span className="balance_amt">{fmt(incomeLossProperty)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="note">
                        Note: A maximum of {oldRegimeLoanNote} is allowed as exemption for housing
                        loan interests on Self Occupied House Property and Let Out Property
                      </td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <th>12) Gross Total Income (Round By 10 Rupees) (10+11)</th>
                      <th />
                      <th />
                      <th className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.totalIncomeAfterHouseLoan)}</span>
                      </th>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">13) Tax Calculation</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>
                        <table>
                          <tbody>
                            <tr>
                              <th>Taxable Income Range</th>
                              <th className="text-end">Tax Amount</th>
                            </tr>
                            {(d.slabBreakdown ?? []).map((slab, idx) => (
                              <tr key={`${slab.from}-${slab.to}-${idx}`}>
                                <td>
                                  <div>
                                    From {currencySymbol}
                                    <span className="balance_amt">{fmt(slab.from)}</span> to{" "}
                                    {currencySymbol}
                                    <span className="balance_amt">{fmt(slab.to)}</span>
                                  </div>
                                  <div>(Tax : {slab.tax}%)</div>
                                </td>
                                <td className="text-end">
                                  {currencySymbol}
                                  <span className="balance_amt">{fmt(slab.taxAmount)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td className="bold">Tax on total Income</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(taxOnSlabIncome)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="bold">Less : Rebate Under Section 87A(a)</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(appliedRebateAmount)}</span>
                      </td>
                    </tr>
                    {isNewTaxRegime ? (
                      <tr>
                        <td className="bold">Less : Relief Under Section 87A(b)</td>
                        <td />
                        <td />
                        <td className="bold text-end">
                          {currencySymbol}
                          <span className="balance_amt">{fmt(reliefAmount)}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td className="note">
                        Note: If taxable income is less than {currencySymbol}
                        <span className="balance_amt">{fmt(d.taxableIncomeThreshold)}</span>, tax
                        rebate of a maximum of {currencySymbol}
                        <span className="balance_amt">{fmt(d.rebateAmountConfig)}</span> is
                        provided under Section 87A
                      </td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <th className="bold">14) Tax on total Income</th>
                      <th />
                      <th />
                      <th className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(taxAfterRebateRelief)}</span>
                      </th>
                    </tr>
                    <tr>
                      <td>Surcharge Amount</td>
                      <td />
                      <td />
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(totalSurchargeAmount)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Education Cess 4% {cessSurchargeNote}
                      </td>
                      <td />
                      <td />
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(cessAmount)}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        15) Tax Payable including Education Cess minus of Relief Under Section 89
                      </th>
                      <th />
                      <th />
                      <th className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.beforePrevTax)}</span>
                      </th>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ccc" }}>
                      <td className="bold">16) Tax Deducted at Source u/s 192</td>
                      <td />
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>i) TDS till last month</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(taxPaidForPrevMonths)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>ii) TDS for {formattedFirstPayPeriod}</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.incomeTax)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td>iii) TDS by Previous Employer</td>
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(prevEmploymentTaxPaid)}</span>
                      </td>
                      <td />
                      <td />
                    </tr>
                    <tr>
                      <td className="bold">A) Total Tax Deducted at Source (i+ii+iii)</td>
                      <td />
                      <td />
                      <td className="bold text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.taxDeductedAtSource)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Tax Payable / Refundable (15 - 16(A))</td>
                      <td />
                      <td />
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.taxPayable)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>TDS per month for the upcoming months</td>
                      <td />
                      <td />
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.upcomingTds)}</span>
                      </td>
                    </tr>
                    <tr className="secondary">
                      <td>TDS for {formattedFirstPayPeriod}</td>
                      <td />
                      <td />
                      <td className="text-end">
                        {currencySymbol}
                        <span className="balance_amt">{fmt(d.incomeTax)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {hasHraRows ? (
                  <>
                    <hr style={{ marginTop: 30, marginBottom: 30 }} />
                    <p>HRA exemption calculation under Section 10 (Monthly Based Exemption)</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Months</th>
                          <th className="no_wrap_style">Rent Paid</th>
                          <th>
                            % of Earned Basic
                            <br />
                            (Metro 50%, Non-Metro 40%)
                          </th>
                          <th>HRA Received</th>
                          <th>Rent Paid Over 10% of Basic</th>
                          <th>Exemption Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hraRowMeta.map(({ key, monthLabel }) => {
                          const row = d.hraMonthlyData?.[key];
                          if (!row) return null;
                          return (
                            <tr key={key}>
                              <td className="no_wrap_style">{monthLabel}</td>
                              <td className="text-end no_wrap_style">
                                {currencySymbol}
                                <span className="balance_amt">{fmt(row.rentPaid)}</span>
                              </td>
                              <td className="text-end">
                                {currencySymbol}
                                <span className="balance_amt">{fmt(row.percentOfBasic)}</span>
                              </td>
                              <td className="text-end">
                                {currencySymbol}
                                <span className="balance_amt">{fmt(row.hraReceived)}</span>
                              </td>
                              <td className="text-end">
                                {currencySymbol}
                                <span className="balance_amt">{fmt(row.rentOverBasic)}</span>
                              </td>
                              <td className="text-end">
                                {currencySymbol}
                                <span className="balance_amt">{fmt(row.monthExemption)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="container rounded-border" style={{ marginTop: 35 }}>
                      <div className="left-column no_margin_space">
                        <p style={{ fontSize: 16 }} className="bold">
                          Total House Rent Allowance Exemption Amount
                        </p>
                        <p style={{ fontSize: 14, color: "grey" }}>
                          Least amount of the three columns (% of Earned Basic, HRA Received and
                          Excess of Rent Paid)
                        </p>
                      </div>
                      <div className="right-column no_margin_space">
                        <p style={{ textAlign: "right" }} className="bold text-end">
                          {currencySymbol}
                          <span className="balance_amt">{fmt(hraAmount)}</span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            px: 2.5,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Button
            fullWidth
            size="small"
            variant="contained"
            disableElevation
            startIcon={
              isDownloadingThis ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={onDownload}
            disabled={isDownloadingThis}
            sx={{
              py: 0.75,
              borderRadius: 1.25,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Download TDS Sheet
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
