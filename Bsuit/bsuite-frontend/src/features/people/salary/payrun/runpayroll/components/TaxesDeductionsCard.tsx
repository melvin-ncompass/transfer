import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  LinearProgress,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

type TaxesDeductions = {
  incomeTax: number;
  postTaxDeductions: number;
};

interface TaxesDeductionsCardProps {
  data: TaxesDeductions;
  total: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

interface TaxRowProps {
  label: string;
  amount: number;
  total: number;
  color?: string;
}

function TaxRow({ label, amount, total, color = "primary.main" }: TaxRowProps) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;
  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {formatCurrency(amount)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: "grey.100",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

export function TaxesDeductionsCard({ data, total }: TaxesDeductionsCardProps) {
  const grandTotal = data.incomeTax + data.postTaxDeductions;

  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AccountBalanceIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            Taxes & Deductions
          </Typography>
        </Box>

        <TaxRow
          label="Income Tax"
          amount={data.incomeTax}
          total={total}
          color="#f44336"
        />
        <TaxRow
          label="Post-Tax Deductions"
          amount={data.postTaxDeductions}
          total={total}
          color="#9c27b0"
        />

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            Total
          </Typography>
          <Typography variant="subtitle1" fontWeight={800} color="error.main">
            {formatCurrency(grandTotal)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
