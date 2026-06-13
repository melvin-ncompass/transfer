import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { PayrunSummary } from "../api/payrun.api";
import { fmt } from "../utils";

export function PayDayCard({ summary }: { summary: PayrunSummary }) {
  return (
    <Box
      sx={{
        bgcolor: "#e8f5e9",
        borderRadius: 2,
        p: 2,
        minWidth: 130,
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        letterSpacing={1}
        display="block"
        mb={0.5}
      >
        PAY DAY
      </Typography>
      <Typography variant="h3" fontWeight={800} color="text.primary" lineHeight={1}>
        {dayjs(summary.payableDate).format("D")}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        {dayjs(summary.payableDate).format("MMMM YYYY")}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
        {summary.noOfEmployees} Employees
      </Typography>
    </Box>
  );
}

export function PeriodCostCard({ summary }: { summary: PayrunSummary }) {
  const period = dayjs(summary.cycleStart).format("MMMM YYYY");
  return (
    <Box sx={{ bgcolor: "#f3e5f5", borderRadius: 2, p: 2.5, flex: 1, minWidth: 200 }}>
      <Typography variant="body2" fontWeight={600} color="#7b1fa2" mb={1.5}>
        Period:{" "}
        <Box component="span" fontWeight={800}>
          {period}
        </Box>
      </Typography>
      <Box display="flex" gap={4}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {fmt(summary.totalCostToCompany)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            letterSpacing={0.5}
          >
            PAYROLL COST
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {fmt(summary.totalNetPay)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            letterSpacing={0.5}
          >
            EMPLOYEES' NET COST
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function TaxesSummaryCard({ summary }: { summary: PayrunSummary }) {
  const pfEmployer = summary.preTaxSums?.["PF- Employer Contribution"] ?? 0;
  const rows = [
    { label: "Income Taxes", value: summary.totalIncomeTax },
    { label: "Post-Tax Deductions", value: summary.postTaxDeductionTotal },
    { label: "PF- Employer Contribution", value: pfEmployer },
  ];
  return (
    <Box sx={{ bgcolor: "#fce4ec", borderRadius: 2, p: 2.5, flex: 1, minWidth: 220 }}>
      <Typography variant="body2" fontWeight={700} color="#c62828" mb={1.5}>
        Taxes & Deductions
      </Typography>
      {rows.map((r) => (
        <Box key={r.label} display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            {r.label}
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            {fmt(r.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
