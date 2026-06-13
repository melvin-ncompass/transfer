import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { StandardTable } from "../../../../../components/tables/standard-table";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { useLazyGetDetailedTaxSummaryQuery } from "../../api/insights.api";
import type { GridColDef } from "@mui/x-data-grid";
import { useState } from "react";
import type { StandardTableColumn } from "../../../../../types/types";
import type { Dayjs } from "dayjs";

type Props = {
  row: any;
  taxId: number;
  fromDate?: Dayjs | null;
  toDate?: Dayjs | null;
  commaSeparation: "IN" | "US";
  currency?: string;
  decimalPlaces: boolean;
};

export function TaxSubRowAccordion({
  row,
  taxId,
  fromDate,
  toDate,
  commaSeparation,
  currency,
  decimalPlaces,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const [getDetails, { data, isFetching }] =
    useLazyGetDetailedTaxSummaryQuery();

  const getTaxPercentParam = (): string | undefined => {
    const name = (row.name ?? "").trim();
    const raw = row.taxPercent ?? name;
    if (/manual\s*journal/i.test(name)) return "amount";
    if (/manual\s*transaction/i.test(name)) return "manualJournal";
    const num = parseFloat(String(raw).replace(/%/g, ""));
    if (!Number.isNaN(num)) return String(num);
    return raw ? String(raw) : undefined;
  };

  const handleToggle = (_: any, isExpanded: boolean) => {
    setExpanded(isExpanded);
    if (isExpanded) {
      getDetails({
        fromDate: fromDate?.format("YYYY-MM-DD"),
        toDate: toDate?.format("YYYY-MM-DD"),
        taxId,
        taxPercent: getTaxPercentParam(),
      });
    }
  };

  const formatValue = (val: number) => {
    const formatted = formatCurrencyByCommaSeparation(
      val,
      commaSeparation,
      currency,
      true
    );
    return decimalPlaces ? formatted : formatted.split(".")[0];
  };

  const columns: StandardTableColumn[] = [
    { id: "date", label: "Date" },
    { id: "transactionTypeName", label: "Type" },
    { id: "description", label: "Description" },
    {
      id: "debit",
      label: "Debit",
      align: "right",
      render: (r: any) => formatValue(Number(r.debit)),
    },
    {
      id: "credit",
      label: "Credit",
      align: "right",
      render: (r: any) => formatValue(Number(r.credit)),
    },
    {
      id: "runningBalance",
      label: "Balance",
      align: "right",
      render: (r: any) => formatValue(r.runningBalance),
    },
  ];

  return (
    <Accordion
      expanded={expanded}
      onChange={handleToggle}
      onClick={(e) => e.stopPropagation()}
      disableGutters
      elevation={0}
      sx={{ backgroundColor: "transparent", width: "100%" }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            pl: `${row._depth * 2}rem`,
          }}
        >
          <Typography>{row.name}</Typography>

        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pl: `${row._depth * 2 + 2}rem` }}>
        {isFetching ? (
          <Box display="flex" justifyContent="center" width={"100%"}>
            <CircularProgress />
          </Box>
        ) : (
          <StandardTable
            columns={columns}
            rows={data?.data?.detailedTaxData ?? []}
            sticky
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}
