import { Box, Typography, Divider, TableCell, TableRow } from "@mui/material";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import type { PayrunSummary } from "../api/payrun.api";
import { fmt } from "../utils";

const taxSectionColumns: StandardTableColumn[] = [
  {
    id: "label",
    label: "Tax Name",
    render: (row: { label: string; __isTotal?: boolean }) => (
      <Typography
        variant="body2"
        sx={{
          fontSize: 13,
          color: row.__isTotal ? "text.primary" : "text.secondary",
          fontWeight: row.__isTotal ? 700 : 400,
        }}
      >
        {row.label}
      </Typography>
    ),
  },
  {
    id: "value",
    label: "Total Cost",
    align: "right",
    headerAlign: "right",
    render: (row: { value: number; __isTotal?: boolean }) => (
      <Typography sx={{ fontSize: 13, fontWeight: row.__isTotal ? 700 : 400 }}>
        {fmt(row.value)}
      </Typography>
    ),
  },
];

function TaxSection({
  title,
  rows,
  totalLabel,
}: {
  title: string;
  rows: { label: string; value: number }[];
  totalLabel: string;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const taxRows = [
    ...rows.map((r, i) => ({ id: `tax-${i}-${r.label}`, label: r.label, value: r.value })),
    { id: "tax-total", label: totalLabel, value: total, __isTotal: true as const },
  ];
  return (
    <Box mb={3} width='50%'>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>
        {title}
      </Typography>
      <StandardTable
        minWidth={60}
        columns={taxSectionColumns}
        rows={taxRows}
        renderCustomRow={(row, rowIndex, { rowId, rowRef, highlightBackground }) => {
          if (!row.__isTotal) return null;
          return (
            <TableRow
              key={`${rowId}-${rowIndex}`}
              ref={rowRef}
              sx={{
                bgcolor: "grey.50",
                ...(highlightBackground !== "transparent" && {
                  backgroundColor: highlightBackground,
                }),
              }}
            >
              <TableCell sx={{ fontWeight: 700, fontSize: 13, border: "none" }}>
                {row.label}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, border: "none" }}>
                {fmt(row.value)}
              </TableCell>
            </TableRow>
          );
        }}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0 }}
      />
    </Box>
  );
}

export function TaxesDeductionsTab({ summary }: { summary: PayrunSummary }) {
  const incomeTaxRows = [{ label: "Income Tax", value: summary.totalIncomeTax }];
  const preTaxRows = Object.entries(summary.preTaxSums ?? {}).map(([label, value]) => ({
    label,
    value,
  }));
  const postTaxRows = Object.entries(summary.postTaxSums ?? {}).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <Box>
      <TaxSection title="Income Tax" rows={incomeTaxRows} totalLabel="Total Income Tax" />

      {preTaxRows.length > 0 && (
        <>
          <Divider sx={{ my: 2 }}  />
          <TaxSection
            title="Pre-Tax Deductions"
            rows={preTaxRows}
            totalLabel="Total Pre-Tax Deductions"
          />
        </>
      )}

      {postTaxRows.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <TaxSection
            title="Post-Tax Deduction"
            rows={postTaxRows}
            totalLabel="Total Post-Tax Deductions"
          />
        </>
      )}
    </Box>
  );
}
