import { Box, Stack, Typography, Divider } from "@mui/material";
import { DenseTableAtom } from "../../../../../../../components/tables/standard-table/DenseTableAtom";
import type { FlexibleColumn } from "../../../../../../../types/types";

const OVERVIEW_THRESHOLD_TABLE_SX = {
  width: "fit-content",
  maxWidth: "100%",
  "& table": {
    tableLayout: "fixed",
    width: "auto",
  },
  "& .MuiTableCell-root": {
    px: 1.25,
  },
  "& .MuiTableBody-root .MuiTableCell-root:first-of-type, & .MuiTableHead-root .MuiTableCell-root:first-of-type":
    {
      pl: 1.25,
    },
  "& .MuiTableBody-root .MuiTableCell-root:last-of-type, & .MuiTableHead-root .MuiTableCell-root:last-of-type":
    {
      pr: 1.25,
    },
} as const;

function buildThresholdColumns(
  currencySymbol: string,
  labels: { from: string; to: string; rate: string },
): FlexibleColumn[] {
  return [
    {
      id: "from",
      label: `${labels.from} (${currencySymbol})`,
      align: "right",
      headerAlign: "right",
      width: 152,
    },
    {
      id: "to",
      label: `${labels.to} (${currencySymbol})`,
      align: "right",
      headerAlign: "right",
      width: 152,
    },
    {
      id: "rate",
      label: labels.rate,
      width: 136,
    },
  ];
}

export interface ConfigDetailsOverviewProps {
  configDetails: {
    configName: string;
    nonTaxableThreshold: number;
    standardDeduction: number | null;
    cessPercentage: number | null;
    isHRAEnabled: string;
    section87ARebate: number;
  };
  formatCurrency: (value: number | null | undefined) => string;
  taxSlabs: { id: number; from: string; to: string; rate: string }[];
  surchargeThreshold: { id: number; from: string; to: string; rate: string }[];
  currencySymbol: string;
}

export function ConfigDetailsOverview({
  configDetails,
  formatCurrency,
  taxSlabs,
  surchargeThreshold,
  currencySymbol,
}: ConfigDetailsOverviewProps) {
  const taxSlabColumns = buildThresholdColumns(currencySymbol, {
    from: "Income From",
    to: "Income To",
    rate: "Tax Rate (%)",
  });
  const surchargeColumns = buildThresholdColumns(currencySymbol, {
    from: "Surcharge From",
    to: "Surcharge To",
    rate: "Surcharge Rate (%)",
  });

  return (
    <Box sx={{ pt: 1 }}>
      <Box mb={4}>
        <Typography variant="subtitle1" fontWeight={600} mb={2} color="primary.main">
          Basic Information
        </Typography>
        <Stack spacing={1.5} sx={{ ml: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              alignItems: "start",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Config Name:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {configDetails.configName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              alignItems: "start",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Non-Taxable Threshold:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(configDetails.nonTaxableThreshold)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              alignItems: "start",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Standard Deduction:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(configDetails.standardDeduction)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              alignItems: "start",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Cess Percentage:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {configDetails.cessPercentage == null ? "-" : `${configDetails.cessPercentage}%`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              alignItems: "start",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              HRA Enabled:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {configDetails.isHRAEnabled}
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "info.lighter",
              borderRadius: 1,
              borderLeft: "4px solid",
              borderColor: "info.main",
            }}
          >
            <Typography variant="body2" color="text.primary">
              If taxable income is less than {formatCurrency(configDetails.nonTaxableThreshold)}, a tax rebate of
              maximum {formatCurrency(configDetails.section87ARebate)} is provided under Section 87A.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography variant="subtitle1" fontWeight={600} mb={2} color="primary.main">
          Tax Slabs
        </Typography>
        <DenseTableAtom
          columns={taxSlabColumns}
          rows={taxSlabs}
          loading={false}
          ariaLabel="Tax Slabs"
          sx={OVERVIEW_THRESHOLD_TABLE_SX}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2} color="primary.main">
          Surcharge Threshold
        </Typography>
        <Box>
          <DenseTableAtom
            columns={surchargeColumns}
            rows={surchargeThreshold}
            loading={false}
            ariaLabel="Surcharge Threshold"
            sx={OVERVIEW_THRESHOLD_TABLE_SX}
          />
        </Box>
      </Box>
    </Box>
  );
}
