import { Divider, Typography } from "@mui/material";
import { Box, useTheme } from "@mui/system";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../../utils/numberFormatter";
import  { useAllAccountOptions } from "../../hooks/useAllAccountOptions";

import type { DetailedJournalResponse } from "../../types/transact.types";
import { ViewSkeleton } from "./ViewSkeleton";

function ViewAdvanceJournal({
  // selectedRow,
  advJournalData,
  isFetchingJournalData,
  transactionType,
}: {
  selectedRow?: any;
  advJournalData: DetailedJournalResponse;
  isFetchingJournalData?: boolean;
  transactionType: any;
}) {
  const theme = useTheme();
  const { data: headerData } = useGetHeaderDataQuery();
  const {contactsData, reportingCurrency: currency} =useAllAccountOptions(
    null,
    false
  );
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  // const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const journalCurrency = advJournalData.data.journalAccounts[0].counterCurrency;

  // const symbol = journalCurrency?.split(" - ")[0];

  const tdsMapping = advJournalData?.data?.tdsMapping;
  const tdsMappingRows =
    tdsMapping &&
      typeof tdsMapping === "object" &&
      !Array.isArray(tdsMapping)
      ? Object.entries(tdsMapping).map(([contactId, amount]) => {
        const contact = (contactsData?.data || []).find(
          (c: any) => String(c.id) === String(contactId),
        );
        const c = contact as { name?: string; firstName?: string; lastName?: string } | undefined;
        const contactName =
          c?.name?.trim() ||
          [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() ||
          `Contact ${contactId}`;
        return { id: contactId, contactName, amount };
      })
      : [];

  const columns: StandardTableColumn[] = [
    {
      id: "name",
      label: "Account Name",
      render: (row: any) => {
        const symbol = row.accountCurrency?.split(" - ")[0];
        return symbol ? `${row.name} (${symbol})` : row.name;
      }
    },
    { id: "type", label: "Type" },
    {
      id: "debit",
      label: "Debit",
      align: "right",
      render: (row: any) =>
        row.debit > 0
          ? formatCurrencyByCommaSeparation(
            row.counterCurrencyAmount,
            commaSeparation,
            row?.counterCurrency?.split(" - ")[0],
          )
          : "",
    },
    {
      id: "credit",
      label: "Credit",
      align: "right",
      render: (row: any) =>
        row.credit > 0
          ? formatCurrencyByCommaSeparation(
            row.counterCurrencyAmount,
            commaSeparation,
            row?.counterCurrency?.split(" - ")[0],
          )
          : "",
    },
    { id: "accountExchangeRate", label: "Exchange Rate", align: "right" },
    {
      id: "accountCurrencyAmount",
      label: "Converted Amount",
      align: "right",
      render: (row: any) => {
        const isSameCurrency =
          row.accountCurrency.split(" - ")[1]?.trim().toUpperCase() ===
          row.counterCurrency.split(" - ")[1]?.trim().toUpperCase();
        if (isSameCurrency) return "N/A";
        return row.accountCurrencyAmount > 0
          ? formatCurrencyByCommaSeparation(
            row.accountCurrencyAmount,
            commaSeparation,
            row?.accountCurrency?.split(" - ")[0],
          )
          : "";
      },
    },
  ];

  const tdsMappingColumns: StandardTableColumn[] = [
    { id: "contactName", label: "Contact Name" },
    {
      id: "amount",
      label: "Amount",
      align: "right",
      render: (row: { amount: string }) =>
        formatCurrencyByCommaSeparation(
          Number(row.amount) || 0,
          commaSeparation,
          currency,
        ),
    },
  ];

  const rows = advJournalData?.data.journalAccounts || [];

  function convertDateString(input: string): string {
    const date = new Date(input);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const totalDebit = rows.reduce(
    (sum, row) => sum + (Number(row.debit) || 0),
    0,
  );
  const totalCredit = rows.reduce(
    (sum, row) => sum + (Number(row.credit) || 0),
    0,
  );

  if (isFetchingJournalData || !advJournalData) {
    return <ViewSkeleton />;
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: 3,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header: Date, Credit, Debit share space equally; Description gets most space and grows when long */}
      <Box
        display="grid"
        gridTemplateColumns="1fr 1fr 1fr 1fr minmax(0, 2fr)"
        gap={2}
        mb={3}
        alignItems="center"
        sx={{ minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Date
          </Typography>
          <Typography fontWeight={600} noWrap>
            {convertDateString(advJournalData?.data.date!)}
          </Typography>
        </Box>

        {totalCredit === totalDebit ?
          <>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Total Amount
              </Typography>
              <Typography fontWeight={600} noWrap>
                {formatCurrencyByCommaSeparation(
                  totalCredit.toString()!,
                  commaSeparation,
                  currency,
                )}
              </Typography>
            </Box>
            {transactionType === "journal" &&
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Journal Currency
                </Typography>
                <Typography fontWeight={600} noWrap>
                  {journalCurrency}
                </Typography>
              </Box>
            }
          </>
          :
          <>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Total Credit
              </Typography>
              <Typography fontWeight={600} noWrap>
                {formatCurrencyByCommaSeparation(
                  totalCredit.toString()!,
                  commaSeparation,
                  currency,
                )}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Total Debit
              </Typography>
              <Typography fontWeight={600} noWrap>
                {formatCurrencyByCommaSeparation(
                  totalDebit.toString()!,
                  commaSeparation,
                  currency,
                )}
              </Typography>
            </Box>
            {transactionType === "journal" &&
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Journal Currency
                </Typography>
                <Typography fontWeight={600} noWrap>
                  {journalCurrency}
                </Typography>
              </Box>
            }
          </>
        }

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Description
          </Typography>
          <Typography
            fontWeight={500}
            sx={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {advJournalData?.data?.description === "" ? "No description" : advJournalData?.data?.description}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Section title */}

      {/* Journal accounts table */}
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <StandardTable
          columns={columns}
          rows={rows}
          sticky={false}
          sx={{
            minWidth: 900,
            width: "100%",
            "& .MuiTableBody-root .MuiTableCell-root": {
              py: 0.3,
            }
          }}
        />
      </Box>

      {/* TDS Contact Mapping table */}
      {tdsMappingRows.length > 0 && (
        <>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>
            TDS Contact Mapping
          </Typography>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <StandardTable
              columns={tdsMappingColumns}
              rows={tdsMappingRows}
              sticky={false}
              sx={{
                minWidth: 320,
                width: "100%",
                "& .MuiTableBody-root .MuiTableCell-root": {
                  py: 0.3,
                },
              }}
            />
          </Box>
        </>
      )}

      <Divider />
    </Box>
  );
}

export default ViewAdvanceJournal;
